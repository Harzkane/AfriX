// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/controllers/paymentController.js

const { Transaction } = require("../models");
const { Merchant } = require("../models");
const { Wallet } = require("../models");
const { User } = require("../models");
const { sequelize } = require("../models");
const { Op } = require("sequelize");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  TOKEN_TYPES,
} = require("../config/constants");
const { generateTransactionReference } = require("../utils/helpers");
const { ApiError } = require("../utils/errors");
const { emitMerchantWebhook } = require("../services/merchantWebhookService");

/**
 * Helper to build Sequelize where clause for looking up collection transactions by ID or Reference safely.
 * Checks UUID validity before adding `{ id: uuid }` condition to prevent Postgres 22P02 errors.
 */
const buildTransactionLookupWhere = (id, extraWhere = {}) => {
  const cleanId = typeof id === "string" ? id.replace(/^RQST-/i, "") : id;
  const isUuid =
    typeof cleanId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

  const orConditions = [
    { reference: id },
    { reference: cleanId },
    { reference: `RQST-${cleanId}` },
  ];
  if (isUuid) {
    orConditions.push({ id: cleanId });
  }

  return {
    type: TRANSACTION_TYPES.COLLECTION,
    [Op.or]: orConditions,
    ...extraWhere,
  };
};

/**
 * Payment Controller
 * Handles merchant and P2P payment processing and verification
 */
