import { z } from "zod";
import { normalisePhone } from "@/lib/phone";
import {
  checkDistrictInProvince,
  optionalDistrict,
  optionalProvince,
} from "@/lib/validation/rwanda";

/**
 * Admin member enrolment.
 *
 * Shared by the form and the route handler, so the browser and the server
 * apply the same rules. The client copy gives fast inline feedback; the server
 * copy is the one that decides.
 *
 * HOW THIS DIFFERS FROM SELF-REGISTRATION, AND WHY:
 *
 *   • No password. The member is not present to choose one, and an
 *     administrator choosing on their behalf means the administrator knows it.
 *     A temporary one is generated server-side and must be changed at first
 *     sign-in.
 *
 *   • Email is optional, phone is required. Self-registration happens on a
 *     web form, so the applicant necessarily has an email. A tailor enrolled
 *     at the desk frequently does not, and their phone is the identifier that
 *     actually reaches them — it is also a payment-matching key.
 *
 *   • Every field of the member file is accepted, not the handful the public
 *     form collects. The administrator is transcribing a paper application,
 *     and asking them to save a half-record and then edit it is how details
 *     get lost.
 */

/** Optional free text: empty strings arrive from untouched form fields. */
function optionalText(max: number, label?: string) {
  return z
    .string()
    .trim()
    .max(max, label ? `${label} is too long` : `Must be ${max} characters or fewer`)
    .optional()
    .or(z.literal("").transform(() => undefined));
}

/** Optional Rwandan mobile, normalised to E.164 so matching keys line up. */
function optionalPhone(message: string) {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .transform((value, ctx) => {
      if (!value) return undefined;
      const normalised = normalisePhone(value);
      if (!normalised) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return normalised;
    });
}

/**
 * Every field of a member's file. Enrolment adds the status decision on top;
 * editing takes it as it stands — see the two schemas below.
 */
const memberFieldsSchema = z.object({
  // Identity ----------------------------------------------------------------
  firstName: z.string().trim().min(2, "Enter the member's first name").max(60),
  lastName: z.string().trim().min(2, "Enter the member's last name").max(60),

  phone: z
    .string()
    .trim()
    .min(1, "Enter the member's phone number")
    .transform((value, ctx) => {
      const normalised = normalisePhone(value);
      if (!normalised) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid Rwandan mobile number, e.g. 0788123456",
        });
        return z.NEVER;
      }
      return normalised;
    }),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  nationalId: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "The national ID must be 16 digits")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  dateOfBirth: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .transform((value, ctx) => {
      if (!value) return undefined;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: "Enter a valid date of birth" });
        return z.NEVER;
      }
      if (date > new Date()) {
        ctx.addIssue({ code: "custom", message: "Date of birth cannot be in the future" });
        return z.NEVER;
      }
      return date;
    }),

  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]).optional(),

  // Livelihood --------------------------------------------------------------
  occupation: optionalText(120, "Occupation"),
  businessName: optionalText(160, "Business name"),

  // Address -----------------------------------------------------------------
  addressLine1: optionalText(160, "Address"),
  city: optionalText(80, "City"),
  // Chosen from Rwanda's fixed list rather than typed, and stored canonically,
  // so a district breakdown groups every member of a district together
  // regardless of who transcribed the form.
  district: optionalDistrict(),
  province: optionalProvince(),

  // Payment identifiers -----------------------------------------------------
  // Both are fallback matching keys when a payment carries no reference, which
  // is why they are normalised rather than stored as typed.
  mobileMoneyNumber: optionalPhone(
    "Enter a valid mobile money number, e.g. 0788123456"
  ),
  bankAccountNumber: z
    .string()
    .trim()
    .max(34)
    .regex(/^[A-Za-z0-9\s-]*$/, "Enter a valid account number")
    .optional()
    .or(z.literal("").transform(() => undefined))
    .transform((value) => value?.replace(/[\s-]/g, "") || undefined),

  // Next of kin -------------------------------------------------------------
  nextOfKinName: optionalText(120, "Next of kin name"),
  nextOfKinPhone: optionalPhone("Enter a valid next of kin phone number"),
  nextOfKinRelation: optionalText(60, "Relationship"),

  /// Recorded on the audit entry. Not optional: creating a member is creating
  /// a claim on the association's money.
  note: optionalText(500, "Note"),
});

export const createMemberSchema = memberFieldsSchema
  .extend({
    // Enrolment decision ----------------------------------------------------
    /// Whether the member may transact immediately. An administrator entering a
    /// completed paper application is vouching for it, so ACTIVE is the default;
    /// PENDING_APPROVAL exists for a form that still needs a second pair of eyes.
    status: z.enum(["ACTIVE", "PENDING_APPROVAL"]).default("ACTIVE"),
  })
  .superRefine(checkDistrictInProvince);

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

/**
 * Editing an existing member's file.
 *
 * The same fields as enrolment, minus `status`. Membership status is not a
 * profile field: approving, suspending and reactivating each have their own
 * permission, demand their own reason, and notify the member. Letting a
 * profile edit quietly flip someone from SUSPENDED to ACTIVE would route
 * around all three.
 *
 * Also absent, deliberately: `memberNumber` and `paymentReference`. Those are
 * the member's identity, printed on every payment instruction they have ever
 * been given. Editing a payment reference would orphan the payments already
 * matched by it and silently break the matching of future ones.
 */
export const updateMemberSchema = memberFieldsSchema.superRefine(
  checkDistrictInProvince
);

export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
