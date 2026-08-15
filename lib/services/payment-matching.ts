import "server-only";
import { prisma, Prisma } from "@/lib/db/prisma";
import { paymentLogger } from "@/lib/logger";
import { phoneMatchKey } from "@/lib/phone";
import type { MatchStrategy } from "@/lib/generated/prisma/enums";
import type { ProviderTransaction } from "@/lib/jenga/types";

/**
 * MEMBER IDENTIFICATION FOR INBOUND PAYMENTS.
 *
 * The rule this module exists to enforce: money is credited to a member only
 * when the system can say WHY it belongs to them, with a named piece of
 * evidence. Everything else waits for a human.
 *
 * AMOUNT is deliberately absent, and its absence is the point: two members
 * paying the same monthly contribution are indistinguishable by amount, and it
 * is the most common value in the data. Matching on it is a coin flip dressed
 * up as a decision.
 *
 * PAYER NAME is present, but only as a SUGGESTION. Bank statements and cash
 * deposits frequently carry no reference at all — the payer simply did not
 * quote one — and the sender's name is then the only lead there is. So the
 * name strategies run last and are scored deliberately BELOW the auto-credit
 * threshold: they can never move money on their own. What they do is put a
 * named candidate in front of the administrator in the review queue, instead
 * of an anonymous "unmatched" row they must research by hand.
 *
 * This is the reason the scoring is not a matter of taste. "J. Uwimana"
 * matches several members in any association of size, and a payer types
 * whatever they like; crediting on a name alone is how one member's savings
 * end up in another's account. Suggesting on a name costs nothing and is
 * reviewed by a human before it binds.
 *
 * Strategies are tried strongest first and stop at the first confident hit.
 * Where a strategy finds MORE THAN ONE candidate the result is AMBIGUOUS with
 * zero confidence — never "pick the first". An ambiguous payment is safer in
 * the unmatched queue than in the wrong account.
 */

export interface MatchCandidate {
  memberId: string;
  memberNumber: string;
  fullName: string;
  savingsAccountId: string | null;
}

export interface MatchResult {
  strategy: MatchStrategy;
  /// 0–100. Compared against PAYMENT_AUTO_MATCH_MIN_CONFIDENCE.
  confidence: number;
  member: MatchCandidate | null;
  /// Populated when several members matched — the admin picks between them.
  candidates: MatchCandidate[];
  /// Human-readable justification, stored on the reconciliation record.
  evidence: string;
}

/**
 * Confidence by strategy.
 *
 * Calibrated against the default threshold of 90:
 *   • A payment reference, a bank account or a registered mobile money number
 *     is specific enough to credit automatically.
 *   • A bare phone number scores 88 and therefore lands in the review queue.
 *     Phone numbers get recycled by networks and shared within families, and
 *     the payer's number is not always the member's.
 *   • Both name scores sit far below the threshold ON PURPOSE. Raising either
 *     above it would let a statement narration move money into an account
 *     chosen by string similarity, which is precisely what the review queue
 *     exists to prevent. They are ranked relative to each other only so the
 *     stronger suggestion sorts first for the administrator.
 */
const CONFIDENCE = {
  MEMBER_PAYMENT_REFERENCE: 100,
  EXTERNAL_CUSTOMER_REFERENCE: 96,
  BANK_ACCOUNT: 95,
  MOBILE_MONEY_ACCOUNT: 92,
  PHONE_NUMBER: 88,
  /// Every name token matches one member exactly, and only one member.
  PAYER_NAME_EXACT: 80,
  /// The member's full name appears within a longer payer string, e.g. the
  /// narration carried a middle name the register does not hold.
  PAYER_NAME_PARTIAL: 65,
} as const;

const NO_MATCH: MatchResult = {
  strategy: "NONE",
  confidence: 0,
  member: null,
  candidates: [],
  evidence: "No usable identifier found on the payment",
};

/**
 * Attempts to identify the member a payment belongs to.
 *
 * @param associationId Restricts the search to one tenant. A payment must
 *   never be matched against a member of a different association.
 */
