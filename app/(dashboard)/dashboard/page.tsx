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
import { getDashboardCopy } from "@/lib/i18n/server";
import { fill, pluralize } from "@/lib/i18n/fill";
import { formatDate } from "@/lib/i18n/dates";
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
  const { d, locale } = await getDashboardCopy();
  const copy = d.member.overview;

  const data = await getMemberDashboard(context.member!.id, context.user.id);

  if (!data) {
    return (
      <EmptyState
        icon={Wallet}
        title={copy.noAccountTitle}
        description={copy.noAccountBody}
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
          {fill(copy.welcome, { name: firstName })}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          {savings.lastTransactionAt
            ? fill(copy.lastActivity, {
                date: formatDate(savings.lastTransactionAt, locale),
              })
            : copy.firstContribution}
        </p>
      </div>

      {loan.daysOverdue > 0 && (
        <Alert variant="error" title={copy.overdueTitle}>
          {pluralize(copy.overdueBody, loan.daysOverdue, { days: loan.daysOverdue })}{" "}
          <Link href="/dashboard/loans/repayments" className="font-semibold underline">
            {copy.makeRepayment}
          </Link>
        </Alert>
      )}

      {application && (
        <Alert
          variant="info"
          title={fill(copy.applicationTitle, { reference: application.reference })}
        >
          {fill(copy.applicationBody, {
            amount: formatMoney(application.requestedAmount),
            status: application.status.toLowerCase().replace(/_/g, " "),
          })}{" "}
          <Link href="/dashboard/loans" className="font-semibold underline">
            {copy.viewDetails}
          </Link>
        </Alert>
      )}

      {/* Headline figures */}
      <StatGrid columns={4}>
        <StatCard
          label={copy.savingsBalance}
          value={formatMoney(savings.balance)}
          hint={fill(copy.availableHint, {
            amount: formatMoney(savings.available),
          })}
          icon={PiggyBank}
          tone="primary"
          href="/dashboard/savings"
        />

        <StatCard
          label={copy.activeLoan}
          value={loan.hasActiveLoan ? formatMoney(loan.principal) : d.common.none}
          hint={loan.reference ?? copy.noLoanRunning}
          icon={HandCoins}
          href="/dashboard/loans"
        />

        <StatCard
          label={copy.outstandingLoan}
          value={formatMoney(loan.outstanding)}
          hint={
            loan.hasActiveLoan
              ? fill(copy.repaidPercent, { percent: loan.progressPercent })
              : copy.nothingOwed
          }
          icon={Receipt}
          tone={loan.daysOverdue > 0 ? "danger" : "default"}
        />

        <StatCard
          label={copy.nextRepayment}
          value={
            loan.nextInstalment ? formatMoney(loan.nextInstalment.amount) : "—"
          }
          hint={
            loan.nextInstalment
              ? `${fill(copy.dueOn, {
                  date: formatDate(loan.nextInstalment.dueDate, locale),
                })}${
                  dueSoon !== null && dueSoon >= 0 && dueSoon <= 7
                    ? ` · ${pluralize(copy.dueInDays, dueSoon, { days: dueSoon })}`
                    : ""
                }`
              : copy.noRepaymentScheduled
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
            {copy.quickActions}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Button asChild variant="outline" className="h-auto justify-start py-3">
              <Link href="/dashboard/savings/deposit">
                <ArrowDownToLine className="size-4 text-primary" aria-hidden="true" />
                {copy.makeDeposit}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start py-3">
              <Link href="/dashboard/withdrawals">
                <ArrowUpFromLine className="size-4 text-primary" aria-hidden="true" />
                {copy.requestWithdrawal}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto justify-start py-3">
              <Link href="/dashboard/loans/apply">
                <HandCoins className="size-4 text-primary" aria-hidden="true" />
                {copy.applyLoan}
              </Link>
            </Button>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              {copy.borrowQuestion}
            </p>
            {borrowing.meetsMinimum ? (
              <p className="mt-1.5 text-sm text-ink-muted">
                {copy.borrowUpTo}{" "}
                <span className="font-heading text-lg font-bold text-ink">
                  {formatMoney(borrowing.maxEligible)}
                </span>{" "}
                {fill(copy.borrowUnder, { product: borrowing.productName ?? "" })}
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-ink-muted">
                {copy.borrowNeedMinimum}{" "}
                <strong className="text-ink">
                  {formatMoney(borrowing.minimumSavings)}
                </strong>{" "}
                {fill(copy.borrowCurrentBalance, {
                  product: borrowing.productName ? ` (${borrowing.productName})` : "",
                  balance: formatMoney(savings.balance),
                })}
              </p>
            )}
          </div>
        </div>

        <PaymentReferenceCard reference={data.paymentReference} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={copy.savingsGrowth} description={copy.savingsGrowthHint}>
          {monthlySavings.length > 0 ? (
            <SavingsGrowthChart data={monthlySavings} />
          ) : (
            <ChartPlaceholder message={copy.savingsGrowthEmpty} />
          )}
        </ChartCard>

        <ChartCard title={copy.contributions} description={copy.contributionsHint}>
          {monthlySavings.length > 0 ? (
            <ContributionsChart data={monthlySavings} />
          ) : (
            <ChartPlaceholder message={copy.contributionsEmpty} />
          )}
        </ChartCard>
      </div>

      {loan.hasActiveLoan && (
        <ChartCard
          title={copy.repaymentProgress}
          description={`${loan.reference} · ${fill(copy.totalPayableHint, {
            amount: formatMoney(loan.totalPayable),
          })}`}
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
            {copy.recentTransactions}
          </h2>
          <Link
            href="/dashboard/savings/transactions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {d.common.viewAll}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={copy.noTransactions}
            description={fill(copy.noTransactionsHint, {
              reference: data.paymentReference,
            })}
            action={
              <Button asChild>
                <Link href="/dashboard/savings/deposit">{copy.makeDeposit}</Link>
              </Button>
            }
          />
        ) : (
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d.common.reference}</TableHead>
                  <TableHead>{d.common.date}</TableHead>
                  <TableHead>{d.common.type}</TableHead>
                  <TableHead align="right">{d.common.amount}</TableHead>
                  <TableHead align="right">{d.common.balance}</TableHead>
                  <TableHead>{d.common.status}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-ink-muted">
                      {t.reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {formatDate(t.createdAt, locale)}
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

function daysUntil(date: Date): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}
