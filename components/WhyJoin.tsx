"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import { WHY_JOIN } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export default function WhyJoin() {
  const { locale, t } = useLanguage();

  return (
    <FadeIn className="flex h-full flex-col gap-5 sm:flex-row">
      <div className="flex-1 rounded-2xl border border-border bg-white p-7 shadow-card">
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-ink">
          {t.whyJoin.title}
        </h3>
        <ul className="mt-5 space-y-3">
          {WHY_JOIN[locale].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="text-[13.5px] leading-relaxed text-ink/80">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative h-48 shrink-0 overflow-hidden rounded-2xl shadow-card sm:h-auto sm:w-36">
        <Image
          src="/images/whyjoin-jacket.jpg"
          alt={t.whyJoin.imageAlt}
          fill
          sizes="200px"
          className="object-cover"
        />
      </div>
    </FadeIn>
  );
}
