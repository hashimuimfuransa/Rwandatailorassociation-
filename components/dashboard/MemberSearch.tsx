"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXITED", label: "Exited" },
];

/** Search and status filter for the member register. State lives in the URL. */
export function MemberSearch({ basePath }: { basePath: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  function apply(next: Record<string, string | undefined>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "ALL") search.delete(key);
      else search.set(key, value);
    }
    search.delete("page");
    router.push(`${basePath}?${search.toString()}`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    apply({ q: query.trim() || undefined });
  }

  const hasFilters = Boolean(params.get("q") || params.get("status"));

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="member-search" className="mb-1.5 block text-xs font-semibold text-ink">
          Search
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <Input
            id="member-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, member number, phone, payment reference…"
            className="pl-10"
          />
        </div>
      </div>

      <div className="sm:w-52">
        <label htmlFor="member-status" className="mb-1.5 block text-xs font-semibold text-ink">
          Status
        </label>
        <Select
          value={params.get("status") ?? "ALL"}
          onValueChange={(value) => apply({ status: value })}
        >
          <SelectTrigger id="member-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Search
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              router.push(basePath);
            }}
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
