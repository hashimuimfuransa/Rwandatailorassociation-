import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { postSavingsTransaction, verifyAccountIntegrity } from "@/lib/services/ledger";

/**
 * Posts demo savings history for development.
 *
 * Every entry goes through `postSavingsTransaction` — the same code path a
 * real deposit takes. Nothing writes a balance directly, so the demo data is
 * internally consistent by construction and exercises the production ledger
 * rather than side-stepping it.
 *
 * Development only. Refuses to run against NODE_ENV=production, where inventing
 * contributions would be indistinguishable from fraud.
 *
 * Usage: npx tsx scripts/seed-transactions.ts
 */

const MONTHS_OF_HISTORY = 8;

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to post fabricated transactions in production. This script is for development only."
    );
  }

  const association = await prisma.association.findUnique({
    where: { code: "RTA" },
    select: { id: true },
  });
  if (!association) throw new Error("Seed the RTA association first: npm run db:seed");

  const members = await prisma.member.findMany({
    where: {
      associationId: association.id,
      status: "ACTIVE",
      user: { email: { endsWith: "@example.rw" } },
    },
    select: {
      id: true,
      memberNumber: true,
      user: { select: { firstName: true, lastName: true } },
      savingsAccounts: { where: { isActive: true }, take: 1, select: { id: true } },
    },
  });

  if (members.length === 0) {
    throw new Error("No demo members found. Run: SEED_DEMO=true npm run db:seed");
  }

  console.log(`\nPosting ${MONTHS_OF_HISTORY} months of history for ${members.length} members\n`);

  // Deliberately varied so the dashboard charts show a realistic shape rather
  // than a straight line: different starting points, contribution sizes and
  // the occasional withdrawal.
  const profiles = [
    { monthly: 45_000, opening: 120_000, withdrawsAt: [4] },
    { monthly: 30_000, opening: 80_000, withdrawsAt: [] },
    { monthly: 60_000, opening: 200_000, withdrawsAt: [2, 6] },
    { monthly: 25_000, opening: 50_000, withdrawsAt: [5] },
  ];

  for (const [index, member] of members.entries()) {
    const account = member.savingsAccounts[0];
    if (!account) continue;

    const existing = await prisma.savingsTransaction.count({
      where: { savingsAccountId: account.id },
    });
    if (existing > 0) {
      console.log(
        `  ${member.memberNumber} already has ${existing} transactions — skipped`
      );
      continue;
    }

    const profile = profiles[index % profiles.length];
    const name = `${member.user.firstName} ${member.user.lastName}`;

    // Opening contribution, backdated to the start of the history window.
    await postSavingsTransaction({
      savingsAccountId: account.id,
      type: "DEPOSIT",
      direction: "CREDIT",
      amount: String(profile.opening),
      channel: "CASH",
      description: "Opening membership contribution",
      valueDate: monthsAgo(MONTHS_OF_HISTORY),
    });

    let posted = 1;

    for (let month = MONTHS_OF_HISTORY - 1; month >= 0; month--) {
      // Vary the amount a little so the chart is not perfectly flat.
      const variance = ((index + month) % 3) * 2_500;
      const amount = profile.monthly + variance;

      await postSavingsTransaction({
        savingsAccountId: account.id,
        type: "DEPOSIT",
        direction: "CREDIT",
        amount: String(amount),
        channel: "MOBILE_MONEY",
        description: `Monthly contribution — ${monthName(month)}`,
        valueDate: monthsAgo(month),
      });
      posted++;

      if (profile.withdrawsAt.includes(month)) {
        await postSavingsTransaction({
          savingsAccountId: account.id,
          type: "WITHDRAWAL",
          direction: "DEBIT",
          amount: "20000",
          channel: "MOBILE_MONEY",
          description: "Approved withdrawal",
          valueDate: monthsAgo(month),
        });
        posted++;
      }
    }

    const report = await verifyAccountIntegrity(account.id);
    const status = report.ok ? "verified" : "INTEGRITY FAILURE";

    console.log(
      `  ${member.memberNumber.padEnd(14)} ${name.padEnd(22)} ${posted} entries  balance ${report.cachedBalance.padStart(12)}  ${status}`
    );

    if (!report.ok) {
      console.error("    ", JSON.stringify(report, null, 2));
      process.exitCode = 1;
    }
  }

  console.log("\nDone.\n");
  await prisma.$disconnect();
}

function monthsAgo(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(Math.min(5 + (months % 20), 28));
  return date;
}

function monthName(monthsBack: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsBack);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

main().catch(async (error) => {
  console.error("\nFailed:", error);
  await prisma.$disconnect();
  process.exit(1);
});
