import "dotenv/config";
import path from "node:path";
import { defineConfig } from "@prisma/config";

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * Only the CLI — migrate, db push, studio, introspect — reads this file. The
 * application itself never does; it builds a PrismaClient from the pg driver
 * adapter in lib/db/prisma.ts. Keeping the two paths separate means the
 * migration credential (which may need DDL rights) can differ from the
 * runtime credential (which should not have them).
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    // Migrations must run over a DIRECT connection. Hosted Postgres providers
    // (Neon, Supabase) hand out a pooled URL by default, but PgBouncer in
    // transaction mode cannot hold the advisory locks and session state that
    // Prisma Migrate depends on — migrations hang or half-apply against it.
    // DATABASE_URL stays pooled for the app; DIRECT_DATABASE_URL is used here.
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
    // `|| undefined` matters: an unset variable in .env arrives as "" and
    // Prisma rejects an empty shadow URL outright rather than ignoring it.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || undefined,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
