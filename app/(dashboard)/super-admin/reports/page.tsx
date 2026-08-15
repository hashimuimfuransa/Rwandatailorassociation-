import type { Metadata } from "next";
import { AlertTriangle, Building2, HandCoins, PiggyBank } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getReportBundle } from "@/lib/services/admin-queries";
import { getAdminDashboard } from "@/lib/services/admin-dashboard";
import { listAssociations } from "@/lib/services/associations";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ReportsView } from "@/components/dashboard/ReportsView";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Platform reports | RTA" };
export const dynamic = "force-dynamic";

export default async function PlatformReportsPage() {
  await requireSuperAdmin("/super-admin/reports");

  const [summary, reports, directory] = await Promise.all([
    getAdminDashboard(null),
    getReportBundle(null),
    listAssociations(),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Platform reports"
        description="Consolidated figures across every association."
      />

      <StatGrid columns={4}>
        <StatCard
          label="Savings held"
          value={formatMoney(summary.savings.totalBalance)}
          hint={`${summary.members.total} members platform-wide`}
          icon={PiggyBank}
          tone="primary"
        />
        <StatCard
          label="Loans outstanding"
          value={formatMoney(summary.loans.outstanding)}
          hint={`${summary.loans.activeCount} active loans`}
          icon={HandCoins}
        />
        <StatCard
          label="In arrears"
          value={formatMoney(summary.loans.overdueAmount)}
          hint={`${summary.loans.overdueCount} overdue`}
          icon={AlertTriangle}
          tone={summary.loans.overdueCount > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Associations"
          value={String(directory.totals.associations)}
          hint={`${directory.totals.active} active`}
          icon={Building2}
          href="/super-admin/associations"
        />
      </StatGrid>

      {/* Per-tenant comparison: the one report an association admin can never
          see, and the reason this screen is separate from /admin/reports. */}
      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          By association
        </h2>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Association</TableHead>
                <TableHead align="right">Members</TableHead>
                <TableHead align="right">Savings</TableHead>
                <TableHead align="right">Loans owing</TableHead>
                <TableHead align="right">Overdue</TableHead>
                <TableHead align="right">Unmatched</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directory.associations.map((association) => (
                <TableRow key={association.id}>
                  <TableCell>
                    <span className="block font-medium text-ink">
                      {association.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                      {association.code}
                    </span>
                  </TableCell>
                  <TableCell align="right" tabular>
                    {association.members.total}
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
                  </TableCell>
                  <TableCell align="right" tabular>
                    <span
                      className={
                        association.loans.overdueCount > 0
                          ? "text-red-600"
                          : "text-ink-muted"
                      }
                    >
                      {association.loans.overdueCount}
                    </span>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      <ReportsView data={reports} />
    </div>
  );
}
