// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/controllers/paymentController.js

const { Transaction } = require("../models");
const { Merchant } = require("../models");
const { Wallet } = require("../models");
const { User } = require("../models");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  TOKEN_TYPES,
} = require("../config/constants");
const { generateTransactionReference } = require("../utils/helpers");
const { ApiError } = require("../utils/errors");
// const logger = require('../utils/logger');

/**
 * Payment Controller
 * Handles merchant payment processing and verification
 */
const paymentController = {
  /**
   * Process a payment to a merchant
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async processPayment(req, res, next) {
    try {
      const { merchant_id, amount, currency, description, metadata } = req.body;
      const user_id = req.user.id;

      // ✅ Validate currency using TOKEN_TYPES
      const validCurrencies = Object.values(TOKEN_TYPES);
      if (!validCurrencies.includes(currency)) {
        throw new ApiError(
          `Invalid currency. Supported currencies are: ${validCurrencies.join(
            ", "
          )}`,
          400
        );
      }

      // Find the merchant
      const merchant = await Merchant.findByPk(merchant_id);
      if (!merchant) {
        throw new ApiError("Merchant not found", 404);
      }

      // Find user wallet with matching currency
      const userWallet = await Wallet.findOne({
        where: { user_id, currency },
      });

      if (!userWallet) {
        throw new ApiError(`You don't have a ${currency} wallet`, 400);
      }

      // Check if user has sufficient balance
      if (parseFloat(userWallet.balance) < parseFloat(amount)) {
        throw new ApiError("Insufficient balance", 400);
      }

      // Find merchant settlement wallet
      const merchantWallet = await Wallet.findByPk(
        merchant.settlement_wallet_id
      );
      if (!merchantWallet) {
        throw new ApiError("Merchant settlement wallet not found", 500);
      }

      // Calculate fee
      const feePercentage = merchant.payment_fee_percent || 1.5; // Default to 1.5%
      const fee = (parseFloat(amount) * feePercentage) / 100;
      const netAmount = parseFloat(amount) - fee;

      // Create transaction
      const transaction = await Transaction.create({
        reference: generateTransactionReference(),
        type: TRANSACTION_TYPES.COLLECTION,
        status: TRANSACTION_STATUS.COMPLETED,
        amount,
        fee: fee.toString(),
        currency,
        description: description || `Payment to ${merchant.business_name}`,
        metadata: metadata || {},
        from_user_id: user_id,
        to_user_id: merchant.user_id,
        from_wallet_id: userWallet.id,
        to_wallet_id: merchantWallet.id,
      });

      // Update wallet balances
      await userWallet.decrement("balance", { by: amount });
      await merchantWallet.increment("balance", { by: netAmount });

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          transaction_id: transaction.id,
          reference: transaction.reference,
          amount,
          fee: fee.toString(),
          net_amount: netAmount.toString(),
          currency,
          status: transaction.status,
          timestamp: transaction.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get payment details by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getPaymentDetails(req, res, next) {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findOne({
        where: {
          id,
          type: TRANSACTION_TYPES.COLLECTION,
        },
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
            include: [
              {
                model: Merchant,
                attributes: ["id", "business_name", "display_name", "logo_url"],
              },
            ],
          },
        ],
      });

      if (!transaction) {
        throw new ApiError("Payment not found", 404);
      }

      // Check if user is authorized to view details
      if (
        req.user &&
        req.user.id !== transaction.from_user_id &&
        req.user.id !== transaction.to_user_id
      ) {
        throw new ApiError("Unauthorized to view this payment", 403);
      }

      res.status(200).json({
        success: true,
        data: {
          id: transaction.id,
          reference: transaction.reference,
          amount: transaction.amount,
          fee: transaction.fee,
          currency: transaction.currency,
          description: transaction.description,
          status: transaction.status,
          created_at: transaction.created_at,
          customer: transaction.fromUser
            ? {
                id: transaction.fromUser.id,
                name: transaction.fromUser.full_name,
                email: transaction.fromUser.email,
              }
            : null,
          merchant: transaction.toUser?.Merchant
            ? {
                id: transaction.toUser.Merchant.id,
                business_name: transaction.toUser.Merchant.business_name,
                display_name: transaction.toUser.Merchant.display_name,
                logo_url: transaction.toUser.Merchant.logo_url,
              }
            : null,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify payment status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async verifyPayment(req, res, next) {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findOne({
        where: {
          id,
          type: TRANSACTION_TYPES.COLLECTION,
        },
      });

      if (!transaction) {
        throw new ApiError("Payment not found", 404);
      }

      res.status(200).json({
        success: true,
        data: {
          id: transaction.id,
          reference: transaction.reference,
          status: transaction.status,
          verified: transaction.status === TRANSACTION_STATUS.COMPLETED,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel pending payment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async cancelPayment(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const transaction = await Transaction.findOne({
        where: {
          id,
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.PENDING,
        },
      });

      if (!transaction) {
        throw new ApiError("Pending payment not found", 404);
      }

      // Only the payer can cancel a payment
      if (transaction.from_user_id !== user_id) {
        throw new ApiError("Unauthorized to cancel this payment", 403);
      }

      // Update transaction status
      await transaction.update({ status: TRANSACTION_STATUS.CANCELLED });

      res.status(200).json({
        success: true,
        message: "Payment cancelled successfully",
        data: {
          id: transaction.id,
          reference: transaction.reference,
          status: TRANSACTION_STATUS.CANCELLED,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = paymentController;
