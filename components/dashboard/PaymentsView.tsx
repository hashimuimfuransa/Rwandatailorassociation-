import Link from "next/link";
import { AlertTriangle, CreditCard, Link2, ShieldAlert } from "lucide-react";
import { formatMoney } from "@/lib/money";
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
import type { listPayments } from "@/lib/services/admin-queries";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "PROCESSED", label: "Processed" },
  { value: "MATCHED", label: "Matched" },
  { value: "VERIFIED", label: "Verified" },
  { value: "RECEIVED", label: "Received" },
  { value: "PENDING", label: "Pending" },
  { value: "UNMATCHED", label: "Unmatched" },
  { value: "FAILED", label: "Failed" },
  { value: "DUPLICATE", label: "Duplicate" },
  { value: "REJECTED", label: "Rejected" },
];

const FLAG_OPTIONS = [
  { value: "ALL", label: "All payments" },
  { value: "1", label: "Suspicious only" },
];

/**
 * Inbound provider payments.
 *
 * Read-only by design. Reconciling an unmatched payment is a money-moving
 * action with its own screen and its own permission
 * (`payments.match_manual`) — this one answers "what has arrived, and did it
 * land?" without offering a way to change the answer.
 */
export function PaymentsView({
  data,
  basePath,
  search,
  status,
  suspiciousOnly,
  unmatchedPath,
}: {
  data: Awaited<ReturnType<typeof listPayments>>;
  basePath: string;
  search?: string;
  status?: string;
  suspiciousOnly?: boolean;
  /// Where the unmatched queue lives, if this role has one.
  unmatchedPath?: string;
}) {
  const counts = data.statusCounts;
  const unmatched = counts.UNMATCHED ?? 0;
  const failed = counts.FAILED ?? 0;

  return (
    <>
      <StatGrid columns={4}>
        <StatCard
          label="Matching payments"
          value={String(data.total)}
          hint={formatMoney(data.totalAmount)}
          icon={CreditCard}
          tone="primary"
        />
        <StatCard
          label="Processed"
          value={String(counts.PROCESSED ?? 0)}
          hint="Credited to a member"
          icon={CreditCard}
          tone="success"
        />
        <StatCard
          label="Unmatched"
          value={String(unmatched)}
          hint={unmatched > 0 ? "Needs manual attribution" : "Nothing waiting"}
          icon={Link2}
          tone={unmatched > 0 ? "warning" : "success"}
          href={unmatched > 0 ? unmatchedPath : undefined}
        />
        <StatCard
          label="Failed"
          value={String(failed)}
          hint="Rejected at verification"
          icon={AlertTriangle}
          tone={failed > 0 ? "danger" : "success"}
        />
      </StatGrid>

      <SearchFilterForm
        action={basePath}
        placeholder="Provider id, reference, payer name, phone or narration…"
        search={search}
        selects={[
          { name: "status", label: "Status", value: status, options: STATUS_OPTIONS },
          {
            name: "flagged",
            label: "Flagged",
            value: suspiciousOnly ? "1" : "ALL",
            options: FLAG_OPTIONS,
            width: "lg:w-44",
          },
        ]}
      />

      {data.payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description="No payments match these filters. Try clearing them, or check that the reconciliation worker is running."
        />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Credited to</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <span className="block font-mono text-xs text-ink">
                      {payment.externalTransactionId.slice(0, 26)}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-muted">
                      {payment.provider} ·{" "}
                      {payment.channel.replace(/_/g, " ").toLowerCase()}
                    </span>
                    {payment.isSuspicious && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                        <ShieldAlert className="size-3" aria-hidden="true" />
                        {payment.suspicionReason ?? "Flagged as suspicious"}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-[220px] text-sm">
                    <span className="block truncate text-ink">
                      {payment.payerName ?? "—"}
                    </span>
                    {payment.payerPhone && (
                      <span className="mt-0.5 block text-xs text-ink-muted">
                        {payment.payerPhone}
                      </span>
                    )}
                    {payment.narration && (
                      <span className="mt-0.5 block truncate text-[11px] text-ink-muted/80">
                        {payment.narration}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-sm">
                    {payment.memberId ? (
                      <>
                        <Link
                          href={`/admin/members/${payment.memberId}`}
                          className="block font-medium text-ink hover:text-primary"
                        >
                          {payment.memberName}
                        </Link>
                        <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                          {payment.memberNumber}
                          {payment.matchStrategy !== "NONE" && (
                            <> · {payment.matchConfidence}%</>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-muted">Not attributed</span>
                    )}
                  </TableCell>

                  <TableCell align="right" tabular>
                    {formatMoney(payment.amount, {
                      currency: payment.currency,
                      showSymbol: false,
                    })}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {payment.transactionDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {!payment.verified && (
                      <span className="mt-0.5 block text-[11px] font-semibold text-amber-700">
                        unverified
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={payment.status} size="sm" />
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
