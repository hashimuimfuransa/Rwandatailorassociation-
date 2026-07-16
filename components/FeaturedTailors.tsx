"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/FadeIn";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FEATURED_TAILORS } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export default function FeaturedTailors() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { locale, t } = useLanguage();
  const active = activeIndex !== null ? FEATURED_TAILORS[activeIndex] : null;

  return (
    <div id="tailors">
      <FadeIn className="mb-6 flex items-center justify-between">
        <h3 className="font-heading text-base font-bold uppercase tracking-wide text-ink">
          {t.featuredTailors.title}
        </h3>
        <Link
          href="#tailors"
          className="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          {t.featuredTailors.viewAll}
        </Link>
      </FadeIn>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {FEATURED_TAILORS.map((tailor, i) => (
          <FadeIn key={tailor.name} delay={i * 0.08}>
            <div className="h-full overflow-hidden rounded-2xl border border-border bg-white shadow-card">
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={tailor.image}
                  alt={t.featuredTailors.portraitAlt(tailor.name, tailor.business)}
                  fill
                  sizes="(max-width: 640px) 90vw, 200px"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="font-heading text-sm font-semibold text-ink">
                  {tailor.name}
                </h4>
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                  <MapPin className="size-3 text-primary" aria-hidden="true" />
                  {tailor.district}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">{tailor.business}</p>
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-ink">
                  <Star className="size-3.5 fill-gold text-gold" aria-hidden="true" />
                  {tailor.rating.toFixed(1)}
                  <span className="text-ink-muted">({tailor.reviews})</span>
                </p>
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setActiveIndex(i)}
                >
                  {t.featuredTailors.viewProfile}
                </Button>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-w-md">
          {active && (
            <>
              <div className="relative -mx-6 -mt-6 aspect-[4/3] overflow-hidden rounded-t-2xl">
                <Image
                  src={active.image}
                  alt={t.featuredTailors.portraitAlt(active.name, active.business)}
                  fill
                  sizes="90vw"
                  className="object-cover"
                />
              </div>
              <DialogTitle>{active.name}</DialogTitle>
              <p className="-mt-3 flex items-center gap-1 text-sm text-ink-muted">
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                {active.district} &middot; {active.business}
              </p>
              <p className="-mt-1 flex items-center gap-1 text-sm font-medium text-ink">
                <Star className="size-4 fill-gold text-gold" aria-hidden="true" />
                {active.rating.toFixed(1)}
                <span className="text-ink-muted">
                  ({active.reviews} {t.featuredTailors.reviewsWord})
                </span>
              </p>
              <p className="text-[14.5px] leading-relaxed text-ink/80">{active.bio[locale]}</p>
              <div className="flex flex-wrap gap-2">
                {active.specialties[locale].map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-hover"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
              <Button asChild className="mt-2 w-fit">
                <Link href="#contact" onClick={() => setActiveIndex(null)}>
                  {t.featuredTailors.contactPrefix} {active.name.split(" ")[0]}
                </Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
