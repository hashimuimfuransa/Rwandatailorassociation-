"use client";

import { ExternalLink } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import BackButton from "@/components/BackButton";
import { MEMBERSHIP_FORM_URL } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

const EMBED_SRC = `${MEMBERSHIP_FORM_URL}?embedded=true`;

export default function RegisterPage() {
  const { t } = useLanguage();

  return (
    <section className="section-pad bg-background">
      <div className="container-page">
        <BackButton href="/" />

        <SectionHeading
          className="mt-8"
          kicker={t.contact.kicker}
          title={t.contact.registerTitle}
          description={t.contact.registerText}
        />

        {/*
          Google Forms doesn't report its content height back to the parent
          page, and this form's height varies a lot between steps (the short
          language picker vs. the long 14-question page). A fixed pixel
          height tall enough for the long page would leave a huge blank gap
          under the short one, so instead the panel is capped to a share of
          the viewport and scrolls internally — consistent at every step and
          on every screen size.
        */}
        <div className="mx-auto mt-8 h-[75vh] max-h-[850px] min-h-[420px] max-w-3xl overflow-hidden rounded-none border-y border-border bg-white shadow-card sm:mt-12 sm:rounded-2xl sm:border-x">
          <iframe
            title={t.contact.registerTitle}
            src={EMBED_SRC}
            className="h-full w-full"
            loading="lazy"
          />
        </div>

        <div className="mt-6 flex justify-center px-4 text-center">
          <a
            href={MEMBERSHIP_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-primary"
          >
            {t.contact.registerNewTab}
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
