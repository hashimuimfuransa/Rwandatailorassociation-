import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission, assertSameAssociation } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { manuallyMatchPayment } from "@/lib/services/reconciliation";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  withErrorHandling,
} from "@/lib/api/response";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/api/rate-limit";

const schema = z.object({
  memberId: z.string().min(1, "Select a member"),
  reason: z
    .string()
    .trim()
    .min(10, "Give a reason of at least 10 characters — it is recorded in the audit log"),
});

/**
 * POST /api/admin/payments/[id]/match
 *
 * Manually attributes an unmatched payment to a member.
 *
 * This is the most consequential manual action in the system: it moves money
 * into a specific member's savings account on an administrator's judgement
 * rather than on evidence. Accordingly it requires an explicit permission, a
 * written reason, and it is audited at CRITICAL severity with the admin's
 * identity attached.
 *
 * The service layer re-checks everything that matters — that the payment was
 * verified with the provider, is not already posted, and that the member
 * belongs to the caller's association.
 */
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const context = await requireApiPermission(PERMISSIONS.PAYMENTS_MATCH_MANUAL);
    const { id } = await params;

    const ip = await getClientIp();
    const limit = checkRateLimit(
      `payment-match:${context.user.id}:${ip}`,
      RATE_LIMITS.FINANCIAL_WRITE
    );
    if (!limit.allowed) {
      return apiBadRequest("Too many requests. Please slow down.");
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        (details[issue.path.join(".") || "_"] ??= []).push(issue.message);
      }
      return apiBadRequest("Please correct the highlighted fields", details);
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: { id: true, associationId: true },
    });

    if (!payment) return apiNotFound("Payment not found");

    // Defence in depth: an admin from another association must not be able to
    // reach this payment even with a valid id.
    assertSameAssociation(context, payment, "Payment");

    const result = await manuallyMatchPayment({
      paymentId: id,
      memberId: parsed.data.memberId,
      adminUserId: context.user.id,
      reason: parsed.data.reason,
    });

    if (!result.ok) {
      return apiBadRequest(result.message);
    }

    return apiSuccess({
      message: "Payment credited to the member",
      reference: result.reference,
    });
  }
);
