import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide",
  {
    variants: {
      variant: {
        primary: "border-primary/20 bg-primary-50 text-primary-hover",
        outline: "border-ink/15 bg-transparent text-ink-muted",
        solid: "border-transparent bg-primary text-white",
        light: "border-white/30 bg-white/10 text-white backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
