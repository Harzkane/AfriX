"use strict";

/**
 * Adds fields used by the user-facing agent list (Phase 1–2 of Agent Selection updates).
 * Run this only if your agents table does not already have these columns
 * (e.g. if you created agents from a schema that didn’t include them).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = "agents";

    try {
      await queryInterface.addColumn(table, "city", {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    } catch (e) {
      const msg = (e && (e.message || e.original?.message || "")) || "";
      if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
    }

    try {
      await queryInterface.addColumn(table, "is_online", {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      });
    } catch (e) {
      const msg = (e && (e.message || e.original?.message || "")) || "";
      if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
    }

    try {
      await queryInterface.addColumn(table, "max_transaction_limit", {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
    } catch (e) {
      const msg = (e && (e.message || e.original?.message || "")) || "";
      if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
    }

    try {
      await queryInterface.addColumn(table, "daily_transaction_limit", {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      });
    } catch (e) {
      const msg = (e && (e.message || e.original?.message || "")) || "";
      if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = "agents";
    await queryInterface.removeColumn(table, "city");
    await queryInterface.removeColumn(table, "is_online");
    await queryInterface.removeColumn(table, "max_transaction_limit");
    await queryInterface.removeColumn(table, "daily_transaction_limit");
  },
};
