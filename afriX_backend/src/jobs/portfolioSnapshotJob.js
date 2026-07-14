// File: src/jobs/portfolioSnapshotJob.js
const { User } = require("../models");
const { captureSnapshot } = require("../services/portfolioService");

/**
 * Job to capture portfolio snapshots for all active users.
 * Typically runs daily to ensure historical trend continuity.
 */
async function runPortfolioSnapshotJob() {
  console.log("[Portfolio Snapshot Job] Starting daily snapshot capture...");
  try {
    const users = await User.findAll({
      where: { is_active: true },
    });

    console.log(`[Portfolio Snapshot Job] Found ${users.length} active users to snapshot.`);
    
    for (const user of users) {
      try {
        await captureSnapshot(user.id);
      } catch (userErr) {
        console.error(`[Portfolio Snapshot Job] Failed snapshot for user ${user.id}:`, userErr.message);
      }
    }

    console.log("[Portfolio Snapshot Job] Daily snapshot capture complete.");
  } catch (error) {
    console.error("[Portfolio Snapshot Job] Global execution error:", error.message);
  }
}

module.exports = { runPortfolioSnapshotJob };
