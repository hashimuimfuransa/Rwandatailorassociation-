import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-primary-hover hover:shadow-lift active:scale-[0.98]",
        outline:
          "border-2 border-ink/15 bg-transparent text-ink hover:border-primary hover:text-primary active:scale-[0.98]",
        outlineLight:
          "border-2 border-white/70 bg-transparent text-white hover:bg-white hover:text-primary active:scale-[0.98]",
        ghost: "bg-transparent text-ink hover:bg-ink/5 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto rounded-none",
      },
      size: {
        default: "h-12 px-6 py-3 has-[>svg]:px-5",
        sm: "h-10 px-4 text-[13px]",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
