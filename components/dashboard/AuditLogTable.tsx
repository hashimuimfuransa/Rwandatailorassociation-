import { prisma, Prisma } from "@/lib/db/prisma";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { PaginationLinks } from "@/components/dashboard/PaginationLinks";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity } from "lucide-react";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

/**
 * Audit log viewer.
 *
 * A server component so the audit data never has to cross to the client — it
 * contains before/after values of financial records, which is exactly the sort
 * of thing that should not be sitting in a browser's memory or its React
 * payload longer than necessary.
 *
 * CRITICAL entries are visually distinct because they are the ones an auditor
 * scans for: balance adjustments, reversals, permission grants, cross-tenant
 * access attempts.
 */

const SEVERITY_TONE: Record<string, StatusTone> = {
  INFO: "neutral",
  NOTICE: "info",
  WARNING: "warning",
  CRITICAL: "danger",
};

export async function AuditLogTable({
  associationId,
  page = 1,
  pageSize = 40,
  action,
  actorId,
}: {
  /// null = platform-wide (super admin only).
  associationId: string | null;
  page?: number;
  pageSize?: number;
  action?: string;
  actorId?: string;
}) {
  const where: Prisma.AuditLogWhereInput = {
    ...(associationId ? { associationId } : {}),
    ...(action ? { action } : {}),
    ...(actorId ? { actorId } : {}),
  };

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        actorEmail: true,
        actorRole: true,
        reason: true,
        oldValue: true,
        newValue: true,
        severity: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
  ]);

  if (total === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No audit entries"
        description="Consequential actions — approvals, adjustments, reversals, permission changes — are recorded here as they happen."
      />
    );
  }

  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>Severity</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {entries.map((entry) => (
            <TableRow
              key={entry.id}
              className={entry.severity === "CRITICAL" ? "bg-red-50/40" : undefined}
            >
              <TableCell className="whitespace-nowrap text-xs text-ink-muted">
                {entry.createdAt.toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {entry.ipAddress && (
                  <span className="mt-0.5 block font-mono text-[10px]">
                    {entry.ipAddress}
                  </span>
                )}
              </TableCell>

              <TableCell>
                <span className="font-mono text-xs font-semibold text-ink">
                  {entry.action}
                </span>
              </TableCell>

              <TableCell className="text-sm">
                <span className="block text-ink">
                  {entry.actorEmail ?? <em className="text-ink-muted">system</em>}
                </span>
                {entry.actorRole && (
                  <span className="block text-xs text-ink-muted">
                    {entry.actorRole.replace(/_/g, " ").toLowerCase()}
                  </span>
                )}
              </TableCell>

              <TableCell className="text-sm text-ink-muted">
                <span className="block">{entry.entityType}</span>
                {entry.entityId && (
                  <span className="block font-mono text-[10px]">
                    {entry.entityId.slice(0, 12)}…
                  </span>
                )}
              </TableCell>

              <TableCell className="max-w-sm">
                {entry.reason && (
                  <p className="text-xs font-medium text-ink">{entry.reason}</p>
                )}
                {(entry.oldValue || entry.newValue) && (
                  <p className="mt-0.5 line-clamp-2 font-mono text-[10px] leading-relaxed text-ink-muted">
                    {summarise(entry.oldValue, entry.newValue)}
                  </p>
                )}
              </TableCell>

              <TableCell>
                <StatusBadge
                  status={entry.severity}
                  tone={SEVERITY_TONE[entry.severity] ?? "neutral"}
                  label={entry.severity.toLowerCase()}
                  size="sm"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaginationLinks
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
      />
    </TableWrapper>
  );
}

/**
 * Condenses a before/after JSON pair into one readable line.
 * Only the fields that actually changed are shown — dumping whole objects into
 * a table cell makes the log unreadable and hides the one field that matters.
 */
function summarise(oldValue: unknown, newValue: unknown): string {
  const before = (oldValue ?? {}) as Record<string, unknown>;
  const after = (newValue ?? {}) as Record<string, unknown>;

  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];

  const parts = keys
    .filter((key) => String(before[key]) !== String(after[key]))
    .slice(0, 4)
    .map((key) => {
      const from = before[key];
      const to = after[key];
      if (from === undefined) return `${key}: ${String(to)}`;
      if (to === undefined) return `${key}: (removed)`;
      return `${key}: ${String(from)} → ${String(to)}`;
    });

  return parts.join("  ·  ");
}
