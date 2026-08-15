import { type NextRequest } from "next/server";
import { changePasswordSchema } from "@/lib/validation/auth";
import { changePassword } from "@/lib/auth/service";
import { assessPasswordStrength } from "@/lib/auth/password.shared";
import { requireApiAuth } from "@/lib/auth/guards";
import {
  apiBadRequest,
  apiSuccess,
  withErrorHandling,
} from "@/lib/api/response";

/**
 * POST /api/auth/change-password
 *
 * Requires the current password even though the caller is already
 * authenticated: it re-proves that the person at the keyboard is the account
 * owner and not someone who walked up to an unlocked session.
 *
 * All other sessions are revoked; this one survives so the user is not logged
 * out of the device they just used.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await requireApiAuth();

  const body = await request.json().catch(() => null);
  if (!body) return apiBadRequest("Invalid request body");

  const parsed = changePasswordSchema.safeParse(body);
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

  const result = await changePassword(
    context.user.id,
    parsed.data.currentPassword,
    parsed.data.password,
    context.session.id
  );

  if (!result.ok) {
    return apiBadRequest(result.message, { currentPassword: [result.message] });
  }

  return apiSuccess({
    message: "Your password has been changed. Other devices have been signed out.",
  });
});
