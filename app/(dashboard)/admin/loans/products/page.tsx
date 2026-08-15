import type { Metadata } from "next";
import { Cog, Percent, Users } from "lucide-react";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listLoanProducts } from "@/lib/services/admin-queries";
import { formatMoney, isZero } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Loan products | RTA" };
export const dynamic = "force-dynamic";

/** "PERCENTAGE" fees are a rate; "FIXED" ones are an amount. */
function formatCharge(type: string, value: string, currency: string): string {
  if (isZero(value)) return "None";
  return type === "PERCENTAGE"
    ? `${value}%`
    : formatMoney(value, { currency, showSymbol: false });
}

export default async function AdminLoanProductsPage() {
  const context = await requirePermission(
    PERMISSIONS.LOAN_PRODUCTS_MANAGE,
    "/admin/loans/products"
  );
  const associationId = resolveAssociationScope(context);
  const products = await listLoanProducts(associationId);
  const currency = context.association?.currency ?? "RWF";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan products"
        description="The rules every loan application is assessed against."
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Cog}
          title="No loan products configured"
          description="Members cannot apply for a loan until at least one product exists. Products are created by seeding or by a platform administrator."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-card"
            >
              <header className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-semibold text-ink">
                    {product.name}
                  </h2>
                  <p className="mt-0.5 font-mono text-xs text-ink-muted">
                    {product.code}
                  </p>
                  {product.description && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                      {product.description}
                    </p>
                  )}
                </div>
                <StatusBadge
                  status={product.isActive ? "ACTIVE" : "INACTIVE"}
                  size="sm"
                />
              </header>

              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Highlight
                  icon={Percent}
                  label="Interest"
                  value={`${product.interestRate}%`}
                  hint={`${product.interestPeriod.toLowerCase()}, ${product.interestMethod
                    .replace(/_/g, " ")
                    .toLowerCase()}`}
                />
                <Highlight
                  icon={Cog}
                  label="Amount"
                  value={formatMoney(product.maxAmount, {
                    currency,
                    showSymbol: false,
                  })}
                  hint={`min ${formatMoney(product.minAmount, { currency, showSymbol: false })}`}
                />
                <Highlight
                  icon={Users}
                  label="In use"
                  value={String(product.loanCount)}
                  hint={`${product.applicationCount} application(s)`}
                />
              </div>

              <dl className="divide-y divide-border text-sm">
                <Row
                  label="Eligibility"
                  value={`${formatMoney(product.minimumSavings, { currency, showSymbol: false })} saved · ${product.minimumMembershipMonths} month(s) membership`}
                />
                <Row
                  label="Savings multiplier"
                  value={`${product.savingsMultiplier}× savings${
                    product.absoluteMaxAmount
                      ? `, capped at ${formatMoney(product.absoluteMaxAmount, { currency, showSymbol: false })}`
                      : ""
                  }`}
                />
                <Row
                  label="Term"
                  value={`${product.minTermMonths}–${product.maxTermMonths} months, ${product.defaultFrequency.toLowerCase()}`}
                />
                <Row
                  label="Processing fee"
                  value={formatCharge(
                    product.processingFeeType,
                    product.processingFeeValue,
                    currency
                  )}
                />
                <Row
                  label="Insurance fee"
                  value={formatCharge(
                    product.insuranceFeeType,
                    product.insuranceFeeValue,
                    currency
                  )}
                />
                <Row
                  label="Late penalty"
                  value={`${formatCharge(product.penaltyType, product.penaltyValue, currency)}${
                    product.penaltyGraceDays > 0
                      ? ` after ${product.penaltyGraceDays} grace day(s)`
                      : ""
                  }`}
                />
                <Row
                  label="Guarantors"
                  value={
                    product.requiresGuarantors
                      ? `${product.minimumGuarantors} required`
                      : "Not required"
                  }
                />
                <Row
                  label="Collateral"
                  value={product.requiresCollateral ? "Required" : "Not required"}
                />
                <Row
                  label="Concurrent loans"
                  value={
                    product.singleActiveLoan
                      ? "One active loan per member"
                      : "Multiple allowed"
                  }
                />
              </dl>
            </article>
          ))}
        </div>
      )}

      <p className="rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
        These rules are advisory in the application form and authoritative on
        submission — eligibility is re-checked server-side when a member applies,
        so changing a product here changes what is actually enforced.
      </p>
    </div>
  );
}

function Highlight({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Cog;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        <Icon className="size-3" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 font-heading text-base font-bold tabular-nums text-ink">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[11px] capitalize text-ink-muted">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
