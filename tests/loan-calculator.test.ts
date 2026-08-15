import { describe, expect, it } from "vitest";
import {
  checkEligibility,
  computeCharge,
  computePenalty,
  generateSchedule,
  periodsForTerm,
} from "@/lib/services/loan-calculator";
import { Decimal, toMoney } from "@/lib/money";

/**
 * Loan arithmetic tests.
 *
 * The properties asserted throughout — instalments summing to the total,
 * principal amortising to exactly zero — are the ones whose absence produces
 * loans that can never be closed, and members chased for a balance of four
 * francs that the system cannot clear.
 */

const sum = (values: string[]) =>
  values.reduce((total, v) => total.plus(toMoney(v)), new Decimal(0)).toFixed(2);

describe("periodsForTerm", () => {
  it("converts a term in months to the right number of periods", () => {
    expect(periodsForTerm(12, "MONTHLY")).toBe(12);
    expect(periodsForTerm(12, "QUARTERLY")).toBe(4);
    expect(periodsForTerm(12, "WEEKLY")).toBe(52);
    expect(periodsForTerm(12, "BIWEEKLY")).toBe(26);
    expect(periodsForTerm(6, "MONTHLY")).toBe(6);
  });
});

describe("computeCharge", () => {
  it("computes a percentage of principal", () => {
    expect(computeCharge("1000000", "PERCENTAGE", "1").toFixed(2)).toBe("10000.00");
    expect(computeCharge("500000", "PERCENTAGE", "0.5").toFixed(2)).toBe("2500.00");
  });

  it("passes a fixed amount through unchanged", () => {
    expect(computeCharge("1000000", "FIXED", "5000").toFixed(2)).toBe("5000.00");
  });

  it("treats an absent value as no charge", () => {
    expect(computeCharge("1000000", "PERCENTAGE", undefined).toFixed(2)).toBe("0.00");
  });
});

describe("reducing-balance schedule", () => {
  const schedule = generateSchedule({
    principal: "1000000",
    annualRate: "18",
    method: "REDUCING_BALANCE",
    termMonths: 12,
    frequency: "MONTHLY",
    disbursementDate: new Date("2026-01-15T00:00:00Z"),
  });

  it("produces one instalment per period", () => {
    expect(schedule.instalments).toHaveLength(12);
    expect(schedule.numberOfPeriods).toBe(12);
  });

  it("amortises principal to exactly zero", () => {
    const last = schedule.instalments[11];
    expect(last.balanceAfter).toBe("0.00");
  });

  it("repays exactly the principal, no more and no less", () => {
    expect(sum(schedule.instalments.map((i) => i.principalDue))).toBe("1000000.00");
  });

  it("charges interest only on the outstanding balance", () => {
    // Month 1 interest = 1,000,000 × 18% / 12 = 15,000.
    expect(schedule.instalments[0].interestDue).toBe("15000.00");
    // Later instalments carry less interest as the balance falls.
    expect(
      toMoney(schedule.instalments[11].interestDue).lessThan(
        toMoney(schedule.instalments[0].interestDue)
      )
    ).toBe(true);
  });

  it("has instalments that sum to the total payable", () => {
    expect(sum(schedule.instalments.map((i) => i.totalDue))).toBe(schedule.totalPayable);
  });

  it("reports total payable as principal plus interest plus fees", () => {
    const expected = toMoney(schedule.principal)
      .plus(toMoney(schedule.totalInterest))
      .plus(toMoney(schedule.totalFees))
      .toFixed(2);
    expect(schedule.totalPayable).toBe(expected);
  });

  it("schedules the first payment a month after disbursement", () => {
    expect(schedule.instalments[0].dueDate.toISOString().slice(0, 10)).toBe("2026-02-15");
    expect(schedule.maturityDate.toISOString().slice(0, 10)).toBe("2027-01-15");
  });
});

describe("flat-rate schedule", () => {
  const schedule = generateSchedule({
    principal: "600000",
    annualRate: "12",
    method: "FLAT",
    termMonths: 6,
    frequency: "MONTHLY",
    disbursementDate: new Date("2026-03-01T00:00:00Z"),
  });

  it("charges interest on the original principal for the whole term", () => {
    // 600,000 × 12% × 0.5 years = 36,000.
    expect(schedule.totalInterest).toBe("36000.00");
  });

  it("splits principal and interest evenly", () => {
    expect(schedule.instalments[0].principalDue).toBe("100000.00");
    expect(schedule.instalments[0].interestDue).toBe("6000.00");
  });

  it("still amortises to zero and sums exactly", () => {
    expect(schedule.instalments[5].balanceAfter).toBe("0.00");
    expect(sum(schedule.instalments.map((i) => i.principalDue))).toBe("600000.00");
    expect(sum(schedule.instalments.map((i) => i.interestDue))).toBe("36000.00");
  });
});

