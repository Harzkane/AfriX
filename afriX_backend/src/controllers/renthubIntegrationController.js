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
const { sendAccountLinkVerificationCode } = require("../services/emailService");
const { setCache, getCache, deleteCache } = require("../utils/cache");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildReference = (idempotencyKey) => {
  const hash = crypto.createHash("sha256").update(idempotencyKey).digest("hex");
  return `RENTHUB-${hash.slice(0, 24)}`;
};

const linkVerificationSessions = new Map();
const LINK_VERIFICATION_TTL_MS = 10 * 60 * 1000;
const LINK_VERIFICATION_CACHE_PREFIX = "renthub:link-verification:";
const SHOULD_LOG_LINK_CODES =
  process.env.NODE_ENV !== "production" ||
  process.env.LOG_ACCOUNT_LINK_VERIFICATION_CODES === "true";

const buildLinkVerificationCacheKey = (requestId) =>
  `${LINK_VERIFICATION_CACHE_PREFIX}${requestId}`;

const saveLinkVerificationSession = async (requestId, session) => {
  linkVerificationSessions.set(requestId, session);
  await setCache(
    buildLinkVerificationCacheKey(requestId),
    session,
    Math.ceil(LINK_VERIFICATION_TTL_MS / 1000)
  );
};

const getLinkVerificationSession = async (requestId) => {
  const cachedSession = await getCache(buildLinkVerificationCacheKey(requestId));
  if (cachedSession) {
    linkVerificationSessions.set(requestId, cachedSession);
    return cachedSession;
  }
  return linkVerificationSessions.get(requestId) || null;
};

const deleteLinkVerificationSession = async (requestId) => {
  linkVerificationSessions.delete(requestId);
  await deleteCache(buildLinkVerificationCacheKey(requestId));
};

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const maskEmail = (email = "") => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const start = local.slice(0, 2);
  const end = local.length > 2 ? local.slice(-1) : "";
  return `${start}${"*".repeat(Math.max(local.length - 3, 1))}${end}@${domain}`;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val) => typeof val === "string" && UUID_REGEX.test(val.trim());

/**
 * Resolve a buyer (tenant or landlord) by one of: userId (UUID), walletAddress, accountEmail.
 */
const resolveBuyer = async ({ userId, walletAddress, accountEmail, tokenType }) => {
  let user = null;

  const cleanUserId = typeof userId === "string" ? userId.trim() : null;
  const cleanEmail = typeof accountEmail === "string" ? accountEmail.trim().toLowerCase() : null;
  const cleanWallet = typeof walletAddress === "string" ? walletAddress.trim() : null;

  // 1. If a valid AfriExchange UUID is provided, search by primary key
  if (cleanUserId && isUuid(cleanUserId)) {
    user = await User.findByPk(cleanUserId);
  }

  // 2. Search by account email
  if (!user && cleanEmail) {
    user = await User.findOne({ where: { email: cleanEmail } });
  }

  // 3. Search by blockchain wallet address
  if (!user && cleanWallet) {
    const walletMatch = await Wallet.findOne({
      where: { blockchain_address: cleanWallet, token_type: tokenType },
    });
    if (walletMatch) {
      user = await User.findByPk(walletMatch.user_id);
    }
  }

  if (!user) {
    throw new ApiError(
      `Tenant AfriExchange account not found. Please ensure the email '${cleanEmail || "none provided"}' is registered on AfriExchange.`,
      404
    );
  }

  let wallet;
  if (cleanWallet) {
    wallet = await Wallet.findOne({
      where: { user_id: user.id, blockchain_address: cleanWallet, token_type: tokenType },
    });
  } else {
    wallet = await Wallet.findOne({
      where: { user_id: user.id, token_type: tokenType, is_active: true },
    });
  }

  if (!wallet) {
    throw new ApiError(`Tenant AfriExchange ${tokenType} wallet not found or inactive`, 404);
  }

  return { user, wallet };
};

/**
 * Resolve the RentHub settlement merchant from env or DB.
 */
