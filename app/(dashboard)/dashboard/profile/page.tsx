import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { getMemberSelfProfile } from "@/lib/services/member-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Profile | RTA" };
export const dynamic = "force-dynamic";

const DATE = { day: "numeric", month: "short", year: "numeric" } as const;

function formatDate(value: Date | null | undefined): string {
  return value ? value.toLocaleDateString("en-GB", DATE) : "—";
}

export default async function MemberProfilePage() {
  const context = await requireMember("/dashboard/profile");
  const profile = await getMemberSelfProfile(context.member!.id);

  // The guard guarantees a member record exists; a miss here means it was
  // deleted between the session check and this query.
  if (!profile) notFound();

  const contactIncomplete = !profile.user.email || !profile.user.phone;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your membership details as they are held by the association."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/account/password">
              <KeyRound className="size-3.5" aria-hidden="true" />
              Change password
            </Link>
          </Button>
        }
      />

      {contactIncomplete && (
        <Alert variant="warning" title="Your contact details are incomplete">
          The association uses your phone and email to notify you about payments,
          loan decisions and withdrawals. Ask an administrator to update them.
        </Alert>
      )}

      {/* Payment reference first — it is the single most consequential thing on
          this page, because a payment made without it may not be credited. */}
      <section className="rounded-2xl border border-primary/25 bg-primary-50 p-5">
        <p className="text-[13px] font-semibold uppercase tracking-wider text-primary-hover">
          Your payment reference
        </p>
        <p className="mt-2 font-mono text-2xl font-bold tracking-wide text-ink">
          {profile.paymentReference}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Quote this on every deposit so it is credited to your account
          automatically. A payment without it has to be matched by hand and will
          take longer to appear.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel icon={UserRound} title="Membership">
          <Row label="Full name" value={`${profile.user.firstName} ${profile.user.lastName}`.trim()} />
          <Row label="Member number" value={profile.memberNumber} mono />
          <Row
            label="Status"
            value={<StatusBadge status={profile.status} size="sm" />}
          />
          <Row
            label="Identity check"
            value={<StatusBadge status={profile.kycStatus} size="sm" />}
          />
          <Row label="Association" value={profile.association.name} />
          <Row label="Joined" value={formatDate(profile.joinedAt ?? profile.createdAt)} />
          <Row label="Approved" value={formatDate(profile.approvedAt)} />
        </Panel>

        <Panel icon={ShieldCheck} title="Contact and security">
          <Row label="Email" value={profile.user.email ?? "—"} />
          <Row
            label="Email verified"
            value={profile.user.emailVerifiedAt ? "Yes" : "Not verified"}
          />
          <Row label="Phone" value={profile.user.phone ?? "—"} />
          <Row
            label="Phone verified"
            value={profile.user.phoneVerifiedAt ? "Yes" : "Not verified"}
          />
          <Row
            label="Two-factor"
            value={profile.user.twoFactorEnabled ? "Enabled" : "Disabled"}
          />
          <Row
            label="Password changed"
            value={formatDate(profile.user.passwordChangedAt)}
          />
          <Row label="Last sign-in" value={formatDate(profile.user.lastLoginAt)} />
        </Panel>

        <Panel icon={UserRound} title="Personal details">
          <Row label="National ID" value={profile.nationalId ?? "—"} mono />
          <Row label="Date of birth" value={formatDate(profile.dateOfBirth)} />
          <Row
            label="Gender"
            value={profile.gender ? titleCase(profile.gender) : "—"}
          />
          <Row label="Occupation" value={profile.occupation ?? "—"} />
          <Row label="Business" value={profile.businessName ?? "—"} />
          <Row
            label="Address"
            value={
              [profile.addressLine1, profile.city, profile.district, profile.province]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
        </Panel>

        <Panel icon={ShieldCheck} title="Payout and next of kin">
          <Row label="Mobile money" value={profile.mobileMoneyNumber ?? "—"} mono />
          <Row label="Bank account" value={profile.bankAccountNumber ?? "—"} mono />
          <Row label="Next of kin" value={profile.nextOfKinName ?? "—"} />
          <Row label="Their phone" value={profile.nextOfKinPhone ?? "—"} />
          <Row label="Relationship" value={profile.nextOfKinRelation ?? "—"} />
        </Panel>
      </div>

      <p className="rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
        These details are maintained by the association. To correct anything on
        this page, contact{" "}
        {profile.association.email ? (
          <a
            href={`mailto:${profile.association.email}`}
            className="font-semibold text-primary hover:underline"
          >
            {profile.association.email}
          </a>
        ) : (
          "an administrator"
        )}
        {profile.association.phone ? ` or call ${profile.association.phone}` : ""}.
      </p>
    </div>
  );
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-ink">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {title}
      </h2>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd
        className={`text-right text-sm font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
