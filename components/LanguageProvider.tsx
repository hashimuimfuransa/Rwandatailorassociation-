"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import dictionary, { type Dictionary } from "@/lib/i18n/dictionary";
import dashboardDictionary, {
  type DashboardDictionary,
} from "@/lib/i18n/dashboard";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_STORAGE_KEY,
  isLocale,
} from "@/lib/i18n/locale";
import type { Locale } from "@/types";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /// Marketing site copy.
  t: Dictionary;
  /// Dashboard copy. Separate because the two vocabularies barely overlap.
  d: DashboardDictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const router = useRouter();

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!isLocale(stored)) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, not derived render state
    setLocaleState(stored);

    // Anyone who chose a language before the cookie existed has the choice in
    // localStorage only, where the server cannot see it. Mirror it across, or
    // their dashboard pages would keep rendering in English forever.
    if (!document.cookie.includes(`${LOCALE_COOKIE}=${stored}`)) {
      writeLocaleCookie(stored);
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);

    // The dashboard's pages are server components, so the switch has to reach
    // the server too: the cookie carries the choice on the next request, and
    // refresh() is what makes that request happen. Without the refresh a member
    // would flip the toggle and watch the sidebar change language while the
    // page beside it stayed in English.
    writeLocaleCookie(next);
    router.refresh();
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t: dictionary[locale],
        d: dashboardDictionary[locale],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
