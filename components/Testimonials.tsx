"use client";

import Image from "next/image";
import SectionHeading from "@/components/SectionHeading";
import FadeIn from "@/components/FadeIn";
import { TESTIMONIALS } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export default function Testimonials() {
  const { locale, t } = useLanguage();

  return (
    <section aria-label={t.testimonials.ariaLabel} className="section-pad bg-white">
      <div className="container-page">
        <SectionHeading title={t.testimonials.title} />

        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
          {TESTIMONIALS.map((testimonial, i) => (
            <FadeIn key={testimonial.name} delay={i * 0.1}>
              <div className="flex h-full flex-col items-center rounded-2xl border border-border bg-background p-8 text-center">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-5 text-[14.5px] leading-relaxed text-ink/80">
                  &ldquo;{testimonial.quote[locale]}&rdquo;
                </p>
                <p className="mt-5 font-heading text-sm font-semibold text-ink">
                  {testimonial.name}
                </p>
                <p className="text-xs text-ink-muted">{testimonial.role[locale]}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
