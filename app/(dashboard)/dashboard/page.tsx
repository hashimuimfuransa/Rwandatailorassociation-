import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CalendarClock,
  HandCoins,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { getMemberDashboard } from "@/lib/services/member-dashboard";
import { formatMoney } from "@/lib/money";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  ContributionsChart,
  RepaymentProgress,
  SavingsGrowthChart,
} from "@/components/dashboard/charts/SavingsChart";
import { PaymentReferenceCard } from "@/components/dashboard/PaymentReferenceCard";

export const metadata: Metadata = { title: "Dashboard | RTA Savings & Loans" };

// Balances must never be served from a cache — a member refreshing after a
// deposit has to see the new figure, not a stale one.
export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const context = await requireMember("/dashboard");
  const data = await getMemberDashboard(context.member!.id, context.user.id);

  if (!data) {
    return (
      <EmptyState
        icon={Wallet}
        title="No savings account yet"
        description="Your membership is active but no savings account has been opened. Please contact your association administrator."
      />
    );
  }

  const { savings, loan, borrowing, application, recentTransactions, monthlySavings } =
    data;

  const firstName = context.user.firstName;
  const dueSoon = loan.nextInstalment
    ? daysUntil(loan.nextInstalment.dueDate)
    : null;

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Welcome, {firstName}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          {savings.lastTransactionAt
            ? `Last activity on your account: ${formatDate(savings.lastTransactionAt)}`
            : "Here is your account. Make your first contribution to get started."}
        </p>
      </div>

      {loan.daysOverdue > 0 && (
        <Alert variant="error" title="Your loan repayment is overdue">
          Your loan is {loan.daysOverdue} day{loan.daysOverdue === 1 ? "" : "s"} past
          due. Penalties may apply until it is settled.{" "}
          <Link href="/dashboard/loans/repayments" className="font-semibold underline">
            Make a repayment
          </Link>
        </Alert>
      )}

      {application && (
        <Alert variant="info" title={`Loan application ${application.reference}`}>
          Your request for {formatMoney(application.requestedAmount)} is{" "}
          <strong>{application.status.toLowerCase().replace(/_/g, " ")}</strong>.{" "}
          <Link href="/dashboard/loans" className="font-semibold underline">
            View details
          </Link>
        </Alert>
      )}

      {/* Headline figures */}
      <StatGrid columns={4}>
        <StatCard
          label="Savings balance"
          value={formatMoney(savings.balance)}
          hint={`Available: ${formatMoney(savings.available)}`}
          icon={PiggyBank}
          tone="primary"
          href="/dashboard/savings"
        />

        <StatCard
          label="Active loan"
          value={loan.hasActiveLoan ? formatMoney(loan.principal) : "None"}
          hint={loan.reference ?? "No loan currently running"}
          icon={HandCoins}
          tone={loan.hasActiveLoan ? "default" : "default"}
          href="/dashboard/loans"
        />

        <StatCard
          label="Outstanding loan"
          value={formatMoney(loan.outstanding)}
          hint={
            loan.hasActiveLoan
              ? `${loan.progressPercent}% repaid`
              : "Nothing owed"
          }
          icon={Receipt}
          tone={loan.daysOverdue > 0 ? "danger" : "default"}
        />

        <StatCard
          label="Next repayment"
          value={
            loan.nextInstalment ? formatMoney(loan.nextInstalment.amount) : "—"
          }
          hint={
            loan.nextInstalment
              ? `Due ${formatDate(loan.nextInstalment.dueDate)}${
                  dueSoon !== null && dueSoon >= 0 && dueSoon <= 7
                    ? ` · in ${dueSoon} day${dueSoon === 1 ? "" : "s"}`
                    : ""
                }`
              : "No repayment scheduled"
          }
          icon={CalendarClock}
          tone={
            loan.nextInstalment && dueSoon !== null && dueSoon < 0
              ? "danger"
              : loan.nextInstalment && dueSoon !== null && dueSoon <= 7
                ? "warning"
                : "default"
          }
        />
      </StatGrid>

      {/* Quick actions + payment reference */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <h2 className="font-heading text-base font-semibold text-ink">
            Quick actions
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button asChild variant="outline" className="h-auto justify-start py-3">
              <Link href="/dashboard/savings/deposit">
                <ArrowDownToLine className="size-4 text-primary" aria-hidden="true" />
                Make a deposit
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start py-3">
              <Link href="/dashboard/withdrawals">
                <ArrowUpFromLine className="size-4 text-primary" aria-hidden="true" />
                Request withdrawal
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start py-3">
              <Link href="/dashboard/loans/apply">
                <HandCoins className="size-4 text-primary" aria-hidden="true" />
                Apply for a loan
              </Link>
            </Button>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              How much can I borrow?
            </p>
            {borrowing.meetsMinimum ? (
              <p className="mt-1.5 text-sm text-ink-muted">
                Up to{" "}
                <span className="font-heading text-lg font-bold text-ink">
                  {formatMoney(borrowing.maxEligible)}
                </span>{" "}
                under {borrowing.productName}. Final approval depends on your
                contribution history and the association&rsquo;s review.
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-ink-muted">
                You need at least{" "}
                <strong className="text-ink">{formatMoney(borrowing.minimumSavings)}</strong>{" "}
                in savings to qualify
                {borrowing.productName ? ` for ${borrowing.productName}` : ""}. You
                currently have {formatMoney(savings.balance)}.
              </p>
            )}
          </div>
        </div>

        <PaymentReferenceCard reference={data.paymentReference} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Savings growth"
          description="Closing balance at the end of each month"
        >
          {monthlySavings.length > 0 ? (
            <SavingsGrowthChart data={monthlySavings} />
          ) : (
            <ChartPlaceholder message="Your savings growth will appear here after your first contribution." />
          )}
        </ChartCard>

        <ChartCard
          title="Monthly contributions"
          description="Deposits and withdrawals over the last 12 months"
        >
          {monthlySavings.length > 0 ? (
            <ContributionsChart data={monthlySavings} />
          ) : (
            <ChartPlaceholder message="Contribution history will appear here once you start saving." />
          )}
        </ChartCard>
      </div>

      {loan.hasActiveLoan && (
        <ChartCard
          title="Loan repayment progress"
          description={`${loan.reference} · ${formatMoney(loan.totalPayable)} total payable`}
        >
          <div className="pt-2">
            <RepaymentProgress
              paid={loan.totalPaid}
              total={loan.totalPayable}
              percent={loan.progressPercent}
              overdue={loan.daysOverdue > 0}
            />
          </div>
        </ChartCard>
      )}

      {/* Recent transactions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Recent transactions
          </h2>
          <Link
            href="/dashboard/savings/transactions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description={`Make your first contribution using payment reference ${data.paymentReference} and it will appear here.`}
            action={
              <Button asChild>
                <Link href="/dashboard/savings/deposit">Make a deposit</Link>
              </Button>
            }
          />
        ) : (
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead align="right">Amount</TableHead>
                  <TableHead align="right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-ink-muted">
                      {t.reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {formatDate(t.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.type} size="sm" />
                    </TableCell>
                    <TableCell align="right" tabular>
                      <span
                        className={
                          t.direction === "CREDIT"
                            ? "text-emerald-700"
                            : "text-ink"
                        }
                      >
                        {t.direction === "CREDIT" ? "+" : "−"}
                        {formatMoney(t.amount, { showSymbol: false })}
                      </span>
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(t.balanceAfter, { showSymbol: false })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4">
        <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function ChartPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
      <TrendingUp className="size-6 text-ink-muted/40" aria-hidden="true" />
      <p className="max-w-xs px-4 text-sm text-ink-muted">{message}</p>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(date: Date): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}
