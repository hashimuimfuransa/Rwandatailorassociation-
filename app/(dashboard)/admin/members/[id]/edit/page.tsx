import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assertSameAssociation,
  requirePermission,
} from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getMemberProfile } from "@/lib/services/members";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { MemberForm } from "@/components/dashboard/MemberForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberProfile(id);
  return {
    title: member
      ? `Edit ${member.user.firstName} ${member.user.lastName} | RTA`
      : "Edit member | RTA",
  };
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission(
    PERMISSIONS.MEMBERS_UPDATE,
    `/admin/members/${id}/edit`
  );

  const member = await getMemberProfile(id);
  if (!member) notFound();

  // The id came from the URL, so tenant isolation is asserted after loading
  // rather than assumed.
  assertSameAssociation(context, member, "Member");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${member.user.firstName} ${member.user.lastName}`.trim()}
        description={`Member ${member.memberNumber}. Their member number and payment reference cannot be changed — those are printed on every payment instruction they hold.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/members/${member.id}`}>Back to member file</Link>
          </Button>
        }
      />

      <MemberForm
        member={{
          id: member.id,
          memberNumber: member.memberNumber,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          phone: member.user.phone ?? "",
          email: member.user.email ?? "",
          nationalId: member.nationalId ?? "",
          // The date input wants YYYY-MM-DD.
          dateOfBirth: member.dateOfBirth?.toISOString().slice(0, 10) ?? "",
          gender: member.gender ?? "",
          occupation: member.occupation ?? "",
          businessName: member.businessName ?? "",
          addressLine1: member.addressLine1 ?? "",
          city: member.city ?? "",
          district: member.district ?? "",
          province: member.province ?? "",
          mobileMoneyNumber: member.mobileMoneyNumber ?? "",
          bankAccountNumber: member.bankAccountNumber ?? "",
          nextOfKinName: member.nextOfKinName ?? "",
          nextOfKinPhone: member.nextOfKinPhone ?? "",
          nextOfKinRelation: member.nextOfKinRelation ?? "",
        }}
      />
    </div>
  );
}
