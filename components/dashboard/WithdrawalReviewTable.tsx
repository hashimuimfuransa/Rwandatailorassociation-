"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Banknote, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatMoney, gt } from "@/lib/money";

interface Withdrawal {
  id: string;
  reference: string;
  memberName: string;
  memberNumber: string;
  memberPhone: string | null;
  amount: string;
  fee: string;
  netAmount: string;
  status: string;
  reason: string | null;
  channel: string;
  destinationDetail: string | null;
  balanceAtRequest: string;
  currentBalance: string;
  requestedAt: Date | string;
}

/**
 * Withdrawal review queue.
 *
 * The balance is shown BOTH as it was when the request was made and as it is
 * now. Those two figures diverging is the case an approver most needs to
 * notice: a member who has spent down their savings since requesting, whose
 * withdrawal would now overdraw them. The row is flagged when that happens.
 */
export function WithdrawalReviewTable({
  withdrawals,
  canApprove,
  canPayout,
}: {
  withdrawals: Withdrawal[];
  canApprove: boolean;
  canPayout: boolean;
}) {
  const router = useRouter();
  const [approving, setApproving] = useState<Withdrawal | null>(null);
  const [rejecting, setRejecting] = useState<Withdrawal | null>(null);
  const [paying, setPaying] = useState<Withdrawal | null>(null);
  const [payoutReference, setPayoutReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function act(
    withdrawal: Withdrawal,
    action: "approve" | "reject" | "payout",
    extra?: { reason?: string; externalReference?: string }
  ) {
    const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "reject"
          ? { action, reason: extra?.reason }
          : action === "payout"
            ? { action, externalReference: extra?.externalReference || undefined }
            : { action }
      ),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "The action could not be completed");
    }

    setPayoutReference("");
    router.refresh();
  }

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead align="right">Amount</TableHead>
              <TableHead align="right">Balance</TableHead>
              <TableHead>Payout to</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {withdrawals.map((w) => {
              // Would the payout now exceed what the member actually holds?
              const insufficientNow = gt(w.amount, w.currentBalance);

              return (
                <TableRow key={w.id}>
                  <TableCell>
                    <span className="block font-medium text-ink">{w.memberName}</span>
                    <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                      {w.memberNumber} · {w.reference}
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {new Date(w.requestedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {w.reason && (
                      <span className="mt-0.5 block max-w-[180px] truncate text-xs">
                        {w.reason}
                      </span>
                    )}
                  </TableCell>

                  <TableCell align="right" tabular>
                    <span className="block font-semibold">
                      {formatMoney(w.amount, { showSymbol: false })}
                    </span>
                    {Number(w.fee) > 0 && (
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        net {formatMoney(w.netAmount, { showSymbol: false })}
                      </span>
                    )}
                  </TableCell>

                  <TableCell align="right" tabular>
                    <span
                      className={insufficientNow ? "font-semibold text-red-600" : "text-ink"}
                    >
                      {formatMoney(w.currentBalance, { showSymbol: false })}
                    </span>
                    {insufficientNow && (
                      <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-semibold text-red-600">
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        below request
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-ink-muted">
                    <span className="block capitalize">
                      {w.channel.replace(/_/g, " ").toLowerCase()}
                    </span>
                    <span className="block text-xs">
                      {w.destinationDetail ?? w.memberPhone ?? "—"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={w.status} size="sm" />
                  </TableCell>

                  <TableCell align="right">
                    <div className="flex justify-end gap-2">
                      {w.status === "APPROVED" ? (
                        canPayout ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setError(null);
                              setPaying(w);
                            }}
                          >
                            <Banknote className="size-3.5" aria-hidden="true" />
                            Record payout
                          </Button>
                        ) : (
                          <span className="text-xs text-ink-muted">Awaiting payout</span>
                        )
                      ) : canApprove ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setError(null);
                              setApproving(w);
                            }}
                          >
                            <Check className="size-3.5" aria-hidden="true" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setError(null);
                              setRejecting(w);
                            }}
                          >
                            <X className="size-3.5" aria-hidden="true" />
                            Decline
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-ink-muted">No permission</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrapper>

      <ConfirmDialog
        open={approving !== null}
        onOpenChange={(open) => !open && setApproving(null)}
        title="Approve this withdrawal?"
        description={
          approving
            ? `${approving.memberName} will be approved to withdraw ${formatMoney(approving.amount)}. Their balance is not debited until you record the payout.`
            : undefined
        }
        confirmLabel="Approve"
        onConfirm={async () => {
          if (approving) await act(approving, "approve");
        }}
      >
        {approving && gt(approving.amount, approving.currentBalance) && (
          <Alert variant="error">
            This member&rsquo;s balance is now{" "}
            {formatMoney(approving.currentBalance)}, which is less than the{" "}
            {formatMoney(approving.amount)} requested. The payout will be refused
            unless they deposit more first.
          </Alert>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Decline this withdrawal?"
        description={
          rejecting
            ? `${rejecting.memberName} will be told their request for ${formatMoney(rejecting.amount)} was declined, and the hold on their balance will be released.`
            : undefined
        }
        confirmLabel="Decline"
        tone="danger"
        requireReason
        reasonLabel="Why is this being declined?"
        reasonPlaceholder="e.g. Outstanding loan repayment must be settled first"
        onConfirm={async (reason) => {
          if (rejecting) await act(rejecting, "reject", { reason });
        }}
      />

      <ConfirmDialog
        open={paying !== null}
        onOpenChange={(open) => !open && setPaying(null)}
        title="Record this payout?"
        description={
          paying
            ? `Confirm that ${formatMoney(paying.netAmount)} has actually been sent to ${paying.memberName}. This debits their savings account immediately and cannot be undone except by a reversal.`
            : undefined
        }
        confirmLabel="Confirm payout"
        onConfirm={async () => {
          if (paying) await act(paying, "payout", { externalReference: payoutReference });
        }}
      >
        <div className="space-y-2">
          <label htmlFor="payout-ref" className="block text-sm font-semibold text-ink">
            Bank or mobile money reference (optional)
          </label>
          <Input
            id="payout-ref"
            value={payoutReference}
            onChange={(e) => setPayoutReference(e.target.value)}
            placeholder="e.g. the transfer confirmation code"
          />
          <p className="text-xs text-ink-muted">
            Recording it makes the payout traceable back to the bank record.
          </p>
        </div>
      </ConfirmDialog>
    </>
  );
}
