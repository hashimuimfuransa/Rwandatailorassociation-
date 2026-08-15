"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Loader2, Save, UserPlus } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/**
 * Member enrolment and editing.
 *
 * One component for both, because the two forms ask the same questions and
 * keeping them apart guarantees they drift — a field added to enrolment and
 * forgotten in editing becomes a detail nobody can ever correct.
 *
 * Laid out in the order a paper application is filled in, so an administrator
 * transcribing one reads straight down rather than hunting between sections.
 *
 * Only name and phone are required. Everything else is optional because a
 * half-complete application is still worth recording — refusing to save it
 * means the details end up on a sticky note instead, and the member's file is
 * empty either way.
 *
 * On enrolment the temporary password is shown once afterwards; it is never
 * retrievable again, because the server keeps only a hash. Editing has no such
 * step — it never touches credentials.
 */

interface FieldErrors {
  [field: string]: string[] | undefined;
}

/** An existing member's details, for the edit form. */
export interface MemberFormValues {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  businessName: string;
  addressLine1: string;
  city: string;
  district: string;
  province: string;
  mobileMoneyNumber: string;
  bankAccountNumber: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelation: string;
}

interface CreatedMember {
  memberId: string;
  memberNumber: string;
  paymentReference: string;
  temporaryPassword: string;
  message: string;
}

const GENDERS = [
  { value: "", label: "Not recorded" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "UNDISCLOSED", label: "Prefer not to say" },
];

