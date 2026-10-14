// File: src/services/transactionService.js
const { sequelize } = require("../config/database");
const {
  Transaction,
  Wallet,
  MintRequest,
  BurnRequest,
  User,
  Agent,
  Merchant,
} = require("../models");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  MINT_REQUEST_STATUS,
  EXCHANGE_RATES,
  AGENT_CONFIG,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { generateTransactionReference } = require("../utils/helpers");
const walletService = require("./walletService");
const platformService = require("./platformService");
const commissionService = require("./commissionService");
const { deliver } = require("./notificationService");
const Money = require("../utils/money");

/** Convert token amount to USDT using exchange rates (capacity and earnings are in USDT). */
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
 * Handles creation, wallet debits/credits, and status transitions for transactions.
 * Ensures atomic consistency across wallets and transactions.
 */
const transactionService = {
  /**
   * Process a peer-to-peer (user to user) transfer.
   */
  async processUserTransfer(
    senderId,
    receiverId,
    amount,
    token_type,
    description
  ) {
    return sequelize.transaction(async (t) => {
      const senderWallet = await Wallet.findOne({
        where: { user_id: senderId, token_type },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!senderWallet) {
        throw new ApiError("Sender wallet not found", 404);
      }

      // Auto-create/fetch receiver wallet with row lock
      const receiverWallet = await walletService.getOrCreateWallet(
        receiverId,
        token_type,
        t,
        t.LOCK.UPDATE
      );

      const senderBalance = parseFloat(senderWallet.balance);
      if (senderBalance < parseFloat(amount)) {
        throw new ApiError("Insufficient balance", 400);
      }

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.TRANSFER,
          status: TRANSACTION_STATUS.PENDING,
          amount,
          token_type,
          description: description || "User transfer",
          from_user_id: senderId,
          to_user_id: receiverId,
          from_wallet_id: senderWallet.id,
          to_wallet_id: receiverWallet.id,
        },
        { transaction: t }
      );

      // Perform debit/credit using precision Money math
      senderWallet.balance = Money.sub(senderBalance, amount);
      receiverWallet.balance = Money.add(receiverWallet.balance, amount);

      await senderWallet.save({ transaction: t });
      await receiverWallet.save({ transaction: t });

      tx.status = TRANSACTION_STATUS.COMPLETED;
      await tx.save({ transaction: t });

      return tx;
    }).then(async (tx) => {
      // Notify receiver about incoming transfer (fire-and-forget, outside DB tx)
      try {
        await deliver(receiverId, "TRANSFER_RECEIVED", {
          title: "Transfer Received",
          message: `You received ${Number(tx.amount).toFixed(2)} ${tx.token_type} tokens.`,
          data: { transaction_id: String(tx.id), reference: tx.reference },
        });
      } catch (e) {
        console.error("TRANSFER_RECEIVED notify failed:", e.message);
      }
      return tx;
    });
  },

  /**
   * Process a merchant payment (customer paying a business).
   */
  async processMerchantPayment(
    customerId,
    merchantId,
    amount,
    token_type,
    description
  ) {
    return sequelize.transaction(async (t) => {
      const merchant = await Merchant.findByPk(merchantId, { transaction: t });
      if (!merchant) throw new ApiError("Merchant not found", 404);

      const customerWallet = await Wallet.findOne({
        where: { user_id: customerId, token_type },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const merchantWallet = await Wallet.findByPk(
        merchant.settlement_wallet_id,
        { transaction: t, lock: t.LOCK.UPDATE }
      );

      if (!customerWallet || !merchantWallet) {
        throw new ApiError("Wallet not found", 404);
      }

      const customerBalance = parseFloat(customerWallet.balance);
      if (customerBalance < parseFloat(amount)) {
        throw new ApiError("Insufficient balance", 400);
      }

      const feePercent = parseFloat(merchant.payment_fee_percent) || 2.0;
      const fee = Money.div(Money.mul(amount, feePercent), 100);
      const netAmount = Money.sub(amount, fee);

      // Collect platform fee to platform wallet
      let feeWalletId = null;
      if (fee > 0) {
        const feeWallet = await platformService.collectFee({
          tokenType: token_type,
          feeAmount: fee,
          transactionType: "merchant_collection",
          dbTransaction: t,
        });
        if (feeWallet) feeWalletId = feeWallet.id;
      }

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.PENDING,
          amount,
          fee,
          token_type,
          description: description || "Merchant payment",
          from_user_id: customerId,
          to_user_id: merchant.user_id,
          merchant_id: merchant.id,
          from_wallet_id: customerWallet.id,
          to_wallet_id: merchantWallet.id,
          fee_wallet_id: feeWalletId,
        },
        { transaction: t }
      );

      // Perform debit/credit using precision Money math
      customerWallet.balance = Money.sub(customerBalance, amount);
      merchantWallet.balance = Money.add(merchantWallet.balance, netAmount);

      await customerWallet.save({ transaction: t });
      await merchantWallet.save({ transaction: t });

      tx.status = TRANSACTION_STATUS.COMPLETED;
      await tx.save({ transaction: t });

      // Optional: webhook notification
      // await webhookService.notifyMerchantPayment(merchant.webhook_url, tx);

      return tx;
    });
  },

  /**
   * Refund a transaction (reverse operation).
   */
  async refundTransaction(transactionId) {
    return sequelize.transaction(async (t) => {
      const tx = await Transaction.findByPk(transactionId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!tx) throw new ApiError("Transaction not found", 404);
      if (tx.status !== TRANSACTION_STATUS.COMPLETED) {
        throw new ApiError("Only completed transactions can be refunded", 400);
      }

      const fromWallet = await Wallet.findByPk(tx.from_wallet_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const toWallet = await Wallet.findByPk(tx.to_wallet_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!fromWallet || !toWallet) {
        throw new ApiError("Wallet not found", 404);
      }

      const fee = parseFloat(tx.fee) || 0;
      const grossAmount = parseFloat(tx.amount);
      // For collection/merchant payments, recipient was only credited net (gross - fee)
      const recipientCreditedAmount =
        tx.type === TRANSACTION_TYPES.COLLECTION
          ? Math.max(0, Money.sub(grossAmount, fee))
          : grossAmount;

      const toBalance = parseFloat(toWallet.balance) || 0;
      if (toBalance < recipientCreditedAmount) {
        throw new ApiError("Recipient has insufficient balance for refund", 400);
      }

      // Reverse funds using precision Money math
      toWallet.balance = Money.sub(toBalance, recipientCreditedAmount);
      fromWallet.balance = Money.add(fromWallet.balance, grossAmount);

      await toWallet.save({ transaction: t });
      await fromWallet.save({ transaction: t });

      // If a platform fee was collected, reverse it from platform treasury
      if (fee > 0 && tx.type === TRANSACTION_TYPES.COLLECTION) {
        const platformWallet = await platformService.getPlatformWallet(tx.token_type, t);
        if (!platformWallet || parseFloat(platformWallet.balance) < fee) {
          throw new ApiError(
            `Platform fee cannot be reversed: insufficient platform treasury balance for ${tx.token_type}`,
            400
          );
        }
        platformWallet.balance = Money.sub(platformWallet.balance, fee);
        await platformWallet.save({ transaction: t });
      }

      tx.status = TRANSACTION_STATUS.REFUNDED;
      await tx.save({ transaction: t });

      return tx;
    });
  },

  /**
   * Process an agent sale (agent minting tokens to user)
   * Called ONLY from mint request flow (after proof)
   */
  async processAgentMint(userId, agentId, amount, token_type, metadata = {}, t = null) {
    const work = async (innerT) => {
      // Find agent and validate with row lock
      const agent = await Agent.findByPk(agentId, {
        transaction: innerT,
        lock: innerT.LOCK.UPDATE,
      });
      if (!agent || agent.status !== "active") {
        throw new ApiError("Agent not available or inactive", 400);
      }

      // Auto-create/fetch wallets with row locks
      const userWallet = await walletService.getOrCreateWallet(
        userId,
        token_type,
        innerT,
        innerT.LOCK.UPDATE
      );

      const agentWallet = await walletService.getOrCreateWallet(
        agent.user_id,
        token_type,
        innerT,
        innerT.LOCK.UPDATE
      );

      const amountNum = parseFloat(amount);
      const amountUsdt = tokenAmountToUsdt(amount, token_type);
      const isAdminResolved = metadata?.admin_resolved === true;
      const feeMode = metadata?.fee_mode || "deduct";

      // Calculate fee breakdown (Agent Commission + Platform Facilitation Fee)
      const feeBreakdown = commissionService.calculateExchangeFees({
        amount: amountNum,
        commission_rate: agent.commission_rate ? parseFloat(agent.commission_rate) * 100 : 1.0,
        tier: agent.tier,
        fee_mode: feeMode,
      });

      // Check agent capacity (in USDT)
      if (parseFloat(agent.available_capacity) < amountUsdt) {
        throw new ApiError("Agent has insufficient capacity to mint", 400);
      }

      // Create transaction
      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.MINT,
          status: TRANSACTION_STATUS.PENDING,
          amount: feeMode === "add_on_top" ? feeBreakdown.gross_amount : amount,
          token_type,
          description: metadata.description || "Agent mint via request flow",
          metadata: {
            ...metadata,
            fee_breakdown: feeBreakdown,
          },
          from_user_id: agent.user_id,
          to_user_id: userId,
          agent_id: agent.id,
          from_wallet_id: agentWallet.id,
          to_wallet_id: userWallet.id,
        },
        { transaction: innerT }
      );

      // Update balances using precision Money math
      userWallet.balance = Money.add(userWallet.balance, feeBreakdown.net_amount);
      agent.available_capacity = Money.sub(agent.available_capacity, amountUsdt);
      agent.total_minted = Money.add(agent.total_minted, amountNum);

      // Admin-resolved credits should not generate agent commission.
      let commissionToken = 0;
      if (!isAdminResolved) {
        commissionToken = feeBreakdown.agent_commission;
        const commissionUsdt = tokenAmountToUsdt(commissionToken, token_type);
        agent.total_earnings = Money.add(agent.total_earnings || 0, commissionUsdt);

        // Collect platform facilitation fee into platform treasury wallet
        if (feeBreakdown.platform_fee > 0) {
          await platformService.collectFee({
            tokenType: token_type,
            feeAmount: feeBreakdown.platform_fee,
            transactionType: TRANSACTION_TYPES.MINT,
            transactionId: tx.id,
            dbTransaction: innerT,
          });
        }
      }

      await userWallet.save({ transaction: innerT });

      // ✅ Anti-gaming: Only update fairness-queue timestamp for meaningful transactions
      if (amountUsdt >= AGENT_CONFIG.MIN_ROUTING_TX_LIMIT_USD) {
        agent.capacity_last_used_at = new Date();
      }

      await agent.save({ transaction: innerT });

      // ✅ Record total transaction fee (Agent Commission + Platform Fee)
      tx.fee = feeBreakdown.total_fee;

      // Complete
      tx.status = TRANSACTION_STATUS.COMPLETED;
      await tx.save({ transaction: innerT });

      return tx;
    };

    if (t) return work(t);
    return sequelize.transaction(work);
  },

  /**
   * Process agent buyback (user burning tokens to agent)
   */
  async processAgentBuyback(userId, agentId, amount, token_type, metadata = {}, t = null) {
    const work = async (innerT) => {
      // Lock the agent row to prevent concurrent capacity mutations
      const agent = await Agent.findByPk(agentId, {
        transaction: innerT,
        lock: innerT.LOCK.UPDATE,
      });
      if (!agent || agent.status !== "active") {
        throw new ApiError("Agent not available or inactive", 400);
      }

      // Acquire row locks on both wallets before reading balances
      const userWallet = await Wallet.findOne({
        where: { user_id: userId, token_type },
        transaction: innerT,
        lock: innerT.LOCK.UPDATE,
      });
      const agentWallet = await Wallet.findOne({
        where: { user_id: agent.user_id, token_type },
        transaction: innerT,
        lock: innerT.LOCK.UPDATE,
      });

      if (!userWallet || !agentWallet) {
        throw new ApiError("Wallet not found", 404);
      }

      if (parseFloat(userWallet.balance) < parseFloat(amount)) {
        throw new ApiError("Insufficient user token balance", 400);
      }

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.BURN,
          status: TRANSACTION_STATUS.PENDING,
          amount,
          token_type,
          description: metadata.description || "Agent burn via request flow",
          metadata: metadata, // ✅ Store metadata including request_id
          from_user_id: userId,
          to_user_id: agent.user_id,
          agent_id: agent.id,
          from_wallet_id: userWallet.id,
          to_wallet_id: agentWallet.id,
        },
        { transaction: innerT }
      );

      // Only deduct from user wallet balance here — the burn is still PENDING (in escrow).
      // Do NOT increment agent.total_burned yet; that happens in escrowService.finalizeBurn()
      // when the burn is confirmed. Incrementing here AND in finalizeBurn causes double-counting
      // which makes outstanding_tokens go negative and breaks the withdrawal limit calculation.
      userWallet.balance = Money.sub(userWallet.balance, amount);

      await userWallet.save({ transaction: innerT });

      // Commission is recorded in finalizeBurn() when the escrow is confirmed.
      // The transaction stays PENDING until finalizeBurn completes it.
      await tx.save({ transaction: innerT });

      return tx;
    };

    if (t) return work(t);
    return sequelize.transaction(work);
  },

  // // ============================================
  // // TRANSACTION QUERIES
  // // ============================================

  // /**
  //  * Get transaction history for a user
  //  */
  // async getUserTransactions(userId, options = {}) {
  //   const {
  //     limit = 50,
  //     offset = 0,
  //     tokenType = null,
  //     type = null,
  //     status = null,
  //   } = options;

  //   const where = {
  //     [sequelize.Op.or]: [{ from_user_id: userId }, { to_user_id: userId }],
  //   };

  //   if (tokenType) where.token_type = tokenType;
  //   if (type) where.type = type;
  //   if (status) where.status = status;

  //   const transactions = await Transaction.findAndCountAll({
  //     where,
  //     limit,
  //     offset,
  //     order: [["created_at", "DESC"]],
  //     include: [
  //       {
  //         model: User,
  //         as: "fromUser",
  //         attributes: ["id", "email", "full_name"],
  //       },
  //       {
  //         model: User,
  //         as: "toUser",
  //         attributes: ["id", "email", "full_name"],
  //       },
  //     ],
  //   });

  //   return {
  //     transactions: transactions.rows,
  //     total: transactions.count,
  //     limit,
  //     offset,
  //   };
  // },

  // /**
  //  * Get a specific transaction by reference
  //  */
  // async getTransactionByReference(reference) {
  //   const transaction = await Transaction.findOne({
  //     where: { reference },
  //     include: [
  //       {
  //         model: User,
  //         as: "fromUser",
  //         attributes: ["id", "email", "full_name"],
  //       },
  //       {
  //         model: User,
  //         as: "toUser",
  //         attributes: ["id", "email", "full_name"],
  //       },
  //     ],
  //   });

  //   if (!transaction) {
  //     throw new ApiError("Transaction not found", 404);
  //   }

  //   return transaction;
  // },

  // /**
  //  * Get transaction statistics for a user
  //  */
  // async getUserTransactionStats(userId, tokenType = null) {
  //   const where = {
  //     [sequelize.Op.or]: [{ from_user_id: userId }, { to_user_id: userId }],
  //     status: TRANSACTION_STATUS.COMPLETED,
  //   };

  //   if (tokenType) where.token_type = tokenType;

  //   const stats = await Transaction.findAll({
  //     attributes: [
  //       "token_type",
  //       [sequelize.fn("COUNT", sequelize.col("id")), "count"],
  //       [sequelize.fn("SUM", sequelize.col("amount")), "total_volume"],
  //     ],
  //     where,
  //     group: ["token_type"],
  //     raw: true,
  //   });

  //   return stats;
  // },
};

module.exports = transactionService;
