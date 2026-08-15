import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { AuthContext } from "@/lib/auth/session";
import type { BadgeCounts } from "@/components/dashboard/Sidebar";

/**
 * Counts for the sidebar attention badges.
 *
 * These tell an administrator where work is waiting without opening every
 * screen — pending approvals, unmatched payments, loan applications sitting in
 * review. Scoped to the caller's association; a super admin sees the platform
 * total.
 *
 * Runs on every dashboard render, so it is four counts and nothing else.
 */
export async function getSidebarBadges(context: AuthContext): Promise<BadgeCounts> {
  if (context.user.role === "MEMBER") return {};

  // null means platform-wide, which is exactly what Prisma needs for a super
  // admin: omitting the filter rather than filtering on null.
  const associationId =
    context.user.role === "SUPER_ADMIN" ? undefined : context.user.associationId ?? undefined;

  const scope = associationId ? { associationId } : {};

  const [pendingMembers, pendingWithdrawals, pendingLoans, unmatchedPayments] =
    await Promise.all([
      prisma.member.count({
        where: { ...scope, status: "PENDING_APPROVAL" },
      }),
      prisma.withdrawal.count({
        where: { ...scope, status: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      prisma.loanApplication.count({
        where: {
          ...scope,
          status: { in: ["SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"] },
        },
      }),
      prisma.payment.count({
        where: {
          ...(associationId ? { associationId } : {}),
          status: "UNMATCHED",
        },
      }),
    ]);

  return { pendingMembers, pendingWithdrawals, pendingLoans, unmatchedPayments };
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}
