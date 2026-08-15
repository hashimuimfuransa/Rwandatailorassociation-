import type { Metadata } from "next";
import { AlertTriangle, Building2, HandCoins, PiggyBank, Users } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { listAssociations } from "@/lib/services/associations";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchFilterForm } from "@/components/dashboard/SearchFilterForm";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { AssociationStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Associations | RTA" };
export const dynamic = "force-dynamic";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "ARCHIVED", label: "Archived" },
];

const VALID_STATUS = new Set(["PENDING", "ACTIVE", "SUSPENDED", "ARCHIVED"]);

/**
 * Tenant directory.
 *
 * The one screen in the product that shows every association side by side, so
 * it is gated on role rather than permission: association admins have no
 * legitimate reading of another tenant's balances, however senior they are.
 */
export default async function SuperAdminAssociationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireSuperAdmin("/super-admin/associations");

  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const status =
    params.status && VALID_STATUS.has(params.status)
      ? (params.status as AssociationStatus)
      : undefined;

  const { associations, totals } = await listAssociations({ search, status });
  const filtered = Boolean(search || status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Associations"
        description="Every tenant on the platform, with the money each one holds."
      />

      <StatGrid columns={4}>
        <StatCard
          label="Associations"
          value={String(totals.associations)}
          hint={`${totals.active} active`}
          icon={Building2}
          tone="primary"
        />
        <StatCard
          label="Members"
          value={totals.members.toLocaleString("en-US")}
          hint={filtered ? "Across the filtered tenants" : "Across every tenant"}
          icon={Users}
        />
        <StatCard
          label="Savings held"
          value={formatMoney(totals.savingsBalance)}
          hint="Sum of active account balances"
          icon={PiggyBank}
          tone="success"
        />
        <StatCard
          label="Loans outstanding"
          value={formatMoney(totals.loansOutstanding)}
          hint={
            totals.unmatchedPayments > 0
              ? `${totals.unmatchedPayments} unmatched payment(s)`
              : "All payments attributed"
          }
          icon={HandCoins}
          tone={totals.unmatchedPayments > 0 ? "warning" : "default"}
        />
      </StatGrid>

      <SearchFilterForm
        action="/super-admin/associations"
        placeholder="Name, code, legal name, city…"
        search={search}
        selects={[
          {
            name: "status",
            label: "Status",
            value: status,
            options: STATUS_OPTIONS,
          },
        ]}
      />

      {associations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={filtered ? "No associations match" : "No associations yet"}
          description={
            filtered
              ? "Nothing matches these filters. Try clearing the search."
              : "The platform has no tenants. Seed the database or create the first association to get started."
          }
        />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Association</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Members</TableHead>
                <TableHead align="right">Savings</TableHead>
                <TableHead align="right">Loans owing</TableHead>
                <TableHead align="right">Unmatched</TableHead>
                <TableHead align="right">Admins</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {associations.map((association) => (
                <TableRow key={association.id}>
                  <TableCell>
                    <span className="block font-medium text-ink">
                      {association.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                      {association.code}
                      {association.city ? ` · ${association.city}` : ""}
                      {` · ${association.currency}`}
                    </span>
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={association.status} size="sm" />
                  </TableCell>

                  <TableCell align="right" tabular>
                    {association.members.total}
                    {association.members.pendingApproval > 0 && (
                      <span className="mt-0.5 block text-[11px] font-semibold text-amber-700">
                        {association.members.pendingApproval} pending
                      </span>
                    )}
                  </TableCell>

                  <TableCell align="right" tabular>
                    {formatMoney(association.savingsBalance, {
                      currency: association.currency,
                      showSymbol: false,
                    })}
                  </TableCell>

                  <TableCell align="right" tabular>
                    {formatMoney(association.loans.outstanding, {
                      currency: association.currency,
                      showSymbol: false,
                    })}
                    {association.loans.overdueCount > 0 && (
                      <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-semibold text-red-600">
                        <AlertTriangle className="size-3" aria-hidden="true" />
                        {association.loans.overdueCount} overdue
                      </span>
                    )}
                  </TableCell>

                  <TableCell align="right" tabular>
                    <span
                      className={
                        association.unmatchedPayments > 0
                          ? "text-amber-700"
                          : "text-ink-muted"
                      }
                    >
                      {association.unmatchedPayments}
                    </span>
                  </TableCell>

                  <TableCell align="right" tabular>
                    {association.admins}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {association.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}
    </div>
  );
}
