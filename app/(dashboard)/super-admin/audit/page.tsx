import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { AuditLogTable } from "@/components/dashboard/AuditLogTable";

export const metadata: Metadata = { title: "Platform audit log | RTA" };
export const dynamic = "force-dynamic";

export default async function SuperAdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  await requireSuperAdmin("/super-admin/audit");
  const params = await searchParams;

  return (
    <div>
      <PageHeader
        title="Platform audit log"
        description="Every consequential action across every association."
      />

      {/* null scope = platform-wide, which only a super admin ever gets. */}
      <AuditLogTable
        associationId={null}
        page={Math.max(1, Number(params.page) || 1)}
        action={params.action}
      />
    </div>
  );
}
