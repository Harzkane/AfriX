const crypto = require("crypto");
const axios = require("axios");
const { Op } = require("sequelize");
const { sequelize, Transaction, Wallet, User, Merchant } = require("../models");
const { sendAccountLinkVerificationCode } = require("../services/emailService");
const {
  TOKEN_TYPES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");

const buildReference = (idempotencyKey) => {
  const hash = crypto.createHash("sha256").update(idempotencyKey).digest("hex");
  return `KAALIS-${hash.slice(0, 24)}`;
};

const linkVerificationSessions = new Map();
const LINK_VERIFICATION_TTL_MS = 10 * 60 * 1000;

const recordKaalisWebhookHealth = async ({
  status,
  event,
  reference = "",
  httpStatus = null,
  error = "",
}) => {
  const merchantId = process.env.KAALIS_AFRIEXCHANGE_MERCHANT_ID;
  if (!merchantId) {
    return;
  }

  try {
    await Merchant.update(
      {
        integration_health: {
          last_webhook_attempt_at: new Date().toISOString(),
          last_webhook_event: event || "",
          last_webhook_reference: reference || "",
          last_webhook_status: status || "",
          last_webhook_http_status: httpStatus,
          last_webhook_error: error || "",
        },
      },
      { where: { id: merchantId } }
    );
  } catch (updateError) {
    console.error("Failed to update Kaalis webhook health:", updateError.message);
  }
};

const emitKaalisWebhook = async (payload) => {
  const webhookUrl = process.env.KAALIS_AFRIEXCHANGE_WEBHOOK_URL;
  const webhookSecret = process.env.KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    return;
  }

  const timestamp = new Date().toISOString();
  const rawBody = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    const response = await axios.post(webhookUrl, rawBody, {
      headers: {
        "content-type": "application/json",
        "x-afriexchange-timestamp": timestamp,
        "x-afriexchange-signature": `sha256=${signature}`,
      },
      timeout: 5000,
    });

    await recordKaalisWebhookHealth({
      status: "delivered",
      event: payload?.event,
      reference: payload?.data?.reference || payload?.data?.kaalisPayoutId || "",
      httpStatus: response.status,
    });
  } catch (error) {
    await recordKaalisWebhookHealth({
      status: "failed",
      event: payload?.event,
      reference: payload?.data?.reference || payload?.data?.kaalisPayoutId || "",
      httpStatus: error.response?.status || null,
      error: error.message,
    });
    console.error("Failed to emit Kaalis webhook:", error.message);
  }
};

const findUserAndWallet = async ({
  userId,
  walletAddress,
  accountEmail,
  tokenType,
}) => {
  const userWhere = userId ? { id: userId } : accountEmail ? { email: accountEmail } : null;
  let user = userWhere ? await User.findOne({ where: userWhere }) : null;

  let wallet = null;
  if (user) {
    wallet = await Wallet.findOne({
      where: {
        user_id: user.id,
        token_type: tokenType,
        is_active: true,
        is_frozen: false,
      },
    });
  }

  if (!wallet && walletAddress) {
    wallet = await Wallet.findOne({
      where: {
        blockchain_address: walletAddress,
        token_type: tokenType,
        is_active: true,
        is_frozen: false,
      },
    });
    if (wallet && !user) {
      user = await User.findByPk(wallet.user_id);
    }
  }

  return { user, wallet };
};

