// src/services/transactionService.js
const { sequelize } = require("../config/database");
const { Transaction, Wallet, Merchant, Agent, User } = require("../models");
const walletService = require("./walletService");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} = require("../config/constants");
const { generateTransactionReference } = require("../utils/helpers");
const { ApiError } = require("../utils/errors");

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
    currency,
    description
  ) {
    return sequelize.transaction(async (t) => {
      const senderWallet = await Wallet.findOne({
        where: { user_id: senderId, currency },
      });
      const receiverWallet = await Wallet.findOne({
        where: { user_id: receiverId, currency },
      });

      if (!senderWallet || !receiverWallet)
        throw new ApiError("Wallet not found for one of the users", 404);

      const senderBalance = parseFloat(senderWallet.balance);
      if (senderBalance < parseFloat(amount))
        throw new ApiError("Insufficient balance", 400);

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.TRANSFER,
          status: TRANSACTION_STATUS.PENDING,
          amount,
          currency,
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
    currency,
    description
  ) {
    return sequelize.transaction(async (t) => {
      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) throw new ApiError("Merchant not found", 404);

      const customerWallet = await Wallet.findOne({
        where: { user_id: customerId, currency },
      });
      const merchantWallet = await Wallet.findByPk(
        merchant.settlement_wallet_id
      );

      if (!customerWallet || !merchantWallet)
        throw new ApiError("Wallet not found", 404);

      const customerBalance = parseFloat(customerWallet.balance);
      if (customerBalance < parseFloat(amount))
        throw new ApiError("Insufficient balance", 400);

      const feePercent = parseFloat(merchant.payment_fee_percent) || 2.0;
      const fee = (parseFloat(amount) * feePercent) / 100;
      const netAmount = parseFloat(amount) - fee;

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.PENDING,
          amount,
          fee,
          currency,
          description: description || "Merchant payment",
          from_user_id: customerId,
          to_user_id: merchant.user_id,
          merchant_id: merchant.id,
          from_wallet_id: customerWallet.id,
          to_wallet_id: merchantWallet.id,
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
      if (tx.status !== TRANSACTION_STATUS.COMPLETED)
        throw new ApiError("Only completed transactions can be refunded", 400);

      const fromWallet = await Wallet.findByPk(tx.from_wallet_id);
      const toWallet = await Wallet.findByPk(tx.to_wallet_id);

      if (!fromWallet || !toWallet) throw new ApiError("Wallet not found", 404);

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
  async processAgentMint(userId, agentId, amount, token_type) {
    return sequelize.transaction(async (t) => {
      // Find agent and validate
      const agent = await Agent.findByPk(agentId, { transaction: t });
      if (!agent || agent.status !== "active") {
        throw new ApiError("Agent not available or inactive", 400);
      }

      // Find wallets
      const userWallet = await Wallet.findOne({
        where: { user_id: userId, token_type },
        transaction: t,
      });
      const agentWallet = await Wallet.findOne({
        where: { user_id: agent.user_id, token_type },
        transaction: t,
      });
      if (!userWallet || !agentWallet) {
        throw new ApiError("Wallet not found", 404);
      }

      // Check agent capacity
      if (parseFloat(agent.available_capacity) < parseFloat(amount)) {
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
          description: "Agent mint via request flow",
          from_user_id: agent.user_id,
          to_user_id: userId,
          agent_id: agent.id,
          from_wallet_id: agentWallet.id,
          to_wallet_id: userWallet.id,
        },
        { transaction: t }
      );

      // Update balances
      userWallet.balance = parseFloat(userWallet.balance) + parseFloat(amount);
      agent.available_capacity -= parseFloat(amount);
      agent.total_minted += parseFloat(amount);

      await userWallet.save({ transaction: t });
      await agent.save({ transaction: t });

      // Complete
      tx.status = TRANSACTION_STATUS.COMPLETED;
      await tx.save({ transaction: t });

      return tx;
    });
  },

  /**
   * Process agent buyback (user burning tokens to agent)
   */
  async processAgentBuyback(userId, agentId, amount, token_type) {
    return sequelize.transaction(async (t) => {
      const agent = await Agent.findByPk(agentId, { transaction: t });
      if (!agent || agent.status !== "active") {
        throw new ApiError("Agent not available or inactive", 400);
      }

      const userWallet = await Wallet.findOne({
        where: { user_id: userId, token_type },
        transaction: t,
      });
      const agentWallet = await Wallet.findOne({
        where: { user_id: agent.user_id, token_type },
        transaction: t,
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
          description: "Agent burn via request flow",
          from_user_id: userId,
          to_user_id: agent.user_id,
          agent_id: agent.id,
          from_wallet_id: userWallet.id,
          to_wallet_id: agentWallet.id,
        },
        { transaction: t }
      );

      userWallet.balance -= parseFloat(amount);
      agent.available_capacity += parseFloat(amount);
      agent.total_burned += parseFloat(amount);

      await userWallet.save({ transaction: t });
      await agent.save({ transaction: t });

      tx.status = TRANSACTION_STATUS.COMPLETED;
      await tx.save({ transaction: t });

      return tx;
    });
  },
};

module.exports = transactionService;
