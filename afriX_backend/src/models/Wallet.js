// File: /Users/harz/AfriExchange/afriX_backend/src/models/Wallet.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { TOKEN_TYPES } = require("../config/constants");

/**
 * Wallet Model
 *
 * Represents a user's token wallet (NOT "bank account")
 * Each user has separate wallets for NT, CT, and USDT
 */
const Wallet = sequelize.define(
  "wallets",
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

    // Token Type
    token_type: {
      type: DataTypes.ENUM(...Object.values(TOKEN_TYPES)),
      allowNull: false,
      comment: "Type of token: NT, CT, or USDT",
    },

    // Blockchain Wallet Address
    blockchain_address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      // REMOVED: unique: true  -- handled in indexes below
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/,
      },
      comment: "Ethereum-compatible wallet address",
    },

    // Encrypted Private Key (stored securely)
    encrypted_private_key: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Encrypted private key for wallet",
    },

    // Token Balance (tracked for quick access, source of truth is blockchain)
    balance: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0,
      allowNull: false,
      comment: "Current token balance",
    },

    // Pending Balance (tokens locked in escrow or pending transactions)
    pending_balance: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0,
      allowNull: false,
      comment: "Tokens locked in pending transactions",
    },

    // Available Balance (balance - pending_balance)
    available_balance: {
      type: DataTypes.VIRTUAL,
      get() {
        return parseFloat(this.balance) - parseFloat(this.pending_balance);
      },
      comment: "Available balance for transfers",
    },

    // Last Sync with Blockchain
    last_synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Last time balance was synced with blockchain",
    },

    last_synced_block: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: "Last blockchain block number synced",
    },

    // Wallet Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Wallet active status",
    },

    is_frozen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Wallet frozen for security reasons",
    },

    frozen_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Reason for freezing wallet",
    },

    frozen_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp when wallet was frozen",
    },

    // Statistics
    total_received: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0,
      comment: "Total tokens received (all time)",
    },

    total_sent: {
      type: DataTypes.DECIMAL(20, 8),
      defaultValue: 0,
      comment: "Total tokens sent (all time)",
    },

    transaction_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Total number of transactions",
    },

    // Timestamps
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
      { fields: ["user_id"] },
      { fields: ["token_type"] },
      { fields: ["blockchain_address"], unique: true },
      {
        fields: ["user_id", "token_type"],
        unique: true,
        name: "unique_user_token",
      },
      { fields: ["is_active"] },
      { fields: ["is_frozen"] },
    ],
  }
);

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if wallet has sufficient available balance
 * @param {number} amount - Amount to check
 * @returns {boolean}
 */
Wallet.prototype.hasSufficientBalance = function (amount) {
  return parseFloat(this.available_balance) >= parseFloat(amount);
};

/**
 * Lock tokens (move to pending)
 * @param {number} amount - Amount to lock
 */
Wallet.prototype.lockTokens = async function (amount) {
  const lockAmount = parseFloat(amount);

  if (!this.hasSufficientBalance(lockAmount)) {
    throw new Error("Insufficient token balance");
  }

  this.pending_balance = parseFloat(this.pending_balance) + lockAmount;
  await this.save();
};

/**
 * Unlock tokens (remove from pending)
 * @param {number} amount - Amount to unlock
 */
Wallet.prototype.unlockTokens = async function (amount) {
  const unlockAmount = parseFloat(amount);
  this.pending_balance = Math.max(
    0,
    parseFloat(this.pending_balance) - unlockAmount
  );
  await this.save();
};

/**
 * Update balance (from blockchain sync)
 * @param {number} newBalance - New balance from blockchain
 */
Wallet.prototype.updateBalance = async function (newBalance) {
  const oldBalance = parseFloat(this.balance);
  const newBal = parseFloat(newBalance);

  this.balance = newBal;
  this.last_synced_at = new Date();

  // Update statistics
  if (newBal > oldBalance) {
    this.total_received =
      parseFloat(this.total_received) + (newBal - oldBalance);
  } else if (newBal < oldBalance) {
    this.total_sent = parseFloat(this.total_sent) + (oldBalance - newBal);
  }

  await this.save();
};

/**
 * Increment transaction count
 */
// Wallet.prototype.incrementTransactionCount = async function () {
//   this.transaction_count += 1;
//   await this.save();
// };

/**
 * Increment transaction count
 * @param {Object} options - Sequelize options (including transaction)
 */
Wallet.prototype.incrementTransactionCount = function (options = {}) {
  this.transaction_count += 1;
  // Don't save here - let the caller handle saving
  // This allows the save to happen within the transaction context
};

// Alternative: If you want to keep the save, accept transaction parameter
// Wallet.prototype.incrementTransactionCountAndSave = async function (t = null) {
//   this.transaction_count += 1;
//   await this.save({ transaction: t });
// };

/**
 * Freeze wallet
 * @param {string} reason - Reason for freezing
 */
Wallet.prototype.freeze = async function (reason) {
  this.is_frozen = true;
  this.frozen_reason = reason;
  this.frozen_at = new Date();
  await this.save();
};

/**
 * Unfreeze wallet
 */
Wallet.prototype.unfreeze = async function () {
  this.is_frozen = false;
  this.frozen_reason = null;
  this.frozen_at = null;
  await this.save();
};

/**
 * Get safe wallet object (exclude sensitive fields)
 * @returns {Object}
 */
Wallet.prototype.toSafeObject = function () {
  const { encrypted_private_key, ...safeWallet } = this.toJSON();

  return {
    ...safeWallet,
    available_balance: this.available_balance,
  };
};

/**
 * Format balance for display
 * @returns {string}
 */
Wallet.prototype.getFormattedBalance = function () {
  const balance = parseFloat(this.balance);

  if (
    this.token_type === TOKEN_TYPES.NT ||
    this.token_type === TOKEN_TYPES.CT
  ) {
    return balance.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // USDT with more decimals
  return balance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

// ============================================
// CLASS METHODS
// ============================================

/**
 * Get all wallets for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
Wallet.getUserWallets = async function (userId) {
  return await Wallet.findAll({
    where: {
      user_id: userId,
      is_active: true,
    },
    order: [["token_type", "ASC"]],
  });
};

/**
 * Get specific wallet for user and token type
 * @param {string} userId - User ID
 * @param {string} tokenType - Token type (NT, CT, USDT)
 * @returns {Promise<Wallet|null>}
 */
Wallet.getUserWallet = async function (userId, tokenType) {
  return await Wallet.findOne({
    where: {
      user_id: userId,
      token_type: tokenType,
      is_active: true,
    },
  });
};

/**
 * Get wallet by blockchain address
 * @param {string} address - Blockchain address
 * @returns {Promise<Wallet|null>}
 */
Wallet.getByAddress = async function (address) {
  return await Wallet.findOne({
    where: {
      blockchain_address: address.toLowerCase(),
      is_active: true,
    },
  });
};

/**
 * Get total platform value locked (TVL) by token type
 * @param {string} tokenType - Token type
 * @returns {Promise<number>}
 */
Wallet.getTotalValueLocked = async function (tokenType) {
  const result = await Wallet.findOne({
    attributes: [[sequelize.fn("SUM", sequelize.col("balance")), "total"]],
    where: {
      token_type: tokenType,
      is_active: true,
    },
    raw: true,
  });

  return parseFloat(result?.total || 0);
};

module.exports = Wallet;
