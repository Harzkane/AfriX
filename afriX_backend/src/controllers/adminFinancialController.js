// File: src/controllers/adminFinancialController.js
const { Transaction, Wallet, User, Merchant, Agent } = require("../models");
const transactionService = require("../services/transactionService");
const walletService = require("../services/walletService");
const platformService = require("../services/platformService");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  TOKEN_TYPES,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

const adminFinancialController = {
  // =====================================================
  // TRANSACTION MANAGEMENT
  // =====================================================

  /**
   * Get transaction statistics
   * GET /api/v1/admin/financial/transactions/stats
   */
  getTransactionStats: async (req, res) => {
    try {
      const totalTransactions = await Transaction.count();
      const completedTransactions = await Transaction.count({
        where: { status: TRANSACTION_STATUS.COMPLETED },
      });
      const pendingTransactions = await Transaction.count({
        where: { status: TRANSACTION_STATUS.PENDING },
      });
      const failedTransactions = await Transaction.count({
        where: { status: TRANSACTION_STATUS.FAILED },
      });
      const refundedTransactions = await Transaction.count({
        where: { status: TRANSACTION_STATUS.REFUNDED },
      });

      // Transaction volumes by type
      const transactionsByType = await Transaction.findAll({
        attributes: [
          "type",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"],
        ],
        group: ["type"],
        raw: true,
      });

      // Volume History (Last 6 Months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const volumeHistory = await Transaction.findAll({
        attributes: [
          [sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'month'],
          [sequelize.fn('count', sequelize.col('id')), 'count'],
          [sequelize.fn('sum', sequelize.col('amount')), 'amount'],
        ],
        where: {
          created_at: { [Op.gte]: sixMonthsAgo }
        },
        group: [sequelize.fn('date_trunc', 'month', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      // Format volume history for charts
      const formattedHistory = volumeHistory.map(item => ({
        name: new Date(item.month).toLocaleString('default', { month: 'short' }),
        transactions: parseInt(item.count || 0),
        activity: Math.round(parseFloat(item.count || 0) * 0.7) // Mocked activity as 70% of txs for now as placeholder for "User Activity"
      }));

      // Recent 24h activity
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent24hCount = await Transaction.count({
        where: { created_at: { [Op.gte]: last24h } },
      });

      // Total fees collected
      const totalFees = await Transaction.sum("fee", {
        where: { status: TRANSACTION_STATUS.COMPLETED },
      });

      res.status(200).json({
        success: true,
        data: {
          total_transactions: totalTransactions,
          by_status: {
            completed: completedTransactions,
            pending: pendingTransactions,
            failed: failedTransactions,
            refunded: refundedTransactions,
          },
          status_distribution: [
            { name: "Completed", value: completedTransactions, color: "#10b981" },
            { name: "Pending", value: pendingTransactions, color: "#3b82f6" },
            { name: "Failed", value: failedTransactions + refundedTransactions, color: "#ef4444" },
          ],
          volume_history: formattedHistory,
          by_type: transactionsByType.reduce((acc, item) => {
            acc[item.type] = {
              count: parseInt(item.count),
              total_amount: parseFloat(item.total_amount || 0).toFixed(2),
            };
            return acc;
          }, {}),
          recent_24h: recent24hCount,
          total_fees_collected: parseFloat(totalFees || 0).toFixed(2),
        },
      });
    } catch (error) {
      console.error("Get transaction stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List all transactions with filters
   * GET /api/v1/admin/financial/transactions
   * Query: { type?, status?, user_id?, merchant_id?, agent_id?, token_type?, start_date?, end_date?, limit?, offset? }
   */
  listTransactions: async (req, res) => {
    try {
      const {
        type,
        status,
        user_id,
        merchant_id,
        agent_id,
        token_type,
        start_date,
        end_date,
        limit = 50,
        offset = 0,
      } = req.query;

      const where = {};

      if (type) where.type = type;
      if (status) where.status = status;
      if (token_type) where.token_type = token_type;

      // Filter by participant
      if (user_id) {
        where[Op.or] = [{ from_user_id: user_id }, { to_user_id: user_id }];
      }
      if (merchant_id) where.merchant_id = merchant_id;
      if (agent_id) where.agent_id = agent_id;

      // Date range
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at[Op.gte] = new Date(start_date);
        if (end_date) where.created_at[Op.lte] = new Date(end_date);
      }

      const transactions = await Transaction.findAndCountAll({
        where,
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
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "tier", "rating"],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: transactions.rows,
        pagination: {
          total: transactions.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < transactions.count,
        },
      });
    } catch (error) {
      console.error("List transactions error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get single transaction details
   * GET /api/v1/admin/financial/transactions/:id
   */
  getTransaction: async (req, res) => {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findByPk(id, {
        include: [
          {
            model: User,
            as: "fromUser",
            attributes: ["id", "full_name", "email", "phone_number"],
          },
          {
            model: User,
            as: "toUser",
            attributes: ["id", "full_name", "email", "phone_number"],
          },
          {
            model: Wallet,
            as: "fromWallet",
            attributes: ["id", "token_type", "balance"],
          },
          {
            model: Wallet,
            as: "toWallet",
            attributes: ["id", "token_type", "balance"],
          },
          {
            model: Merchant,
            as: "merchant",
            attributes: ["id", "business_name", "display_name"],
            required: false,
          },
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "tier", "rating", "deposit_usd"],
            required: false,
          },
        ],
      });

      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, error: "Transaction not found" });
      }

      res.status(200).json({ success: true, data: transaction });
    } catch (error) {
      console.error("Get transaction error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Refund transaction (admin)
   * POST /api/v1/admin/financial/transactions/:id/refund
   * Body: { reason: string }
   */
  refundTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Refund reason is required",
        });
      }

      const transaction = await transactionService.refundTransaction(id);

      res.status(200).json({
        success: true,
        message: "Transaction refunded successfully",
        data: {
          transaction_id: transaction.id,
          reference: transaction.reference,
          status: transaction.status,
          refund_reason: reason,
        },
      });
    } catch (error) {
      console.error("Refund transaction error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Mark transaction as suspicious
   * POST /api/v1/admin/financial/transactions/:id/flag
   * Body: { reason: string, severity: string }
   */
  flagTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, severity = "medium" } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Flag reason is required",
        });
      }

      const transaction = await Transaction.findByPk(id);

      if (!transaction) {
        return res
          .status(404)
          .json({ success: false, error: "Transaction not found" });
      }

      // Add flag to metadata
      transaction.metadata = {
        ...(transaction.metadata || {}),
        flagged: true,
        flag_reason: reason,
        flag_severity: severity,
        flagged_by: req.user.id,
        flagged_at: new Date(),
      };

      await transaction.save();

      res.status(200).json({
        success: true,
        message: "Transaction flagged successfully",
        data: {
          transaction_id: transaction.id,
          flagged: true,
          reason,
          severity,
        },
      });
    } catch (error) {
      console.error("Flag transaction error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // =====================================================
  // WALLET MANAGEMENT
  // =====================================================

  /**
   * Get wallet statistics
   * GET /api/v1/admin/financial/wallets/stats
   */
  getWalletStats: async (req, res) => {
    try {
      const totalWallets = await Wallet.count();
      const activeWallets = await Wallet.count({
        where: { is_active: true },
      });
      const frozenWallets = await Wallet.count({
        where: { is_frozen: true },
      });

      // Total value locked by token type
      const balancesByType = await Wallet.findAll({
        attributes: [
          "token_type",
          [sequelize.fn("SUM", sequelize.col("balance")), "total_balance"],
          [sequelize.fn("COUNT", sequelize.col("id")), "wallet_count"],
        ],
        group: ["token_type"],
        raw: true,
      });

      // Top wallets by balance
      const topWallets = await Wallet.findAll({
        attributes: [
          "id",
          "user_id",
          "token_type",
          "balance",
          "transaction_count",
        ],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [[sequelize.literal("CAST(balance AS DECIMAL)"), "DESC"]],
        limit: 10,
      });

      res.status(200).json({
        success: true,
        data: {
          total_wallets: totalWallets,
          active: activeWallets,
          frozen: frozenWallets,
          balances_by_token: balancesByType.reduce((acc, item) => {
            acc[item.token_type] = {
              total_balance: parseFloat(item.total_balance || 0).toFixed(2),
              wallet_count: parseInt(item.wallet_count),
            };
            return acc;
          }, {}),
          top_wallets: topWallets,
        },
      });
    } catch (error) {
      console.error("Get wallet stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List all wallets with filters
   * GET /api/v1/admin/financial/wallets
   * Query: { token_type?, is_frozen?, user_id?, min_balance?, max_balance?, limit?, offset? }
   */
  listWallets: async (req, res) => {
    try {
      const {
        token_type,
        is_frozen,
        user_id,
        min_balance,
        max_balance,
        limit = 50,
        offset = 0,
      } = req.query;

      const where = { is_active: true };

      if (token_type) where.token_type = token_type;
      if (is_frozen !== undefined) where.is_frozen = is_frozen === "true";
      if (user_id) where.user_id = user_id;

      // Balance range filter
      if (min_balance || max_balance) {
        where.balance = {};
        if (min_balance) where.balance[Op.gte] = parseFloat(min_balance);
        if (max_balance) where.balance[Op.lte] = parseFloat(max_balance);
      }

      const wallets = await Wallet.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sequelize.literal("CAST(balance AS DECIMAL)"), "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: wallets.rows,
        pagination: {
          total: wallets.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < wallets.count,
        },
      });
    } catch (error) {
      console.error("List wallets error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get wallet details
   * GET /api/v1/admin/financial/wallets/:id
   */
  getWallet: async (req, res) => {
    try {
      const { id } = req.params;

      const wallet = await Wallet.findByPk(id, {
        include: [
          {
            model: User,
            as: "user",
            attributes: [
              "id",
              "full_name",
              "email",
              "phone_number",
              "is_suspended",
            ],
          },
        ],
      });

      if (!wallet) {
        return res
          .status(404)
          .json({ success: false, error: "Wallet not found" });
      }

      // Get recent transactions
      const recentTransactions = await Transaction.findAll({
        where: {
          [Op.or]: [{ from_wallet_id: id }, { to_wallet_id: id }],
        },
        limit: 10,
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: {
          wallet,
          recent_transactions: recentTransactions,
        },
      });
    } catch (error) {
      console.error("Get wallet error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // =====================================================
  // PAYMENT MANAGEMENT
  // =====================================================

  /**
   * Get payment statistics
   * GET /api/v1/admin/financial/payments/stats
   */
  getPaymentStats: async (req, res) => {
    try {
      const totalPayments = await Transaction.count({
        where: { type: TRANSACTION_TYPES.COLLECTION },
      });

      const completedPayments = await Transaction.count({
        where: {
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.COMPLETED,
        },
      });

      const pendingPayments = await Transaction.count({
        where: {
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.PENDING,
        },
      });

      // Total payment volume
      const totalVolume = await Transaction.sum("amount", {
        where: {
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.COMPLETED,
        },
      });

      // Top merchants by volume
      const topMerchants = await Transaction.findAll({
        attributes: [
          "merchant_id",
          [
            sequelize.fn("COUNT", sequelize.col("transactions.id")),
            "payment_count",
          ],
          [sequelize.fn("SUM", sequelize.col("amount")), "total_volume"],
        ],
        where: {
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.COMPLETED,
        },
        include: [
          {
            model: Merchant,
            as: "merchant",
            attributes: ["id", "business_name"],
          },
        ],
        group: ["merchant_id", "merchant.id"],
        order: [[sequelize.literal("SUM(amount)"), "DESC"]],
        limit: 10,
        raw: false,
      });

      res.status(200).json({
        success: true,
        data: {
          total_payments: totalPayments,
          completed: completedPayments,
          pending: pendingPayments,
          total_volume: parseFloat(totalVolume || 0).toFixed(2),
          top_merchants: topMerchants.map((item) => ({
            merchant_id: item.merchant_id,
            merchant_name: item.merchant?.business_name,
            payment_count: parseInt(item.get("payment_count")),
            total_volume: parseFloat(item.get("total_volume")).toFixed(2),
          })),
        },
      });
    } catch (error) {
      console.error("Get payment stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List merchant payments
   * GET /api/v1/admin/financial/payments
   * Query: { merchant_id?, status?, start_date?, end_date?, limit?, offset? }
   */
  listPayments: async (req, res) => {
    try {
      const {
        merchant_id,
        status,
        start_date,
        end_date,
        limit = 50,
        offset = 0,
      } = req.query;

      const where = { type: TRANSACTION_TYPES.COLLECTION };

      if (merchant_id) where.merchant_id = merchant_id;
      if (status) where.status = status;

      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at[Op.gte] = new Date(start_date);
        if (end_date) where.created_at[Op.lte] = new Date(end_date);
      }

      const payments = await Transaction.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "fromUser",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: Merchant,
            as: "merchant",
            attributes: ["id", "business_name", "display_name"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: payments.rows,
        pagination: {
          total: payments.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < payments.count,
        },
      });
    } catch (error) {
      console.error("List payments error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // =====================================================
  // PLATFORM FEE COLLECTION
  // =====================================================

  /**
   * Get platform fee wallet balances (NT, CT, USDT)
   * GET /api/v1/admin/financial/platform-fees/balances
   */
  getPlatformFeeBalances: async (req, res) => {
    try {
      const balances = await platformService.getPlatformFeeBalances();
      const wallets = await platformService.getPlatformWallets();
      res.status(200).json({
        success: true,
        data: {
          balances: {
            NT: parseFloat(balances.NT) || 0,
            CT: parseFloat(balances.CT) || 0,
            USDT: parseFloat(balances.USDT) || 0,
          },
          wallet_ids: {
            NT: wallets.NT?.id,
            CT: wallets.CT?.id,
            USDT: wallets.USDT?.id,
          },
        },
      });
    } catch (error) {
      console.error("Get platform fee balances error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get platform fee collection report (fees collected by type and time)
   * GET /api/v1/admin/financial/platform-fees/report
   * Query: { start_date?, end_date?, type? }
   */
  getPlatformFeeReport: async (req, res) => {
    try {
      const { start_date, end_date, type } = req.query;
      const where = {
        status: TRANSACTION_STATUS.COMPLETED,
        fee_wallet_id: { [Op.ne]: null },
        fee: { [Op.gt]: 0 },
      };
      if (type) where.type = type;
      if (start_date || end_date) {
        where.created_at = {};
        if (start_date) where.created_at[Op.gte] = new Date(start_date);
        if (end_date) where.created_at[Op.lte] = new Date(end_date);
      }

      const byType = await Transaction.findAll({
        attributes: [
          "type",
          "token_type",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          [sequelize.fn("SUM", sequelize.col("fee")), "total_fee"],
        ],
        where,
        group: ["type", "token_type"],
        raw: true,
      });

      const totals = await Transaction.findOne({
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("id")), "total_count"],
          [sequelize.fn("SUM", sequelize.col("fee")), "total_fees"],
        ],
        where,
        raw: true,
      });

      const byToken = await Transaction.findAll({
        attributes: [
          "token_type",
          [sequelize.fn("SUM", sequelize.col("fee")), "total_fee"],
        ],
        where,
        group: ["token_type"],
        raw: true,
      });

      res.status(200).json({
        success: true,
        data: {
          summary: {
            total_transactions_with_fees: parseInt(totals?.total_count || 0),
            total_fees_collected: parseFloat(totals?.total_fees || 0),
          },
          by_type: byType.map((r) => ({
            type: r.type,
            token_type: r.token_type,
            count: parseInt(r.count),
            total_fee: parseFloat(r.total_fee || 0),
          })),
          by_token: byToken.reduce((acc, r) => {
            acc[r.token_type] = parseFloat(r.total_fee || 0);
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      console.error("Get platform fee report error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = adminFinancialController;
