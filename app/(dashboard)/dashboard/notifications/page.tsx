import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { requireAuth } from "@/lib/auth/guards";
import { getMemberNotifications } from "@/lib/services/member-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/empty-state";
import { MarkAllReadButton } from "@/components/dashboard/MarkAllReadButton";
import { PaginationLinks } from "@/components/dashboard/PaginationLinks";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications | RTA" };
export const dynamic = "force-dynamic";

const SEVERITY_STYLES: Record<string, string> = {
  INFO: "border-l-primary",
  SUCCESS: "border-l-success",
  WARNING: "border-l-gold",
  CRITICAL: "border-l-red-500",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const context = await requireAuth("/dashboard/notifications");
  const params = await searchParams;

  const data = await getMemberNotifications(
    context.user.id,
    Math.max(1, Number(params.page) || 1)
  );

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={
          data.unread > 0
            ? `${data.unread} unread`
            : "You are up to date."
        }
        actions={data.unread > 0 ? <MarkAllReadButton /> : undefined}
      />

      {data.notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Payment confirmations, loan updates and reminders will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <ul className="divide-y divide-border">
            {data.notifications.map((notification) => {
              const body = (
                <div
                  className={cn(
                    "border-l-4 px-5 py-4 transition-colors",
                    SEVERITY_STYLES[notification.severity] ?? "border-l-border",
                    notification.readAt ? "bg-surface" : "bg-primary-50/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "font-heading text-sm",
                          notification.readAt
                            ? "font-medium text-ink"
                            : "font-bold text-ink"
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                        {notification.body}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {!notification.readAt && (
                        <span
                          className="size-2 rounded-full bg-primary"
                          aria-label="Unread"
                        />
                      )}
                      <time
                        className="whitespace-nowrap text-xs text-ink-muted"
                        dateTime={notification.createdAt.toISOString()}
                      >
                        {relativeTime(notification.createdAt)}
                      </time>
                    </div>
                  </div>
                </div>
              );

              return (
                <li key={notification.id}>
                  {notification.actionUrl ? (
                    <Link href={notification.actionUrl} className="block hover:bg-ink/[0.02]">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>

          <PaginationLinks
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
          />
        </div>
      )}
    </div>
  );
}

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
