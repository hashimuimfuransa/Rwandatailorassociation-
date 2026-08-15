import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { postSavingsTransaction } from "@/lib/services/ledger";
import {
  approveLoanApplication,
  disburseLoan,
  recordLoanRepayment,
  submitLoanApplication,
  LoanError,
} from "@/lib/services/loans";
import { add, toMoney } from "@/lib/money";

/**
 * Loan lifecycle integration tests.
 *
 * Follows one loan from application through to full settlement, asserting at
 * each step that the loan ledger and the savings ledger agree, and that the
 * balance reaches exactly zero.
 */

const RUN = `LOAN${Date.now().toString(36).toUpperCase()}`;
const CODE = RUN.slice(0, 8);

let associationId: string;
let adminId: string;
let memberId: string;
let savingsAccountId: string;
let productId: string;

beforeAll(async () => {
  const association = await prisma.association.create({
    data: { code: CODE, name: `Loan Test ${RUN}`, status: "ACTIVE", currency: "RWF" },
  });
  associationId = association.id;

  const admin = await prisma.user.create({
    data: {
      associationId,
      email: `admin-${RUN.toLowerCase()}@loan.test`,
      firstName: "Loan",
      lastName: "Admin",
      passwordHash: "x",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  adminId = admin.id;

  const product = await prisma.loanProduct.create({
    data: {
      associationId,
      code: "TESTSTD",
      name: "Test Standard Loan",
      minimumSavings: "50000",
      savingsMultiplier: "3",
      minAmount: "50000",
      maxAmount: "5000000",
      interestRate: "18",
      interestMethod: "REDUCING_BALANCE",
      processingFeeType: "PERCENTAGE",
      processingFeeValue: "1",
      insuranceFeeType: "PERCENTAGE",
      insuranceFeeValue: "0.5",
      minimumMembershipMonths: 0,
      minTermMonths: 3,
      maxTermMonths: 24,
      allowedFrequencies: ["MONTHLY"],
      singleActiveLoan: true,
    },
  });
  productId = product.id;

  const user = await prisma.user.create({
    data: {
      associationId,
      email: `member-${RUN.toLowerCase()}@loan.test`,
      firstName: "Loan",
      lastName: "Member",
      passwordHash: "x",
      role: "MEMBER",
      status: "ACTIVE",
      member: {
        create: {
          associationId,
          memberNumber: `${CODE}-M1`,
          paymentReference: `${CODE}-1`,
          status: "ACTIVE",
          joinedAt: new Date(Date.now() - 365 * 86_400_000),
          savingsAccounts: {
            create: {
              associationId,
              accountNumber: `${CODE}-SA-1`,
              currency: "RWF",
              balance: "0",
            },
          },
        },
      },
    },
    include: { member: { include: { savingsAccounts: true } } },
  });

  memberId = user.member!.id;
  savingsAccountId = user.member!.savingsAccounts[0].id;

  // Fund the savings account through the ledger, as a real member would.
  await postSavingsTransaction({
    savingsAccountId,
    type: "DEPOSIT",
    direction: "CREDIT",
    amount: "500000",
    channel: "CASH",
    description: "Savings before borrowing",
  });
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { associationId } });
  await prisma.loanRepaymentAllocation.deleteMany({
    where: { loanTransaction: { associationId } },
  });
  await prisma.savingsTransaction.deleteMany({ where: { associationId } });
  await prisma.loanTransaction.deleteMany({ where: { associationId } });
  await prisma.loanInstallment.deleteMany({ where: { loan: { associationId } } });
  await prisma.loanApplicationEvent.deleteMany({
    where: { application: { associationId } },
  });
  await prisma.loan.deleteMany({ where: { associationId } });
  await prisma.loanApplication.deleteMany({ where: { associationId } });
  await prisma.loanProduct.deleteMany({ where: { associationId } });
  await prisma.savingsAccount.deleteMany({ where: { associationId } });
  await prisma.member.deleteMany({ where: { associationId } });
  await prisma.user.deleteMany({ where: { associationId } });
  await prisma.association.delete({ where: { id: associationId } });
  await prisma.$disconnect();
});

describe("application", () => {
  it("refuses a request above the savings multiple", async () => {
    // Savings are 500,000, so the ceiling is 1,500,000.
    const result = await submitLoanApplication({
      memberId,
      loanProductId: productId,
      requestedAmount: "2000000",
      purpose: "Expand tailoring workshop",
      termMonths: 12,
      frequency: "MONTHLY",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures.map((f) => f.rule)).toContain("MAXIMUM_AMOUNT");
    }
  });

  it("accepts a request within the limit and snapshots eligibility", async () => {
    const result = await submitLoanApplication({
      memberId,
      loanProductId: productId,
      requestedAmount: "1000000",
      purpose: "Buy industrial sewing machines",
      termMonths: 12,
      frequency: "MONTHLY",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const application = await prisma.loanApplication.findUniqueOrThrow({
      where: { id: result.applicationId },
      include: { statusHistory: true },
    });

    expect(application.status).toBe("SUBMITTED");
    expect(application.savingsAtApplication?.toFixed(2)).toBe("500000.00");
    expect(application.maxEligibleAmount?.toFixed(2)).toBe("1500000.00");
    expect(application.statusHistory).toHaveLength(1);
  });
});

describe("full lifecycle", () => {
  let applicationId: string;
  let loanId: string;

  it("submits and approves", async () => {
    const existing = await prisma.loanApplication.findFirstOrThrow({
      where: { memberId, status: "SUBMITTED" },
    });
    applicationId = existing.id;

    const approval = await approveLoanApplication({
      applicationId,
      actorId: adminId,
      note: "Approved at full amount after review of contribution history",
    });

    loanId = approval.loanId;

    const loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    expect(loan.status).toBe("PENDING_DISBURSEMENT");
    expect(loan.principal.toFixed(2)).toBe("1000000.00");

    // Approval must not move money.
    expect(loan.disbursedAt).toBeNull();

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: loanId, action: "ADMIN_APPROVED_LOAN" },
    });
    expect(audit?.actorId).toBe(adminId);
  });

  it("refuses to approve more than was requested", async () => {
    const application = await prisma.loanApplication.create({
      data: {
        associationId,
        memberId,
        loanProductId: productId,
        reference: `${CODE}-APP-OVER`,
        status: "SUBMITTED",
        requestedAmount: "100000",
        purpose: "test",
        termMonths: 6,
        frequency: "MONTHLY",
        submittedAt: new Date(),
      },
    });

    await expect(
      approveLoanApplication({
        applicationId: application.id,
        actorId: adminId,
        approvedAmount: "200000",
      })
    ).rejects.toThrow(/cannot exceed/);
  });

  it("disburses, generating the schedule and crediting savings atomically", async () => {
    const balanceBefore = await savingsBalance();

    const result = await disburseLoan({
      loanId,
      actorId: adminId,
      disbursementDate: new Date("2026-01-15T00:00:00Z"),
    });

    // 1,000,000 less 1% processing and 0.5% insurance = 985,000.
    expect(result.netDisbursement).toBe("985000.00");
    expect(result.instalments).toBe(12);

    expect(await savingsBalance()).toBe(balanceBefore + 985000);

    const loan = await prisma.loan.findUniqueOrThrow({
      where: { id: loanId },
      include: { installments: { orderBy: { installmentNumber: "asc" } } },
    });

    expect(loan.status).toBe("ACTIVE");
    expect(loan.installments).toHaveLength(12);
    expect(loan.installments[11].balanceAfter.toFixed(2)).toBe("0.00");

    // The schedule's instalments must sum to the recorded total payable.
    const scheduleTotal = loan.installments.reduce(
      (total, i) => add(total, i.totalDue),
      toMoney(0)
    );
    expect(scheduleTotal.toFixed(2)).toBe(loan.totalPayable.toFixed(2));

    // Loan ledger row exists and is linked to the savings credit.
    const loanTx = await prisma.loanTransaction.findFirstOrThrow({
      where: { loanId, type: "DISBURSEMENT" },
    });
    const savingsTx = await prisma.savingsTransaction.findFirstOrThrow({
      where: { loanTransactionId: loanTx.id },
    });
    expect(savingsTx.type).toBe("LOAN_DISBURSEMENT");
    expect(savingsTx.amount.toFixed(2)).toBe("985000.00");
  });

  it("refuses to disburse the same loan twice", async () => {
    await expect(disburseLoan({ loanId, actorId: adminId })).rejects.toThrow(LoanError);
  });

  it("allocates a repayment penalties-fees-interest-principal, oldest first", async () => {
    const loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    const firstInstalment = await prisma.loanInstallment.findFirstOrThrow({
      where: { loanId, installmentNumber: 1 },
    });

    const result = await recordLoanRepayment({
      loanId,
      amount: firstInstalment.totalDue.toFixed(2),
      actorId: adminId,
      fromSavings: true,
    });

    // Fees (15,000) and interest (15,000) settled before principal.
    expect(result.allocated.fees).toBe("15000.00");
    expect(result.allocated.interest).toBe("15000.00");
    expect(Number(result.allocated.principal)).toBeGreaterThan(0);
    expect(result.instalmentsSettled).toBe(1);

    const settled = await prisma.loanInstallment.findUniqueOrThrow({
      where: { id: firstInstalment.id },
    });
    expect(settled.status).toBe("PAID");

    const after = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    expect(Number(after.totalPaid)).toBeCloseTo(Number(firstInstalment.totalDue), 2);
    expect(Number(after.principalOutstanding)).toBeLessThan(Number(loan.principalOutstanding));
  });

  it("refuses a repayment larger than the outstanding balance", async () => {
    await expect(
      recordLoanRepayment({ loanId, amount: "99999999", actorId: adminId })
    ).rejects.toThrow(/exceeds/);
  });

  it("settles the loan to exactly zero and marks it completed", async () => {
    const loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });

    const outstanding = add(
      loan.principalOutstanding,
      loan.interestOutstanding,
      loan.feesOutstanding,
      loan.penaltyOutstanding
    );

    // Pay the remainder from an external channel rather than savings, so the
    // savings balance is not required to cover it.
    const result = await recordLoanRepayment({
      loanId,
      amount: outstanding.toFixed(2),
      actorId: adminId,
      channel: "BANK_TRANSFER",
      externalReference: "FINAL-SETTLEMENT",
    });

    expect(result.loanCompleted).toBe(true);
    expect(result.totalOutstanding).toBe("0.00");

    const settled = await prisma.loan.findUniqueOrThrow({
      where: { id: loanId },
      include: { installments: true },
    });

    expect(settled.status).toBe("COMPLETED");
    expect(settled.completedAt).not.toBeNull();

    // Every bucket at exactly zero — the property that makes a loan closable.
    expect(settled.principalOutstanding.toFixed(2)).toBe("0.00");
    expect(settled.interestOutstanding.toFixed(2)).toBe("0.00");
    expect(settled.feesOutstanding.toFixed(2)).toBe("0.00");
    expect(settled.totalPaid.toFixed(2)).toBe(settled.totalPayable.toFixed(2));

    expect(settled.installments.every((i) => i.status === "PAID")).toBe(true);
  });

  it("refuses further repayments on a completed loan", async () => {
    await expect(
      recordLoanRepayment({ loanId, amount: "1000", actorId: adminId })
    ).rejects.toThrow(/cannot receive repayments/);
  });

  it("leaves the loan ledger internally consistent", async () => {
    const transactions = await prisma.loanTransaction.findMany({
      where: { loanId },
      orderBy: { sequence: "asc" },
    });

    // Gapless sequence.
    expect(transactions.map((t) => t.sequence)).toEqual(
      Array.from({ length: transactions.length }, (_, i) => i + 1)
    );

    const repayments = transactions.filter((t) => t.type === "REPAYMENT");
    const totalRepaid = repayments.reduce((total, t) => add(total, t.amount), toMoney(0));

    const loan = await prisma.loan.findUniqueOrThrow({ where: { id: loanId } });
    expect(totalRepaid.toFixed(2)).toBe(loan.totalPayable.toFixed(2));

    // Each repayment's bucket split must sum to its own amount.
    for (const repayment of repayments) {
      const split = add(
        repayment.principalPortion,
        repayment.interestPortion,
        repayment.feesPortion,
        repayment.penaltyPortion
      );
      expect(split.toFixed(2)).toBe(repayment.amount.toFixed(2));
    }
  });
});

async function savingsBalance(): Promise<number> {
  const account = await prisma.savingsAccount.findUniqueOrThrow({
    where: { id: savingsAccountId },
    select: { balance: true },
  });
  return Number(account.balance.toFixed(2));
}
