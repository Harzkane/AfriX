"use strict";

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
  try {
    await queryInterface.addColumn(tableName, columnName, definition);
  } catch (e) {
    const msg = (e && (e.message || e.original?.message || "")) || "";
    if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
  }
}

async function removeColumnIfExists(queryInterface, tableName, columnName) {
  try {
    await queryInterface.removeColumn(tableName, columnName);
  } catch (e) {
    const msg = (e && (e.message || e.original?.message || "")) || "";
    if (!msg.includes("does not exist") && !msg.includes("Unknown column")) throw e;
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await addColumnIfMissing(queryInterface, "mint_requests", "rejection_reason", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Reason provided by the agent when rejecting the mint request",
    });

    await addColumnIfMissing(queryInterface, "burn_requests", "rejection_reason", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Reason provided by the agent when rejecting the burn request",
    });
  },

  down: async (queryInterface) => {
    await removeColumnIfExists(queryInterface, "mint_requests", "rejection_reason");
    await removeColumnIfExists(queryInterface, "burn_requests", "rejection_reason");
  },
};
