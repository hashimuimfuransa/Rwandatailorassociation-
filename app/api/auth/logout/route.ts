import { getAuthContext, revokeSession, clearSessionCookie } from "@/lib/auth/session";
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { apiSuccess, withErrorHandling } from "@/lib/api/response";

/**
 * POST /api/auth/logout
 *
 * Revokes the session server-side as well as clearing the cookie. Clearing the
 * cookie alone would leave the session usable by anyone who had captured the
 * token — logout has to mean the credential stops working, not just that this
 * browser forgot it.
 *
 * Always returns 200: logging out when already logged out is not an error.
 */
export const POST = withErrorHandling(async () => {
  const context = await getAuthContext();

  if (context) {
    await revokeSession(context.session.id, "LOGOUT");
    await recordAudit(
      {
        action: AUDIT_ACTIONS.USER_LOGGED_OUT,
        entityType: "User",
        entityId: context.user.id,
        associationId: context.user.associationId,
      },
      context
    );
  }

  await clearSessionCookie();
  return apiSuccess({ ok: true });
});
