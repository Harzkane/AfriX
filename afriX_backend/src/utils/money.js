// src/utils/money.js
const Decimal = require("decimal.js");

// Set precision for currency calculations (standard 20 digits, standard rounding)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * High precision monetary math helper to prevent JavaScript IEEE 754 floating point rounding drift.
 */
const Money = {
  /**
   * Parse value to Decimal safely
   */
  toDecimal(val) {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return new Decimal(0);
    }
    return new Decimal(String(val));
  },

  /**
   * Add multiple amounts safely
   */
  add(...vals) {
    return vals
      .reduce((acc, val) => acc.plus(Money.toDecimal(val)), new Decimal(0))
      .toNumber();
  },

  /**
   * Subtract b from a safely: a - b
   */
  sub(a, b) {
    return Money.toDecimal(a).minus(Money.toDecimal(b)).toNumber();
  },

  /**
   * Multiply safely: a * b
   */
  mul(a, b) {
    return Money.toDecimal(a).times(Money.toDecimal(b)).toNumber();
  },

  /**
   * Divide safely: a / b
   */
  div(a, b) {
    const divisor = Money.toDecimal(b);
    if (divisor.isZero()) {
      throw new Error("Division by zero in Money.div");
    }
    return Money.toDecimal(a).dividedBy(divisor).toNumber();
  },

  /**
   * Add multiple amounts safely and format as exact decimal string
   */
  addStr(...vals) {
    return vals
      .reduce((acc, val) => acc.plus(Money.toDecimal(val)), new Decimal(0))
      .toFixed(8);
  },

  /**
   * Subtract b from a safely as exact decimal string
   */
  subStr(a, b, decimals = 8) {
    return Money.toDecimal(a).minus(Money.toDecimal(b)).toFixed(decimals);
  },

  /**
   * Multiply safely as exact decimal string
   */
  mulStr(a, b, decimals = 8) {
    return Money.toDecimal(a).times(Money.toDecimal(b)).toFixed(decimals);
  },

  /**
   * Format any monetary value as exact decimal string for DB storage
   */
  toDecimalString(val, decimals = 8) {
    return Money.toDecimal(val).toFixed(decimals);
  },

  /**
   * Round to decimal places as string (default 2 for fiat/tokens, or 6/8 for crypto)
   */
  toFixed(val, decimals = 2) {
    return Money.toDecimal(val).toFixed(decimals);
  },

  /**
   * Compare two values (returns true if a >= b)
   */
  gte(a, b) {
    return Money.toDecimal(a).greaterThanOrEqualTo(Money.toDecimal(b));
  },

  /**
   * Compare two values (returns true if a < b)
   */
  lt(a, b) {
    return Money.toDecimal(a).lessThan(Money.toDecimal(b));
  },

  /**
   * Compare two values (returns true if a == b)
   */
  eq(a, b) {
    return Money.toDecimal(a).equals(Money.toDecimal(b));
  },
};

module.exports = Money;
