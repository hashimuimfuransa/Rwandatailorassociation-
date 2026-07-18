"use client";

import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { PARTNERS } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

// Rwanda's national flag colours, used as a horizontal-band backdrop.
const FLAG_BACKGROUND =
  "linear-gradient(to bottom, #00A1DE 0%, #00A1DE 50%, #FAD201 50%, #FAD201 61%, #007A33 61%, #007A33 100%)";

export default function Partners() {
  const { t } = useLanguage();

  return (
    <section
      aria-label={t.partners.ariaLabel}
      className="relative overflow-hidden py-14"
      style={{ background: FLAG_BACKGROUND }}
    >
      {/* Soft glow echoing the flag's golden sun emblem */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full opacity-80 blur-3xl"
        style={{ background: "radial-gradient(circle, #FDE68A 0%, transparent 70%)" }}
      />

      <div className="container-page relative">
        <FadeIn>
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.25)]">
            {t.partners.kicker}
          </p>
        </FadeIn>

        <div className="flex flex-wrap items-center justify-center gap-5">
          {PARTNERS.map((partner, i) => (
            <FadeIn key={partner.short} delay={i * 0.05} variant="scale">
              <div
                title={partner.name}
                className="flex h-20 w-36 items-center justify-center rounded-xl bg-white p-4 shadow-lift transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    sizes="144px"
                    className="object-contain"
                  />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
