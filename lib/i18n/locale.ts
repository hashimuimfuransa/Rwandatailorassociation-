import type { Locale } from "@/types";

/**
 * Where the chosen language lives, and how it is read back.
 *
 * A cookie, not only localStorage. Almost every dashboard page is a server
 * component that queries the database — none of them can see localStorage, so
 * with localStorage alone the language switch could never reach the words a
 * page renders. A cookie travels with the request, so the server knows the
 * member's language before it renders a single row.
 *
 * localStorage is still written alongside it, because client components read
 * the choice synchronously through the provider without waiting for a render
 * pass, and because it is what the marketing site already used.
 *
 * Not HttpOnly and not signed: a language preference is not a credential, and
 * the client half of the app has to be able to write it.
 */

export const LOCALE_COOKIE = "rta-locale";
export const LOCALE_STORAGE_KEY = "rta-locale";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALES: readonly Locale[] = ["en", "rw"];

/** A year: the choice should outlive the session that made it. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "rw";
}

/** Any untrusted value — cookie, query string, storage — narrowed to a locale. */
export function parseLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
