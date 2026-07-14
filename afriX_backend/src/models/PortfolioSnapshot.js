// File: src/models/PortfolioSnapshot.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * PortfolioSnapshot Model
 *
 * Tracks a user's total portfolio value over time (in both NT and USD).
 * Used to draw historical value trend lines and calculate percentages.
 */
const PortfolioSnapshot = sequelize.define(
  "portfolio_snapshots",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // User Reference
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      comment: "Reference to user profile",
    },

    // Total portfolio value in NT
    total_value_nt: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
      defaultValue: 0,
      comment: "Total value of all wallets converted to NT",
    },

    // Total portfolio value in USD
    total_value_usd: {
      type: DataTypes.DECIMAL(20, 8),
      allowNull: false,
      defaultValue: 0,
      comment: "Total value of all wallets converted to USD",
    },
  },
  {
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["created_at"],
      },
    ],
  }
);

module.exports = PortfolioSnapshot;
