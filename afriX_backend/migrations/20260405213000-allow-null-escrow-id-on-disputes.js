// npm run migrate
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("disputes", "escrow_id", {
      type: Sequelize.UUID,
      allowNull: true,
      comment: "Linked escrow under dispute (optional)",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("disputes", "escrow_id", {
      type: Sequelize.UUID,
      allowNull: false,
      comment: "Linked escrow under dispute",
    });
  },
};
