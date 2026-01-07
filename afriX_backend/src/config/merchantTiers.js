// src/config/merchantTiers.js
// Merchant Tier Config Map (a lightweight JSON or in-memory structure).

const { MERCHANT_TIERS } = require("./constants");

const MERCHANT_TIER_CONFIG = {
  [MERCHANT_TIERS.BASIC]: {
    name: "Basic",
    verificationRequired: "email",
    dailyLimit: 100000,
    feeDiscount: 0,
    features: ["QR Payments", "Payment Links"],
  },
  [MERCHANT_TIERS.STANDARD]: {
    name: "Standard",
    verificationRequired: "identity",
    dailyLimit: 2000000,
    feeDiscount: 0.5,
    features: ["Reports", "Analytics", "Webhooks"],
  },
  [MERCHANT_TIERS.PREMIUM]: {
    name: "Premium",
    verificationRequired: "business",
    dailyLimit: 10000000,
    feeDiscount: 1.0,
    features: ["API Access", "Loyalty Rewards", "Priority Support"],
  },
  [MERCHANT_TIERS.ENTERPRISE]: {
    name: "Enterprise",
    verificationRequired: "custom",
    dailyLimit: null, // Unlimited
    feeDiscount: 1.5,
    features: ["Custom Integrations", "Dedicated Manager"],
  },
};

module.exports = MERCHANT_TIER_CONFIG;
