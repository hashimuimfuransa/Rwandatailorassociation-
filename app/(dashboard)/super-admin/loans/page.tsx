import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { listLoans } from "@/lib/services/admin-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { LoanPortfolioView } from "@/components/dashboard/LoanPortfolioView";
import { parseLoanStatus, parsePage } from "@/lib/validation/filters";

export const metadata: Metadata = { title: "Loan portfolio | RTA" };
export const dynamic = "force-dynamic";

export default async function PlatformLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await requireSuperAdmin("/super-admin/loans");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const status = parseLoanStatus(params.status);

  const data = await listLoans(null, {
    page: parsePage(params.page),
    search,
    status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan portfolio"
        description="Every loan on the platform, across all associations."
      />
      <LoanPortfolioView
        data={data}
        basePath="/super-admin/loans"
        search={search}
        status={status}
      />
    </div>
  );
}
