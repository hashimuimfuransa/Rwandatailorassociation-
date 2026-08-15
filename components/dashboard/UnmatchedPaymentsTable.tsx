"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Link2, ShieldAlert, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";

/**
 * Unmatched payment queue with manual reconciliation.
 *
 * Two design decisions worth stating:
 *
 *  • The evidence the matcher already gathered is shown inline — the narration,
 *    the payer's number, the strategy it tried and why it stopped. An
 *    administrator resolving a payment should not have to reconstruct that from
 *    scratch, and showing it is what makes a fast decision a *correct* one.
 *
 *  • A payment that failed verification with the bank is rendered with its
 *    match action disabled. An admin decides WHO a payment belongs to; they
 *    cannot decide THAT it happened. The server enforces this too — this is
 *    the UI agreeing with the rule, not implementing it.
 *
 * Delete exists because a queue nobody can clear stops being read: some rows
 * are the association's own transfers or a misparsed statement line and will
 * never belong to a member. It is styled as the secondary, quieter action so
 * it is never the reflex — matching is what an administrator is here to do.
 */

interface Candidate {
  id: string;
  memberNumber: string;
  paymentReference: string;
  fullName: string;
}

interface UnmatchedPayment {
  id: string;
  externalTransactionId: string;
  transactionReference: string | null;
  amount: string;
  currency: string;
  status: string;
  providerStatus: string | null;
  payerName: string | null;
  payerPhone: string | null;
  payerAccount: string | null;
  narration: string | null;
  transactionDate: Date | string;
  matchStrategy: string;
  matchConfidence: number;
  isSuspicious: boolean;
  suspicionReason: string | null;
  failureReason: string | null;
  verified: boolean;
  lastAttempt: { outcome: string; notes: string | null; at: Date | string } | null;
  candidates: Candidate[];
}

interface MemberOption {
  id: string;
  label: string;
  paymentReference: string;
  phone: string | null;
}

