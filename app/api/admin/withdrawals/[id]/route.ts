import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission, assertSameAssociation } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  processWithdrawalPayout,
  reviewWithdrawal,
  WithdrawalError,
} from "@/lib/services/withdrawals";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  withErrorHandling,
} from "@/lib/api/response";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/api/rate-limit";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), notes: z.string().trim().max(500).optional() }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().trim().min(10, "Give a reason of at least 10 characters"),
  }),
  z.object({
    action: z.literal("payout"),
    externalReference: z.string().trim().max(120).optional(),
  }),
]);

/**
 * PATCH /api/admin/withdrawals/[id]
 *
 * Review and payout are separate permissions and separate steps. Approval says
 * the member may have the money; payout records that it has actually left, and
 * only that step debits the ledger.
 */
export const PATCH = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        (details[issue.path.join(".") || "_"] ??= []).push(issue.message);
      }
      return apiBadRequest("Please correct the highlighted fields", details);
    }

    const context = await requireApiPermission(
      parsed.data.action === "payout"
        ? PERMISSIONS.WITHDRAWALS_PROCESS
        : PERMISSIONS.WITHDRAWALS_APPROVE
    );

    const ip = await getClientIp();
    const limit = checkRateLimit(
      `withdrawal-review:${context.user.id}:${ip}`,
      RATE_LIMITS.FINANCIAL_WRITE
    );
    if (!limit.allowed) return apiBadRequest("Too many requests. Please slow down.");

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      select: { id: true, associationId: true },
    });

    if (!withdrawal) return apiNotFound("Withdrawal not found");
    assertSameAssociation(context, withdrawal, "Withdrawal");

    try {
      if (parsed.data.action === "payout") {
        const result = await processWithdrawalPayout({
          withdrawalId: id,
          actorId: context.user.id,
          externalReference: parsed.data.externalReference,
        });

        return apiSuccess({
          message: "Payout recorded and the member's balance updated",
          ...result,
        });
      }

      await reviewWithdrawal({
        withdrawalId: id,
        approve: parsed.data.action === "approve",
        actorId: context.user.id,
        notes: parsed.data.action === "approve" ? parsed.data.notes : undefined,
        rejectionReason:
          parsed.data.action === "reject" ? parsed.data.reason : undefined,
      });

      return apiSuccess({
        message:
          parsed.data.action === "approve"
            ? "Withdrawal approved — record the payout once the money has been sent"
            : "Withdrawal declined and the hold released",
      });
    } catch (error) {
      if (error instanceof WithdrawalError) return apiBadRequest(error.message);
      throw error;
    }
  }
);
