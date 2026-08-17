import type { Locale } from "@/types";
import { nav, type NavCopy } from "./nav";
import { shell, type ShellCopy } from "./shell";
import { common, type CommonCopy } from "./common";
import { forms, type FormsCopy } from "./forms";
import { auth, type AuthCopy } from "./auth";
import { member, type MemberCopy } from "./member";
import { admin, type AdminCopy } from "./admin";
import { platform, type PlatformCopy } from "./platform";
import { views, type ViewsCopy } from "./views";

/**
 * Dashboard translations.
 *
 * Kept apart from `dictionary.ts`, which covers the marketing site. The two
 * have almost no vocabulary in common — one sells membership, the other names
 * financial operations — and a single file carrying both would be edited by
 * different people for different reasons.
 *
 * Split by area rather than by language, so both languages of a phrase sit on
 * adjacent lines. A translator can then see what they are translating, and a
 * missing Kinyarwanda string is a type error rather than a screen that quietly
 * falls back to English.
 *
 * TRANSLATING FINANCIAL TERMS IS NOT A MATTER OF TASTE. A member reading
 * "Kubitsa" must understand the same operation an administrator sees as
 * "Deposit", because they are looking at the same ledger row from two sides.
 * Where an established Kinyarwanda banking term exists it is used; where one
 * does not, the English is kept rather than invented, since an unfamiliar
 * coinage is worse than a familiar loan word.
 *
 * Read from a client component with `useLanguage()`, and from a server
 * component with `getDashboardCopy()` in lib/i18n/server.ts — most dashboard
 * pages are server components, so that second path is the common one.
 */
export interface DashboardDictionary {
  nav: NavCopy;
  shell: ShellCopy;
  common: CommonCopy;
  forms: FormsCopy;
  auth: AuthCopy;
  member: MemberCopy;
  admin: AdminCopy;
  platform: PlatformCopy;
  views: ViewsCopy;
}

const dashboardDictionary: Record<Locale, DashboardDictionary> = {
  en: {
    nav: nav.en,
    shell: shell.en,
    common: common.en,
    forms: forms.en,
    auth: auth.en,
    member: member.en,
    admin: admin.en,
    platform: platform.en,
    views: views.en,
  },
  rw: {
    nav: nav.rw,
    shell: shell.rw,
    common: common.rw,
    forms: forms.rw,
    auth: auth.rw,
    member: member.rw,
    admin: admin.rw,
    platform: platform.rw,
    views: views.rw,
  },
};

/** Every navigation label key, so `lib/navigation.ts` stays type-checked. */
export type NavLabelKey = keyof NavCopy;

export default dashboardDictionary;
