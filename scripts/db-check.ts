import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

/**
 * Connectivity and seed-state check. Run with: npx tsx scripts/db-check.ts
 * Useful as a deployment smoke test — it proves the app can reach the database
 * with the credentials and TLS mode it will actually use at runtime.
 */
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const [version] = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
  console.log(version.version.split(",")[0]);

  const [ssl] = await prisma.$queryRaw<{ ssl: boolean; version: string | null }[]>`
    SELECT ssl, version FROM pg_stat_ssl WHERE pid = pg_backend_pid()
  `;
  console.log(`TLS: ${ssl?.ssl ? ssl.version : "NOT ENCRYPTED"}`);

  const counts = {
    permissions: await prisma.permission.count(),
    rolePermissions: await prisma.rolePermission.count(),
    associations: await prisma.association.count(),
    users: await prisma.user.count(),
    members: await prisma.member.count(),
    savingsAccounts: await prisma.savingsAccount.count(),
    loanProducts: await prisma.loanProduct.count(),
    settings: await prisma.systemSetting.count(),
    savingsTransactions: await prisma.savingsTransaction.count(),
  };

  console.log("\nRow counts:");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(22)} ${count}`);
  }

  const users = await prisma.user.findMany({
    select: { email: true, role: true, status: true, association: { select: { code: true } } },
    orderBy: [{ role: "asc" }, { email: "asc" }],
  });

  console.log("\nAccounts:");
  for (const u of users) {
    console.log(
      `  ${(u.email ?? "-").padEnd(34)} ${u.role.padEnd(12)} ${u.status.padEnd(8)} ${u.association?.code ?? "PLATFORM"}`
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Check failed:", error);
  process.exit(1);
});
