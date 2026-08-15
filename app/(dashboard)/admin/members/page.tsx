import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listMembers } from "@/lib/services/members";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberSearch } from "@/components/dashboard/MemberSearch";
import { PaginationLinks } from "@/components/dashboard/PaginationLinks";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { MemberStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Members | RTA" };
export const dynamic = "force-dynamic";

const VALID_STATUS = new Set([
  "PENDING_APPROVAL",
  "ACTIVE",
  "SUSPENDED",
  "INACTIVE",
  "EXITED",
  "REJECTED",
]);

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const context = await requirePermission(PERMISSIONS.MEMBERS_VIEW, "/admin/members");
  const associationId = resolveAssociationScope(context);
  const params = await searchParams;

  const data = await listMembers({
    associationId,
    page: Number(params.page) || 1,
    search: params.q?.trim() || undefined,
    status:
      params.status && VALID_STATUS.has(params.status)
        ? (params.status as MemberStatus)
        : undefined,
  });

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${data.total} member${data.total === 1 ? "" : "s"} in the register.`}
        actions={
          context.permissions.has(PERMISSIONS.MEMBERS_CREATE) ? (
            <Button asChild size="sm">
              <Link href="/admin/members/new">
                <UserPlus className="size-3.5" aria-hidden="true" />
                Enrol member
              </Link>
            </Button>
          ) : undefined
        }
      />

      <MemberSearch basePath="/admin/members" />

      {data.members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="No members match these filters. Try clearing the search."
          className="mt-5"
        />
      ) : (
        <TableWrapper className="mt-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead align="right">Savings</TableHead>
                <TableHead align="right">Loan owing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="block font-medium text-ink hover:text-primary"
                    >
                      {member.fullName}
                    </Link>
                    <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                      {member.memberNumber} · {member.paymentReference}
                    </span>
                  </TableCell>

                  <TableCell className="text-sm text-ink-muted">
                    {member.phone && <span className="block">{member.phone}</span>}
                    {member.email && (
                      <span className="block max-w-[180px] truncate text-xs">
                        {member.email}
                      </span>
                    )}
                  </TableCell>

                  <TableCell align="right" tabular>
                    {formatMoney(member.balance, { showSymbol: false })}
                  </TableCell>

                  <TableCell align="right" tabular>
                    <span className={member.hasOverdueLoan ? "text-red-600" : "text-ink"}>
                      {formatMoney(member.outstandingLoan, { showSymbol: false })}
                    </span>
                    {member.hasOverdueLoan && (
                      <span className="mt-0.5 block text-[11px] font-semibold text-red-600">
                        overdue
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={member.status} size="sm" />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={member.kycStatus} size="sm" />
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {member.joinedAt
                      ? new Date(member.joinedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
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
