// File: src/services/agentService.js

/**
 * Agent Service
 * -----------------------------------------------------
 * Handles core agent-related financial operations:
 * - Minting (fiat → token)
 * - Burning (token → fiat)
 * - Agent registration and listing
 * - Reviews and ratings
 * -----------------------------------------------------
 * This service ensures transactional integrity between
 * agents, users, and wallets. All balance changes occur
 * atomically within Sequelize-managed DB transactions.
 */

const { sequelize } = require("../config/database");
const blockchainService = require("./blockchainService");
const { TREASURY_ADDRESS } = require("../config/treasury");
const { Agent, User, Wallet, Transaction, AgentReview } = require("../models");
const { WITHDRAWAL_STATUS } = require("../config/constants");
const WithdrawalRequest = require("../models/WithdrawalRequest");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  AGENT_STATUS,
  AGENT_TIERS,
  AGENT_CONFIG,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { generateTransactionReference } = require("../utils/helpers");
const { sendPush } = require("./notificationService");
const { Op } = require("sequelize");

const agentService = {
  /**
   * =====================================================
   * MINT TOKENS
   * =====================================================
   * Description:
   * - User pays fiat to an agent.
   * - Agent mints (issues) tokens to the user's wallet.
   * - Agent's available capacity decreases.
   *
   * Flow:
   * 1. Validate agent status and wallet existence.
   * 2. Check agent's capacity >= amount to mint.
   * 3. Create transaction record (type = MINT).
   * 4. Credit user's wallet balance.
   * 5. Reduce agent's available capacity.
   * 6. Mark transaction as COMPLETED.
   */
  async mintTokens(agentId, userId, amount, currency, description) {
    return sequelize.transaction(async (t) => {
      const agent = await Agent.findByPk(agentId, { transaction: t });
      if (!agent || agent.status !== AGENT_STATUS.ACTIVE) {
        throw new ApiError("Agent not available or inactive", 400);
      }

      const userWallet = await Wallet.findOne({
        where: { user_id: userId, currency },
        transaction: t,
      });
      const agentWallet = await Wallet.findOne({
        where: { user_id: agent.user_id, currency },
        transaction: t,
      });
      if (!userWallet || !agentWallet)
        throw new ApiError("Wallet not found", 404);

      if (parseFloat(agent.available_capacity) < parseFloat(amount)) {
        throw new ApiError("Agent has insufficient capacity to mint", 400);
      }

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.MINT,
          status: TRANSACTION_STATUS.PENDING,
          amount,
          currency,
          description: description || "Mint tokens to user",
          from_user_id: agent.user_id,
          to_user_id: userId,
          agent_id: agent.id,
          from_wallet_id: agentWallet.id,
          to_wallet_id: userWallet.id,
        },
        { transaction: t }
      );

      userWallet.balance = parseFloat(userWallet.balance) + parseFloat(amount);
      agent.available_capacity -= parseFloat(amount);
      agent.total_minted += parseFloat(amount);

      await userWallet.save({ transaction: t });
      await agent.save({ transaction: t });

      tx.status = TRANSACTION_STATUS.COMPLETED;
      await tx.save({ transaction: t });

      return tx;
    });
  },

  /**
   * =====================================================
   * BURN TOKENS
   * =====================================================
   * Description:
   * - User sells tokens to an agent.
   * - Agent pays fiat externally.
   * - Tokens are "burned" from user wallet.
   * - Agent's available capacity increases.
   *
   * Flow:
   * 1. Validate agent and wallets.
   * 2. Ensure user has enough balance.
   * 3. Create burn transaction.
   * 4. Deduct tokens from user wallet.
   * 5. Increase agent's capacity.
   * 6. Mark transaction as COMPLETED.
   */
  async burnTokens(userId, agentId, amount, currency, description) {
    return sequelize.transaction(async (t) => {
      const agent = await Agent.findByPk(agentId, { transaction: t });
      if (!agent || agent.status !== AGENT_STATUS.ACTIVE) {
        throw new ApiError("Agent not available or inactive", 400);
      }

      const userWallet = await Wallet.findOne({
        where: { user_id: userId, currency },
        transaction: t,
      });
      const agentWallet = await Wallet.findOne({
        where: { user_id: agent.user_id, currency },
        transaction: t,
      });
      if (!userWallet || !agentWallet)
        throw new ApiError("Wallet not found", 404);

      if (parseFloat(userWallet.balance) < parseFloat(amount)) {
        throw new ApiError("Insufficient user token balance", 400);
      }

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.BURN,
          status: TRANSACTION_STATUS.PENDING,
          amount,
          currency,
          description: description || "User selling tokens to agent",
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

  /**
   * =====================================================
   * UPDATE AGENT PROFILE
   * =====================================================
   * Description:
   * - Allows an agent to update contact info, bank info, and tier.
   * - Ignores system-controlled fields like deposit, capacity, and status.
   */
  async updateProfile(agentId, updates) {
    const agent = await Agent.findByPk(agentId);
    if (!agent) throw new ApiError("Agent profile not found", 404);

    if (updates.tier && agent.status !== AGENT_STATUS.ACTIVE) {
      throw new ApiError("Only ACTIVE agents can upgrade their tier", 400);
    }

    if (updates.tier && !Object.values(AGENT_TIERS).includes(updates.tier)) {
      throw new ApiError("Invalid tier selected", 400);
    }

    if (updates.tier) {
      agent.tier = updates.tier;
      const tierCapacityMap = {
        [AGENT_TIERS.STARTER]: AGENT_CONFIG.MIN_DEPOSIT_USD,
        [AGENT_TIERS.STANDARD]: AGENT_CONFIG.RECOMMENDED_DEPOSIT_USD,
        [AGENT_TIERS.PREMIUM]: AGENT_CONFIG.PREMIUM_DEPOSIT_USD,
        [AGENT_TIERS.PLATINUM]: AGENT_CONFIG.PREMIUM_DEPOSIT_USD * 2,
      };
      agent.available_capacity =
        tierCapacityMap[updates.tier] || agent.available_capacity;

      if ([AGENT_TIERS.PREMIUM, AGENT_TIERS.PLATINUM].includes(updates.tier)) {
        agent.status = AGENT_STATUS.PENDING;
      }
    }

    const updatableFields = [
      "phone_number",
      "whatsapp_number",
      "bank_name",
      "account_number",
      "account_name",
      "withdrawal_address", // Allow updating withdrawal address
    ];
    updatableFields.forEach((field) => {
      if (updates[field] !== undefined) agent[field] = updates[field];
    });

    await agent.save();

    // Clear user cache so /auth/me returns fresh data
    const { deleteCache } = require("../utils/cache");
    await deleteCache(`user:${agent.user_id}`);

    return agent;
  },

  /**
   * =====================================================
   * LIST ACTIVE AGENTS
   * =====================================================
   * Description:
   * - Returns all currently active agents by country.
   * - Useful for user-facing directory or matchmaking.
   */
  async listActiveAgents(country) {
    return await Agent.findAll({
      where: { status: AGENT_STATUS.ACTIVE, country },
      attributes: ["id", "country", "tier", "rating", "available_capacity"],
    });
  },

  /**
   * =====================================================
   * REGISTER NEW AGENT
   * =====================================================
   * Description:
   * - Registers a user as an agent.
   * - Enters "PENDING" state until first deposit verified.
   * - Requires withdrawal address upfront.
   */
  async registerAgent(userId, country, currency, withdrawalAddress) {
    console.log(`[AgentService] Registering agent for user ${userId} in ${country} (${currency})`);

    // Validate withdrawal address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawalAddress)) {
      throw new ApiError("Invalid Ethereum address format", 400);
    }

    const existing = await Agent.findOne({ where: { user_id: userId } });
    if (existing) {
      console.log(`[AgentService] Agent profile already exists for user ${userId}: ${existing.id}`);
      throw new ApiError("You already have an agent profile", 400);
    }

    const newAgent = await Agent.create({
      user_id: userId,
      country,
      currency,
      withdrawal_address: withdrawalAddress.toLowerCase(),
      deposit_usd: 0,
      available_capacity: 0,
      status: AGENT_STATUS.PENDING, // Awaiting deposit
    });

    console.log(`[AgentService] Agent created successfully: ${newAgent.id}`);
    return newAgent;
  },

  /**
   * =====================================================
   * GET AGENT PROFILE
   * =====================================================
   * Description:
   * - Returns agent profile with user details.
   * - Includes deposit info, capacity, and rating.
   */
  async getProfile(agentId) {
    const agent = await Agent.findByPk(agentId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "full_name",
            "email",
            "phone_number",
            "country_code",
          ],
        },
      ],
    });

    if (!agent) throw new ApiError("Agent profile not found", 404);
    return agent;
  },

  /**
   * =====================================================
   * LIST AGENT TRANSACTIONS
   * =====================================================
   * Description:
   * - Returns all transactions for a given agent.
   * - Supports optional query filters (type, status, date range, etc.)
   */
  async listTransactions(agentId, query = {}) {
    const filters = { agent_id: agentId };
    if (query.type) filters.type = query.type;
    if (query.status) filters.status = query.status;
    if (query.startDate || query.endDate) {
      filters.created_at = {};
      if (query.startDate)
        filters.created_at[Op.gte] = new Date(query.startDate);
      if (query.endDate) filters.created_at[Op.lte] = new Date(query.endDate);
    }

    return await Transaction.findAll({
      where: filters,
      order: [["created_at", "DESC"]],
    });
  },

  /**
   * =====================================================
   * DEPOSIT CAPACITY (VERIFY BLOCKCHAIN TX)
   * =====================================================
   * Description:
   * - Agent sends USDT to platform treasury
   * - Platform verifies transaction on Polygon blockchain
   * - Increases agent's deposit and capacity
   * - Activates agent if first deposit meets minimum
   */
  async depositCapacity(agentId, amountUsd, txHash) {
    return sequelize.transaction(async (t) => {
      const agent = await Agent.findByPk(agentId, {
        transaction: t,
        lock: true,
      });

      if (!agent) throw new ApiError("Agent not found", 404);

      // VERIFY DEPOSIT ON BLOCKCHAIN
      const verification = await blockchainService.verifyDeposit(
        txHash,
        amountUsd
      );

      if (!verification.verified) {
        throw new ApiError("Deposit verification failed", 400);
      }

      const amount = parseFloat(verification.amount);

      // Update agent capacity
      agent.deposit_usd += amount;
      agent.available_capacity += amount;

      // Activate agent if first deposit and still pending
      // Minimum deposit requirement: $100
      if (agent.status === AGENT_STATUS.PENDING && agent.deposit_usd >= 100) {
        agent.status = AGENT_STATUS.ACTIVE;
      }

      await agent.save({ transaction: t });

      // Record transaction
      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.AGENT_DEPOSIT,
          status: TRANSACTION_STATUS.COMPLETED,
          amount,
          token_type: "USDT",
          description: "Agent deposit verified on Polygon",
          to_user_id: agent.user_id,
          agent_id: agent.id,
          metadata: {
            tx_hash: txHash,
            from_address: verification.from,
            block_number: verification.blockNumber,
            treasury_address: TREASURY_ADDRESS,
          },
        },
        { transaction: t }
      );

      await sendPush(
        agent.user_id,
        "Deposit Confirmed",
        `+$${amount} USDT verified. You can now mint/burn tokens!`
      );

      return { agent, transaction: tx };
    });
  },

  /**
   * =====================================================
   * CREATE WITHDRAWAL REQUEST
   * =====================================================
   * Description:
   * - Agent requests to withdraw USDT from treasury
   * - Calculates max withdrawable based on outstanding tokens
   * - Creates pending request for admin approval
   *
   * Formula:
   * outstanding = total_minted - total_burned
   * max_withdraw = deposit_usd - outstanding
   *
   * This ensures agents can't withdraw USDT backing active tokens!
   */
  async createWithdrawalRequest(agentId, amountUsd) {
    return sequelize.transaction(async (t) => {
      const agent = await Agent.findByPk(agentId, {
        transaction: t,
        lock: true,
      });
      if (!agent) throw new ApiError("Agent not found", 404);

      // Calculate tokens currently in circulation
      const outstanding = agent.total_minted - agent.total_burned;

      // Can only withdraw deposit not backing active tokens
      const maxWithdraw = agent.deposit_usd - outstanding;
      const amount = parseFloat(amountUsd);

      if (amount > maxWithdraw) {
        throw new ApiError(
          `Max withdrawable: $${maxWithdraw.toFixed(
            2
          )}. You have $${outstanding.toFixed(2)} backing active tokens.`,
          400
        );
      }

      if (amount <= 0) throw new ApiError("Invalid amount", 400);

      const request = await WithdrawalRequest.create(
        {
          agent_id: agentId,
          amount_usd: amount,
          status: WITHDRAWAL_STATUS.PENDING,
        },
        { transaction: t }
      );

      await sendPush(
        agent.user_id,
        "Withdrawal Requested",
        `$${amount} USDT sent for approval`
      );

      return {
        request,
        max_withdrawable: maxWithdraw,
        outstanding_tokens: outstanding,
      };
    });
  },

  /**
   * Get Agent Withdrawal Requests
   * @param {string} agentId
   */
  async getWithdrawalRequests(agentId) {
    return WithdrawalRequest.findAll({
      where: { agent_id: agentId },
      order: [["created_at", "DESC"]],
    });
  },

  async getDepositHistory(agentId) {
    return Transaction.findAll({
      where: {
        agent_id: agentId,
        type: TRANSACTION_TYPES.AGENT_DEPOSIT,
      },
      order: [["created_at", "DESC"]],
    });
  },

  // =====================================================
  // REVIEW & RATING METHODS (NEW)
  // =====================================================

  /**
   * =====================================================
   * SUBMIT REVIEW AND UPDATE AGENT RATING
   * =====================================================
   * Description:
   * - Creates a new review record
   * - Recalculates agent's average rating across all reviews
   * - Updates agent's rating field
   * - Sends push notification to agent
   */
  async submitReview(reviewData) {
    return sequelize.transaction(async (t) => {
      // Create the review
      const review = await AgentReview.create(reviewData, { transaction: t });

      // Fetch all reviews for this agent
      const allReviews = await AgentReview.findAll({
        where: { agent_id: reviewData.agent_id },
        attributes: ["rating"],
        transaction: t,
      });

      // Calculate new average rating
      const totalRatings = allReviews.length;
      const sumRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const newAverage = sumRatings / totalRatings;

      // Update agent's rating (rounded to 2 decimal places)
      const agent = await Agent.findByPk(reviewData.agent_id, {
        transaction: t,
      });

      if (agent) {
        agent.rating = parseFloat(newAverage.toFixed(2));
        await agent.save({ transaction: t });

        // Send push notification to agent
        await sendPush(
          agent.user_id,
          "New Review Received! ⭐",
          `You received a ${reviewData.rating}-star review. Keep up the great work!`
        );
      }

      return review;
    });
  },

  /**
   * =====================================================
   * GET AGENT RATING SUMMARY
   * =====================================================
   * Description:
   * - Returns comprehensive rating statistics for an agent
   * - Includes average, distribution, recent reviews
   */
  async getAgentRatingSummary(agentId) {
    const agent = await Agent.findByPk(agentId, {
      attributes: ["id", "rating"],
    });

    if (!agent) {
      throw new ApiError("Agent not found", 404);
    }

    const reviews = await AgentReview.findAll({
      where: { agent_id: agentId },
      attributes: ["rating", "created_at"],
      order: [["created_at", "DESC"]],
    });

    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      distribution[r.rating]++;
    });

    // Calculate percentage for each rating
    const total = reviews.length;
    const distributionPercent = {};
    Object.keys(distribution).forEach((star) => {
      distributionPercent[star] =
        total > 0 ? ((distribution[star] / total) * 100).toFixed(1) : 0;
    });

    return {
      agent_id: agent.id,
      average_rating: parseFloat(agent.rating),
      total_reviews: total,
      rating_distribution: distribution,
      rating_distribution_percent: distributionPercent,
      recent_reviews: reviews.slice(0, 5), // Last 5 reviews
    };
  },
};

module.exports = agentService;
