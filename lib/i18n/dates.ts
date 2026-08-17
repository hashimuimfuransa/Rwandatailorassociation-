import type { Locale } from "@/types";

/**
 * Dates in the reader's language.
 *
 * Every dashboard page used to call `toLocaleDateString("en-GB", …)` directly,
 * which renders "17 Aug 2026" whatever language the rest of the page is in.
 * Intl has no usable data for Kinyarwanda, so the month names are held here:
 * the numbers are the same in both languages, the months are not.
 *
 * The day-month-year order is kept for both, because that is the order used in
 * Rwanda and because a statement date that reorders itself between languages
 * is a date nobody can reconcile.
 */

const RW_MONTHS_SHORT = [
  "Mut",
  "Gas",
  "Wer",
  "Mat",
  "Gic",
  "Kam",
  "Nya",
  "Kan",
  "Nze",
  "Ukw",
  "Ugu",
  "Uku",
];

const RW_MONTHS = [
  "Mutarama",
  "Gashyantare",
  "Werurwe",
  "Mata",
  "Gicurasi",
  "Kamena",
  "Nyakanga",
  "Kanama",
  "Nzeri",
  "Ukwakira",
  "Ugushyingo",
  "Ukuboza",
];

const EN_DATE = { day: "numeric", month: "short", year: "numeric" } as const;

/** e.g. "17 Aug 2026" / "17 Kan 2026". An empty date renders as a dash. */
export function formatDate(
  value: Date | string | null | undefined,
  locale: Locale = "en"
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  if (locale === "rw") {
    return `${date.getDate()} ${RW_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("en-GB", EN_DATE);
}

/** e.g. "17 August 2026", for a heading or a statement cover. */
export function formatLongDate(
  value: Date | string | null | undefined,
  locale: Locale = "en"
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  if (locale === "rw") {
    return `${date.getDate()} ${RW_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** e.g. "17 Aug, 14:32" — a day and a clock time, no year. */
export function formatDateTime(
  value: Date | string | null | undefined,
  locale: Locale = "en"
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (locale === "rw") {
    return `${date.getDate()} ${RW_MONTHS_SHORT[date.getMonth()]}, ${time}`;
  }
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}, ${time}`;
}

/**
 * A chart axis label from a "YYYY-MM" key, e.g. "Aug" / "Kan".
 *
 * Charts get the short form because an axis has no room for "Gashyantare".
 */
export function formatMonthLabel(month: string, locale: Locale = "en"): string {
  const [year, m] = month.split("-");
  const index = Number(m) - 1;
  if (Number.isNaN(index) || index < 0 || index > 11) return month;

  if (locale === "rw") return RW_MONTHS_SHORT[index];
  return new Date(Number(year), index, 1).toLocaleDateString("en-GB", {
    month: "short",
  });
}

/** Day and month only, for a compact timestamp beside a notification. */
export function formatDayMonth(
  value: Date | string,
  locale: Locale = "en"
): string {
  const date = new Date(value);
  if (locale === "rw") {
    return `${date.getDate()} ${RW_MONTHS_SHORT[date.getMonth()]}`;
  }
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
