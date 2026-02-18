// jobs/expireRequests.js
const { MintRequest, BurnRequest, Escrow } = require("../models");
const { Op } = require("sequelize");
const {
  MINT_REQUEST_STATUS,
  BURN_REQUEST_STATUS
} = require("../config/constants");
const escrowService = require("../services/escrowService");
const disputeService = require("../services/disputeService");

async function expireRequests() {
  const now = new Date();
  console.log(`[expireRequests] Checking for expired requests at ${now.toISOString()}`);

  try {
    // 1. Expire Mint Requests (PENDING status)
    const expiredMints = await MintRequest.update(
      { status: MINT_REQUEST_STATUS.EXPIRED },
      {
        where: {
          status: MINT_REQUEST_STATUS.PENDING,
          expires_at: { [Op.lt]: now }
        }
      }
    );
    if (expiredMints[0] > 0) {
      console.log(`[expireRequests] Expired ${expiredMints[0]} mint requests.`);
    }

    // 2. Expire ESCROWED Burn Requests (Refund user)
    // These are requests where tokens are locked but agent never confirmed sending fiat
    const burnEscrowed = await BurnRequest.findAll({
      where: {
        status: BURN_REQUEST_STATUS.ESCROWED,
        expires_at: { [Op.lt]: now },
      },
    });

    for (const request of burnEscrowed) {
      console.log(`[expireRequests] Refunding expired ESCROWED burn: ${request.id}`);
      try {
        await escrowService.refundEscrow(request.escrow_id, {
          reason: "auto_expired",
          notes: "Burn request expired while in ESCROWED status (agent did not send fiat)"
        });
        request.status = BURN_REQUEST_STATUS.EXPIRED;
        await request.save();
      } catch (err) {
        console.error(`[expireRequests] Failed to refund burn ${request.id}:`, err.message);
      }
    }

    // 3. Expire FIAT_SENT Burn Requests (Open Auto-Dispute)
    // These are requests where agent claims they paid but user never confirmed receipt
    const burnFiatSent = await BurnRequest.findAll({
      where: {
        status: BURN_REQUEST_STATUS.FIAT_SENT,
        expires_at: { [Op.lt]: now },
      },
    });

    for (const request of burnFiatSent) {
      console.log(`[expireRequests] Opening auto-dispute for expired FIAT_SENT burn: ${request.id}`);
      try {
        await disputeService.openDispute({
          escrowId: request.escrow_id,
          openedByUserId: request.user_id,
          agentId: request.agent_id,
          reason: "auto_expired",
          details: `Burn request expired in FIAT_SENT status (user did not confirm receipt). Agent Proof: ${request.fiat_proof_url || "None"}`,
        });
        request.status = BURN_REQUEST_STATUS.DISPUTED;
        await request.save();
      } catch (err) {
        console.error(`[expireRequests] Failed to dispute burn ${request.id}:`, err.message);
      }
    }

  } catch (error) {
    console.error("[expireRequests] Fatal error in job:", error);
    throw error;
  }
}

module.exports = { expireRequests };
