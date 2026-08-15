import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireApiPermission, assertSameAssociation } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  approveMember,
  rejectMember,
  setMemberSuspension,
  updateMember,
} from "@/lib/services/members";
import { updateMemberSchema } from "@/lib/validation/members";
import {
  apiBadRequest,
  apiNotFound,
  apiSuccess,
  withErrorHandling,
} from "@/lib/api/response";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), note: z.string().trim().max(500).optional() }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().trim().min(5, "Give a reason of at least 5 characters"),
  }),
  z.object({
    action: z.literal("suspend"),
    reason: z.string().trim().min(5, "Give a reason of at least 5 characters"),
  }),
  z.object({ action: z.literal("reactivate"), reason: z.string().trim().optional() }),
]);

/**
 * PATCH /api/admin/members/[id]
 *
 * Membership decisions. Each action maps to its own permission, so an
 * administrator who may approve applications does not automatically gain the
 * ability to suspend an existing member.
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

    const needsSuspendPermission =
      parsed.data.action === "suspend" || parsed.data.action === "reactivate";

    const context = await requireApiPermission(
      needsSuspendPermission
        ? PERMISSIONS.MEMBERS_SUSPEND
        : PERMISSIONS.MEMBERS_APPROVE
    );

    const member = await prisma.member.findUnique({
      where: { id },
      select: { id: true, associationId: true },
    });

    if (!member) return apiNotFound("Member not found");

    // Cross-tenant guard: an admin must not act on another association's member.
    assertSameAssociation(context, member, "Member");

    const result =
      parsed.data.action === "approve"
        ? await approveMember({
            memberId: id,
            actorId: context.user.id,
            note: parsed.data.note,
          })
        : parsed.data.action === "reject"
          ? await rejectMember({
              memberId: id,
              actorId: context.user.id,
              reason: parsed.data.reason,
            })
          : await setMemberSuspension({
              memberId: id,
              suspend: parsed.data.action === "suspend",
              actorId: context.user.id,
              reason:
                parsed.data.action === "suspend"
                  ? parsed.data.reason
                  : (parsed.data.reason ?? "Reactivated by administrator"),
            });

    if (!result.ok) return apiBadRequest(result.message);

    return apiSuccess({ message: "Done" });
  }
);

/**
 * PUT /api/admin/members/[id]
 *
 * Edits a member's file — their details, not their membership.
 *
 * Separate from PATCH above on purpose: that endpoint moves a member between
 * states and each of its actions demands its own permission and a reason.
 * This one rewrites fields, needs `members.update`, and records a before/after
 * diff of exactly what changed.
 */
export const PUT = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const context = await requireApiPermission(PERMISSIONS.MEMBERS_UPDATE);
    const { id } = await params;

    const body = await request.json().catch(() => null);
    const parsed = updateMemberSchema.safeParse(body);

    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        (details[issue.path.join(".") || "_"] ??= []).push(issue.message);
      }
      return apiBadRequest("Please correct the highlighted fields", details);
    }

    const member = await prisma.member.findUnique({
      where: { id },
      select: { id: true, associationId: true },
    });

    if (!member) return apiNotFound("Member not found");

    // Cross-tenant guard: an admin must not edit another association's member.
    assertSameAssociation(context, member, "Member");

    const result = await updateMember({
      memberId: id,
      input: parsed.data,
      actorId: context.user.id,
    });

    if (!result.ok) {
      return apiBadRequest(result.message, { [result.field]: [result.message] });
    }

    return apiSuccess({ message: "Member details updated" });
  }
);
