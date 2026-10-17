// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/services/merchantService.js

const { Merchant, User, Wallet, Transaction } = require("../models");
const {
  MERCHANT_STATUS,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");
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
          as: "wallet",
          attributes: ["id", "balance", "token_type"],
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
      token_type: currency,
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

    const isCompleted = (tx) =>
      ["completed", "success", "successful", "paid"].includes(
        (tx.status || "").toLowerCase()
      );

    const isPending = (tx) =>
      ["pending", "processing"].includes((tx.status || "").toLowerCase());

    const isCollection = (tx) =>
      tx.type === TRANSACTION_TYPES.COLLECTION ||
      tx.metadata?.collection_type === "rent_escrow" ||
      (tx.metadata?.source === "renthub" && tx.type !== TRANSACTION_TYPES.CREDIT);

    const isPayout = (tx) =>
      tx.type === TRANSACTION_TYPES.CREDIT ||
      tx.metadata?.payout_type === "landlord_escrow_release";

    const completed = transactions.filter(isCompleted);
    const completedCollections = completed.filter(isCollection);
    const completedPayouts = completed.filter(isPayout);

    const totalVolume = completedCollections.reduce(
      (sum, tx) => sum + parseFloat(tx.amount || 0),
      0
    );
    const totalCount = completedCollections.length;

    const totalPayoutVolume = completedPayouts.reduce(
      (sum, tx) => sum + parseFloat(tx.amount || 0),
      0
    );
    const totalPayoutCount = completedPayouts.length;

    const totalPlatformFees = completedPayouts.reduce((sum, tx) => {
      const explicitFee = parseFloat(
        tx.metadata?.platformFee || tx.metadata?.platform_fee
      );
      if (!isNaN(explicitFee) && explicitFee > 0) return sum + explicitFee;
      const isRentHub = tx.metadata?.source === "renthub";
      const feeRate = isRentHub ? 0.02 : 0.08;
      const baseRatio = isRentHub ? 0.98 : 0.92;
      return sum + (parseFloat(tx.amount || 0) / baseRatio) * feeRate;
    }, 0);

    const pendingPayments = transactions.filter(isPending).length;

    const collectionsByToken = {};
    completedCollections.forEach((tx) => {
      const token = tx.token_type || "NT";
      collectionsByToken[token] =
        (collectionsByToken[token] || 0) + parseFloat(tx.amount || 0);
    });

    const payoutsByToken = {};
    completedPayouts.forEach((tx) => {
      const token = tx.token_type || "NT";
      payoutsByToken[token] =
        (payoutsByToken[token] || 0) + parseFloat(tx.amount || 0);
    });

    const primaryToken =
      completedCollections[0]?.token_type ||
      completedPayouts[0]?.token_type ||
      transactions[0]?.token_type ||
      "NT";

    return {
      total_collections: totalCount,
      total_volume: totalVolume,
      total_payouts: totalPayoutCount,
      total_payout_volume: totalPayoutVolume,
      total_platform_fees: totalPlatformFees,
      pending_payments: pendingPayments,
      collections_by_token: collectionsByToken,
      payouts_by_token: payoutsByToken,
      primary_token: primaryToken,
    };
  },
};

module.exports = merchantService;
