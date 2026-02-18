// File: src/controllers/agentController.js

const { Agent, User, Wallet, Transaction, AgentReview, sequelize } = require("../models");
const {
  AGENT_TIERS,
  AGENT_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} = require("../config/constants");
const { EXCHANGE_RATES } = require("../config/constants");
const { TREASURY_ADDRESS } = require("../config/treasury");
const { ApiError } = require("../utils/errors");
const agentService = require("../services/agentService");
const AgentKyc = require("../models/AgentKyc");
const { uploadToR2 } = require("../services/r2Service");

/**
 * Compute total minted and burned per token type from Transaction table (source of truth).
 * Returns { totalMintedByToken, totalBurnedByToken, totalMintedUsdt, totalBurnedUsdt }.
 */
async function getAgentMintBurnTotals(agentId) {
  const mintRows = await sequelize.query(
    `SELECT token_type, SUM(amount) as total FROM transactions
     WHERE agent_id = :agentId AND type = :mintType AND status = :completed
     GROUP BY token_type`,
    {
      replacements: {
        agentId,
        mintType: TRANSACTION_TYPES.MINT,
        completed: TRANSACTION_STATUS.COMPLETED,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  );
  const burnRows = await sequelize.query(
    `SELECT token_type, SUM(amount) as total FROM transactions
     WHERE agent_id = :agentId AND type = :burnType AND status = :completed
     GROUP BY token_type`,
    {
      replacements: {
        agentId,
        burnType: TRANSACTION_TYPES.BURN,
        completed: TRANSACTION_STATUS.COMPLETED,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  // Commission earned per token type (recorded in fee field)
  const earningsRows = await sequelize.query(
    `SELECT token_type, SUM(fee) as commission FROM transactions
     WHERE agent_id = :agentId AND type IN (:mintType, :burnType) AND status = :completed
     GROUP BY token_type`,
    {
      replacements: {
        agentId,
        mintType: TRANSACTION_TYPES.MINT,
        burnType: TRANSACTION_TYPES.BURN,
        completed: TRANSACTION_STATUS.COMPLETED,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const toMap = (rows, valueKey = "total") => {
    const map = { NT: 0, CT: 0, USDT: 0 };
    (rows || []).forEach((r) => {
      const key = r.token_type || "NT";
      map[key] = parseFloat(r[valueKey]) || 0;
    });
    return map;
  };

  const totalMintedByToken = toMap(mintRows);
  const totalBurnedByToken = toMap(burnRows);
  const totalEarningsByToken = toMap(earningsRows, "commission");

  const tokenToUsdt = (tokenType, amount) => {
    const rate = tokenType === "NT" ? EXCHANGE_RATES.NT_TO_USDT : tokenType === "CT" ? EXCHANGE_RATES.CT_TO_USDT : 1;
    return (parseFloat(amount) || 0) * (rate || 0);
  };

  const totalMintedByTokenUsdt = {
    NT: tokenToUsdt("NT", totalMintedByToken.NT),
    CT: tokenToUsdt("CT", totalMintedByToken.CT),
    USDT: tokenToUsdt("USDT", totalMintedByToken.USDT),
  };
  const totalBurnedByTokenUsdt = {
    NT: tokenToUsdt("NT", totalBurnedByToken.NT),
    CT: tokenToUsdt("CT", totalBurnedByToken.CT),
    USDT: tokenToUsdt("USDT", totalBurnedByToken.USDT),
  };
  const totalMintedUsdt =
    totalMintedByTokenUsdt.NT + totalMintedByTokenUsdt.CT + totalMintedByTokenUsdt.USDT;
  const totalBurnedUsdt =
    totalBurnedByTokenUsdt.NT + totalBurnedByTokenUsdt.CT + totalBurnedByTokenUsdt.USDT;

  const totalEarningsByTokenUsdt = {
    NT: tokenToUsdt("NT", totalEarningsByToken.NT),
    CT: tokenToUsdt("CT", totalEarningsByToken.CT),
    USDT: tokenToUsdt("USDT", totalEarningsByToken.USDT),
  };
  const totalEarningsUsdt =
    totalEarningsByTokenUsdt.NT + totalEarningsByTokenUsdt.CT + totalEarningsByTokenUsdt.USDT;

  return {
    totalMintedByToken,
    totalBurnedByToken,
    totalMintedByTokenUsdt,
    totalBurnedByTokenUsdt,
    totalMintedUsdt,
    totalBurnedUsdt,
    totalEarningsByToken,
    totalEarningsByTokenUsdt,
    totalEarningsUsdt,
  };
}

/**
 * Agent Controller
 * Handles agent registration, profile management, transactions, and reviews
 */
const agentController = {
  /**
   * Register as Agent
   * POST /api/agents/register
   * Body: { country, currency, withdrawal_address }
   */
  async register(req, res, next) {
    try {
      const userId = req.user.id;
      const { country, currency, withdrawal_address } = req.body;

      if (!withdrawal_address) {
        throw new ApiError("Withdrawal address is required", 400);
      }

      const agent = await agentService.registerAgent(
        userId,
        country,
        currency,
        withdrawal_address
      );

      console.log(`[AgentController] Registration successful for agent ${agent.id}, sending response.`);

      res.status(201).json({
        success: true,
        message:
          "Agent registered successfully. Please deposit USDT to activate.",
        data: {
          id: agent.id,
          tier: agent.tier,
          status: agent.status,
          withdrawal_address: agent.withdrawal_address,
          deposit_instructions: {
            send_usdt_to: TREASURY_ADDRESS,
            network: "Polygon",
            minimum_deposit: 100, // $100 minimum to activate
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get agent profile
   * GET /api/agents/profile
   */
  async getProfile(req, res, next) {
    try {
      const agent = req.agent; // From requireAgent middleware

      const totals = await getAgentMintBurnTotals(agent.id);
      const outstandingUsdt = totals.totalMintedUsdt - totals.totalBurnedUsdt;
      const maxWithdraw = Math.max(0, agent.deposit_usd - outstandingUsdt);

      // Get review count
      const totalReviews = await AgentReview.count({
        where: { agent_id: agent.id },
      });

      const data = agent.toJSON();
      data.total_minted = totals.totalMintedUsdt;
      data.total_burned = totals.totalBurnedUsdt;
      data.available_capacity = parseFloat(agent.available_capacity) ?? 0;

      res.status(200).json({
        success: true,
        data: {
          ...data,
          total_reviews: totalReviews,
          financial_summary: {
            outstanding_tokens_usdt: outstandingUsdt,
            max_withdrawable: maxWithdraw,
            total_earnings: totals.totalEarningsUsdt,
            utilization_percentage:
              agent.deposit_usd > 0
                ? ((outstandingUsdt / agent.deposit_usd) * 100).toFixed(2)
                : 0,
            total_minted_by_token: totals.totalMintedByToken,
            total_burned_by_token: totals.totalBurnedByToken,
            total_minted_by_token_usdt: totals.totalMintedByTokenUsdt,
            total_burned_by_token_usdt: totals.totalBurnedByTokenUsdt,
            total_minted_usdt: totals.totalMintedUsdt,
            total_burned_usdt: totals.totalBurnedUsdt,
            total_earnings_by_token: totals.totalEarningsByToken,
            total_earnings_by_token_usdt: totals.totalEarningsByTokenUsdt,
            total_earnings_usdt: totals.totalEarningsUsdt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update agent profile
   * PUT /api/agents/profile
   */
  async updateProfile(req, res, next) {
    try {
      const agent = req.agent;
      const updates = req.body;
      const updatedAgent = await agentService.updateProfile(agent.id, updates);
      res.json({ success: true, data: updatedAgent });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get agent by ID (public profile)
   * GET /api/agents/:agent_id
   */
  async getAgentById(req, res, next) {
    try {
      const { agent_id } = req.params;

      const agent = await Agent.findOne({
        where: { id: agent_id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["full_name"],
          },
        ],
        attributes: [
          "id",
          "country",
          "city",
          "currency",
          "tier",
          "status",
          "rating",
          "available_capacity",
          "response_time_minutes",
          "is_verified",
          "is_online",
          "commission_rate",
          "max_transaction_limit",
          "phone_number",
          "whatsapp_number",
          "bank_name",
          "account_number",
          "account_name",
          "mobile_money_provider",
          "mobile_money_number",
          "total_minted",
          "total_burned",
        ],
      });

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: "Agent not found",
        });
      }

      // Get review count
      const totalReviews = await AgentReview.count({
        where: { agent_id: agent.id },
      });

      // Flatten the response to include full_name at the top level
      const agentJson = agent.toJSON();
      const responseData = {
        ...agentJson,
        full_name: agentJson.user ? agentJson.user.full_name : "Unknown Agent",
        total_reviews: totalReviews,
      };

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get agent transactions
   * GET /api/agents/transactions
   */
  async getTransactions(req, res, next) {
    try {
      const transactions = await agentService.listTransactions(
        req.agent.id,
        req.query
      );
      res.status(200).json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Platform Deposit Address
   * GET /api/agents/deposit-address
   * Returns platform treasury address where agents should send USDT
   */
  async getDepositAddress(req, res) {
    res.json({
      success: true,
      data: {
        address: TREASURY_ADDRESS,
        network: "Polygon",
        token: "USDT",
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${TREASURY_ADDRESS}`,
        instructions: [
          "1. Send USDT on Polygon network to the address above",
          "2. Copy your transaction hash after sending",
          "3. Submit the transaction hash using /deposit endpoint",
          "4. Wait for blockchain confirmation (usually 1-2 minutes)",
          "5. Your capacity will be updated automatically",
        ],
        minimum_deposit: 100,
        notes: [
          "⚠️ Only send USDT on Polygon network",
          "⚠️ Do not send tokens from exchanges directly",
          "⚠️ Make sure you have MATIC for gas fees",
        ],
      },
    });
  },

  /**
   * Deposit Capacity (Verify USDT Transaction)
   * POST /api/agents/deposit
   * Body: { amount_usd, tx_hash }
   */
  async deposit(req, res, next) {
    try {
      const { amount_usd, tx_hash } = req.body;

      if (!amount_usd || !tx_hash) {
        throw new ApiError("amount_usd and tx_hash are required", 400);
      }

      if (amount_usd < 10) {
        throw new ApiError("Minimum deposit is $10 USDT", 400);
      }

      const result = await agentService.depositCapacity(
        req.agent.id,
        amount_usd,
        tx_hash
      );

      res.json({
        success: true,
        message: "Deposit verified successfully!",
        data: {
          agent: {
            id: result.agent.id,
            status: result.agent.status,
            deposit_usd: result.agent.deposit_usd,
            available_capacity: result.agent.available_capacity,
          },
          transaction: result.transaction,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create Withdrawal Request
   * POST /api/agents/withdraw-request
   * Body: { amount_usd }
   */
  async createWithdrawalRequest(req, res, next) {
    try {
      const { amount_usd } = req.body;

      if (!amount_usd) throw new ApiError("amount_usd required", 400);

      if (amount_usd < 10) {
        throw new ApiError("Minimum withdrawal is $10 USDT", 400);
      }

      const result = await agentService.createWithdrawalRequest(
        req.agent.id,
        amount_usd
      );

      res.json({
        success: true,
        message: "Withdrawal request submitted for approval",
        data: {
          request: result.request,
          max_withdrawable: result.max_withdrawable,
          outstanding_tokens: result.outstanding_tokens,
          estimated_processing: "1-3 business days",
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Withdrawal Requests
   * GET /api/agents/withdraw-requests
   */
  async getWithdrawalRequests(req, res, next) {
    try {
      const requests = await agentService.getWithdrawalRequests(req.agent.id);
      res.json({
        success: true,
        data: requests,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Financial Dashboard
   * GET /api/agents/dashboard
   * Returns comprehensive financial overview
   */
  async getDashboard(req, res, next) {
    try {
      const agent = req.agent;
      const totals = await getAgentMintBurnTotals(agent.id);
      const outstandingUsdt = totals.totalMintedUsdt - totals.totalBurnedUsdt;
      const maxWithdraw = Math.max(0, agent.deposit_usd - outstandingUsdt);

      // Get recent transactions (mint/burn)
      const recentTxs = await Transaction.findAll({
        where: {
          agent_id: agent.id,
          type: {
            [require('sequelize').Op.in]: [TRANSACTION_TYPES.MINT, TRANSACTION_TYPES.BURN]
          }
        },
        limit: 10,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'type', 'amount', 'token_type', 'status', 'created_at', 'to_user_id', 'from_user_id'],
        include: [
          {
            model: User,
            as: 'toUser',
            attributes: ['full_name']
          },
          {
            model: User,
            as: 'fromUser',
            attributes: ['full_name']
          }
        ]
      });

      // Get deposit history
      const depositHistory = await Transaction.findAll({
        where: {
          agent_id: agent.id,
          type: TRANSACTION_TYPES.AGENT_DEPOSIT
        },
        limit: 5,
        order: [['created_at', 'DESC']],
        attributes: ['id', 'amount', 'created_at', 'metadata']
      });

      // Get performance metrics
      const totalTransactions = await Transaction.count({
        where: {
          agent_id: agent.id,
          type: {
            [require('sequelize').Op.in]: [TRANSACTION_TYPES.MINT, TRANSACTION_TYPES.BURN]
          },
          status: TRANSACTION_STATUS.COMPLETED
        }
      });

      const totalReviews = await AgentReview.count({
        where: { agent_id: agent.id }
      });

      res.json({
        success: true,
        data: {
          agent: {
            id: agent.id,
            status: agent.status,
            tier: agent.tier,
            rating: agent.rating,
          },
          financials: {
            total_deposit: agent.deposit_usd,
            available_capacity: parseFloat(agent.available_capacity) ?? 0,
            total_minted: totals.totalMintedUsdt,
            total_burned: totals.totalBurnedUsdt,
            total_minted_by_token: totals.totalMintedByToken,
            total_burned_by_token: totals.totalBurnedByToken,
            total_minted_by_token_usdt: totals.totalMintedByTokenUsdt,
            total_burned_by_token_usdt: totals.totalBurnedByTokenUsdt,
            outstanding_tokens: outstandingUsdt,
            max_withdrawable: maxWithdraw,
            total_earnings: totals.totalEarningsUsdt,
            total_earnings_by_token: totals.totalEarningsByToken,
            total_earnings_by_token_usdt: totals.totalEarningsByTokenUsdt,
            total_earnings_usdt: totals.totalEarningsUsdt,
            utilization_rate:
              agent.deposit_usd > 0
                ? ((outstandingUsdt / agent.deposit_usd) * 100).toFixed(2) + "%"
                : "0%",
          },
          recent_transactions: recentTxs,
          deposit_history: depositHistory,
          performance: {
            total_transactions: totalTransactions,
            total_reviews: totalReviews,
            success_rate: "100%", // Can be calculated from completed vs failed txs
            response_time: agent.response_time_minutes,
          }
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * List Active Agents
   * GET /api/agents/list
   * Query: { country? }
   * Returns list of active agents filtered by country
   * Note: This endpoint is public for users to find agents
   */
  async listActiveAgents(req, res, next) {
    try {
      const { country, sort } = req.query;

      const order =
        sort === "capacity"
          ? [["available_capacity", "DESC"], ["rating", "DESC"]]
          : sort === "fastest"
            ? [["response_time_minutes", "ASC"], ["rating", "DESC"]]
            : [["rating", "DESC"], ["response_time_minutes", "ASC"]];

      const agents = await Agent.findAll({
        where: {
          status: AGENT_STATUS.ACTIVE,
          ...(country && { country }),
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["full_name"],
          },
        ],
        attributes: [
          "id",
          "country",
          "city",
          "currency",
          "tier",
          "status",
          "rating",
          "available_capacity",
          "response_time_minutes",
          "is_verified",
          "is_online",
          "commission_rate",
          "max_transaction_limit",
          "daily_transaction_limit",
          "phone_number",
          "whatsapp_number",
          "bank_name",
          "account_number",
          "account_name",
          "mobile_money_provider",
          "mobile_money_number",
          "total_minted",
          "total_burned",
        ],
        order,
      });

      // Flatten the response to include full_name at the top level
      const flattenedAgents = agents.map((agent) => {
        const agentJson = agent.toJSON();
        return {
          ...agentJson,
          full_name: agentJson.user ? agentJson.user.full_name : "Unknown Agent",
        };
      });

      res.json({
        success: true,
        data: flattenedAgents,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload KYC Documents
   * POST /api/agents/kyc/upload
   */
  async uploadKyc(req, res, next) {
    try {
      const agentId = req.agent.id;
      const files = req.files;
      const {
        full_legal_name,
        date_of_birth,
        id_document_type,
        id_document_number,
        nationality,
        residential_address,
      } = req.body;

      // Validate required fields
      if (!full_legal_name || !date_of_birth || !id_document_type) {
        throw new ApiError("Missing required KYC information", 400);
      }

      // Validate required documents
      if (!files.id_document || !files.selfie || !files.proof_of_address) {
        throw new ApiError(
          "Required documents: id_document, selfie, proof_of_address",
          400
        );
      }

      // Check if KYC already exists
      let kyc = await AgentKyc.findOne({ where: { agent_id: agentId } });

      if (kyc && kyc.status === "approved") {
        throw new ApiError(
          "KYC already approved. Contact support for changes.",
          400
        );
      }

      // Upload documents to R2
      const [idDocUrl, selfieUrl, proofOfAddressUrl, businessRegUrl] =
        await Promise.all([
          uploadToR2(
            files.id_document[0].buffer,
            files.id_document[0].originalname,
            "kyc/id-documents"
          ),
          uploadToR2(
            files.selfie[0].buffer,
            files.selfie[0].originalname,
            "kyc/selfies"
          ),
          uploadToR2(
            files.proof_of_address[0].buffer,
            files.proof_of_address[0].originalname,
            "kyc/proof-of-address"
          ),
          files.business_registration
            ? uploadToR2(
              files.business_registration[0].buffer,
              files.business_registration[0].originalname,
              "kyc/business-reg"
            )
            : Promise.resolve(null),
        ]);

      // Create or update KYC record
      if (kyc) {
        // Update existing KYC (resubmission)
        await kyc.update({
          id_document_url: idDocUrl,
          id_document_type,
          selfie_url: selfieUrl,
          proof_of_address_url: proofOfAddressUrl,
          business_registration_url: businessRegUrl,
          full_legal_name,
          date_of_birth,
          id_document_number,
          nationality,
          residential_address,
          status: "under_review",
          submitted_at: new Date(),
        });
      } else {
        // Create new KYC record
        kyc = await AgentKyc.create({
          agent_id: agentId,
          id_document_url: idDocUrl,
          id_document_type,
          selfie_url: selfieUrl,
          proof_of_address_url: proofOfAddressUrl,
          business_registration_url: businessRegUrl,
          full_legal_name,
          date_of_birth,
          id_document_number,
          nationality,
          residential_address,
          status: "under_review",
          submitted_at: new Date(),
        });
      }

      // Notify admin (you can implement this)
      // await notifyAdminOfNewKyc(agentId);

      res.status(201).json({
        success: true,
        message: "KYC documents uploaded successfully. Under review.",
        data: {
          status: kyc.status,
          submitted_at: kyc.submitted_at,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get KYC Status
   * GET /api/agents/kyc/status
   */
  async checkKycStatus(req, res, next) {
    try {
      const agentId = req.agent.id;

      const kyc = await AgentKyc.findOne({
        where: { agent_id: agentId },
        attributes: [
          "id",
          "status",
          "submitted_at",
          "reviewed_at",
          "rejection_reason",
          "id_document_type",
          "full_legal_name",
        ],
      });

      if (!kyc) {
        return res.json({
          success: true,
          data: {
            status: "not_submitted",
            message: "Please upload your KYC documents to get verified",
          },
        });
      }

      res.json({
        success: true,
        data: kyc,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Resubmit KYC (after rejection)
   * PUT /api/agents/kyc/resubmit
   */
  async resubmitKyc(req, res, next) {
    try {
      // Same logic as uploadKyc, but for resubmission
      return agentController.uploadKyc(req, res, next);
    } catch (err) {
      next(err);
    }
  },

  async getDepositHistory(req, res, next) {
    try {
      const history = await agentService.getDepositHistory(req.agent.id);
      res.json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  },

  // =====================================================
  // REVIEW & RATING CONTROLLERS (NEW)
  // =====================================================

  /**
   * Submit Review for Agent
   * POST /api/agents/review
   * Body: { transaction_id, rating, review_text? }
   */
  async submitReview(req, res, next) {
    try {
      const { transaction_id, rating, review_text } = req.body;
      const userId = req.user.id;

      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        throw new ApiError("Rating must be between 1 and 5", 400);
      }

      if (!transaction_id) {
        throw new ApiError("transaction_id is required", 400);
      }

      // Verify transaction exists and user was involved
      const transaction = await Transaction.findByPk(transaction_id);
      if (!transaction) {
        throw new ApiError("Transaction not found", 404);
      }

      // Check if user is the recipient (for MINT) or sender (for BURN)
      const isUserInvolved =
        (transaction.type === TRANSACTION_TYPES.MINT &&
          transaction.to_user_id === userId) ||
        (transaction.type === TRANSACTION_TYPES.BURN &&
          transaction.from_user_id === userId);

      if (!isUserInvolved) {
        throw new ApiError(
          "You can only review transactions you participated in",
          403
        );
      }

      // Only completed mint/burn transactions can be reviewed
      if (transaction.status !== TRANSACTION_STATUS.COMPLETED) {
        throw new ApiError("Only completed transactions can be reviewed", 400);
      }

      if (
        ![TRANSACTION_TYPES.MINT, TRANSACTION_TYPES.BURN].includes(
          transaction.type
        )
      ) {
        throw new ApiError(
          "Only mint and burn transactions can be reviewed",
          400
        );
      }

      if (!transaction.agent_id) {
        throw new ApiError("Transaction has no associated agent", 400);
      }

      // Check if already reviewed
      const existing = await AgentReview.findOne({
        where: { transaction_id },
      });
      if (existing) {
        throw new ApiError("You have already reviewed this transaction", 400);
      }

      // Create review and update agent rating
      const review = await agentService.submitReview({
        user_id: userId,
        agent_id: transaction.agent_id,
        transaction_id,
        rating: parseInt(rating),
        review_text: review_text || null,
        transaction_type: transaction.type.toUpperCase(),
      });

      res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        data: review,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Agent Reviews
   * GET /api/agents/:agent_id/reviews
   * Query: { limit?, offset? }
   */
  async getReviews(req, res, next) {
    try {
      const { agent_id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Verify agent exists
      const agent = await Agent.findByPk(agent_id, {
        attributes: ["id", "rating"],
      });

      if (!agent) {
        throw new ApiError("Agent not found", 404);
      }

      // Get reviews with pagination
      const reviews = await AgentReview.findAndCountAll({
        where: { agent_id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name"],
          },
          {
            model: Transaction,
            as: "transaction",
            attributes: ["id", "type", "amount", "token_type", "created_at"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      // Calculate rating distribution
      const allReviews = await AgentReview.findAll({
        where: { agent_id },
        attributes: ["rating"],
      });

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      allReviews.forEach((r) => {
        distribution[r.rating]++;
      });

      res.json({
        success: true,
        data: {
          agent_summary: {
            agent_id: agent.id,
            average_rating: parseFloat(agent.rating),
            total_reviews: reviews.count,
            rating_distribution: distribution,
          },
          reviews: reviews.rows,
          pagination: {
            total: reviews.count,
            limit: parseInt(limit),
            offset: parseInt(offset),
            has_more: parseInt(offset) + parseInt(limit) < reviews.count,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Agent Responds to Review
   * POST /api/agents/review/:review_id/respond
   * Body: { response }
   */
  async respondToReview(req, res, next) {
    try {
      const { review_id } = req.params;
      const { response } = req.body;
      const agentUserId = req.user.id;

      if (!response || response.trim().length === 0) {
        throw new ApiError("Response text is required", 400);
      }

      const review = await AgentReview.findByPk(review_id, {
        include: [
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "user_id"],
          },
        ],
      });

      if (!review) {
        throw new ApiError("Review not found", 404);
      }

      // Verify the logged-in agent owns this review
      if (review.agent.user_id !== agentUserId) {
        throw new ApiError("You can only respond to your own reviews", 403);
      }

      // Update review with agent response
      review.agent_response = response.trim();
      review.agent_response_at = new Date();
      await review.save();

      res.json({
        success: true,
        message: "Response posted successfully",
        data: review,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { ...agentController, getAgentMintBurnTotals };
