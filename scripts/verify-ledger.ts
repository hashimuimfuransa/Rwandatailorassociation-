import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { verifyAccountIntegrity } from "@/lib/services/ledger";

/**
 * Ledger integrity report.
 *
 * Replays every savings account's transaction history and compares the result
 * with the cached balance. Prints a per-account verdict.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/verify-ledger.ts
 *
 * `--prune-tests` additionally deletes associations left behind by a crashed
 * integration test run (codes beginning TEST/PAY/LOAN). Those fixtures include
 * a deliberately corrupted balance, so they show up as failures and drown out
 * genuine ones.
 */
async function main() {
  const accounts = await prisma.savingsAccount.findMany({
    select: {
      id: true,
      accountNumber: true,
      association: { select: { code: true, name: true } },
      member: { select: { memberNumber: true } },
    },
    orderBy: { accountNumber: "asc" },
  });

  console.log(`\nChecking ${accounts.length} savings accounts\n`);

  let ok = 0;
  const failures: string[] = [];

  for (const account of accounts) {
    const report = await verifyAccountIntegrity(account.id);
    const code = account.association.code;

    if (report.ok) {
      ok++;
      console.log(
        `  OK    ${account.accountNumber.padEnd(24)} ${report.cachedBalance.padStart(14)}  (${report.transactionCount} entries)`
      );
    } else {
      failures.push(account.accountNumber);
      console.log(
        `  FAIL  ${account.accountNumber.padEnd(24)} cached ${report.cachedBalance} vs derived ${report.derivedBalance}  diff ${report.difference}  gaps ${JSON.stringify(report.sequenceGaps)}  brokenAt ${report.brokenChainAt ?? "-"}  [${code}]`
      );
    }
  }

  console.log(`\n${ok} verified, ${failures.length} failed\n`);

  if (process.argv.includes("--prune-tests")) {
    const orphans = await prisma.association.findMany({
      where: {
        OR: [
          { code: { startsWith: "TEST" } },
          { code: { startsWith: "PAY" } },
          { code: { startsWith: "LOAN" } },
        ],
      },
      select: { id: true, code: true, name: true },
    });

    console.log(`Pruning ${orphans.length} leftover test association(s)`);

    for (const association of orphans) {
      const associationId = association.id;
      // Ordered by foreign key dependency.
      await prisma.loanRepaymentAllocation.deleteMany({
        where: { loanTransaction: { associationId } },
      });
      await prisma.paymentReconciliation.deleteMany({
        where: { payment: { associationId } },
      });
      await prisma.savingsTransaction.deleteMany({ where: { associationId } });
      await prisma.loanTransaction.deleteMany({ where: { associationId } });
      await prisma.loanInstallment.deleteMany({ where: { loan: { associationId } } });
      await prisma.loanApplicationEvent.deleteMany({
        where: { application: { associationId } },
      });
      await prisma.guarantor.deleteMany({ where: { loan: { associationId } } });
      await prisma.loan.deleteMany({ where: { associationId } });
      await prisma.loanApplication.deleteMany({ where: { associationId } });
      await prisma.loanProduct.deleteMany({ where: { associationId } });
      await prisma.payment.deleteMany({ where: { associationId } });
      await prisma.withdrawal.deleteMany({ where: { associationId } });
      await prisma.notification.deleteMany({ where: { associationId } });
      await prisma.auditLog.deleteMany({ where: { associationId } });
      await prisma.savingsAccount.deleteMany({ where: { associationId } });
      await prisma.member.deleteMany({ where: { associationId } });
      await prisma.session.deleteMany({ where: { user: { associationId } } });
      await prisma.loginActivity.deleteMany({ where: { user: { associationId } } });
      await prisma.user.deleteMany({ where: { associationId } });
      await prisma.savingsRule.deleteMany({ where: { associationId } });
      await prisma.systemSetting.deleteMany({ where: { associationId } });
      await prisma.association.delete({ where: { id: associationId } });

      console.log(`  removed ${association.code} (${association.name})`);
    }
  }

  await prisma.$disconnect();
  process.exitCode = failures.length > 0 && !process.argv.includes("--prune-tests") ? 1 : 0;
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
