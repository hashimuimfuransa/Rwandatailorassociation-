import "server-only";
import { headers } from "next/headers";
import { prisma, type TxClient } from "@/lib/db/prisma";
import { logger, serialiseError } from "@/lib/logger";
import type { AuthContext } from "@/lib/auth/session";
import type { AuditSeverity, UserRole } from "@/lib/generated/prisma/enums";

/**
 * Audit trail.
 *
 * The rule this enforces: no consequential action happens without a row here
 * naming who did it, to what, and what changed. For financial mutations the
 * audit write goes inside the same database transaction as the ledger write —
 * pass `tx`. If the transaction rolls back, so does its audit entry, and the
 * two can never disagree about what happened.
 *
 * Non-financial actions (logins, exports, views of sensitive data) may be
 * logged outside a transaction, where a failure to audit must not fail the
 * user's request.
 */

/**
 * Canonical action verbs. Strings rather than a database enum so that adding
 * an action does not require a migration, but centralised here so they stay
 * consistent and greppable.
 */
export const AUDIT_ACTIONS = {
  // Authentication
  USER_LOGGED_IN: "USER_LOGGED_IN",
  USER_LOGIN_FAILED: "USER_LOGIN_FAILED",
  USER_LOGGED_OUT: "USER_LOGGED_OUT",
  USER_LOCKED_OUT: "USER_LOCKED_OUT",
  USER_PASSWORD_CHANGED: "USER_PASSWORD_CHANGED",
  USER_PASSWORD_RESET_REQUESTED: "USER_PASSWORD_RESET_REQUESTED",
  USER_PASSWORD_RESET_COMPLETED: "USER_PASSWORD_RESET_COMPLETED",
  USER_EMAIL_VERIFIED: "USER_EMAIL_VERIFIED",
  USER_PHONE_VERIFIED: "USER_PHONE_VERIFIED",
  USER_SESSIONS_REVOKED: "USER_SESSIONS_REVOKED",

  // Members
  MEMBER_REGISTERED: "MEMBER_REGISTERED",
  MEMBER_APPROVED: "MEMBER_APPROVED",
  MEMBER_REJECTED: "MEMBER_REJECTED",
  MEMBER_UPDATED: "MEMBER_UPDATED",
  MEMBER_SUSPENDED: "MEMBER_SUSPENDED",
  MEMBER_REACTIVATED: "MEMBER_REACTIVATED",
  MEMBER_KYC_VERIFIED: "MEMBER_KYC_VERIFIED",

  // Savings ledger
  SAVINGS_DEPOSIT_POSTED: "SAVINGS_DEPOSIT_POSTED",
  SAVINGS_WITHDRAWAL_POSTED: "SAVINGS_WITHDRAWAL_POSTED",
  SAVINGS_TRANSACTION_REVERSED: "SAVINGS_TRANSACTION_REVERSED",
  BALANCE_ADJUSTED: "BALANCE_ADJUSTED",

  // Withdrawals
  WITHDRAWAL_REQUESTED: "WITHDRAWAL_REQUESTED",
  WITHDRAWAL_APPROVED: "WITHDRAWAL_APPROVED",
  WITHDRAWAL_REJECTED: "WITHDRAWAL_REJECTED",
  WITHDRAWAL_PROCESSED: "WITHDRAWAL_PROCESSED",

  // Payments
  PAYMENT_RECEIVED: "PAYMENT_RECEIVED",
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
  PAYMENT_PROCESSED: "PAYMENT_PROCESSED",
  PAYMENT_RECONCILED: "PAYMENT_RECONCILED",
  PAYMENT_MATCHED_MANUALLY: "PAYMENT_MATCHED_MANUALLY",
  PAYMENT_DUPLICATE_REJECTED: "PAYMENT_DUPLICATE_REJECTED",
  PAYMENT_FLAGGED_SUSPICIOUS: "PAYMENT_FLAGGED_SUSPICIOUS",
  PAYMENT_RETRIED: "PAYMENT_RETRIED",
  /// An administrator discarded an unattributable payment from the queue. The
  /// deleted record is captured in full on the audit entry, because the row it
  /// describes no longer exists anywhere else.
  PAYMENT_DELETED: "PAYMENT_DELETED",

  // Loans
  LOAN_APPLICATION_SUBMITTED: "LOAN_APPLICATION_SUBMITTED",
  LOAN_APPLICATION_REVIEWED: "LOAN_APPLICATION_REVIEWED",
  LOAN_INFO_REQUESTED: "LOAN_INFO_REQUESTED",
  ADMIN_APPROVED_LOAN: "ADMIN_APPROVED_LOAN",
  ADMIN_REJECTED_LOAN: "ADMIN_REJECTED_LOAN",
  LOAN_DISBURSED: "LOAN_DISBURSED",
  LOAN_REPAYMENT_POSTED: "LOAN_REPAYMENT_POSTED",
  LOAN_RESTRUCTURED: "LOAN_RESTRUCTURED",
  LOAN_WRITTEN_OFF: "LOAN_WRITTEN_OFF",
  LOAN_PENALTY_WAIVED: "LOAN_PENALTY_WAIVED",
  LOAN_PRODUCT_UPDATED: "LOAN_PRODUCT_UPDATED",

  // Administration
  SUPER_ADMIN_CREATED_ADMIN: "SUPER_ADMIN_CREATED_ADMIN",
  ADMIN_UPDATED: "ADMIN_UPDATED",
  ADMIN_SUSPENDED: "ADMIN_SUSPENDED",
  PERMISSION_GRANTED: "PERMISSION_GRANTED",
  PERMISSION_REVOKED: "PERMISSION_REVOKED",
  ASSOCIATION_CREATED: "ASSOCIATION_CREATED",
  ASSOCIATION_UPDATED: "ASSOCIATION_UPDATED",
  ASSOCIATION_SUSPENDED: "ASSOCIATION_SUSPENDED",
  SETTING_CHANGED: "SETTING_CHANGED",

  // Access control
  ACCESS_DENIED: "ACCESS_DENIED",
  CROSS_TENANT_ACCESS_BLOCKED: "CROSS_TENANT_ACCESS_BLOCKED",

  // Data
  REPORT_EXPORTED: "REPORT_EXPORTED",
  STATEMENT_DOWNLOADED: "STATEMENT_DOWNLOADED",
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_VERIFIED: "DOCUMENT_VERIFIED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditEntry {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  associationId?: string | null;
  /// Prior state. Only include the fields that changed — dumping whole rows
  /// bloats the log and buries the signal.
  oldValue?: unknown;
  newValue?: unknown;
  /// Mandatory for financial adjustments; see `requireReason` below.
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  severity?: AuditSeverity;
}

