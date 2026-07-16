"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/FadeIn";
import { useLanguage } from "@/components/LanguageProvider";

export default function CTA() {
  const { t } = useLanguage();

  return (
    <section id="membership" className="bg-primary">
      <div className="container-page py-10">
        <FadeIn className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <span className="hidden shrink-0 items-center justify-center rounded-full bg-white/15 p-3 sm:flex">
              <Users className="size-6 text-white" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
                {t.cta.title}
              </h2>
              <p className="mt-1 text-sm text-white/85">{t.cta.text}</p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="shrink-0 bg-white text-primary-hover hover:bg-white/90"
          >
            <Link href="#contact">{t.cta.button}</Link>
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}