const resolveLinkedAccount = async ({
  userId,
  walletAddress,
  accountEmail,
  tokenType,
}) => {
  const normalizedEmail = accountEmail?.trim().toLowerCase() || "";
  const normalizedWalletAddress = walletAddress?.trim() || "";
  const normalizedUserId = userId?.trim() || "";

  if (!normalizedUserId && !normalizedWalletAddress && !normalizedEmail) {
    throw new ApiError(
      "Provide an AfriExchange user ID, wallet address, or account email",
      400
    );
  }

  let resolvedUser = null;
  let resolvedWallet = null;

  if (normalizedUserId) {
    const userById = await User.findByPk(normalizedUserId);
    if (!userById) {
      throw new ApiError("AfriExchange user not found for the provided user ID", 404);
    }
    resolvedUser = userById;
  }

  if (normalizedEmail) {
    const userByEmail = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (!userByEmail) {
      throw new ApiError("AfriExchange user not found for the provided account email", 404);
    }

    if (resolvedUser && resolvedUser.id !== userByEmail.id) {
      throw new ApiError(
        "Provided AfriExchange user ID and account email belong to different profiles",
        400
      );
    }

    resolvedUser = userByEmail;
  }

  if (normalizedWalletAddress) {
    const walletByAddress = await Wallet.findOne({
      where: {
        blockchain_address: normalizedWalletAddress,
        token_type: tokenType,
        is_active: true,
        is_frozen: false,
      },
    });

    if (!walletByAddress) {
      throw new ApiError(
        `AfriExchange ${tokenType} wallet not found for the provided wallet address`,
        404
      );
    }

    const walletUser = await User.findByPk(walletByAddress.user_id);
    if (!walletUser) {
      throw new ApiError("AfriExchange wallet owner profile not found", 404);
    }

    if (resolvedUser && resolvedUser.id !== walletUser.id) {
      throw new ApiError(
        "Provided AfriExchange identifiers belong to different profiles",
        400
      );
    }

    resolvedUser = walletUser;
    resolvedWallet = walletByAddress;
  }

  if (!resolvedUser) {
    throw new ApiError("AfriExchange profile could not be resolved", 404);
  }

  if (!resolvedWallet) {
    resolvedWallet = await Wallet.findOne({
      where: {
        user_id: resolvedUser.id,
        token_type: tokenType,
        is_active: true,
        is_frozen: false,
      },
      order: [["created_at", "ASC"]],
    });
  }

  if (!resolvedWallet) {
    throw new ApiError(
      `Resolved AfriExchange profile does not have an active ${tokenType} wallet`,
      404
    );
  }

  return {
    user: resolvedUser,
    wallet: resolvedWallet,
  };
};

const generateVerificationCode = () =>
  `${Math.floor(100000 + Math.random() * 900000)}`;

const maskEmail = (email = "") => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const start = local.slice(0, 2);
  const end = local.length > 2 ? local.slice(-1) : "";
  return `${start}${"*".repeat(Math.max(local.length - 3, 1))}${end}@${domain}`;
};

const authenticateKaalis = (req, res, next) => {
  const configuredKey = process.env.KAALIS_INTEGRATION_API_KEY;
  const providedKey = req.header("x-kaalis-api-key");

  if (!configuredKey) {
    return res.status(503).json({
      success: false,
      message: "Kaalis integration API key is not configured",
    });
  }

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: "Invalid Kaalis integration API key",
    });
  }

  next();
};

