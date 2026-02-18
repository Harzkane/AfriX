// src/controllers/transactionController.js
const { Transaction, User, Wallet, Merchant, Agent } = require("../models");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  COUNTRY_DETAILS,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { generateTransactionReference } = require("../utils/helpers");
const transactionService = require("../services/transactionService");
/**
 * Basic transaction controller for listing, retrieving and verifying transactions.
 * Heavy business logic should live in services (not here) — this is a pragmatic starting point.
 */
const transactionController = {
  // Create a transaction (admin / internal use). For most flows, use service-level helpers.
  async create(req, res, next) {
    try {
      const {
        type,
        amount,
        token_type,
        from_user_id,
        to_user_id,
        merchant_id,
        agent_id,
        from_wallet_id,
        to_wallet_id,
        description,
        metadata,
        fee,
      } = req.body;

      if (!type || !amount || !token_type) {
        throw new ApiError("type, amount and token_type are required", 400);
      }

      const tx = await Transaction.create({
        reference: generateTransactionReference(),
        type,
        status: TRANSACTION_STATUS.PENDING,
        amount,
        fee: fee || 0,
        token_type,
        description,
        metadata: metadata || {},
        from_user_id: from_user_id || null,
        to_user_id: to_user_id || null,
        merchant_id: merchant_id || null,
        agent_id: agent_id || null,
        from_wallet_id: from_wallet_id || null,
        to_wallet_id: to_wallet_id || null,
      });

      res.status(201).json({ success: true, data: tx });
    } catch (error) {
      next(error);
    }
  },

  // Get transaction by id (with related users/merchant)
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const tx = await Transaction.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: "fromUser",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: User,
            as: "toUser",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: Merchant,
            as: "merchant",
            attributes: ["id", "business_name"],
            required: false,
          },
        ],
      });

      if (!tx) throw new ApiError("Transaction not found", 404);

      // Authorization: either involved users or merchant owner or admin can view (implement more as needed)
      if (req.user && req.user.id) {
        const uid = req.user.id;
        const allowed = [tx.from_user_id, tx.to_user_id].includes(uid);
        if (!allowed && req.user.role !== "admin") {
          // allow merchant owner to view if merchant matches
          if (tx.merchant_id) {
            const merchant = await Merchant.findByPk(tx.merchant_id);
            if (!merchant || merchant.user_id !== uid) {
              throw new ApiError("Unauthorized to view this transaction", 403);
            }
          } else {
            throw new ApiError("Unauthorized to view this transaction", 403);
          }
        }
      }

      res.json({ success: true, data: tx });
    } catch (error) {
      next(error);
    }
  },

  // Verify transaction status (returns whether it's completed)
  async verify(req, res, next) {
    try {
      const { id } = req.params;

      const tx = await Transaction.findByPk(id);
      if (!tx) throw new ApiError("Transaction not found", 404);

      res.json({
        success: true,
        data: {
          id: tx.id,
          reference: tx.reference,
          status: tx.status,
          verified: tx.status === TRANSACTION_STATUS.COMPLETED,
          timestamp: tx.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // List transactions (pagination + optional filters)
  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, type, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (type) where.type = type;
      if (status) where.status = status;

      // If non-admin, scope to user's transactions
      if (!req.user || req.user.role !== "admin") {
        const uid = req.user ? req.user.id : null;
        if (!uid) {
          throw new ApiError("Authentication required", 401);
        }
        where[Symbol.for("or")] = [
          { from_user_id: uid },
          { to_user_id: uid },
          { merchant_id: uid }, // merchant_id is user-owned in some flows
        ];
      }

      const result = await Transaction.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        include: [
          {
            model: User,
            as: "fromUser",
            attributes: ["id", "full_name", "email", "country_code"],
          },
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "country", "city", "rating"],
            required: false,
            include: [
              {
                model: User,
                as: "user",
                attributes: ["full_name"],
              },
            ],
          },
          {
            model: Merchant,
            as: "merchant",
            attributes: ["id", "business_name", "display_name", "country", "city"],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset,
      });

      // Map country codes to names for easier frontend display
      const transactions = result.rows.map(tx => {
        const plain = tx.toJSON();
        if (plain.fromUser && plain.fromUser.country_code) {
          plain.fromUser.country_name = COUNTRY_DETAILS[plain.fromUser.country_code]?.name || plain.fromUser.country_code;
        }
        if (plain.agent && plain.agent.country) {
          plain.agent.country_name = COUNTRY_DETAILS[plain.agent.country]?.name || plain.agent.country;
        }
        if (plain.merchant && plain.merchant.country) {
          plain.merchant.country_name = COUNTRY_DETAILS[plain.merchant.country]?.name || plain.merchant.country;
        }
        return plain;
      });

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            total: result.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(result.count / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // Process user-to-user transfer
  async userTransfer(req, res, next) {
    try {
      const { to_user_id, amount, token_type, description } = req.body;
      const tx = await transactionService.processUserTransfer(
        req.user.id,
        to_user_id,
        amount,
        token_type,
        description
      );
      res.status(201).json({ success: true, data: tx });
    } catch (error) {
      next(error);
    }
  },

  // Process merchant payment
  async payMerchant(req, res, next) {
    try {
      const { merchant_id, amount, token_type, description } = req.body;
      const tx = await transactionService.processMerchantPayment(
        req.user.id,
        merchant_id,
        amount,
        token_type,
        description
      );
      res.status(201).json({ success: true, data: tx });
    } catch (error) {
      next(error);
    }
  },

  // Get pending reviews (transactions that haven't been reviewed)
  async getPendingReviews(req, res, next) {
    try {
      const userId = req.user.id;
      const { Sequelize } = require("sequelize");
      const AgentReview = require("../models/AgentReview");
      const Agent = require("../models/Agent");

      // Find completed mint/burn transactions where user is recipient/sender
      // and no review exists
      const pendingTransactions = await Transaction.findAll({
        where: {
          [Sequelize.Op.or]: [
            {
              // Mint: user received tokens
              type: TRANSACTION_TYPES.MINT,
              to_user_id: userId,
            },
            {
              // Burn: user sent tokens
              type: TRANSACTION_TYPES.BURN,
              from_user_id: userId,
            },
          ],
          status: TRANSACTION_STATUS.COMPLETED,
          agent_id: { [Sequelize.Op.ne]: null }, // Must have an agent
        },
        include: [
          {
            model: Agent,
            as: "agent", // Use the alias defined in the association
            attributes: ["id", "tier", "rating"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["full_name"],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Filter out transactions that already have reviews
      const reviewedTransactionIds = await AgentReview.findAll({
        where: {
          user_id: userId,
          transaction_id: {
            [Sequelize.Op.in]: pendingTransactions.map((tx) => tx.id),
          },
        },
        attributes: ["transaction_id"],
        raw: true,
      });

      const reviewedIds = new Set(
        reviewedTransactionIds.map((r) => r.transaction_id)
      );
      const unreviewed = pendingTransactions.filter(
        (tx) => !reviewedIds.has(tx.id)
      );

      res.json({
        success: true,
        data: {
          transactions: unreviewed,
          count: unreviewed.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = transactionController;
