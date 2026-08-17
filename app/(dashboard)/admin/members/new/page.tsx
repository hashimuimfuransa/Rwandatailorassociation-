import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getDashboardCopy } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n/fill";
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
  const { d } = await getDashboardCopy();
  const copy = d.admin.members;

  // A super admin browsing platform-wide has no single register to add to,
  // and guessing one would put the member in the wrong association.
  if (!associationId) {
    return (
      <div>
        <PageHeader
          title={copy.newTitle}
          description={copy.newDescriptionPlain}
        />
        <Alert variant="info" title={copy.noAssociationTitle}>
          {copy.noAssociationBody}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.newTitle}
        description={fill(copy.newDescription, {
          association: context.association?.name ?? d.nav.association,
        })}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/members">{copy.backToRegister}</Link>
          </Button>
        }
      />

      <MemberForm />
    </div>
  );
}
