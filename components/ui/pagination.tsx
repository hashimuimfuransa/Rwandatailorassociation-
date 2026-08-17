"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { fill } from "@/lib/i18n/fill";
import { cn } from "@/lib/utils";

/**
 * Pagination control.
 *
 * Shows the record range ("Showing 21–40 of 312") rather than page numbers
 * alone — on a financial table people need to know how much they are looking
 * at, not just which page they are on.
 */
export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { d } = useLanguage();
  const copy = d.views.pagination;

  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label={copy.label}
      className={cn(
        "flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3.5 sm:flex-row",
        className
      )}
    >
      <p className="text-xs text-ink-muted">
        {copy.showing}{" "}
        <span className="font-semibold tabular-nums text-ink">{first}</span>–
        <span className="font-semibold tabular-nums text-ink">{last}</span>{" "}
        {d.common.of}{" "}
        <span className="font-semibold tabular-nums text-ink">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={copy.previous}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </PageButton>

        {buildPageList(page, totalPages).map((entry, index) =>
          entry === "…" ? (
            <span
              key={`gap-${index}`}
              className="px-1.5 text-sm text-ink-muted"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <PageButton
              key={entry}
              onClick={() => onPageChange(entry)}
              active={entry === page}
              aria-label={fill(copy.page, { page: entry })}
              aria-current={entry === page ? "page" : undefined}
            >
              {entry}
            </PageButton>
          )
        )}

        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label={copy.next}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </PageButton>
      </div>
    </nav>
  );
}

function PageButton({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium tabular-nums transition-colors",
        "disabled:pointer-events-none disabled:opacity-40",
        active
          ? "bg-primary text-white"
          : "text-ink-muted hover:bg-primary-50 hover:text-primary",
        className
      )}
      {...props}
    />
  );
}

/**
 * Windowed page list with ellipses, always including first and last so the
 * ends of a long result set stay one click away.
 */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");

  pages.push(total);
  return pages;
}
