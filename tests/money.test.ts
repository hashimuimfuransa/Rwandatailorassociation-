import { describe, expect, it } from "vitest";
import {
  add,
  allocate,
  Decimal,
  divide,
  equals,
  formatMoney,
  formatMoneyCompact,
  gt,
  multiply,
  parseMoneyInput,
  percentageOf,
  quantize,
  subtract,
  toMoney,
  toMoneyString,
} from "@/lib/money";

describe("toMoney", () => {
  it("parses decimal strings exactly", () => {
    expect(toMoney("250000.55").toFixed(2)).toBe("250000.55");
  });

  it("strips thousands separators from user input", () => {
    expect(toMoney("1,250,000").toFixed(2)).toBe("1250000.00");
  });

  it("treats null and empty input as zero", () => {
    expect(toMoney(null).toFixed(2)).toBe("0.00");
    expect(toMoney("   ").toFixed(2)).toBe("0.00");
  });

  it("accepts safe integers", () => {
    expect(toMoney(50_000).toFixed(2)).toBe("50000.00");
  });

  // The whole point of the module: a float that has already lost precision
  // must not be laundered into a balance.
  it("refuses non-integer numbers", () => {
    expect(() => toMoney(0.1 + 0.2)).toThrow(/non-integer number/);
    expect(() => toMoney(1234.56)).toThrow(/non-integer number/);
  });

  it("rejects values that are not numeric at all", () => {
    expect(() => toMoney("abc")).toThrow(/Invalid monetary value/);
    expect(() => toMoney(Number.NaN)).toThrow(/Invalid monetary value/);
    expect(() => toMoney(Number.POSITIVE_INFINITY)).toThrow(/Invalid monetary value/);
  });
});

describe("arithmetic", () => {
  it("does not exhibit binary floating point error", () => {
    // 0.1 + 0.2 !== 0.3 in IEEE-754. It must here.
    expect(add("0.1", "0.2").toFixed(2)).toBe("0.30");
    expect(equals(add("0.1", "0.2"), "0.3")).toBe(true);
  });

  it("adds a long series without drift", () => {
    const hundredCents = Array.from({ length: 100 }, () => "0.01");
    expect(add(...hundredCents).toFixed(2)).toBe("1.00");
  });

  it("subtracts to exactly zero", () => {
    expect(subtract("250000.00", "250000.00").isZero()).toBe(true);
  });

  it("multiplies and rounds half-up at the storage scale", () => {
    expect(multiply("100", "1.005").toFixed(2)).toBe("100.50");
    // 0.125 → 0.13 under half-up; banker's rounding would give 0.12.
    expect(multiply("0.25", "0.5").toFixed(2)).toBe("0.13");
  });

  it("divides and refuses division by zero", () => {
    expect(divide("1000", "4").toFixed(2)).toBe("250.00");
    expect(() => divide("1000", "0")).toThrow(/Division by zero/);
  });

  it("computes percentages the way an interest rate is quoted", () => {
    expect(percentageOf("1000", "2.5").toFixed(2)).toBe("25.00");
    expect(percentageOf("500000", "18").toFixed(2)).toBe("90000.00");
  });
});

