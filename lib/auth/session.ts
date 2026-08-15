import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { authLogger } from "@/lib/logger";
import {
  SESSION_COOKIE_NAME,
  generateToken,
  sha256,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/jwt";
import { resolvePermissions, type PermissionCode } from "@/lib/auth/permissions";
import type { UserRole, UserStatus, MemberStatus } from "@/lib/generated/prisma/enums";

/**
 * Server-side session lifecycle.
 *
 * The database is the authority here, not the cookie. `getAuthContext()` loads
 * the session row on every request and re-checks that the session is live and
 * the user is still active — which is what makes suspension and remote logout
 * take effect immediately instead of whenever a token happens to expire.
 */

export interface AuthContext {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string;
    fullName: string;
    avatarUrl: string | null;
    role: UserRole;
    status: UserStatus;
    associationId: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    mustChangePassword: boolean;
  };
  /// Present only for MEMBER accounts.
  member: {
    id: string;
    memberNumber: string;
    paymentReference: string;
    status: MemberStatus;
  } | null;
  association: {
    id: string;
    name: string;
    code: string;
    currency: string;
    timezone: string;
  } | null;
  session: {
    id: string;
    expiresAt: Date;
  };
  permissions: Set<string>;
}

export interface SessionCreationResult {
  token: string;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Issues a new session. Called only after credentials have been verified and
 * the account has been confirmed usable.
 */
export async function createSession(
  userId: string,
  context: { ipAddress?: string | null; userAgent?: string | null } = {}
): Promise<SessionCreationResult> {
  const env = getEnv();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, associationId: true },
  });

  if (!user) throw new Error("Cannot create a session for an unknown user");

  const secret = generateToken(32);
  const secretHash = await sha256(secret);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_MINUTES * 60_000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: secretHash,
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent?.slice(0, 500) ?? null,
      expiresAt,
    },
    select: { id: true },
  });

  const token = await signSessionToken(
    {
      sid: session.id,
      sub: user.id,
      role: user.role,
      aid: user.associationId,
      sec: secret,
    },
    expiresAt
  );

  authLogger.info({ userId: user.id, sessionId: session.id }, "session created");

  return { token, sessionId: session.id, expiresAt };
}

/** Writes the session cookie. */
export async function setSessionCookie(
  token: string,
  expiresAt: Date
): Promise<void> {
  const env = getEnv();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    // httpOnly keeps the token out of reach of any injected script — the
    // difference between an XSS bug and an XSS bug that drains accounts.
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    // `lax` still sends the cookie on top-level navigation (so email links
    // work) but not on cross-site POSTs, which is the CSRF vector that matters
    // for the money-moving endpoints.
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Loads and validates the current session.
 *
 * Wrapped in React `cache` so that a page rendering a layout, several server
 * components and a route handler in the same request performs exactly one
 * session query rather than a dozen.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const env = getEnv();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const session = await prisma.session.findUnique({
    where: { id: claims.sid },
    select: {
      id: true,
      tokenHash: true,
      expiresAt: true,
      revokedAt: true,
      lastSeenAt: true,
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          status: true,
          associationId: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          mustChangePassword: true,
          permissions: {
            where: {
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            select: { granted: true, permission: { select: { code: true } } },
          },
          member: {
            select: {
              id: true,
              memberNumber: true,
              paymentReference: true,
              status: true,
            },
          },
          association: {
            select: {
              id: true,
              name: true,
              code: true,
              currency: true,
              timezone: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  // Compare the per-session secret against its stored digest. A forged JWT
  // signed with a leaked SESSION_SECRET still fails here unless the attacker
  // also has the database row.
  const presentedHash = await sha256(claims.sec);
  if (presentedHash !== session.tokenHash) {
    authLogger.warn(
      { sessionId: session.id, userId: claims.sub },
      "session secret mismatch — token rejected"
    );
    return null;
  }

  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  // Idle timeout: a session left open on a shared machine should not stay
  // usable indefinitely just because its absolute expiry is far away.
  const idleLimitMs = env.SESSION_IDLE_TIMEOUT_MINUTES * 60_000;
  const idleFor = Date.now() - session.lastSeenAt.getTime();
  if (idleFor > idleLimitMs) {
    await prisma.session
      .update({
        where: { id: session.id },
        data: { revokedAt: new Date(), revokedReason: "IDLE_TIMEOUT" },
      })
      .catch(() => undefined);
    return null;
  }

  const user = session.user;

  // The token says what the role was at login. The database says what the
  // account is now. The database wins.
  if (user.status !== "ACTIVE") return null;
  if (user.association && user.association.status !== "ACTIVE") return null;

  // Refresh lastSeenAt at most once a minute — on every request it would turn
  // each page view into an extra write for no benefit.
  if (idleFor > 60_000) {
    void prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  const permissions = resolvePermissions(
    user.role,
    user.permissions.map((p) => ({
      code: p.permission.code,
      granted: p.granted,
    }))
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      associationId: user.associationId,
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      mustChangePassword: user.mustChangePassword,
    },
    member: user.member,
    association: user.association
      ? {
          id: user.association.id,
          name: user.association.name,
          code: user.association.code,
          currency: user.association.currency,
          timezone: user.association.timezone,
        }
      : null,
    session: { id: session.id, expiresAt: session.expiresAt },
    permissions,
  };
});

export async function revokeSession(
  sessionId: string,
  reason = "LOGOUT"
): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  authLogger.info({ sessionId, reason }, "session revoked");
}

/**
 * Revokes every session for a user.
 *
 * Called on password change, on suspension, and whenever an admin needs to
 * evict someone from every device at once. `exceptSessionId` lets a user
 * change their own password without logging themselves out.
 */
export async function revokeAllUserSessions(
  userId: string,
  reason = "SECURITY",
  exceptSessionId?: string
): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date(), revokedReason: reason },
  });

  if (result.count > 0) {
    authLogger.info({ userId, reason, count: result.count }, "sessions revoked");
  }
  return result.count;
}

/** Housekeeping for the background worker. */
export async function purgeExpiredSessions(olderThanDays = 30): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000);
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  });
  return result.count;
}

// Convenience predicates -----------------------------------------------------

export function contextHasPermission(
  context: AuthContext | null,
  permission: PermissionCode
): boolean {
  return Boolean(context?.permissions.has(permission));
}

export function isSuperAdmin(context: AuthContext | null): boolean {
  return context?.user.role === "SUPER_ADMIN";
}

export function isAdmin(context: AuthContext | null): boolean {
  return (
    context?.user.role === "ADMIN" || context?.user.role === "SUPER_ADMIN"
  );
}

export function isMember(context: AuthContext | null): boolean {
  return context?.user.role === "MEMBER";
}
