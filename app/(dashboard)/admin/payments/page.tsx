import type { Metadata } from "next";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listPayments } from "@/lib/services/admin-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { PaymentsView } from "@/components/dashboard/PaymentsView";
import { parsePaymentStatus, parsePage } from "@/lib/validation/filters";

export const metadata: Metadata = { title: "Payments | RTA" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    flagged?: string;
  }>;
}) {
  const context = await requirePermission(PERMISSIONS.PAYMENTS_VIEW, "/admin/payments");
  const associationId = resolveAssociationScope(context);
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const status = parsePaymentStatus(params.status);
  const suspiciousOnly = params.flagged === "1";

  const data = await listPayments(associationId, {
    page: parsePage(params.page),
    search,
    status,
    suspiciousOnly,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every payment the association has received from the provider."
      />
      <PaymentsView
        data={data}
        basePath="/admin/payments"
        search={search}
        status={status}
        suspiciousOnly={suspiciousOnly}
        unmatchedPath="/admin/payments/unmatched"
      />
    </div>
  );
}
