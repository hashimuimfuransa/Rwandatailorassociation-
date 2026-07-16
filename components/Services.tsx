"use client";

import SectionHeading from "@/components/SectionHeading";
import FadeIn from "@/components/FadeIn";
import { SERVICES } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export default function Services() {
  const { locale, t } = useLanguage();

  return (
    <section id="services" className="section-pad bg-background">
      <div className="container-page">
        <SectionHeading kicker={t.services.kicker} title={t.services.title} />

        <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {SERVICES.map((service, i) => (
            <FadeIn key={service.title.en} delay={i * 0.06}>
              <div className="group flex h-full flex-col items-center rounded-2xl border border-border bg-white p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-lift">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary-50 transition-colors duration-300 group-hover:bg-primary">
                  <service.icon
                    className="size-6 text-primary transition-colors duration-300 group-hover:text-white"
                    aria-hidden="true"
                  />
                </span>
                <h3 className="mt-5 font-heading text-[15px] font-semibold text-ink">
                  {service.title[locale]}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  {service.description[locale]}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
