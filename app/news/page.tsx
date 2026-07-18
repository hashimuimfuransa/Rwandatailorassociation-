"use client";

import SectionHeading from "@/components/SectionHeading";
import NewsGrid from "@/components/NewsGrid";
import { NEWS } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

export default function NewsPage() {
  const { t } = useLanguage();

  return (
    <section className="section-pad bg-background">
      <div className="container-page">
        <SectionHeading title={t.news.title} description={t.news.description} />

        <div className="mt-14">
          <NewsGrid items={NEWS} />
        </div>
      </div>
    </section>
  );
}
