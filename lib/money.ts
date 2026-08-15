import Decimal from "decimal.js";

/**
 * Money primitives.
 *
 * This module is deliberately runtime-agnostic — it is imported by both server
 * services and client components, so it must not touch `server-only`, Prisma
 * or the environment.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: monetary values are never JavaScript
 * numbers. `0.1 + 0.2 === 0.30000000000000004` is a rounding error in a chart
 * label and a regulatory problem in a member's balance. Every amount crossing
 * this system is a decimal string or a Decimal instance, end to end:
 *
 *   Postgres NUMERIC(18,2) → Prisma.Decimal → string over JSON → Decimal in UI
 *
 * The string hop matters: JSON has no decimal type, so serialising a Decimal
 * as a number would silently reintroduce binary floating point at the API
 * boundary and undo the whole exercise.
 */

// 2dp covers RWF (which is quoted whole) and any future subunit currency,
// matching the NUMERIC(18,2) columns exactly.
export const MONEY_SCALE = 2;

// Half-up is the convention people expect and audit against: 0.5 rounds away
// from zero. decimal.js defaults to half-even (banker's rounding), which would
// disagree with hand-checked figures on a statement.
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };
export type Money = Decimal;

/** Anything this module will accept as an amount. */
export type MoneyInput = Decimal | string | number | { toString(): string };

export const ZERO = new Decimal(0);

/**
 * Coerces a value to a Decimal.
 *
 * Raw `number` inputs are accepted only when they are safe integers. A
 * non-integer number has already lost precision before this function ever saw
 * it, so accepting it would launder a bug into a balance. Callers with decimal
 * input should pass a string.
 */