export async function matchPaymentToMember(
  transaction: ProviderTransaction,
  associationId: string,
  associationCode: string
): Promise<MatchResult> {
  // 1 — Member payment reference ------------------------------------------
  // The strongest signal: issued by us, unique, and printed on every payment
  // instruction the member receives.
  const searchText = [transaction.narration, transaction.transactionReference]
    .filter(Boolean)
    .join(" ");

  const references = extractPaymentReferences(searchText, associationCode);

  for (const reference of references) {
    const member = await findByPaymentReference(reference, associationId);
    if (member) {
      return {
        strategy: "MEMBER_PAYMENT_REFERENCE",
        confidence: CONFIDENCE.MEMBER_PAYMENT_REFERENCE,
        member,
        candidates: [member],
        evidence: `Payment reference "${reference}" found in the narration`,
      };
    }
  }

  // 2 — Membership number quoted instead of the payment reference ----------
  // Members frequently quote their membership number, which is close enough
  // in form to be worth a second look and is equally unique.
  const memberNumbers = extractMemberNumbers(searchText, associationCode);

  for (const memberNumber of memberNumbers) {
    const member = await findByMemberNumber(memberNumber, associationId);
    if (member) {
      return {
        strategy: "EXTERNAL_CUSTOMER_REFERENCE",
        confidence: CONFIDENCE.EXTERNAL_CUSTOMER_REFERENCE,
        member,
        candidates: [member],
        evidence: `Membership number "${memberNumber}" found in the narration`,
      };
    }
  }

  // 3 — Bank account -------------------------------------------------------
  if (transaction.payerAccount) {
    const matches = await findByBankAccount(transaction.payerAccount, associationId);

    if (matches.length === 1) {
      return {
        strategy: "BANK_ACCOUNT",
        confidence: CONFIDENCE.BANK_ACCOUNT,
        member: matches[0],
        candidates: matches,
        evidence: `Payer bank account ${transaction.payerAccount} is registered to this member`,
      };
    }
    if (matches.length > 1) {
      return ambiguous("BANK_ACCOUNT", matches, `bank account ${transaction.payerAccount}`);
    }
  }

  // 4 — Mobile money / phone ----------------------------------------------
  const phoneKey = phoneMatchKey(transaction.payerPhone ?? transaction.payerAccount);

  if (phoneKey) {
    const mobileMoneyMatches = await findByMobileMoney(phoneKey, associationId);

    if (mobileMoneyMatches.length === 1) {
      return {
        strategy: "MOBILE_MONEY_ACCOUNT",
        confidence: CONFIDENCE.MOBILE_MONEY_ACCOUNT,
        member: mobileMoneyMatches[0],
        candidates: mobileMoneyMatches,
        evidence: `Payer mobile money number matches this member's registered number`,
      };
    }
    if (mobileMoneyMatches.length > 1) {
      return ambiguous("MOBILE_MONEY_ACCOUNT", mobileMoneyMatches, "mobile money number");
    }

    const phoneMatches = await findByPhone(phoneKey, associationId);

    if (phoneMatches.length === 1) {
      return {
        strategy: "PHONE_NUMBER",
        // Below the auto-credit threshold by design — see CONFIDENCE above.
        confidence: CONFIDENCE.PHONE_NUMBER,
        member: phoneMatches[0],
        candidates: phoneMatches,
        evidence:
          "Payer phone number matches this member's account phone, but no payment reference was quoted",
      };
    }
    if (phoneMatches.length > 1) {
      return ambiguous("PHONE_NUMBER", phoneMatches, "phone number");
    }
  }

  // 5 — Payer name --------------------------------------------------------
  // Last resort, and never decisive. Scored below the auto-credit threshold so
  // the outcome is always a named suggestion in the review queue rather than a
  // ledger entry. See the note at the top of this file.
  //
  // The name is taken from the provider's payer field where there is one, and
  // otherwise from the narration — which is where a PDF statement import puts
  // it, since a bank statement line has no structured payer field.
  const payerName = transaction.payerName ?? transaction.narration;
  const nameMatch = await matchByPayerName(payerName, associationId);
  if (nameMatch) return nameMatch;

  paymentLogger.info(
    {
      externalTransactionId: transaction.externalTransactionId,
      hasNarration: Boolean(transaction.narration),
      hasPhone: Boolean(transaction.payerPhone),
      hasPayerName: Boolean(transaction.payerName),
    },
    "payment could not be matched to a member"
  );

  return NO_MATCH;
}

