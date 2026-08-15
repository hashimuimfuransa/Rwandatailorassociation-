import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

/**
 * Inspects what the auth flow actually recorded, and clears any lockout left
 * behind by testing. Run with: npx tsx scripts/audit-check.ts [--unlock]
 */
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const audits = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      action: true,
      entityType: true,
      actorEmail: true,
      actorRole: true,
      severity: true,
      ipAddress: true,
      createdAt: true,
    },
  });

  console.log("Recent audit log:");
  for (const a of audits) {
    console.log(
      `  ${a.createdAt.toISOString().slice(11, 19)}  ${a.action.padEnd(30)} ${(a.actorEmail ?? "-").padEnd(30)} ${a.severity}`
    );
  }

  const activity = await prisma.loginActivity.groupBy({
    by: ["identifier", "success", "failureReason"],
    _count: true,
    orderBy: { _count: { identifier: "desc" } },
  });

  console.log("\nLogin activity:");
  for (const row of activity) {
    console.log(
      `  ${row.identifier.padEnd(32)} success=${String(row.success).padEnd(5)} ${(row.failureReason ?? "-").padEnd(16)} x${row._count}`
    );
  }

  const sessions = await prisma.session.findMany({
    select: { revokedAt: true, revokedReason: true, user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log("\nSessions:");
  for (const s of sessions) {
    console.log(
      `  ${(s.user.email ?? "-").padEnd(32)} ${s.revokedAt ? `revoked (${s.revokedReason})` : "active"}`
    );
  }

  const locked = await prisma.user.findMany({
    where: { OR: [{ lockedUntil: { not: null } }, { failedLoginAttempts: { gt: 0 } }] },
    select: { email: true, failedLoginAttempts: true, lockedUntil: true },
  });

  console.log("\nLocked / failing accounts:");
  if (locked.length === 0) console.log("  none");
  for (const u of locked) {
    console.log(
      `  ${(u.email ?? "-").padEnd(32)} attempts=${u.failedLoginAttempts} lockedUntil=${u.lockedUntil?.toISOString() ?? "-"}`
    );
  }

  if (process.argv.includes("--unlock")) {
    const result = await prisma.user.updateMany({
      where: { OR: [{ lockedUntil: { not: null } }, { failedLoginAttempts: { gt: 0 } }] },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });
    console.log(`\nCleared lockout on ${result.count} account(s).`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
