// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/models/Merchant.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { MERCHANT_TYPES, MERCHANT_STATUS } = require("../config/constants");

/**
 * Merchant Model
 *
 * Represents a business entity that can accept payments through the platform
 * Linked to a user account that manages the merchant profile
 */
const Merchant = sequelize.define(
  "merchants",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Basic Merchant Information
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User ID of the merchant account owner",
    },

    business_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Legal business name",
    },

    display_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Name displayed to customers",
    },

    business_type: {
      type: DataTypes.ENUM(Object.values(MERCHANT_TYPES)),
      allowNull: false,
      comment: "Type of business (retail, service, etc.)",
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Business description",
    },

    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "URL to merchant logo image",
    },

    // Contact Information
    business_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
      comment: "Business contact email",
    },

    business_phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "Business contact phone",
    },

    // Location Information
    country: {
      type: DataTypes.STRING(2),
      allowNull: false,
      comment: "Country code (ISO 2-letter)",
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "City where business is located",
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Physical business address",
    },

    // Payment Settings
    settlement_wallet_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Wallet ID where payments are settled",
    },

    default_token_type: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "NT",
      comment: "Default currency for payments (NT, CT, USDT)",
    },

    payment_fee_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 2.00,
      comment: "Fee percentage charged on payments",
    },

    // Verification and Status
    verification_status: {
      type: DataTypes.ENUM(Object.values(MERCHANT_STATUS)),
      allowNull: false,
      defaultValue: MERCHANT_STATUS.PENDING,
      comment: "Merchant verification status",
    },

    verification_documents: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "JSON array of verification document URLs",
    },

    // API Integration
    api_key: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: "API key for merchant integration",
    },

    webhook_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Webhook URL for payment notifications",
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
      {
        unique: true,
        fields: ["user_id", "business_name"],
        name: "merchants_user_business_unique",
      },
      {
        fields: ["business_name"],
        name: "merchants_business_name_idx",
      },
      {
        fields: ["verification_status"],
        name: "merchants_verification_status_idx",
      },
    ],
  }
);

// Instance Methods
Merchant.prototype.generateApiKey = async function () {
  const crypto = require("crypto");
  this.api_key = crypto.randomBytes(32).toString("hex");
  await this.save();
  return this.api_key;
};

// Class Methods
Merchant.findByApiKey = async function (apiKey) {
  return await Merchant.findOne({
    where: { api_key: apiKey },
  });
};

module.exports = Merchant;