import { describe, expect, it } from "vitest";
import {
  extractPayerName,
  extractPayerPhone,
  importedTransactionId,
  parseStatementRows,
} from "@/lib/services/statement-import";

/**
 * Bank statement parser tests.
 *
 * The parser is heuristic by necessity — a PDF has no table structure — so
 * these tests pin down the behaviours that matter financially:
 *
 *   • A credit is never read as a debit, or vice versa.
 *   • An amount is never confused with a date, a balance or a reference.
 *   • A row the parser is unsure about is MARKED unsure rather than guessed at,
 *     because the UI leaves low-confidence rows unticked.
 *   • The same statement re-parsed produces the same fingerprints, so a
 *     re-upload is detected as a duplicate instead of double-crediting.
 */

// Shaped like an Equity-style statement: date, description, debit, credit,
// running balance.
const STATEMENT = `
EQUITY BANK RWANDA PLC
STATEMENT OF ACCOUNT
Account Number: 4001234567890
Period: 01/08/2026 to 31/08/2026

Date        Description                          Debit      Credit     Balance
01/08/2026  Balance brought forward                                  1,200,000.00
03/08/2026  MOBILE MONEY RTA-000001 J UWIMANA               60,000.00 1,260,000.00
05/08/2026  MOBILE MONEY RTA-000002 C MUKAMANA              45,000.00 1,305,000.00
07/08/2026  BANK CHARGES                          2,500.00            1,302,500.00
09/08/2026  TRANSFER RTA-000003 REF FT2608001234            75,000.00 1,377,500.00
12/08/2026  CASH DEPOSIT NO REFERENCE                       30,000.00 1,407,500.00
15/08/2026  SALARY PAYMENT STAFF                150,000.00            1,257,500.00
31/08/2026  Closing balance                                          1,257,500.00
`;

describe("parsing a bank statement", () => {
  const result = parseStatementRows(STATEMENT);

  it("reads the account number and period from the header", () => {
    expect(result.detectedAccount).toBe("4001234567890");
    expect(result.detectedPeriod.from).toBe("01/08/2026");
    expect(result.detectedPeriod.to).toBe("31/08/2026");
  });

  it("skips brought-forward and closing balance lines", () => {
    const descriptions = result.rows.map((r) => r.description.toLowerCase());
    expect(descriptions.some((d) => d.includes("brought forward"))).toBe(false);
    expect(descriptions.some((d) => d.includes("closing balance"))).toBe(false);
  });

  it("finds every transaction row", () => {
    expect(result.rows).toHaveLength(6);
  });

  it("distinguishes credits from debits using the running balance", () => {
    const credits = result.rows.filter((r) => r.direction === "CREDIT");
    const debits = result.rows.filter((r) => r.direction === "DEBIT");

    expect(credits).toHaveLength(4);
    expect(debits).toHaveLength(2);

    // Bank charges and the salary payment are money leaving — never a
    // contribution, and never creditable to a member.
    expect(debits.map((d) => d.amount).sort()).toEqual(["150000.00", "2500.00"]);
  });

  it("reads amounts exactly, not the balance and not the date", () => {
    const first = result.rows[0];
    expect(first.amount).toBe("60000.00");
    expect(first.balanceAfter).toBe("1260000.00");
    expect(first.date.toISOString().slice(0, 10)).toBe("2026-08-03");
  });

  it("keeps the member payment reference in the description", () => {
    // This is what the matcher reads to identify the member.
    expect(result.rows[0].description).toContain("RTA-000001");
    expect(result.rows[1].description).toContain("RTA-000002");
  });

  it("extracts the bank's own reference when present", () => {
    const withRef = result.rows.find((r) => r.description.includes("RTA-000003"));
    expect(withRef?.bankReference).toBe("FT2608001234");
  });

  it("marks rows confident when the running balance confirms them", () => {
    const confident = result.rows.filter((r) => r.confidence === "high");
    expect(confident.length).toBeGreaterThanOrEqual(5);
  });

  it("totals credits and debits separately", () => {
    // 60,000 + 45,000 + 75,000 + 30,000
    expect(result.totals.credits).toBe("210000.00");
    // 2,500 + 150,000
    expect(result.totals.debits).toBe("152500.00");
  });
});

