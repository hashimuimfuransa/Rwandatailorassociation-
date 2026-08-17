import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { getDashboardCopy } from "@/lib/i18n/server";
import { pluralize } from "@/lib/i18n/fill";
import { formatDateTime } from "@/lib/i18n/dates";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { Alert } from "@/components/ui/alert";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Security & password | RTA",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const context = await requireAuth("/account/password");
  const params = await searchParams;
  const { d, locale } = await getDashboardCopy();
  const copy = d.member.security;

  const [sessions, recentLogins] = await Promise.all([
    prisma.session.count({
      where: { userId: context.user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
    prisma.loginActivity.findMany({
      where: { userId: context.user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        success: true,
        failureReason: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    }),
  ]);

  const forced = params.required === "1" || context.user.mustChangePassword;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={copy.title} description={copy.description} />

      {forced && (
        <Alert variant="warning" title={copy.forcedTitle}>
          {copy.forcedBody}
        </Alert>
      )}

      <ChangePasswordForm />

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          {copy.activeSessions}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          {pluralize(copy.sessionsCount, sessions)} {copy.sessionsWarning}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="font-heading text-base font-semibold text-ink">
          {copy.recentActivity}
        </h2>

        <ul className="mt-4 divide-y divide-border">
          {recentLogins.map((entry, index) => (
            <li key={index} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium ${
                    entry.success ? "text-ink" : "text-red-600"
                  }`}
                >
                  {entry.success ? copy.successfulSignIn : copy.failedAttempt}
                  {!entry.success && entry.failureReason && (
                    <span className="ml-1 font-normal text-ink-muted">
                      ({entry.failureReason.toLowerCase().replace(/_/g, " ")})
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {entry.ipAddress ?? copy.unknownIp}
                  {entry.userAgent && ` · ${entry.userAgent.slice(0, 60)}`}
                </p>
              </div>
              <time className="whitespace-nowrap text-xs text-ink-muted">
                {formatDateTime(entry.createdAt, locale)}
              </time>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-ink-muted">{copy.warning}</p>
      </section>
    </div>
  );
}