export function UnmatchedPaymentsTable({
  payments,
  members,
  canMatch,
  canDelete,
  page,
  pageSize,
  total,
  totalPages,
}: {
  payments: UnmatchedPayment[];
  members: MemberOption[];
  canMatch: boolean;
  /// `payments.reconcile`. Separate from canMatch so the two can diverge.
  canDelete: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [active, setActive] = useState<UnmatchedPayment | null>(null);
  const [deleting, setDeleting] = useState<UnmatchedPayment | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Bulk selection. `bulkMode` distinguishes "the rows I ticked" from "every
  // queued payment", because the second cannot be expressed as a list of ids
  // from this page — it spans pages the browser has never loaded.
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<"SELECTED" | "ALL_QUEUED" | null>(null);

  const allOnPageChecked =
    payments.length > 0 && payments.every((payment) => checked.has(payment.id));

  function toggleRow(id: string) {
    setChecked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setChecked((previous) => {
      const next = new Set(previous);
      if (allOnPageChecked) {
        for (const payment of payments) next.delete(payment.id);
      } else {
        for (const payment of payments) next.add(payment.id);
      }
      return next;
    });
  }

  async function handleMatch(reason?: string) {
    if (!active || !selectedMember) {
      throw new Error("Select the member this payment belongs to");
    }

    const response = await fetch(`/api/admin/payments/${active.id}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: selectedMember, reason }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Could not credit this payment");
    }

    setSelectedMember("");
    router.refresh();
  }

  async function handleDelete(reason?: string) {
    if (!deleting) throw new Error("No payment selected");

    const response = await fetch(`/api/admin/payments/${deleting.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Could not delete this payment");
    }

    setChecked((previous) => {
      const next = new Set(previous);
      next.delete(deleting.id);
      return next;
    });
    setNotice(payload?.message ?? "Payment deleted.");
    router.refresh();
  }

  async function handleBulkDelete(reason?: string) {
    if (!bulkMode) throw new Error("Nothing selected");

    const response = await fetch("/api/admin/payments/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        bulkMode === "ALL_QUEUED"
          ? { scope: "ALL_QUEUED", reason }
          : { paymentIds: [...checked], reason }
      ),
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Could not delete these payments");
    }

    setChecked(new Set());
    setNotice(payload?.message ?? "Payments deleted.");
    router.refresh();
  }

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {notice && (
        <Alert variant="success" className="mb-4">
          {notice}
        </Alert>
      )}

      {canDelete && checked.size > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            <strong className="font-semibold">
              {checked.size} payment{checked.size === 1 ? "" : "s"} selected
            </strong>
            <span className="ml-2 text-ink-muted">
              on this page. Deleting removes them from the queue and keeps them
              only in the audit log.
            </span>
          </p>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setChecked(new Set())}>
              Clear selection
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:border-red-500 hover:text-red-700"
              onClick={() => {
                setError(null);
                setNotice(null);
                setBulkMode("SELECTED");
              }}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete selected
            </Button>
          </div>
        </div>
      )}

      {canDelete && total > 0 && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-dashed border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-ink-muted">
            Clearing out a bad import? You can empty the whole queue —{" "}
            <strong className="text-ink">
              all {total} unmatched payment{total === 1 ? "" : "s"}
            </strong>
            , including those on other pages.
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              setError(null);
              setNotice(null);
              setBulkMode("ALL_QUEUED");
            }}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete all {total}
          </Button>
        </div>
      )}

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              {canDelete && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allOnPageChecked}
                    onChange={toggleAllOnPage}
                    aria-label="Select every payment on this page"
                    className="size-4 cursor-pointer rounded border-border accent-primary"
                  />
                </TableHead>
              )}
              <TableHead>Received</TableHead>
              <TableHead>Narration / payer</TableHead>
              <TableHead align="right">Amount</TableHead>
              <TableHead>Why unmatched</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                {canDelete && (
                  <TableCell className="align-top">
                    <input
                      type="checkbox"
                      checked={checked.has(payment.id)}
                      onChange={() => toggleRow(payment.id)}
                      aria-label={`Select payment ${payment.externalTransactionId}`}
                      className="size-4 cursor-pointer rounded border-border accent-primary"
                    />
                  </TableCell>
                )}

                <TableCell className="whitespace-nowrap align-top text-sm text-ink-muted">
                  {new Date(payment.transactionDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <span className="mt-0.5 block font-mono text-[11px] text-ink-muted/70">
                    {payment.externalTransactionId.slice(0, 20)}
                  </span>
                </TableCell>

                <TableCell className="max-w-xs align-top">
                  <span className="block text-sm text-ink">
                    {payment.narration || (
                      <em className="text-ink-muted">No narration supplied</em>
                    )}
                  </span>
                  {(payment.payerName || payment.payerPhone) && (
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {[payment.payerName, payment.payerPhone]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                  {payment.isSuspicious && (
                    <span className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600">
                      <ShieldAlert className="size-3.5" aria-hidden="true" />
                      {payment.suspicionReason ?? "Flagged as suspicious"}
                    </span>
                  )}
                </TableCell>

                <TableCell align="right" tabular className="align-top">
                  {formatMoney(payment.amount, { currency: payment.currency })}
                </TableCell>

                <TableCell className="max-w-xs align-top">
                  <span className="block text-xs leading-relaxed text-ink-muted">
                    {payment.lastAttempt?.notes ??
                      payment.failureReason ??
                      "No matching evidence found"}
                  </span>

                  {payment.candidates.length > 0 && (
                    <span className="mt-1.5 block text-xs">
                      <span className="font-semibold text-amber-800">
                        Possible members:
                      </span>{" "}
                      {payment.candidates
                        .map((c) => `${c.memberNumber} (${c.fullName})`)
                        .join(", ")}
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  <StatusBadge status={payment.status} size="sm" />
                  {!payment.verified && (
                    <span className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-600">
                      <AlertTriangle className="size-3" aria-hidden="true" />
                      Not verified with the bank
                    </span>
                  )}
                </TableCell>

                <TableCell align="right" className="align-top">
                  <div className="flex flex-col items-end gap-1.5">
                    {canMatch && payment.verified ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setError(null);
                          setSelectedMember(
                            payment.candidates.length === 1
                              ? payment.candidates[0].id
                              : ""
                          );
                          setActive(payment);
                        }}
                      >
                        <UserCheck className="size-3.5" aria-hidden="true" />
                        Match
                      </Button>
                    ) : (
                      <span className="text-xs text-ink-muted">
                        {!canMatch ? "No permission" : "Cannot credit"}
                      </span>
                    )}

                    {canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          setError(null);
                          setDeleting(payment);
                        }}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={(next) => router.push(`?page=${next}`)}
        />
      </TableWrapper>

      <ConfirmDialog
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
        title="Credit this payment to a member"
        description={
          active
            ? `${formatMoney(active.amount)} received on ${new Date(active.transactionDate).toLocaleDateString("en-GB")}. This posts the money to the member's savings account immediately.`
            : undefined
        }
        confirmLabel="Credit member"
        requireReason
        reasonMinLength={10}
        reasonLabel="Why does this payment belong to this member?"
        reasonPlaceholder="e.g. Member confirmed by phone that they paid from their sister's mobile money account"
        onConfirm={handleMatch}
      >
        <div className="space-y-2">
          <label
            htmlFor="match-member"
            className="block text-sm font-semibold text-ink"
          >
            Member
          </label>

          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger id="match-member">
              <SelectValue placeholder="Select the member…" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {active && active.narration && (
            <p className="flex items-start gap-1.5 rounded-lg bg-background p-2.5 text-xs text-ink-muted">
              <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Narration on the payment: <strong>{active.narration}</strong>
            </p>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this payment"
        description={
          deleting
            ? `${formatMoney(deleting.amount, { currency: deleting.currency })} received on ${new Date(deleting.transactionDate).toLocaleDateString("en-GB")}. The record is removed from the queue and kept only in the audit log.`
            : undefined
        }
        confirmLabel="Delete payment"
        tone="danger"
        requireReason
        reasonMinLength={10}
        reasonLabel="Why can this payment never belong to a member?"
        reasonPlaceholder="e.g. This is the association's own transfer between its bank accounts, not a member contribution"
        onConfirm={handleDelete}
      >
        <div className="space-y-2 text-xs leading-relaxed text-ink-muted">
          <p>
            Delete only a payment that will never be attributable — the
            association&apos;s own transfers, bank charges, or a line the PDF
            parser read incorrectly.
          </p>
          <p>
            If the same payment arrives again from the bank or in another
            statement upload, it will reappear here.
          </p>
          {deleting?.narration && (
            <p className="flex items-start gap-1.5 rounded-lg bg-background p-2.5">
              <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Narration: <strong className="text-ink">{deleting.narration}</strong>
            </p>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={bulkMode !== null}
        onOpenChange={(open) => !open && setBulkMode(null)}
        title={
          bulkMode === "ALL_QUEUED"
            ? `Delete all ${total} unmatched payments`
            : `Delete ${checked.size} selected payment${checked.size === 1 ? "" : "s"}`
        }
        description={
          bulkMode === "ALL_QUEUED"
            ? `Every unmatched payment in this association will be removed from the queue — including those on pages you have not opened.`
            : `The ${checked.size} payment${checked.size === 1 ? "" : "s"} you ticked will be removed from the queue.`
        }
        confirmLabel={
          bulkMode === "ALL_QUEUED" ? `Delete all ${total}` : "Delete selected"
        }
        tone="danger"
        requireReason
        reasonMinLength={10}
        reasonLabel="Why can none of these payments belong to a member?"
        reasonPlaceholder="e.g. Statement upload was the wrong account and every row was parsed from the association's own transfers"
        onConfirm={handleBulkDelete}
      >
        <div className="space-y-2 text-xs leading-relaxed text-ink-muted">
          <p>
            Each deletion is recorded separately in the audit log against your
            name, with the full payment record attached.
          </p>
          <p>
            Any payment that has already been credited to a member is skipped
            automatically — those must be reversed, not deleted — and you will be
            told how many were skipped.
          </p>
          {bulkMode === "ALL_QUEUED" && (
            <p className="rounded-lg bg-red-50 p-2.5 font-semibold text-red-700">
              This clears the entire queue. If any of these payments really do
              belong to a member, that member will not be credited.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
