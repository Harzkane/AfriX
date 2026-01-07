// src/utils/merchantFee.js

const { PLATFORM_FEES } = require("../config/constants");
const MERCHANT_TIER_CONFIG = require("../config/merchantTiers");

exports.calculateMerchantFee = (tier, amount) => {
  const baseFee = PLATFORM_FEES.MERCHANT_COLLECTION;
  const discount = MERCHANT_TIER_CONFIG[tier]?.feeDiscount || 0;
  const finalFee = baseFee - discount;
  return (amount * finalFee) / 100;
};
