// tests/unit/money.test.js
const Money = require("../../src/utils/money");

describe("Money Utility & Financial Math", () => {
  test("solves IEEE 754 floating point addition drift (0.1 + 0.2)", () => {
    // In native JS: 0.1 + 0.2 === 0.30000000000000004
    expect(0.1 + 0.2).not.toBe(0.3);
    // In Money:
    expect(Money.add(0.1, 0.2)).toBe(0.3);
  });

  test("accurately calculates deductions and fees without rounding errors", () => {
    const gross = 100.05;
    const fee = 1.5;
    const net = Money.sub(gross, fee);
    expect(net).toBe(98.55);
  });

  test("accurately calculates multiplication and rates", () => {
    const amount = 50.25;
    const rate = 1.25;
    expect(Money.mul(amount, rate)).toBe(62.8125);
  });

  test("handles formatting to fixed decimal places", () => {
    expect(Money.toFixed(10.5, 2)).toBe("10.50");
    expect(Money.toFixed(10.555, 2)).toBe("10.56");
  });

  test("correctly evaluates comparisons (gte, lt, eq)", () => {
    expect(Money.gte(100, 50)).toBe(true);
    expect(Money.gte(50, 50)).toBe(true);
    expect(Money.lt(49.99, 50)).toBe(true);
    expect(Money.eq("10.00", 10)).toBe(true);
  });
});
