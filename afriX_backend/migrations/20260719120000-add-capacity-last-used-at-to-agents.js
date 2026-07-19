'use strict';

/**
 * Migration: Add capacity_last_used_at to agents table
 * -------------------------------------------------------------
 * Context:
 *   To support time-weighted fairness sorting (routing users to agents who
 *   have been waiting longest), we need a timestamp to track when an agent's
 *   collateral capacity was last drawn down.
 *
 * What this does:
 *   Adds `capacity_last_used_at` (DATETIME, NULLABLE) to the `agents` table.
 *   Brand new agents will start with NULL, putting them first in the queue.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('agents', 'capacity_last_used_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when agent capacity was last drawn down (last successful transaction >= $10)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('agents', 'capacity_last_used_at');
  }
};
