import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Banknote, CalendarClock, HandCoins } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { getMemberRepayments } from "@/lib/services/member-queries";
import { formatMoney, isPositive } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Repayments | RTA" };
export const dynamic = "force-dynamic";

const DATE = { day: "numeric", month: "short", year: "numeric" } as const;

export default async function MemberRepaymentsPage() {
  const context = await requireMember("/dashboard/loans/repayments");
  const data = await getMemberRepayments(context.member!.id);

  if (data.loanCount === 0) {
    return (
      <div>
        <PageHeader
          title="Repayments"
          description="Your repayment schedule and everything you have paid so far."
        />
        <EmptyState
          icon={HandCoins}
          title="You have no active loans"
          description="Once a loan is disbursed to you, its repayment schedule will appear here."
          action={
            <Link
              href="/dashboard/loans/apply"
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-[13px] font-semibold text-white hover:bg-primary-hover"
            >
              Apply for a loan
            </Link>
          }
        />
      </div>
    );
  }

  const inArrears = isPositive(data.arrears);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repayments"
        description="Your repayment schedule and everything you have paid so far."
      />

      {inArrears && (
        <Alert variant="error" title="You have overdue repayments">
          {formatMoney(data.arrears)} is past its due date. Penalties may continue
          to accrue until it is settled.
        </Alert>
      )}

      <StatGrid columns={3}>
        <StatCard
          label="Total outstanding"
          value={formatMoney(data.totalOutstanding)}
          hint={`Across ${data.loanCount} loan${data.loanCount === 1 ? "" : "s"}`}
          icon={HandCoins}
          tone="primary"
        />
        <StatCard
          label="Next instalment"
          value={data.nextDue ? formatMoney(data.nextDue.remaining) : "—"}
          hint={
            data.nextDue
              ? `Due ${data.nextDue.dueDate.toLocaleDateString("en-GB", DATE)}`
              : "Nothing scheduled"
          }
          icon={CalendarClock}
        />
        <StatCard
          label="In arrears"
          value={formatMoney(data.arrears)}
          hint={inArrears ? "Settle as soon as possible" : "You are up to date"}
          icon={AlertTriangle}
          tone={inArrears ? "danger" : "success"}
        />
      </StatGrid>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Repayment schedule
        </h2>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Loan</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead align="right">Instalment</TableHead>
                <TableHead align="right">Paid</TableHead>
                <TableHead align="right">Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.schedule.length === 0 ? (
                <TableEmpty colSpan={7}>
                  No schedule has been generated yet. It is created when the loan
                  is disbursed.
                </TableEmpty>
              ) : (
                data.schedule.map((instalment) => (
                  <TableRow key={instalment.id}>
                    <TableCell tabular className="text-ink-muted">
                      {instalment.number}
                    </TableCell>
                    <TableCell>
                      <span className="block font-mono text-xs text-ink-muted">
                        {instalment.loanReference}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {instalment.productName}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {instalment.dueDate.toLocaleDateString("en-GB", DATE)}
                      {instalment.daysOverdue > 0 && (
                        <span className="mt-0.5 block text-[11px] font-semibold text-red-600">
                          {instalment.daysOverdue} day
                          {instalment.daysOverdue === 1 ? "" : "s"} late
                        </span>
                      )}
                    </TableCell>
                    <TableCell align="right" tabular>
                      {formatMoney(instalment.totalDue, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular className="text-emerald-700">
                      {formatMoney(instalment.totalPaid, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular>
                      {formatMoney(instalment.remaining, { showSymbol: false })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={instalment.status} size="sm" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Repayments received
        </h2>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Loan</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead align="right">Principal</TableHead>
                <TableHead align="right">Interest</TableHead>
                <TableHead align="right">Penalty</TableHead>
                <TableHead align="right">Balance after</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.history.length === 0 ? (
                <TableEmpty colSpan={8}>
                  No repayments have been posted yet.
                </TableEmpty>
              ) : (
                data.history.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs text-ink-muted">
                      {payment.reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {payment.createdAt.toLocaleDateString("en-GB", DATE)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-ink-muted">
                      {payment.loanReference}
                    </TableCell>
                    <TableCell align="right" tabular className="text-emerald-700">
                      {formatMoney(payment.amount, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(payment.principalPortion, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(payment.interestPortion, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(payment.penaltyPortion, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular>
                      {formatMoney(payment.balanceAfter, { showSymbol: false })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      <p className="flex items-start gap-2 rounded-2xl border border-border bg-surface p-4 text-sm text-ink-muted">
        <Banknote className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Repayments are matched automatically when you pay using your payment
          reference{" "}
          <strong className="font-mono text-ink">
            {context.member!.paymentReference}
          </strong>
          . Allow up to one working day for a payment to appear here.
        </span>
      </p>
    </div>
  );
}
