import type { Metadata } from "next";
import { Activity, CheckCircle2, Clock, TriangleAlert } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { listJobRuns } from "@/lib/services/admin-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { SearchFilterForm } from "@/components/dashboard/SearchFilterForm";
import { PaginationLinks } from "@/components/dashboard/PaginationLinks";
import { parsePage } from "@/lib/validation/filters";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Background jobs | RTA" };
export const dynamic = "force-dynamic";

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

function formatDateTime(value: Date | null): string {
  return value
    ? value.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

export default async function PlatformJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; jobName?: string }>;
}) {
  await requireSuperAdmin("/super-admin/jobs");
  const params = await searchParams;

  const jobName =
    params.jobName && params.jobName !== "ALL" ? params.jobName : undefined;

  const data = await listJobRuns({ page: parsePage(params.page), jobName });

  const failing = data.latestByJob.filter((job) => job.status === "FAILED");
  const running = data.latestByJob.filter((job) => job.status === "RUNNING");
  const succeeded24h = data.last24h.SUCCESS ?? 0;
  const failed24h = data.last24h.FAILED ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Background jobs"
        description="Reconciliation, overdue sweeps and every other scheduled task."
      />

      {failing.length > 0 && (
        <Alert variant="error" title="A job's most recent run failed">
          {failing.map((job) => job.jobName).join(", ")} last failed. While
          reconciliation is down, member payments are not being credited — this
          is invisible on every other screen in the system.
        </Alert>
      )}

      {data.total === 0 && (
        <Alert variant="warning" title="No job has ever run">
          The worker does not appear to be running. Start it with{" "}
          <code>npm run worker</code>; until then, payments will not be
          reconciled and overdue loans will not be flagged.
        </Alert>
      )}

      <StatGrid columns={4}>
        <StatCard
          label="Succeeded (24h)"
          value={String(succeeded24h)}
          hint="Completed cleanly"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Failed (24h)"
          value={String(failed24h)}
          hint={failed24h > 0 ? "Investigate below" : "No failures"}
          icon={TriangleAlert}
          tone={failed24h > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Currently running"
          value={String(running.length)}
          hint={running.map((j) => j.jobName).join(", ") || "Idle"}
          icon={Clock}
        />
        <StatCard
          label="Distinct jobs"
          value={String(data.jobNames.length)}
          hint={`${data.total} run(s) recorded`}
          icon={Activity}
          tone="primary"
        />
      </StatGrid>

      {/* Health per job, since an old success does not offset a recent failure. */}
      {data.latestByJob.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
            Latest run of each job
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.latestByJob.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-heading text-sm font-semibold text-ink">
                    {job.jobName}
                  </h3>
                  <StatusBadge status={job.status} size="sm" />
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {formatDateTime(job.startedAt)} · {formatDuration(job.durationMs)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {job.itemsProcessed} processed · {job.itemsSucceeded} ok ·{" "}
                  <span className={job.itemsFailed > 0 ? "text-red-600" : ""}>
                    {job.itemsFailed} failed
                  </span>
                </p>
                {job.errorMessage && (
                  <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
                    {job.errorMessage}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <SearchFilterForm
        action="/super-admin/jobs"
        showSearch={false}
        selects={[
          {
            name: "jobName",
            label: "Job",
            value: jobName,
            options: [
              { value: "ALL", label: "All jobs" },
              ...data.jobNames.map((j) => ({
                value: j.jobName,
                label: `${j.jobName} (${j.runs})`,
              })),
            ],
            width: "lg:w-72",
          },
        ]}
      />

      {data.runs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No job runs recorded"
          description="Start the background worker with `npm run worker` to begin reconciling payments and sweeping overdue loans."
        />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead align="right">Processed</TableHead>
                <TableHead align="right">Succeeded</TableHead>
                <TableHead align="right">Failed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium text-ink">
                    {run.jobName}
                    {run.cursor && (
                      <span className="mt-0.5 block font-mono text-[10px] text-ink-muted">
                        cursor: {run.cursor.slice(0, 30)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {formatDateTime(run.startedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {formatDuration(run.durationMs)}
                  </TableCell>
                  <TableCell align="right" tabular>
                    {run.itemsProcessed}
                  </TableCell>
                  <TableCell align="right" tabular className="text-emerald-700">
                    {run.itemsSucceeded}
                  </TableCell>
                  <TableCell align="right" tabular>
                    <span className={run.itemsFailed > 0 ? "text-red-600" : ""}>
                      {run.itemsFailed}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={run.status} size="sm" />
                    {run.errorMessage && (
                      <span className="mt-1 block max-w-[240px] truncate text-[11px] text-red-600">
                        {run.errorMessage}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <PaginationLinks
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
          />
        </TableWrapper>
      )}
    </div>
  );
}
