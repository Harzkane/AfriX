// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/controllers/paymentController.js

const { Transaction } = require("../models");
const { Merchant } = require("../models");
const { Wallet } = require("../models");
const { User } = require("../models");
const { sequelize } = require("../models");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  TOKEN_TYPES,
} = require("../config/constants");
const { generateTransactionReference } = require("../utils/helpers");
const { ApiError } = require("../utils/errors");
const { emitMerchantWebhook } = require("../services/merchantWebhookService");
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
      const {
        transaction_id,
        reference,
        merchant_id,
        amount,
        currency,
        token_type,
        description,
        metadata,
      } = req.body;
      const user_id = req.user.id;
      const tokenType = token_type || currency;

      const validCurrencies = Object.values(TOKEN_TYPES);
      if (!validCurrencies.includes(tokenType)) {
        throw new ApiError(
          `Invalid currency. Supported currencies are: ${validCurrencies.join(
            ", "
          )}`,
          400
        );
      }

      let existingPaymentRequest = null;

      if (transaction_id || reference) {
        const pendingWhere = {
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.PENDING,
        };

        if (transaction_id) {
          pendingWhere.id = transaction_id;
        } else {
          pendingWhere.reference = reference;
        }

        existingPaymentRequest = await Transaction.findOne({ where: pendingWhere });
      }

      // Find the merchant
      const merchant = await Merchant.findByPk(
        existingPaymentRequest?.merchant_id || merchant_id
      );
      if (!merchant) {
        throw new ApiError("Merchant not found", 404);
      }

      if (
        existingPaymentRequest &&
        merchant_id &&
        existingPaymentRequest.merchant_id !== merchant_id
      ) {
        throw new ApiError("Payment request does not belong to the provided merchant", 400);
      }

      const effectiveAmount = existingPaymentRequest
        ? parseFloat(existingPaymentRequest.amount)
        : parseFloat(amount);
      const effectiveTokenType = existingPaymentRequest?.token_type || tokenType;
      const effectiveDescription =
        description || existingPaymentRequest?.description || `Payment to ${merchant.business_name}`;

      if (
        existingPaymentRequest &&
        amount !== undefined &&
        parseFloat(amount) !== parseFloat(existingPaymentRequest.amount)
      ) {
        throw new ApiError("Amount does not match the pending payment request", 400);
      }

      if (
        existingPaymentRequest &&
        tokenType &&
        existingPaymentRequest.token_type !== tokenType
      ) {
        throw new ApiError("Token type does not match the pending payment request", 400);
      }

      // Find user wallet with matching currency
      const userWallet = await Wallet.findOne({
        where: { user_id, token_type: effectiveTokenType },
      });

      if (!userWallet) {
        throw new ApiError(`You don't have a ${effectiveTokenType} wallet`, 400);
      }

      // Check if user has sufficient balance
      if (parseFloat(userWallet.balance) < effectiveAmount) {
        throw new ApiError("Insufficient balance", 400);
      }

      // Find merchant settlement wallet
      const merchantWallet = await Wallet.findByPk(
        merchant.settlement_wallet_id
      );
      if (!merchantWallet) {
        throw new ApiError("Merchant settlement wallet not found", 500);
      }

      if (merchantWallet.token_type !== effectiveTokenType) {
        throw new ApiError(
          `Merchant settlement wallet does not accept ${effectiveTokenType}`,
          400
        );
      }

      // Calculate fee
      const feePercentage = merchant.payment_fee_percent || 1.5; // Default to 1.5%
      const fee = (effectiveAmount * feePercentage) / 100;
      const netAmount = effectiveAmount - fee;

      const transaction = await sequelize.transaction(async (dbTransaction) => {
        let createdTransaction;

        if (existingPaymentRequest) {
          existingPaymentRequest.status = TRANSACTION_STATUS.COMPLETED;
          existingPaymentRequest.fee = fee.toString();
          existingPaymentRequest.from_user_id = user_id;
          existingPaymentRequest.to_user_id = merchant.user_id;
          existingPaymentRequest.from_wallet_id = userWallet.id;
          existingPaymentRequest.to_wallet_id = merchantWallet.id;
          existingPaymentRequest.processed_at = new Date();
          existingPaymentRequest.description = effectiveDescription;
          existingPaymentRequest.metadata = {
            ...(existingPaymentRequest.metadata || {}),
            ...(metadata || {}),
            completed_from_payment_request: true,
          };

          createdTransaction = await existingPaymentRequest.save({
            transaction: dbTransaction,
          });
        } else {
          createdTransaction = await Transaction.create(
            {
              reference: generateTransactionReference(),
              type: TRANSACTION_TYPES.COLLECTION,
              status: TRANSACTION_STATUS.COMPLETED,
              amount: effectiveAmount,
              fee: fee.toString(),
              token_type: effectiveTokenType,
              merchant_id: merchant.id,
              description: effectiveDescription,
              metadata: metadata || {},
              from_user_id: user_id,
              to_user_id: merchant.user_id,
              from_wallet_id: userWallet.id,
              to_wallet_id: merchantWallet.id,
              processed_at: new Date(),
            },
            { transaction: dbTransaction }
          );
        }

        await userWallet.decrement("balance", {
          by: effectiveAmount,
          transaction: dbTransaction,
        });
        await merchantWallet.increment("balance", {
          by: netAmount,
          transaction: dbTransaction,
        });

        return createdTransaction;
      });

      // Fire the collection.completed webhook
      setImmediate(() =>
        emitMerchantWebhook(merchant.id, {
          event: "collection.completed",
          eventId: `afrix-collection-${transaction.id}`,
          data: {
            transaction_id: transaction.id,
            reference: transaction.reference,
            amount: effectiveAmount,
            fee: fee.toString(),
            net_amount: netAmount.toString(),
            token_type: effectiveTokenType,
            status: transaction.status,
            description: transaction.description,
            created_at: transaction.created_at,
          },
        })
      );

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          transaction_id: transaction.id,
          reference: transaction.reference,
          amount: effectiveAmount,
          fee: fee.toString(),
          net_amount: netAmount.toString(),
          currency: effectiveTokenType,
          token_type: effectiveTokenType,
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
          },
          {
            model: Merchant,
            as: "merchant",
            attributes: ["id", "business_name", "display_name", "logo_url"],
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
          currency: transaction.token_type,
          token_type: transaction.token_type,
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
          merchant: transaction.merchant
            ? {
                id: transaction.merchant.id,
                business_name: transaction.merchant.business_name,
                display_name: transaction.merchant.display_name,
                logo_url: transaction.merchant.logo_url,
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
