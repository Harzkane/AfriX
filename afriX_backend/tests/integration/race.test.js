/**
 * tests/integration/race.test.js
 *
 * Race-condition integration tests for the three scenarios flagged by the
 * security reviewer:
 *   1. Concurrent mint-confirm (double-mint prevention via FOR UPDATE)
 *   2. Concurrent P2P transfer (balance never goes negative under concurrency)
 *   3. Merchant collection refund (net+fee reverse is atomic and correct)
 *
 * Prerequisites:
 *   - TEST_DATABASE_URL env var pointing at a Postgres test database.
 */
"use strict";

const testDbUrl =
  process.env.TEST_DATABASE_URL ||
  (process.env.RUN_INTEGRATION_TESTS === "true" ? process.env.DATABASE_URL : null);

const SKIP = !testDbUrl;

const { sequelize } = SKIP ? { sequelize: null } : require("../../src/config/database");
const models = SKIP ? {} : require("../../src/models");
const transactionService = SKIP ? {} : require("../../src/services/transactionService");
const Money = SKIP ? {} : require("../../src/utils/money");
const { TRANSACTION_STATUS, MINT_REQUEST_STATUS } = SKIP
  ? {}
  : require("../../src/config/constants");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function seedUser(suffix = "") {
  return models.User.create({
    email: `race-test-${Date.now()}${suffix}@test.invalid`,
    password_hash: "$2b$10$dummyhash",
    full_name: `Race Test ${suffix}`,
    role: "user",
    is_active: true,
    is_verified: true,
  });
}

async function seedWallet(userId, tokenType, balance) {
  return models.Wallet.create({
    user_id: userId,
    token_type: tokenType,
    balance: String(balance),
    blockchain_address: `0x${userId.replace(/-/g, "").slice(0, 40)}`,
    encrypted_private_key: "gcm:deadbeef:deadbeef:deadbeef",
  });
}

