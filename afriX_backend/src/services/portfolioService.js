// File: src/services/portfolioService.js
const { Wallet, PortfolioSnapshot } = require("../models");
const { getExchangeRate } = require("../config/constants");
const { Op } = require("sequelize");

/**
 * Capture a new portfolio snapshot for a user based on their current wallet balances.
 *
 * @param {string} userId - User's UUID
 * @param {object} [transaction] - Optional Sequelize transaction context
 * @returns {Promise<object>} The created PortfolioSnapshot record
 */
async function captureSnapshot(userId, transaction = null) {
  try {
    // 1. Fetch all active wallets for the user
    const wallets = await Wallet.findAll({
      where: {
        user_id: userId,
        is_active: true,
      },
      transaction,
    });

    // 2. Fetch the current exchange rates from config/constants
    const usdtRateNT = getExchangeRate("USDT", "NT") || 1500;
    const usdtRateCT = getExchangeRate("USDT", "CT") || 565;

    let totalNT = 0;

    // 3. Sum up all balances converted to NT
    for (const wallet of wallets) {
      const balance = parseFloat(wallet.balance || 0);
      if (wallet.token_type === "NT") {
        totalNT += balance;
      } else if (wallet.token_type === "CT") {
        totalNT += balance * (usdtRateNT / usdtRateCT);
      } else if (wallet.token_type === "USDT") {
        totalNT += balance * usdtRateNT;
      }
    }

    const totalUSD = totalNT / usdtRateNT;

    // 4. Create the snapshot entry
    const snapshot = await PortfolioSnapshot.create(
      {
        user_id: userId,
        total_value_nt: totalNT,
        total_value_usd: totalUSD,
      },
      { transaction }
    );

    console.log(`[portfolioService] Captured snapshot for user ${userId}: NT=${totalNT}, USD=${totalUSD}`);
    return snapshot;
  } catch (error) {
    console.error(`[portfolioService] Failed to capture snapshot for user ${userId}:`, error.message);
    // Don't fail parent transaction if snapshot fails (fail-safe)
    return null;
  }
}

/**
 * Retrieve historical portfolio snapshots and calculate the trend percentage.
 *
 * @param {string} userId - User's UUID
 * @param {number} [days=7] - Number of days of history to fetch
 * @returns {Promise<{ history: Array, trend: string, percentage: number }>}
 */
async function getHistory(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 1. Retrieve snapshots in chronological order
  const snapshots = await PortfolioSnapshot.findAll({
    where: {
      user_id: userId,
      created_at: {
        [Op.gte]: startDate,
      },
    },
    order: [["created_at", "ASC"]],
  });

  // If user has no historical snapshots, capture one right now so we have a starting data point
  if (snapshots.length === 0) {
    const freshSnapshot = await captureSnapshot(userId);
    const resultList = freshSnapshot ? [freshSnapshot] : [];
    return {
      history: resultList,
      trend: "0.00%",
      percentage: 0,
    };
  }

  const earliest = parseFloat(snapshots[0].total_value_nt || 0);
  const latest = parseFloat(snapshots[snapshots.length - 1].total_value_nt || 0);

  let percentageChange = 0;
  if (earliest > 0) {
    percentageChange = ((latest - earliest) / earliest) * 100;
  } else if (latest > 0) {
    percentageChange = 100.0; // 100% growth starting from 0
  }

  const trendPrefix = percentageChange > 0 ? "+" : "";
  const trend = `${trendPrefix}${percentageChange.toFixed(2)}%`;

  return {
    history: snapshots,
    trend,
    percentage: percentageChange,
  };
}

module.exports = {
  captureSnapshot,
  getHistory,
};
