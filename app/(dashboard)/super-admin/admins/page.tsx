import type { Metadata } from "next";
import { KeyRound, Lock, ShieldCheck, Users } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { listAdminUsers } from "@/lib/services/admin-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchFilterForm } from "@/components/dashboard/SearchFilterForm";
import { PaginationLinks } from "@/components/dashboard/PaginationLinks";
import { parsePage, parseUserRole, parseUserStatus } from "@/lib/validation/filters";
import {
  TableWrapper,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Administrators | RTA" };
export const dynamic = "force-dynamic";

const ROLE_OPTIONS = [
  { value: "ALL", label: "All admin roles" },
  { value: "ADMIN", label: "Association admin" },
  { value: "SUPER_ADMIN", label: "Super admin" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "LOCKED", label: "Locked" },
  { value: "DISABLED", label: "Disabled" },
  { value: "PENDING_VERIFICATION", label: "Pending verification" },
];

export default async function PlatformAdminsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; role?: string; status?: string }>;
}) {
  await requireSuperAdmin("/super-admin/admins");
  const params = await searchParams;

  const search = params.q?.trim() || undefined;
  const role = parseUserRole(params.role);
  const status = parseUserStatus(params.status);

  // null scope = every association, plus super admins who belong to none.
  const data = await listAdminUsers(null, {
    page: parsePage(params.page),
    search,
    role,
    status,
  });

  const active = data.admins.filter((a) => a.status === "ACTIVE").length;
  const locked = data.admins.filter((a) => a.locked).length;
  const withOverrides = data.admins.filter((a) => a.overrideCount > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrators"
        description="Everyone with administrative access, and what they can reach."
      />

      <StatGrid columns={4}>
        <StatCard
          label="Administrators"
          value={String(data.total)}
          hint="Matching this filter"
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Active on this page"
          value={String(active)}
          hint="Able to sign in right now"
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Locked out"
          value={String(locked)}
          hint={locked > 0 ? "Failed sign-in lockout in force" : "No lockouts"}
          icon={Lock}
          tone={locked > 0 ? "warning" : "default"}
        />
        <StatCard
          label="With overrides"
          value={String(withOverrides)}
          hint="Permissions differ from their role"
          icon={KeyRound}
          href="/super-admin/permissions"
        />
      </StatGrid>

      <SearchFilterForm
        action="/super-admin/admins"
        placeholder="Name, email or phone…"
        search={search}
        selects={[
          { name: "role", label: "Role", value: role, options: ROLE_OPTIONS },
          { name: "status", label: "Status", value: status, options: STATUS_OPTIONS },
        ]}
      />

      {data.admins.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No administrators found"
          description="No accounts match these filters. Try clearing them."
        />
      ) : (
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrator</TableHead>
                <TableHead>Association</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Security</TableHead>
                <TableHead>Last sign-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <span className="block font-medium text-ink">
                      {admin.fullName}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-muted">
                      {admin.email ?? admin.phone ?? "No contact on file"}
                    </span>
                  </TableCell>

                  <TableCell className="text-sm">
                    {admin.associationName ? (
                      <>
                        <span className="block text-ink">{admin.associationName}</span>
                        <span className="mt-0.5 block font-mono text-xs text-ink-muted">
                          {admin.associationCode}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-muted">Platform-wide</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={admin.role} size="sm" />
                  </TableCell>

                  <TableCell>
                    <StatusBadge status={admin.status} size="sm" />
                    {admin.locked && (
                      <span className="mt-1 block text-[11px] font-semibold text-amber-700">
                        locked out
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-ink-muted">
                    <span className="block">
                      2FA {admin.twoFactorEnabled ? "on" : "off"}
                    </span>
                    {admin.mustChangePassword && (
                      <span className="mt-0.5 block font-semibold text-amber-700">
                        must change password
                      </span>
                    )}
                    {admin.overrideCount > 0 && (
                      <span className="mt-0.5 block">
                        {admin.overrideCount} permission override(s)
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                    {admin.lastLoginAt
                      ? admin.lastLoginAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Never"}
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
