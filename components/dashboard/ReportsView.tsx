import Link from "next/link";
import { AlertTriangle, BarChart3, Trophy } from "lucide-react";
import { formatMoney, isPositive, subtract } from "@/lib/money";
import { StatusBadge } from "@/components/ui/status-badge";
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
import type { ReportBundle } from "@/lib/services/admin-queries";

/**
 * Reporting surface.
 *
 * Deliberately built from database aggregates and plain tables rather than
 * charts: every number here is one an administrator may need to quote or
 * reconcile against a bank statement, and a bar chart cannot be read to two
 * decimal places. The twelve-month movement table is the one time series that
 * earns its place.
 */
export function ReportsView({ data }: { data: ReportBundle }) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownPanel
          title="Members by status"
          rows={data.membersByStatus.map((r) => ({
            key: r.label,
            label: <StatusBadge status={r.label} size="sm" />,
            count: r.count,
          }))}
          countHeading="Members"
        />

        <BreakdownPanel
          title="Loans by status"
          rows={data.loansByStatus.map((r) => ({
            key: r.label,
            label: <StatusBadge status={r.label} size="sm" />,
            count: r.count,
            amount: r.amount,
          }))}
          countHeading="Loans"
          amountHeading="Principal"
        />

        <BreakdownPanel
          title="Payments by channel"
          rows={data.paymentsByChannel.map((r) => ({
            key: r.label,
            label: (
              <span className="text-sm capitalize text-ink">
                {r.label.replace(/_/g, " ").toLowerCase()}
              </span>
            ),
            count: r.count,
            amount: r.amount,
          }))}
          countHeading="Payments"
          amountHeading="Value"
        />

        <BreakdownPanel
          title="Ledger movement by type"
          rows={data.transactionsByType.map((r) => ({
            key: r.label,
            label: <StatusBadge status={r.label} size="sm" />,
            count: r.count,
            amount: r.amount,
          }))}
          countHeading="Entries"
          amountHeading="Value"
        />
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <BarChart3 className="size-4.5 text-primary" aria-hidden="true" />
          Deposits and withdrawals, last 12 months
        </h2>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead align="right">Deposits</TableHead>
                <TableHead align="right">Withdrawals</TableHead>
                <TableHead align="right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.monthly.length === 0 ? (
                <TableEmpty colSpan={4}>
                  No ledger movement recorded in the last twelve months.
                </TableEmpty>
              ) : (
                data.monthly.map((row) => {
                  const net = subtract(row.deposits, row.withdrawals);
                  return (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium text-ink">{row.month}</TableCell>
                      <TableCell align="right" tabular className="text-emerald-700">
                        {formatMoney(row.deposits, { showSymbol: false })}
                      </TableCell>
                      <TableCell align="right" tabular className="text-amber-700">
                        {formatMoney(row.withdrawals, { showSymbol: false })}
                      </TableCell>
                      <TableCell align="right" tabular>
                        {formatMoney(net, { showSymbol: false, signed: true })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <Trophy className="size-4.5 text-primary" aria-hidden="true" />
            Largest savers
          </h2>
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead align="right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSavers.length === 0 ? (
                  <TableEmpty colSpan={2}>No savings accounts yet.</TableEmpty>
                ) : (
                  data.topSavers.map((saver) => (
                    <TableRow key={saver.memberId}>
                      <TableCell>
                        <Link
                          href={`/admin/members/${saver.memberId}`}
                          className="block font-medium text-ink hover:text-primary"
                        >
                          {saver.memberName}
                        </Link>
                        <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                          {saver.memberNumber}
                        </span>
                      </TableCell>
                      <TableCell align="right" tabular>
                        {formatMoney(saver.balance, { showSymbol: false })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-ink">
            <AlertTriangle className="size-4.5 text-red-600" aria-hidden="true" />
            Arrears
          </h2>
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead align="right">Days late</TableHead>
                  <TableHead align="right">Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.arrears.length === 0 ? (
                  <TableEmpty colSpan={3}>
                    No loan is currently in arrears.
                  </TableEmpty>
                ) : (
                  data.arrears.map((row) => (
                    <TableRow key={row.reference}>
                      <TableCell>
                        <Link
                          href={`/admin/members/${row.memberId}`}
                          className="block font-medium text-ink hover:text-primary"
                        >
                          {row.memberName}
                        </Link>
                        <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                          {row.reference}
                        </span>
                      </TableCell>
                      <TableCell align="right" tabular className="text-red-600">
                        {row.daysOverdue}
                      </TableCell>
                      <TableCell align="right" tabular className="text-red-700">
                        {formatMoney(row.overdueAmount, { showSymbol: false })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </section>
      </div>
    </div>
  );
}

function BreakdownPanel({
  title,
  rows,
  countHeading,
  amountHeading,
}: {
  title: string;
  rows: {
    key: string;
    label: React.ReactNode;
    count: number;
    amount?: string;
  }[];
  countHeading: string;
  amountHeading?: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <section>
      <h2 className="mb-3 font-heading text-base font-semibold text-ink">{title}</h2>
      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead align="right">{countHeading}</TableHead>
              {amountHeading && <TableHead align="right">{amountHeading}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmpty colSpan={amountHeading ? 3 : 2}>
                Nothing recorded yet.
              </TableEmpty>
            ) : (
              rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right" tabular>
                    {row.count}
                  </TableCell>
                  {amountHeading && (
                    <TableCell align="right" tabular className="text-ink-muted">
                      {row.amount && isPositive(row.amount)
                        ? formatMoney(row.amount, { showSymbol: false })
                        : "—"}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm">
            <span className="font-semibold text-ink-muted">Total</span>
            <span className="font-heading font-bold tabular-nums text-ink">{total}</span>
          </div>
        )}
      </TableWrapper>
    </section>
  );
}
