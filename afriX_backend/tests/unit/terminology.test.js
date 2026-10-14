// tests/unit/terminology.test.js
const { TOKEN_TYPES, TRANSACTION_TYPES, TRANSACTION_STATUS } = require("../../src/config/constants");

describe("Platform Constants & Terminology", () => {
  test("defines correct token types", () => {
    expect(TOKEN_TYPES.NT).toBe("NT");
    expect(TOKEN_TYPES.CT).toBe("CT");
    expect(TOKEN_TYPES.USDT).toBe("USDT");
  });

  test("defines core transaction types", () => {
    expect(TRANSACTION_TYPES.MINT).toBe("mint");
    expect(TRANSACTION_TYPES.BURN).toBe("burn");
    expect(TRANSACTION_TYPES.TRANSFER).toBe("transfer");
    expect(TRANSACTION_TYPES.COLLECTION).toBe("collection");
  });

  test("defines required transaction statuses", () => {
    expect(TRANSACTION_STATUS.PENDING).toBe("pending");
    expect(TRANSACTION_STATUS.COMPLETED).toBe("completed");
    expect(TRANSACTION_STATUS.REFUNDED).toBe("refunded");
  });
});
