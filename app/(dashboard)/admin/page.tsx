import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpFromLine,
  Banknote,
  ClipboardList,
  CreditCard,
  HandCoins,
  Link2,
  PiggyBank,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { resolveAssociationScope } from "@/lib/auth/guards";
import { getAdminDashboard } from "@/lib/services/admin-dashboard";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { MonthlyBarChart } from "@/components/dashboard/charts/SavingsChart";
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

export const metadata: Metadata = { title: "Administration | RTA Savings & Loans" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const context = await requireAdmin("/admin");
  const associationId = resolveAssociationScope(context);
  const data = await getAdminDashboard(associationId);

  const { members, savings, loans, payments, queues, charts, recentTransactions } = data;

  return (
    <div className="space-y-7">
      <PageHeader
        title={`${context.association?.name ?? "Platform"} overview`}
        description="Today's position across savings, loans and payments."
      />

      {/* Things that need a human, surfaced before the numbers. */}
      {(payments.unmatchedCount > 0 ||
        loans.overdueCount > 0 ||
        queues.pendingMemberApprovals > 0) && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {payments.unmatchedCount > 0 && (
            <ActionCard
              href="/admin/payments/unmatched"
              icon={Link2}
              tone="warning"
              title={`${payments.unmatchedCount} unmatched payment${payments.unmatchedCount === 1 ? "" : "s"}`}
              detail={`${formatMoney(payments.unmatchedAmount)} received but not yet credited to a member`}
            />
          )}
          {loans.overdueCount > 0 && (
            <ActionCard
              href="/admin/loans?status=OVERDUE"
              icon={AlertTriangle}
              tone="danger"
              title={`${loans.overdueCount} overdue loan${loans.overdueCount === 1 ? "" : "s"}`}
              detail={`${formatMoney(loans.overdueAmount)} in arrears`}
            />
          )}
          {queues.pendingMemberApprovals > 0 && (
            <ActionCard
              href="/admin/members/pending"
              icon={UserCheck}
              tone="info"
              title={`${queues.pendingMemberApprovals} membership application${queues.pendingMemberApprovals === 1 ? "" : "s"}`}
              detail="Awaiting your approval"
            />
          )}
        </div>
      )}

      {payments.suspiciousCount > 0 && (
        <Alert variant="error" title="Payments flagged as suspicious">
          {payments.suspiciousCount} payment
          {payments.suspiciousCount === 1 ? " has" : "s have"} been flagged and
          held.{" "}
          <Link href="/admin/payments?flag=suspicious" className="font-semibold underline">
            Review them
          </Link>
        </Alert>
      )}

      {/* Money */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-ink-muted">
          Association funds
        </h2>
        <StatGrid columns={4}>
          <StatCard
            label="Total savings held"
            value={formatMoney(savings.totalBalance)}
            hint={`${members.active} active members`}
            icon={PiggyBank}
            tone="primary"
            href="/admin/savings"
          />
          <StatCard
            label="Collected today"
            value={formatMoney(savings.depositsToday)}
            hint={`${savings.transactionsToday} transaction${savings.transactionsToday === 1 ? "" : "s"}`}
            icon={Banknote}
            tone="success"
          />
          <StatCard
            label="Collected this month"
            value={formatMoney(savings.depositsThisMonth)}
            hint={`Withdrawals ${formatMoneyCompact(savings.withdrawalsThisMonth)}`}
            icon={TrendingUp}
          />
          <StatCard
            label="Outstanding loans"
            value={formatMoney(loans.outstanding)}
            hint={`${loans.activeCount} active loan${loans.activeCount === 1 ? "" : "s"}`}
            icon={HandCoins}
            tone={loans.overdueCount > 0 ? "warning" : "default"}
            href="/admin/loans"
          />
        </StatGrid>
      </section>

      {/* Operations */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-ink-muted">
          Needs attention
        </h2>
        <StatGrid columns={4}>
          <StatCard
            label="Pending applications"
            value={String(loans.pendingApplications)}
            hint="Loan applications awaiting review"
            icon={ClipboardList}
            tone={loans.pendingApplications > 0 ? "warning" : "default"}
            href="/admin/loans/applications"
          />
          <StatCard
            label="Pending withdrawals"
            value={String(queues.pendingWithdrawals)}
            hint={formatMoney(queues.pendingWithdrawalAmount)}
            icon={ArrowUpFromLine}
            tone={queues.pendingWithdrawals > 0 ? "warning" : "default"}
            href="/admin/withdrawals"
          />
          <StatCard
            label="Unmatched payments"
            value={String(payments.unmatchedCount)}
            hint={formatMoney(payments.unmatchedAmount)}
            icon={CreditCard}
            tone={payments.unmatchedCount > 0 ? "danger" : "success"}
            href="/admin/payments/unmatched"
          />
          <StatCard
            label="Overdue loans"
            value={String(loans.overdueCount)}
            hint={formatMoney(loans.overdueAmount)}
            icon={AlertTriangle}
            tone={loans.overdueCount > 0 ? "danger" : "success"}
            href="/admin/loans?status=OVERDUE"
          />
        </StatGrid>
      </section>

      {/* Membership */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-ink-muted">
          Membership
        </h2>
        <StatGrid columns={4}>
          <StatCard
            label="Total members"
            value={String(members.total)}
            hint={`${members.joinedThisMonth} joined this month`}
            icon={Users}
            href="/admin/members"
          />
          <StatCard label="Active" value={String(members.active)} icon={UserCheck} tone="success" />
          <StatCard
            label="Pending approval"
            value={String(members.pendingApproval)}
            icon={ClipboardList}
            tone={members.pendingApproval > 0 ? "warning" : "default"}
            href="/admin/members/pending"
          />
          <StatCard
            label="Suspended"
            value={String(members.suspended)}
            icon={AlertTriangle}
            tone={members.suspended > 0 ? "warning" : "default"}
          />
        </StatGrid>
      </section>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Monthly deposits" description="Contributions received per month">
          {charts.monthlyDeposits.length > 0 ? (
            <MonthlyBarChart data={charts.monthlyDeposits} series="Deposits" />
          ) : (
            <ChartPlaceholder />
          )}
        </ChartCard>

        <ChartCard title="Monthly withdrawals" description="Paid out per month">
          {charts.monthlyWithdrawals.length > 0 ? (
            <MonthlyBarChart
              data={charts.monthlyWithdrawals}
              series="Withdrawals"
              colour="#d4a94c"
            />
          ) : (
            <ChartPlaceholder />
          )}
        </ChartCard>
      </div>

      {/* Recent activity */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Latest transactions
          </h2>
          <Link
            href="/admin/savings/transactions"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableEmpty colSpan={6}>
                  No transactions recorded yet.
                </TableEmpty>
              ) : (
                recentTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-ink-muted">
                      {t.reference}
                    </TableCell>
                    <TableCell>
                      <span className="block text-sm font-medium text-ink">
                        {t.memberName}
                      </span>
                      <span className="block text-xs text-ink-muted">
                        {t.memberNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.type} size="sm" />
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {t.channel.replace(/_/g, " ").toLowerCase()}
                    </TableCell>
                    <TableCell align="right" tabular>
                      <span
                        className={
                          t.direction === "CREDIT" ? "text-emerald-700" : "text-ink"
                        }
                      >
                        {t.direction === "CREDIT" ? "+" : "−"}
                        {formatMoney(t.amount, { showSymbol: false })}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {new Date(t.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  detail,
  tone,
}: {
  href: string;
  icon: typeof Link2;
  title: string;
  detail: string;
  tone: "warning" | "danger" | "info";
}) {
  const tones = {
    warning: "border-gold/40 bg-gold/[0.07] text-amber-800",
    danger: "border-red-300 bg-red-50 text-red-700",
    info: "border-primary/25 bg-primary-50 text-primary-hover",
  };

  return (
    <Link
      href={href}
      className={`flex items-start gap-3 rounded-2xl border p-4 transition-shadow hover:shadow-card ${tones[tone]}`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs opacity-90">{detail}</span>
      </span>
      <ArrowRight className="mt-0.5 size-4 shrink-0 opacity-60" aria-hidden="true" />
    </Link>
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
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border">
      <p className="text-sm text-ink-muted">No data for this period yet.</p>
    </div>
  );
}
