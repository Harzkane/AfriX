// Migration: add fee_wallet_id to transactions
// Platform fee collection - wallet that received the fee

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent: skip if column/index already exists (e.g. after partial run)
    await queryInterface.sequelize.query(`
      ALTER TABLE "transactions"
      ADD COLUMN IF NOT EXISTS "fee_wallet_id" UUID
      REFERENCES "wallets"("id") ON UPDATE CASCADE ON DELETE SET NULL
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "transactions_fee_wallet_id_idx"
      ON "transactions" ("fee_wallet_id")
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("transactions", "transactions_fee_wallet_id_idx");
    await queryInterface.removeColumn("transactions", "fee_wallet_id");
  },
};
