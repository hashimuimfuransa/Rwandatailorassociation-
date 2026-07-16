"use client";

import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { PARTNERS } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export default function Partners() {
  const { t } = useLanguage();

  return (
    <section aria-label={t.partners.ariaLabel} className="bg-white py-12">
      <div className="container-page">
        <FadeIn>
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-ink-muted">
            {t.partners.kicker}
          </p>
        </FadeIn>

        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {PARTNERS.map((partner, i) => (
            <FadeIn key={partner.short} delay={i * 0.05} variant="scale">
              <div
                title={partner.name}
                className="relative h-12 w-28 grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
