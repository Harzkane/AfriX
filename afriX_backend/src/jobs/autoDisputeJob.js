// src/jobs/autoDisputeJob.js
const escrowService = require("../services/escrowService");

/**
 * Periodically processes expired escrows:
 * - If agent assigned → opens a dispute
 * - If no agent assigned → refunds escrow back to user
 */
async function autoDisputeJob() {
  try {
    const results = await escrowService.processExpiredEscrows(50);
    if (results && results.length > 0) {
      console.log(`[autoDisputeJob] Processed ${results.length} expired escrows.`);
    }
  } catch (error) {
    console.error("[autoDisputeJob] Failed to process expired escrows:", error.message);
  }
}

module.exports = { autoDisputeJob };
