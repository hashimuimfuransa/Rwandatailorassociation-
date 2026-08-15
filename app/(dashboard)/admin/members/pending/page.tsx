import type { Metadata } from "next";
import { UserCheck } from "lucide-react";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listMembers } from "@/lib/services/members";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { PendingMembersTable } from "@/components/dashboard/PendingMembersTable";

export const metadata: Metadata = { title: "Pending approvals | RTA" };
export const dynamic = "force-dynamic";

export default async function PendingMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const context = await requirePermission(
    PERMISSIONS.MEMBERS_APPROVE,
    "/admin/members/pending"
  );

  const associationId = resolveAssociationScope(context);
  const params = await searchParams;

  const data = await listMembers({
    associationId,
    status: "PENDING_APPROVAL",
    page: Number(params.page) || 1,
  });

  return (
    <div>
      <PageHeader
        title="Pending approvals"
        description="Membership applications awaiting a decision."
      />

      {data.total === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Nothing waiting"
          description="Every membership application has been reviewed. New applications will appear here."
        />
      ) : (
        <>
          <Alert variant="info" className="mb-5">
            Approving activates the member&rsquo;s login and opens their savings
            account. They will be sent their payment reference, which is what
            their contributions are matched on.
          </Alert>

          <PendingMembersTable
            members={data.members}
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
          />
        </>
      )}
    </div>
  );
}