async function seedAgent(userId) {
  return models.Agent.create({
    user_id: userId,
    status: "active",
    tier: "standard",
    commission_rate: "0.01",
    available_capacity: "1000.00",
    total_minted: "0",
    total_earnings: "0",
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
(SKIP ? describe.skip : describe)("Race-condition integration tests", () => {
  jest.setTimeout(30_000);

  afterAll(async () => {
    if (sequelize) await sequelize.close();
  });

  // 1. Concurrent mint-confirm
  describe("confirmMint — double-mint prevention", () => {
    let user, agent, mintRequest;

    beforeAll(async () => {
      user = await seedUser("mint-u");
      const agentUser = await seedUser("mint-a");
      agent = await seedAgent(agentUser.id);
      await seedWallet(agentUser.id, "NT", 500);
      mintRequest = await models.MintRequest.create({
        user_id: user.id,
        agent_id: agent.id,
        amount: "100",
        token_type: "NT",
        status: MINT_REQUEST_STATUS.APPROVED,
      });
    });

    afterAll(async () => {
      await models.Transaction.destroy({ where: { to_user_id: user.id } });
      await models.MintRequest.destroy({ where: { id: mintRequest.id } });
      await models.Wallet.destroy({ where: { user_id: [user.id, agent.user_id] } });
      await models.Agent.destroy({ where: { id: agent.id } });
      await models.User.destroy({ where: { id: [user.id, agent.user_id] } });
    });

    test("only one of 5 concurrent mint-confirms succeeds", async () => {
      const attempt = () =>
        sequelize.transaction(async (t) => {
          const req = await models.MintRequest.findByPk(mintRequest.id, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (!req || req.status !== MINT_REQUEST_STATUS.APPROVED) {
            throw new Error("already processed");
          }
          req.status = MINT_REQUEST_STATUS.PROCESSING;
          await req.save({ transaction: t });
          await transactionService.processAgentMint(user.id, agent.id, "100", "NT", {}, t);
          req.status = MINT_REQUEST_STATUS.COMPLETED;
          await req.save({ transaction: t });
        });

      const results = await Promise.allSettled([
        attempt(), attempt(), attempt(), attempt(), attempt(),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      expect(fulfilled).toHaveLength(1);

      const wallet = await models.Wallet.findOne({ where: { user_id: user.id, token_type: "NT" } });
      expect(Number(wallet.balance)).toBeGreaterThan(0);
      expect(Number(wallet.balance)).toBeLessThanOrEqual(100);
    });
  });

  // 2. Concurrent P2P transfer
  describe("processUserTransfer — balance integrity under concurrency", () => {
    let sender, receiver;

    beforeAll(async () => {
      sender = await seedUser("xfr-s");
      receiver = await seedUser("xfr-r");
      await seedWallet(sender.id, "NT", 100);
      await seedWallet(receiver.id, "NT", 0);
    });

    afterAll(async () => {
      await models.Transaction.destroy({ where: { from_user_id: sender.id } });
      await models.Wallet.destroy({ where: { user_id: [sender.id, receiver.id] } });
      await models.User.destroy({ where: { id: [sender.id, receiver.id] } });
    });

    test("10 concurrent transfers of 15 tokens from a 100-token wallet", async () => {
      const transfers = Array.from({ length: 10 }, () =>
        transactionService.processUserTransfer(sender.id, receiver.id, "15", "NT", "race test")
      );
      const results = await Promise.allSettled(transfers);

      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      expect(succeeded).toBeGreaterThanOrEqual(1);

      const senderWallet = await models.Wallet.findOne({ where: { user_id: sender.id, token_type: "NT" } });
      const receiverWallet = await models.Wallet.findOne({ where: { user_id: receiver.id, token_type: "NT" } });

      // Tokens are conserved — no money created or lost
      const total = Money.add(senderWallet.balance, receiverWallet.balance);
      expect(total).toBe(100);
      expect(Number(senderWallet.balance)).toBeGreaterThanOrEqual(0);
    });
  });

  // 3. Merchant collection refund
  describe("Merchant collection refund — net + fee reversal", () => {
    let buyer, merchantUser, buyerWallet, merchantWallet, merchant, collection;
    const GROSS = 100, FEE = 2, NET = 98;

    beforeAll(async () => {
      buyer = await seedUser("ref-b");
      merchantUser = await seedUser("ref-m");
      buyerWallet = await seedWallet(buyer.id, "NT", 0);
      merchantWallet = await seedWallet(merchantUser.id, "NT", NET);
      merchant = await models.Merchant.create({
        user_id: merchantUser.id,
        business_name: "Race Test Merchant",
        settlement_wallet_id: merchantWallet.id,
        payment_fee_percent: "2.00",
        status: "active",
      });
      collection = await models.Transaction.create({
        reference: `RACE-REF-${Date.now()}`,
        type: "collection",
        status: TRANSACTION_STATUS.COMPLETED,
        amount: String(GROSS),
        fee: String(FEE),
        token_type: "NT",
        from_user_id: buyer.id,
        to_user_id: merchantUser.id,
        merchant_id: merchant.id,
        from_wallet_id: buyerWallet.id,
        to_wallet_id: merchantWallet.id,
      });
    });

    afterAll(async () => {
      await models.Transaction.destroy({ where: { id: collection.id } });
      await models.Merchant.destroy({ where: { id: merchant.id } });
      await models.Wallet.destroy({ where: { user_id: [buyer.id, merchantUser.id] } });
      await models.User.destroy({ where: { id: [buyer.id, merchantUser.id] } });
    });

    test("refund credits buyer GROSS and debits merchant NET only", async () => {
      await transactionService.refundTransaction(collection.id);
      const updatedBuyer = await models.Wallet.findByPk(buyerWallet.id);
      const updatedMerchant = await models.Wallet.findByPk(merchantWallet.id);
      const updatedTx = await models.Transaction.findByPk(collection.id);

      expect(Number(updatedBuyer.balance)).toBe(GROSS);
      expect(Number(updatedMerchant.balance)).toBe(0);
      expect(updatedTx.status).toBe(TRANSACTION_STATUS.REFUNDED);
    });

    test("a second refund on the same transaction is rejected", async () => {
      await expect(transactionService.refundTransaction(collection.id)).rejects.toThrow();
    });
  });
});
