import type { Metadata } from "next";
import { Check, KeyRound, Minus, ShieldAlert, Users } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getPermissionMatrix } from "@/lib/services/admin-queries";
import { ALL_PERMISSIONS } from "@/lib/auth/permissions";
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
import type { UserRole } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Permissions | RTA" };
export const dynamic = "force-dynamic";

const ROLES: UserRole[] = ["MEMBER", "ADMIN", "SUPER_ADMIN"];

const ROLE_LABEL: Record<UserRole, string> = {
  MEMBER: "Member",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

export default async function PlatformPermissionsPage() {
  await requireSuperAdmin("/super-admin/permissions");
  const { permissions, overrides } = await getPermissionMatrix();

  // The catalogue in code is the intended state; the table is what is being
  // enforced. A permission defined in code but absent from the database is
  // never granted to anyone, which is worth saying out loud.
  const stored = new Set(permissions.map((p) => p.code));
  const missing = ALL_PERMISSIONS.filter((code) => !stored.has(code));

  const byCategory = new Map<string, typeof permissions>();
  for (const permission of permissions) {
    const list = byCategory.get(permission.category) ?? [];
    list.push(permission);
    byCategory.set(permission.category, list);
  }

  const activeOverrides = overrides.filter((o) => !o.expired);
  const revocations = activeOverrides.filter((o) => !o.granted);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="What each role may do, and every exception granted to an individual."
      />

      <StatGrid columns={4}>
        <StatCard
          label="Permissions"
          value={String(permissions.length)}
          hint={`${byCategory.size} categories`}
          icon={KeyRound}
          tone="primary"
        />
        <StatCard
          label="Active overrides"
          value={String(activeOverrides.length)}
          hint="Individual grants and revocations"
          icon={Users}
          tone={activeOverrides.length > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Revocations"
          value={String(revocations.length)}
          hint="Taken away from someone's role"
          icon={ShieldAlert}
          tone={revocations.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Not in database"
          value={String(missing.length)}
          hint={
            missing.length > 0
              ? "Defined in code but never granted"
              : "Catalogue is in sync"
          }
          icon={ShieldAlert}
          tone={missing.length > 0 ? "danger" : "success"}
        />
      </StatGrid>

      {missing.length > 0 && (
        <Alert variant="warning" title="Permission catalogue is out of sync">
          {missing.length} permission(s) exist in <code>lib/auth/permissions.ts</code>{" "}
          but have no row in the database, so nobody holds them regardless of
          role: <code>{missing.join(", ")}</code>. Re-run the seed to reconcile.
        </Alert>
      )}

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Role matrix
        </h2>
        <div className="space-y-5">
          {[...byCategory.entries()].map(([category, rows]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {category}
              </h3>
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      {ROLES.map((role) => (
                        <TableHead key={role} align="center">
                          {ROLE_LABEL[role]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <span className="block font-medium text-ink">
                            {permission.name}
                          </span>
                          <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">
                            {permission.code}
                          </span>
                          {permission.description && (
                            <span className="mt-1 block max-w-lg text-xs text-ink-muted">
                              {permission.description}
                            </span>
                          )}
                        </TableCell>
                        {ROLES.map((role) => (
                          <TableCell key={role} align="center">
                            {permission.roles.includes(role) ? (
                              <span
                                className="inline-flex size-6 items-center justify-center rounded-full bg-success/10 text-success"
                                title={`${ROLE_LABEL[role]} holds this by default`}
                              >
                                <Check className="size-3.5" aria-hidden="true" />
                                <span className="sr-only">Granted</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex size-6 items-center justify-center rounded-full bg-ink/[0.05] text-ink-muted"
                                title={`${ROLE_LABEL[role]} does not hold this`}
                              >
                                <Minus className="size-3.5" aria-hidden="true" />
                                <span className="sr-only">Not granted</span>
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Individual overrides
        </h2>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Effect</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Granted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.length === 0 ? (
                <TableEmpty colSpan={5}>
                  No individual overrides are in force — everyone holds exactly
                  what their role gives them.
                </TableEmpty>
              ) : (
                overrides.map((override) => (
                  <TableRow key={override.id}>
                    <TableCell>
                      <span className="block font-medium text-ink">
                        {override.userName}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                        <StatusBadge status={override.userRole} size="sm" />
                        {override.associationName ?? "Platform-wide"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="block text-sm text-ink">
                        {override.permissionName}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">
                        {override.code}
                      </span>
                    </TableCell>

                    <TableCell>
                      <StatusBadge
                        status={override.granted ? "APPROVED" : "REJECTED"}
                        label={override.granted ? "Granted" : "Revoked"}
                        size="sm"
                      />
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {override.expiresAt
                        ? override.expiresAt.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Never"}
                      {override.expired && (
                        <span className="mt-0.5 block text-[11px] font-semibold text-ink-muted">
                          expired — no longer in force
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {override.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      <p className="rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
        Revocations beat grants: where two rules disagree about whether someone
        may act, the answer is no. This screen reports what the database
        enforces — hiding a menu item never protects anything on its own.
      </p>
    </div>
  );
}
