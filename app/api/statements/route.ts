import { type NextRequest } from "next/server";
import { requireApiAuth, AuthorizationError } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  buildMemberStatement,
  statementToCsv,
  statementToHtml,
} from "@/lib/services/statements";
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { prisma } from "@/lib/db/prisma";
import {
  apiBadRequest,
  apiNotFound,
  apiTooManyRequests,
  withErrorHandling,
} from "@/lib/api/response";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/api/rate-limit";

/**
 * GET /api/statements?format=csv|html&from=&to=&memberId=
 *
 * Members download their own statement. An administrator may download any
 * member's within their association, and only with the elevated permission —
 * a statement is the member's complete financial history, so access is
 * checked, scoped and audited.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const context = await requireApiAuth();
  const url = new URL(request.url);

  const ip = await getClientIp();
  const limit = checkRateLimit(`statement:${context.user.id}:${ip}`, RATE_LIMITS.EXPORT);
  if (!limit.allowed) {
    return apiTooManyRequests("Too many downloads. Please wait.", limit.retryAfter);
  }

  const requestedMemberId = url.searchParams.get("memberId");
  let memberId = context.member?.id ?? null;

  if (requestedMemberId && requestedMemberId !== context.member?.id) {
    // Someone else's statement: needs the permission AND same-tenant scope.
    if (!context.permissions.has(PERMISSIONS.SAVINGS_VIEW_ALL)) {
      throw new AuthorizationError("You may only download your own statement", 403);
    }

    const target = await prisma.member.findUnique({
      where: { id: requestedMemberId },
      select: { id: true, associationId: true },
    });

    if (!target) return apiNotFound("Member not found");

    if (
      context.user.role !== "SUPER_ADMIN" &&
      target.associationId !== context.user.associationId
    ) {
      throw new AuthorizationError(
        "That member belongs to a different association",
        403,
        "WRONG_TENANT"
      );
    }

    memberId = target.id;
  }

  if (!memberId) return apiBadRequest("No member account associated with this login");

  // Default window: the last 12 months.
  const to = url.searchParams.get("to")
    ? new Date(`${url.searchParams.get("to")}T23:59:59.999Z`)
    : new Date();

  const from = url.searchParams.get("from")
    ? new Date(`${url.searchParams.get("from")}T00:00:00.000Z`)
    : new Date(new Date(to).setMonth(to.getMonth() - 12));

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return apiBadRequest("Invalid date range");
  }
  if (from > to) {
    return apiBadRequest("The start date must be before the end date");
  }

  const statement = await buildMemberStatement(memberId, { from, to });
  if (!statement) return apiNotFound("No savings account found for this member");

  // Downloading a member's full financial history is worth recording, whether
  // it was the member or an administrator.
  await recordAudit(
    {
      action: AUDIT_ACTIONS.STATEMENT_DOWNLOADED,
      entityType: "Member",
      entityId: memberId,
      associationId: context.user.associationId,
      metadata: {
        from: from.toISOString(),
        to: to.toISOString(),
        format: url.searchParams.get("format") ?? "html",
        onBehalfOf: memberId !== context.member?.id,
      },
    },
    context
  );

  const slug = `${statement.member.memberNumber}-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}`;

  if (url.searchParams.get("format") === "csv") {
    return new Response(statementToCsv(statement), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="statement-${slug}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(statementToHtml(statement), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Inline so the browser renders it and the member can print to PDF.
      "Content-Disposition": `inline; filename="statement-${slug}.html"`,
      "Cache-Control": "no-store",
    },
  });
});
