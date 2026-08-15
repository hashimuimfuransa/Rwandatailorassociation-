"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed",
  {
    variants: {
      variant: {
        info: "border-primary/25 bg-primary-50 text-primary-hover",
        success: "border-success/30 bg-success/10 text-emerald-700",
        warning: "border-gold/40 bg-gold/10 text-amber-800",
        error: "border-red-300 bg-red-50 text-red-700",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
} as const;

function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & { title?: string }) {
  const Icon = ICONS[variant ?? "info"];

  return (
    <div
      data-slot="alert"
      // Errors and warnings interrupt a screen reader; informational messages
      // wait their turn rather than talking over what the user is doing.
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

export { Alert, alertVariants };
