"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/FadeIn";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NEWS } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export default function News() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { locale, t } = useLanguage();
  const active = activeIndex !== null ? NEWS[activeIndex] : null;

  return (
    <div>
      <FadeIn className="mb-6 flex items-center justify-between">
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-ink">
          {t.news.title}
        </h3>
        <Link
          href="#news"
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          {t.news.viewAll}
        </Link>
      </FadeIn>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {NEWS.map((item, i) => (
          <FadeIn key={item.title.en} delay={i * 0.08}>
            <article className="h-full overflow-hidden rounded-2xl border border-border bg-white shadow-card">
              <div className="relative aspect-[16/11] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title[locale]}
                  fill
                  sizes="(max-width: 1024px) 90vw, 25vw"
                  className="object-cover"
                />
                <Badge variant="solid" className="absolute left-3 top-3">
                  {item.category[locale]}
                </Badge>
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {item.date[locale]}
                </p>
                <h4 className="mt-2 font-heading text-[14.5px] font-semibold leading-snug text-ink">
                  {item.title[locale]}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className="mt-3 inline-block cursor-pointer text-xs font-semibold text-primary hover:text-primary-hover"
                >
                  {t.news.readMore} &rarr;
                </button>
              </div>
            </article>
          </FadeIn>
        ))}
      </div>

      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {active && (
            <>
              <div className="relative -mx-6 -mt-6 aspect-[16/9] overflow-hidden rounded-t-2xl">
                <Image
                  src={active.image}
                  alt={active.title[locale]}
                  fill
                  sizes="90vw"
                  className="object-cover"
                />
                <Badge variant="solid" className="absolute left-4 top-4">
                  {active.category[locale]}
                </Badge>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {active.date[locale]}
              </p>
              <DialogTitle>{active.title[locale]}</DialogTitle>
              <div className="space-y-3">
                {active.body[locale].map((paragraph, i) => (
                  <p key={i} className="text-[14.5px] leading-relaxed text-ink/80">
                    {paragraph}
                  </p>
                ))}
              </div>
              <Button asChild className="mt-2 w-fit">
                <Link href="#contact" onClick={() => setActiveIndex(null)}>
                  {t.news.getInTouch}
                </Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
