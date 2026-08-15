import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission, assertSameAssociation } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  approveLoanApplication,
  transitionApplication,
  LoanError,
} from "@/lib/services/loans";
import { notify, NOTIFICATION_EVENTS } from "@/lib/notifications";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  withErrorHandling,
} from "@/lib/api/response";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    approvedAmount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/)
      .optional(),
    approvedRate: z.string().trim().optional(),
    approvedTermMonths: z.coerce.number().int().min(1).max(120).optional(),
    note: z.string().trim().max(500).optional(),
  }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().trim().min(10, "Give a reason of at least 10 characters"),
  }),
  z.object({
    action: z.literal("request-info"),
    infoRequested: z.string().trim().min(10, "Say what information is needed"),
  }),
  z.object({ action: z.literal("review"), note: z.string().trim().max(500).optional() }),
]);

/**
 * PATCH /api/admin/loan-applications/[id]
 *
 * Approval and rejection are separate permissions, so an association can let a
 * loan officer review and request information without also letting them commit
 * the association's money.
 *
 * Approving creates the loan in PENDING_DISBURSEMENT. It does NOT pay anything
 * out — disbursement is a separate, separately authorised action.
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

    const permission =
      parsed.data.action === "approve"
        ? PERMISSIONS.LOANS_APPROVE
        : parsed.data.action === "reject"
          ? PERMISSIONS.LOANS_REJECT
          : PERMISSIONS.LOANS_REVIEW;

    const context = await requireApiPermission(permission);

    const application = await prisma.loanApplication.findUnique({
      where: { id },
      select: {
        id: true,
        associationId: true,
        requestedAmount: true,
        reference: true,
        member: { select: { user: { select: { id: true } } } },
      },
    });

    if (!application) return apiNotFound("Application not found");
    assertSameAssociation(context, application, "LoanApplication");

    try {
      if (parsed.data.action === "approve") {
        const result = await approveLoanApplication({
          applicationId: id,
          actorId: context.user.id,
          approvedAmount: parsed.data.approvedAmount,
          approvedRate: parsed.data.approvedRate,
          approvedTermMonths: parsed.data.approvedTermMonths,
          note: parsed.data.note,
        });

        void notify({
          userId: application.member.user.id,
          event: NOTIFICATION_EVENTS.LOAN_APPROVED,
          context: {
            amount: parsed.data.approvedAmount ?? application.requestedAmount.toFixed(2),
            reference: result.reference,
          },
          entityType: "Loan",
          entityId: result.loanId,
        });

        return apiSuccess({
          message: "Loan approved and created, awaiting disbursement",
          reference: result.reference,
        });
      }

      if (parsed.data.action === "reject") {
        await transitionApplication({
          applicationId: id,
          toStatus: "REJECTED",
          actorId: context.user.id,
          rejectionReason: parsed.data.reason,
        });

        void notify({
          userId: application.member.user.id,
          event: NOTIFICATION_EVENTS.LOAN_REJECTED,
          context: { reference: application.reference, reason: parsed.data.reason },
          entityType: "LoanApplication",
          entityId: id,
        });

        return apiSuccess({ message: "Application declined" });
      }

      if (parsed.data.action === "request-info") {
        await transitionApplication({
          applicationId: id,
          toStatus: "MORE_INFORMATION_REQUIRED",
          actorId: context.user.id,
          infoRequested: parsed.data.infoRequested,
        });

        void notify({
          userId: application.member.user.id,
          event: NOTIFICATION_EVENTS.LOAN_INFO_REQUESTED,
          context: {
            reference: application.reference,
            reason: parsed.data.infoRequested,
          },
          entityType: "LoanApplication",
          entityId: id,
        });

        return apiSuccess({ message: "Information requested from the member" });
      }

      await transitionApplication({
        applicationId: id,
        toStatus: "UNDER_REVIEW",
        actorId: context.user.id,
        note: parsed.data.note,
      });

      return apiSuccess({ message: "Marked as under review" });
    } catch (error) {
      if (error instanceof LoanError) return apiBadRequest(error.message);
      throw error;
    }
  }
);
