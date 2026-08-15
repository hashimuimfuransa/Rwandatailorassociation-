import type { Metadata } from "next";
import Link from "next/link";
import { Lock, PiggyBank, Wallet } from "lucide-react";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listSavingsAccounts } from "@/lib/services/admin-queries";
import { formatMoney, isPositive, subtract } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchFilterForm } from "@/components/dashboard/SearchFilterForm";
import { PaginationLinks } from "@/components/dashboard/PaginationLinks";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Savings accounts | RTA" };
export const dynamic = "force-dynamic";

export default async function AdminSavingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const context = await requirePermission(PERMISSIONS.SAVINGS_VIEW_ALL, "/admin/savings");
  const associationId = resolveAssociationScope(context);
  const params = await searchParams;
  const search = params.q?.trim() || undefined;

  const data = await listSavingsAccounts(associationId, {
    page: Number(params.page) || 1,
    search,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings accounts"
        description="Every member savings account and the balance it holds."
      />

      <StatGrid columns={3}>
        <StatCard
          label="Total held"
          value={formatMoney(data.totalBalance)}
          hint={`${data.total} account${data.total === 1 ? "" : "s"}`}
          icon={PiggyBank}
          tone="primary"
        />
        <StatCard
          label="Locked"
          value={formatMoney(data.totalLocked)}
          hint="Pledged against loans and pending withdrawals"
          icon={Lock}
          tone={isPositive(data.totalLocked) ? "warning" : "default"}
        />
        <StatCard
          label="Available"
          value={formatMoney(subtract(data.totalBalance, data.totalLocked))}
          hint="Balance members could withdraw today"
          icon={Wallet}
          tone="success"
        />
      </StatGrid>

      <SearchFilterForm
        action="/admin/savings"
        placeholder="Member name, number, payment reference or account number…"
        search={search}
      />

      {data.accounts.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings accounts found"
          description={
            search
              ? "No accounts match this search. Try clearing it."
              : "No savings accounts have been opened yet. One is created when a member is approved."
          }
        />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Account</TableHead>
                <TableHead align="right">Balance</TableHead>
                <TableHead align="right">Locked</TableHead>
                <TableHead align="right">Available</TableHead>
                <TableHead align="right">Deposits</TableHead>
                <TableHead align="right">Withdrawn</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <Link
                      href={`/admin/members/${account.memberId}`}
                      className="block font-medium text-ink hover:text-primary"
                    >
                      {account.memberName}
                    </Link>
                    <span className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-ink-muted">
                      {account.memberNumber}
                      <StatusBadge status={account.memberStatus} size="sm" />
                    </span>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-ink-muted">
                    {account.accountNumber}
                    <span className="mt-0.5 block text-[10px]">
                      {account.transactionCount} transaction
                      {account.transactionCount === 1 ? "" : "s"}
                    </span>
                  </TableCell>

                  <TableCell align="right" tabular>
                    {formatMoney(account.balance, {
                      currency: account.currency,
                      showSymbol: false,
                    })}
                  </TableCell>

                  <TableCell align="right" tabular>
                    <span
                      className={
                        isPositive(account.lockedBalance)
                          ? "text-amber-700"
                          : "text-ink-muted"
                      }
                    >
                      {formatMoney(account.lockedBalance, {
                        currency: account.currency,
                        showSymbol: false,
                      })}
                    </span>
                  </TableCell>

                  <TableCell align="right" tabular className="text-emerald-700">
                    {formatMoney(account.available, {
                      currency: account.currency,
                      showSymbol: false,
                    })}
                  </TableCell>

                  <TableCell align="right" tabular className="text-ink-muted">
                    {formatMoney(account.totalDeposits, {
                      currency: account.currency,
                      showSymbol: false,
                    })}
                  </TableCell>

                  <TableCell align="right" tabular className="text-ink-muted">
                    {formatMoney(account.totalWithdrawals, {
                      currency: account.currency,
                      showSymbol: false,
                    })}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {account.lastTransactionAt
                      ? account.lastTransactionAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <PaginationLinks
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
          />
        </TableWrapper>
      )}
    </div>
  );
}