const kaalisIntegrationController = {
  authenticateKaalis,

  async verifyAccount(req, res, next) {
    try {
      const {
        afriExchangeUserId,
        walletAddress,
        accountEmail,
        tokenType = TOKEN_TYPES.CT,
      } = req.body;

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError("Invalid tokenType", 400);
      }

      const { user, wallet } = await resolveLinkedAccount({
        userId: afriExchangeUserId,
        walletAddress,
        accountEmail,
        tokenType,
      });

      return res.status(200).json({
        success: true,
        data: {
          verified: true,
          tokenType,
          user: {
            id: user.id,
            email: user.email,
          },
          wallet: {
            id: wallet.id,
            blockchain_address: wallet.blockchain_address,
            token_type: wallet.token_type,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async requestLinkVerification(req, res, next) {
    try {
      const {
        afriExchangeUserId,
        walletAddress,
        accountEmail,
        tokenType = TOKEN_TYPES.CT,
      } = req.body;

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError("Invalid tokenType", 400);
      }

      const { user, wallet } = await resolveLinkedAccount({
        userId: afriExchangeUserId,
        walletAddress,
        accountEmail,
        tokenType,
      });

      const requestId = crypto.randomUUID();
      const code = generateVerificationCode();
      const expiresAt = Date.now() + LINK_VERIFICATION_TTL_MS;

      linkVerificationSessions.set(requestId, {
        requestId,
        code,
        tokenType,
        userId: user.id,
        email: user.email,
        walletId: wallet.id,
        walletAddress: wallet.blockchain_address,
        expiresAt,
        attempts: 0,
      });

      await sendAccountLinkVerificationCode(user.email, user.full_name, code);

      return res.status(200).json({
        success: true,
        data: {
          requestId,
          expiresInSeconds: Math.floor(LINK_VERIFICATION_TTL_MS / 1000),
          maskedEmail: maskEmail(user.email),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async confirmLinkVerification(req, res, next) {
    try {
      const { requestId, code } = req.body;

      if (!requestId || !code) {
        throw new ApiError("requestId and code are required", 400);
      }

      const session = linkVerificationSessions.get(requestId);
      if (!session) {
        throw new ApiError("Link verification request not found or expired", 404);
      }

      if (session.expiresAt < Date.now()) {
        linkVerificationSessions.delete(requestId);
        throw new ApiError("Link verification code has expired", 410);
      }

      session.attempts += 1;
      if (session.attempts > 5) {
        linkVerificationSessions.delete(requestId);
        throw new ApiError("Too many invalid verification attempts", 429);
      }

      if (String(code).trim() !== session.code) {
        throw new ApiError("Invalid verification code", 400);
      }

      linkVerificationSessions.delete(requestId);

      const user = await User.findByPk(session.userId);
      const wallet = await Wallet.findByPk(session.walletId);

      if (!user || !wallet) {
        throw new ApiError("Resolved AfriExchange account is no longer available", 404);
      }

      return res.status(200).json({
        success: true,
        data: {
          verified: true,
          tokenType: session.tokenType,
          user: {
            id: user.id,
            email: user.email,
          },
          wallet: {
            id: wallet.id,
            blockchain_address: wallet.blockchain_address,
            token_type: wallet.token_type,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createPayout(req, res, next) {
    try {
      const {
        idempotencyKey,
        kaalisPayoutId,
        kaalisVendorId,
        vendorAfriExchangeUserId,
        vendorWalletAddress,
        vendorAccountEmail,
        amount,
        tokenType = TOKEN_TYPES.CT,
        country,
        description,
        metadata = {},
      } = req.body;

      if (!idempotencyKey || !kaalisPayoutId || !amount) {
        throw new ApiError(
          "idempotencyKey, kaalisPayoutId, and amount are required",
          400
        );
      }

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError("Invalid tokenType", 400);
      }

      if (parseFloat(amount) <= 0) {
        throw new ApiError("Amount must be greater than 0", 400);
      }

      const reference = buildReference(idempotencyKey);
      const existingTransaction = await Transaction.findOne({
        where: { reference },
      });

      if (existingTransaction) {
        return res.status(200).json({
          success: true,
          data: {
            provider: "afriexchange",
            payoutId: existingTransaction.id,
            kaalisPayoutId,
            status: existingTransaction.status,
            reference: existingTransaction.reference,
            idempotent: true,
          },
        });
      }

      const { user: vendorUser, wallet: vendorWallet } = await findUserAndWallet({
        userId: vendorAfriExchangeUserId,
        walletAddress: vendorWalletAddress,
        accountEmail: vendorAccountEmail,
        tokenType,
      });

      if (!vendorUser || !vendorWallet) {
        throw new ApiError("Vendor AfriExchange wallet not found", 404);
      }

      const payoutTransaction = await sequelize.transaction(async (dbTransaction) => {
        const createdTransaction = await Transaction.create(
          {
            reference,
            type: TRANSACTION_TYPES.CREDIT,
            status: TRANSACTION_STATUS.COMPLETED,
            amount,
            fee: 0,
            token_type: tokenType,
            description: description || "Kaalis vendor settlement",
            metadata: {
              ...metadata,
              source: "kaalis",
              idempotencyKey,
              kaalisPayoutId,
              kaalisVendorId,
              country,
            },
            from_user_id: null,
            to_user_id: vendorUser.id,
            from_wallet_id: null,
            to_wallet_id: vendorWallet.id,
            processed_at: new Date(),
          },
          { transaction: dbTransaction }
        );

        await vendorWallet.increment("balance", {
          by: amount,
          transaction: dbTransaction,
        });
        await vendorWallet.increment("total_received", {
          by: amount,
          transaction: dbTransaction,
        });
        await vendorWallet.increment("transaction_count", {
          by: 1,
          transaction: dbTransaction,
        });

        return createdTransaction;
      });

      emitKaalisWebhook({
        event: "payout.completed",
        eventId: `afriexchange-payout-${payoutTransaction.id}-${payoutTransaction.status}`,
        data: {
          kaalisPayoutId,
          kaalisVendorId,
          payoutId: payoutTransaction.id,
          reference: payoutTransaction.reference,
          status: payoutTransaction.status,
          amount: payoutTransaction.amount,
          tokenType: payoutTransaction.token_type,
          processedAt: payoutTransaction.processed_at,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          provider: "afriexchange",
          payoutId: payoutTransaction.id,
          kaalisPayoutId,
          status: payoutTransaction.status,
          reference: payoutTransaction.reference,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createCollection(req, res, next) {
    try {
      const {
        idempotencyKey,
        kaalisOrderId,
        kaalisBuyerId,
        buyerAfriExchangeUserId,
        buyerWalletAddress,
        buyerAccountEmail,
        merchantId = process.env.KAALIS_AFRIEXCHANGE_MERCHANT_ID,
        amount,
        tokenType = TOKEN_TYPES.CT,
        description,
        metadata = {},
      } = req.body;

      if (!idempotencyKey || !kaalisOrderId || !amount) {
        throw new ApiError(
          "idempotencyKey, kaalisOrderId, and amount are required",
          400
        );
      }

      if (!merchantId) {
        throw new ApiError("Kaalis AfriExchange merchant ID is not configured", 503);
      }

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError("Invalid tokenType", 400);
      }

      if (parseFloat(amount) <= 0) {
        throw new ApiError("Amount must be greater than 0", 400);
      }

      const reference = buildReference(`collection-${idempotencyKey}`);
      const existingTransaction = await Transaction.findOne({
        where: { reference },
      });

      if (existingTransaction) {
        return res.status(200).json({
          success: true,
          data: {
            provider: "afriexchange",
            collectionId: existingTransaction.id,
            kaalisOrderId,
            status: existingTransaction.status,
            reference: existingTransaction.reference,
            idempotent: true,
          },
        });
      }

      const merchant = await Merchant.findByPk(merchantId);
      if (!merchant) {
        const walletWithConfiguredId = await Wallet.findByPk(merchantId);
        if (walletWithConfiguredId) {
          throw new ApiError(
            "Kaalis AfriExchange merchant not found. KAALIS_AFRIEXCHANGE_MERCHANT_ID is set to a wallet id; use the merchants.id value instead.",
            400
          );
        }

        throw new ApiError("Kaalis AfriExchange merchant not found", 404);
      }

      const merchantWallet = await Wallet.findByPk(merchant.settlement_wallet_id);
      if (!merchantWallet || merchantWallet.token_type !== tokenType) {
        throw new ApiError(
          `Kaalis merchant settlement wallet does not accept ${tokenType}`,
          400
        );
      }

      const { user: buyerUser, wallet: buyerWallet } = await findUserAndWallet({
        userId: buyerAfriExchangeUserId,
        walletAddress: buyerWalletAddress,
        accountEmail: buyerAccountEmail,
        tokenType,
      });

      if (!buyerUser || !buyerWallet) {
        throw new ApiError("Buyer AfriExchange wallet not found", 404);
      }

      if (parseFloat(buyerWallet.balance) < parseFloat(amount)) {
        throw new ApiError("Insufficient buyer CT balance", 400);
      }

      const collectionTransaction = await sequelize.transaction(
        async (dbTransaction) => {
          const createdTransaction = await Transaction.create(
            {
              reference,
              type: TRANSACTION_TYPES.COLLECTION,
              status: TRANSACTION_STATUS.COMPLETED,
              amount,
              fee: 0,
              token_type: tokenType,
              merchant_id: merchant.id,
              description: description || "Kaalis checkout collection",
              metadata: {
                ...metadata,
                source: "kaalis",
                idempotencyKey,
                kaalisOrderId,
                kaalisBuyerId,
              },
              from_user_id: buyerUser.id,
              to_user_id: merchant.user_id,
              from_wallet_id: buyerWallet.id,
              to_wallet_id: merchantWallet.id,
              processed_at: new Date(),
            },
            { transaction: dbTransaction }
          );

          await buyerWallet.decrement("balance", {
            by: amount,
            transaction: dbTransaction,
          });
          await buyerWallet.increment("total_sent", {
            by: amount,
            transaction: dbTransaction,
          });
          await buyerWallet.increment("transaction_count", {
            by: 1,
            transaction: dbTransaction,
          });
          await merchantWallet.increment("balance", {
            by: amount,
            transaction: dbTransaction,
          });
          await merchantWallet.increment("total_received", {
            by: amount,
            transaction: dbTransaction,
          });
          await merchantWallet.increment("transaction_count", {
            by: 1,
            transaction: dbTransaction,
          });

          return createdTransaction;
        }
      );

      res.status(201).json({
        success: true,
        data: {
          provider: "afriexchange",
          collectionId: collectionTransaction.id,
          kaalisOrderId,
          status: collectionTransaction.status,
          reference: collectionTransaction.reference,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getPayout(req, res, next) {
    try {
      const { id } = req.params;
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          id
        );
      const where = isUuid
        ? { [Op.or]: [{ id }, { reference: id }] }
        : { reference: id };

      const payout = await Transaction.findOne({
        where,
        include: [
          {
            model: Wallet,
            as: "toWallet",
            attributes: ["id", "user_id", "token_type", "balance"],
          },
        ],
      });

      if (!payout || payout.metadata?.source !== "kaalis") {
        throw new ApiError("Kaalis payout not found", 404);
      }

      res.json({
        success: true,
        data: {
          provider: "afriexchange",
          payoutId: payout.id,
          kaalisPayoutId: payout.metadata?.kaalisPayoutId,
          status: payout.status,
          reference: payout.reference,
          amount: payout.amount,
          tokenType: payout.token_type,
          wallet: payout.toWallet,
          processedAt: payout.processed_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = kaalisIntegrationController;
