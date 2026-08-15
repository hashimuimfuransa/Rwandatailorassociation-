"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types";

const LANGUAGES: { code: Locale; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "rw", label: "Ikinyarwanda", short: "RW" },
];

/**
 * Language switch for the dashboard header.
 *
 * A two-state segmented control rather than the dropdown the marketing site
 * uses: with exactly two languages a menu costs an extra click to show one
 * option, and the current language is not visible until it is opened.
 *
 * The choice is stored in localStorage by the provider, so it survives a
 * reload and follows the member between the public site and their dashboard.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, d } = useLanguage();

  return (
    <div
      role="group"
      aria-label={d.shell.changeLanguage}
      className={cn(
        "hidden shrink-0 items-center gap-0.5 rounded-xl border border-border p-0.5 sm:flex",
        className
      )}
    >
      <Globe className="ml-1.5 size-3.5 text-ink-muted" aria-hidden="true" />
      {LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          onClick={() => setLocale(language.code)}
          aria-pressed={locale === language.code}
          title={language.label}
          className={cn(
            "rounded-lg px-2 py-1 text-[11px] font-bold tracking-wide transition-colors",
            locale === language.code
              ? "bg-primary text-white"
              : "text-ink-muted hover:bg-primary-50 hover:text-primary"
          )}
        >
          {language.short}
        </button>
      ))}
    </div>
  );
}
