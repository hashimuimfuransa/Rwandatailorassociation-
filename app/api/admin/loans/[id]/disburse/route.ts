import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission, assertSameAssociation } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { disburseLoan, LoanError } from "@/lib/services/loans";
import { notify, NOTIFICATION_EVENTS } from "@/lib/notifications";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  withErrorHandling,
} from "@/lib/api/response";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/api/rate-limit";

const schema = z.object({
  channel: z
    .enum(["SAVINGS_ACCOUNT", "BANK_TRANSFER", "MOBILE_MONEY", "CASH"])
    .default("SAVINGS_ACCOUNT"),
  externalReference: z.string().trim().max(120).optional(),
});

/**
 * POST /api/admin/loans/[id]/disburse
 *
 * Pays out an approved loan. This is the single most consequential write in
 * the system — it generates the repayment schedule, posts the loan ledger
 * entry and credits the member, all atomically.
 *
 * Deliberately separate from approval and behind its own permission, so that
 * committing the association's money is always a distinct, deliberate act.
 */
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const context = await requireApiPermission(PERMISSIONS.LOANS_DISBURSE);
    const { id } = await params;

    const ip = await getClientIp();
    const limit = checkRateLimit(
      `disburse:${context.user.id}:${ip}`,
      RATE_LIMITS.FINANCIAL_WRITE
    );
    if (!limit.allowed) return apiBadRequest("Too many requests. Please slow down.");

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body ?? {});

    if (!parsed.success) return apiBadRequest("Invalid disbursement details");

    const loan = await prisma.loan.findUnique({
      where: { id },
      select: {
        id: true,
        associationId: true,
        reference: true,
        member: { select: { user: { select: { id: true } } } },
      },
    });

    if (!loan) return apiNotFound("Loan not found");
    assertSameAssociation(context, loan, "Loan");

    try {
      const result = await disburseLoan({
        loanId: id,
        actorId: context.user.id,
        channel: parsed.data.channel,
        externalReference: parsed.data.externalReference,
      });

      void notify({
        userId: loan.member.user.id,
        event: NOTIFICATION_EVENTS.LOAN_DISBURSED,
        context: {
          amount: result.netDisbursement,
          reference: loan.reference,
          dueDate: result.maturityDate,
        },
        entityType: "Loan",
        entityId: id,
      });

      return apiSuccess({
        message: `Disbursed. ${result.instalments} instalments scheduled.`,
        ...result,
      });
    } catch (error) {
      if (error instanceof LoanError) return apiBadRequest(error.message);
      throw error;
    }
  }
);
