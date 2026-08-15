import type { Metadata } from "next";
import Link from "next/link";
import { Database, Server, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getSettings } from "@/lib/services/admin-queries";
import { listAssociations } from "@/lib/services/associations";
import { getEnv } from "@/lib/env";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { SettingsTable } from "@/components/dashboard/SettingsTable";

export const metadata: Metadata = { title: "Platform settings | RTA" };
export const dynamic = "force-dynamic";

/** Hides everything but the host of a connection string. */
function describeDatabase(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  } catch {
    return "Configured";
  }
}

export default async function PlatformSettingsPage() {
  await requireSuperAdmin("/super-admin/settings");

  const [settings, directory] = await Promise.all([
    getSettings("PLATFORM", null),
    listAssociations(),
  ]);

  const env = getEnv();
  const sandbox = env.JENGA_MODE === "sandbox";
  const production = env.NODE_ENV === "production";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Global configuration and the runtime this deployment is using."
      />

      {production && sandbox && (
        <Alert variant="error" title="Production is running the sandbox adapter">
          Member balances would be backed by fabricated transactions. Set{" "}
          <code>JENGA_MODE=live</code> immediately.
        </Alert>
      )}

      <StatGrid columns={4}>
        <StatCard
          label="Environment"
          value={env.NODE_ENV}
          hint={env.APP_URL}
          icon={Server}
          tone={production ? "primary" : "default"}
        />
        <StatCard
          label="Payment mode"
          value={sandbox ? "Sandbox" : "Live"}
          hint={sandbox ? "Transactions are simulated" : "Real money"}
          icon={ShieldCheck}
          tone={sandbox ? "warning" : "success"}
          href="/super-admin/integrations"
        />
        <StatCard
          label="Associations"
          value={String(directory.totals.associations)}
          hint={`${directory.totals.members} members platform-wide`}
          icon={Database}
          href="/super-admin/associations"
        />
        <StatCard
          label="Stored settings"
          value={String(settings.length)}
          hint="Platform-scoped configuration rows"
          icon={SlidersHorizontal}
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel icon={Server} title="Runtime">
          <Row label="Node environment" value={env.NODE_ENV} />
          <Row label="Application URL" value={env.APP_URL} mono />
          <Row label="Database" value={describeDatabase(env.DATABASE_URL)} mono />
          <Row
            label="Payment provider"
            value={
              <StatusBadge
                status={sandbox ? "PENDING" : "ACTIVE"}
                label={sandbox ? "Sandbox" : "Live"}
                tone={sandbox ? "warning" : "success"}
                size="sm"
              />
            }
          />
          <Row label="Email provider" value={env.EMAIL_PROVIDER} />
          <Row label="SMS provider" value={env.SMS_PROVIDER} />
        </Panel>

        <Panel icon={ShieldCheck} title="Where configuration lives">
          <p className="py-2 text-sm leading-relaxed text-ink-muted">
            Secrets and connection details come from the environment, never from
            the database — they must be settable before the application can
            start, and they must not be readable through the web interface.
          </p>
          <p className="py-2 text-sm leading-relaxed text-ink-muted">
            The rows below are the settings that <em>can</em> change at runtime.
            Association-specific rules live with each association instead; open
            one from the{" "}
            <Link
              href="/super-admin/associations"
              className="font-semibold text-primary hover:underline"
            >
              tenant directory
            </Link>
            .
          </p>
        </Panel>
      </div>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Platform configuration
        </h2>
        <SettingsTable
          settings={settings}
          emptyMessage="No platform settings are stored; every value currently comes from the environment."
        />
      </section>

      <p className="rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
        This screen is read-only. Editing global financial configuration from a
        browser session is a single point of catastrophic failure, so changes go
        through deployment and are recorded in the{" "}
        <Link
          href="/super-admin/audit"
          className="font-semibold text-primary hover:underline"
        >
          audit log
        </Link>
        .
      </p>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Server;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold text-ink">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {title}
      </h2>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-ink-muted">{label}</dt>
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
