// src/models/BurnRequest.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { BURN_REQUEST_STATUS } = require("../config/constants");

const BurnRequest = sequelize.define(
  "burn_requests",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: { type: DataTypes.UUID, allowNull: false },
    agent_id: { type: DataTypes.UUID, allowNull: false },
    amount: { type: DataTypes.DECIMAL(30, 8), allowNull: false },
    token_type: { type: DataTypes.STRING(10), allowNull: false },
    status: {
      type: DataTypes.ENUM(...Object.values(BURN_REQUEST_STATUS)),
      defaultValue: BURN_REQUEST_STATUS.PENDING,
    },
    escrow_id: { type: DataTypes.UUID, allowNull: true }, // NEW
    fiat_proof_url: { type: DataTypes.STRING, allowNull: true },
    agent_bank_reference: { type: DataTypes.STRING, allowNull: true },
    user_bank_account: { type: DataTypes.JSON, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);

module.exports = BurnRequest;
