// File: src/services/disputeService.js

/**
 * Dispute Service
 * -----------------------------------------------------
 * Manages user-agent disputes for escrowed transactions.
 * This ensures fair resolution, maintains transparency,
 * and supports automatic escalation when agents fail to act.
 * -----------------------------------------------------
 */

const { sequelize } = require("../config/database");
const { Dispute, Escrow, Transaction, Agent } = require("../models");
const {
  DISPUTE_STATUS,
  DISPUTE_ESCALATION_LEVELS,
  ESCROW_STATUS,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");

/**
 * =====================================================
 * DISPUTE SERVICE IMPLEMENTATION
 * =====================================================
 */
const disputeService = {
  /**
   * =====================================================
   * OPEN DISPUTE
   * =====================================================
   * Description:
   *  - Creates a new dispute record and updates the related
   *    escrow status to "disputed".
   *  - Can be triggered automatically (expired escrow)
   *    or manually (user complaint).
   *
   * Flow:
   *  1. Validate escrow existence.
   *  2. Mark escrow as DISPUTED.
   *  3. Create a Dispute record linked to escrow & tx.
   *  4. Assign escalation level (AUTO / USER / ADMIN).
   */
  async openDispute(payload) {
    const {
      escrowId,
      transactionId,
      mintRequestId,
      openedByUserId,
      agentId,
      reason,
      details,
    } = payload;

    return sequelize.transaction(async (t) => {
      let escrow = null;
      let mintRequest = null;
      let finalAgentId = agentId;

      // Step 1: Verify linked entity (Escrow OR MintRequest)
      if (escrowId) {
        escrow = await Escrow.findByPk(escrowId, { transaction: t });
        if (!escrow) throw new ApiError("Escrow not found", 404);

        // Mark escrow as disputed
        escrow.status = ESCROW_STATUS.DISPUTED;
        await escrow.save({ transaction: t });

        finalAgentId = finalAgentId || escrow.agent_id;
      } else if (mintRequestId) {
        const MintRequest = require("../models/MintRequest");
        const { MINT_REQUEST_STATUS } = require("../config/constants");

        mintRequest = await MintRequest.findByPk(mintRequestId, { transaction: t });
        if (!mintRequest) throw new ApiError("Mint Request not found", 404);

        // Mark mint request as disputed
        mintRequest.status = MINT_REQUEST_STATUS.DISPUTED;
        await mintRequest.save({ transaction: t });

        finalAgentId = finalAgentId || mintRequest.agent_id;
      } else {
        throw new ApiError("Either escrowId or mintRequestId is required", 400);
      }

      // Step 2: Create dispute record
      const dispute = await Dispute.create(
        {
          escrow_id: escrowId || null,
          mint_request_id: mintRequestId || null,
          transaction_id: transactionId || (escrow ? escrow.transaction_id : null),
          opened_by_user_id: openedByUserId,
          agent_id: finalAgentId || null,
          reason,
          details,
          status: DISPUTE_STATUS.OPEN,
          escalation_level: DISPUTE_ESCALATION_LEVELS.AUTO, // auto unless user/admin set
        },
        { transaction: t }
      );

      // Step 3: (Future) notify admin/agent/user

      return dispute;
    });
  },

  /**
   * =====================================================
   * RESOLVE DISPUTE (Admin Action)
   * =====================================================
   * Description:
   *  - Used by admin after investigation.
   *  - Supports actions:
   *     → "refund": Return user tokens.
   *     → "penalize_agent": Deduct agent deposit, refund user.
   *     → "split": Manual shared resolution.
   */
  async resolveDispute(disputeId, resolverUserId, options = {}) {
    return sequelize.transaction(async (t) => {
      // Step 1: Fetch and validate dispute
      const dispute = await Dispute.findByPk(disputeId, { transaction: t });
      if (!dispute) throw new ApiError("Dispute not found", 404);
      if (dispute.status === DISPUTE_STATUS.RESOLVED)
        throw new ApiError("Dispute already resolved", 400);

      // Step 2: Fetch linked escrow
      const escrow = await Escrow.findByPk(dispute.escrow_id, {
        transaction: t,
      });
      if (!escrow) throw new ApiError("Escrow not found", 404);

      // Step 3: Determine admin action (default: refund)
      const action = options.action || "refund";

      /**
       * -----------------------------------------------
       * CASE 1: REFUND USER
       * -----------------------------------------------
       * - Refunds escrow amount to user wallet.
       * - Marks dispute and escrow as resolved/refunded.
       */
      if (action === "refund") {
        const { tx, escrow: updatedEscrow } =
          await require("./escrowService").refundEscrow(
            escrow.id,
            { resolved_by: resolverUserId, notes: options.notes },
            t
          );

        dispute.status = DISPUTE_STATUS.RESOLVED;
        dispute.resolution = {
          action: "refund",
          notes: options.notes || null,
          resolved_by: resolverUserId,
        };
        await dispute.save({ transaction: t });

        return { dispute, tx, escrow: updatedEscrow };
      }

      /**
       * -----------------------------------------------
       * CASE 2: PENALIZE AGENT
       * -----------------------------------------------
       * - Deduct penalty from agent’s deposit/capacity.
       * - Refund user.
       */
      if (action === "penalize_agent") {
        const penalty = parseFloat(options.penalty_amount_usd || 0);
        const agent = await Agent.findByPk(
          dispute.agent_id || escrow.agent_id,
          { transaction: t }
        );
        if (!agent) throw new ApiError("Agent not found", 404);

        // Deduct penalty from agent's security deposit and liquidity
        agent.deposit_usd = Math.max(0, agent.deposit_usd - penalty);
        agent.available_capacity = Math.max(
          0,
          agent.available_capacity - penalty
        );
        await agent.save({ transaction: t });

        // Refund user
        await require("./escrowService").refundEscrow(
          escrow.id,
          { resolved_by: resolverUserId, notes: options.notes },
          t
        );

        dispute.status = DISPUTE_STATUS.RESOLVED;
        dispute.resolution = {
          action: "penalize_agent",
          penalty_amount_usd: penalty,
          notes: options.notes || null,
          resolved_by: resolverUserId,
        };
        await dispute.save({ transaction: t });

        return { dispute, agent };
      }

      /**
       * -----------------------------------------------
       * CASE 3: SPLIT SETTLEMENT
       * -----------------------------------------------
       * - For shared-fault cases.
       * - Currently records resolution metadata only.
       */
      if (action === "split") {
        dispute.status = DISPUTE_STATUS.RESOLVED;
        dispute.resolution = {
          action: "split",
          notes: options.notes || null,
          resolved_by: resolverUserId,
        };
        await dispute.save({ transaction: t });

        // (Future enhancement: proportional token/fiat split)
        return { dispute };
      }

      throw new ApiError("Unknown resolution action", 400);
    });
  },
};

module.exports = disputeService;