export function toMoney(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;

  if (value instanceof Decimal) return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Invalid monetary value: ${value}`);
    }
    if (!Number.isInteger(value)) {
      throw new TypeError(
        `Refusing to convert the non-integer number ${value} to money — ` +
          `it may already have lost precision. Pass a string instead.`
      );
    }
    return new Decimal(value);
  }

  const raw = typeof value === "string" ? value : value.toString();
  const normalised = raw.trim().replace(/,/g, "");

  if (normalised === "") return ZERO;

  let decimal: Decimal;
  try {
    decimal = new Decimal(normalised);
  } catch {
    throw new TypeError(`Invalid monetary value: ${JSON.stringify(raw)}`);
  }

  if (!decimal.isFinite()) {
    throw new TypeError(`Invalid monetary value: ${JSON.stringify(raw)}`);
  }

  return decimal;
}

/** Rounds to the storage scale. Apply before persisting or comparing. */
export function quantize(value: MoneyInput): Decimal {
  return toMoney(value).toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_HALF_UP);
}

/**
 * Canonical string form for persistence and API responses — always exactly
 * two decimal places, so "1000" and "1000.00" can never compare unequal.
 */
export function toMoneyString(value: MoneyInput): string {
  return quantize(value).toFixed(MONEY_SCALE);
}

// Arithmetic ----------------------------------------------------------------
// All results are quantized, so a chain of operations cannot accumulate
// sub-cent dust that later fails a balance assertion.

export function add(...values: MoneyInput[]): Decimal {
  return quantize(
    values.reduce<Decimal>((sum, v) => sum.plus(toMoney(v)), ZERO)
  );
}

export function subtract(a: MoneyInput, b: MoneyInput): Decimal {
  return quantize(toMoney(a).minus(toMoney(b)));
}

export function multiply(a: MoneyInput, factor: MoneyInput): Decimal {
  return quantize(toMoney(a).times(toMoney(factor)));
}

export function divide(a: MoneyInput, divisor: MoneyInput): Decimal {
  const d = toMoney(divisor);
  if (d.isZero()) throw new RangeError("Division by zero in monetary calculation");
  return quantize(toMoney(a).dividedBy(d));
}

/** `percent` is a whole percentage: percentageOf(1000, 2.5) → 25.00 */
export function percentageOf(value: MoneyInput, percent: MoneyInput): Decimal {
  return quantize(toMoney(value).times(toMoney(percent)).dividedBy(100));
}

export function negate(value: MoneyInput): Decimal {
  return quantize(toMoney(value).negated());
}

export function abs(value: MoneyInput): Decimal {
  return quantize(toMoney(value).abs());
}

export function min(...values: MoneyInput[]): Decimal {
  return values.map(toMoney).reduce((a, b) => (a.lessThan(b) ? a : b));
}

export function max(...values: MoneyInput[]): Decimal {
  return values.map(toMoney).reduce((a, b) => (a.greaterThan(b) ? a : b));
}

// Comparison ----------------------------------------------------------------

export const isZero = (v: MoneyInput) => quantize(v).isZero();
export const isPositive = (v: MoneyInput) => quantize(v).greaterThan(0);
export const isNegative = (v: MoneyInput) => quantize(v).lessThan(0);
export const equals = (a: MoneyInput, b: MoneyInput) => quantize(a).equals(quantize(b));
export const gt = (a: MoneyInput, b: MoneyInput) => quantize(a).greaterThan(quantize(b));
export const gte = (a: MoneyInput, b: MoneyInput) => quantize(a).greaterThanOrEqualTo(quantize(b));
export const lt = (a: MoneyInput, b: MoneyInput) => quantize(a).lessThan(quantize(b));
export const lte = (a: MoneyInput, b: MoneyInput) => quantize(a).lessThanOrEqualTo(quantize(b));

/**
 * Splits an amount into `parts` instalments that sum back to exactly the
 * original.
 *
 * Naively dividing 1000 by 3 gives 333.33 × 3 = 999.99 and loses a cent. The
 * remainder is instead distributed one minor unit at a time across the earliest
 * instalments, which is what a repayment schedule has to do for the final
 * balance to land on zero.
 */
export function allocate(total: MoneyInput, parts: number): Decimal[] {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new RangeError(`Cannot split money into ${parts} parts`);
  }

  const amount = quantize(total);
  const unit = new Decimal(10).pow(-MONEY_SCALE);

  const base = amount
    .dividedBy(parts)
    .toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_DOWN);

  const distributed = base.times(parts);
  // Number of minor units still unallocated after the even split.
  let remainder = amount.minus(distributed).dividedBy(unit).toNumber();
  remainder = Math.round(remainder);

  const result: Decimal[] = [];
  for (let i = 0; i < parts; i++) {
    const extra = i < Math.abs(remainder) ? unit.times(Math.sign(remainder)) : ZERO;
    result.push(quantize(base.plus(extra)));
  }

  return result;
}

// Formatting ----------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<string, string> = {
  RWF: "RWF",
  KES: "KSh",
  UGX: "USh",
  TZS: "TSh",
  USD: "$",
  EUR: "€",
};

/**
 * Display formatter, e.g. formatMoney("250000") → "RWF 250,000".
 *
 * RWF is conventionally quoted without decimals, so the fractional part is
 * hidden when it is zero. This is presentation only — the underlying value
 * always keeps its full scale.
 */
export function formatMoney(
  value: MoneyInput | null | undefined,
  options: {
    currency?: string;
    showSymbol?: boolean;
    decimals?: number;
    signed?: boolean;
  } = {}
): string {
  const {
    currency = "RWF",
    showSymbol = true,
    signed = false,
  } = options;

  const amount = quantize(value ?? 0);
  const decimals =
    options.decimals ??
    (currency === "RWF" && amount.modulo(1).isZero() ? 0 : MONEY_SCALE);

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(amount.abs().toFixed(decimals)));

  const sign = amount.isNegative() ? "-" : signed && !amount.isZero() ? "+" : "";
  const symbol = showSymbol ? `${CURRENCY_SYMBOLS[currency] ?? currency} ` : "";

  return `${sign}${symbol}${formatted}`;
}

/** Compact form for dashboard tiles, e.g. "RWF 1.2M". */
export function formatMoneyCompact(
  value: MoneyInput | null | undefined,
  currency = "RWF"
): string {
  const amount = quantize(value ?? 0);
  const absolute = amount.abs();
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const sign = amount.isNegative() ? "-" : "";

  const tiers: [Decimal, string][] = [
    [new Decimal(1_000_000_000), "B"],
    [new Decimal(1_000_000), "M"],
    [new Decimal(1_000), "K"],
  ];

  for (const [threshold, suffix] of tiers) {
    if (absolute.greaterThanOrEqualTo(threshold)) {
      const scaled = absolute.dividedBy(threshold);
      // One decimal below 100 (1.2M), none above (250M) — keeps tile widths
      // stable regardless of magnitude.
      const digits = scaled.lessThan(100) ? 1 : 0;
      return `${sign}${symbol} ${scaled.toFixed(digits)}${suffix}`;
    }
  }

  return formatMoney(amount, { currency });
}

/**
 * Parses user form input into a validated amount.
 * Returns a discriminated result rather than throwing, so a form can render
 * the message inline.
 */
export function parseMoneyInput(
  input: string,
  options: { min?: MoneyInput; max?: MoneyInput; allowZero?: boolean } = {}
): { ok: true; value: Decimal } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (trimmed === "") return { ok: false, error: "Enter an amount" };

  let value: Decimal;
  try {
    value = toMoney(trimmed);
  } catch {
    return { ok: false, error: "Enter a valid amount" };
  }

  if (value.isNegative()) {
    return { ok: false, error: "Amount cannot be negative" };
  }
  if (!options.allowZero && value.isZero()) {
    return { ok: false, error: "Amount must be greater than zero" };
  }
  if (value.decimalPlaces() > MONEY_SCALE) {
    return {
      ok: false,
      error: `Amount cannot have more than ${MONEY_SCALE} decimal places`,
    };
  }
  if (options.min !== undefined && lt(value, options.min)) {
    return { ok: false, error: `Minimum is ${formatMoney(options.min)}` };
  }
  if (options.max !== undefined && gt(value, options.max)) {
    return { ok: false, error: `Maximum is ${formatMoney(options.max)}` };
  }

  return { ok: true, value: quantize(value) };
}
