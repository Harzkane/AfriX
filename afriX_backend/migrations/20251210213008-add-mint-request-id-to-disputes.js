"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn("disputes", "mint_request_id", {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "Linked mint request under dispute (optional)",
      });
    } catch (e) {
      const msg = (e && (e.message || e.original?.message || "")) || "";
      if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("disputes", "mint_request_id");
  },
};
