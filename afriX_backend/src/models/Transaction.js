// src/models/Transaction.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  TOKEN_TYPES,
} = require("../config/constants");

/**
 * Transaction Model
 *
 * Unified ledger entry for all value movements:
 * - transfers (P2P)
 * - swaps
 * - mint (agent -> user)
 * - burn (user -> agent)
 * - collection (merchant payments)
 */
const Transaction = sequelize.define(
  "transactions",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    reference: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      comment: "Human-friendly reference ID for lookups (TRX-...)",
    },

    type: {
      type: DataTypes.ENUM(...Object.values(TRANSACTION_TYPES)),
      allowNull: false,
      comment: "Transaction type (transfer, swap, mint, burn, collection)",
    },

    status: {
      type: DataTypes.ENUM(...Object.values(TRANSACTION_STATUS)),
      allowNull: false,
      defaultValue: TRANSACTION_STATUS.PENDING,
      comment: "Transaction status",
    },

    amount: {
      type: DataTypes.DECIMAL(30, 8),
      allowNull: false,
      comment: "Amount of tokens",
    },

    fee: {
      type: DataTypes.DECIMAL(30, 8),
      allowNull: true,
      defaultValue: 0,
      comment: "Fee taken (platform/agent) for this transaction",
    },

    token_type: {
      type: DataTypes.ENUM(...Object.values(TOKEN_TYPES)),
      allowNull: false,
      comment: "Token type (NT, CT, USDT)",
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Arbitrary JSON for proofs, payer details, bank reference etc.",
    },

    // Relationships (store IDs; associations set up in models/index)
    from_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Sender user id (nullable for system/merchant initiations)",
    },

    to_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Receiver user id (nullable for system/agent flows)",
    },

    merchant_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Merchant id when this is a merchant collection",
    },

    agent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Agent id when flow involves an agent (mint/burn)",
    },

    from_wallet_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Wallet debited",
    },

    to_wallet_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Wallet credited",
    },

    fee_wallet_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "wallets",
        key: "id",
      },
      comment: "Platform wallet that received the fee",
    },

    // Blockchain sync fields (optional)
    network: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: "Blockchain network (e.g. polygon, ethereum)",
    },

    tx_hash: {
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: "On-chain transaction hash if applicable",
    },

    block_number: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    gas_fee: {
      type: DataTypes.DECIMAL(30, 8),
      allowNull: true,
    },

    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When transaction was processed/confirmed",
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["reference"] },
      { fields: ["type"] },
      { fields: ["status"] },
      { fields: ["from_user_id"] },
      { fields: ["to_user_id"] },
      { fields: ["merchant_id"] },
      { fields: ["agent_id"] },
      { fields: ["tx_hash"] },
    ],
  }
);

// You can add associations in your central models/index file like:
// Transaction.belongsTo(models.User, { foreignKey: 'from_user_id', as: 'fromUser' });
// Transaction.belongsTo(models.User, { foreignKey: 'to_user_id', as: 'toUser' });
// Transaction.belongsTo(models.Merchant, { foreignKey: 'merchant_id' });
// Transaction.belongsTo(models.Wallet, { foreignKey: 'from_wallet_id', as: 'fromWallet' });
// Transaction.belongsTo(models.Wallet, { foreignKey: 'to_wallet_id', as: 'toWallet' });

module.exports = Transaction;
