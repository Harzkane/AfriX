// File: src/models/Escrow.js
const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
const { ESCROW_CONFIG, ESCROW_STATUS } = require("../config/constants");

class Escrow extends Model {}

Escrow.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Related transaction that initiated this escrow",
    },

    from_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User who locked tokens (seller)",
    },

    agent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Agent assigned to the escrow (if any)",
    },

    token_type: {
      type: DataTypes.STRING(16),
      allowNull: false,
      comment: "NT, CT or USDT",
    },

    amount: {
      type: DataTypes.DECIMAL(30, 8),
      allowNull: false,
    },

    // ✅ Uses centralized constants, keeping "locked" as default
    status: {
      type: DataTypes.ENUM(...Object.values(ESCROW_STATUS)),
      allowNull: false,
      defaultValue: ESCROW_STATUS.LOCKED,
      comment: "Lifecycle state of the escrow record",
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: () =>
        new Date(Date.now() + ESCROW_CONFIG.TIMEOUT_HOURS * 3600 * 1000),
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "escrows",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
    indexes: [
      { fields: ["transaction_id"] },
      { fields: ["from_user_id"] },
      { fields: ["agent_id"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = Escrow;
