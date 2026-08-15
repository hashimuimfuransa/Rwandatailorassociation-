import "dotenv/config";

/**
 * Vitest setup.
 *
 * Integration tests run against the real database configured in .env. They
 * create their own association and members with a unique per-run prefix and
 * delete them afterwards, so they never touch seeded or live records.
 */

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Integration tests need a database — copy .env.example to .env."
  );
}
