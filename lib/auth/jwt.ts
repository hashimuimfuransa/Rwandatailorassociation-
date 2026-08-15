import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { UserRole } from "@/lib/generated/prisma/enums";

/**
 * Edge-safe session token encoding.
 *
 * This module is imported by `middleware.ts`, which runs on the Edge runtime.
 * It therefore must not touch Prisma, `node:crypto`, or the full env loader —
 * only Web Crypto and `process.env`, both of which exist in both runtimes.
 *
 * WHAT THIS TOKEN IS AND IS NOT
 * -----------------------------
 * The claims below are a *hint*, good enough for the middleware to route a
 * request to the right dashboard or bounce it to /login without a database
 * round trip on every navigation.
 *
 * They are NOT an authorisation decision. A token stays cryptographically
 * valid until it expires, so it cannot know that an admin was suspended thirty
 * seconds ago or that a session was revoked from another device. Every route
 * handler and server component re-loads the session from the database and
 * re-checks role, status and permissions before doing anything consequential.
 * See lib/auth/session.ts.
 */

export const SESSION_COOKIE_NAME = "rta_session";

export interface SessionClaims extends JWTPayload {
  /// Session row id — the handle used to load and revoke server-side.
  sid: string;
  /// User id.
  sub: string;
  role: UserRole;
  /// Association id; null for SUPER_ADMIN, who is platform-scoped.
  aid: string | null;
  /// Per-session secret. Its SHA-256 is stored on the Session row, so a leaked
  /// SESSION_SECRET alone is still not enough to forge a usable session.
  sec: string;
}

const ISSUER = "rta-savings";
const AUDIENCE = "rta-dashboard";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or shorter than 32 characters — refusing to sign or verify sessions"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  claims: Omit<SessionClaims, "iat" | "exp" | "iss" | "aud">,
  expiresAt: Date
): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecretKey());
}

/**
 * Verifies signature, issuer, audience and expiry.
 * Returns null rather than throwing — an invalid cookie is an ordinary,
 * expected condition (expired tab, rotated secret), not an exception.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionClaims | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });

    const claims = payload as SessionClaims;
    if (!claims.sid || !claims.sub || !claims.role || !claims.sec) return null;

    return claims;
  } catch {
    return null;
  }
}

/**
 * SHA-256 via Web Crypto, available in both the Edge and Node runtimes.
 * Used for session secrets and verification tokens: the database stores only
 * the digest, so a database dump does not hand over live credentials.
 */
export async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Cryptographically random, URL-safe token. */
export function generateToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Short, human-typable code for SMS/email verification. */
export function generateNumericCode(digits = 6): string {
  const max = 10 ** digits;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % max).padStart(digits, "0");
}
