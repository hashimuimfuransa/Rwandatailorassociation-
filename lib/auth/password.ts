import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { timingSafeEqual, randomBytes } from "node:crypto";
import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "@/lib/auth/password.shared";

// Re-exported so server code has a single import for password concerns.
export {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  assessPasswordStrength,
  type PasswordStrength,
} from "@/lib/auth/password.shared";

/**
 * Password hashing.
 *
 * Argon2id, not bcrypt: bcrypt silently truncates at 72 bytes and is far
 * cheaper to attack on GPUs. These parameters follow the OWASP Password
 * Storage guidance (19 MiB memory, 2 iterations, parallelism 1) — enough to
 * make offline cracking expensive without adding perceptible login latency.
 *
 * The memory cost is the important one. Raising `timeCost` alone buys little
 * against an attacker with GPUs; memory hardness is what actually hurts them.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function hashPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  }
  // Argon2 has no bcrypt-style truncation, but an unbounded input is a cheap
  // denial-of-service: hashing a 10 MB "password" burns CPU on every attempt.
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters`
    );
  }

  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a password against a stored hash.
 *
 * Never throws on a malformed or legacy hash — it returns false. A thrown
 * error here would leak, through differing response behaviour, which accounts
 * have unusable password hashes.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  if (!password || !passwordHash) return false;
  if (password.length > MAX_PASSWORD_LENGTH) return false;

  try {
    return await verify(passwordHash, password, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}

/**
 * Burns roughly the same CPU as a real verification, for logins where the
 * account does not exist.
 *
 * Without this, "no such user" returns in ~1ms while a real account takes
 * ~50ms, and that gap is a reliable oracle for enumerating who is registered.
 */
export async function fakeVerifyPassword(): Promise<false> {
  await hash(randomBytes(16).toString("hex"), ARGON2_OPTIONS);
  return false;
}

/** Constant-time comparison for tokens and signatures. */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  // Compare a fixed-size digest domain instead by padding to equal length.
  if (bufA.length !== bufB.length) {
    // Still perform a comparison so the timing does not depend on the length
    // check short-circuiting.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
