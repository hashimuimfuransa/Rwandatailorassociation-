"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        // Scrolls rather than wraps: a loan portfolio has eight status tabs and
        // wrapping them onto two rows makes the whole screen jump on selection.
        "flex w-full items-center gap-1 overflow-x-auto border-b border-border",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  count,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { count?: number }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative -mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-ink-muted transition-colors",
        "hover:text-ink",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "data-[state=active]:border-primary data-[state=active]:text-primary",
        className
      )}
      {...props}
    >
      {children}
      {count !== undefined && (
        <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-bold tabular-nums text-ink-muted">
          {count}
        </span>
      )}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
