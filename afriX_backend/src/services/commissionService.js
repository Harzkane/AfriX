// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/commissionService.js

const { AGENT_TIERS, PLATFORM_FEES } = require('../config/constants');

/**
 * Commission Service
 * Provides helpers to compute agent commission and platform fee
 */
const commissionService = {
  /**
   * Calculate agent commission based on rate and tier multiplier
   * @param {Object} params
   * @param {number|string} params.amount - Transaction amount
   * @param {number|string} params.commission_rate - Agent commission percent (e.g., 1.5)
   * @param {string} params.tier - Agent tier
   * @returns {number} commission amount
   */
  calculateAgentCommission({ amount, commission_rate, tier }) {
    const amt = parseFloat(amount || 0);
    const ratePct = parseFloat(commission_rate || 0);
    const multiplier = this.getTierMultiplier(tier);
    const base = (ratePct / 100) * amt;
    return parseFloat((base * multiplier).toFixed(8));
  },

  /**
   * Get tier-based multiplier to reward higher tiers
   * @param {string} tier
   * @returns {number}
   */
  getTierMultiplier(tier) {
    switch (tier) {
      case AGENT_TIERS.PLATINUM:
        return 1.15;
      case AGENT_TIERS.PREMIUM:
        return 1.10;
      case AGENT_TIERS.STANDARD:
        return 1.05;
      case AGENT_TIERS.STARTER:
      default:
        return 1.0;
    }
  },

  /**
   * Calculate platform fee for agent-facilitated exchanges
   * @param {number|string} amount
   * @returns {number}
   */
  calculatePlatformFee(amount) {
    const amt = parseFloat(amount || 0);
    const feePct = PLATFORM_FEES.AGENT_FACILITATION || 0;
    return parseFloat(((feePct / 100) * amt).toFixed(8));
  }
};

module.exports = commissionService;