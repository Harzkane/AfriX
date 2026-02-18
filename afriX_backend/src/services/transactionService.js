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
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { generateTransactionReference } = require("../utils/helpers");
const walletService = require("./walletService");
const platformService = require("./platformService");

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
      });

      if (!senderWallet) {
        throw new ApiError("Sender wallet not found", 404);
      }

      // ✅ Auto-create receiver wallet if it doesn't exist
      const receiverWallet = await walletService.getOrCreateWallet(
        receiverId,
        token_type,
        t
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

      // Perform debit/credit
      senderWallet.balance = senderBalance - parseFloat(amount);
      receiverWallet.balance =
        parseFloat(receiverWallet.balance) + parseFloat(amount);

      await senderWallet.save({ transaction: t });
      await receiverWallet.save({ transaction: t });

      tx.status = TRANSACTION_STATUS.COMPLETED;
      await tx.save({ transaction: t });

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
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) throw new ApiError("Merchant not found", 404);

      const customerWallet = await Wallet.findOne({
        where: { user_id: customerId, token_type },
        transaction: t,
      });
      const merchantWallet = await Wallet.findByPk(
        merchant.settlement_wallet_id,
        { transaction: t }
      );

      if (!customerWallet || !merchantWallet) {
        throw new ApiError("Wallet not found", 404);
      }

      const customerBalance = parseFloat(customerWallet.balance);
      if (customerBalance < parseFloat(amount)) {
        throw new ApiError("Insufficient balance", 400);
      }

      const feePercent = parseFloat(merchant.payment_fee_percent) || 2.0;
      const fee = (parseFloat(amount) * feePercent) / 100;
      const netAmount = parseFloat(amount) - fee;

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

      // Perform debit/credit
      customerWallet.balance = customerBalance - parseFloat(amount);
      merchantWallet.balance = parseFloat(merchantWallet.balance) + netAmount;

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
      const tx = await Transaction.findByPk(transactionId);
      if (!tx) throw new ApiError("Transaction not found", 404);
      if (tx.status !== TRANSACTION_STATUS.COMPLETED) {
        throw new ApiError("Only completed transactions can be refunded", 400);
      }

      const fromWallet = await Wallet.findByPk(tx.from_wallet_id);
      const toWallet = await Wallet.findByPk(tx.to_wallet_id);

      if (!fromWallet || !toWallet) {
        throw new ApiError("Wallet not found", 404);
      }

      // Reverse funds
      toWallet.balance = parseFloat(toWallet.balance) - parseFloat(tx.amount);
      fromWallet.balance =
        parseFloat(fromWallet.balance) + parseFloat(tx.amount);

      await toWallet.save({ transaction: t });
      await fromWallet.save({ transaction: t });

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
      // Find agent and validate
      const agent = await Agent.findByPk(agentId, { transaction: innerT });
      if (!agent || agent.status !== "active") {
        throw new ApiError("Agent not available or inactive", 400);
      }

      // ✅ Use getOrCreateWallet to ensure user wallet exists
      const userWallet = await walletService.getOrCreateWallet(
        userId,
        token_type,
        innerT
      );

      // ✅ Use getOrCreateWallet for agent too (agents are users)
      const agentWallet = await walletService.getOrCreateWallet(
        agent.user_id,
        token_type,
        innerT
      );

      const amountNum = parseFloat(amount);
      const amountUsdt = tokenAmountToUsdt(amount, token_type);

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
          amount,
          token_type,
          description: metadata.description || "Agent mint via request flow",
          metadata: metadata, // ✅ Store metadata including request_id
          from_user_id: agent.user_id,
          to_user_id: userId,
          agent_id: agent.id,
          from_wallet_id: agentWallet.id,
          to_wallet_id: userWallet.id,
        },
        { transaction: innerT }
      );

      // Update balances (wallets in token; capacity in USDT)
      userWallet.balance = parseFloat(userWallet.balance) + amountNum;
      agent.available_capacity -= amountUsdt;
      agent.total_minted += amountNum;

      // Commission in token, convert to USDT for total_earnings
      const commissionRate = agent.commission_rate || 0.01;
      const commissionToken = amountNum * commissionRate;
      const commissionUsdt = tokenAmountToUsdt(commissionToken, token_type);
      agent.total_earnings = (parseFloat(agent.total_earnings) || 0) + commissionUsdt;

      await userWallet.save({ transaction: innerT });
      await agent.save({ transaction: innerT });

      // ✅ NEW: Record commission in transaction fee
      tx.fee = commissionToken;

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
      const agent = await Agent.findByPk(agentId, { transaction: innerT });
      if (!agent || agent.status !== "active") {
        throw new ApiError("Agent not available or inactive", 400);
      }

      const userWallet = await Wallet.findOne({
        where: { user_id: userId, token_type },
        transaction: innerT,
      });
      const agentWallet = await Wallet.findOne({
        where: { user_id: agent.user_id, token_type },
        transaction: innerT,
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

      const amountNum = parseFloat(amount);
      const amountUsdt = tokenAmountToUsdt(amount, token_type);

      userWallet.balance -= amountNum;
      agent.available_capacity += amountUsdt;
      agent.total_burned += amountNum;

      // Commission in token, convert to USDT for total_earnings
      const commissionRate = agent.commission_rate || 0.01;
      const commissionToken = amountNum * commissionRate;
      const commissionUsdt = tokenAmountToUsdt(commissionToken, token_type);
      agent.total_earnings = (parseFloat(agent.total_earnings) || 0) + commissionUsdt;

      await userWallet.save({ transaction: innerT });
      await agent.save({ transaction: innerT });

      // ✅ NEW: Record commission in transaction fee
      tx.fee = commissionToken;

      tx.status = TRANSACTION_STATUS.COMPLETED;
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
