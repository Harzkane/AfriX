/**
 * renthubIntegrationController.js
 *
 * Handles AfriExchange ↔ RentHub integration:
 *  - POST /integrations/renthub/collections  — tenant pays rent into escrow
 *  - POST /integrations/renthub/payouts      — landlord receives released escrow
 *  - GET  /integrations/renthub/payouts/:id  — fetch payout status
 *
 * Modelled after kaalisIntegrationController.js.
 */

const crypto = require("crypto");
const { Op } = require("sequelize");
const { sequelize, Transaction, Wallet, User, Merchant } = require("../models");
const {
  TOKEN_TYPES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildReference = (idempotencyKey) => {
  const hash = crypto.createHash("sha256").update(idempotencyKey).digest("hex");
  return `RENTHUB-${hash.slice(0, 24)}`;
};

/**
 * Resolve a buyer (tenant) by one of: userId, walletAddress, accountEmail.
 */
const resolveBuyer = async ({ userId, walletAddress, accountEmail, tokenType }) => {
  let user = null;

  if (userId) {
    user = await User.findByPk(userId);
  }
  if (!user && accountEmail) {
    user = await User.findOne({ where: { email: accountEmail } });
  }
  if (!user) {
    throw new ApiError(
      "Tenant AfriExchange account not found. Provide buyerAfriExchangeUserId or buyerAccountEmail.",
      404
    );
  }

  let wallet;
  if (walletAddress) {
    wallet = await Wallet.findOne({
      where: { user_id: user.id, blockchain_address: walletAddress, token_type: tokenType },
    });
  } else {
    wallet = await Wallet.findOne({
      where: { user_id: user.id, token_type: tokenType, is_active: true },
    });
  }

  if (!wallet) {
    throw new ApiError("Tenant AfriExchange wallet not found", 404);
  }

  return { user, wallet };
};

/**
 * Resolve the RentHub settlement merchant from env or DB.
 */
const resolveRentHubMerchant = async () => {
  const merchantId = process.env.RENTHUB_AFRIEXCHANGE_MERCHANT_ID;
  let merchant = null;

  if (merchantId) {
    merchant = await Merchant.findByPk(merchantId);
  }
  if (!merchant) {
    merchant = await Merchant.findOne({ where: { business_name: "RentHub" } });
  }
  if (!merchant) {
    const rh = await User.findOne({ where: { email: "renthub@afriexchange.local" } });
    if (rh) {
      merchant = await Merchant.findOne({ where: { user_id: rh.id } });
    }
  }

  return merchant;
};

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const authenticateRentHub = (req, res, next) => {
  const configuredKey = process.env.RENTHUB_INTEGRATION_API_KEY
    || process.env.KAALIS_INTEGRATION_API_KEY; // shared key fallback for local dev

  // Also accept the per-merchant API key stored on the merchant record
  // (RentHub sends its own merchant api_key via x-renthub-api-key header)
  const providedKey = req.header("x-renthub-api-key");

  if (!configuredKey && !providedKey) {
    return res.status(503).json({
      success: false,
      message: "RentHub integration API key is not configured on the server",
    });
  }

  // Validate against env key if present; otherwise allow merchant-level key check below
  if (configuredKey && (!providedKey || providedKey !== configuredKey)) {
    // Try merchant-level API key validation
    return validateMerchantApiKey(req, res, next, providedKey);
  }

  next();
};

const validateMerchantApiKey = async (req, res, next, providedKey) => {
  try {
    if (!providedKey) {
      return res.status(401).json({ success: false, message: "Missing x-renthub-api-key header" });
    }
    const merchant = await Merchant.findOne({ where: { api_key: providedKey, business_name: "RentHub" } });
    if (!merchant) {
      return res.status(401).json({ success: false, message: "Invalid RentHub integration API key" });
    }
    req.rentHubMerchant = merchant;
    next();
  } catch (err) {
    next(err);
  }
};

// ─── Controller ──────────────────────────────────────────────────────────────

const renthubIntegrationController = {
  authenticateRentHub,

  /**
   * POST /integrations/renthub/collections
   * Tenant pays rent into RentHub escrow using their AfriExchange CT wallet.
   */
  async createCollection(req, res, next) {
    try {
      const {
        idempotencyKey,
        rentHubTransactionId,
        tenantId,
        buyerAfriExchangeUserId,
        buyerWalletAddress,
        buyerAccountEmail,
        amount,
        currency = "NGN",
        tokenType = TOKEN_TYPES.CT,
        description,
        metadata = {},
      } = req.body;

      if (!idempotencyKey || !rentHubTransactionId || !amount) {
        throw new ApiError("idempotencyKey, rentHubTransactionId, and amount are required", 400);
      }

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError("Invalid tokenType", 400);
      }

      if (parseFloat(amount) <= 0) {
        throw new ApiError("Amount must be greater than 0", 400);
      }

      const reference = buildReference(`collection-${idempotencyKey}`);

      // Idempotency check
      const existing = await Transaction.findOne({ where: { reference } });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: {
            provider: "afriexchange",
            reference: existing.reference,
            collectionId: existing.id,
            status: existing.status,
            idempotent: true,
          },
        });
      }

      // Resolve tenant's AfriExchange wallet
      const { user: buyerUser, wallet: buyerWallet } = await resolveBuyer({
        userId: buyerAfriExchangeUserId || tenantId,
        walletAddress: buyerWalletAddress,
        accountEmail: buyerAccountEmail,
        tokenType,
      });

      if (buyerWallet.balance < parseFloat(amount)) {
        throw new ApiError("Insufficient AfriExchange wallet balance", 400);
      }

      // Resolve RentHub merchant settlement wallet
      const merchant = await resolveRentHubMerchant();
      if (!merchant) {
        throw new ApiError("RentHub merchant is not configured in AfriExchange. Run: npm run seed:renthub-merchant", 503);
      }

      const merchantWallet = await Wallet.findByPk(merchant.settlement_wallet_id);
      if (!merchantWallet) {
        throw new ApiError("RentHub settlement wallet not found", 503);
      }

      const collectionTx = await sequelize.transaction(async (dbTx) => {
        // Debit tenant wallet
        await buyerWallet.decrement("balance", { by: parseFloat(amount), transaction: dbTx });

        // Credit RentHub escrow settlement wallet
        await merchantWallet.increment("balance", { by: parseFloat(amount), transaction: dbTx });
        await merchantWallet.increment("total_received", { by: parseFloat(amount), transaction: dbTx });

        return await Transaction.create(
          {
            reference,
            type: TRANSACTION_TYPES.DEBIT,
            status: TRANSACTION_STATUS.COMPLETED,
            amount: parseFloat(amount),
            fee: 0,
            token_type: tokenType,
            description: description || `RentHub Escrow Collection — tx:${rentHubTransactionId}`,
            merchant_id: merchant.id,
            from_user_id: buyerUser.id,
            from_wallet_id: buyerWallet.id,
            to_user_id: merchant.user_id,
            to_wallet_id: merchantWallet.id,
            metadata: {
              ...metadata,
              source: "renthub",
              collection_type: "rent_escrow",
              idempotencyKey,
              rentHubTransactionId,
              tenantId,
              currency,
              tenant_email: buyerUser.email,
              tenant_name: buyerUser.full_name,
            },
            processed_at: new Date(),
          },
          { transaction: dbTx }
        );
      });

      return res.status(201).json({
        success: true,
        data: {
          provider: "afriexchange",
          collectionId: collectionTx.id,
          reference: collectionTx.reference,
          status: collectionTx.status,
          amount: collectionTx.amount,
          tokenType: collectionTx.token_type,
          rentHubTransactionId,
          tenantAfriExchangeUserId: buyerUser.id,
          tenantWalletAddress: buyerWallet.blockchain_address,
          processedAt: collectionTx.processed_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /integrations/renthub/payouts
   * Landlord receives released escrow after key handover OTP verified.
   */
  async createPayout(req, res, next) {
    try {
      const {
        idempotencyKey,
        rentHubTransactionId,
        landlordId,
        landlordAfriExchangeUserId,
        landlordWalletAddress,
        landlordAccountEmail,
        amount,
        grossAmount,
        platformFee,
        currency = "NGN",
        tokenType = TOKEN_TYPES.CT,
        description,
        metadata = {},
      } = req.body;

      if (!idempotencyKey || !rentHubTransactionId || !amount) {
        throw new ApiError("idempotencyKey, rentHubTransactionId, and amount are required", 400);
      }

      if (parseFloat(amount) <= 0) {
        throw new ApiError("Amount must be greater than 0", 400);
      }

      const reference = buildReference(`payout-${idempotencyKey}`);

      // Idempotency check
      const existing = await Transaction.findOne({ where: { reference } });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: {
            provider: "afriexchange",
            payoutId: existing.id,
            reference: existing.reference,
            status: existing.status,
            idempotent: true,
          },
        });
      }

      // Resolve landlord AfriExchange wallet
      const { user: landlordUser, wallet: landlordWallet } = await resolveBuyer({
        userId: landlordAfriExchangeUserId || landlordId,
        walletAddress: landlordWalletAddress,
        accountEmail: landlordAccountEmail,
        tokenType,
      });

      // Debit from RentHub merchant settlement wallet
      const merchant = await resolveRentHubMerchant();
      if (!merchant) {
        throw new ApiError("RentHub merchant is not configured in AfriExchange", 503);
      }

      const merchantWallet = await Wallet.findByPk(merchant.settlement_wallet_id);
      if (!merchantWallet) {
        throw new ApiError("RentHub settlement wallet not found", 503);
      }

      if (merchantWallet.balance < parseFloat(amount)) {
        throw new ApiError("Insufficient RentHub escrow balance for payout", 400);
      }

      const payoutTx = await sequelize.transaction(async (dbTx) => {
        // Debit RentHub escrow
        await merchantWallet.decrement("balance", { by: parseFloat(amount), transaction: dbTx });

        // Credit landlord wallet
        await landlordWallet.increment("balance", { by: parseFloat(amount), transaction: dbTx });
        await landlordWallet.increment("total_received", { by: parseFloat(amount), transaction: dbTx });

        return await Transaction.create(
          {
            reference,
            type: TRANSACTION_TYPES.CREDIT,
            status: TRANSACTION_STATUS.COMPLETED,
            amount: parseFloat(amount),
            fee: 0,
            token_type: tokenType,
            description: description || `RentHub Landlord Payout — tx:${rentHubTransactionId}`,
            merchant_id: merchant.id,
            from_user_id: merchant.user_id,
            from_wallet_id: merchantWallet.id,
            to_user_id: landlordUser.id,
            to_wallet_id: landlordWallet.id,
            metadata: {
              ...metadata,
              source: "renthub",
              payout_type: "landlord_escrow_release",
              idempotencyKey,
              rentHubTransactionId,
              landlordId,
              currency,
              gross_amount: grossAmount,
              platform_fee: platformFee,
              landlord_email: landlordUser.email,
              landlord_name: landlordUser.full_name,
            },
            processed_at: new Date(),
          },
          { transaction: dbTx }
        );
      });

      return res.status(201).json({
        success: true,
        data: {
          provider: "afriexchange",
          payoutId: payoutTx.id,
          reference: payoutTx.reference,
          status: payoutTx.status,
          amount: payoutTx.amount,
          tokenType: payoutTx.token_type,
          rentHubTransactionId,
          landlordAfriExchangeUserId: landlordUser.id,
          landlordWalletAddress: landlordWallet.blockchain_address,
          processedAt: payoutTx.processed_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /integrations/renthub/payouts/:id
   */
  async getPayout(req, res, next) {
    try {
      const { id } = req.params;
      const isUuid = /^[0-9a-f-]{36}$/.test(id);
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

      if (!payout || payout.metadata?.source !== "renthub") {
        throw new ApiError("RentHub payout not found", 404);
      }

      return res.json({
        success: true,
        data: {
          provider: "afriexchange",
          payoutId: payout.id,
          rentHubTransactionId: payout.metadata?.rentHubTransactionId,
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

module.exports = renthubIntegrationController;
