import { cn } from "@/lib/utils";

/**
 * Loading placeholder.
 *
 * `aria-hidden` with a sibling live region is deliberate: announcing "loading"
 * once is useful, announcing forty shimmering rectangles is not.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-ink/[0.07]", className)}
      {...props}
    />
  );
}

/** Skeleton for a statistic tile. */
function SkeletonStat() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-20" />
    </div>
  );
}

/** Skeleton for a data table. */
function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex gap-4 border-b border-border bg-background/60 px-5 py-3.5">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border px-5 py-4 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-6 shadow-card", className)}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-6 h-52 w-full" />
    </div>
  );
}

export { Skeleton, SkeletonStat, SkeletonTable, SkeletonChart };
