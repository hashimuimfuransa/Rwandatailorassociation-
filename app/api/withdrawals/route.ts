import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/guards";
import { requestWithdrawal, WithdrawalError } from "@/lib/services/withdrawals";
import { getMemberWithdrawals } from "@/lib/services/member-queries";
import {
  apiBadRequest,
  apiCreated,
  apiSuccess,
  apiTooManyRequests,
  withErrorHandling,
} from "@/lib/api/response";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/api/rate-limit";

const schema = z.object({
  // A string, never a number: the amount is money and must survive JSON
  // without passing through a float.
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
  reason: z.string().trim().max(300).optional(),
  channel: z.enum(["BANK_TRANSFER", "MOBILE_MONEY", "CASH"]).optional(),
  destinationDetail: z.string().trim().max(200).optional(),
});

/** GET /api/withdrawals — the caller's own withdrawal history. */
export const GET = withErrorHandling(async () => {
  const context = await requireApiRole("MEMBER");
  const withdrawals = await getMemberWithdrawals(context.member!.id);
  return apiSuccess({ withdrawals });
});

/**
 * POST /api/withdrawals — request a withdrawal.
 *
 * The memberId comes from the session, never from the body: accepting one
 * would let any member request a withdrawal from anyone else's account.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await requireApiRole("MEMBER");

  const ip = await getClientIp();
  const limit = checkRateLimit(
    `withdrawal:${context.user.id}:${ip}`,
    RATE_LIMITS.FINANCIAL_WRITE
  );
  if (!limit.allowed) {
    return apiTooManyRequests("Too many requests. Please wait.", limit.retryAfter);
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

  try {
    const result = await requestWithdrawal({
      memberId: context.member!.id,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      channel: parsed.data.channel,
      destinationDetail: parsed.data.destinationDetail,
    });

    return apiCreated({
      ...result,
      message:
        "Your withdrawal request has been submitted and is awaiting approval.",
    });
  } catch (error) {
    if (error instanceof WithdrawalError) {
      return apiBadRequest(error.message, { amount: [error.message] });
    }
    throw error;
  }
});
