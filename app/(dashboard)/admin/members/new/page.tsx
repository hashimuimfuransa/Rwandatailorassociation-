import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MemberForm } from "@/components/dashboard/MemberForm";

export const metadata: Metadata = { title: "Enrol a member | RTA" };
export const dynamic = "force-dynamic";

export default async function NewMemberPage() {
  const context = await requirePermission(
    PERMISSIONS.MEMBERS_CREATE,
    "/admin/members/new"
  );
  const associationId = resolveAssociationScope(context);

  // A super admin browsing platform-wide has no single register to add to,
  // and guessing one would put the member in the wrong association.
  if (!associationId) {
    return (
      <div>
        <PageHeader
          title="Enrol a member"
          description="Add someone to the association's register."
        />
        <Alert variant="info" title="No association selected">
          Members belong to one association. Open an association from the
          platform directory before enrolling anyone.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrol a member"
        description={`Add someone to ${context.association?.name ?? "the association"}'s register directly, without waiting for them to sign up.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/members">Back to register</Link>
          </Button>
        }
      />

      <MemberForm />
    </div>
  );
}