const paymentController = {
  /**
   * Process a payment to a merchant or P2P recipient user
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
        password,
      } = req.body;
      const user_id = req.user.id;
      const tokenType = token_type || currency;
      const requestLookup = transaction_id || reference || null;

      // ── Security: require password re-confirmation before executing payment ──
      if (!password) {
        throw new ApiError("Authorization password is required to complete this payment", 400);
      }

      const authorizedUser = await User.findByPk(user_id);
      if (!authorizedUser) {
        throw new ApiError("User not found", 404);
      }
      const passwordValid = await authorizedUser.comparePassword(password);
      if (!passwordValid) {
        throw new ApiError("Invalid authorization password", 401);
      }

      const validCurrencies = Object.values(TOKEN_TYPES);
      if (!validCurrencies.includes(tokenType)) {
        throw new ApiError(
          `Invalid currency. Supported currencies are: ${validCurrencies.join(", ")}`,
          400
        );
      }

      let existingPaymentRequest = null;

      if (requestLookup) {
        existingPaymentRequest = await Transaction.findOne({
          where: buildTransactionLookupWhere(requestLookup),
        });

        if (!existingPaymentRequest) {
          throw new ApiError("Payment request not found", 404);
        }

        if (existingPaymentRequest.status !== TRANSACTION_STATUS.PENDING) {
          if (existingPaymentRequest.status === TRANSACTION_STATUS.CANCELLED) {
            throw new ApiError(
              "This payment request has been cancelled by the creator and is no longer valid.",
              400
            );
          }
          throw new ApiError(
            "This payment request has already been paid and fulfilled.",
            409
          );
        }
      }

      const effectiveAmount = existingPaymentRequest
        ? parseFloat(existingPaymentRequest.amount)
        : parseFloat(amount);
      const effectiveTokenType = existingPaymentRequest?.token_type || tokenType;

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

      // Determine payment destination (Merchant or P2P User)
      const targetMerchantId = existingPaymentRequest?.merchant_id || merchant_id || null;
      let merchant = null;
      let targetUser = null;
      let targetWallet = null;
      let fee = 0;
      let netAmount = effectiveAmount;

      if (targetMerchantId) {
        merchant = await Merchant.findByPk(targetMerchantId);
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
        targetWallet = await Wallet.findByPk(merchant.settlement_wallet_id);
        if (!targetWallet) {
          throw new ApiError("Merchant settlement wallet not found", 500);
        }
        if (targetWallet.token_type !== effectiveTokenType) {
          throw new ApiError(
            `Merchant settlement wallet does not accept ${effectiveTokenType}`,
            400
          );
        }
        const feePercentage = merchant.payment_fee_percent || 1.5;
        fee = (effectiveAmount * feePercentage) / 100;
        netAmount = effectiveAmount - fee;
      } else if (existingPaymentRequest && existingPaymentRequest.to_user_id) {
        targetUser = await User.findByPk(existingPaymentRequest.to_user_id);
        if (!targetUser) {
          throw new ApiError("Recipient user not found", 404);
        }
        targetWallet = await Wallet.findOne({
          where: { user_id: targetUser.id, token_type: effectiveTokenType },
        });
        if (!targetWallet) {
          targetWallet = await Wallet.create({
            user_id: targetUser.id,
            token_type: effectiveTokenType,
            balance: 0,
          });
        }
        fee = 0;
        netAmount = effectiveAmount;
      } else {
        throw new ApiError("Invalid payment destination: neither merchant nor recipient user found", 400);
      }

      const effectiveDescription =
        description || existingPaymentRequest?.description || (merchant ? `Payment to ${merchant.business_name}` : `Payment to ${targetUser?.full_name || targetUser?.email}`);

      const transaction = await sequelize.transaction(async (dbTransaction) => {
        let createdTransaction;

        if (existingPaymentRequest) {
          existingPaymentRequest.status = TRANSACTION_STATUS.COMPLETED;
          existingPaymentRequest.fee = fee.toString();
          existingPaymentRequest.from_user_id = user_id;
          existingPaymentRequest.to_user_id = merchant ? merchant.user_id : targetUser.id;
          existingPaymentRequest.merchant_id = merchant ? merchant.id : null;
          existingPaymentRequest.from_wallet_id = userWallet.id;
          existingPaymentRequest.to_wallet_id = targetWallet.id;
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
              merchant_id: merchant ? merchant.id : null,
              description: effectiveDescription,
              metadata: metadata || {},
              from_user_id: user_id,
              to_user_id: merchant ? merchant.user_id : targetUser.id,
              from_wallet_id: userWallet.id,
              to_wallet_id: targetWallet.id,
              processed_at: new Date(),
            },
            { transaction: dbTransaction }
          );
        }

        await userWallet.decrement("balance", {
          by: effectiveAmount,
          transaction: dbTransaction,
        });
        await targetWallet.increment("balance", {
          by: netAmount,
          transaction: dbTransaction,
        });

        return createdTransaction;
      });

      if (merchant) {
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
      }

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
   * Get payment details by ID or reference
   */
  async getPaymentDetails(req, res, next) {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findOne({
        where: buildTransactionLookupWhere(id),
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

      const isPendingHostedRequest =
        transaction.status === TRANSACTION_STATUS.PENDING &&
        !transaction.from_user_id;

      if (
        req.user &&
        !isPendingHostedRequest &&
        req.user.id !== transaction.from_user_id &&
        req.user.id !== transaction.to_user_id
      ) {
        throw new ApiError("Unauthorized to view this payment", 403);
      }

      let expiresAt = transaction.metadata?.expires_at || null;
      if (!expiresAt && transaction.metadata?.expiration_days) {
        if (transaction.metadata.expiration_days === "never") {
          expiresAt = null;
        } else {
          const days = parseInt(transaction.metadata.expiration_days, 10);
          if (days > 0 && transaction.created_at) {
            expiresAt = new Date(new Date(transaction.created_at).getTime() + days * 24 * 60 * 60 * 1000).toISOString();
          }
        }
      } else if (!expiresAt && transaction.created_at && !transaction.metadata?.expiration_days) {
        // Path A Merchant checkout default window: 30 minutes
        expiresAt = new Date(new Date(transaction.created_at).getTime() + 30 * 60 * 1000).toISOString();
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
          metadata: transaction.metadata || {},
          status: transaction.status,
          created_at: transaction.created_at,
          expires_at: expiresAt,
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
   */
  async verifyPayment(req, res, next) {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findOne({
        where: buildTransactionLookupWhere(id),
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
   */
  async cancelPayment(req, res, next) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const transaction = await Transaction.findOne({
        where: buildTransactionLookupWhere(id, { status: TRANSACTION_STATUS.PENDING }),
      });

      if (!transaction) {
        throw new ApiError("Pending payment not found", 404);
      }

      if (transaction.from_user_id !== user_id) {
        throw new ApiError("Unauthorized to cancel this payment", 403);
      }

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
