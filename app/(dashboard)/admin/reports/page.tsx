import type { Metadata } from "next";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getReportBundle } from "@/lib/services/admin-queries";
import { getAdminDashboard } from "@/lib/services/admin-dashboard";
import { formatMoney } from "@/lib/money";
import { getDashboardCopy } from "@/lib/i18n/server";
import { fill, pluralize } from "@/lib/i18n/fill";
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
  const { d } = await getDashboardCopy();
  const copy = d.admin.reports;

  const [summary, reports] = await Promise.all([
    getAdminDashboard(associationId),
    getReportBundle(associationId),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader title={copy.title} description={copy.description} />

      <StatGrid columns={4}>
        <StatCard
          label={copy.savingsHeld}
          value={formatMoney(summary.savings.totalBalance)}
          hint={pluralize(copy.activeMembers, summary.members.active)}
          icon={PiggyBank}
          tone="primary"
        />
        <StatCard
          label={copy.loansOutstanding}
          value={formatMoney(summary.loans.outstanding)}
          hint={pluralize(copy.activeLoans, summary.loans.activeCount)}
          icon={HandCoins}
        />
        <StatCard
          label={copy.inArrears}
          value={formatMoney(summary.loans.overdueAmount)}
          hint={fill(copy.overdueCount, { count: summary.loans.overdueCount })}
          icon={AlertTriangle}
          tone={summary.loans.overdueCount > 0 ? "danger" : "success"}
        />
        <StatCard
          label={copy.members}
          value={String(summary.members.total)}
          hint={fill(copy.joinedThisMonth, {
            count: summary.members.joinedThisMonth,
          })}
          icon={Users}
        />
      </StatGrid>

      <ReportsView data={reports} />
    </div>
  );
}
