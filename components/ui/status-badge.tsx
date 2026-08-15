import { cn } from "@/lib/utils";

/**
 * Status pill with a consistent colour language across the whole platform.
 *
 * The mapping is centralised so that "OVERDUE" is the same red everywhere it
 * appears — in a member's loan list, an admin's portfolio table and a report.
 * Inconsistent status colours are how people misread a financial screen.
 *
 * Colour is never the only signal: the label is always spelled out, which is
 * what carries the meaning for colour-blind users and in printed statements.
 */

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "pending";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "border-ink/12 bg-ink/[0.04] text-ink-muted",
  info: "border-primary/25 bg-primary-50 text-primary-hover",
  success: "border-success/30 bg-success/10 text-emerald-700",
  warning: "border-gold/40 bg-gold/10 text-amber-800",
  danger: "border-red-300 bg-red-50 text-red-700",
  pending: "border-slate-300 bg-slate-100 text-slate-600",
};

/**
 * Every status value the system can display, mapped to a tone and a
 * human-readable label. Unknown values fall back to neutral with the raw
 * value shown, so a new enum member degrades visibly rather than silently.
 */
const STATUS_MAP: Record<string, { tone: StatusTone; label: string }> = {
  // Generic lifecycle
  ACTIVE: { tone: "success", label: "Active" },
  INACTIVE: { tone: "neutral", label: "Inactive" },
  PENDING: { tone: "pending", label: "Pending" },
  PENDING_APPROVAL: { tone: "pending", label: "Pending approval" },
  PENDING_VERIFICATION: { tone: "pending", label: "Pending verification" },
  SUSPENDED: { tone: "danger", label: "Suspended" },
  DISABLED: { tone: "danger", label: "Disabled" },
  LOCKED: { tone: "danger", label: "Locked" },
  EXITED: { tone: "neutral", label: "Exited" },
  REJECTED: { tone: "danger", label: "Rejected" },
  CANCELLED: { tone: "neutral", label: "Cancelled" },
  ARCHIVED: { tone: "neutral", label: "Archived" },

  // KYC
  UNVERIFIED: { tone: "warning", label: "Unverified" },
  VERIFIED: { tone: "success", label: "Verified" },

  // Transactions
  COMPLETED: { tone: "success", label: "Completed" },
  FAILED: { tone: "danger", label: "Failed" },
  REVERSED: { tone: "warning", label: "Reversed" },

  // Transaction types
  DEPOSIT: { tone: "success", label: "Deposit" },
  WITHDRAWAL: { tone: "warning", label: "Withdrawal" },
  LOAN_DISBURSEMENT: { tone: "info", label: "Loan disbursement" },
  LOAN_REPAYMENT: { tone: "info", label: "Loan repayment" },
  PENALTY: { tone: "danger", label: "Penalty" },
  INTEREST: { tone: "success", label: "Interest" },
  FEE: { tone: "warning", label: "Fee" },
  ADJUSTMENT: { tone: "warning", label: "Adjustment" },
  REVERSAL: { tone: "warning", label: "Reversal" },
  OTHER: { tone: "neutral", label: "Other" },

  // Payments
  RECEIVED: { tone: "info", label: "Received" },
  UNMATCHED: { tone: "warning", label: "Unmatched" },
  MATCHED: { tone: "info", label: "Matched" },
  PROCESSED: { tone: "success", label: "Processed" },
  DUPLICATE: { tone: "neutral", label: "Duplicate" },

  // Withdrawals
  UNDER_REVIEW: { tone: "info", label: "Under review" },
  APPROVED: { tone: "success", label: "Approved" },
  PROCESSING: { tone: "info", label: "Processing" },

  // Loan applications
  DRAFT: { tone: "neutral", label: "Draft" },
  SUBMITTED: { tone: "info", label: "Submitted" },
  MORE_INFORMATION_REQUIRED: { tone: "warning", label: "More info needed" },

  // Loans
  PENDING_DISBURSEMENT: { tone: "pending", label: "Awaiting disbursement" },
  DISBURSED: { tone: "info", label: "Disbursed" },
  OVERDUE: { tone: "danger", label: "Overdue" },
  DEFAULTED: { tone: "danger", label: "Defaulted" },
  WRITTEN_OFF: { tone: "neutral", label: "Written off" },
  RESTRUCTURED: { tone: "info", label: "Restructured" },

  // Instalments
  UPCOMING: { tone: "neutral", label: "Upcoming" },
  DUE: { tone: "warning", label: "Due" },
  PARTIALLY_PAID: { tone: "info", label: "Partially paid" },
  PAID: { tone: "success", label: "Paid" },
  WAIVED: { tone: "neutral", label: "Waived" },

  // Jobs
  RUNNING: { tone: "info", label: "Running" },
  SUCCESS: { tone: "success", label: "Success" },
  PARTIAL: { tone: "warning", label: "Partial" },
  SKIPPED: { tone: "neutral", label: "Skipped" },

  // Roles
  MEMBER: { tone: "neutral", label: "Member" },
  ADMIN: { tone: "info", label: "Admin" },
  SUPER_ADMIN: { tone: "warning", label: "Super admin" },
};

/** Formats an unmapped enum value into something readable. */
function humanise(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function statusTone(status: string): StatusTone {
  return STATUS_MAP[status]?.tone ?? "neutral";
}

export function statusLabel(status: string): string {
  return STATUS_MAP[status]?.label ?? humanise(status);
}

export function StatusBadge({
  status,
  tone,
  label,
  size = "default",
  className,
}: {
  status: string;
  /// Override the mapped tone, e.g. to flag a technically-active loan as at risk.
  tone?: StatusTone;
  label?: string;
  size?: "default" | "sm";
  className?: string;
}) {
  const resolvedTone = tone ?? statusTone(status);
  const resolvedLabel = label ?? statusLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        TONE_CLASSES[resolvedTone],
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          resolvedTone === "success" && "bg-success",
          resolvedTone === "danger" && "bg-red-500",
          resolvedTone === "warning" && "bg-gold",
          resolvedTone === "info" && "bg-primary",
          resolvedTone === "pending" && "bg-slate-400",
          resolvedTone === "neutral" && "bg-ink-muted"
        )}
      />
      {resolvedLabel}
    </span>
  );
}