describe("allocate", () => {
  // A repayment schedule that does not sum back to the loan total is a bug
  // that surfaces as a stubborn few-franc balance on the final instalment.
  it("splits evenly when it divides cleanly", () => {
    const parts = allocate("900", 3);
    expect(parts.map((p) => p.toFixed(2))).toEqual(["300.00", "300.00", "300.00"]);
  });

  it("distributes the remainder without losing a minor unit", () => {
    const parts = allocate("1000", 3);
    expect(parts.map((p) => p.toFixed(2))).toEqual(["333.34", "333.33", "333.33"]);

    const total = parts.reduce((sum, p) => sum.plus(p), new Decimal(0));
    expect(total.toFixed(2)).toBe("1000.00");
  });

  it("always sums back to the original across many shapes", () => {
    const cases: [string, number][] = [
      ["1000", 3],
      ["1000", 7],
      ["500000", 12],
      ["0.05", 3],
      ["123456.78", 11],
      ["1", 3],
    ];

    for (const [total, parts] of cases) {
      const sum = allocate(total, parts).reduce(
        (acc, p) => acc.plus(p),
        new Decimal(0)
      );
      expect(sum.toFixed(2), `${total} into ${parts}`).toBe(quantize(total).toFixed(2));
    }
  });

  it("handles a single instalment", () => {
    expect(allocate("777.77", 1)[0].toFixed(2)).toBe("777.77");
  });

  it("rejects a non-positive part count", () => {
    expect(() => allocate("100", 0)).toThrow(/Cannot split/);
    expect(() => allocate("100", 2.5)).toThrow(/Cannot split/);
  });
});

describe("toMoneyString", () => {
  it("always emits the storage scale so equal values compare equal", () => {
    expect(toMoneyString("1000")).toBe("1000.00");
    expect(toMoneyString("1000.00")).toBe("1000.00");
    expect(toMoneyString(toMoneyString("1000"))).toBe("1000.00");
  });
});

describe("formatMoney", () => {
  it("hides decimals for whole RWF amounts", () => {
    expect(formatMoney("250000")).toBe("RWF 250,000");
  });

  it("shows decimals when the amount has them", () => {
    expect(formatMoney("250000.50")).toBe("RWF 250,000.50");
  });

  it("renders negatives with the sign ahead of the symbol", () => {
    expect(formatMoney("-50000")).toBe("-RWF 50,000");
  });

  it("can omit the symbol and force a leading + for movements", () => {
    expect(formatMoney("1500", { showSymbol: false })).toBe("1,500");
    expect(formatMoney("1500", { signed: true })).toBe("+RWF 1,500");
    expect(formatMoney("0", { signed: true })).toBe("RWF 0");
  });

  it("treats null as zero rather than crashing a dashboard tile", () => {
    expect(formatMoney(null)).toBe("RWF 0");
  });
});

describe("formatMoneyCompact", () => {
  it("abbreviates large amounts for dashboard tiles", () => {
    expect(formatMoneyCompact("1200000")).toBe("RWF 1.2M");
    expect(formatMoneyCompact("250000000")).toBe("RWF 250M");
    expect(formatMoneyCompact("45000")).toBe("RWF 45.0K");
    expect(formatMoneyCompact("900")).toBe("RWF 900");
  });
});

describe("parseMoneyInput", () => {
  it("accepts a valid amount", () => {
    const result = parseMoneyInput("50,000");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.toFixed(2)).toBe("50000.00");
  });

  it("rejects empty, negative and zero amounts", () => {
    expect(parseMoneyInput("")).toMatchObject({ ok: false });
    expect(parseMoneyInput("-100")).toMatchObject({ ok: false });
    expect(parseMoneyInput("0")).toMatchObject({ ok: false });
    expect(parseMoneyInput("0", { allowZero: true })).toMatchObject({ ok: true });
  });

  it("rejects sub-minor-unit precision", () => {
    const result = parseMoneyInput("100.001");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/decimal places/);
  });

  it("enforces configured bounds", () => {
    expect(parseMoneyInput("50", { min: "100" })).toMatchObject({ ok: false });
    expect(parseMoneyInput("5000", { max: "1000" })).toMatchObject({ ok: false });
    expect(parseMoneyInput("500", { min: "100", max: "1000" })).toMatchObject({
      ok: true,
    });
  });

  it("rejects junk", () => {
    expect(parseMoneyInput("abc")).toMatchObject({ ok: false });
  });
});

describe("comparison", () => {
  it("compares at the storage scale, ignoring trailing zeros", () => {
    expect(equals("1000", "1000.00")).toBe(true);
    expect(gt("1000.01", "1000")).toBe(true);
    expect(gt("1000", "1000")).toBe(false);
  });
});
