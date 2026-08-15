"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  Check,
  HelpCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney, gt } from "@/lib/money";

interface Application {
  id: string;
  reference: string;
  status: string;
  requestedAmount: string;
  purpose: string;
  termMonths: number;
  frequency: string;
  submittedAt: Date | string | null;
  productName: string;
  interestRate: string;
  interestMethod: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  memberPhone: string | null;
  memberSince: Date | string | null;
  savingsBalance: string;
  lifetimeDeposits: string;
  savingsAtApplication: string | null;
  maxEligibleAmount: string | null;
  existingLoanCount: number;
  existingOutstanding: string;
  hasOverdueHistory: boolean;
  completedLoans: number;
  guarantors: { fullName: string; phone: string | null; status: string }[];
}

interface PendingLoan {
  id: string;
  reference: string;
  principal: string;
  interestRate: string;
  termMonths: number;
  frequency: string;
  productName: string;
  memberName: string;
  memberNumber: string;
  approvedAt: Date | string;
}

/**
 * Loan review workspace.
 *
 * Each application is shown with the member's full lending history alongside
 * it — savings, what they already owe, whether they have ever been overdue,
 * how many loans they have repaid. A reviewer deciding whether to lend the
 * association's money should not have to go and look those up, because in
 * practice they would not.
 */
