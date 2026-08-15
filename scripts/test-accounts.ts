import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

/**
 * Prints the current state of every account, for testing.
 * Run: npx tsx --tsconfig tsconfig.scripts.json scripts/test-accounts.ts
 *
 * Never prints password hashes — only whether a password is set and whether a
 * change is forced at next login.
 */
async function main() {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      mustChangePassword: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      association: { select: { code: true } },
      member: {
        select: {
          memberNumber: true,
          paymentReference: true,
          status: true,
          savingsAccounts: {
            where: { isActive: true },
            take: 1,
            select: { balance: true, lockedBalance: true, lastSequence: true },
          },
          loans: {
            where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
            select: { reference: true, status: true, principal: true },
          },
        },
      },
    },
  });

  console.log("\n══ ACCOUNTS ══\n");

  for (const u of users) {
    const m = u.member;
    const account = m?.savingsAccounts[0];

    console.log(`${u.role}  ${u.email}`);
    console.log(`   name        ${u.firstName} ${u.lastName}`);
    console.log(`   phone       ${u.phone ?? "—"}`);
    console.log(`   status      ${u.status}${u.mustChangePassword ? "  (must change password)" : ""}`);
    if (u.lockedUntil && u.lockedUntil > new Date()) {
      console.log(`   LOCKED      until ${u.lockedUntil.toISOString()}`);
    }
    console.log(`   association ${u.association?.code ?? "PLATFORM"}`);

    if (m) {
      console.log(`   member no.  ${m.memberNumber}   payment ref ${m.paymentReference}`);
      console.log(`   member      ${m.status}`);
      if (account) {
        console.log(
          `   balance     ${account.balance.toFixed(2)}  (locked ${account.lockedBalance.toFixed(2)}, ${account.lastSequence} ledger entries)`
        );
      }
      for (const loan of m.loans) {
        console.log(`   loan        ${loan.reference}  ${loan.status}  ${loan.principal.toFixed(2)}`);
      }
    }
    console.log("");
  }

  const [payments, unmatched, withdrawals, applications] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "UNMATCHED" } }),
    prisma.withdrawal.count({ where: { status: { in: ["PENDING", "APPROVED"] } } }),
    prisma.loanApplication.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
  ]);

  console.log("══ QUEUES ══\n");
  console.log(`   payments recorded        ${payments}`);
  console.log(`   unmatched payments       ${unmatched}`);
  console.log(`   open withdrawals         ${withdrawals}`);
  console.log(`   pending loan applications ${applications}\n`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
