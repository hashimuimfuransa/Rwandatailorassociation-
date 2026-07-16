"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";
import FadeIn from "@/components/FadeIn";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GALLERY } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export default function Gallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { locale, t } = useLanguage();
  const isOpen = activeIndex !== null;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setActiveIndex((i) => (i === null ? i : (i + 1) % GALLERY.length));
      } else if (e.key === "ArrowLeft") {
        setActiveIndex((i) => (i === null ? i : (i - 1 + GALLERY.length) % GALLERY.length));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const active = activeIndex !== null ? GALLERY[activeIndex] : null;

  return (
    <section id="gallery" className="section-pad bg-background">
      <div className="container-page">
        <SectionHeading title={t.gallery.title} />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {GALLERY.map((item, i) => (
            <FadeIn key={item.image} delay={i * 0.06} variant="scale">
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={t.gallery.viewLargerAlt(item.alt[locale])}
                className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Image
                  src={item.image}
                  alt={item.alt[locale]}
                  fill
                  sizes="(max-width: 640px) 45vw, 20vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
            </FadeIn>
          ))}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-w-3xl bg-ink p-2 sm:p-3">
          {active && (
            <>
              <DialogTitle className="sr-only">{active.alt[locale]}</DialogTitle>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                <Image
                  src={active.image}
                  alt={active.alt[locale]}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  priority
                />
              </div>
              <p className="px-2 pb-1 text-center text-sm text-white/70">{active.alt[locale]}</p>

              <button
                type="button"
                onClick={() =>
                  setActiveIndex((i) => (i === null ? i : (i - 1 + GALLERY.length) % GALLERY.length))
                }
                aria-label={t.gallery.previousImage}
                className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-card transition-colors hover:bg-primary hover:text-white"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((i) => (i === null ? i : (i + 1) % GALLERY.length))
                }
                aria-label={t.gallery.nextImage}
                className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-card transition-colors hover:bg-primary hover:text-white"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