export function MemberForm({ member }: { member?: MemberFormValues }) {
  const router = useRouter();
  const editing = Boolean(member);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedMember | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      [...form.entries()].map(([key, value]) => [key, String(value)])
    );

    try {
      const response = await fetch(
        member ? `/api/admin/members/${member.id}` : "/api/admin/members",
        {
          method: member ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const body = await response.json();

      if (!response.ok) {
        setErrors(body?.error?.details ?? {});
        setFormError(
          body?.error?.message ??
            (member
              ? "The changes could not be saved"
              : "The member could not be enrolled")
        );
        return;
      }

      if (member) {
        // Straight back to the file, which now shows the new details.
        router.push(`/admin/members/${member.id}`);
        router.refresh();
        return;
      }

      setCreated(body);
      // So the register and the sidebar counts reflect the new member.
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="space-y-5">
        <Alert variant="success" title="Member enrolled">
          {created.message}
        </Alert>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-heading text-base font-semibold text-ink">
            Give these to the member
          </h2>

          <dl className="mt-4 divide-y divide-border">
            <Detail label="Member number" value={created.memberNumber} />
            <Detail
              label="Payment reference"
              value={created.paymentReference}
              hint="They must quote this on every deposit so it is credited automatically."
            />
            <Detail
              label="Temporary password"
              value={created.temporaryPassword}
              hint="Shown once and never again. They will be asked to change it when they first sign in."
            />
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(
                    `Member number: ${created.memberNumber}\n` +
                      `Payment reference: ${created.paymentReference}\n` +
                      `Temporary password: ${created.temporaryPassword}`
                  )
                  .then(() => setCopied(true));
              }}
            >
              <Copy className="size-3.5" aria-hidden="true" />
              {copied ? "Copied" : "Copy details"}
            </Button>

            <Button asChild size="sm">
              <Link href={`/admin/members/${created.memberId}`}>Open member file</Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreated(null);
                setCopied(false);
              }}
            >
              Enrol another
            </Button>
          </div>
        </div>

        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Write the temporary password down or copy it now. It is stored only as
          a hash, so nobody — including you — can look it up later. If it is
          lost the member has to reset their password instead.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && <Alert variant="error">{formError}</Alert>}

      <Section title="Identity" description="The minimum needed to open an account.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" label="First name" required error={errors.firstName}>
            {(props) => <Input name="firstName" defaultValue={member?.firstName ?? ""} autoComplete="off" {...props} />}
          </Field>

          <Field id="lastName" label="Last name" required error={errors.lastName}>
            {(props) => <Input name="lastName" defaultValue={member?.lastName ?? ""} autoComplete="off" {...props} />}
          </Field>

          <Field
            id="phone"
            label="Phone number"
            required
            error={errors.phone}
            hint="Used to reach them, and to match payments sent from this number."
          >
            {(props) => (
              <Input name="phone" defaultValue={member?.phone ?? ""} placeholder="0788123456" inputMode="tel" {...props} />
            )}
          </Field>

          <Field
            id="email"
            label="Email"
            error={errors.email}
            hint="Optional. Leave blank if they do not have one."
          >
            {(props) => <Input name="email" defaultValue={member?.email ?? ""} type="email" {...props} />}
          </Field>

          <Field
            id="nationalId"
            label="National ID"
            error={errors.nationalId}
            hint="16 digits. Recording it marks their identity check as pending."
          >
            {(props) => (
              <Input name="nationalId" defaultValue={member?.nationalId ?? ""} inputMode="numeric" maxLength={16} {...props} />
            )}
          </Field>

          <Field id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth}>
            {(props) => <Input name="dateOfBirth" defaultValue={member?.dateOfBirth ?? ""} type="date" {...props} />}
          </Field>

          <Field id="gender" label="Gender" error={errors.gender}>
            {(props) => (
              <select
                name="gender"
                defaultValue={member?.gender ?? ""}
                className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...props}
              >
                {GENDERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </Section>

      <Section title="Livelihood" description="What the member does for a living.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="occupation" label="Occupation" error={errors.occupation}>
            {(props) => <Input name="occupation" defaultValue={member?.occupation ?? ""} placeholder="Tailor" {...props} />}
          </Field>

          <Field id="businessName" label="Business name" error={errors.businessName}>
            {(props) => <Input name="businessName" defaultValue={member?.businessName ?? ""} {...props} />}
          </Field>
        </div>
      </Section>

      <Section title="Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="addressLine1"
            label="Address"
            error={errors.addressLine1}
            className="sm:col-span-2"
          >
            {(props) => <Input name="addressLine1" defaultValue={member?.addressLine1 ?? ""} {...props} />}
          </Field>

          <Field id="city" label="City" error={errors.city}>
            {(props) => <Input name="city" defaultValue={member?.city ?? ""} placeholder="Kigali" {...props} />}
          </Field>

          <Field id="district" label="District" error={errors.district}>
            {(props) => <Input name="district" defaultValue={member?.district ?? ""} placeholder="Kicukiro" {...props} />}
          </Field>

          <Field id="province" label="Province" error={errors.province}>
            {(props) => <Input name="province" defaultValue={member?.province ?? ""} {...props} />}
          </Field>
        </div>
      </Section>

      <Section
        title="Payment identifiers"
        description="Fallback keys used to attribute a payment that arrives without a reference."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="mobileMoneyNumber"
            label="Mobile money number"
            error={errors.mobileMoneyNumber}
            hint="Leave blank if it is the same as their phone number."
          >
            {(props) => (
              <Input name="mobileMoneyNumber" defaultValue={member?.mobileMoneyNumber ?? ""} placeholder="0788123456" {...props} />
            )}
          </Field>

          <Field
            id="bankAccountNumber"
            label="Bank account number"
            error={errors.bankAccountNumber}
          >
            {(props) => <Input name="bankAccountNumber" defaultValue={member?.bankAccountNumber ?? ""} {...props} />}
          </Field>
        </div>
      </Section>

      <Section title="Next of kin">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="nextOfKinName" label="Full name" error={errors.nextOfKinName}>
            {(props) => <Input name="nextOfKinName" defaultValue={member?.nextOfKinName ?? ""} {...props} />}
          </Field>

          <Field id="nextOfKinPhone" label="Phone number" error={errors.nextOfKinPhone}>
            {(props) => (
              <Input name="nextOfKinPhone" defaultValue={member?.nextOfKinPhone ?? ""} placeholder="0788123456" {...props} />
            )}
          </Field>

          <Field
            id="nextOfKinRelation"
            label="Relationship"
            error={errors.nextOfKinRelation}
          >
            {(props) => <Input name="nextOfKinRelation" defaultValue={member?.nextOfKinRelation ?? ""} placeholder="Spouse" {...props} />}
          </Field>
        </div>
      </Section>

      <Section
        title={editing ? "Record the change" : "Enrolment"}
        description={
          editing
            ? "Membership status is changed from the member's file, not here — approving, suspending and reactivating each need their own reason."
            : "Active members can transact immediately. This decision is recorded against your name."
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {!editing && (
            <Field id="status" label="Membership status" error={errors.status}>
              {(props) => (
                <select
                  name="status"
                  defaultValue="ACTIVE"
                  className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  {...props}
                >
                  <option value="ACTIVE">Active — can save and borrow now</option>
                  <option value="PENDING_APPROVAL">
                    Pending approval — needs a second check
                  </option>
                </select>
              )}
            </Field>
          )}

          <Field
            id="note"
            label="Note for the audit log"
            error={errors.note}
            hint={
              editing
                ? "Optional. Why the details changed — useful when a payment later lands unexpectedly."
                : "Optional. e.g. where the paper application came from."
            }
          >
            {(props) => <Textarea name="note" rows={3} {...props} />}
          </Field>
        </div>
      </Section>

      {editing && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Changing the phone, mobile money or bank account number changes which
          payments are attributed to this member in future. The old and new
          values are both written to the audit log.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {editing ? "Saving…" : "Enrolling…"}
            </>
          ) : editing ? (
            <>
              <Save className="size-4" aria-hidden="true" />
              Save changes
            </>
          ) : (
            <>
              <UserPlus className="size-4" aria-hidden="true" />
              Enrol member
            </>
          )}
        </Button>

        <Button asChild variant="outline" type="button">
          <Link href={member ? `/admin/members/${member.id}` : "/admin/members"}>
            Cancel
          </Link>
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="font-heading text-base font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Detail({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg font-semibold tracking-wide text-ink">
        {value}
      </dd>
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink-muted">{hint}</p>}
    </div>
  );
}
