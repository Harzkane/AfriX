// File: src/services/userService.js
const { Agent, User, MintRequest, BurnRequest, Transaction } = require("../models");
const {
  AGENT_STATUS,
  VERIFICATION_LEVELS,
  TRANSACTION_LIMITS,
  EXCHANGE_RATES,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");

function tokenAmountToUsdt(amount, tokenType) {
  const rate =
    tokenType === "NT"
      ? EXCHANGE_RATES.NT_TO_USDT
      : tokenType === "CT"
        ? EXCHANGE_RATES.CT_TO_USDT
        : 1;
  return parseFloat(amount) * (rate || 0);
}

/**
 * Find available agents by country or user location.
 * @param {Object} options - Search filters
 * @param {string} [options.country] - Country code (e.g., 'NG')
 * @param {number} [options.limit] - Max number of agents to return
 * @returns {Promise<Array>} - List of matching agents
 */
async function findAgents({ country, limit = 10 }) {
  if (!country) {
    throw new ApiError("Country is required to find agents", 400);
  }

  const agents = await Agent.findAll({
    where: {
      status: AGENT_STATUS.ACTIVE,
      [Op.or]: [{ country }, { country: null }],
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: [
          "id",
          "full_name",
          "email",
          "phone_number",
          "country_code",
        ],
        where: { country_code: country },
        required: true,
      },
    ],
    limit,
    order: [["rating", "DESC"]],
  });

  if (!agents || agents.length === 0) {
    throw new ApiError("No active agents found for this region", 404);
  }

  return agents;
}

/**
 * Enforce verification level daily and per-transaction limits
 * @param {string} userId - User ID
 * @param {number|string} amount - Token amount requested
 * @param {string} tokenType - NT, CT, or USDT
 */
async function checkTransactionLimits(userId, amount, tokenType) {
  const user = await User.findByPk(userId);
  if (!user) throw new ApiError("User not found", 404);

  const verificationLevel = user.verification_level ?? VERIFICATION_LEVELS.NONE;
  const dailyLimitUsdt = TRANSACTION_LIMITS.DAILY[verificationLevel] ?? 0;
  const perTxLimitUsdt = TRANSACTION_LIMITS.PER_TRANSACTION[verificationLevel] ?? 0;

  const requestedUsdt = tokenAmountToUsdt(amount, tokenType);

  // Check per-transaction limit
  if (perTxLimitUsdt > 0 && requestedUsdt > perTxLimitUsdt) {
    throw new ApiError(
      `Amount exceeds your per-transaction limit of $${perTxLimitUsdt} USDT for your verification level. Reduce amount or upgrade profile verification for higher limits.`,
      400
    );
  }

  // Check daily limit
  if (dailyLimitUsdt === 0) {
    throw new ApiError(
      "Unverified account. Please verify your email to unlock trading limits.",
      400
    );
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Calculate sum of mints in last 24h
  const mints = await MintRequest.findAll({
    where: {
      user_id: userId,
      status: { [Op.notIn]: ["cancelled", "rejected", "expired"] },
      created_at: { [Op.gte]: twentyFourHoursAgo },
    },
    attributes: ["amount", "token_type", "created_at"],
  });

  // Calculate sum of burns in last 24h
  const burns = await BurnRequest.findAll({
    where: {
      user_id: userId,
      status: { [Op.notIn]: ["cancelled", "rejected", "expired"] },
      created_at: { [Op.gte]: twentyFourHoursAgo },
    },
    attributes: ["amount", "token_type", "created_at"],
  });

  // Calculate sum of transfers in last 24h
  const transfers = await Transaction.findAll({
    where: {
      from_user_id: userId,
      type: "transfer",
      status: { [Op.notIn]: ["failed", "cancelled"] },
      created_at: { [Op.gte]: twentyFourHoursAgo },
    },
    attributes: ["amount", "token_type", "created_at"],
  });

  let sumPast24hUsdt = 0;
  mints.forEach((m) => {
    sumPast24hUsdt += tokenAmountToUsdt(m.amount, m.token_type);
  });
  burns.forEach((b) => {
    sumPast24hUsdt += tokenAmountToUsdt(b.amount, b.token_type);
  });
  transfers.forEach((t) => {
    sumPast24hUsdt += tokenAmountToUsdt(t.amount, t.token_type);
  });

  if (sumPast24hUsdt + requestedUsdt > dailyLimitUsdt) {
    const remainingUsdt = Math.max(0, dailyLimitUsdt - sumPast24hUsdt);

    // Calculate time until oldest transaction falls out of 24h window
    const allDates = [
      ...mints.map((m) => m.created_at),
      ...burns.map((b) => b.created_at),
      ...transfers.map((t) => t.created_at),
    ].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let resetTimeMsg = "";
    if (allDates.length > 0) {
      const earliestTime = new Date(allDates[0]).getTime();
      const resetTimeMs = earliestTime + 24 * 60 * 60 * 1000;
      const diffMs = resetTimeMs - Date.now();
      if (diffMs > 0) {
        const totalMins = Math.ceil(diffMs / (60 * 1000));
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        resetTimeMsg = ` Limit resets in ${timeStr}.`;
      }
    }

    throw new ApiError(
      `Daily limit of $${dailyLimitUsdt} USDT reached (remaining today: $${remainingUsdt.toFixed(2)} USDT).${resetTimeMsg} Upgrade profile verification to increase your daily limit immediately.`,
      400
    );
  }

  return true;
}

module.exports = {
  findAgents,
  checkTransactionLimits,
};
