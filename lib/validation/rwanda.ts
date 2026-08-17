import { z } from "zod";
import {
  RWANDA_PROVINCE_NAMES,
  canonicalDistrict,
  canonicalProvince,
  districtBelongsToProvince,
} from "@/lib/rwanda";

/**
 * Province and district validators, shared by every form that records an
 * address — self-registration and admin enrolment alike.
 *
 * They do two jobs. They reject a value that is not one of Rwanda's five
 * provinces or thirty districts, and they *canonicalise* the ones that are: a
 * record imported as "kicukiro District" saves as "Kicukiro", so the district
 * breakdown in a report is one row rather than three.
 *
 * Both stay optional. A member with an unknown district is still a member, and
 * refusing to record the rest of their file over it helps nobody.
 */

/** Optional province, stored as its canonical English name. */
export function optionalProvince() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .transform((value, ctx) => {
      if (!value) return undefined;
      const canonical = canonicalProvince(value);
      if (!canonical) {
        ctx.addIssue({
          code: "custom",
          message: `Choose one of Rwanda's provinces: ${RWANDA_PROVINCE_NAMES.join(", ")}`,
        });
        return z.NEVER;
      }
      return canonical;
    });
}

/** Optional district, stored as its canonical name. */
export function optionalDistrict() {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined))
    .transform((value, ctx) => {
      if (!value) return undefined;
      const canonical = canonicalDistrict(value);
      if (!canonical) {
        ctx.addIssue({
          code: "custom",
          message: "Choose one of Rwanda's 30 districts",
        });
        return z.NEVER;
      }
      return canonical;
    });
}

/**
 * Cross-field check for a schema carrying both: the district must sit in the
 * province. The form cannot produce a mismatch — its district list is filtered
 * by the chosen province — but a direct API call can, and a member filed under
 * "Kicukiro, Northern Province" is a record no report can place.
 *
 * Reported against `district`, because when the two disagree the district is
 * the specific claim and the province is the one to re-derive.
 */
export function checkDistrictInProvince(
  data: { district?: string; province?: string },
  ctx: z.RefinementCtx
) {
  if (!districtBelongsToProvince(data.district, data.province)) {
    ctx.addIssue({
      code: "custom",
      path: ["district"],
      message: `${data.district} is not a district of ${data.province}`,
    });
  }
}
