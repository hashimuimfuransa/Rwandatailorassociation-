import type { Metadata } from "next";
import { Building2, Info, Smartphone } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { Alert } from "@/components/ui/alert";
import { PaymentReferenceCard } from "@/components/dashboard/PaymentReferenceCard";

export const metadata: Metadata = { title: "Make a deposit | RTA" };
export const dynamic = "force-dynamic";

/**
 * Deposit instructions.
 *
 * NOTE ON SCOPE: this page tells a member how to pay; it does not initiate a
 * payment. That is deliberate. The platform is a receiver of funds — it reads
 * the association's bank statement and credits members. Letting the app push
 * payments would mean holding credentials that can move money out, for no gain
 * a member cannot get from their own mobile money menu.
 *
 * Everything here therefore centres on the payment reference, because a
 * payment quoting it is credited automatically and one without it waits in an
 * administrator's queue.
 */
export default async function DepositPage() {
  const context = await requireMember("/dashboard/savings/deposit");

  const [association, rule] = await Promise.all([
    prisma.association.findUniqueOrThrow({
      where: { id: context.user.associationId! },
      select: {
        name: true,
        bankName: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankBranchCode: true,
        phone: true,
      },
    }),
    prisma.savingsRule.findUnique({
      where: { associationId: context.user.associationId! },
      select: { minimumDeposit: true, monthlyContribution: true, contributionDueDay: true },
    }),
  ]);

  const reference = context.member!.paymentReference;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Make a deposit"
        description="How to send money to your savings account."
      />

      <PaymentReferenceCard reference={reference} />

      <Alert variant="warning" title="Always quote your reference">
        A payment that arrives without <strong>{reference}</strong> cannot be
        matched to you automatically. It will be held until an administrator
        identifies it by hand, which delays your balance updating.
      </Alert>

      {association.bankAccountNumber ? (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
            <Building2 className="size-4 text-primary" aria-hidden="true" />
            Bank transfer
          </h2>

          <dl className="mt-4 divide-y divide-border">
            <Row label="Bank" value={association.bankName ?? "—"} />
            <Row
              label="Account name"
              value={association.bankAccountName ?? association.name}
            />
            <Row label="Account number" value={association.bankAccountNumber} mono />
            {association.bankBranchCode && (
              <Row label="Branch code" value={association.bankBranchCode} mono />
            )}
            <Row label="Reference to quote" value={reference} mono highlight />
          </dl>
        </section>
      ) : (
        <Alert variant="info">
          The association has not yet published its collection account details.
          Please contact the office
          {association.phone ? ` on ${association.phone}` : ""} for payment
          instructions, and quote <strong>{reference}</strong>.
        </Alert>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
          <Smartphone className="size-4 text-primary" aria-hidden="true" />
          Mobile money
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          When paying by mobile money, enter{" "}
          <strong className="text-ink">{reference}</strong> in the reason or
          reference field. Payments are collected from the association&rsquo;s bank
          account and matched automatically — your balance normally updates within
          15 minutes of the money arriving.
        </p>
      </section>

      {rule && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
            <Info className="size-4 text-primary" aria-hidden="true" />
            Contribution rules
          </h2>

          <dl className="mt-4 divide-y divide-border">
            <Row
              label="Minimum deposit"
              value={formatMoney(rule.minimumDeposit.toFixed(2))}
            />
            {rule.monthlyContribution && (
              <Row
                label="Expected monthly contribution"
                value={formatMoney(rule.monthlyContribution.toFixed(2))}
              />
            )}
            {rule.contributionDueDay && (
              <Row
                label="Due each month by"
                value={`Day ${rule.contributionDueDay}`}
              />
            )}
          </dl>
        </section>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd
        className={`text-sm font-semibold ${mono ? "font-mono" : ""} ${
          highlight ? "text-primary" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
