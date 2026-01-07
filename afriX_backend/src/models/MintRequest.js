const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { MINT_REQUEST_STATUS } = require("../config/constants");

const MintRequest = sequelize.define(
  "mint_requests",
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
      type: DataTypes.ENUM(...Object.values(MINT_REQUEST_STATUS)),
      defaultValue: MINT_REQUEST_STATUS.PENDING,
    },
    payment_proof_url: { type: DataTypes.STRING, allowNull: true },
    user_bank_reference: { type: DataTypes.STRING, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
  },
  { timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);

module.exports = MintRequest;
