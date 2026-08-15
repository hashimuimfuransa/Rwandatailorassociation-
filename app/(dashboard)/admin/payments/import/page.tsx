import type { Metadata } from "next";
import { Info } from "lucide-react";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { Alert } from "@/components/ui/alert";
import { StatementImport } from "@/components/dashboard/StatementImport";

export const metadata: Metadata = { title: "Import bank statement | RTA" };
export const dynamic = "force-dynamic";

export default async function StatementImportPage() {
  const context = await requirePermission(
    PERMISSIONS.PAYMENTS_RECONCILE,
    "/admin/payments/import"
  );

  const canImport = context.permissions.has(PERMISSIONS.PAYMENTS_MATCH_MANUAL);

  return (
    <div>
      <PageHeader
        title="Import bank statement"
        description="Upload a PDF statement to credit members who have paid."
      />

      {!canImport && (
        <Alert variant="warning" className="mb-5">
          You can upload and preview a statement, but you do not have permission
          to commit an import. Ask a super administrator for the
          &ldquo;Match payments manually&rdquo; permission.
        </Alert>
      )}

      <Alert variant="info" className="mb-5" title="How this works">
        <ol className="mt-1 list-inside list-decimal space-y-1">
          <li>Upload the PDF statement from your association&rsquo;s bank account.</li>
          <li>
            Review every row. The system shows which member each payment would be
            credited to, and why.
          </li>
          <li>
            Tick the rows you have checked and confirm. Only ticked rows are
            imported.
          </li>
          <li>
            Members are credited and receive an SMS confirming their new balance.
          </li>
        </ol>
      </Alert>

      <StatementImport canImport={canImport} />

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-surface p-5">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="text-sm leading-relaxed text-ink-muted">
          <p>
            <strong className="text-ink">The PDF must be a digital statement</strong>,
            not a scan or a photograph. A scanned image contains no text to read.
            If your bank only provides scans, ask for the PDF or CSV export from
            internet banking.
          </p>
          <p className="mt-2">
            Re-uploading the same statement is safe. Rows already imported are
            detected and skipped, so nobody is credited twice.
          </p>
          <p className="mt-2">
            Only <strong className="text-ink">credits</strong> can be member
            contributions. Debits are shown for context but never imported.
          </p>
        </div>
      </div>
    </div>
  );
}
