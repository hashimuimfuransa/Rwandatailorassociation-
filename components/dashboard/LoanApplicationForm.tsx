"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, gt, lt, parseMoneyInput } from "@/lib/money";
import { generateSchedule } from "@/lib/services/loan-calculator";
import type { ChargeType, InterestMethod, RepaymentFrequency } from "@/lib/generated/prisma/enums";

/**
 * Loan application form with a live repayment preview.
 *
 * The preview runs the SAME `generateSchedule` the server uses at
 * disbursement. That is the point: a member should see the real instalment,
 * the real total interest and — most importantly — the real amount that will
 * reach them after fees, before they commit. Showing an approximation here and
 * a different figure at disbursement is how associations lose members' trust.
 *
 * It remains a preview. Eligibility and final terms are decided server-side.
 */

interface Product {
  id: string;
  name: string;
  description: string | null;
  interestRate: string;
  interestMethod: InterestMethod;
  minAmount: string;
  maxAmount: string;
  minimumSavings: string;
  savingsMultiplier: string;
  minTermMonths: number;
  maxTermMonths: number;
  allowedFrequencies: RepaymentFrequency[];
  defaultFrequency: RepaymentFrequency;
  processingFeeType: ChargeType;
  processingFeeValue: string;
  insuranceFeeType: ChargeType;
  insuranceFeeValue: string;
  requiresGuarantors: boolean;
  minimumGuarantors: number;
  minimumMembershipMonths: number;
  singleActiveLoan: boolean;
  maxEligible: string;
  eligible: boolean;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every two weeks",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};

export function LoanApplicationForm({
  products,
  savingsBalance,
  membershipMonths,
}: {
  products: Product[];
  savingsBalance: string;
  membershipMonths: number;
}) {
  const router = useRouter();

  const [productId, setProductId] = useState(
    products.find((p) => p.eligible)?.id ?? products[0].id
  );
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [frequency, setFrequency] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [guarantors, setGuarantors] = useState<{ fullName: string; phone: string }[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const product = products.find((p) => p.id === productId)!;

  const effectiveTerm = termMonths || String(product.minTermMonths);
  const effectiveFrequency = (frequency || product.defaultFrequency) as RepaymentFrequency;

  const preview = useMemo(() => {
    const parsed = parseMoneyInput(amount, { allowZero: false });
    if (!parsed.ok) return null;

    const term = Number(effectiveTerm);
    if (!Number.isInteger(term) || term < 1) return null;

    try {
      return generateSchedule({
        principal: parsed.value,
        annualRate: product.interestRate,
        method: product.interestMethod,
        termMonths: term,
        frequency: effectiveFrequency,
        processingFeeType: product.processingFeeType,
        processingFeeValue: product.processingFeeValue,
        insuranceFeeType: product.insuranceFeeType,
        insuranceFeeValue: product.insuranceFeeValue,
      });
    } catch {
      return null;
    }
  }, [amount, effectiveTerm, effectiveFrequency, product]);

  const amountIssue = useMemo(() => {
    const parsed = parseMoneyInput(amount, { allowZero: false });
    if (!parsed.ok) return null;
    if (lt(parsed.value, product.minAmount)) {
      return `The smallest loan under ${product.name} is ${formatMoney(product.minAmount)}`;
    }
    if (gt(parsed.value, product.maxEligible)) {
      return `Based on your savings of ${formatMoney(savingsBalance)}, you can borrow up to ${formatMoney(product.maxEligible)}`;
    }
    return null;
  }, [amount, product, savingsBalance]);

  const termIssue =
    Number(effectiveTerm) < product.minTermMonths ||
    Number(effectiveTerm) > product.maxTermMonths
      ? `The repayment period must be between ${product.minTermMonths} and ${product.maxTermMonths} months`
      : null;

  const guarantorIssue =
    product.requiresGuarantors &&
    guarantors.filter((g) => g.fullName.trim()).length < product.minimumGuarantors
      ? `This product requires ${product.minimumGuarantors} guarantor(s)`
      : null;

  const canSubmit =
    product.eligible &&
    preview !== null &&
    !amountIssue &&
    !termIssue &&
    !guarantorIssue &&
    purpose.trim().length >= 10 &&
    !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/loan-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanProductId: productId,
          amount: preview ? preview.principal : amount,
          purpose: purpose.trim(),
          termMonths: Number(effectiveTerm),
          frequency: effectiveFrequency,
          guarantors: guarantors
            .filter((g) => g.fullName.trim())
            .map((g) => ({ fullName: g.fullName.trim(), phone: g.phone.trim() || undefined })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload?.error?.details) setFieldErrors(payload.error.details);
        setError(payload?.error?.message ?? "Could not submit your application");
        setSubmitting(false);
        return;
      }

      setSuccess(payload.reference);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Alert variant="success" title="Application submitted">
        Your loan application <strong>{success}</strong> has been received. You
        will be notified once it has been reviewed.{" "}
        <a href="/dashboard/loans" className="font-semibold underline">
          Track it here
        </a>
        .
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3" noValidate>
      <div className="space-y-5 lg:col-span-2">
        {error && <Alert variant="error">{error}</Alert>}

        {fieldErrors._ && (
          <Alert variant="error" title="You are not eligible for this loan">
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {fieldErrors._.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <Field id="loan-product" label="Loan product" required>
            {() => (
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger id="loan-product">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {p.interestRate}% p.a.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>

          {product.description && (
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {product.description}
            </p>
          )}

          {!product.eligible && (
            <Alert variant="warning" className="mt-4">
              You do not currently meet the requirements for this product. It needs
              at least {formatMoney(product.minimumSavings)} in savings
              {product.minimumMembershipMonths > 0 &&
                ` and ${product.minimumMembershipMonths} months of membership`}
              . You have {formatMoney(savingsBalance)} and {membershipMonths} month
              {membershipMonths === 1 ? "" : "s"}.
            </Alert>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              id="loan-amount"
              label="Amount you need"
              error={amountIssue ?? fieldErrors.amount}
              hint={`Up to ${formatMoney(product.maxEligible)} based on your savings`}
              required
            >
              {(props) => (
                <Input
                  {...props}
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="500000"
                />
              )}
            </Field>

            <Field
              id="loan-term"
              label="Repayment period (months)"
              error={termIssue}
              hint={`Between ${product.minTermMonths} and ${product.maxTermMonths} months`}
              required
            >
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  placeholder={String(product.minTermMonths)}
                />
              )}
            </Field>
          </div>

          <div className="mt-5">
            <Field id="loan-frequency" label="Repayment frequency" required>
              {() => (
                <Select
                  value={effectiveFrequency}
                  onValueChange={setFrequency}
                >
                  <SelectTrigger id="loan-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(product.allowedFrequencies.length
                      ? product.allowedFrequencies
                      : [product.defaultFrequency]
                    ).map((f) => (
                      <SelectItem key={f} value={f}>
                        {FREQUENCY_LABELS[f] ?? f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>

          <div className="mt-5">
            <Field
              id="loan-purpose"
              label="What is the loan for?"
              error={fieldErrors.purpose}
              hint="Be specific — it helps the review committee decide"
              required
            >
              {(props) => (
                <Textarea
                  {...props}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Buy two industrial sewing machines to take on school uniform contracts"
                  rows={3}
                />
              )}
            </Field>
          </div>
        </div>

        {product.requiresGuarantors && (
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h3 className="font-heading text-base font-semibold text-ink">
              Guarantors
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              This product requires {product.minimumGuarantors} guarantor
              {product.minimumGuarantors === 1 ? "" : "s"}.
            </p>

            <div className="mt-4 space-y-3">
              {Array.from({ length: Math.max(product.minimumGuarantors, guarantors.length) }).map(
                (_, index) => (
                  <div key={index} className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={guarantors[index]?.fullName ?? ""}
                      onChange={(e) => {
                        const next = [...guarantors];
                        next[index] = { ...next[index], fullName: e.target.value, phone: next[index]?.phone ?? "" };
                        setGuarantors(next);
                      }}
                      placeholder={`Guarantor ${index + 1} full name`}
                      aria-label={`Guarantor ${index + 1} full name`}
                    />
                    <Input
                      value={guarantors[index]?.phone ?? ""}
                      onChange={(e) => {
                        const next = [...guarantors];
                        next[index] = { ...next[index], phone: e.target.value, fullName: next[index]?.fullName ?? "" };
                        setGuarantors(next);
                      }}
                      placeholder="Phone number"
                      aria-label={`Guarantor ${index + 1} phone`}
                    />
                  </div>
                )
              )}
            </div>

            {guarantorIssue && (
              <p className="mt-2 text-xs font-medium text-red-600">{guarantorIssue}</p>
            )}
          </div>
        )}

        <Button type="submit" size="lg" disabled={!canSubmit}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Submit application
            </>
          )}
        </Button>
      </div>

      {/* Live repayment preview */}
      <aside className="lg:col-span-1">
        <div className="sticky top-24 rounded-2xl border border-primary/25 bg-primary-50 p-5">
          <h3 className="font-heading text-base font-semibold text-primary-hover">
            What you would repay
          </h3>

          {!preview ? (
            <p className="mt-3 text-sm text-primary-hover/80">
              Enter an amount and a repayment period to see your schedule.
            </p>
          ) : (
            <>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Line label="Loan amount" value={formatMoney(preview.principal)} />
                <Line label="Processing fee" value={formatMoney(preview.processingFee)} />
                <Line label="Insurance fee" value={formatMoney(preview.insuranceFee)} />
                <Line
                  label="You receive"
                  value={formatMoney(preview.netDisbursement)}
                  strong
                />
                <div className="border-t border-primary/20 pt-2.5">
                  <Line
                    label={`Interest (${product.interestRate}% ${product.interestMethod === "FLAT" ? "flat" : "reducing"})`}
                    value={formatMoney(preview.totalInterest)}
                  />
                  <Line
                    label="Total to repay"
                    value={formatMoney(preview.totalPayable)}
                    strong
                  />
                </div>
              </dl>

              <div className="mt-4 rounded-xl bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover">
                  {FREQUENCY_LABELS[effectiveFrequency] ?? effectiveFrequency} payment
                </p>
                <p className="mt-1 font-heading text-xl font-bold text-primary-hover">
                  {formatMoney(preview.instalments[1]?.totalDue ?? preview.instalments[0].totalDue)}
                </p>
                <p className="mt-1 text-xs text-primary-hover/75">
                  {preview.instalments.length} payments · first due{" "}
                  {preview.instalments[0].dueDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-xs text-primary-hover/75">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                The first payment includes the fees, so it is larger than the rest.
                Final terms are confirmed on approval.
              </p>
            </>
          )}
        </div>
      </aside>
    </form>
  );
}

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={strong ? "font-semibold text-primary-hover" : "text-primary-hover/80"}>
        {label}
      </dt>
      <dd
        className={`tabular-nums ${strong ? "font-heading text-base font-bold text-primary-hover" : "font-medium text-primary-hover"}`}
      >
        {value}
      </dd>
    </div>
  );
}
