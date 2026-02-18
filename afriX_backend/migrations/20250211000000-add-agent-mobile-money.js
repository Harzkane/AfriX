"use strict";

/**
 * XOF agents: add mobile money payment option (Orange Money, Wave, Kiren Money, etc.)
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = "agents";

    try {
      await queryInterface.addColumn(table, "mobile_money_provider", {
        type: Sequelize.STRING(80),
        allowNull: true,
        comment: "e.g. Orange Money, Wave, Kiren Money (XOF countries)",
      });
    } catch (e) {
      const msg = (e && (e.message || e.original?.message || "")) || "";
      if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
    }

    try {
      await queryInterface.addColumn(table, "mobile_money_number", {
        type: Sequelize.STRING(30),
        allowNull: true,
        comment: "Phone number for mobile money receive/send",
      });
    } catch (e) {
      const msg = (e && (e.message || e.original?.message || "")) || "";
      if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
    }
  },

  down: async (queryInterface) => {
    const table = "agents";
    await queryInterface.removeColumn(table, "mobile_money_provider");
    await queryInterface.removeColumn(table, "mobile_money_number");
  },
};