/**
 * Suggests a member from the payer's name.
 *
 * Returns null rather than NO_MATCH when nothing usable is found, so the
 * caller can fall through to its own logging.
 */
async function matchByPayerName(
  payerName: string | null,
  associationId: string
): Promise<MatchResult | null> {
  const tokens = nameTokens(payerName);

  // One token is not a person. "JOHN" or "UWIMANA" alone will match several
  // members in any association of size, and suggesting the wrong one wastes
  // more of an administrator's time than suggesting nobody.
  if (tokens.length < 2) return null;

  const { exact, partial } = await findByName(tokens, associationId);

  if (exact.length === 1) {
    return {
      strategy: "PAYER_NAME",
      confidence: CONFIDENCE.PAYER_NAME_EXACT,
      member: exact[0],
      candidates: exact,
      evidence:
        `Sender name "${tokens.join(" ")}" matches this member exactly. ` +
        `No reference was quoted, so this is a suggestion for review — not proof.`,
    };
  }

  if (exact.length > 1) {
    return ambiguous("PAYER_NAME", exact, `name "${tokens.join(" ")}"`);
  }

  if (partial.length === 1) {
    return {
      strategy: "PAYER_NAME",
      confidence: CONFIDENCE.PAYER_NAME_PARTIAL,
      member: partial[0],
      candidates: partial,
      evidence:
        `The sender name "${tokens.join(" ")}" corresponds to ${partial[0].fullName}. ` +
        `Banks truncate this field, so it may be cut short. No reference was ` +
        `quoted — this is a suggestion for review, not proof.`,
    };
  }

  if (partial.length > 1) {
    return ambiguous("PAYER_NAME", partial, `name "${tokens.join(" ")}"`);
  }

  return null;
}

function ambiguous(
  strategy: MatchStrategy,
  candidates: MatchCandidate[],
  identifier: string
): MatchResult {
  paymentLogger.warn(
    { strategy, candidateCount: candidates.length },
    "ambiguous payment match — routed for manual review"
  );

  return {
    strategy,
    // Zero, not "best guess". Several members share this identifier, so there
    // is no evidence favouring any one of them.
    confidence: 0,
    member: null,
    candidates,
    evidence: `${candidates.length} members share this ${identifier} — manual review required`,
  };
}

// Extraction ------------------------------------------------------------------

/**
 * Pulls candidate payment references out of free text.
 *
 * Payers are inconsistent: "RTA-000123", "RTA 000123", "rta000123" and
 * "Ref:RTA-000123" all appear in real narrations. Separators are normalised
 * away and the canonical form rebuilt, rather than demanding people type it
 * exactly.
 */
export function extractPaymentReferences(
  text: string | null,
  associationCode: string
): string[] {
  if (!text) return [];

  const code = associationCode.toUpperCase();
  const upper = text.toUpperCase();
  const found = new Set<string>();

  // CODE, then optional separators, then digits.
  const pattern = new RegExp(`${code}[\\s\\-_/.]*([0-9]{3,10})`, "g");

  for (const match of upper.matchAll(pattern)) {
    const digits = match[1];
    // Canonical form is 6 digits, zero-padded. Longer runs are taken as-is so
    // an over-long number is not silently truncated into a valid reference.
    found.add(`${code}-${digits.length <= 6 ? digits.padStart(6, "0") : digits}`);
  }

  return [...found];
}

/** Membership numbers take the form RTA-M000123. */
export function extractMemberNumbers(
  text: string | null,
  associationCode: string
): string[] {
  if (!text) return [];

  const code = associationCode.toUpperCase();
  const upper = text.toUpperCase();
  const found = new Set<string>();

  const pattern = new RegExp(`${code}[\\s\\-_/.]*M[\\s\\-_/.]*([0-9]{3,10})`, "g");

  for (const match of upper.matchAll(pattern)) {
    const digits = match[1];
    found.add(`${code}-M${digits.length <= 6 ? digits.padStart(6, "0") : digits}`);
  }

  return [...found];
}

