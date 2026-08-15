import type { Metadata } from "next";
import { ArrowUpFromLine } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requirePermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/empty-state";
import { WithdrawalReviewTable } from "@/components/dashboard/WithdrawalReviewTable";

export const metadata: Metadata = { title: "Withdrawals | RTA" };
export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  const context = await requirePermission(
    PERMISSIONS.WITHDRAWALS_VIEW_ALL,
    "/admin/withdrawals"
  );

  const associationId = resolveAssociationScope(context);

  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      ...(associationId ? { associationId } : {}),
      status: { in: ["PENDING", "UNDER_REVIEW", "APPROVED", "PROCESSING"] },
    },
    orderBy: { requestedAt: "asc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      amount: true,
      fee: true,
      netAmount: true,
      status: true,
      reason: true,
      channel: true,
      destinationDetail: true,
      balanceAtRequest: true,
      requestedAt: true,
      member: {
        select: {
          memberNumber: true,
          user: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
      savingsAccount: { select: { balance: true } },
    },
  });

  const canApprove = context.permissions.has(PERMISSIONS.WITHDRAWALS_APPROVE);
  const canPayout = context.permissions.has(PERMISSIONS.WITHDRAWALS_PROCESS);

  return (
    <div>
      <PageHeader
        title="Withdrawals"
        description="Requests awaiting review, and approved payouts to record."
      />

      {withdrawals.length === 0 ? (
        <EmptyState
          icon={ArrowUpFromLine}
          title="No open withdrawal requests"
          description="Requests awaiting approval or payout will appear here."
        />
      ) : (
        <WithdrawalReviewTable
          withdrawals={withdrawals.map((w) => ({
            id: w.id,
            reference: w.reference,
            memberName: `${w.member.user.firstName} ${w.member.user.lastName}`.trim(),
            memberNumber: w.member.memberNumber,
            memberPhone: w.member.user.phone,
            amount: w.amount.toFixed(2),
            fee: w.fee.toFixed(2),
            netAmount: w.netAmount.toFixed(2),
            status: w.status,
            reason: w.reason,
            channel: w.channel,
            destinationDetail: w.destinationDetail,
            balanceAtRequest: w.balanceAtRequest.toFixed(2),
            currentBalance: w.savingsAccount.balance.toFixed(2),
            requestedAt: w.requestedAt,
          }))}
          canApprove={canApprove}
          canPayout={canPayout}
        />
      )}
    </div>
  );
}
