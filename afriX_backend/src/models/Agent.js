// File: src/models/Agent.js
const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
const {
  AGENT_STATUS,
  AGENT_TIERS,
  COUNTRIES,
  CURRENCIES,
} = require("../config/constants");

class Agent extends Model { }

Agent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User reference who owns the agent profile",
    },

    country: {
      type: DataTypes.ENUM(...Object.values(COUNTRIES)),
      allowNull: false,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Agent city for user-facing list",
    },

    is_online: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "Whether agent is currently available",
    },

    max_transaction_limit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Max amount per single transaction",
    },

    daily_transaction_limit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: "Max total amount per day",
    },

    currency: {
      type: DataTypes.ENUM(...Object.values(CURRENCIES)),
      allowNull: false,
    },

    tier: {
      type: DataTypes.ENUM(...Object.values(AGENT_TIERS)),
      defaultValue: AGENT_TIERS.STARTER,
    },

    status: {
      type: DataTypes.ENUM(...Object.values(AGENT_STATUS)),
      defaultValue: AGENT_STATUS.PENDING,
    },

    // ============================================
    // AGENT FINANCIALS
    // ============================================

    withdrawal_address: {
      type: DataTypes.STRING(42),
      allowNull: false, // ← Make required during registration
      validate: { is: /^0x[a-fA-F0-9]{40}$/ },
      comment: "Agent's personal wallet for USDT withdrawals",
    },

    deposit_usd: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: "Total USDT deposited by agent to platform treasury",
    },

    available_capacity: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: "Amount of USDT-backed tokens the agent can mint/burn",
    },

    total_minted: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: "Total tokens issued to users (reduces available capacity)",
    },

    total_burned: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: "Total tokens bought back from users (increases capacity)",
    },

    total_earnings: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      comment: "Total commissions earned by the agent",
    },

    commission_rate: {
      type: DataTypes.FLOAT,
      defaultValue: 0.01, // 1% default
      comment: "Commission rate for transactions (e.g. 0.01 = 1%)",
    },

    // ============================================
    // AGENT REPUTATION
    // ============================================

    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 5.0,
      validate: { min: 0, max: 5 },
    },

    response_time_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },

    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "KYC verification status",
    },

    // ============================================
    // AGENT CONTACT INFO (Optional)
    // ============================================

    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    whatsapp_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    account_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    account_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // XOF: mobile money (Orange Money, Wave, Kiren Money, etc.)
    mobile_money_provider: {
      type: DataTypes.STRING(80),
      allowNull: true,
      comment: "e.g. Orange Money, Wave, Kiren Money",
    },
    mobile_money_number: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: "Phone number for mobile money",
    },
  },
  {
    sequelize,
    modelName: "Agent",
    tableName: "agents",
    underscored: true,
    timestamps: true,
  }
);

module.exports = Agent;
