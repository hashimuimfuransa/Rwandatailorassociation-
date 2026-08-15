import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
  Gauge,
  HandCoins,
  Link2,
  PiggyBank,
  ShieldCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAdminDashboard } from "@/lib/services/admin-dashboard";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { getEnv } from "@/lib/env";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Platform overview | RTA" };
export const dynamic = "force-dynamic";

/**
 * Job failures in the last 24 hours.
 *
 * Lives outside the component because React's purity rule forbids calling
 * `Date.now()` during render — a component must be idempotent, and reading the
 * clock is not. Async server components render once per request so it would be
 * harmless here in practice, but keeping time-dependent work in a plain
 * function is the right shape regardless.
 */
async function countRecentJobFailures(): Promise<number> {
  const since = new Date(Date.now() - 24 * 3_600_000);
  return prisma.jobRun.count({ where: { status: "FAILED", startedAt: { gte: since } } });
}

/**
 * Super-admin platform overview.
 *
 * Answers the questions the brief poses for this role: what is happening
 * across the platform, which associations are active, are payments working,
 * are there errors, are there suspicious transactions.
 *
 * The integration and job-health panels matter most. A reconciliation job that
 * has quietly stopped running is invisible on every other screen in the system
 * — members simply stop being credited — so it is surfaced here explicitly.
 */