/**
 * Normalises a name into comparable tokens.
 *
 * Accents are folded (NFD + mark stripping) because a bank writes "NDAYISABÉ"
 * and the register holds "Ndayisabe"; punctuation and initials are dropped.
 * Order is NOT preserved by the comparison below — Rwandan names are commonly
 * written surname-first on a bank statement and given-name-first in a member
 * register, and treating those as different people would defeat the purpose.
 */
export function nameTokens(value: string | null): string[] {
  if (!value) return [];

  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

// Lookups ---------------------------------------------------------------------
// Every query is scoped by associationId. Tenant isolation is not optional
// here: a reference collision across associations must not cross the boundary.

// `satisfies` rather than `as const`: the latter makes every property
// readonly, and Prisma's generated input types are mutable, so an `as const`
// select is rejected outright.
const MEMBER_SELECT = {
  id: true,
  memberNumber: true,
  user: { select: { firstName: true, lastName: true } },
  savingsAccounts: {
    where: { isActive: true },
    orderBy: { openedAt: "asc" },
    take: 1,
    select: { id: true },
  },
} satisfies Prisma.MemberSelect;

type MemberRow = {
  id: string;
  memberNumber: string;
  user: { firstName: string; lastName: string };
  savingsAccounts: { id: string }[];
};

function toCandidate(member: MemberRow): MatchCandidate {
  return {
    memberId: member.id,
    memberNumber: member.memberNumber,
    fullName: `${member.user.firstName} ${member.user.lastName}`.trim(),
    savingsAccountId: member.savingsAccounts[0]?.id ?? null,
  };
}

/** Members who may receive money. A suspended member's payment is held. */
const CREDITABLE_STATUS = { status: "ACTIVE" } satisfies Prisma.MemberWhereInput;

async function findByPaymentReference(
  reference: string,
  associationId: string
): Promise<MatchCandidate | null> {
  const member = await prisma.member.findFirst({
    where: { associationId, paymentReference: reference, ...CREDITABLE_STATUS },
    select: MEMBER_SELECT,
  });
  return member ? toCandidate(member) : null;
}

async function findByMemberNumber(
  memberNumber: string,
  associationId: string
): Promise<MatchCandidate | null> {
  const member = await prisma.member.findFirst({
    where: { associationId, memberNumber, ...CREDITABLE_STATUS },
    select: MEMBER_SELECT,
  });
  return member ? toCandidate(member) : null;
}

async function findByBankAccount(
  accountNumber: string,
  associationId: string
): Promise<MatchCandidate[]> {
  const cleaned = accountNumber.replace(/\s/g, "");
  if (cleaned.length < 6) return [];

  const members = await prisma.member.findMany({
    where: { associationId, bankAccountNumber: cleaned, ...CREDITABLE_STATUS },
    select: MEMBER_SELECT,
    take: 5,
  });
  return members.map(toCandidate);
}

async function findByMobileMoney(
  phoneKey: string,
  associationId: string
): Promise<MatchCandidate[]> {
  // Stored numbers may carry a country code or not; comparing the last nine
  // digits makes the lookup format-independent.
  const members = await prisma.member.findMany({
    where: {
      associationId,
      mobileMoneyNumber: { endsWith: phoneKey },
      ...CREDITABLE_STATUS,
    },
    select: MEMBER_SELECT,
    take: 5,
  });
  return members.map(toCandidate);
}

async function findByPhone(
  phoneKey: string,
  associationId: string
): Promise<MatchCandidate[]> {
  const members = await prisma.member.findMany({
    where: {
      associationId,
      user: { phone: { endsWith: phoneKey } },
      ...CREDITABLE_STATUS,
    },
    select: MEMBER_SELECT,
    take: 5,
  });
  return members.map(toCandidate);
}

/**
 * Shortest prefix accepted as evidence of a truncated name.
 *
 * Four characters, and never on its own — see `coversMemberToken`.
 */
const MIN_PREFIX = 4;

/**
 * Whether a payer token accounts for one of the member's name tokens.
 *
 * BANKS TRUNCATE. Bank of Kigali cuts the counterparty to sixteen characters,
 * so a transfer from Abdallah Nzabandora reaches the statement as
 * "ABDALLAH NZABAND" — the surname severed mid-word. Demanding an exact token
 * match rejects that member outright, which is the wrong answer: the payment
 * plainly came from them, and it ends up in the unmatched queue with no
 * suggestion at all.
 *
 * A prefix in either direction is therefore accepted. The guard against that
 * being too loose is not the length alone — "JEAN" is a legitimate four-letter
 * prefix of "JEANNETTE" — but the requirement in `classify` that at least one
 * other token match EXACTLY. One fuzzy token can never carry a match by itself.
 */
function coversMemberToken(memberToken: string, payerTokens: Set<string>): "exact" | "prefix" | null {
  if (payerTokens.has(memberToken)) return "exact";

  for (const payerToken of payerTokens) {
    const shorter = payerToken.length <= memberToken.length ? payerToken : memberToken;
    const longer = payerToken.length <= memberToken.length ? memberToken : payerToken;

    if (shorter.length >= MIN_PREFIX && longer.startsWith(shorter)) return "prefix";
  }

  return null;
}

/**
 * How well a member's name corresponds to the name on a payment.
 *
 *   "exact"   — the same words, in any order, none of them approximate.
 *   "partial" — every word accounted for, but something was truncated or the
 *               payer string carried an extra name.
 *   null      — not the same person, as far as this can tell.
 *
 * Exported for testing: the rule that stops a pair of loose prefixes putting
 * one member's money in another's account is worth a test of its own.
 */
export function compareNames(
  memberFullName: string,
  payerTokens: string[]
): "exact" | "partial" | null {
  const memberSet = new Set(nameTokens(memberFullName));
  const payerSet = new Set(payerTokens);

  if (memberSet.size === 0 || payerSet.size === 0) return null;

  let exactTokens = 0;
  let prefixTokens = 0;

  for (const token of memberSet) {
    const how = coversMemberToken(token, payerSet);
    if (how === "exact") exactTokens++;
    else if (how === "prefix") prefixTokens++;
    else return null; // a part of the member's name is unaccounted for
  }

  // At least one word must match outright. Without this, two approximate
  // prefixes could introduce complete strangers to one another.
  if (exactTokens === 0) return null;

  return prefixTokens === 0 && memberSet.size === payerSet.size ? "exact" : "partial";
}

/**
 * Finds members whose name matches the payer's.
 *
 * Narrowed in the database first, so this never loads the whole register to
 * compare strings. The narrowing has to allow for truncation too: an equality
 * filter alone would not retrieve Nzabandora when the statement says NZABAND,
 * so each token is also tried as a prefix.
 *
 * `exact` means the two names are the same set of tokens, in any order.
 * `partial` covers the truncated and middle-name cases. Anything weaker is not
 * returned at all: a single shared token is not evidence.
 */
async function findByName(
  tokens: string[],
  associationId: string
): Promise<{ exact: MatchCandidate[]; partial: MatchCandidate[] }> {
  const nameFilters: Prisma.UserWhereInput[] = [
    { firstName: { in: tokens, mode: "insensitive" } },
    { lastName: { in: tokens, mode: "insensitive" } },
  ];

  // Truncated tokens: "NZABAND" must still retrieve "Nzabandora".
  for (const token of tokens) {
    if (token.length < MIN_PREFIX) continue;
    nameFilters.push({ firstName: { startsWith: token, mode: "insensitive" } });
    nameFilters.push({ lastName: { startsWith: token, mode: "insensitive" } });
  }

  const members = await prisma.member.findMany({
    where: {
      associationId,
      ...CREDITABLE_STATUS,
      user: { OR: nameFilters },
    },
    select: MEMBER_SELECT,
    // Bounded: beyond a handful of same-name candidates the result is
    // ambiguous anyway, and the admin has to choose regardless.
    take: 25,
  });

  const exact: MatchCandidate[] = [];
  const partial: MatchCandidate[] = [];

  for (const member of members) {
    const verdict = compareNames(
      `${member.user.firstName} ${member.user.lastName}`,
      tokens
    );

    if (verdict === "exact") exact.push(toCandidate(member));
    else if (verdict === "partial") partial.push(toCandidate(member));
  }

  return { exact, partial };
}
