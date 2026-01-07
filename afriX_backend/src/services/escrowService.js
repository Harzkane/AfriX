// File: src/services/escrowService.js

/**
 * Escrow Service
 * -----------------------------------------------------
 * Manages token escrow lifecycle during mint/burn flows:
 *  - Lock tokens for pending burns (user → agent)
 *  - Finalize burns when agent confirms fiat payment
 *  - Refund tokens when transaction is cancelled or expired
 *  - Automatically process expired escrows (cron or scheduler)
 *
 * Ensures users’ tokens are held securely until conditions
 * are met — protecting both user and agent.
 * -----------------------------------------------------
 */

const { sequelize } = require("../config/database");
const { Wallet, Transaction, Escrow, Agent } = require("../models");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  ESCROW_CONFIG,
} = require("../config/constants");
const { generateTransactionReference } = require("../utils/helpers");
const { ApiError } = require("../utils/errors");
const disputeService = require("./disputeService");

const escrowService = {
  /**
   * =====================================================
   * LOCK TOKENS FOR BURN (Escrow Initialization)
   * =====================================================
   * Description:
   *  - User wants to sell tokens (burn).
   *  - Tokens are temporarily locked in escrow (pending state).
   *  - Transaction is created as PENDING.
   *  - Escrow record stores expiry and metadata.
   *
   * Flow:
   *  1. Validate user wallet and balance.
   *  2. Deduct amount from user balance → move to pending_balance.
   *  3. Create transaction (type = BURN, status = PENDING).
   *  4. Create escrow record linked to the transaction.
   */
  async lockForBurn(userId, agentId, tokenType, amount, metadata = {}) {
    return sequelize.transaction(async (t) => {
      // Step 1: Validate user wallet
      const userWallet = await Wallet.findOne({
        where: { user_id: userId, token_type: tokenType },
      });
      if (!userWallet) throw new ApiError("User wallet not found", 404);

      const amt = parseFloat(amount);
      if (userWallet.balance < amt) {
        throw new ApiError("Insufficient available balance", 400);
      }

      // Step 2: Move tokens to pending state
      userWallet.balance -= amt;
      userWallet.pending_balance += amt;
      await userWallet.save({ transaction: t });

      // Step 3: Create pending transaction
      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.BURN,
          status: TRANSACTION_STATUS.PENDING,
          amount: amt,
          token_type: tokenType,
          description: "Escrowed burn - awaiting agent fiat",
          from_user_id: userId,
          agent_id: agentId || null,
          from_wallet_id: userWallet.id,
        },
        { transaction: t }
      );

      // Step 4: Create escrow record
      const escrow = await Escrow.create(
        {
          transaction_id: tx.id,
          from_user_id: userId,
          agent_id: agentId || null,
          token_type: tokenType,
          amount: amt,
          status: "locked",
          metadata,
          expires_at: new Date(
            Date.now() + ESCROW_CONFIG.TIMEOUT_HOURS * 3600 * 1000
          ),
        },
        { transaction: t }
      );

      return { tx, escrow };
    });
  },

  /**
   * =====================================================
   * FINALIZE BURN (Agent Confirms Fiat Payment)
   * =====================================================
   * Description:
   *  - Agent confirms fiat has been sent to user.
   *  - Tokens in escrow are officially burned.
   *  - User’s pending balance decreases.
   *  - Agent’s capacity increases accordingly.
   *
   * Flow:
   *  1. Fetch escrow and related transaction.
   *  2. Validate status (must be “locked”).
   *  3. Deduct pending tokens from user’s wallet.
   *  4. Increase agent capacity (optional).
   *  5. Mark transaction & escrow as COMPLETED.
   */
  async finalizeBurn(escrowId, evidence = {}) {
    return sequelize.transaction(async (t) => {
      // Step 1: Validate escrow
      const escrow = await Escrow.findByPk(escrowId, { transaction: t });
      if (!escrow) throw new ApiError("Escrow not found", 404);
      if (escrow.status !== "locked") {
        throw new ApiError("Escrow not in locked state", 400);
      }

      // Step 2: Fetch transaction and user wallet
      const tx = await Transaction.findByPk(escrow.transaction_id, {
        transaction: t,
      });
      if (!tx) throw new ApiError("Related transaction not found", 404);

      const userWallet = await Wallet.findOne({
        where: { user_id: escrow.from_user_id, token_type: escrow.token_type },
        transaction: t,
      });
      if (!userWallet) throw new ApiError("User wallet not found", 404);

      // Step 3: Reduce pending balance (burn tokens)
      userWallet.pending_balance = Math.max(
        0,
        parseFloat(userWallet.pending_balance) - parseFloat(escrow.amount)
      );
      await userWallet.save({ transaction: t });

      // Step 4: Increase agent’s capacity (optional)
      if (escrow.agent_id) {
        const agent = await Agent.findByPk(escrow.agent_id, { transaction: t });
        if (agent) {
          agent.available_capacity += parseFloat(escrow.amount);
          agent.total_burned += parseFloat(escrow.amount);
          await agent.save({ transaction: t });
        }
      }

      // Step 5: Update transaction and escrow records
      tx.status = TRANSACTION_STATUS.COMPLETED;
      tx.metadata = { ...(tx.metadata || {}), finalize_evidence: evidence };
      await tx.save({ transaction: t });

      escrow.status = "completed";
      escrow.metadata = {
        ...(escrow.metadata || {}),
        finalize_evidence: evidence,
      };
      await escrow.save({ transaction: t });

      return { tx, escrow };
    });
  },

  /**
   * =====================================================
   * REFUND ESCROW (Cancel or Admin Action)
   * =====================================================
   * Description:
   *  - Returns escrowed tokens to user’s wallet.
   *  - Used when a burn is cancelled or dispute resolves in user’s favor.
   *
   * Flow:
   *  1. Validate escrow and transaction.
   *  2. Deduct from pending → credit back to balance.
   *  3. Update statuses to REFUNDED.
   */
  async refundEscrow(escrowId, adminNotes = {}) {
    return sequelize.transaction(async (t) => {
      // Step 1: Fetch escrow
      const escrow = await Escrow.findByPk(escrowId, { transaction: t });
      if (!escrow) throw new ApiError("Escrow not found", 404);
      if (!["locked", "disputed"].includes(escrow.status)) {
        throw new ApiError(
          "Escrow cannot be refunded in its current state",
          400
        );
      }

      // Step 2: Fetch transaction & wallet
      const tx = await Transaction.findByPk(escrow.transaction_id, {
        transaction: t,
      });
      if (!tx) throw new ApiError("Related transaction not found", 404);

      const userWallet = await Wallet.findOne({
        where: { user_id: escrow.from_user_id, token_type: escrow.token_type },
        transaction: t,
      });
      if (!userWallet) throw new ApiError("User wallet not found", 404);

      // Step 3: Move funds back from pending → balance
      const amt = parseFloat(escrow.amount);
      userWallet.pending_balance = Math.max(
        0,
        parseFloat(userWallet.pending_balance) - amt
      );
      userWallet.balance = parseFloat(userWallet.balance) + amt;
      await userWallet.save({ transaction: t });

      // Step 4: Update transaction and escrow
      tx.status = TRANSACTION_STATUS.REFUNDED;
      tx.metadata = { ...(tx.metadata || {}), refund_admin_notes: adminNotes };
      await tx.save({ transaction: t });

      escrow.status = "refunded";
      escrow.metadata = {
        ...(escrow.metadata || {}),
        refund_admin_notes: adminNotes,
      };
      await escrow.save({ transaction: t });

      return { tx, escrow };
    });
  },

  /**
   * =====================================================
   * AUTO PROCESS EXPIRED ESCROWS (Background Job)
   * =====================================================
   * Description:
   *  - Periodically checks for expired escrows.
   *  - If agent assigned → open dispute automatically.
   *  - If no agent → refund user automatically.
   *  - Keeps system clean and prevents stuck escrows.
   */
  async processExpiredEscrows(limit = 50) {
    const now = new Date();

    // Step 1: Find expired & locked escrows
    const expired = await Escrow.findAll({
      where: {
        status: "locked",
        expires_at: { [Escrow.sequelize.Sequelize.Op.lt]: now },
      },
      limit,
    });

    const results = [];

    // Step 2: Process each expired escrow
    for (const esc of expired) {
      if (esc.agent_id) {
        // If agent assigned → open dispute automatically
        const dispute = await disputeService.openDispute({
          escrowId: esc.id,
          transactionId: esc.transaction_id,
          openedByUserId: esc.from_user_id,
          agentId: esc.agent_id,
          reason: "auto_expired",
          details:
            "Escrow expired without agent confirmation - auto dispute opened",
        });
        results.push({
          escrow: esc,
          action: "dispute_opened",
          disputeId: dispute.id,
        });
      } else {
        // No agent assigned → refund automatically
        const { escrow: refundedEscrow } = await this.refundEscrow(esc.id, {
          auto: true,
          reason: "expired_no_agent",
        });
        results.push({ escrow: refundedEscrow, action: "refunded" });
      }
    }

    return results;
  },
};

module.exports = escrowService;