const resolveRentHubMerchant = async () => {
  const merchantId = process.env.RENTHUB_AFRIEXCHANGE_MERCHANT_ID;
  let merchant = null;

  if (merchantId && isUuid(merchantId)) {
    merchant = await Merchant.findByPk(merchantId.trim());
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

  async verifyAccount(req, res, next) {
    try {
      const {
        afriExchangeUserId,
        walletAddress,
        accountEmail,
        tokenType = TOKEN_TYPES.NT,
      } = req.body;

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError("Invalid tokenType", 400);
      }

      const { user, wallet } = await resolveBuyer({
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
        tokenType = TOKEN_TYPES.NT,
      } = req.body;

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError("Invalid tokenType", 400);
      }

      const { user, wallet } = await resolveBuyer({
        userId: afriExchangeUserId,
        walletAddress,
        accountEmail,
        tokenType,
      });

      const requestId = crypto.randomUUID();
      const code = generateVerificationCode();
      const expiresAt = Date.now() + LINK_VERIFICATION_TTL_MS;

      await saveLinkVerificationSession(requestId, {
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

      if (SHOULD_LOG_LINK_CODES) {
        console.info(
          `[AfriExchange RentHub link verification] requestId=${requestId} email=${user.email} code=${code}`
        );
      }

      await sendAccountLinkVerificationCode(user.email, user.full_name, code);

      return res.status(200).json({
        success: true,
        data: {
          requestId,
          expiresInSeconds: Math.floor(LINK_VERIFICATION_TTL_MS / 1000),
          maskedEmail: maskEmail(user.email),
          ...(process.env.NODE_ENV !== "production" ? { code } : {}),
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

      const session = await getLinkVerificationSession(requestId);
      if (!session) {
        throw new ApiError("Link verification request not found or expired", 404);
      }

      if (session.expiresAt < Date.now()) {
        await deleteLinkVerificationSession(requestId);
        throw new ApiError("Link verification code has expired", 410);
      }

      session.attempts += 1;
      if (session.attempts > 5) {
        await deleteLinkVerificationSession(requestId);
        throw new ApiError("Too many invalid verification attempts", 429);
      }

      if (String(code).trim() !== session.code) {
        await saveLinkVerificationSession(requestId, session);
        throw new ApiError("Invalid verification code", 400);
      }

      await deleteLinkVerificationSession(requestId);

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
        tokenType = TOKEN_TYPES.NT,
        description,
        metadata = {},
      } = req.body;

      if (!idempotencyKey || !rentHubTransactionId || !amount) {
        throw new ApiError("idempotencyKey, rentHubTransactionId, and amount are required", 400);
      }

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError(`Invalid tokenType '${tokenType}'. Supported: ${Object.values(TOKEN_TYPES).join(", ")}`, 400);
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

      // Compute token amount if passing fiat NGN and token is non-NT
      const { EXCHANGE_RATES } = require("../config/constants");
      let tokenAmount = parseFloat(amount);
      const originalNgn = parseFloat(req.body.amountInNgn || (currency === "NGN" ? amount : 0));
      let conversionRate = 1.0;

      if (req.body.amountInToken) {
        tokenAmount = parseFloat(req.body.amountInToken);
      } else if (currency === "NGN" && tokenType !== TOKEN_TYPES.NT) {
        if (tokenType === TOKEN_TYPES.USDT) {
          conversionRate = EXCHANGE_RATES.NT_TO_USDT || 0.00067;
          tokenAmount = parseFloat((originalNgn * conversionRate).toFixed(2));
        } else if (tokenType === TOKEN_TYPES.CT) {
          conversionRate = EXCHANGE_RATES.NT_TO_CT || 0.37;
          tokenAmount = parseFloat((originalNgn * conversionRate).toFixed(2));
        }
      }

      // Resolve tenant's AfriExchange wallet
      const { user: buyerUser, wallet: buyerWallet } = await resolveBuyer({
        userId: buyerAfriExchangeUserId,
        walletAddress: buyerWalletAddress,
        accountEmail: buyerAccountEmail,
        tokenType,
      });

      if (parseFloat(buyerWallet.balance) < tokenAmount) {
        // Fetch all active wallets for this user to give an informative breakdown
        const allWallets = await Wallet.findAll({
          where: { user_id: buyerUser.id, is_active: true },
        });

        const walletList = allWallets
          .map((w) => `${w.token_type}: ${parseFloat(w.balance || 0).toLocaleString()}`)
          .join(", ");

        const err = new ApiError(
          `Insufficient ${tokenType} wallet balance. Required: ${tokenAmount.toLocaleString()} ${tokenType} (≈ ₦${originalNgn.toLocaleString()}), Available: ${parseFloat(buyerWallet.balance || 0).toLocaleString()} ${tokenType}. (Your balances — ${walletList || "none"})`,
          400,
          {
            code: "INSUFFICIENT_BALANCE",
            tokenType,
            requiredAmount: tokenAmount,
            originalNgn,
            availableBalance: parseFloat(buyerWallet.balance || 0),
            wallets: allWallets.map((w) => ({
              tokenType: w.token_type,
              balance: parseFloat(w.balance || 0),
            })),
          }
        );
        throw err;
      }

      // Resolve RentHub merchant settlement wallet for the target token
      const merchant = await resolveRentHubMerchant();
      if (!merchant) {
        throw new ApiError("RentHub merchant is not configured in AfriExchange. Run: npm run seed:renthub-merchant", 503);
      }

      let merchantWallet = await Wallet.findOne({
        where: { user_id: merchant.user_id, token_type: tokenType, is_active: true },
      });
      if (!merchantWallet) {
        merchantWallet = await Wallet.create({
          user_id: merchant.user_id,
          token_type: tokenType,
          blockchain_address: `0x${crypto.randomBytes(20).toString("hex")}`,
          encrypted_private_key: crypto.randomBytes(64).toString("hex"),
          balance: 0,
          pending_balance: 0,
          is_active: true,
        });
      }

      const collectionTx = await sequelize.transaction(async (dbTx) => {
        // Debit tenant wallet
        await buyerWallet.decrement("balance", { by: tokenAmount, transaction: dbTx });

        // Credit RentHub escrow settlement wallet
        await merchantWallet.increment("balance", { by: tokenAmount, transaction: dbTx });
        await merchantWallet.increment("total_received", { by: tokenAmount, transaction: dbTx });

        return await Transaction.create(
          {
            reference,
            type: TRANSACTION_TYPES.COLLECTION,
            status: TRANSACTION_STATUS.COMPLETED,
            amount: tokenAmount,
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
              original_amount_ngn: originalNgn,
              exchange_rate_used: conversionRate,
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
        tokenType = TOKEN_TYPES.NT,
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
        userId: landlordAfriExchangeUserId,
        walletAddress: landlordWalletAddress,
        accountEmail: landlordAccountEmail,
        tokenType,
      });

      // Debit from RentHub merchant settlement wallet matching the payout token
      const merchant = await resolveRentHubMerchant();
      if (!merchant) {
        throw new ApiError("RentHub merchant is not configured in AfriExchange", 503);
      }

      let merchantWallet = await Wallet.findOne({
        where: { user_id: merchant.user_id, token_type: tokenType, is_active: true },
      });
      if (!merchantWallet) {
        throw new ApiError(`RentHub settlement wallet for ${tokenType} not found`, 503);
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

        const createdPayout = await Transaction.create(
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

        // Update original collection transaction metadata to mark escrow released
        try {
          const collectionTx = await Transaction.findOne({
            where: {
              merchant_id: merchant.id,
              [Op.or]: [
                { reference: `RENTHUB-COLLECTION-${rentHubTransactionId}` },
                sequelize.where(
                  sequelize.cast(sequelize.col("metadata"), "text"),
                  { [Op.like]: `%"rentHubTransactionId":"${rentHubTransactionId}"%` }
                ),
              ],
            },
            transaction: dbTx,
          });

          if (collectionTx) {
            const currentMeta = collectionTx.metadata || {};
            await collectionTx.update(
              {
                metadata: {
                  ...currentMeta,
                  escrow_released: true,
                  escrow_released_at: new Date(),
                  payout_tx_id: createdPayout.id,
                },
              },
              { transaction: dbTx }
            );
          }
        } catch (colErr) {
          console.warn("Could not flag collectionTx as escrow_released:", colErr.message);
        }

        return createdPayout;
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

  /**
   * GET /integrations/renthub/rates
   * Returns current exchange rates for NGN to NT, CT, and USDT.
   */
  getRates(req, res) {
    const { EXCHANGE_RATES } = require("../config/constants");
    return res.json({
      success: true,
      data: {
        baseCurrency: "NGN",
        rates: {
          NT: {
            token: "NT",
            name: "Naira Token",
            ngnPerToken: 1.0,
            tokensPerNgn: 1.0,
            desc: "1 NT = ₦1.00 (1:1 NGN)",
          },
          CT: {
            token: "CT",
            name: "CFA Token",
            ngnPerToken: EXCHANGE_RATES.CT_TO_NT || 2.7,
            tokensPerNgn: EXCHANGE_RATES.NT_TO_CT || 0.37,
            desc: "1 CT ≈ ₦2.70 NGN (0.37 CT per ₦1)",
          },
          USDT: {
            token: "USDT",
            name: "Tether USD",
            ngnPerToken: EXCHANGE_RATES.USDT_TO_NT || 1500,
            tokensPerNgn: EXCHANGE_RATES.NT_TO_USDT || 0.00067,
            desc: "1 USDT ≈ ₦1,500 NGN ($1.00 USD)",
          },
        },
      },
    });
  },

  /**
   * POST /integrations/renthub/checkout-session
   * Initiates a secure hosted checkout session for a tenant on AfriExchange (/pay/[id]).
   * Tenant authorizes payment directly on AfriExchange using their account password.
   */
  async createCheckoutSession(req, res, next) {
    try {
      const {
        rentHubTransactionId,
        amount,
        amountInNgn,
        amountInToken,
        currency = "NGN",
        tokenType = TOKEN_TYPES.NT,
        description,
        customerEmail,
        returnUrl,
        metadata = {},
      } = req.body;

      if (!rentHubTransactionId || (!amount && !amountInToken)) {
        throw new ApiError("rentHubTransactionId and amount are required", 400);
      }

      if (!Object.values(TOKEN_TYPES).includes(tokenType)) {
        throw new ApiError(`Invalid tokenType '${tokenType}'. Supported: ${Object.values(TOKEN_TYPES).join(", ")}`, 400);
      }

      // Compute token amount
      const { EXCHANGE_RATES } = require("../config/constants");
      const originalNgn = parseFloat(amountInNgn || (currency === "NGN" ? amount : 0));
      let tokenAmount = parseFloat(amount);
      let conversionRate = 1.0;

      if (amountInToken) {
        tokenAmount = parseFloat(amountInToken);
      } else if (currency === "NGN" && tokenType !== TOKEN_TYPES.NT) {
        if (tokenType === TOKEN_TYPES.USDT) {
          conversionRate = EXCHANGE_RATES.NT_TO_USDT || 0.00067;
          tokenAmount = parseFloat((originalNgn * conversionRate).toFixed(2));
        } else if (tokenType === TOKEN_TYPES.CT) {
          conversionRate = EXCHANGE_RATES.NT_TO_CT || 0.37;
          tokenAmount = parseFloat((originalNgn * conversionRate).toFixed(2));
        }
      }

      if (tokenAmount <= 0) {
        throw new ApiError("Amount must be greater than 0", 400);
      }

      // Resolve RentHub merchant — required to set as payment destination
      let merchant = await resolveRentHubMerchant();
      if (!merchant) {
        merchant = await Merchant.findOne({ where: { business_name: "RentHub" } });
      }
      if (!merchant) {
        throw new ApiError(
          "RentHub merchant account is not configured in AfriExchange. Please contact AfriExchange support.",
          503
        );
      }

      // Ensure merchant has a settlement wallet for this token type
      const walletService = require("../services/walletService");
      await walletService.getOrCreateWallet(merchant.user_id, tokenType);

      // Build consistent reference
      const cleanTxId = String(rentHubTransactionId).replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
      const paymentReference = `RQST-RH-${cleanTxId}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Check for existing pending transaction for this rentHubTransactionId
      const existing = await Transaction.findOne({
        where: {
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.PENDING,
          "metadata.rentHubTransactionId": rentHubTransactionId,
        },
      });

      let transaction = existing;
      if (!transaction) {
        transaction = await Transaction.create({
          from_user_id: null,
          to_user_id: merchant.user_id,
          merchant_id: merchant.id,
          amount: tokenAmount,
          token_type: tokenType,
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.PENDING,
          description: description || `RentHub Escrow Payment — ${tokenAmount} ${tokenType}`,
          reference: paymentReference,
          metadata: {
            mode: "merchant",
            platform: "renthub",
            source: "renthub",
            collection_type: "rent_escrow",
            customer_email: customerEmail || null,
            return_url: returnUrl || null,
            rentHubTransactionId,
            original_amount_ngn: originalNgn,
            conversion_rate: conversionRate,
            ...metadata,
          },
        });
      }

      const activeRef = transaction.reference;
      const webBaseUrl = (process.env.AFRIX_WEB_URL || "https://afri-x.vercel.app").replace(/\/$/, "");
      const paymentUrl = `${webBaseUrl}/pay/${activeRef}?amount=${tokenAmount}&token=${tokenType}&note=${encodeURIComponent(description || "RentHub Escrow Payment")}${customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : ""}&txId=${transaction.id}`;

      return res.status(201).json({
        success: true,
        data: {
          provider: "afriexchange",
          paymentUrl,
          payment_url: paymentUrl,
          reference: activeRef,
          transactionId: transaction.id,
          amount: tokenAmount,
          tokenType,
          originalNgn,
          returnUrl: returnUrl || null,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
        message: "Hosted payment checkout session initialized successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /integrations/renthub/verify/:reference
   * Verifies payment status of an AfriExchange reference.
   */
  async verifyPayment(req, res, next) {
    try {
      const { reference } = req.params;
      if (!reference) {
        throw new ApiError("reference parameter is required", 400);
      }

      const cleanRef = reference.replace(/^RQST-/i, "");
      const orConditions = [{ reference }, { reference: cleanRef }, { reference: `RQST-${cleanRef}` }];
      if (isUuid(cleanRef)) {
        orConditions.push({ id: cleanRef });
      }

      const transaction = await Transaction.findOne({
        where: {
          [Op.or]: orConditions,
        },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction reference not found",
        });
      }

      const isCompleted = transaction.status === TRANSACTION_STATUS.COMPLETED;

      return res.json({
        success: true,
        data: {
          reference: transaction.reference,
          status: transaction.status,
          verified: isCompleted,
          amount: transaction.amount,
          tokenType: transaction.token_type,
          rentHubTransactionId: transaction.metadata?.rentHubTransactionId || null,
          processedAt: transaction.processed_at || transaction.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = renthubIntegrationController;
