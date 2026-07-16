import FadeIn from "@/components/FadeIn";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
  className?: string;
}

export default function SectionHeading({
  kicker,
  title,
  description,
  align = "center",
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <FadeIn
      className={cn(
        "mx-auto max-w-2xl",
        align === "center" ? "text-center" : "text-left ml-0",
        className
      )}
    >
      {kicker && (
        <span
          className={cn(
            "mb-3 block text-xs font-bold uppercase tracking-[0.2em]",
            light ? "text-white/80" : "text-primary"
          )}
        >
          {kicker}
        </span>
      )}
      <h2
        className={cn(
          "text-balance text-3xl font-bold sm:text-4xl",
          light ? "text-white" : "text-ink"
        )}
      >
        {title}
      </h2>
      <span
        className={cn(
          "mt-4 block h-1 w-16 rounded-full bg-primary",
          align === "center" ? "mx-auto" : "ml-0"
        )}
      />
      {description && (
        <p
          className={cn(
            "mt-5 text-balance text-[15.5px] leading-relaxed",
            light ? "text-white/85" : "text-ink-muted"
          )}
        >
          {description}
        </p>
      )}
    </FadeIn>
  );
}
