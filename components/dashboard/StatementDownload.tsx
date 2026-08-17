"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * Statement period picker.
 *
 * Both actions navigate rather than fetch — the CSV needs the browser's
 * download handling and the printable statement needs a real document window
 * for print-to-PDF. Fetching them into memory would break both.
 */
export function StatementDownload({
  memberNumber,
  paymentReference,
}: {
  memberNumber: string;
  paymentReference: string;
}) {
  const { d } = useLanguage();
  const copy = d.views.statement;

  const today = new Date().toISOString().slice(0, 10);
  const yearAgo = new Date(new Date().setMonth(new Date().getMonth() - 12))
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState(yearAgo);
  const [to, setTo] = useState(today);

  const invalid = from > to;

  function open(format: "html" | "csv") {
    const query = new URLSearchParams({ from, to, format });
    window.open(`/api/statements?${query.toString()}`, "_blank", "noopener");
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <dl className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-background p-3">
          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {copy.membershipNumber}
          </dt>
          <dd className="mt-0.5 font-heading text-sm font-bold text-ink">
            {memberNumber}
          </dd>
        </div>
        <div className="rounded-xl border border-primary/25 bg-primary-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wider text-primary-hover">
            {copy.paymentReference}
          </dt>
          <dd className="mt-0.5 font-heading text-sm font-bold text-primary-hover">
            {paymentReference}
          </dd>
        </div>
      </dl>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="stmt-from" label={copy.from} required>
          {(props) => (
            <Input
              {...props}
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          )}
        </Field>

        <Field
          id="stmt-to"
          label={copy.to}
          error={invalid ? copy.invalidRange : undefined}
          required
        >
          {(props) => (
            <Input
              {...props}
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => open("html")} disabled={invalid} className="flex-1">
          <FileText className="size-4" aria-hidden="true" />
          {copy.openPrintable}
        </Button>
        <Button
          onClick={() => open("csv")}
          disabled={invalid}
          variant="outline"
          className="flex-1"
        >
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          {copy.downloadCsv}
        </Button>
      </div>
    </div>
  );
}
