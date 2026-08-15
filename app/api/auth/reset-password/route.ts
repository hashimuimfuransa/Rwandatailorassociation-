import { type NextRequest } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { resetPassword } from "@/lib/auth/service";
import { assessPasswordStrength } from "@/lib/auth/password.shared";
import {
  apiBadRequest,
  apiError,
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
 * POST /api/auth/reset-password
 *
 * Consumes a single-use reset token. On success every existing session for the
 * account is revoked — if the reset was prompted by a compromise, leaving the
 * attacker's session alive would make the reset pointless.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const ip = await getClientIp();

  const limit = checkRateLimit(
    rateLimitKey("reset_password", ip),
    RATE_LIMITS.PASSWORD_RESET
  );
  if (!limit.allowed) {
    return apiTooManyRequests(
      "Too many attempts. Please try again later.",
      limit.retryAfter
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return apiBadRequest("Invalid request body");

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const details: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "_";
      (details[path] ??= []).push(issue.message);
    }
    return apiBadRequest("Please correct the highlighted fields", details);
  }

  const strength = assessPasswordStrength(parsed.data.password);
  if (!strength.acceptable) {
    return apiBadRequest("Please choose a stronger password", {
      password: strength.issues,
    });
  }

  const result = await resetPassword(parsed.data.token, parsed.data.password);

  if (!result.ok) {
    return apiError("INVALID_TOKEN", result.message, 400);
  }

  return apiSuccess({
    message: "Your password has been changed. You can now sign in.",
  });
});