interface Actor {
  id?: string | null;
  role?: UserRole | null;
  email?: string | null;
}

/** Actions that must never be recorded without a written justification. */
const REASON_REQUIRED: ReadonlySet<string> = new Set<string>([
  AUDIT_ACTIONS.BALANCE_ADJUSTED,
  AUDIT_ACTIONS.SAVINGS_TRANSACTION_REVERSED,
  AUDIT_ACTIONS.LOAN_WRITTEN_OFF,
  AUDIT_ACTIONS.LOAN_PENALTY_WAIVED,
  AUDIT_ACTIONS.WITHDRAWAL_REJECTED,
  AUDIT_ACTIONS.ADMIN_REJECTED_LOAN,
  AUDIT_ACTIONS.MEMBER_SUSPENDED,
  AUDIT_ACTIONS.PAYMENT_MATCHED_MANUALLY,
  AUDIT_ACTIONS.PAYMENT_DELETED,
]);

/** Actions serious enough to stand out when scanning the log. */
const CRITICAL_ACTIONS: ReadonlySet<string> = new Set<string>([
  AUDIT_ACTIONS.BALANCE_ADJUSTED,
  AUDIT_ACTIONS.SAVINGS_TRANSACTION_REVERSED,
  AUDIT_ACTIONS.LOAN_WRITTEN_OFF,
  AUDIT_ACTIONS.SUPER_ADMIN_CREATED_ADMIN,
  AUDIT_ACTIONS.PERMISSION_GRANTED,
  AUDIT_ACTIONS.PERMISSION_REVOKED,
  AUDIT_ACTIONS.CROSS_TENANT_ACCESS_BLOCKED,
  AUDIT_ACTIONS.PAYMENT_DUPLICATE_REJECTED,
  AUDIT_ACTIONS.PAYMENT_DELETED,
  AUDIT_ACTIONS.ASSOCIATION_SUSPENDED,
]);