describe("fees", () => {
  const schedule = generateSchedule({
    principal: "1000000",
    annualRate: "18",
    method: "REDUCING_BALANCE",
    termMonths: 12,
    frequency: "MONTHLY",
    processingFeeType: "PERCENTAGE",
    processingFeeValue: "1",
    insuranceFeeType: "PERCENTAGE",
    insuranceFeeValue: "0.5",
  });

  it("computes each fee from the principal", () => {
    expect(schedule.processingFee).toBe("10000.00");
    expect(schedule.insuranceFee).toBe("5000.00");
    expect(schedule.totalFees).toBe("15000.00");
  });

  it("shows what the member actually receives after fees", () => {
    // The figure members are most often surprised by, so it is explicit.
    expect(schedule.netDisbursement).toBe("985000.00");
  });

  it("charges the fees on the first instalment only", () => {
    expect(schedule.instalments[0].feesDue).toBe("15000.00");
    expect(schedule.instalments[1].feesDue).toBe("0.00");
    expect(sum(schedule.instalments.map((i) => i.feesDue))).toBe("15000.00");
  });
});

describe("awkward shapes", () => {
  // Terms that do not divide cleanly are where remainders get dropped.
  it("never loses a franc, across many principal and term combinations", () => {
    const cases: { principal: string; months: number; rate: string }[] = [
      { principal: "1000000", months: 7, rate: "18" },
      { principal: "333333", months: 11, rate: "15.5" },
      { principal: "1", months: 3, rate: "20" },
      { principal: "999999.99", months: 13, rate: "7.25" },
      { principal: "50000", months: 24, rate: "0" },
      { principal: "2500000", months: 18, rate: "12.75" },
    ];

    for (const testCase of cases) {
      for (const method of ["FLAT", "REDUCING_BALANCE"] as const) {
        const schedule = generateSchedule({
          principal: testCase.principal,
          annualRate: testCase.rate,
          method,
          termMonths: testCase.months,
          frequency: "MONTHLY",
        });

        const label = `${testCase.principal} over ${testCase.months}m at ${testCase.rate}% (${method})`;

        expect(sum(schedule.instalments.map((i) => i.principalDue)), label).toBe(
          toMoney(testCase.principal).toFixed(2)
        );
        expect(
          schedule.instalments[schedule.instalments.length - 1].balanceAfter,
          label
        ).toBe("0.00");
        expect(sum(schedule.instalments.map((i) => i.totalDue)), label).toBe(
          schedule.totalPayable
        );
      }
    }
  });

  it("handles an interest-free loan without dividing by zero", () => {
    const schedule = generateSchedule({
      principal: "120000",
      annualRate: "0",
      method: "REDUCING_BALANCE",
      termMonths: 12,
      frequency: "MONTHLY",
    });

    expect(schedule.totalInterest).toBe("0.00");
    expect(schedule.instalments[0].principalDue).toBe("10000.00");
    expect(schedule.instalments[11].balanceAfter).toBe("0.00");
  });

  it("clamps month-end dates instead of skipping a month", () => {
    // Disbursed on 31 January. Naive month arithmetic rolls 31 February into
    // 3 March and the member gets a due date in the wrong month.
    const schedule = generateSchedule({
      principal: "300000",
      annualRate: "10",
      method: "REDUCING_BALANCE",
      termMonths: 3,
      frequency: "MONTHLY",
      disbursementDate: new Date("2026-01-31T00:00:00Z"),
    });

    const dates = schedule.instalments.map((i) => i.dueDate.toISOString().slice(0, 10));
    expect(dates[0]).toBe("2026-02-28");
    expect(dates[1]).toBe("2026-03-31");
    expect(dates[2]).toBe("2026-04-30");
  });

  it("applies a grace period before the first instalment", () => {
    const schedule = generateSchedule({
      principal: "100000",
      annualRate: "12",
      method: "REDUCING_BALANCE",
      termMonths: 3,
      frequency: "MONTHLY",
      gracePeriodDays: 30,
      disbursementDate: new Date("2026-01-01T00:00:00Z"),
    });

    expect(schedule.instalments[0].dueDate.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("supports weekly and quarterly frequencies", () => {
    const weekly = generateSchedule({
      principal: "260000",
      annualRate: "13",
      method: "REDUCING_BALANCE",
      termMonths: 12,
      frequency: "WEEKLY",
    });
    expect(weekly.instalments).toHaveLength(52);
    expect(weekly.instalments[51].balanceAfter).toBe("0.00");

    const quarterly = generateSchedule({
      principal: "400000",
      annualRate: "16",
      method: "REDUCING_BALANCE",
      termMonths: 12,
      frequency: "QUARTERLY",
    });
    expect(quarterly.instalments).toHaveLength(4);
    expect(quarterly.instalments[3].balanceAfter).toBe("0.00");
  });

  it("rejects nonsensical terms", () => {
    const base = {
      annualRate: "18",
      method: "REDUCING_BALANCE" as const,
      frequency: "MONTHLY" as const,
    };
    expect(() => generateSchedule({ ...base, principal: "0", termMonths: 12 })).toThrow();
    expect(() => generateSchedule({ ...base, principal: "-100", termMonths: 12 })).toThrow();
    expect(() => generateSchedule({ ...base, principal: "1000", termMonths: 0 })).toThrow();
    expect(() =>
      generateSchedule({ ...base, principal: "1000", termMonths: 12, annualRate: "-5" })
    ).toThrow();
  });
});

describe("eligibility", () => {
  const product = {
    name: "Standard Member Loan",
    minimumSavings: "50000",
    savingsMultiplier: "3",
    minAmount: "50000",
    maxAmount: "5000000",
    absoluteMaxAmount: null,
    minimumMembershipMonths: 3,
    minTermMonths: 3,
    maxTermMonths: 24,
    singleActiveLoan: true,
  };

  // The worked example from the brief, made configurable rather than hard-coded.
  it("caps borrowing at the configured multiple of savings", () => {
    const result = checkEligibility({
      savingsBalance: "500000",
      requestedAmount: "1500000",
      termMonths: 12,
      membershipMonths: 12,
      hasActiveLoan: false,
      product,
    });

    expect(result.eligible).toBe(true);
    expect(result.maxEligibleAmount).toBe("1500000.00");
  });

  it("refuses a request above the ceiling", () => {
    const result = checkEligibility({
      savingsBalance: "500000",
      requestedAmount: "1500001",
      termMonths: 12,
      membershipMonths: 12,
      hasActiveLoan: false,
      product,
    });

    expect(result.eligible).toBe(false);
    expect(result.failures.map((f) => f.rule)).toContain("MAXIMUM_AMOUNT");
  });

  it("enforces the product cap even when savings would allow more", () => {
    const result = checkEligibility({
      savingsBalance: "10000000",
      requestedAmount: "6000000",
      termMonths: 12,
      membershipMonths: 12,
      hasActiveLoan: false,
      product,
    });

    expect(result.maxEligibleAmount).toBe("5000000.00");
    expect(result.eligible).toBe(false);
  });

  it("enforces the minimum savings balance", () => {
    const result = checkEligibility({
      savingsBalance: "40000",
      requestedAmount: "100000",
      termMonths: 12,
      membershipMonths: 12,
      hasActiveLoan: false,
      product,
    });

    expect(result.failures.map((f) => f.rule)).toContain("MINIMUM_SAVINGS");
  });

  it("enforces the membership duration", () => {
    const result = checkEligibility({
      savingsBalance: "500000",
      requestedAmount: "500000",
      termMonths: 12,
      membershipMonths: 1,
      hasActiveLoan: false,
      product,
    });

    expect(result.failures.map((f) => f.rule)).toContain("MEMBERSHIP_DURATION");
  });

  it("blocks a second loan when the product forbids it", () => {
    const result = checkEligibility({
      savingsBalance: "500000",
      requestedAmount: "500000",
      termMonths: 12,
      membershipMonths: 12,
      hasActiveLoan: true,
      product,
    });

    expect(result.failures.map((f) => f.rule)).toContain("ACTIVE_LOAN");
  });

  it("allows a second loan when the product permits it", () => {
    const result = checkEligibility({
      savingsBalance: "500000",
      requestedAmount: "500000",
      termMonths: 12,
      membershipMonths: 12,
      hasActiveLoan: true,
      product: { ...product, singleActiveLoan: false },
    });

    expect(result.eligible).toBe(true);
  });

  it("enforces the term bounds", () => {
    for (const termMonths of [1, 36]) {
      const result = checkEligibility({
        savingsBalance: "500000",
        requestedAmount: "500000",
        termMonths,
        membershipMonths: 12,
        hasActiveLoan: false,
        product,
      });
      expect(result.failures.map((f) => f.rule)).toContain("TERM");
    }
  });

  it("reports every failing rule at once, not just the first", () => {
    const result = checkEligibility({
      savingsBalance: "1000",
      requestedAmount: "10000000",
      termMonths: 60,
      membershipMonths: 0,
      hasActiveLoan: true,
      product,
    });

    expect(result.failures.length).toBeGreaterThanOrEqual(4);
  });

  it("warns when a request is near the member's limit", () => {
    const result = checkEligibility({
      savingsBalance: "500000",
      requestedAmount: "1450000",
      termMonths: 12,
      membershipMonths: 12,
      hasActiveLoan: false,
      product,
    });

    expect(result.eligible).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("penalties", () => {
  it("charges nothing inside the grace period", () => {
    expect(
      computePenalty({
        overdueAmount: "100000",
        daysOverdue: 2,
        penaltyType: "PERCENTAGE",
        penaltyValue: "2",
        graceDays: 3,
      })
    ).toBe("0.00");
  });

  it("charges the configured percentage once the grace period has passed", () => {
    expect(
      computePenalty({
        overdueAmount: "100000",
        daysOverdue: 5,
        penaltyType: "PERCENTAGE",
        penaltyValue: "2",
        graceDays: 3,
      })
    ).toBe("2000.00");
  });

  it("supports a fixed penalty", () => {
    expect(
      computePenalty({
        overdueAmount: "100000",
        daysOverdue: 10,
        penaltyType: "FIXED",
        penaltyValue: "5000",
        graceDays: 0,
      })
    ).toBe("5000.00");
  });
});
