import { requireApiAuth } from "@/lib/auth/guards";
import { markAllNotificationsRead } from "@/lib/notifications";
import { apiSuccess, withErrorHandling } from "@/lib/api/response";

/**
 * POST /api/notifications/read-all
 *
 * Scoped to the caller's own notifications by userId from the session — there
 * is no way to mark someone else's as read.
 */
export const POST = withErrorHandling(async () => {
  const context = await requireApiAuth();
  const count = await markAllNotificationsRead(context.user.id);
  return apiSuccess({ marked: count });
});
