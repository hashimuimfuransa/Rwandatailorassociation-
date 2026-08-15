import { getAuthContext } from "@/lib/auth/session";
import { apiSuccess, apiUnauthorized, withErrorHandling } from "@/lib/api/response";

/**
 * GET /api/auth/me
 *
 * Current session snapshot for client components. Returns only what the UI
 * needs to render — never the password hash, session secret or any provider
 * credential. Permissions are included so the client can hide controls the
 * user cannot use; the server still re-checks every one of them.
 */
export const GET = withErrorHandling(async () => {
  const context = await getAuthContext();
  if (!context) return apiUnauthorized();

  return apiSuccess({
    user: context.user,
    member: context.member,
    association: context.association,
    permissions: [...context.permissions],
    session: { expiresAt: context.session.expiresAt },
  });
});