export default async function SuperAdminPage() {
  await requireSuperAdmin("/super-admin");

  // Platform-wide: null scope means no association filter.
  const [platform, associations, recentJobs, failedJobs, suspicious, admins, integrityFailures] =
    await Promise.all([
      getAdminDashboard(null),

      prisma.association.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          currency: true,
          createdAt: true,
          _count: { select: { members: true, loans: true } },
        },
      }),

      prisma.jobRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 12,
        select: {
          id: true,
          jobName: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          durationMs: true,
          itemsProcessed: true,
          itemsFailed: true,
          errorMessage: true,
        },
      }),

      countRecentJobFailures(),

      prisma.payment.count({ where: { isSuspicious: true } }),

      prisma.user.count({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" } }),

      // Was the last integrity sweep clean?
      prisma.jobRun.findFirst({
        where: { jobName: "ledger-integrity-check" },
        orderBy: { startedAt: "desc" },
        select: { itemsFailed: true, startedAt: true, status: true },
      }),
    ]);

  const env = getEnv();
  const totalSavings = platform.savings.totalBalance;

  // Any job whose last run failed, keyed by name.
  const lastRunByJob = new Map<string, (typeof recentJobs)[number]>();
  for (const job of recentJobs) {
    if (!lastRunByJob.has(job.jobName)) lastRunByJob.set(job.jobName, job);
  }
  const stalledJobs = [...lastRunByJob.values()].filter((j) => j.status === "FAILED");

  return (
    <div className="space-y-7">
      <PageHeader
        title="Platform overview"
        description="Everything across every association on the platform."
      />

      {/* System health first — this is what a super admin is here for. */}
      {env.JENGA_MODE === "sandbox" && (
        <Alert variant="warning" title="Payment provider is in SANDBOX mode">
          Transactions are fabricated by the mock adapter and must not back real
          member balances. Set <code>JENGA_MODE=live</code> with real credentials
          before go-live.
        </Alert>
      )}

      {integrityFailures && integrityFailures.itemsFailed > 0 && (
        <Alert variant="error" title="Ledger integrity failures detected">
          The last integrity sweep found{" "}
          <strong>{integrityFailures.itemsFailed}</strong> savings account(s)
          whose cached balance does not match their transaction history.
          Investigate immediately — this indicates a bug or direct database
          modification.
        </Alert>
      )}

      {stalledJobs.length > 0 && (
        <Alert variant="error" title="Background jobs are failing">
          {stalledJobs.map((j) => j.jobName).join(", ")} last failed. While
          reconciliation is down, member payments are not being credited.
        </Alert>
      )}

      {suspicious > 0 && (
        <Alert variant="warning" title="Suspicious payments held">
          {suspicious} payment{suspicious === 1 ? " has" : "s have"} been flagged
          and withheld from crediting.
        </Alert>
      )}

      {/* Platform financials */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-ink-muted">
          Platform financials
        </h2>
        <StatGrid columns={4}>
          <StatCard
            label="Total savings held"
            value={formatMoney(totalSavings)}
            hint={`${platform.members.total} members across ${associations.length} association${associations.length === 1 ? "" : "s"}`}
            icon={PiggyBank}
            tone="primary"
          />
          <StatCard
            label="Loans outstanding"
            value={formatMoney(platform.loans.outstanding)}
            hint={`${platform.loans.activeCount} active`}
            icon={HandCoins}
          />
          <StatCard
            label="In arrears"
            value={formatMoney(platform.loans.overdueAmount)}
            hint={`${platform.loans.overdueCount} overdue loan(s)`}
            icon={AlertTriangle}
            tone={platform.loans.overdueCount > 0 ? "danger" : "success"}
          />
          <StatCard
            label="Collected today"
            value={formatMoney(platform.savings.depositsToday)}
            hint={`${platform.savings.transactionsToday} transactions`}
            icon={CreditCard}
            tone="success"
          />
        </StatGrid>
      </section>

      {/* Operational health */}
      <section>
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-ink-muted">
          System health
        </h2>
        <StatGrid columns={4}>
          <StatCard
            label="Unmatched payments"
            value={String(platform.payments.unmatchedCount)}
            hint={formatMoney(platform.payments.unmatchedAmount)}
            icon={Link2}
            tone={platform.payments.unmatchedCount > 0 ? "warning" : "success"}
          />
          <StatCard
            label="Failed payments"
            value={String(platform.payments.failedCount)}
            hint="Rejected at verification"
            icon={AlertTriangle}
            tone={platform.payments.failedCount > 0 ? "warning" : "success"}
          />
          <StatCard
            label="Job failures (24h)"
            value={String(failedJobs)}
            hint="Background job runs"
            icon={Activity}
            tone={failedJobs > 0 ? "danger" : "success"}
            href="/super-admin/jobs"
          />
          <StatCard
            label="Active administrators"
            value={String(admins)}
            hint="Admins and super admins"
            icon={ShieldCheck}
            href="/super-admin/admins"
          />
        </StatGrid>
      </section>

      {/* Associations */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">Associations</h2>
          <Link
            href="/super-admin/associations"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Manage
          </Link>
        </div>

        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Association</TableHead>
                <TableHead>Code</TableHead>
                <TableHead align="right">Members</TableHead>
                <TableHead align="right">Loans</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {associations.map((association) => (
                <TableRow key={association.id}>
                  <TableCell className="font-medium text-ink">
                    {association.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-muted">
                    {association.code}
                  </TableCell>
                  <TableCell align="right" tabular>
                    {association._count.members}
                  </TableCell>
                  <TableCell align="right" tabular>
                    {association._count.loans}
                  </TableCell>
                  <TableCell className="text-sm text-ink-muted">
                    {association.currency}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={association.status} size="sm" />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {association.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      {/* Background jobs */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Recent background jobs
          </h2>
          <Link
            href="/super-admin/jobs"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead align="right">Processed</TableHead>
                <TableHead align="right">Failed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentJobs.length === 0 ? (
                <TableEmpty colSpan={6}>
                  No background jobs have run yet. Start the worker with{" "}
                  <code className="font-mono">npm run worker</code>.
                </TableEmpty>
              ) : (
                recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-ink">{job.jobName}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {job.startedAt.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-ink-muted">
                      {job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : "—"}
                    </TableCell>
                    <TableCell align="right" tabular>
                      {job.itemsProcessed}
                    </TableCell>
                    <TableCell align="right" tabular>
                      <span className={job.itemsFailed > 0 ? "text-red-600" : ""}>
                        {job.itemsFailed}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} size="sm" />
                      {job.errorMessage && (
                        <span className="mt-1 block max-w-[240px] truncate text-[11px] text-red-600">
                          {job.errorMessage}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/super-admin/audit"
          icon={Activity}
          title="Audit log"
          detail="Every consequential action, platform-wide"
        />
        <QuickLink
          href="/super-admin/associations"
          icon={Building2}
          title="Associations"
          detail="Create and configure tenants"
        />
        <QuickLink
          href="/super-admin/admins"
          icon={Users}
          title="Administrators"
          detail="Manage admin accounts and permissions"
        />
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: typeof Gauge;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-lift"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-heading text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-muted">{detail}</span>
      </span>
    </Link>
  );
}

