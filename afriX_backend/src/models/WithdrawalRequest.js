// src/models/WithdrawalRequest.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const WithdrawalRequest = sequelize.define(
  "WithdrawalRequest",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    amount_usd: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "approved", "rejected", "paid"]],
      },
    },
    admin_notes: { type: DataTypes.TEXT },
    paid_tx_hash: { type: DataTypes.STRING },
    paid_at: { type: DataTypes.DATE },
  },
  {
    tableName: "withdrawal_requests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = WithdrawalRequest;
