'use strict';

/**
 * Migration: Backfill max_transaction_limit for existing agents
 * -------------------------------------------------------------
 * Context:
 *   Previously, max_transaction_limit was never set automatically on agent
 *   registration or deposit. This left all existing agents with NULL, meaning
 *   the per-transaction cap added in Gap 3 of the mint/burn fix would not apply
 *   to them (the check is guarded by `!= null`).
 *
 * What this does:
 *   Sets max_transaction_limit = deposit_usd for every agent where
 *   max_transaction_limit IS NULL and deposit_usd > 0.
 *
 *   Agents with deposit_usd = 0 (never deposited / still pending) are left
 *   as NULL — they should not be active anyway and will pick up their limit
 *   on their first deposit via the updated agentService.
 *
 * Safe to run on production:
 *   - Wrapped in a transaction (atomic — all or nothing).
 *   - Only touches rows with NULL max_transaction_limit.
 *   - down() reversal NULLs only those same rows.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `UPDATE agents
         SET    max_transaction_limit = deposit_usd,
                updated_at            = NOW()
         WHERE  max_transaction_limit IS NULL
           AND  deposit_usd           > 0`,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Reversal: NULL out the limit only for agents whose limit equals their
    // deposit_usd — i.e., the ones this migration set. Agents that already
    // had a custom limit before this migration are left untouched.
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `UPDATE agents
         SET    max_transaction_limit = NULL,
                updated_at            = NOW()
         WHERE  max_transaction_limit = deposit_usd`,
        { transaction: t }
      );
    });
  },
};
