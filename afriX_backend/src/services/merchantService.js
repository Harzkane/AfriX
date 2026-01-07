// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/merchantService.js

const { Merchant, User, Wallet, Transaction } = require("../models");
const { MERCHANT_STATUS, TRANSACTION_TYPES } = require("../config/constants");
const { ApiError } = require("../utils/errors");
const crypto = require("crypto");
const QRCode = require("qrcode");

/**
 * Service for merchant-related operations
 */
const merchantService = {
  /**
   * Register a new merchant
   * @param {Object} merchantData - Merchant registration data
   * @param {String} userId - User ID
   * @returns {Object} Newly created merchant
   */
  async registerMerchant(merchantData, userId) {
    // Check if user already has a merchant account
    const existingMerchant = await Merchant.findOne({
      where: { user_id: userId },
    });
    if (existingMerchant) {
      throw new ApiError("User already has a merchant account", 400);
    }

    // Generate API key
    const apiKey = this.generateApiKey();

    // Create merchant with initial verification status
    const merchant = await Merchant.create({
      ...merchantData,
      user_id: userId,
      api_key: apiKey,
      verification_status: MERCHANT_STATUS.PENDING,
    });

    return merchant;
  },

  /**
   * Generate a secure API key
   * @returns {String} API key
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString("hex");
  },

  /**
   * Get merchant by user ID
   * @param {String} userId - User ID
   * @returns {Object} Merchant data
   */
  async getMerchantByUserId(userId) {
    const merchant = await Merchant.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ["id", "email", "full_name", "phone_number"],
        },
        {
          model: Wallet,
          as: "settlementWallet",
          attributes: ["id", "balance", "currency"],
        },
      ],
    });

    if (!merchant) {
      throw new ApiError("Merchant account not found", 404);
    }

    return merchant;
  },

  /**
   * Update merchant profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated merchant
   */
  async updateMerchantProfile(userId, updateData) {
    const merchant = await Merchant.findOne({ where: { user_id: userId } });

    if (!merchant) {
      throw new ApiError("Merchant account not found", 404);
    }

    // Update merchant data
    await merchant.update(updateData);

    return merchant;
  },

  /**
   * Generate payment QR code
   * @param {String} merchantId - Merchant ID
   * @param {Number} amount - Payment amount
   * @param {String} currency - Currency code
   * @param {String} description - Payment description
   * @returns {Object} Payment request data with QR code
   */
  async generatePaymentQR(merchantId, amount, currency, description) {
    const merchant = await Merchant.findByPk(merchantId);

    if (!merchant) {
      throw new ApiError("Merchant not found", 404);
    }

    // Create payment data
    const paymentData = {
      merchant_id: merchantId,
      business_name: merchant.business_name,
      amount: amount.toString(),
      currency,
      description,
      timestamp: new Date().toISOString(),
    };

    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(paymentData));

    return {
      ...paymentData,
      qr_code: qrCode,
    };
  },

  /**
   * Get merchant transactions
   * @param {String} userId - User ID
   * @param {Object} filters - Query filters
   * @returns {Array} Transactions
   */
  async getMerchantTransactions(userId, filters = {}) {
    const merchant = await Merchant.findOne({ where: { user_id: userId } });

    if (!merchant) {
      throw new ApiError("Merchant account not found", 404);
    }

    // Build query
    const query = {
      where: {
        to_user_id: userId,
        type: TRANSACTION_TYPES.COLLECTION,
      },
      order: [["created_at", "DESC"]],
      limit: filters.limit || 20,
      offset: filters.offset || 0,
    };

    // Add date filters if provided
    if (filters.start_date) {
      query.where.created_at = {
        ...query.where.created_at,
        [Op.gte]: new Date(filters.start_date),
      };
    }

    if (filters.end_date) {
      query.where.created_at = {
        ...query.where.created_at,
        [Op.lte]: new Date(filters.end_date),
      };
    }

    // Get transactions
    const transactions = await Transaction.findAndCountAll(query);

    return {
      total: transactions.count,
      transactions: transactions.rows,
    };
  },

  /**
   * Regenerate merchant API key
   * @param {String} userId - User ID
   * @returns {Object} Updated merchant with new API key
   */
  async regenerateApiKey(userId) {
    const merchant = await Merchant.findOne({ where: { user_id: userId } });

    if (!merchant) {
      throw new ApiError("Merchant account not found", 404);
    }

    // Generate new API key
    const apiKey = this.generateApiKey();

    // Update merchant
    await merchant.update({ api_key: apiKey });

    return {
      id: merchant.id,
      api_key: apiKey,
    };
  },

  /**
   * Get merchant dashboard summary
   * * @param {String} merchantId - Merchant ID
   * @returns {Object} Dashboard summary data
   */
  getDashboardSummary: async (merchantId) => {
    const transactions = await Transaction.findAll({
      where: { merchant_id: merchantId },
    });

    const completed = transactions.filter(
      (tx) => tx.status === TRANSACTION_STATUS.COMPLETED
    );

    const totalVolume = completed.reduce(
      (sum, tx) => sum + parseFloat(tx.amount),
      0
    );
    const totalCount = completed.length;

    const pendingPayments = transactions.filter(
      (tx) => tx.status === TRANSACTION_STATUS.PENDING
    ).length;

    return {
      total_collections: totalCount,
      total_volume: totalVolume,
      pending_payments: pendingPayments,
    };
  },
};

module.exports = merchantService;
