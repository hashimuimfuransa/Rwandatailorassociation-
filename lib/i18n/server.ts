import { cookies } from "next/headers";
import dictionary, { type Dictionary } from "@/lib/i18n/dictionary";
import dashboardDictionary, {
  type DashboardDictionary,
} from "@/lib/i18n/dashboard";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n/locale";
import type { Locale } from "@/types";

/**
 * The server side of the language switch.
 *
 * Dashboard pages are server components — they query the ledger, so they have
 * to be — and this is how they learn which language to render in. A page calls
 * `getDashboardCopy()` once at the top and reads its labels from the result,
 * exactly as a client component reads them from `useLanguage()`.
 *
 * Reading a cookie makes a page dynamic. Every dashboard page already is:
 * they show live balances and are marked `force-dynamic`. Nothing here is
 * imported by the marketing pages, which stay static.
 */

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return parseLocale(store.get(LOCALE_COOKIE)?.value);
}

/** Dashboard copy for the current request's language. */
export async function getDashboardCopy(): Promise<{
  locale: Locale;
  d: DashboardDictionary;
}> {
  const locale = await getLocale();
  return { locale, d: dashboardDictionary[locale] };
}

/** Marketing copy for the current request's language. */
export async function getSiteCopy(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, t: dictionary[locale] };
}