export function LoanApplicationReview({
  applications,
  pendingDisbursement,
  canApprove,
  canReject,
  canDisburse,
}: {
  applications: Application[];
  pendingDisbursement: PendingLoan[];
  canApprove: boolean;
  canReject: boolean;
  canDisburse: boolean;
}) {
  const router = useRouter();

  const [approving, setApproving] = useState<Application | null>(null);
  const [rejecting, setRejecting] = useState<Application | null>(null);
  const [requestingInfo, setRequestingInfo] = useState<Application | null>(null);
  const [disbursing, setDisbursing] = useState<PendingLoan | null>(null);

  const [approvedAmount, setApprovedAmount] = useState("");
  const [infoText, setInfoText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function callApplication(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/loan-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "The action could not be completed");
    }
    router.refresh();
  }

  async function disburse(loan: PendingLoan) {
    const response = await fetch(`/api/admin/loans/${loan.id}/disburse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "SAVINGS_ACCOUNT" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? "Disbursement failed");
    }
    router.refresh();
  }

  return (
    <>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications" count={applications.length}>
            Applications
          </TabsTrigger>
          <TabsTrigger value="disbursement" count={pendingDisbursement.length}>
            Awaiting disbursement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <div className="space-y-4">
            {applications.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-ink-muted">
                No applications awaiting review.
              </p>
            )}

            {applications.map((application) => {
              const overCeiling =
                application.maxEligibleAmount !== null &&
                gt(application.requestedAmount, application.maxEligibleAmount);

              return (
                <article
                  key={application.id}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-ink">
                        {formatMoney(application.requestedAmount)}
                        <span className="ml-2 text-sm font-normal text-ink-muted">
                          over {application.termMonths} months · {application.productName}
                        </span>
                      </h3>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        <span className="font-medium text-ink">
                          {application.memberName}
                        </span>{" "}
                        · {application.memberNumber}
                        {application.memberPhone && ` · ${application.memberPhone}`}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-ink-muted">
                        {application.reference}
                        {application.submittedAt &&
                          ` · submitted ${new Date(application.submittedAt).toLocaleDateString("en-GB")}`}
                      </p>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>

                  <p className="mt-4 rounded-xl bg-background p-3 text-sm leading-relaxed text-ink">
                    <span className="font-semibold">Purpose:</span> {application.purpose}
                  </p>

                  {/* The member's lending history — the reviewer's evidence. */}
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric
                      label="Savings balance"
                      value={formatMoney(application.savingsBalance)}
                      note={
                        application.savingsAtApplication &&
                        application.savingsAtApplication !== application.savingsBalance
                          ? `was ${formatMoney(application.savingsAtApplication)} at application`
                          : undefined
                      }
                    />
                    <Metric
                      label="Eligible up to"
                      value={
                        application.maxEligibleAmount
                          ? formatMoney(application.maxEligibleAmount)
                          : "—"
                      }
                      tone={overCeiling ? "bad" : "good"}
                    />
                    <Metric
                      label="Already owing"
                      value={formatMoney(application.existingOutstanding)}
                      note={
                        application.existingLoanCount > 0
                          ? `${application.existingLoanCount} active loan(s)`
                          : "No active loans"
                      }
                      tone={application.existingLoanCount > 0 ? "bad" : undefined}
                    />
                    <Metric
                      label="Repayment record"
                      value={
                        application.hasOverdueHistory
                          ? "Has been overdue"
                          : application.completedLoans > 0
                            ? `${application.completedLoans} repaid`
                            : "No history"
                      }
                      tone={application.hasOverdueHistory ? "bad" : "good"}
                    />
                  </dl>

                  {overCeiling && (
                    <Alert variant="warning" className="mt-4">
                      <AlertTriangle className="inline size-3.5" aria-hidden="true" /> The
                      request of {formatMoney(application.requestedAmount)} exceeds the
                      member&rsquo;s current ceiling of{" "}
                      {formatMoney(application.maxEligibleAmount!)}. Approve a lower
                      amount, or decline.
                    </Alert>
                  )}

                  {application.hasOverdueHistory && (
                    <Alert variant="warning" className="mt-3">
                      This member has been overdue on a previous loan.
                    </Alert>
                  )}

                  {application.guarantors.length > 0 && (
                    <div className="mt-4">
                      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        Guarantors
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {application.guarantors.map((g, i) => (
                          <li
                            key={i}
                            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs"
                          >
                            <span className="font-medium text-ink">{g.fullName}</span>
                            {g.phone && (
                              <span className="ml-1.5 text-ink-muted">{g.phone}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {canApprove && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setError(null);
                          setApprovedAmount(application.requestedAmount);
                          setApproving(application);
                        }}
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setError(null);
                        setInfoText("");
                        setRequestingInfo(application);
                      }}
                    >
                      <HelpCircle className="size-3.5" aria-hidden="true" />
                      Request info
                    </Button>
                    {canReject && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setError(null);
                          setRejecting(application);
                        }}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                        Decline
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="disbursement">
          <div className="space-y-3">
            {pendingDisbursement.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-ink-muted">
                No approved loans awaiting disbursement.
              </p>
            )}

            {pendingDisbursement.map((loan) => (
              <div
                key={loan.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card"
              >
                <div>
                  <p className="font-heading text-base font-bold text-ink">
                    {formatMoney(loan.principal)}
                    <span className="ml-2 text-sm font-normal text-ink-muted">
                      {loan.productName} · {loan.interestRate}% · {loan.termMonths} months
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {loan.memberName} · {loan.memberNumber} ·{" "}
                    <span className="font-mono text-xs">{loan.reference}</span>
                  </p>
                </div>

                {canDisburse ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setDisbursing(loan);
                    }}
                  >
                    <Banknote className="size-3.5" aria-hidden="true" />
                    Disburse
                  </Button>
                ) : (
                  <span className="text-xs text-ink-muted">No permission to disburse</span>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Approve */}
      <ConfirmDialog
        open={approving !== null}
        onOpenChange={(open) => !open && setApproving(null)}
        title="Approve this loan?"
        description={
          approving
            ? `A loan will be created for ${approving.memberName} awaiting disbursement. No money moves until you disburse it.`
            : undefined
        }
        confirmLabel="Approve loan"
        onConfirm={async () => {
          if (!approving) return;
          await callApplication(approving.id, {
            action: "approve",
            approvedAmount:
              approvedAmount !== approving.requestedAmount ? approvedAmount : undefined,
          });
        }}
      >
        <div className="space-y-2">
          <label htmlFor="approved-amount" className="block text-sm font-semibold text-ink">
            Approved amount
          </label>
          <Input
            id="approved-amount"
            inputMode="decimal"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
          />
          <p className="text-xs text-ink-muted">
            You may approve less than requested, but never more.
            {approving?.maxEligibleAmount &&
              ` This member's ceiling is ${formatMoney(approving.maxEligibleAmount)}.`}
          </p>
        </div>
      </ConfirmDialog>

      {/* Decline */}
      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="Decline this application?"
        description={
          rejecting
            ? `${rejecting.memberName} will be told their application was not approved, and given the reason.`
            : undefined
        }
        confirmLabel="Decline application"
        tone="danger"
        requireReason
        reasonLabel="Why is this being declined?"
        reasonPlaceholder="e.g. Requested amount exceeds three times the member's savings"
        onConfirm={async (reason) => {
          if (rejecting) {
            await callApplication(rejecting.id, { action: "reject", reason });
          }
        }}
      />

      {/* Request information */}
      <ConfirmDialog
        open={requestingInfo !== null}
        onOpenChange={(open) => !open && setRequestingInfo(null)}
        title="Request more information"
        description="The member will be notified and the application held until they respond."
        confirmLabel="Send request"
        onConfirm={async () => {
          if (!requestingInfo) return;
          if (infoText.trim().length < 10) {
            throw new Error("Say what information is needed, in at least 10 characters");
          }
          await callApplication(requestingInfo.id, {
            action: "request-info",
            infoRequested: infoText.trim(),
          });
        }}
      >
        <div className="space-y-2">
          <label htmlFor="info-text" className="block text-sm font-semibold text-ink">
            What do you need from the member?
          </label>
          <Textarea
            id="info-text"
            value={infoText}
            onChange={(e) => setInfoText(e.target.value)}
            placeholder="e.g. Please provide a quotation for the machines you intend to buy"
            rows={3}
          />
        </div>
      </ConfirmDialog>

      {/* Disburse */}
      <ConfirmDialog
        open={disbursing !== null}
        onOpenChange={(open) => !open && setDisbursing(null)}
        title="Disburse this loan?"
        description={
          disbursing
            ? `${formatMoney(disbursing.principal)} will be credited to ${disbursing.memberName}'s savings account, less any fees, and the full repayment schedule will be generated. This cannot be undone except by a reversal.`
            : undefined
        }
        confirmLabel="Disburse now"
        onConfirm={async () => {
          if (disbursing) await disburse(disbursing);
        }}
      />
    </>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "good" | "bad";
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-heading text-sm font-bold tabular-nums ${
          tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-ink"
        }`}
      >
        {value}
      </dd>
      {note && <p className="mt-0.5 text-[11px] text-ink-muted">{note}</p>}
    </div>
  );
}
