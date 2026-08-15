import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, HandCoins, Plus } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { getMemberLoans } from "@/lib/services/member-queries";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { RepaymentProgress } from "@/components/dashboard/charts/SavingsChart";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "My loans | RTA" };
export const dynamic = "force-dynamic";

export default async function MemberLoansPage() {
  const context = await requireMember("/dashboard/loans");
  const { loans, applications } = await getMemberLoans(context.member!.id);

  const hasNothing = loans.length === 0 && applications.length === 0;

  return (
    <div className="space-y-7">
      <PageHeader
        title="My loans"
        description="Your loan applications, active loans and repayment schedules."
        actions={
          <Button asChild size="sm">
            <Link href="/dashboard/loans/apply">
              <Plus className="size-4" aria-hidden="true" />
              Apply for a loan
            </Link>
          </Button>
        }
      />

      {hasNothing && (
        <EmptyState
          icon={HandCoins}
          title="No loans yet"
          description="You have not applied for a loan. How much you can borrow depends on your savings balance and how long you have been a member."
          action={
            <Button asChild>
              <Link href="/dashboard/loans/apply">Apply for a loan</Link>
            </Button>
          }
        />
      )}

      {applications.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
            Applications
          </h2>

          <div className="space-y-3">
            {applications.map((application) => (
              <div
                key={application.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-base font-semibold text-ink">
                      {formatMoney(application.requestedAmount)}
                      <span className="ml-2 text-sm font-normal text-ink-muted">
                        {application.productName}
                      </span>
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-muted">
                      {application.reference}
                      {application.submittedAt &&
                        ` · submitted ${formatDate(application.submittedAt)}`}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                <p className="mt-3 text-sm text-ink-muted">
                  <span className="font-medium text-ink">Purpose:</span>{" "}
                  {application.purpose}
                </p>

                {application.status === "MORE_INFORMATION_REQUIRED" &&
                  application.infoRequested && (
                    <Alert variant="warning" className="mt-4">
                      <strong>The association needs more information:</strong>{" "}
                      {application.infoRequested}
                    </Alert>
                  )}

                {application.status === "REJECTED" && application.rejectionReason && (
                  <Alert variant="error" className="mt-4">
                    <strong>Not approved:</strong> {application.rejectionReason}
                  </Alert>
                )}

                {application.status === "APPROVED" && (
                  <Alert variant="success" className="mt-4">
                    Approved for{" "}
                    <strong>
                      {formatMoney(
                        application.approvedAmount ?? application.requestedAmount
                      )}
                    </strong>
                    . You will be notified when the funds are disbursed.
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {loans.map((loan) => (
        <section key={loan.id} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink">
                {formatMoney(loan.principal)}
                <span className="ml-2 text-sm font-normal text-ink-muted">
                  {loan.productName}
                </span>
              </h2>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">
                {loan.reference}
                {loan.disbursedAt && ` · disbursed ${formatDate(loan.disbursedAt)}`}
              </p>
            </div>
            <StatusBadge
              status={loan.status}
              tone={loan.daysOverdue > 0 ? "danger" : undefined}
            />
          </div>

          {loan.daysOverdue > 0 && (
            <Alert variant="error" className="mt-4">
              <strong>
                {formatMoney(loan.overdueAmount)} is {loan.daysOverdue} day
                {loan.daysOverdue === 1 ? "" : "s"} overdue.
              </strong>{" "}
              Penalties may be applied until it is settled.
            </Alert>
          )}

          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Figure label="Interest rate" value={`${loan.interestRate}% p.a.`} />
            <Figure label="Total payable" value={formatMoney(loan.totalPayable)} />
            <Figure label="Repaid" value={formatMoney(loan.totalPaid)} tone="good" />
            <Figure
              label="Outstanding"
              value={formatMoney(loan.outstanding)}
              tone={loan.daysOverdue > 0 ? "bad" : undefined}
            />
          </dl>

          <div className="mt-5">
            <RepaymentProgress
              paid={loan.totalPaid}
              total={loan.totalPayable}
              percent={loan.progressPercent}
              overdue={loan.daysOverdue > 0}
            />
          </div>

          {loan.installments.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold text-ink">
                <CalendarClock className="size-4 text-primary" aria-hidden="true" />
                Repayment schedule
              </h3>

              <TableWrapper className="shadow-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead align="right">Principal</TableHead>
                      <TableHead align="right">Interest</TableHead>
                      <TableHead align="right">Fees</TableHead>
                      <TableHead align="right">Total due</TableHead>
                      <TableHead align="right">Paid</TableHead>
                      <TableHead align="right">Remaining</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loan.installments.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-sm text-ink-muted">{i.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(i.dueDate)}
                        </TableCell>
                        <TableCell align="right" tabular className="text-sm">
                          {formatMoney(i.principalDue, { showSymbol: false })}
                        </TableCell>
                        <TableCell align="right" tabular className="text-sm">
                          {formatMoney(i.interestDue, { showSymbol: false })}
                        </TableCell>
                        <TableCell align="right" tabular className="text-sm">
                          {formatMoney(i.feesDue, { showSymbol: false })}
                        </TableCell>
                        <TableCell align="right" tabular className="text-sm font-semibold">
                          {formatMoney(i.totalDue, { showSymbol: false })}
                        </TableCell>
                        <TableCell align="right" tabular className="text-sm text-emerald-700">
                          {formatMoney(i.totalPaid, { showSymbol: false })}
                        </TableCell>
                        <TableCell align="right" tabular className="text-sm">
                          {formatMoney(i.remaining, { showSymbol: false })}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={i.status} size="sm" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 font-heading text-base font-bold tabular-nums ${
          tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
