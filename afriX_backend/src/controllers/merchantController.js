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
      if (webhook_url) merchant.webhook_url = webhook_url;

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
      const { amount, currency, description, customer_email, reference } =
        req.body;

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

      // Create payment transaction
      const transaction = await Transaction.create({
        from_user_id: null, // Will be filled when customer pays
        receiver_id: userId,
        merchant_id: merchant.id,
        amount,
        token_type: currency || merchant.default_token_type, // ← Changed from 'currency'
        type: TRANSACTION_TYPES.COLLECTION, // ← Changed from 'transaction_type'
        status: TRANSACTION_STATUS.PENDING,
        description: description || `Payment to ${merchant.display_name}`,
        reference: reference || `MER-${Date.now()}`,
        metadata: {
          customer_email,
          merchant_name: merchant.display_name,
          business_name: merchant.business_name,
        },
      });

      // Generate payment QR code
      const paymentData = {
        transaction_id: transaction.id,
        merchant_id: merchant.id,
        amount,
        currency: currency || merchant.default_token_type,
      };

      const qrCode = await generateQR(JSON.stringify(paymentData));

      res.status(201).json({
        success: true,
        data: {
          transaction_id: transaction.id,
          payment_url: `https://afritoken.com/pay/${transaction.id}`,
          qr_code: qrCode,
          amount,
          currency: currency || merchant.default_token_type,
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
      const merchantId = req.user.id;
      const summary = await merchantService.getDashboardSummary(merchantId);
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = merchantController;