describe("date formats", () => {
  it("reads the formats banks actually use", () => {
    const cases: [string, string][] = [
      ["2026-08-14 PAYMENT RTA-000001 50,000.00 100,000.00", "2026-08-14"],
      ["14/08/2026 PAYMENT RTA-000001 50,000.00 100,000.00", "2026-08-14"],
      ["14-08-2026 PAYMENT RTA-000001 50,000.00 100,000.00", "2026-08-14"],
      ["14-Aug-2026 PAYMENT RTA-000001 50,000.00 100,000.00", "2026-08-14"],
      ["14 Aug 2026 PAYMENT RTA-000001 50,000.00 100,000.00", "2026-08-14"],
    ];

    for (const [line, expected] of cases) {
      const parsed = parseStatementRows(line);
      expect(parsed.rows[0]?.date.toISOString().slice(0, 10), line).toBe(expected);
    }
  });

  it("uses UTC so a statement date does not shift by timezone", () => {
    const parsed = parseStatementRows(
      "14/08/2026 PAYMENT RTA-000001 50,000.00 100,000.00"
    );
    const date = parsed.rows[0].date;
    expect(date.getUTCHours()).toBe(0);
    expect(date.toISOString()).toBe("2026-08-14T00:00:00.000Z");
  });
});

describe("amount parsing", () => {
  it("does not mistake a four-digit year for an amount", () => {
    const parsed = parseStatementRows("14/08/2026 CONTRIBUTION 5,000.00 105,000.00");
    expect(parsed.rows[0].amount).toBe("5000.00");
  });

  it("handles amounts with no thousands separator", () => {
    const parsed = parseStatementRows("14/08/2026 CONTRIBUTION 500.00 1500.00");
    expect(parsed.rows[0].amount).toBe("500.00");
  });

  it("reads a parenthesised amount as a debit", () => {
    const parsed = parseStatementRows("14/08/2026 CHARGE (2,500.00)");
    expect(parsed.rows[0].direction).toBe("DEBIT");
    expect(parsed.rows[0].amount).toBe("2500.00");
  });

  it("respects an explicit DR marker", () => {
    const parsed = parseStatementRows("14/08/2026 WITHDRAWAL 10,000.00 DR");
    expect(parsed.rows[0].direction).toBe("DEBIT");
  });
});

describe("uncertainty is surfaced, not hidden", () => {
  it("warns when the running balance disagrees with the amount", () => {
    // Balance moves by 50,000 but the line reads 60,000 — a misread, and the
    // admin must see it rather than have it silently imported.
    const parsed = parseStatementRows(
      [
        "01/08/2026 OPENING 10,000.00 100,000.00",
        "02/08/2026 PAYMENT RTA-000001 60,000.00 150,000.00",
      ].join("\n")
    );

    const suspect = parsed.rows[1];
    expect(suspect.confidence).toBe("low");
    expect(suspect.warnings.join(" ")).toMatch(/balance moved/i);
  });

  it("flags a row with no direction evidence as low confidence", () => {
    const parsed = parseStatementRows("14/08/2026 SOME PAYMENT 50,000.00");
    expect(parsed.rows[0].confidence).toBe("low");
    expect(parsed.rows[0].warnings.length).toBeGreaterThan(0);
  });

  it("reports lines it could not interpret rather than dropping them silently", () => {
    const parsed = parseStatementRows(
      [
        "14/08/2026 GOOD ROW 50,000.00 100,000.00",
        "15/08/2026 ROW WITH NO AMOUNT AT ALL",
      ].join("\n")
    );

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.unparsedLines.join(" ")).toContain("NO AMOUNT");
  });
});

describe("duplicate protection", () => {
  it("produces identical fingerprints when the same statement is re-parsed", () => {
    const first = parseStatementRows(STATEMENT);
    const second = parseStatementRows(STATEMENT);

    expect(first.rows.map((r) => r.fingerprint)).toEqual(
      second.rows.map((r) => r.fingerprint)
    );
  });

  it("gives different fingerprints to same-day, same-amount payments", () => {
    // Two genuine payments that differ only by running balance. If they shared
    // a fingerprint the second would be rejected as a duplicate and a member
    // would never be credited.
    const parsed = parseStatementRows(
      [
        "14/08/2026 CONTRIBUTION RTA-000001 50,000.00 150,000.00",
        "14/08/2026 CONTRIBUTION RTA-000001 50,000.00 200,000.00",
      ].join("\n")
    );

    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].fingerprint).not.toBe(parsed.rows[1].fingerprint);
  });

  it("prefers the bank reference for the transaction id when available", () => {
    const parsed = parseStatementRows(
      "14/08/2026 TRANSFER REF FT2608009999 50,000.00 150,000.00"
    );

    expect(importedTransactionId(parsed.rows[0])).toBe("PDF-REF:FT2608009999");
  });

  it("falls back to a content fingerprint with no bank reference", () => {
    const parsed = parseStatementRows(
      "14/08/2026 CASH DEPOSIT 50,000.00 150,000.00"
    );

    expect(importedTransactionId(parsed.rows[0])).toMatch(/^PDF-FP:[a-f0-9]{32}$/);
  });
});

