/**
 * Rwandan phone number handling.
 *
 * Numbers are stored in E.164 (+250788123456) and never in the local form.
 * This matters well beyond tidiness: phone number is a payment-matching key,
 * and "0788123456", "250788123456" and "+250 788 123 456" are the same person.
 * If they are stored inconsistently, a payment lookup misses and the money
 * lands in the unmatched queue for no reason.
 *
 * Client-safe: imported by forms for inline validation.
 */

export const RWANDA_DIALLING_CODE = "250";

/** MTN and Airtel Rwanda mobile prefixes, after the country code. */
const RW_MOBILE_PREFIXES = ["78", "79", "72", "73"];

/**
 * Converts any common local format to E.164.
 * Returns null when the input cannot be interpreted as a Rwandan mobile.
 */
export function normalisePhone(input: string | null | undefined): string | null {
  if (!input) return null;

  // Strip everything that is not a digit or a leading plus.
  const cleaned = input.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return null;

  let digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;

  // 0788123456 → 788123456
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // 250788123456 → 788123456
  if (digits.startsWith(RWANDA_DIALLING_CODE) && digits.length > 9) {
    digits = digits.slice(RWANDA_DIALLING_CODE.length);
  }

  if (digits.length !== 9) return null;
  if (!RW_MOBILE_PREFIXES.some((prefix) => digits.startsWith(prefix))) return null;

  return `+${RWANDA_DIALLING_CODE}${digits}`;
}

export function isValidRwandanPhone(input: string | null | undefined): boolean {
  return normalisePhone(input) !== null;
}

/** Display form: +250 788 123 456 */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const normalised = normalisePhone(e164);
  if (!normalised) return e164;

  const national = normalised.slice(4); // strip "+250"
  return `+${RWANDA_DIALLING_CODE} ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

/** Local form: 0788123456 — what people expect to see on a statement. */
export function toLocalPhone(e164: string | null | undefined): string {
  const normalised = normalisePhone(e164);
  if (!normalised) return e164 ?? "";
  return `0${normalised.slice(4)}`;
}

/**
 * Comparison key for payment matching: the last 9 digits, stripped of all
 * formatting and country code. Lets a provider-reported "0788100001" match a
 * stored "+250788100001" without either side needing to know the other's
 * convention.
 */
export function phoneMatchKey(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return digits.slice(-9);
}
