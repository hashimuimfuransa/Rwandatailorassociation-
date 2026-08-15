import type { Metadata } from "next";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listLoans } from "@/lib/services/admin-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { LoanPortfolioView } from "@/components/dashboard/LoanPortfolioView";
import { parseLoanStatus, parsePage } from "@/lib/validation/filters";

export const metadata: Metadata = { title: "Loan portfolio | RTA" };
export const dynamic = "force-dynamic";

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const context = await requirePermission(PERMISSIONS.LOANS_VIEW_ALL, "/admin/loans");
  const associationId = resolveAssociationScope(context);
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const status = parseLoanStatus(params.status);

  const data = await listLoans(associationId, {
    page: parsePage(params.page),
    search,
    status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan portfolio"
        description="Every loan the association has on its books."
      />
      <LoanPortfolioView
        data={data}
        basePath="/admin/loans"
        search={search}
        status={status}
        applicationsPath="/admin/loans/applications"
      />
    </div>
  );
}
