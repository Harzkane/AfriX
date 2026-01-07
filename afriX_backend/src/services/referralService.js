// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/referralService.js

const crypto = require('crypto');
const { Agent } = require('../models');

/**
 * Referral Service
 * Handles agent referral codes and basic tracking
 */
const referralService = {
  /**
   * Generate a unique referral code for an agent
   * @param {string} agentId
   * @returns {string}
   */
  generateReferralCode(agentId) {
    // Generate a short, uppercase code combining agent hash and random bytes
    const seed = crypto.createHash('sha256').update(agentId).digest('hex').slice(0, 6);
    const rand = crypto.randomBytes(3).toString('hex').slice(0, 6);
    return `${seed}${rand}`.toUpperCase();
  },

  /**
   * Record a referral by incrementing referred_users_count
   * @param {string} agentId
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async recordReferral(agentId, userId) {
    const agent = await Agent.findByPk(agentId);
    if (!agent) return;
    // For now, just increment counter. A full system would store a referral record table.
    agent.referred_users_count = (agent.referred_users_count || 0) + 1;
    await agent.save();
  }
};

module.exports = referralService;