/** Best-effort capture of request context. Returns nulls outside a request. */
async function getRequestContext(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const headerList = await headers();
    // x-forwarded-for is a client-controllable header; behind a trusted proxy
    // the leftmost entry is the real client. It is recorded as an
    // investigative hint, never as an authorisation input.
    const forwarded = headerList.get("x-forwarded-for");
    const ipAddress =
      forwarded?.split(",")[0]?.trim() ??
      headerList.get("x-real-ip") ??
      null;

    return {
      ipAddress,
      userAgent: headerList.get("user-agent")?.slice(0, 500) ?? null,
    };
  } catch {
    // Called from the worker or a script — no request to read.
    return { ipAddress: null, userAgent: null };
  }
}

/**
 * Writes an audit entry.
 *
 * @param tx Pass the transaction client for financial actions so the audit row
 *           commits or rolls back together with the change it describes.
 */
export async function recordAudit(
  entry: AuditEntry,
  actor: Actor | AuthContext | null,
  tx?: TxClient
): Promise<void> {
  const resolvedActor: Actor = isAuthContext(actor)
    ? {
        id: actor.user.id,
        role: actor.user.role,
        email: actor.user.email,
      }
    : (actor ?? {});

  if (REASON_REQUIRED.has(entry.action) && !entry.reason?.trim()) {
    // A hard failure, not a warning. An adjustment with no stated reason is
    // exactly the silent balance change this system forbids, and letting it
    // through unaudited would defeat the control.
    throw new Error(
      `Audit action ${entry.action} requires a reason — refusing to record it without one`
    );
  }

  const severity: AuditSeverity =
    entry.severity ?? (CRITICAL_ACTIONS.has(entry.action) ? "CRITICAL" : "INFO");

  const { ipAddress, userAgent } = await getRequestContext();

  const client = tx ?? prisma;

  const data = {
    associationId: entry.associationId ?? null,
    actorId: resolvedActor.id ?? null,
    actorRole: resolvedActor.role ?? null,
    actorEmail: resolvedActor.email ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    oldValue: toJson(entry.oldValue),
    newValue: toJson(entry.newValue),
    reason: entry.reason ?? null,
    metadata: toJson(entry.metadata),
    severity,
    ipAddress,
    userAgent,
  };

  if (tx) {
    // Inside a transaction the audit row is part of the atomic unit. If it
    // cannot be written, the whole operation must fail.
    await client.auditLog.create({ data });
    return;
  }

  try {
    await client.auditLog.create({ data });
  } catch (error) {
    // Outside a transaction, never let an audit failure break the user's
    // request — but make the gap loudly visible in the application log.
    logger.error(
      { action: entry.action, entityType: entry.entityType, ...serialiseError(error) },
      "AUDIT WRITE FAILED"
    );
  }
}

/** Serialises Decimals and Dates into something JSON columns accept. */
function toJson(value: unknown): object | undefined {
  if (value === undefined || value === null) return undefined;

  return JSON.parse(
    JSON.stringify(value, (_key, v) => {
      if (typeof v === "bigint") return v.toString();
      if (v && typeof v === "object" && "toFixed" in v && typeof v.toFixed === "function") {
        return (v as { toFixed(dp: number): string }).toFixed(2);
      }
      return v;
    })
  );
}

/**
 * Produces a compact before/after diff of the fields that actually changed.
 * Keeps audit rows readable and avoids storing unchanged PII.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
  fields: (keyof T)[]
): { oldValue: Partial<T>; newValue: Partial<T> } {
  const oldValue: Partial<T> = {};
  const newValue: Partial<T> = {};

  for (const field of fields) {
    if (!(field in after)) continue;
    const previous = before[field];
    const next = after[field];
    if (String(previous) === String(next)) continue;

    oldValue[field] = previous;
    newValue[field] = next as T[keyof T];
  }

  return { oldValue, newValue };
}

function isAuthContext(value: unknown): value is AuthContext {
  return Boolean(
    value && typeof value === "object" && "user" in value && "permissions" in value
  );
}
