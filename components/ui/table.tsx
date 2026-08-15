import { cn } from "@/lib/utils";

/**
 * Data table primitives.
 *
 * The wrapper scrolls horizontally on its own rather than letting the page do
 * it — a financial table has many columns, and a body that scrolls sideways
 * takes the navigation with it on mobile.
 *
 * Numeric columns should use `align="right"` and `tabular` so that digits line
 * up vertically; ragged amounts are genuinely harder to scan for errors.
 */

function TableWrapper({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-border bg-surface shadow-card",
        className
      )}
      {...props}
    />
  );
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full caption-bottom border-collapse text-sm", className)}
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-b border-border bg-background/60", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "border-t-2 border-border bg-background/60 font-semibold",
        className
      )}
      {...props}
    />
  );
}

function TableRow({
  className,
  interactive,
  ...props
}: React.ComponentProps<"tr"> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "transition-colors",
        interactive && "cursor-pointer hover:bg-primary-50/60",
        className
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  align = "left",
  ...props
}: React.ComponentProps<"th"> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink-muted",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  align = "left",
  tabular,
  ...props
}: React.ComponentProps<"td"> & {
  align?: "left" | "right" | "center";
  /// Fixed-width digits, so columns of money align on the decimal point.
  tabular?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-5 py-4 align-middle text-ink",
        align === "right" && "text-right",
        align === "center" && "text-center",
        tabular && "font-medium tabular-nums",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      className={cn("px-5 py-3 text-left text-xs text-ink-muted", className)}
      {...props}
    />
  );
}

/** Full-width message row, for empty results inside an existing table. */
function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-14 text-center text-sm text-ink-muted">
        {children}
      </td>
    </tr>
  );
}

export {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableEmpty,
};
