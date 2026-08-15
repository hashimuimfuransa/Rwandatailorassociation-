import type { Metadata } from "next";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getReportBundle } from "@/lib/services/admin-queries";
import { getAdminDashboard } from "@/lib/services/admin-dashboard";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ReportsView } from "@/components/dashboard/ReportsView";
import { AlertTriangle, HandCoins, PiggyBank, Users } from "lucide-react";

export const metadata: Metadata = { title: "Reports | RTA" };
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const context = await requirePermission(
    PERMISSIONS.REPORTS_VIEW_ASSOCIATION,
    "/admin/reports"
  );
  const associationId = resolveAssociationScope(context);

  const [summary, reports] = await Promise.all([
    getAdminDashboard(associationId),
    getReportBundle(associationId),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Reports"
        description="Where the association's money is, and how it moved."
      />

      <StatGrid columns={4}>
        <StatCard
          label="Savings held"
          value={formatMoney(summary.savings.totalBalance)}
          hint={`${summary.members.active} active members`}
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
          label="Members"
          value={String(summary.members.total)}
          hint={`${summary.members.joinedThisMonth} joined this month`}
          icon={Users}
        />
      </StatGrid>

      <ReportsView data={reports} />
    </div>
  );
}
