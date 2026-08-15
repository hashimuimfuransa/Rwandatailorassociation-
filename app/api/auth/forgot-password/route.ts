import { type NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { requestPasswordReset } from "@/lib/auth/service";
import { getEnv } from "@/lib/env";
import { authLogger } from "@/lib/logger";
import {
  apiSuccess,
  apiTooManyRequests,
  withErrorHandling,
} from "@/lib/api/response";
import {
  RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  rateLimitKey,
} from "@/lib/api/rate-limit";

/**
 * POST /api/auth/forgot-password
 *
 * Responds identically whether or not the account exists. Confirming that an
 * address is registered would tell an attacker who belongs to the association
 * — membership of a savings group is itself information worth protecting —
 * and would hand them a verified target list for credential stuffing.
 */
const GENERIC_RESPONSE = {
  message:
    "If an account matches those details, a password reset link has been sent.",
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  const ip = await getClientIp();

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  // Even a malformed request gets the generic answer, so response shape does
  // not distinguish "no such user" from "bad input".
  if (!parsed.success) return apiSuccess(GENERIC_RESPONSE);

  const { identifier } = parsed.data;

  const limit = checkRateLimit(
    rateLimitKey("password_reset", ip, identifier.value),
    RATE_LIMITS.PASSWORD_RESET
  );
  if (!limit.allowed) {
    return apiTooManyRequests(
      "Too many reset requests. Please wait before trying again.",
      limit.retryAfter
    );
  }

  const result = await requestPasswordReset(identifier);

  if (result) {
    const env = getEnv();
    const resetUrl = `${env.APP_URL}/reset-password?token=${result.token}`;

    // TODO(phase-10): dispatch through the notification service once the
    // email/SMS adapters land. Until then the link is logged at debug level so
    // the flow is testable in development. `logger` redacts `token` fields, so
    // this is deliberately named `resetUrl` — remove this branch when the
    // notification service is wired in.
    authLogger.debug(
      { userId: result.userId, resetUrl },
      "password reset link generated (delivery pending notification service)"
    );
  }

  return apiSuccess(GENERIC_RESPONSE);
});
