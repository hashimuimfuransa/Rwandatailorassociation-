import type { Metadata } from "next";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getDashboardCopy } from "@/lib/i18n/server";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { AuditLogTable } from "@/components/dashboard/AuditLogTable";

export const metadata: Metadata = { title: "Audit log | RTA" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  const context = await requirePermission(PERMISSIONS.AUDIT_VIEW, "/admin/audit");
  const associationId = resolveAssociationScope(context);
  const params = await searchParams;
  const { d } = await getDashboardCopy();

  return (
    <div>
      <PageHeader
        title={d.admin.audit.title}
        description={d.admin.audit.description}
      />

      <AuditLogTable
        associationId={associationId}
        page={Math.max(1, Number(params.page) || 1)}
        action={params.action}
      />
    </div>
  );
}
