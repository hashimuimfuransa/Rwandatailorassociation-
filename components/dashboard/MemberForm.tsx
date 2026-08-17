"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Loader2, Save, UserPlus } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { RwandaLocationFields } from "@/components/ui/rwanda-location-fields";
import { useLanguage } from "@/components/LanguageProvider";
import {
  canonicalDistrict,
  canonicalProvince,
  provinceForDistrict,
} from "@/lib/rwanda";

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

export function MemberForm({ member }: { member?: MemberFormValues }) {
  const router = useRouter();
  const editing = Boolean(member);

  const { d } = useLanguage();
  const copy = d.forms.member;
  const field = d.forms.field;

  const genders = [
    { value: "", label: d.common.notRecorded },
    { value: "MALE", label: d.forms.gender.male },
    { value: "FEMALE", label: d.forms.gender.female },
    { value: "OTHER", label: d.forms.gender.other },
    { value: "UNDISCLOSED", label: d.forms.gender.undisclosed },
  ];

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedMember | null>(null);
  const [copied, setCopied] = useState(false);

  // The one part of this form React has to hold: the province and district are
  // linked, so each depends on the other's current value. Everything else is
  // uncontrolled and read from FormData on submit.
  //
  // An older file may carry a district with no province — it was free text
  // once. The district settles the question, so fill the province in from it
  // rather than showing a blank the administrator has to answer again.
  //
  // Both are canonicalised on the way in: a value the dropdown does not
  // recognise has no option to show as selected, and would read as blank.
  const [location, setLocation] = useState(() => ({
    province:
      canonicalProvince(member?.province) ??
      provinceForDistrict(member?.district) ??
      "",
    district: canonicalDistrict(member?.district) ?? "",
  }));

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
            (member ? copy.saveFailed : copy.enrolFailed)
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
      setFormError(d.common.serverUnreachable);
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="space-y-5">
        <Alert variant="success" title={copy.enrolledTitle}>
          {created.message}
        </Alert>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <h2 className="font-heading text-base font-semibold text-ink">
            {copy.giveToMember}
          </h2>

          <dl className="mt-4 divide-y divide-border">
            <Detail label={copy.memberNumber} value={created.memberNumber} />
            <Detail
              label={copy.paymentReference}
              value={created.paymentReference}
              hint={copy.paymentReferenceHint}
            />
            <Detail
              label={copy.temporaryPassword}
              value={created.temporaryPassword}
              hint={copy.temporaryPasswordHint}
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
                    `${copy.memberNumber}: ${created.memberNumber}\n` +
                      `${copy.paymentReference}: ${created.paymentReference}\n` +
                      `${copy.temporaryPassword}: ${created.temporaryPassword}`
                  )
                  .then(() => setCopied(true));
              }}
            >
              <Copy className="size-3.5" aria-hidden="true" />
              {copied ? d.common.copied : copy.copyDetails}
            </Button>

            <Button asChild size="sm">
              <Link href={`/admin/members/${created.memberId}`}>
                {copy.openMemberFile}
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreated(null);
                setCopied(false);
                // The uncontrolled fields come back empty on their own; these
                // two live in React state and would keep the last member's.
                setLocation({ province: "", district: "" });
              }}
            >
              {copy.enrolAnother}
            </Button>
          </div>
        </div>

        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          {copy.passwordWarning}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && <Alert variant="error">{formError}</Alert>}

      <Section title={copy.identity} description={copy.identityHint}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" label={field.firstName} required error={errors.firstName}>
            {(props) => <Input name="firstName" defaultValue={member?.firstName ?? ""} autoComplete="off" {...props} />}
          </Field>

          <Field id="lastName" label={field.lastName} required error={errors.lastName}>
            {(props) => <Input name="lastName" defaultValue={member?.lastName ?? ""} autoComplete="off" {...props} />}
          </Field>

          <Field
            id="phone"
            label={field.phone}
            required
            error={errors.phone}
            hint={d.forms.hint.phoneAdmin}
          >
            {(props) => (
              <Input name="phone" defaultValue={member?.phone ?? ""} placeholder={d.forms.placeholder.phone} inputMode="tel" {...props} />
            )}
          </Field>

          <Field
            id="email"
            label={field.email}
            error={errors.email}
            hint={d.forms.hint.emailOptional}
          >
            {(props) => <Input name="email" defaultValue={member?.email ?? ""} type="email" {...props} />}
          </Field>

          <Field
            id="nationalId"
            label={field.nationalId}
            error={errors.nationalId}
            hint={d.forms.hint.nationalIdAdmin}
          >
            {(props) => (
              <Input name="nationalId" defaultValue={member?.nationalId ?? ""} inputMode="numeric" maxLength={16} {...props} />
            )}
          </Field>

          <Field id="dateOfBirth" label={field.dateOfBirth} error={errors.dateOfBirth}>
            {(props) => <Input name="dateOfBirth" defaultValue={member?.dateOfBirth ?? ""} type="date" {...props} />}
          </Field>

          <Field id="gender" label={field.gender} error={errors.gender}>
            {(props) => (
              <select
                name="gender"
                defaultValue={member?.gender ?? ""}
                className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                {...props}
              >
                {genders.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </Section>

      <Section title={copy.livelihood} description={copy.livelihoodHint}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="occupation" label={field.occupation} error={errors.occupation}>
            {(props) => <Input name="occupation" defaultValue={member?.occupation ?? ""} placeholder={d.forms.placeholder.occupation} {...props} />}
          </Field>

          <Field id="businessName" label={field.businessName} error={errors.businessName}>
            {(props) => <Input name="businessName" defaultValue={member?.businessName ?? ""} {...props} />}
          </Field>
        </div>
      </Section>

      <Section title={copy.address}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="addressLine1"
            label={field.address}
            error={errors.addressLine1}
            className="sm:col-span-2"
          >
            {(props) => <Input name="addressLine1" defaultValue={member?.addressLine1 ?? ""} {...props} />}
          </Field>

          {/*
            Rwanda's five provinces and thirty districts, from a fixed list.
            Transcribing them by hand is how "Kicukiro", "kicukiro" and
            "Kicukiro District" all end up in the same column.
          */}
          <RwandaLocationFields
            province={location.province}
            district={location.district}
            onChange={setLocation}
            errors={{ province: errors.province, district: errors.district }}
            withHiddenInputs
          />

          <Field id="city" label={field.city} error={errors.city}>
            {(props) => <Input name="city" defaultValue={member?.city ?? ""} placeholder={d.forms.placeholder.city} {...props} />}
          </Field>
        </div>
      </Section>

      <Section
        title={copy.paymentIdentifiers}
        description={copy.paymentIdentifiersHint}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="mobileMoneyNumber"
            label={field.mobileMoneyNumber}
            error={errors.mobileMoneyNumber}
            hint={d.forms.hint.mobileMoney}
          >
            {(props) => (
              <Input name="mobileMoneyNumber" defaultValue={member?.mobileMoneyNumber ?? ""} placeholder={d.forms.placeholder.phone} {...props} />
            )}
          </Field>

          <Field
            id="bankAccountNumber"
            label={field.bankAccountNumber}
            error={errors.bankAccountNumber}
          >
            {(props) => <Input name="bankAccountNumber" defaultValue={member?.bankAccountNumber ?? ""} {...props} />}
          </Field>
        </div>
      </Section>

      <Section title={copy.nextOfKin}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="nextOfKinName" label={copy.nextOfKinName} error={errors.nextOfKinName}>
            {(props) => <Input name="nextOfKinName" defaultValue={member?.nextOfKinName ?? ""} {...props} />}
          </Field>

          <Field id="nextOfKinPhone" label={copy.nextOfKinPhone} error={errors.nextOfKinPhone}>
            {(props) => (
              <Input name="nextOfKinPhone" defaultValue={member?.nextOfKinPhone ?? ""} placeholder={d.forms.placeholder.phone} {...props} />
            )}
          </Field>

          <Field
            id="nextOfKinRelation"
            label={copy.nextOfKinRelation}
            error={errors.nextOfKinRelation}
          >
            {(props) => <Input name="nextOfKinRelation" defaultValue={member?.nextOfKinRelation ?? ""} placeholder={d.forms.placeholder.relation} {...props} />}
          </Field>
        </div>
      </Section>

      <Section
        title={editing ? copy.recordChange : copy.enrolment}
        description={editing ? copy.recordChangeHint : copy.enrolmentHint}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {!editing && (
            <Field id="status" label={copy.membershipStatus} error={errors.status}>
              {(props) => (
                <select
                  name="status"
                  defaultValue="ACTIVE"
                  className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-[15px] text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  {...props}
                >
                  <option value="ACTIVE">{copy.statusActive}</option>
                  <option value="PENDING_APPROVAL">{copy.statusPending}</option>
                </select>
              )}
            </Field>
          )}

          <Field
            id="note"
            label={copy.noteLabel}
            error={errors.note}
            hint={editing ? copy.noteHintEdit : copy.noteHintEnrol}
          >
            {(props) => <Textarea name="note" rows={3} {...props} />}
          </Field>
        </div>
      </Section>

      {editing && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          {copy.matchingWarning}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {editing ? copy.savingChanges : copy.enrolling}
            </>
          ) : editing ? (
            <>
              <Save className="size-4" aria-hidden="true" />
              {copy.saveChanges}
            </>
          ) : (
            <>
              <UserPlus className="size-4" aria-hidden="true" />
              {copy.enrol}
            </>
          )}
        </Button>

        <Button asChild variant="outline" type="button">
          <Link href={member ? `/admin/members/${member.id}` : "/admin/members"}>
            {d.common.cancel}
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
