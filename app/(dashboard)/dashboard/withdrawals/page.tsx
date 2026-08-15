import type { Metadata } from "next";
import { ArrowUpFromLine } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import {
  getMemberSavingsAccount,
  getMemberWithdrawals,
} from "@/lib/services/member-queries";
import { formatMoney } from "@/lib/money";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { WithdrawalRequestForm } from "@/components/dashboard/WithdrawalRequestForm";
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

export const metadata: Metadata = { title: "Withdrawals | RTA" };
export const dynamic = "force-dynamic";

export default async function WithdrawalsPage() {
  const context = await requireMember("/dashboard/withdrawals");

  const [account, withdrawals, rule] = await Promise.all([
    getMemberSavingsAccount(context.member!.id),
    getMemberWithdrawals(context.member!.id),
    prisma.savingsRule.findUnique({
      where: { associationId: context.user.associationId! },
    }),
  ]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Withdrawals"
        description="Request money from your savings and track approval."
      />

      {rule && !rule.allowWithdrawals ? (
        <Alert variant="warning" title="Withdrawals are not currently available">
          The association has suspended withdrawals. Please contact the office if
          you need assistance.
        </Alert>
      ) : (
        account && (
          <WithdrawalRequestForm
            available={account.available}
            balance={account.balance}
            minimum={rule?.minimumWithdrawal.toFixed(2) ?? "0.00"}
            maximum={rule?.maximumWithdrawal?.toFixed(2) ?? null}
            minimumBalance={rule?.minimumBalance.toFixed(2) ?? "0.00"}
            feeType={rule?.withdrawalFeeType ?? "FIXED"}
            feeValue={rule?.withdrawalFeeValue.toFixed(2) ?? "0.00"}
            requiresApproval={rule?.withdrawalRequiresApproval ?? true}
          />
        )
      )}

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold text-ink">
          Your requests
        </h2>

        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead align="right">Fee</TableHead>
                <TableHead align="right">You receive</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.length === 0 ? (
                <TableEmpty colSpan={6}>
                  You have not requested any withdrawals.
                </TableEmpty>
              ) : (
                withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono text-xs text-ink-muted">
                      {w.reference}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-ink-muted">
                      {new Date(w.requestedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell align="right" tabular>
                      {formatMoney(w.amount, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular className="text-ink-muted">
                      {formatMoney(w.fee, { showSymbol: false })}
                    </TableCell>
                    <TableCell align="right" tabular className="font-semibold">
                      {formatMoney(w.netAmount, { showSymbol: false })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={w.status} size="sm" />
                      {w.status === "REJECTED" && w.rejectionReason && (
                        <span className="mt-1 block max-w-xs text-[11px] text-red-600">
                          {w.rejectionReason}
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

      {withdrawals.length === 0 && (
        <p className="flex items-start gap-2 text-sm text-ink-muted">
          <ArrowUpFromLine className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Withdrawals are reviewed by the association before payout. Money leaves
          your balance only once the payout has actually been made.
        </p>
      )}
    </div>
  );
}
