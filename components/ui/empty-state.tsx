import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Empty state.
 *
 * Distinguishes "nothing here yet" from "nothing matched your filters" — a
 * member with no transactions needs different words from an admin whose search
 * returned nothing, and showing the wrong one is quietly confusing.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-heading text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Error state — recoverable, with a retry affordance. */
export function ErrorState({
  icon: Icon,
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-heading text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
