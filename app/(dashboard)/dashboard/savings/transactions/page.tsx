import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { getMemberTransactions } from "@/lib/services/member-queries";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TransactionFilters } from "@/components/dashboard/TransactionFilters";
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
import type { TransactionType } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Transactions | RTA" };
export const dynamic = "force-dynamic";

const VALID_TYPES = new Set([
  "DEPOSIT",
  "WITHDRAWAL",
  "LOAN_DISBURSEMENT",
  "LOAN_REPAYMENT",
  "PENALTY",
  "INTEREST",
  "FEE",
  "ADJUSTMENT",
  "REVERSAL",
  "OTHER",
]);

export default async function MemberTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    type?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  const context = await requireMember("/dashboard/savings/transactions");
  const params = await searchParams;

  // Validate the type against the enum rather than passing it through — an
  // arbitrary query string must not reach Prisma as a filter value.
  const type =
    params.type && VALID_TYPES.has(params.type)
      ? (params.type as TransactionType)
      : undefined;

  const data = await getMemberTransactions(context.member!.id, {
    page: Number(params.page) || 1,
    type,
    from: params.from ? new Date(params.from) : undefined,
    to: params.to ? new Date(`${params.to}T23:59:59`) : undefined,
    search: params.q?.trim() || undefined,
  });

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Every movement on your savings account, newest first."
      />

      <TransactionFilters basePath="/dashboard/savings/transactions" />

      <div className="mb-4 mt-5 grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Matching transactions" value={String(data.total)} />
        <SummaryTile label="Total in" value={formatMoney(data.totalIn)} tone="in" />
        <SummaryTile label="Total out" value={formatMoney(data.totalOut)} tone="out" />
      </div>

      {data.transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          description="No transactions match these filters. Try widening the date range or clearing the search."
        />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead align="right">Balance after</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs text-ink-muted">
                    {t.reference}
                    {t.externalReference && (
                      <span className="mt-0.5 block text-[10px] text-ink-muted/70">
                        ext: {t.externalReference.slice(0, 18)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {new Date(t.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm">
                    {t.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.type} size="sm" />
                  </TableCell>
                  <TableCell className="text-xs capitalize text-ink-muted">
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

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "in" | "out";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </p>
      <p
        className={`mt-1 font-heading text-lg font-bold tabular-nums ${
          tone === "in" ? "text-emerald-700" : tone === "out" ? "text-amber-700" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
