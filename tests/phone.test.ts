import { describe, expect, it } from "vitest";
import {
  formatPhone,
  isValidRwandanPhone,
  normalisePhone,
  phoneMatchKey,
  toLocalPhone,
} from "@/lib/phone";

/**
 * Phone normalisation matters beyond tidiness: the number is a fallback
 * payment-matching key. If "0788123456" and "+250788123456" are stored as
 * different values, a payment from that member fails to match and lands in the
 * unmatched queue for an administrator to resolve by hand.
 */
describe("normalisePhone", () => {
  it("normalises every common local format to the same E.164 value", () => {
    const expected = "+250788123456";
    for (const input of [
      "0788123456",
      "788123456",
      "250788123456",
      "+250788123456",
      "+250 788 123 456",
      "0788 123 456",
      "(0788) 123-456",
      "  0788123456  ",
    ]) {
      expect(normalisePhone(input), input).toBe(expected);
    }
  });

  it("accepts all Rwandan mobile prefixes", () => {
    expect(normalisePhone("0788123456")).toBe("+250788123456");
    expect(normalisePhone("0798123456")).toBe("+250798123456");
    expect(normalisePhone("0728123456")).toBe("+250728123456");
    expect(normalisePhone("0738123456")).toBe("+250738123456");
  });

  it("rejects numbers of the wrong length", () => {
    expect(normalisePhone("078812345")).toBeNull();
    expect(normalisePhone("07881234567")).toBeNull();
  });

  it("rejects non-mobile prefixes", () => {
    expect(normalisePhone("0700123456")).toBeNull();
    expect(normalisePhone("0250123456")).toBeNull();
  });

  it("handles empty input", () => {
    expect(normalisePhone(null)).toBeNull();
    expect(normalisePhone("")).toBeNull();
    expect(normalisePhone("   ")).toBeNull();
    expect(normalisePhone("abc")).toBeNull();
  });
});

describe("isValidRwandanPhone", () => {
  it("agrees with normalisePhone", () => {
    expect(isValidRwandanPhone("0788123456")).toBe(true);
    expect(isValidRwandanPhone("0700123456")).toBe(false);
  });
});

describe("formatting", () => {
  it("renders a readable international form", () => {
    expect(formatPhone("+250788123456")).toBe("+250 788 123 456");
    expect(formatPhone("0788123456")).toBe("+250 788 123 456");
  });

  it("renders the local form people recognise", () => {
    expect(toLocalPhone("+250788123456")).toBe("0788123456");
  });

  it("returns the input unchanged when it cannot be parsed", () => {
    expect(formatPhone("not-a-number")).toBe("not-a-number");
  });
});

describe("phoneMatchKey", () => {
  it("produces the same key regardless of stored format", () => {
    const key = "788123456";
    expect(phoneMatchKey("+250788123456")).toBe(key);
    expect(phoneMatchKey("0788123456")).toBe(key);
    expect(phoneMatchKey("250788123456")).toBe(key);
    expect(phoneMatchKey("+250 788 123 456")).toBe(key);
  });

  it("returns null for values too short to be a number", () => {
    expect(phoneMatchKey("12345")).toBeNull();
    expect(phoneMatchKey(null)).toBeNull();
  });
});