describe("row identity is unique within a statement", () => {
  // No running balance column, and two identical contributions on the same
  // day. Before disambiguation these produced one fingerprint for both rows:
  // duplicate React keys, one tick selecting both, and only the first payment
  // ever written.
  const NO_BALANCE_COLUMN = `
Date        Description                    Credit
04/08/2026  MOBILE MONEY DEPOSIT           25,000.00
04/08/2026  MOBILE MONEY DEPOSIT           25,000.00
05/08/2026  MOBILE MONEY DEPOSIT           25,000.00
`;

  it("gives every row a distinct fingerprint", () => {
    const { rows } = parseStatementRows(NO_BALANCE_COLUMN);
    const fingerprints = rows.map((r) => r.fingerprint);

    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
  });

  it("gives every row a distinct imported transaction id", () => {
    const { rows } = parseStatementRows(NO_BALANCE_COLUMN);
    const ids = rows.map(importedTransactionId);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("numbers repeats and warns about them", () => {
    const { rows } = parseStatementRows(NO_BALANCE_COLUMN);
    const repeat = rows.find((r) => r.occurrence > 1);

    expect(repeat).toBeDefined();
    expect(repeat!.warnings.join(" ")).toMatch(/identical to an earlier one/i);
  });

  it("stays deterministic across re-parses, so re-uploads still deduplicate", () => {
    const first = parseStatementRows(NO_BALANCE_COLUMN).rows.map(importedTransactionId);
    const second = parseStatementRows(NO_BALANCE_COLUMN).rows.map(importedTransactionId);

    expect(second).toEqual(first);
  });

  it("does not collapse two entries that reuse one bank reference", () => {
    const REUSED_REFERENCE = `
Date        Description                              Credit     Balance
04/08/2026  TRANSFER REF FT2608001234    10,000.00  510,000.00
05/08/2026  TRANSFER REF FT2608001234    20,000.00  530,000.00
`;
    const { rows } = parseStatementRows(REUSED_REFERENCE);
    const ids = rows.map(importedTransactionId);

    expect(rows.length).toBe(2);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("sender details are read out of the narration", () => {
  it("reads a name after an explicit sender marker", () => {
    expect(extractPayerName("MOBILE MONEY DEPOSIT FROM UWIMANA JEAN")).toBe(
      "UWIMANA JEAN"
    );
    expect(extractPayerName("TRANSFER BY/MUKAMANA ALICE/")).toBe("MUKAMANA ALICE");
  });

  it("falls back to the longest run of name-like words", () => {
    expect(extractPayerName("MOMO NDAYISABA PAUL DEPOSIT")).toBe("NDAYISABA PAUL");
  });

  it("refuses a single word, which is too weak to identify anyone", () => {
    expect(extractPayerName("CASH DEPOSIT UWIMANA")).toBeNull();
  });

  it("returns null when the narration carries no name at all", () => {
    expect(extractPayerName("BANK CHARGES")).toBeNull();
    expect(extractPayerName("")).toBeNull();
  });

  it("reads the sender's mobile number in any common format", () => {
    expect(extractPayerPhone("MOMO DEPOSIT 0788123456 UWIMANA")).toBe("+250788123456");
    expect(extractPayerPhone("DEPOSIT +250 788 123 456")).toBe("+250788123456");
    expect(extractPayerPhone("DEPOSIT 250788123456")).toBe("+250788123456");
  });

  it("does not mistake an account number or a date for a phone number", () => {
    expect(extractPayerPhone("ACCOUNT 4001234567890 TRANSFER")).toBeNull();
    expect(extractPayerPhone("04/08/2026 BANK CHARGES 2,500.00")).toBeNull();
  });
});
