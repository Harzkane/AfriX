// File: src/controllers/merchantController.js

const { Merchant, User, Wallet, Transaction } = require("../models");
const MerchantKyc = require("../models/MerchantKyc");

const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  MERCHANT_STATUS,
} = require("../config/constants");
const merchantService = require("../services/merchantService");
const { ValidationError } = require("../utils/errors");
const { generateQR } = require("../utils/qrcode");
const { uploadToR2 } = require("../services/r2Service");
const { emitMerchantWebhook, ensureWebhookSecret } = require("../services/merchantWebhookService");
/**
 * Merchant Controller
 *
 * Handles merchant registration, management, and payment processing
 */
const merchantController = {
  /**
   * Register a new merchant
   * POST /api/merchants/register
   */
  register: async (req, res, next) => {
    try {
      const {
        business_name,
        display_name,
        business_type,
        description,
        business_email,
        business_phone,
        country,
        city,
        address,
        default_token_type,
      } = req.body;

      // Get user from authenticated request
      const userId = req.user.id;

      // Check if user already has a merchant account
      const existingMerchant = await Merchant.findOne({
        where: { user_id: userId },
      });
      if (existingMerchant) {
        throw new ValidationError("User already has a merchant account");
      }

      // Get user's wallet for the default currency
      const wallet = await Wallet.findOne({
        where: {
          user_id: userId,
          token_type: default_token_type || "NT",
        },
      });

      if (!wallet) {
        throw new ValidationError(
          "User does not have a wallet for the selected currency"
        );
      }

      // Create merchant record
      const merchant = await Merchant.create({
        user_id: userId,
        business_name,
        display_name,
        business_type,
        description,
        business_email,
        business_phone,
        country,
        city,
        address,
        settlement_wallet_id: wallet.id,
        default_token_type: default_token_type || "NT",
        verification_status: MERCHANT_STATUS.PENDING,
      });

      // Update user role to merchant so they can log into the merchant portal
      await User.update(
        { role: 'merchant' },
        { where: { id: userId } }
      );

      // Generate API key
      const apiKey = await merchant.generateApiKey();

      res.status(201).json({
        success: true,
        data: {
          merchant_id: merchant.id,
          api_key: apiKey,
          verification_status: merchant.verification_status,
        },
        message: "Merchant account created successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get merchant profile
   * GET /api/merchants/profile
   */
  getProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const merchant = await Merchant.findOne({
        where: { user_id: userId },
        attributes: { exclude: ["api_key"] },
        include: [{ model: MerchantKyc, as: "kyc" }],
      });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Merchant profile not found",
          },
        });
      }

      res.json({
        success: true,
        data: merchant,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update merchant profile
   * PUT /api/merchants/profile
   */
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const {
        display_name,
        description,
        business_email,
        business_phone,
        city,
        address,
        default_token_type,
        webhook_url,
      } = req.body;

      const merchant = await Merchant.findOne({ where: { user_id: userId } });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Merchant profile not found",
          },
        });
      }

      // Update allowed fields
      if (display_name) merchant.display_name = display_name;
      if (description) merchant.description = description;
      if (business_email) merchant.business_email = business_email;
      if (business_phone) merchant.business_phone = business_phone;
      if (city) merchant.city = city;
      if (address) merchant.address = address;
      if (webhook_url !== undefined) {
        // Decode any HTML entities (e.g. &#x2F; → /) before persisting
        const decodeEntities = (str) =>
          str
            .replace(/&#x2F;/gi, "/")
            .replace(/&amp;/gi, "&")
            .replace(/&lt;/gi, "<")
            .replace(/&gt;/gi, ">")
            .replace(/&quot;/gi, '"')
            .replace(/&#x27;/gi, "'");
        const cleanUrl = webhook_url ? decodeEntities(webhook_url.trim()) : null;
        merchant.webhook_url = cleanUrl || merchant.webhook_url;
      }

      // Ensure the merchant has a signing secret whenever a webhook URL is configured
      if (merchant.webhook_url?.trim()) {
        await ensureWebhookSecret(merchant);
      }

      // Handle currency change
      if (
        default_token_type &&
        default_token_type !== merchant.default_token_type
      ) {
        const wallet = await Wallet.findOne({
          where: {
            user_id: userId,
            token_type: default_token_type,
          },
        });

        if (!wallet) {
          throw new ValidationError(
            "User does not have a wallet for the selected currency"
          );
        }

        merchant.default_token_type = default_token_type;
        merchant.settlement_wallet_id = wallet.id;
      }

      await merchant.save();

      res.json({
        success: true,
        data: {
          merchant_id: merchant.id,
          updated_at: merchant.updated_at,
        },
        message: "Merchant profile updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Generate payment request
   * POST /api/merchants/payment-request
   */
  createPaymentRequest: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { amount, currency, token_type, description, customer_email, reference, return_url } =
        req.body;
      const tokenType = token_type || currency || null;

      if (!amount || amount <= 0) {
        throw new ValidationError("Valid amount is required");
      }

      const merchant = await Merchant.findOne({ where: { user_id: userId } });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Merchant profile not found",
          },
        });
      }

      const paymentTokenType = tokenType || merchant.default_token_type;

      // Create payment transaction
      const transaction = await Transaction.create({
        from_user_id: null, // Will be filled when customer pays
        to_user_id: userId,
        merchant_id: merchant.id,
        amount,
        token_type: paymentTokenType,
        type: TRANSACTION_TYPES.COLLECTION,
        status: TRANSACTION_STATUS.PENDING,
        description: description || `Payment to ${merchant.display_name}`,
        reference: reference || `MER-${Date.now()}`,
        metadata: {
          customer_email,
          return_url: return_url || null,
          merchant_name: merchant.display_name,
          business_name: merchant.business_name,
        },
      });

      // Generate payment QR code
      const paymentData = {
        transaction_id: transaction.id,
        merchant_id: merchant.id,
        amount,
        currency: paymentTokenType,
        token_type: paymentTokenType,
      };

      const qrCode = await generateQR(JSON.stringify(paymentData));

      const webBaseUrl = (process.env.AFRIX_WEB_URL || "https://afritoken.com").replace(/\/$/, "");

      // Fire a payment.pending webhook so the merchant's backend knows a request was created.
      // This is non-blocking — the response is already sent before this resolves.
      setImmediate(() =>
        emitMerchantWebhook(merchant.id, {
          event: "payment.pending",
          eventId: `afrix-payment-${transaction.id}`,
          data: {
            transaction_id: transaction.id,
            reference: transaction.reference,
            amount,
            token_type: paymentTokenType,
            status: "pending",
            description: transaction.description,
            customer_email: customer_email || null,
            return_url: return_url || null,
            created_at: transaction.created_at,
          },
        })
      );

      res.status(201).json({
        success: true,
        data: {
          transaction_id: transaction.id,
          payment_url: `${webBaseUrl}/pay/${transaction.id}`,
          qr_code: qrCode,
          amount,
          currency: paymentTokenType,
          token_type: paymentTokenType,
          return_url: return_url || null,
          expires_at: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
        message: "Payment request created successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get merchant transactions
   * GET /api/merchants/transactions
   */
  getTransactions: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      const merchant = await Merchant.findOne({ where: { user_id: userId } });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Merchant profile not found",
          },
        });
      }

      // Build query
      const query = {
        where: {
          merchant_id: merchant.id,
          type: TRANSACTION_TYPES.COLLECTION, // ← Changed from 'transaction_type'
        },
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
      };

      // Add status filter if provided
      if (status) {
        query.where.status = status;
      }

      // Get transactions
      const transactions = await Transaction.findAndCountAll(query);

      res.json({
        success: true,
        data: {
          transactions: transactions.rows,
          pagination: {
            total: transactions.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(transactions.count / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single merchant transaction
   * GET /api/merchants/transactions/:id
   */
  getTransactionById: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const merchant = await Merchant.findOne({ where: { user_id: userId } });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Merchant profile not found",
          },
        });
      }

      const transaction = await Transaction.findOne({
        where: {
          id,
          merchant_id: merchant.id,
          type: TRANSACTION_TYPES.COLLECTION,
        },
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
            attributes: ["id", "token_type", "balance", "pending_balance"],
          },
          {
            model: Wallet,
            as: "toWallet",
            attributes: ["id", "token_type", "balance", "pending_balance"],
          },
          {
            model: Merchant,
            as: "merchant",
            attributes: [
              "id",
              "business_name",
              "display_name",
              "default_token_type",
              "settlement_wallet_id",
            ],
          },
        ],
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Merchant transaction not found",
          },
        });
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Regenerate API key
   * POST /api/merchants/regenerate-api-key
   */
  regenerateApiKey: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const merchant = await Merchant.findOne({ where: { user_id: userId } });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: {
            message: "Merchant profile not found",
          },
        });
      }

      // Generate new API key
      const apiKey = await merchant.generateApiKey();

      res.json({
        success: true,
        data: {
          api_key: apiKey,
        },
        message: "API key regenerated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  uploadKyc: async (req, res) => {
    try {
      const userId = req.user.id;
      const files = req.files;

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      // Ensure required KYC documents exist (optional: keep or remove based on policy)
      const requiredDocs = [
        "business_certificate",
        "id_card",
        "proof_of_address",
      ];
      for (const doc of requiredDocs) {
        if (!files[doc] || files[doc].length === 0) {
          return res.status(400).json({
            success: false,
            message: `Missing required document: ${doc}`,
          });
        }
      }

      // Find merchant by user_id
      const merchant = await Merchant.findOne({ where: { user_id: userId } });
      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: "Merchant profile not found",
        });
      }

      // Upload to structured folders
      const uploads = {
        business_certificate: await uploadToR2(
          files.business_certificate[0].buffer,
          files.business_certificate[0].originalname,
          "merchant_kyc/business-certificates"
        ),
        id_card: await uploadToR2(
          files.id_card[0].buffer,
          files.id_card[0].originalname,
          "merchant_kyc/id-documents"
        ),
        proof_of_address: await uploadToR2(
          files.proof_of_address[0].buffer,
          files.proof_of_address[0].originalname,
          "merchant_kyc/proof-of-address"
        ),
      };

      // Upsert merchant KYC record
      const [kycRecord, created] = await MerchantKyc.upsert(
        {
          merchant_id: merchant.id,
          business_certificate_url: uploads.business_certificate,
          id_document_url: uploads.id_card,
          proof_of_address_url: uploads.proof_of_address,
          status: "pending",
          submitted_at: new Date(),
        },
        { returning: true }
      );

      // Update merchant verification status
      await merchant.update({ verification_status: "pending" });

      res.json({
        success: true,
        message: created
          ? "Merchant KYC submitted successfully. Under review."
          : "Merchant KYC updated successfully. Under review.",
        kyc: kycRecord,
      });
    } catch (error) {
      console.error("KYC upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload KYC",
        error: error.message,
      });
    }
  },

  getDashboardSummary: async (req, res) => {
    try {
      const merchant = await Merchant.findOne({ where: { user_id: req.user.id } });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          message: "Merchant profile not found",
        });
      }

      const summary = await merchantService.getDashboardSummary(merchant.id);
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Get merchant onboarding / integration readiness status
   * GET /api/v1/merchants/onboarding-status
   */
  getOnboardingStatus: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const merchant = await Merchant.findOne({ where: { user_id: userId } });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: { message: "Merchant profile not found" },
        });
      }

      const approved = merchant.verification_status === "approved";
      const settlementWalletReady = Boolean(merchant.settlement_wallet_id);
      const webhookConfigured = Boolean(merchant.webhook_url?.trim());
      const defaultTokenSet = Boolean(merchant.default_token_type);
      // api_key presence means a key has been generated at least once
      const apiKeyActive = Boolean(merchant.api_key);

      const readyForLive =
        approved &&
        settlementWalletReady &&
        webhookConfigured &&
        defaultTokenSet &&
        apiKeyActive;

      return res.json({
        success: true,
        data: {
          approved,
          settlementWalletReady,
          webhookConfigured,
          defaultTokenSet,
          apiKeyActive,
          readyForLive,
          verificationStatus: merchant.verification_status,
          merchantId: merchant.id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Sandbox: fire a test webhook to the merchant's configured URL
   * POST /api/merchants/sandbox/ping-webhook
   *
   * Returns the delivery result synchronously so the portal can display it
   * immediately — unlike the fire-and-forget used in production flows.
   */
  sandboxPingWebhook: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const merchant = await Merchant.findOne({ where: { user_id: userId } });

      if (!merchant) {
        return res.status(404).json({
          success: false,
          error: { message: "Merchant profile not found" },
        });
      }

      // Decode any HTML entities (&#x2F; → /) that may have been stored from a form
      const decodeEntities = (str) =>
        str
          .replace(/&#x2F;/gi, "/")
          .replace(/&amp;/gi, "&")
          .replace(/&lt;/gi, "<")
          .replace(/&gt;/gi, ">")
          .replace(/&quot;/gi, '"')
          .replace(/&#x27;/gi, "'");

      const rawUrl = (req.body?.webhook_url || merchant.webhook_url)?.trim();
      const webhookUrl = rawUrl ? decodeEntities(rawUrl) : null;

      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "No webhook URL configured. Add one in API & Webhooks settings before testing.",
          },
        });
      }

      // Validate it is a reachable URL before firing
      try {
        const parsed = new URL(webhookUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return res.status(400).json({
            success: false,
            error: { message: "Webhook URL must use http or https." },
          });
        }
      } catch {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid webhook URL: "${webhookUrl}". Please enter a full URL starting with https://.`,
          },
        });
      }

      const eventId = `afrix-sandbox-${Date.now()}`;
      const payload = {
        event: "sandbox.ping",
        eventId,
        data: {
          message: "This is a test webhook from AfriExchange Sandbox. Your endpoint received it correctly.",
          merchant_id: merchant.id,
          sent_at: new Date().toISOString(),
        },
      };

      const crypto = require("crypto");
      const axios = require("axios");
      const { ensureWebhookSecret } = require("../services/merchantWebhookService");

      const secret = await ensureWebhookSecret(merchant);
      const timestamp = new Date().toISOString();
      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac("sha256", secret)
        .update(`${timestamp}.${rawBody}`)
        .digest("hex");

      let deliveryResult;
      try {
        const axiosResponse = await axios.post(webhookUrl, rawBody, {
          headers: {
            "content-type": "application/json",
            "x-afriexchange-timestamp": timestamp,
            "x-afriexchange-signature": `sha256=${signature}`,
          },
          timeout: 10000,
        });
        deliveryResult = {
          delivered: true,
          httpStatus: axiosResponse.status,
          responseBody: typeof axiosResponse.data === "object"
            ? JSON.stringify(axiosResponse.data)
            : String(axiosResponse.data).slice(0, 500),
        };
      } catch (httpErr) {
        deliveryResult = {
          delivered: false,
          httpStatus: httpErr.response?.status || null,
          error: httpErr.message,
          responseBody: httpErr.response?.data
            ? JSON.stringify(httpErr.response.data).slice(0, 500)
            : null,
        };
      }

      // Record health + append to delivery log via shared service
      const { ensureWebhookSecret: _skip, ...webhookServiceInternal } = require("../services/merchantWebhookService");
      // Call the internal recorder directly by re-importing
      const webhookService = require("../services/merchantWebhookService");
      // Use the same function the emitter uses — avoids duplicating log logic
      // We re-create a minimal call by updating directly (service is fire-and-forget)
      const logEntry = {
        attempted_at: timestamp,
        event: "sandbox.ping",
        reference: eventId,
        status: deliveryResult.delivered ? "delivered" : "failed",
        http_status: deliveryResult.httpStatus,
        error: deliveryResult.error || "",
        webhook_url: webhookUrl,
        payload: payload,
      };
      // Fetch and update log
      const currentMerchant = await Merchant.findByPk(merchant.id, { attributes: ["webhook_delivery_log"] });
      const existingLog = Array.isArray(currentMerchant?.webhook_delivery_log) ? currentMerchant.webhook_delivery_log : [];
      await Merchant.update(
        {
          integration_health: {
            last_webhook_attempt_at: timestamp,
            last_webhook_event: "sandbox.ping",
            last_webhook_reference: eventId,
            last_webhook_status: deliveryResult.delivered ? "delivered" : "failed",
            last_webhook_http_status: deliveryResult.httpStatus,
            last_webhook_error: deliveryResult.error || "",
          },
          webhook_delivery_log: [logEntry, ...existingLog].slice(0, 50),
        },
        { where: { id: merchant.id } }
      );

      return res.json({
        success: true,
        data: {
          ...deliveryResult,
          webhookUrl,
          timestamp,
          signature: `sha256=${signature}`,
          payloadSent: payload,
          verificationSnippet: {
            node: [
              `const crypto = require('crypto');`,
              `const secret = process.env.AFRIX_WEBHOOK_SECRET;`,
              `const sig = req.headers['x-afriexchange-signature'];`,
              `const ts  = req.headers['x-afriexchange-timestamp'];`,
              `const expected = 'sha256=' + crypto`,
              `  .createHmac('sha256', secret)`,
              `  .update(\`\${ts}.\${JSON.stringify(req.body)}\`)`,
              `  .digest('hex');`,
              `const isValid = sig === expected;`,
            ].join("\n"),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /merchants/webhook-delivery-log
   * Returns the last 50 webhook delivery attempts for this merchant.
   */
  getWebhookDeliveryLog: async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const merchant = await Merchant.findOne({
        where: { user_id: userId },
        attributes: ["id", "webhook_delivery_log"],
      });
      if (!merchant) {
        return res.status(404).json({ success: false, error: { message: "Merchant profile not found" } });
      }
      const log = Array.isArray(merchant.webhook_delivery_log) ? merchant.webhook_delivery_log : [];
      return res.json({ success: true, data: { log, total: log.length } });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = merchantController;
