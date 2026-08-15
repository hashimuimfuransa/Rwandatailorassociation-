import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatementDownload } from "@/components/dashboard/StatementDownload";

export const metadata: Metadata = { title: "Statements | RTA" };
export const dynamic = "force-dynamic";

export default async function StatementsPage() {
  const context = await requireMember("/dashboard/statements");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Statements"
        description="Download a statement of your savings account for any period."
      />

      <StatementDownload
        memberNumber={context.member!.memberNumber}
        paymentReference={context.member!.paymentReference}
      />

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
        <FileText className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="text-sm leading-relaxed text-ink-muted">
          <p>
            Statements are produced directly from the association&rsquo;s
            transaction ledger. Every entry shows its reference and the running
            balance after it, so the document reconciles line by line.
          </p>
          <p className="mt-2">
            Choose <strong>PDF</strong> to open a printable statement — use your
            browser&rsquo;s print dialog and select &ldquo;Save as PDF&rdquo;.
            Choose <strong>CSV</strong> to open the data in Excel.
          </p>
        </div>
      </div>
    </div>
  );
}
