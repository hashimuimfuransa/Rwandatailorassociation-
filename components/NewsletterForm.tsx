"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";

export default function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLanguage();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary">
        <Check className="size-4 shrink-0" aria-hidden="true" />
        {t.footer.subscribed}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2" aria-label="Newsletter signup">
      <label htmlFor="footer-email" className="sr-only">
        {t.footer.emailLabel}
      </label>
      <input
        id="footer-email"
        type="email"
        required
        placeholder={t.footer.emailPlaceholder}
        className="h-11 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
      />
      <Button type="submit" size="sm" className="w-full">
        {t.footer.subscribe}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
