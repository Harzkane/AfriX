"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("disputes", "mint_request_id", {
      type: Sequelize.UUID,
      allowNull: true,
      comment: "Linked mint request under dispute (optional)",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("disputes", "mint_request_id");
  },
};
