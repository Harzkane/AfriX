"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create portfolio_snapshots table
    await queryInterface.createTable("portfolio_snapshots", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      total_value_nt: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0,
      },
      total_value_usd: {
        type: Sequelize.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes for efficient queries
    await queryInterface.addIndex("portfolio_snapshots", ["user_id"]);
    await queryInterface.addIndex("portfolio_snapshots", ["created_at"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("portfolio_snapshots");
  },
};
