import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  HandCoins,
  Pencil,
  PiggyBank,
  Receipt,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  assertSameAssociation,
  requirePermission,
  resolveAssociationScope,
} from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getMemberProfile } from "@/lib/services/members";
import { getMemberTransactions } from "@/lib/services/member-queries";
import { add, formatMoney, subtract } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
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

export const dynamic = "force-dynamic";

const DATE = { day: "numeric", month: "short", year: "numeric" } as const;

function formatDate(value: Date | null | undefined): string {
  return value ? value.toLocaleDateString("en-GB", DATE) : "—";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberProfile(id);
  return {
    title: member
      ? `${member.user.firstName} ${member.user.lastName} | RTA`
      : "Member | RTA",
  };
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission(
    PERMISSIONS.MEMBERS_VIEW,
    `/admin/members/${id}`
  );

  const member = await getMemberProfile(id);
  if (!member) notFound();

  // The id came from the URL, so tenant isolation is asserted after loading
  // rather than assumed: an admin of association A must not be able to read a
  // member of association B by guessing a cuid.
  assertSameAssociation(context, member, "Member");

  // Resolving the scope has no filtering role here — the assertion above did
  // the work — but calling it keeps the cross-tenant audit trail consistent
  // with every other admin screen.
  resolveAssociationScope(context, member.associationId);

  const account = member.savingsAccounts[0] ?? null;
  const recent = await getMemberTransactions(member.id, { pageSize: 15 });

  const outstanding = member.loans.reduce(
    (total, loan) => add(total, subtract(loan.totalPayable, loan.totalPaid)),
    add(0)
  );
  const overdueLoans = member.loans.filter((loan) => loan.daysOverdue > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${member.user.firstName} ${member.user.lastName}`.trim()}
        description={`Member ${member.memberNumber} · payment reference ${member.paymentReference}`}
        actions={
          <>
            {context.permissions.has(PERMISSIONS.MEMBERS_UPDATE) && (
              <Button asChild size="sm">
                <Link href={`/admin/members/${member.id}/edit`}>
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit details
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/members">Back to register</Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={member.status} />
        <StatusBadge status={member.kycStatus} />
        <StatusBadge status={member.user.status} />
        {member.suspensionReason && (
          <span className="text-sm text-red-600">
            Suspended: {member.suspensionReason}
          </span>
        )}
      </div>

      <StatGrid columns={4}>
        <StatCard
          label="Savings balance"
          value={account ? formatMoney(account.balance) : "—"}
          hint={account ? `Account ${account.accountNumber}` : "No account opened"}
          icon={PiggyBank}
          tone="primary"
        />
        <StatCard
          label="Available"
          value={
            account
              ? formatMoney(subtract(account.balance, account.lockedBalance))
              : "—"
          }
          hint={
            account
              ? `${formatMoney(account.lockedBalance)} locked`
              : "Nothing to withdraw"
          }
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Loans owing"
          value={formatMoney(outstanding)}
          hint={`${member.loans.length} loan(s) on file`}
          icon={HandCoins}
        />
        <StatCard
          label="Overdue loans"
          value={String(overdueLoans.length)}
          hint={overdueLoans.length > 0 ? "In arrears" : "Up to date"}
          icon={AlertTriangle}
          tone={overdueLoans.length > 0 ? "danger" : "success"}
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel icon={UserRound} title="Member file">
          <Row label="Member number" value={member.memberNumber} mono />
          <Row label="Payment reference" value={member.paymentReference} mono />
          <Row label="National ID" value={member.nationalId ?? "—"} mono />
          <Row label="Date of birth" value={formatDate(member.dateOfBirth)} />
          <Row label="Occupation" value={member.occupation ?? "—"} />
          <Row label="Business" value={member.businessName ?? "—"} />
          <Row
            label="Address"
            value={
              [member.addressLine1, member.city, member.district, member.province]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          <Row label="Joined" value={formatDate(member.joinedAt ?? member.createdAt)} />
          <Row label="Approved" value={formatDate(member.approvedAt)} />
        </Panel>

        <Panel icon={ShieldCheck} title="Contact and access">
          <Row label="Email" value={member.user.email ?? "—"} />
          <Row
            label="Email verified"
            value={member.user.emailVerifiedAt ? "Yes" : "No"}
          />
          <Row label="Phone" value={member.user.phone ?? "—"} />
          <Row
            label="Phone verified"
            value={member.user.phoneVerifiedAt ? "Yes" : "No"}
          />
          <Row label="Mobile money" value={member.mobileMoneyNumber ?? "—"} mono />
          <Row label="Bank account" value={member.bankAccountNumber ?? "—"} mono />
          <Row label="Last sign-in" value={formatDate(member.user.lastLoginAt)} />
          <Row label="Next of kin" value={member.nextOfKinName ?? "—"} />
          <Row label="Their phone" value={member.nextOfKinPhone ?? "—"} />
        </Panel>
      </div>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">Loans</h2>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead align="right">Principal</TableHead>
                <TableHead align="right">Payable</TableHead>
                <TableHead align="right">Repaid</TableHead>
                <TableHead align="right">Outstanding</TableHead>
                <TableHead>Disbursed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {member.loans.length === 0 ? (
                <TableEmpty colSpan={7}>
                  This member has never taken a loan.
                </TableEmpty>
              ) : (
                member.loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-mono text-xs text-ink">
                      {loan.reference}
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(loan.principal, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(loan.totalPayable, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular className="text-emerald-700">
                      {formatMoney(loan.totalPaid, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular>
                      {formatMoney(subtract(loan.totalPayable, loan.totalPaid), {
                        showSymbol: false,
                      })}
                      {loan.daysOverdue > 0 && (
                        <span className="mt-0.5 block text-[11px] font-semibold text-red-600">
                          {loan.daysOverdue} days late
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {formatDate(loan.disbursedAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={loan.status} size="sm" />
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
            Recent transactions
          </h2>
          <Link
            href={`/admin/savings/transactions?q=${encodeURIComponent(member.memberNumber)}`}
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead align="right">Balance after</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.transactions.length === 0 ? (
                <TableEmpty colSpan={6}>
                  <span className="inline-flex items-center gap-2">
                    <Receipt className="size-4" aria-hidden="true" />
                    No transactions have been posted to this account.
                  </span>
                </TableEmpty>
              ) : (
                recent.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs text-ink-muted">
                      {t.reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {formatDate(t.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm">
                      {t.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.type} size="sm" />
                    </TableCell>
                    <TableCell align="right" tabular>
                      <span
                        className={
                          t.direction === "CREDIT" ? "text-emerald-700" : "text-ink"
                        }
                      >
                        {t.direction === "CREDIT" ? "+" : "−"}
                        {formatMoney(t.amount, { showSymbol: false })}
                      </span>
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(t.balanceAfter, { showSymbol: false })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableWrapper>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Administrator notes
        </h2>
        {member.notes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-ink-muted">
            No notes have been recorded on this member.
          </p>
        ) : (
          <ul className="space-y-3">
            {member.notes.map((note) => (
              <li
                key={note.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-card"
              >
                <p className="text-sm leading-relaxed text-ink">{note.body}</p>
                <p className="mt-2 text-xs text-ink-muted">
                  {note.author.firstName} {note.author.lastName} ·{" "}
                  {formatDate(note.createdAt)}
                  {note.isInternal && " · internal"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof UserRound;
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
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd
        className={`text-right text-sm font-medium text-ink ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
