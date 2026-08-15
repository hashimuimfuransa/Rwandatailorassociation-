import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Banknote, Building2, PiggyBank, Settings as SettingsIcon } from "lucide-react";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAssociationSettings, getSettings } from "@/lib/services/admin-queries";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { SettingsTable } from "@/components/dashboard/SettingsTable";

export const metadata: Metadata = { title: "Association settings | RTA" };
export const dynamic = "force-dynamic";

const DATE = { day: "numeric", month: "short", year: "numeric" } as const;

export default async function AdminSettingsPage() {
  const context = await requirePermission(
    PERMISSIONS.ASSOCIATION_SETTINGS,
    "/admin/settings"
  );
  const associationId = resolveAssociationScope(context);

  // A super admin browsing without choosing a tenant has no single association
  // to configure; the platform screen is the right place for that.
  if (!associationId) {
    return (
      <div>
        <PageHeader
          title="Association settings"
          description="Configuration for a single association."
        />
        <Alert variant="info" title="No association selected">
          These settings belong to one association. Open an association from the
          platform directory, or use platform settings for global configuration.
        </Alert>
      </div>
    );
  }

  const [data, settings] = await Promise.all([
    getAssociationSettings(associationId),
    getSettings("ASSOCIATION", associationId),
  ]);

  if (!data) notFound();

  const { association, savingsRule } = data;
  const currency = association.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Association settings"
        description={`Configuration for ${association.name}.`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel icon={Building2} title="Profile">
          <Row label="Name" value={association.name} />
          <Row label="Legal name" value={association.legalName ?? "—"} />
          <Row label="Code" value={association.code} mono />
          <Row
            label="Status"
            value={<StatusBadge status={association.status} size="sm" />}
          />
          <Row label="Registration no." value={association.registrationNo ?? "—"} mono />
          <Row label="Tax id" value={association.taxId ?? "—"} mono />
          <Row label="Currency" value={association.currency} />
          <Row label="Timezone" value={association.timezone} />
          <Row
            label="Created"
            value={association.createdAt.toLocaleDateString("en-GB", DATE)}
          />
        </Panel>

        <Panel icon={SettingsIcon} title="Contact">
          <Row label="Email" value={association.email ?? "—"} />
          <Row label="Phone" value={association.phone ?? "—"} />
          <Row label="Website" value={association.website ?? "—"} />
          <Row
            label="Address"
            value={
              [
                association.addressLine1,
                association.addressLine2,
                association.city,
                association.district,
                association.province,
                association.country,
              ]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          <Row label="Members" value={String(association._count.members)} />
          <Row label="Administrators" value={String(association._count.users)} />
          <Row label="Loan products" value={String(association._count.loanProducts)} />
        </Panel>

        <Panel icon={Banknote} title="Collection account">
          <Row label="Bank" value={association.bankName ?? "—"} />
          <Row label="Account name" value={association.bankAccountName ?? "—"} />
          <Row label="Account number" value={association.bankAccountNumber ?? "—"} mono />
          <Row label="Branch code" value={association.bankBranchCode ?? "—"} mono />
          <Row
            label="Reference sequence"
            value={String(association.memberRefSequence)}
            hint="Next member payment reference is minted from this counter"
          />
        </Panel>

        <Panel icon={PiggyBank} title="Savings and withdrawal rules">
          {savingsRule ? (
            <>
              <Row
                label="Minimum deposit"
                value={formatMoney(savingsRule.minimumDeposit, { currency })}
              />
              <Row
                label="Maximum deposit"
                value={
                  savingsRule.maximumDeposit
                    ? formatMoney(savingsRule.maximumDeposit, { currency })
                    : "No limit"
                }
              />
              <Row
                label="Minimum balance"
                value={formatMoney(savingsRule.minimumBalance, { currency })}
              />
              <Row
                label="Withdrawals"
                value={savingsRule.allowWithdrawals ? "Allowed" : "Suspended"}
              />
              <Row
                label="Approval required"
                value={savingsRule.withdrawalRequiresApproval ? "Yes" : "No"}
              />
              <Row
                label="Withdrawal fee"
                value={
                  savingsRule.withdrawalFeeType === "PERCENTAGE"
                    ? `${savingsRule.withdrawalFeeValue}%`
                    : formatMoney(savingsRule.withdrawalFeeValue, { currency })
                }
              />
              <Row
                label="Notice period"
                value={`${savingsRule.withdrawalNoticeDays} day(s)`}
              />
              <Row
                label="Monthly contribution"
                value={
                  savingsRule.monthlyContribution
                    ? `${formatMoney(savingsRule.monthlyContribution, { currency })}${
                        savingsRule.contributionDueDay
                          ? `, due day ${savingsRule.contributionDueDay}`
                          : ""
                      }`
                    : "Not enforced"
                }
              />
              <Row
                label="Annual interest"
                value={`${savingsRule.annualInterestRate}%`}
              />
            </>
          ) : (
            <p className="py-3 text-sm text-ink-muted">
              No savings rule is configured, so platform defaults apply: deposits
              are unrestricted and withdrawals require approval.
            </p>
          )}
        </Panel>
      </div>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Stored configuration
        </h2>
        <SettingsTable
          settings={settings}
          emptyMessage="This association has no stored settings; platform defaults apply to everything."
        />
      </section>

      <p className="rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
        This screen is read-only. Changing a financial rule alters how every
        future deposit, withdrawal and loan is calculated, so edits are made
        through a migration or by a platform administrator, and every change is
        recorded in the audit log.
      </p>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
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
  hint,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-ink-muted">
        {label}
        {hint && <span className="mt-0.5 block text-[11px] text-ink-muted/80">{hint}</span>}
      </dt>
      <dd
        className={`text-right text-sm font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
