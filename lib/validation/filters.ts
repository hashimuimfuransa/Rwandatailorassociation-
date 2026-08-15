import type {
  AssociationStatus,
  InstallmentStatus,
  LoanApplicationStatus,
  LoanStatus,
  MemberStatus,
  PaymentStatus,
  TransactionType,
  UserRole,
  UserStatus,
  WithdrawalStatus,
} from "@/lib/generated/prisma/enums";

/**
 * Query-string filter parsers.
 *
 * A value out of `searchParams` is attacker-controlled text. Handing it
 * straight to Prisma as an enum filter is how a crafted URL turns into a
 * database error — or worse, a filter that silently matches nothing and makes
 * an administrator believe a queue is empty. Each parser returns the value
 * only when it is a member of the enum, and `undefined` otherwise, which every
 * caller treats as "no filter".
 *
 * The sentinel "ALL" used by the filter forms falls through to `undefined`
 * here for free, since it is not a member of any enum.
 */

function parser<T extends string>(allowed: readonly T[]) {
  const set = new Set<string>(allowed);
  return (value: string | undefined | null): T | undefined =>
    value && set.has(value) ? (value as T) : undefined;
}

export const parseTransactionType = parser<TransactionType>([
  "DEPOSIT",
  "WITHDRAWAL",
  "LOAN_DISBURSEMENT",
  "LOAN_REPAYMENT",
  "PENALTY",
  "INTEREST",
  "FEE",
  "ADJUSTMENT",
  "REVERSAL",
  "OTHER",
]);

export const parsePaymentStatus = parser<PaymentStatus>([
  "RECEIVED",
  "PENDING",
  "VERIFIED",
  "UNMATCHED",
  "MATCHED",
  "PROCESSED",
  "FAILED",
  "DUPLICATE",
  "REJECTED",
]);

export const parseLoanStatus = parser<LoanStatus>([
  "PENDING_DISBURSEMENT",
  "DISBURSED",
  "ACTIVE",
  "OVERDUE",
  "DEFAULTED",
  "WRITTEN_OFF",
  "RESTRUCTURED",
  "COMPLETED",
  "CANCELLED",
]);

export const parseMemberStatus = parser<MemberStatus>([
  "PENDING_APPROVAL",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "EXITED",
  "REJECTED",
]);

export const parseAssociationStatus = parser<AssociationStatus>([
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "ARCHIVED",
]);

export const parseUserStatus = parser<UserStatus>([
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "DISABLED",
  "LOCKED",
]);

export const parseUserRole = parser<UserRole>(["MEMBER", "ADMIN", "SUPER_ADMIN"]);

export const parseWithdrawalStatus = parser<WithdrawalStatus>([
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
]);

export const parseLoanApplicationStatus = parser<LoanApplicationStatus>([
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "MORE_INFORMATION_REQUIRED",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const parseInstallmentStatus = parser<InstallmentStatus>([
  "UPCOMING",
  "DUE",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "WAIVED",
]);

/** Clamps a page query parameter to a sane positive integer. */
export function parsePage(value: string | undefined | null): number {
  const page = Number(value);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}
