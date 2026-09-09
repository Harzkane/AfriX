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
    const feePct = PLATFORM_FEES.AGENT_FACILITATION || 0.25;
    return parseFloat(((feePct / 100) * amt).toFixed(8));
  },

  /**
   * Calculate complete exchange fee breakdown based on fee mode
   * @param {Object} params
   * @param {number|string} params.amount - Input amount (gross or net depending on fee_mode)
   * @param {number|string} [params.commission_rate] - Agent commission percent (e.g., 1.0)
   * @param {string} [params.tier] - Agent tier
   * @param {string} [params.fee_mode] - 'deduct' (default) or 'add_on_top'
   * @returns {Object} { gross_amount, net_amount, agent_commission, platform_fee, total_fee, fee_mode }
   */
  calculateExchangeFees({ amount, commission_rate = 1.0, tier, fee_mode = "deduct" }) {
    const amt = Math.max(0, parseFloat(amount || 0));
    const mode = fee_mode === "add_on_top" ? "add_on_top" : "deduct";

    const agentCommission = this.calculateAgentCommission({
      amount: amt,
      commission_rate,
      tier,
    });
    const platformFee = this.calculatePlatformFee(amt);
    const totalFee = parseFloat((agentCommission + platformFee).toFixed(8));

    if (mode === "add_on_top") {
      // User wants exact net amount; fees are added on top of user payment
      const netAmount = amt;
      const grossAmount = parseFloat((netAmount + totalFee).toFixed(8));
      return {
        gross_amount: grossAmount,
        net_amount: netAmount,
        agent_commission: agentCommission,
        platform_fee: platformFee,
        total_fee: totalFee,
        fee_mode: mode,
      };
    } else {
      // Default: Fee is deducted from payout; user spends exact input amount
      const grossAmount = amt;
      const netAmount = Math.max(0, parseFloat((grossAmount - totalFee).toFixed(8)));
      return {
        gross_amount: grossAmount,
        net_amount: netAmount,
        agent_commission: agentCommission,
        platform_fee: platformFee,
        total_fee: totalFee,
        fee_mode: mode,
      };
    }
  }
};

module.exports = commissionService;