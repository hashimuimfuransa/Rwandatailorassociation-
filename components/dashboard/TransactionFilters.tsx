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

/**
 * Filter bar for transaction listings.
 *
 * State lives in the URL rather than in React state, deliberately: an
 * administrator investigating a discrepancy needs to send a colleague the
 * exact view they are looking at, and the back button should return to the
 * previous filter rather than an empty table.
 */

const TYPES = [
  { value: "ALL", label: "All types" },
  { value: "DEPOSIT", label: "Deposits" },
  { value: "WITHDRAWAL", label: "Withdrawals" },
  { value: "LOAN_DISBURSEMENT", label: "Loan disbursements" },
  { value: "LOAN_REPAYMENT", label: "Loan repayments" },
  { value: "INTEREST", label: "Interest" },
  { value: "FEE", label: "Fees" },
  { value: "PENALTY", label: "Penalties" },
  { value: "ADJUSTMENT", label: "Adjustments" },
  { value: "REVERSAL", label: "Reversals" },
];

export function TransactionFilters({ basePath }: { basePath: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("q") ?? "");

  function apply(next: Record<string, string | undefined>) {
    const query = new URLSearchParams(params.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "ALL") query.delete(key);
      else query.set(key, value);
    }

    // Any filter change resets to the first page — staying on page 7 of a
    // result set that now has two pages shows an empty table.
    query.delete("page");

    router.push(`${basePath}?${query.toString()}`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    apply({ q: search.trim() || undefined });
  }

  const hasFilters = ["q", "type", "from", "to"].some((k) => params.get(k));

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 lg:flex-row lg:items-end"
    >
      <div className="flex-1">
        <label htmlFor="tx-search" className="mb-1.5 block text-xs font-semibold text-ink">
          Search
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          />
          <Input
            id="tx-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference or description…"
            className="pl-10"
          />
        </div>
      </div>

      <div className="lg:w-52">
        <label htmlFor="tx-type" className="mb-1.5 block text-xs font-semibold text-ink">
          Type
        </label>
        <Select
          value={params.get("type") ?? "ALL"}
          onValueChange={(value) => apply({ type: value })}
        >
          <SelectTrigger id="tx-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="lg:w-40">
        <label htmlFor="tx-from" className="mb-1.5 block text-xs font-semibold text-ink">
          From
        </label>
        <Input
          id="tx-from"
          type="date"
          defaultValue={params.get("from") ?? ""}
          onChange={(e) => apply({ from: e.target.value || undefined })}
        />
      </div>

      <div className="lg:w-40">
        <label htmlFor="tx-to" className="mb-1.5 block text-xs font-semibold text-ink">
          To
        </label>
        <Input
          id="tx-to"
          type="date"
          defaultValue={params.get("to") ?? ""}
          onChange={(e) => apply({ to: e.target.value || undefined })}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
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
