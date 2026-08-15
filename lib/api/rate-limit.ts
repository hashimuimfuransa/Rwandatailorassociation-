import "server-only";
import { headers } from "next/headers";

/**
 * Sliding-window rate limiter.
 *
 * SCOPE AND LIMITS: this is an in-process, in-memory counter. It is effective
 * against credential stuffing and scripted abuse against a single instance,
 * and it resets on restart. Running more than one app instance means each gets
 * its own budget, so the effective limit multiplies by the instance count —
 * move this to Redis before scaling horizontally.
 *
 * It is deliberately NOT the only defence on login. Account-level lockout
 * (User.failedLoginAttempts / lockedUntil) is enforced in the database by the
 * auth service and survives both restarts and a rotating source IP, which is
 * what actually protects a specific member's account.
 */

interface Bucket {
  timestamps: number[];
  /// Set when a limit is tripped, to keep the caller blocked for a cool-off
  /// period rather than letting them resume the instant the window slides.
  blockedUntil?: number;
}

const buckets = new Map<string, Bucket>();

// Bound the map so a flood of unique keys cannot exhaust memory.
const MAX_BUCKETS = 20_000;
let lastSweep = Date.now();

export interface RateLimitRule {
  /// Maximum requests allowed in the window.
  limit: number;
  windowMs: number;
  /// How long to block after tripping the limit. Defaults to the window.
  blockMs?: number;
}

/** Tuned per endpoint class; the money-moving and credential paths are tight. */
export const RATE_LIMITS = {
  LOGIN: { limit: 10, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  REGISTER: { limit: 5, windowMs: 60 * 60_000, blockMs: 30 * 60_000 },
  PASSWORD_RESET: { limit: 5, windowMs: 60 * 60_000, blockMs: 30 * 60_000 },
  VERIFY_CODE: { limit: 10, windowMs: 15 * 60_000, blockMs: 15 * 60_000 },
  /// Initiating a payment or withdrawal — low volume by nature.
  FINANCIAL_WRITE: { limit: 20, windowMs: 60_000 },
  /// Provider webhooks arrive in bursts during reconciliation.
  WEBHOOK: { limit: 300, windowMs: 60_000 },
  READ: { limit: 200, windowMs: 60_000 },
  EXPORT: { limit: 10, windowMs: 5 * 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /// Seconds until the caller may retry. Only meaningful when blocked.
  retryAfter: number;
}

/**
 * Records an attempt against `key` and reports whether it is permitted.
 * Call once per request, before doing the work.
 */
export function checkRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  sweepIfNeeded();

  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  const windowStart = now - rule.windowMs;
  bucket.timestamps = bucket.timestamps.filter((t) => t > windowStart);

  if (bucket.timestamps.length >= rule.limit) {
    bucket.blockedUntil = now + (rule.blockMs ?? rule.windowMs);
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((rule.blockMs ?? rule.windowMs) / 1000),
    };
  }

  bucket.timestamps.push(now);
  bucket.blockedUntil = undefined;
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: rule.limit - bucket.timestamps.length,
    retryAfter: 0,
  };
}

/** Clears a caller's budget — call after a successful login. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is client-supplied and trivially spoofed unless a trusted
 * proxy overwrites it. It is therefore adequate for rate limiting (where the
 * worst case is an attacker granting themselves a fresh budget, which
 * account-level lockout still catches) and must never be used for
 * authorisation.
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return headerList.get("x-real-ip") ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function getUserAgent(): Promise<string | null> {
  try {
    const headerList = await headers();
    return headerList.get("user-agent")?.slice(0, 500) ?? null;
  } catch {
    return null;
  }
}

/**
 * Builds a rate-limit key.
 * Include the identifier where one exists, so an attacker cycling IPs still
 * accumulates attempts against the account they are targeting.
 */
export function rateLimitKey(
  scope: string,
  ip: string,
  identifier?: string | null
): string {
  return identifier ? `${scope}:${identifier.toLowerCase()}` : `${scope}:ip:${ip}`;
}

function sweepIfNeeded(): void {
  const now = Date.now();
  if (now - lastSweep < 60_000 && buckets.size < MAX_BUCKETS) return;

  lastSweep = now;
  const cutoff = now - 60 * 60_000;

  for (const [key, bucket] of buckets) {
    const active =
      (bucket.blockedUntil && bucket.blockedUntil > now) ||
      bucket.timestamps.some((t) => t > cutoff);
    if (!active) buckets.delete(key);
  }

  // If still over the cap after sweeping, drop the oldest entries outright.
  // Losing counters is preferable to unbounded growth; the account-level
  // lockout remains in force regardless.
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS;
    let removed = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++removed >= excess) break;
    }
  }
}
