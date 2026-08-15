import type { Metadata } from "next";
import Link from "next/link";
import {
  CreditCard,
  Link2,
  Mail,
  MessageSquare,
  ShieldAlert,
  Webhook,
} from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getIntegrationHealth } from "@/lib/services/admin-queries";
import { getEnv } from "@/lib/env";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
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

export const metadata: Metadata = { title: "Integrations | RTA" };
export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null): string {
  return value
    ? value.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";
}

export default async function PlatformIntegrationsPage() {
  await requireSuperAdmin("/super-admin/integrations");

  const [health, env] = await Promise.all([
    getIntegrationHealth(),
    Promise.resolve(getEnv()),
  ]);

  // Only ever whether a credential is present — never the value itself.
  const jengaCredentials = [
    { label: "API key", set: Boolean(env.JENGA_API_KEY) },
    { label: "Merchant code", set: Boolean(env.JENGA_MERCHANT_CODE) },
    { label: "Consumer secret", set: Boolean(env.JENGA_CONSUMER_SECRET) },
    { label: "Collection account", set: Boolean(env.JENGA_ACCOUNT_NUMBER) },
    {
      label: "Signing key",
      set: Boolean(env.JENGA_PRIVATE_KEY_PATH || env.JENGA_PRIVATE_KEY_BASE64),
    },
    { label: "Webhook secret", set: Boolean(env.JENGA_WEBHOOK_SECRET) },
  ];

  const missingCredentials = jengaCredentials.filter((c) => !c.set);
  const sandbox = env.JENGA_MODE === "sandbox";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="The payment provider and messaging channels this platform depends on."
      />

      {sandbox && (
        <Alert variant="warning" title="Payment provider is in SANDBOX mode">
          The mock adapter fabricates transactions. Nothing here reflects real
          money, and these balances must never be treated as authoritative. Set{" "}
          <code>JENGA_MODE=live</code> with real credentials before go-live.
        </Alert>
      )}

      {!sandbox && missingCredentials.length > 0 && (
        <Alert variant="error" title="Live mode is missing credentials">
          {missingCredentials.map((c) => c.label).join(", ")} are not configured.
          Payment collection and verification will fail.
        </Alert>
      )}

      {health.unverifiedPayments > 0 && (
        <Alert variant="warning" title="Payments are awaiting verification">
          {health.unverifiedPayments} payment(s) have been captured but never
          confirmed with the provider. A payment is never posted to a
          member&apos;s balance without verification, so these are not yet
          credited.
        </Alert>
      )}

      <StatGrid columns={4}>
        <StatCard
          label="Payments captured"
          value={String(
            Object.values(health.paymentStatus).reduce((sum, n) => sum + n, 0)
          )}
          hint={`Last: ${formatDateTime(health.lastPaymentAt)}`}
          icon={CreditCard}
          tone="primary"
        />
        <StatCard
          label="Awaiting attribution"
          value={String(health.paymentStatus.UNMATCHED ?? 0)}
          hint="Could not be matched to a member"
          icon={Link2}
          tone={(health.paymentStatus.UNMATCHED ?? 0) > 0 ? "warning" : "success"}
          href="/super-admin/payments?status=UNMATCHED"
        />
        <StatCard
          label="Flagged payments"
          value={String(health.suspiciousPayments)}
          hint="Held by the fraud checks"
          icon={ShieldAlert}
          tone={health.suspiciousPayments > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Failed messages (24h)"
          value={String(health.failedDeliveries24h)}
          hint={
            health.failedDeliveries24h > 0
              ? "Members were not reached"
              : "All messages delivered"
          }
          icon={MessageSquare}
          tone={health.failedDeliveries24h > 0 ? "danger" : "success"}
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          icon={CreditCard}
          title="Jenga / Equity"
          badge={
            <StatusBadge
              status={sandbox ? "PENDING" : "ACTIVE"}
              label={sandbox ? "Sandbox" : "Live"}
              tone={sandbox ? "warning" : "success"}
              size="sm"
            />
          }
        >
          <Row label="Mode" value={env.JENGA_MODE} />
          <Row label="Base URL" value={env.JENGA_API_BASE_URL} mono />
          <Row label="Country" value={env.JENGA_COUNTRY_CODE} />
          <Row
            label="Last payment"
            value={formatDateTime(health.lastPaymentAt)}
          />
          <Row
            label="Provider"
            value={health.lastPaymentProvider ?? "No payments yet"}
          />
        </Panel>

        <Panel icon={Webhook} title="Credentials">
          {jengaCredentials.map((credential) => (
            <Row
              key={credential.label}
              label={credential.label}
              value={
                <StatusBadge
                  status={credential.set ? "VERIFIED" : "UNVERIFIED"}
                  label={credential.set ? "Configured" : "Not set"}
                  size="sm"
                />
              }
            />
          ))}
        </Panel>

        <Panel icon={Webhook} title="How payments arrive">
          <Row
            label="Via webhook"
            value={String(health.ingestSource.WEBHOOK ?? 0)}
          />
          <Row label="Via polling" value={String(health.ingestSource.POLL ?? 0)} />
          <Row label="Entered manually" value={String(health.ingestSource.MANUAL ?? 0)} />
          <Row
            label="Last webhook"
            value={formatDateTime(health.lastWebhookAt)}
            hint="Webhooks are the fast path; polling is the safety net"
          />
        </Panel>

        <Panel icon={Mail} title="Messaging">
          <Row label="Email provider" value={env.EMAIL_PROVIDER} />
          <Row label="Email from" value={env.EMAIL_FROM} />
          <Row
            label="SMTP host"
            value={env.SMTP_HOST ?? (env.EMAIL_PROVIDER === "log" ? "Logging only" : "Not set")}
            mono
          />
          <Row label="SMS provider" value={env.SMS_PROVIDER} />
          <Row label="SMS sender id" value={env.SMS_SENDER_ID} />
        </Panel>
      </div>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Delivery by channel
        </h2>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead align="right">Delivered</TableHead>
                <TableHead align="right">Pending</TableHead>
                <TableHead align="right">Failed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {health.channels.length === 0 ? (
                <TableEmpty colSpan={4}>
                  No messages have been dispatched yet.
                </TableEmpty>
              ) : (
                health.channels.map((channel) => (
                  <TableRow key={channel.channel}>
                    <TableCell className="font-medium text-ink">
                      {channel.channel}
                    </TableCell>
                    <TableCell align="right" tabular className="text-emerald-700">
                      {channel.sent}
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {channel.pending}
                    </TableCell>
                    <TableCell align="right" tabular>
                      <span className={channel.failed > 0 ? "text-red-600" : ""}>
                        {channel.failed}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">
            Recent reconciliation runs
          </h2>
          <Link
            href="/super-admin/jobs"
            className="text-sm font-semibold text-primary hover:underline"
          >
            All jobs
          </Link>
        </div>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Started</TableHead>
                <TableHead align="right">Processed</TableHead>
                <TableHead align="right">Failed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {health.reconciliationRuns.length === 0 ? (
                <TableEmpty colSpan={5}>
                  Reconciliation has never run. Start the worker with{" "}
                  <code className="font-mono">npm run worker</code>.
                </TableEmpty>
              ) : (
                health.reconciliationRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium text-ink">
                      {run.jobName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {formatDateTime(run.startedAt)}
                    </TableCell>
                    <TableCell align="right" tabular>
                      {run.itemsProcessed}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: typeof CreditCard;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-ink">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {title}
        {badge && <span className="ml-auto">{badge}</span>}
      </h2>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-ink-muted">
        {label}
        {hint && (
          <span className="mt-0.5 block text-[11px] text-ink-muted/80">{hint}</span>
        )}
      </dt>
      <dd
        className={`max-w-[55%] break-words text-right text-sm font-medium text-ink ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
