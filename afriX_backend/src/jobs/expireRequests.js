// jobs/expireRequests.js
// node jobs/expireRequests.js
const { BurnRequest, Escrow } = require("../models");
const { Op } = require("sequelize");
const { BURN_REQUEST_STATUS } = require("../config/constants");
const disputeService = require("../services/disputeService");

async function expireRequests() {
  const now = new Date();

  // Auto-dispute expired burn requests in FIAT_SENT state
  const expiredBurns = await BurnRequest.findAll({
    where: {
      status: BURN_REQUEST_STATUS.FIAT_SENT,
      expires_at: { [Op.lt]: now },
    },
  });

  for (const request of expiredBurns) {
    await disputeService.openDispute({
      escrowId: request.escrow_id,
      openedByUserId: request.user_id,
      agentId: request.agent_id,
      reason: "auto_expired",
      details: "User did not confirm fiat receipt within 30 minutes",
    });

    request.status = BURN_REQUEST_STATUS.EXPIRED;
    await request.save();
  }
}

// EXPORT IT!
module.exports = { expireRequests };

// // jobs/expireRequests.js
// const { MintRequest, BurnRequest, Escrow } = require("../models");
// const { Op } = require("sequelize");
// const { MINT_REQUEST_STATUS, BURN_REQUEST_STATUS, ESCROW_STATUS } = require("../config/constants");
// const escrowService = require("../services/escrowService");

// async function expireRequests() {
//   const now = new Date();

//   // Expire mint requests
//   await MintRequest.update(
//     { status: MINT_REQUEST_STATUS.EXPIRED },
//     { where: { status: MINT_REQUEST_STATUS.PENDING, expires_at: { [Op.lt]: now } } }
//   );

//   // Expire burn requests (trigger escrow refund)
//   const burnRequests = await BurnRequest.findAll({
//     where: {
//       status: BURN_REQUEST_STATUS.ESCROWED,
//       expires_at: { [Op.lt]: now },
//     },
//   });

//   for (const request of burnRequests) {
//     await escrowService.refundEscrow(request.escrow_id, { reason: "expired" });
//     request.status = BURN_REQUEST_STATUS.EXPIRED;
//     await request.save();
//   }
// }

// module.exports = { expireRequests };
