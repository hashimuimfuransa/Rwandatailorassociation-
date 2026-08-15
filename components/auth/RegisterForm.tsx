"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { PasswordStrength } from "@/components/ui/password-strength";
import { assessPasswordStrength } from "@/lib/auth/password.shared";
import { isValidRwandanPhone } from "@/lib/phone";

/**
 * Membership application form.
 *
 * Replaces the Google Form iframe that previously sat on this page.
 * Applications now land directly in the association's database, which is what
 * lets an administrator review them, and what gives each applicant a payment
 * reference — the key every incoming payment is matched on.
 */

interface SuccessState {
  memberNumber: string;
  paymentReference: string;
  message: string;
}

const INITIAL = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  nationalId: "",
  occupation: "",
  district: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterForm() {
  const [values, setValues] = useState(INITIAL);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [copied, setCopied] = useState(false);

  function update(field: keyof typeof INITIAL, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string[]> = {};

    if (values.firstName.trim().length < 2) next.firstName = ["Enter your first name"];
    if (values.lastName.trim().length < 2) next.lastName = ["Enter your last name"];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) {
      next.email = ["Enter a valid email address"];
    }
    if (!isValidRwandanPhone(values.phone)) {
      next.phone = ["Enter a valid Rwandan mobile number, e.g. 0788123456"];
    }
    if (values.nationalId && !/^\d{16}$/.test(values.nationalId.trim())) {
      next.nationalId = ["The national ID must be 16 digits"];
    }

    const strength = assessPasswordStrength(values.password);
    if (!strength.acceptable) {
      next.password = strength.issues.length ? strength.issues : ["Choose a stronger password"];
    }
    if (values.password !== values.confirmPassword) {
      next.confirmPassword = ["Passwords do not match"];
    }
    if (!acceptedTerms) {
      next.acceptedTerms = ["You must accept the association rules to register"];
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, acceptedTerms }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload?.error?.details) setErrors(payload.error.details);
        setFormError(payload?.error?.message ?? "Could not submit your application.");
        setSubmitting(false);
        return;
      }

      setSuccess(payload as SuccessState);
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto mt-10 max-w-2xl">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-card sm:p-10">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </span>

          <h3 className="mt-6 font-heading text-2xl font-bold text-ink">
            Application received
          </h3>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            {success.message}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Membership number
              </dt>
              <dd className="mt-1.5 font-heading text-lg font-bold text-ink">
                {success.memberNumber}
              </dd>
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-primary-hover">
                Your payment reference
              </dt>
              <dd className="mt-1.5 flex items-center gap-2">
                <span className="font-heading text-lg font-bold text-primary-hover">
                  {success.paymentReference}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(success.paymentReference);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10"
                  aria-label="Copy payment reference"
                >
                  {copied ? (
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                  ) : (
                    <Copy className="size-4" aria-hidden="true" />
                  )}
                </button>
              </dd>
            </div>
          </dl>

          {/*
            The single most important instruction on this page. A payment that
            arrives without this reference cannot be attributed automatically
            and waits in an administrator's unmatched queue.
          */}
          <Alert variant="info" className="mt-6">
            <strong className="font-semibold">Keep your payment reference.</strong>{" "}
            Quote <strong>{success.paymentReference}</strong> on every payment you
            make to the association. It is how your contribution is matched to
            your savings account.
          </Alert>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/login">Go to sign in</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">Back to homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8"
    >
      {formError && (
        <Alert variant="error" className="mb-6">
          {formError}
        </Alert>
      )}

      <fieldset className="space-y-5" disabled={submitting}>
        <legend className="sr-only">Your details</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="firstName" label="First name" error={errors.firstName} required>
            {(props) => (
              <Input
                {...props}
                value={values.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                autoComplete="given-name"
                placeholder="Jean"
              />
            )}
          </Field>

          <Field id="lastName" label="Last name" error={errors.lastName} required>
            {(props) => (
              <Input
                {...props}
                value={values.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                autoComplete="family-name"
                placeholder="Uwimana"
              />
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="email" label="Email address" error={errors.email} required>
            {(props) => (
              <Input
                {...props}
                type="email"
                value={values.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            )}
          </Field>

          <Field
            id="phone"
            label="Mobile number"
            error={errors.phone}
            hint="Used for payment matching and SMS alerts"
            required
          >
            {(props) => (
              <Input
                {...props}
                type="tel"
                value={values.phone}
                onChange={(e) => update("phone", e.target.value)}
                autoComplete="tel"
                placeholder="0788123456"
              />
            )}
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="nationalId"
            label="National ID"
            error={errors.nationalId}
            hint="16 digits — optional, speeds up verification"
          >
            {(props) => (
              <Input
                {...props}
                inputMode="numeric"
                value={values.nationalId}
                onChange={(e) => update("nationalId", e.target.value)}
                placeholder="1199012345678901"
                maxLength={16}
              />
            )}
          </Field>

          <Field id="district" label="District" error={errors.district}>
            {(props) => (
              <Input
                {...props}
                value={values.district}
                onChange={(e) => update("district", e.target.value)}
                placeholder="Kicukiro"
              />
            )}
          </Field>
        </div>

        <Field id="occupation" label="Occupation or business" error={errors.occupation}>
          {(props) => (
            <Input
              {...props}
              value={values.occupation}
              onChange={(e) => update("occupation", e.target.value)}
              placeholder="Tailor, fashion designer, textile trader…"
            />
          )}
        </Field>

        <hr className="border-border" />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="password" label="Password" error={errors.password} required>
            {(props) => (
              <div className="relative">
                <Input
                  {...props}
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => update("password", e.target.value)}
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </Field>

          <Field
            id="confirmPassword"
            label="Confirm password"
            error={errors.confirmPassword}
            required
          >
            {(props) => (
              <Input
                {...props}
                type={showPassword ? "text" : "password"}
                value={values.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                autoComplete="new-password"
                placeholder="Re-enter your password"
              />
            )}
          </Field>
        </div>

        {values.password && <PasswordStrength password={values.password} />}

        <div className="space-y-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.acceptedTerms;
                  return next;
                });
              }}
              className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border accent-[var(--color-primary)]"
            />
            <span className="text-sm leading-relaxed text-ink-muted">
              I confirm the details above are correct and I accept the Rwanda
              Tailors Association savings and loan rules.
            </span>
          </label>

          {errors.acceptedTerms && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {errors.acceptedTerms[0]}
            </p>
          )}
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="mt-8 w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Submitting application…
          </>
        ) : (
          <>
            <UserPlus className="size-4" aria-hidden="true" />
            Submit membership application
          </>
        )}
      </Button>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Already a member?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
