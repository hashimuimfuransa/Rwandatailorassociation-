import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  FileText,
  Lock,
  PiggyBank,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import {
  getMemberSavingsAccount,
  getMemberTransactions,
} from "@/lib/services/member-queries";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
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

export const metadata: Metadata = { title: "My savings | RTA" };
export const dynamic = "force-dynamic";

export default async function MemberSavingsPage() {
  const context = await requireMember("/dashboard/savings");
  const account = await getMemberSavingsAccount(context.member!.id);

  if (!account) {
    return (
      <EmptyState
        icon={Wallet}
        title="No savings account"
        description="No savings account has been opened for your membership yet. Please contact your association administrator."
      />
    );
  }

  const recent = await getMemberTransactions(context.member!.id, { pageSize: 10 });

  return (
    <div className="space-y-7">
      <PageHeader
        title="My savings"
        description={`Account ${account.accountNumber} · opened ${formatDate(account.openedAt)}`}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/statements">
                <FileText className="size-4" aria-hidden="true" />
                Statement
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/savings/deposit">
                <ArrowDownToLine className="size-4" aria-hidden="true" />
                Deposit
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid columns={4}>
        <StatCard
          label="Current balance"
          value={formatMoney(account.balance)}
          hint={`${account.transactionCount} transactions`}
          icon={PiggyBank}
          tone="primary"
        />
        <StatCard
          label="Available"
          value={formatMoney(account.available)}
          hint={
            Number(account.lockedBalance) > 0
              ? `${formatMoney(account.lockedBalance)} pledged`
              : "Nothing pledged"
          }
          icon={Wallet}
        />
        <StatCard
          label="Total contributed"
          value={formatMoney(account.totalDeposits)}
          hint="Lifetime deposits"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Total withdrawn"
          value={formatMoney(account.totalWithdrawals)}
          hint="Lifetime withdrawals"
          icon={ArrowUpFromLine}
        />
      </StatGrid>

      {Number(account.lockedBalance) > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold/[0.07] p-4">
          <Lock className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-amber-900">
            <strong>{formatMoney(account.lockedBalance)}</strong> of your balance is
            pledged against an active loan or a pending withdrawal, so it cannot be
            withdrawn until that is settled.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <ActionTile
          href="/dashboard/savings/deposit"
          icon={ArrowDownToLine}
          title="Make a deposit"
          detail="How to pay, and your reference"
        />
        <ActionTile
          href="/dashboard/withdrawals"
          icon={ArrowUpFromLine}
          title="Request a withdrawal"
          detail="Subject to association approval"
        />
        <ActionTile
          href="/dashboard/savings/transactions"
          icon={Receipt}
          title="All transactions"
          detail="Search and filter your history"
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Recent activity
          </h2>
          <Link
            href="/dashboard/savings/transactions"
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
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead align="right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.transactions.length === 0 ? (
                <TableEmpty colSpan={6}>
                  No transactions yet. Quote reference{" "}
                  <strong>{context.member!.paymentReference}</strong> on your first
                  payment.
                </TableEmpty>
              ) : (
                recent.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-ink-muted">
                      {t.reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {formatDate(t.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.type} size="sm" />
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
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(t.balanceAfter, { showSymbol: false })}
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

function ActionTile({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: typeof Wallet;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-lift"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-sm font-semibold text-ink">
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-ink-muted">{detail}</span>
      </span>
    </Link>
  );
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
