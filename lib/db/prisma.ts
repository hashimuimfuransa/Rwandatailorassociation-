import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@/lib/generated/prisma/client";
import { getEnv } from "@/lib/env";

/**
 * PrismaClient singleton.
 *
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * connection pool on every edit until Postgres refuses connections. Stashing
 * the instance on globalThis keeps exactly one pool alive across reloads.
 *
 * IMPORTANT: this module is Node-runtime only. It must never be imported from
 * middleware, which runs on the Edge runtime where the pg driver does not
 * exist. Middleware does stateless cookie verification only; see lib/auth.
 */

declare global {
  // `var` is required here — `let`/`const` do not create a property on
  // globalThis, which is exactly what the hot-reload cache depends on.
  var __rtaPrisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const env = getEnv();

  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
    // Sizing note: a ledger posting holds its connection for the whole time it
    // is queued behind another writer's row lock, so concurrent postings to the
    // SAME account consume pool slots while doing nothing. A pool of 10 is
    // therefore exhausted by ~10 simultaneous deposits and the eleventh fails
    // to acquire a connection rather than simply waiting its turn — which is
    // what the concurrency test hit.
    max: 20,
    // Long enough to outlast a queue of writers on a busy account. Failing to
    // acquire a connection surfaces to a member as a failed deposit, so it is
    // better to wait than to give up quickly.
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 30_000,
  });

  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

/**
 * Lazily constructed, so that merely importing this module does not build a
 * client or read the environment.
 *
 * This matters at build time: `next build` imports every route module to
 * collect page data, and an eager client would open a connection pool — and
 * demand a complete, valid configuration — during a build that may have
 * neither. The proxy defers all of that to the first actual query.
 */
function getClient(): PrismaClient {
  if (!globalThis.__rtaPrisma) {
    globalThis.__rtaPrisma = createClient();
  }
  return globalThis.__rtaPrisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getClient();
    const value = Reflect.get(client, property, receiver);
    // Prisma's top-level methods ($transaction, $queryRaw, …) rely on `this`,
    // which Reflect.get would otherwise strip.
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { Prisma };
export type { PrismaClient };

/**
 * The transaction-scoped client handed to service functions. Typed as the
 * subset of PrismaClient available inside `$transaction`, so a service can be
 * called either standalone or as part of a larger atomic operation.
 */
export type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

/**
 * Runs `fn` inside a database transaction suitable for moving money.
 *
 * ISOLATION CHOICE — READ COMMITTED, not SERIALIZABLE.
 *
 * What actually prevents a lost update here is the `SELECT … FOR UPDATE` row
 * lock the ledger takes on the savings account before reading its balance (see
 * lib/services/ledger.ts). Under READ COMMITTED, a locking read re-evaluates
 * the row once the lock is granted, so a writer that queued behind another
 * sees the balance the first one committed — never a stale one.
 *
 * SERIALIZABLE was the first instinct and it was the wrong one. It gives no
 * extra safety over an explicit row lock for this access pattern, and it
 * converts every ordinary queue-behind-the-lock into a `could not serialize
 * access` abort. Under twenty concurrent deposits that meant most transactions
 * failing and retrying rather than simply waiting their turn — worse
 * throughput for identical correctness.
 *
 * Callers that genuinely need snapshot-level guarantees across several rows
 * can still request it via `isolationLevel`.
 */
export async function withFinancialTransaction<T>(
  fn: (tx: TxClient) => Promise<T>,
  options: {
    retries?: number;
    timeoutMs?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  } = {}
): Promise<T> {
  const {
    retries = 5,
    timeoutMs = 20_000,
    isolationLevel = Prisma.TransactionIsolationLevel.ReadCommitted,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel,
        timeout: timeoutMs,
        // Generous: under contention a writer waits for the row lock, and
        // giving up early would surface as a spurious failure to the member.
        maxWait: 15_000,
      });
    } catch (error) {
      lastError = error;

      if (!isRetryableTransactionError(error) || attempt === retries) {
        throw error;
      }

      // Exponential backoff with jitter, so two conflicting writers do not
      // retry in lockstep and collide again immediately.
      const backoff = Math.min(50 * 2 ** attempt, 500);
      await new Promise((resolve) =>
        setTimeout(resolve, backoff + Math.random() * backoff)
      );
    }
  }

  throw lastError;
}

/**
 * Postgres 40001 (serialization_failure) and 40P01 (deadlock_detected) mean
 * "your transaction was aborted, but retrying may well succeed". Anything else
 * is a real error and must propagate — silently retrying, say, a
 * unique-constraint violation is how a duplicate payment sneaks through.
 *
 * Detecting them is fiddlier than it should be. Prisma documents P2034 for
 * write conflicts, but with the pg driver adapter the same condition arrives
 * as P2010 with the original SQLSTATE buried in
 * `meta.driverAdapterError.cause.originalCode`. Checking only P2034 means
 * retries never fire, which is precisely what the concurrency tests caught.
 * All the known shapes are therefore checked.
 */
function isRetryableTransactionError(error: unknown): boolean {
  const RETRYABLE_SQLSTATES = new Set(["40001", "40P01"]);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") return true;

    if (error.code === "P2010") {
      const adapterError = (
        error.meta as
          | { driverAdapterError?: { cause?: { originalCode?: string; kind?: string } } }
          | undefined
      )?.driverAdapterError;

      const originalCode = adapterError?.cause?.originalCode;
      if (originalCode && RETRYABLE_SQLSTATES.has(originalCode)) return true;
      if (adapterError?.cause?.kind === "TransactionWriteConflict") return true;
    }
  }

  const code = (error as { code?: string } | null)?.code;
  if (code && RETRYABLE_SQLSTATES.has(code)) return true;

  // Last resort: the driver adapter sometimes throws a plain error whose only
  // distinguishing feature is the Postgres message text.
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("could not serialize access") ||
    message.includes("deadlock detected") ||
    message.includes("TransactionWriteConflict")
  );
}

/**
 * True when the error is a unique-constraint violation on the given field.
 * Used by the payment pipeline to turn "this provider transaction already
 * exists" from an exception into the expected, harmless duplicate outcome.
 */
export function isUniqueConstraintError(
  error: unknown,
  field?: string
): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;
  if (!field) return true;

  // Field names need normalising before comparison. Prisma reports the target
  // of a composite unique as a mix of bare and quoted identifiers — the
  // constraint on (provider, externalTransactionId) arrives as
  // ["provider", "\"externalTransactionId\""], with literal double quotes in
  // the second entry. A plain `includes(field)` therefore misses it, which is
  // how a duplicate payment turned into an unhandled exception instead of the
  // expected no-op.
  const normalise = (value: string) => value.replace(/["`\s]/g, "").toLowerCase();
  const wanted = normalise(field);

  const candidates: string[] = [];

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    candidates.push(...target.map(String));
  } else if (typeof target === "string") {
    candidates.push(target);
  }

  // The pg driver adapter also reports the constraint's columns separately.
  const adapterFields = (
    error.meta as
      | { driverAdapterError?: { cause?: { constraint?: { fields?: string[] } } } }
      | undefined
  )?.driverAdapterError?.cause?.constraint?.fields;

  if (Array.isArray(adapterFields)) candidates.push(...adapterFields.map(String));

  return candidates.some((candidate) => normalise(candidate).includes(wanted));
}
