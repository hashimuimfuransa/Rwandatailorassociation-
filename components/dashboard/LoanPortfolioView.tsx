import Link from "next/link";
import { AlertTriangle, Banknote, HandCoins, TrendingUp } from "lucide-react";
import { formatMoney, isPositive } from "@/lib/money";
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
import type { listLoans } from "@/lib/services/admin-queries";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "DISBURSED", label: "Disbursed" },
  { value: "PENDING_DISBURSEMENT", label: "Awaiting disbursement" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DEFAULTED", label: "Defaulted" },
  { value: "WRITTEN_OFF", label: "Written off" },
  { value: "RESTRUCTURED", label: "Restructured" },
  { value: "CANCELLED", label: "Cancelled" },
];

/**
 * The loan book.
 *
 * Arrears are given their own tile and their own colour throughout, because
 * the portfolio total alone hides the only number that changes what an
 * administrator does today.
 */
export function LoanPortfolioView({
  data,
  basePath,
  search,
  status,
  applicationsPath,
}: {
  data: Awaited<ReturnType<typeof listLoans>>;
  basePath: string;
  search?: string;
  status?: string;
  /// Where pending applications are reviewed, if this role reviews them.
  applicationsPath?: string;
}) {
  const { portfolio } = data;
  const hasArrears = portfolio.overdueCount > 0;

  return (
    <>
      <StatGrid columns={4}>
        <StatCard
          label="Outstanding"
          value={formatMoney(portfolio.outstanding)}
          hint={`${portfolio.openCount} open loan${portfolio.openCount === 1 ? "" : "s"}`}
          icon={HandCoins}
          tone="primary"
        />
        <StatCard
          label="In arrears"
          value={formatMoney(portfolio.overdueAmount)}
          hint={`${portfolio.overdueCount} overdue loan${portfolio.overdueCount === 1 ? "" : "s"}`}
          icon={AlertTriangle}
          tone={hasArrears ? "danger" : "success"}
        />
        <StatCard
          label="Total disbursed"
          value={formatMoney(portfolio.totalDisbursed)}
          hint="Principal paid out to date"
          icon={Banknote}
        />
        <StatCard
          label="Awaiting disbursement"
          value={String(data.statusCounts.PENDING_DISBURSEMENT ?? 0)}
          hint="Approved but not yet paid out"
          icon={TrendingUp}
          href={applicationsPath}
        />
      </StatGrid>

      <SearchFilterForm
        action={basePath}
        placeholder="Loan reference, member name or member number…"
        search={search}
        selects={[
          { name: "status", label: "Status", value: status, options: STATUS_OPTIONS },
        ]}
      />

      {data.loans.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No loans found"
          description={
            search || status
              ? "No loans match these filters. Try clearing them."
              : "No loans have been disbursed yet. Approved applications appear here once disbursed."
          }
        />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan</TableHead>
                <TableHead>Member</TableHead>
                <TableHead align="right">Principal</TableHead>
                <TableHead align="right">Outstanding</TableHead>
                <TableHead align="right">Repaid</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>
                    <span className="block font-mono text-xs text-ink">
                      {loan.reference}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-muted">
                      {loan.productName} · {loan.interestRate}% · {loan.termMonths}mo
                    </span>
                  </TableCell>

                  <TableCell>
                    <Link
                      href={`/admin/members/${loan.memberId}`}
                      className="block font-medium text-ink hover:text-primary"
                    >
                      {loan.memberName}
                    </Link>
                    <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                      {loan.memberNumber}
                    </span>
                  </TableCell>

                  <TableCell align="right" tabular className="text-ink-muted">
                    {formatMoney(loan.principal, {
                      currency: loan.currency,
                      showSymbol: false,
                    })}
                  </TableCell>

                  <TableCell align="right" tabular>
                    {formatMoney(loan.outstanding, {
                      currency: loan.currency,
                      showSymbol: false,
                    })}
                    {isPositive(loan.overdueAmount) && (
                      <span className="mt-0.5 block text-[11px] font-semibold text-red-600">
                        {formatMoney(loan.overdueAmount, { showSymbol: false })} overdue
                        {loan.daysOverdue > 0 && ` · ${loan.daysOverdue}d`}
                      </span>
                    )}
                  </TableCell>

                  <TableCell align="right" tabular>
                    <span className="text-emerald-700">
                      {formatMoney(loan.totalPaid, {
                        currency: loan.currency,
                        showSymbol: false,
                      })}
                    </span>
                    <span className="mt-1 block text-[11px] text-ink-muted">
                      {loan.progressPercent}% repaid
                    </span>
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {loan.maturityDate
                      ? loan.maturityDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={loan.status} size="sm" />
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
    </>
  );
}
