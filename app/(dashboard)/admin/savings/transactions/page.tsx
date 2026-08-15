import type { Metadata } from "next";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listTransactions } from "@/lib/services/admin-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { TransactionsView } from "@/components/dashboard/TransactionsView";
import { parseTransactionType } from "@/lib/validation/filters";

export const metadata: Metadata = { title: "Transactions | RTA" };
export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    type?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  const context = await requirePermission(
    PERMISSIONS.SAVINGS_VIEW_ALL,
    "/admin/savings/transactions"
  );
  const associationId = resolveAssociationScope(context);
  const params = await searchParams;

  const data = await listTransactions(associationId, {
    page: Number(params.page) || 1,
    type: parseTransactionType(params.type),
    from: params.from ? new Date(params.from) : undefined,
    to: params.to ? new Date(`${params.to}T23:59:59`) : undefined,
    search: params.q?.trim() || undefined,
  });

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Every movement across every member's savings account."
      />
      <TransactionsView data={data} basePath="/admin/savings/transactions" />
    </div>
  );
}
