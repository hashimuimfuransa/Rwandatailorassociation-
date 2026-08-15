import type { Metadata } from "next";
import { Bell, CheckCheck, Send, TriangleAlert } from "lucide-react";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listSentNotifications } from "@/lib/services/admin-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
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

export const metadata: Metadata = { title: "Notifications | RTA" };
export const dynamic = "force-dynamic";

/** Turns "PAYMENT_RECEIVED" into "Payment received". */
function humanise(value: string): string {
  const lower = value.replace(/_/g, " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; eventType?: string }>;
}) {
  const context = await requirePermission(
    PERMISSIONS.NOTIFICATIONS_SEND,
    "/admin/notifications"
  );
  const associationId = resolveAssociationScope(context);
  const params = await searchParams;

  const data = await listSentNotifications(associationId, {
    page: parsePage(params.page),
    eventType: params.eventType && params.eventType !== "ALL" ? params.eventType : undefined,
  });

  const failed = data.deliveryStatus.FAILED ?? 0;
  const sent = data.deliveryStatus.SENT ?? 0;
  const delivered = data.deliveryStatus.DELIVERED ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Everything the system has sent to members, and whether it arrived."
      />

      <StatGrid columns={4}>
        <StatCard
          label="Notifications sent"
          value={String(data.total)}
          hint={`${data.unread} not yet read`}
          icon={Bell}
          tone="primary"
        />
        <StatCard
          label="Delivered"
          value={String(delivered)}
          hint="Confirmed by the provider"
          icon={CheckCheck}
          tone="success"
        />
        <StatCard
          label="Sent"
          value={String(sent)}
          hint="Handed to the provider"
          icon={Send}
        />
        <StatCard
          label="Failed deliveries"
          value={String(failed)}
          hint={failed > 0 ? "Members were not reached" : "No delivery failures"}
          icon={TriangleAlert}
          tone={failed > 0 ? "danger" : "success"}
        />
      </StatGrid>

      <SearchFilterForm
        action="/admin/notifications"
        showSearch={false}
        selects={[
          {
            name: "eventType",
            label: "Event",
            value: params.eventType,
            options: [
              { value: "ALL", label: "All events" },
              ...data.eventTypes.map((e) => ({
                value: e.eventType,
                label: `${humanise(e.eventType)} (${e.count})`,
              })),
            ],
            width: "lg:w-72",
          },
        ]}
      />

      {data.notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing has been sent yet"
          description="Notifications are raised automatically when payments are credited, loans are decided and withdrawals are processed."
        />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Read</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <span className="block font-medium text-ink">
                      {notification.recipient}
                    </span>
                    {notification.memberNumber && (
                      <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                        {notification.memberNumber}
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="max-w-sm">
                    <span className="block font-medium text-ink">
                      {notification.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-muted">
                      {notification.body}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="block text-xs text-ink-muted">
                      {humanise(notification.eventType)}
                    </span>
                    <StatusBadge
                      status={notification.severity}
                      size="sm"
                      className="mt-1"
                    />
                  </TableCell>

                  <TableCell>
                    {notification.deliveries.length === 0 ? (
                      <span className="text-xs text-ink-muted">In-app only</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {notification.deliveries.map((delivery, index) => (
                          <span
                            key={`${notification.id}-${delivery.channel}-${index}`}
                            className="flex items-center gap-1.5 text-[11px]"
                          >
                            <span className="font-semibold uppercase text-ink-muted">
                              {delivery.channel}
                            </span>
                            <StatusBadge status={delivery.status} size="sm" />
                          </span>
                        ))}
                        {notification.deliveries
                          .filter((d) => d.errorMessage)
                          .map((d, index) => (
                            <span
                              key={`${notification.id}-err-${index}`}
                              className="max-w-[200px] truncate text-[11px] text-red-600"
                            >
                              {d.errorMessage}
                            </span>
                          ))}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {notification.createdAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`text-xs font-semibold ${
                        notification.read ? "text-emerald-700" : "text-ink-muted"
                      }`}
                    >
                      {notification.read ? "Read" : "Unread"}
                    </span>
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
