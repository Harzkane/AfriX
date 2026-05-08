const { Merchant, MerchantKyc, User, Wallet, Transaction } = require("../models");
const { Op } = require("sequelize");
const {
  MERCHANT_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} = require("../config/constants");

const safeNumber = (value) => parseFloat(value || 0) || 0;

const detectCollectionSource = (transaction) => {
  const reference = String(transaction.reference || "").toUpperCase();
  const metadata = transaction.metadata || {};

  if (
    reference.startsWith("KAALIS-") ||
    metadata.source === "kaalis" ||
    metadata.integration === "kaalis" ||
    metadata.kaalisOrderId ||
    metadata.orderId
  ) {
    return "kaalis";
  }

  if (metadata.source === "api" || metadata.apiKeyUsed || metadata.webhook_url) {
    return "api";
  }

  return "direct";
};

const adminMerchantController = {
  /**
   * List all merchants (optionally filter by verification_status)
   * GET /api/admin/merchants?status=pending|approved|rejected
   */
  listMerchants: async (req, res) => {
    try {
      const { status } = req.query;
      const where = {};
      if (status) where.verification_status = status;

      const merchants = await Merchant.findAll({
        where,
        include: [
          { model: MerchantKyc, as: "kyc" },
          {
            model: User,
            as: "owner",
            attributes: ["id", "full_name", "email", "phone_number"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: merchants,
        count: merchants.length,
      });
    } catch (error) {
      console.error("getMerchantFinancialSummary error:", {
        merchantId: req.params?.id,
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get a single merchant + KYC details
   * GET /api/admin/merchants/:id
   */
  getMerchant: async (req, res) => {
    try {
      const { id } = req.params;

      const merchant = await Merchant.findByPk(id, {
        include: [
          { model: MerchantKyc, as: "kyc" },
          {
            model: User,
            as: "owner",
            attributes: ["id", "full_name", "email", "phone_number"],
            required: false,
          },
          {
            model: Wallet,
            as: "wallet",
            attributes: [
              "id",
              "token_type",
              "balance",
              "pending_balance",
              "blockchain_address",
              "transaction_count",
              "last_synced_at",
              "updated_at",
            ],
            required: false,
          },
        ],
      });

      if (!merchant) {
        return res
          .status(404)
          .json({ success: false, error: "Merchant not found" });
      }

      res.status(200).json({ success: true, data: merchant });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get merchant financial summary
   * GET /api/v1/admin/merchants/:id/financial-summary
   */
  getMerchantFinancialSummary: async (req, res) => {
    try {
      const { id } = req.params;
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

      const merchant = await Merchant.findByPk(id, {
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "full_name", "email", "phone_number"],
            required: false,
          },
          {
            model: Wallet,
            as: "wallet",
            attributes: [
              "id",
              "token_type",
              "balance",
              "pending_balance",
              "blockchain_address",
              "transaction_count",
              "last_synced_at",
              "updated_at",
            ],
            required: false,
          },
        ],
      });

      if (!merchant) {
        return res.status(404).json({ success: false, error: "Merchant not found" });
      }

      const collectionWhere = {
        merchant_id: merchant.id,
        type: TRANSACTION_TYPES.COLLECTION,
      };

      const [recentCollections, allCollections] = await Promise.all([
        Transaction.findAll({
          where: collectionWhere,
          attributes: [
            "id",
            "reference",
            "status",
            "amount",
            "fee",
            "token_type",
            "created_at",
            "processed_at",
            "metadata",
            "from_user_id",
            "to_wallet_id",
          ],
          order: [["created_at", "DESC"]],
          limit,
        }),
        Transaction.findAll({
          where: collectionWhere,
          attributes: [
            "id",
            "reference",
            "status",
            "amount",
            "fee",
            "token_type",
            "created_at",
            "processed_at",
            "metadata",
          ],
          order: [["created_at", "DESC"]],
        }),
      ]);

      const payerIds = [
        ...new Set(
          recentCollections
            .map((tx) => tx.from_user_id)
            .filter(Boolean)
        ),
      ];

      const settlementWalletIds = [
        ...new Set(
          recentCollections
            .map((tx) => tx.to_wallet_id)
            .filter(Boolean)
        ),
      ];

      const [payers, settlementWallets] = await Promise.all([
        payerIds.length
          ? User.findAll({
              where: { id: { [Op.in]: payerIds } },
              attributes: ["id", "full_name", "email"],
            })
          : [],
        settlementWalletIds.length
          ? Wallet.findAll({
              where: { id: { [Op.in]: settlementWalletIds } },
              attributes: ["id", "token_type", "balance"],
            })
          : [],
      ]);

      const payerMap = new Map(
        payers.map((payer) => [
          payer.id,
          {
            id: payer.id,
            full_name: payer.full_name,
            email: payer.email,
          },
        ])
      );

      const settlementWalletMap = new Map(
        settlementWallets.map((wallet) => [
          wallet.id,
          {
            id: wallet.id,
            token_type: wallet.token_type,
            balance: safeNumber(wallet.balance),
          },
        ])
      );

      const summary = {
        total_volume: {},
        total_fees: {},
        average_payment_size: {},
        successful_collections_count: 0,
        failed_collections_count: 0,
        pending_collections_count: 0,
        processing_collections_count: 0,
      };

      const tokenTotals = {};
      const tokenCounts = {};

      allCollections.forEach((tx) => {
        const token = tx.token_type || merchant.default_token_type || "CT";
        const amount = safeNumber(tx.amount);
        const fee = safeNumber(tx.fee);
        const status = String(tx.status || "").toLowerCase();

        tokenTotals[token] = (tokenTotals[token] || 0) + amount;
        summary.total_fees[token] = (summary.total_fees[token] || 0) + fee;

        if (
          status === TRANSACTION_STATUS.COMPLETED ||
          status === "success" ||
          status === "successful"
        ) {
          summary.successful_collections_count += 1;
          tokenCounts[token] = (tokenCounts[token] || 0) + 1;
          summary.total_volume[token] = (summary.total_volume[token] || 0) + amount;
        } else if (status === TRANSACTION_STATUS.FAILED || status === "error") {
          summary.failed_collections_count += 1;
        } else if (status === TRANSACTION_STATUS.PROCESSING) {
          summary.processing_collections_count += 1;
        } else if (status === TRANSACTION_STATUS.PENDING) {
          summary.pending_collections_count += 1;
        }
      });

      Object.keys(summary.total_volume).forEach((token) => {
        const count = tokenCounts[token] || 0;
        summary.average_payment_size[token] = count
          ? summary.total_volume[token] / count
          : 0;
      });

      const recent = recentCollections.map((tx) => {
        const amount = safeNumber(tx.amount);
        const fee = safeNumber(tx.fee);
        const payer = tx.from_user_id ? payerMap.get(tx.from_user_id) || null : null;
        const settlementWallet = tx.to_wallet_id
          ? settlementWalletMap.get(tx.to_wallet_id) || null
          : null;
        return {
          id: tx.id,
          reference: tx.reference,
          status: tx.status,
          amount,
          fee,
          token_type: tx.token_type,
          created_at: tx.created_at,
          processed_at: tx.processed_at,
          net_settlement: amount - fee,
          source: detectCollectionSource(tx),
          payer,
          settlement_wallet: settlementWallet,
          metadata: tx.metadata || null,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          merchant: {
            id: merchant.id,
            business_name: merchant.business_name,
            display_name: merchant.display_name,
            verification_status: merchant.verification_status,
            payment_fee_percent: safeNumber(merchant.payment_fee_percent),
            default_token_type: merchant.default_token_type,
            settlement_wallet_id: merchant.settlement_wallet_id,
            webhook_url: merchant.webhook_url,
            api_key_configured: Boolean(merchant.api_key),
            integration_health: merchant.integration_health || null,
          },
          owner: merchant.owner || null,
          settlement_wallet: merchant.wallet
            ? {
                id: merchant.wallet.id,
                token_type: merchant.wallet.token_type,
                balance: safeNumber(merchant.wallet.balance),
                pending_balance: safeNumber(merchant.wallet.pending_balance),
                available_balance:
                  safeNumber(merchant.wallet.balance) -
                  safeNumber(merchant.wallet.pending_balance),
                blockchain_address: merchant.wallet.blockchain_address,
                transaction_count: merchant.wallet.transaction_count,
                last_synced_at: merchant.wallet.last_synced_at,
                updated_at: merchant.wallet.updated_at,
              }
            : null,
          summary,
          recent_collections: recent,
          notes: {
            fee_scope:
              "AfriExchange merchant fees shown here are separate from any external marketplace platform fees such as Kaalis.",
          },
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Approve merchant KYC
   * POST /api/admin/merchants/:id/approve
   */
  approveMerchant: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.id; // admin performing the approval

      const merchant = await Merchant.findByPk(id, {
        include: [{ model: MerchantKyc, as: "kyc" }],
      });
      if (!merchant)
        return res
          .status(404)
          .json({ success: false, error: "Merchant not found" });

      if (!merchant.kyc) {
        return res
          .status(400)
          .json({ success: false, error: "Merchant has not submitted KYC" });
      }

      // Update KYC
      merchant.kyc.status = "approved";
      merchant.kyc.reviewed_by = adminId;
      merchant.kyc.reviewed_at = new Date();
      await merchant.kyc.save();

      // Update merchant verification status
      merchant.verification_status = MERCHANT_STATUS.APPROVED || "approved";

      await merchant.save();

      res.status(200).json({
        success: true,
        message: "Merchant approved successfully",
        data: merchant,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Reject merchant KYC
   * POST /api/admin/merchants/:id/reject
   * Body: { reason: string }
   */
  rejectMerchant: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      if (!reason)
        return res
          .status(400)
          .json({ success: false, error: "Rejection reason is required" });

      const merchant = await Merchant.findByPk(id, {
        include: [{ model: MerchantKyc, as: "kyc" }],
      });
      if (!merchant)
        return res
          .status(404)
          .json({ success: false, error: "Merchant not found" });

      if (!merchant.kyc) {
        return res
          .status(400)
          .json({ success: false, error: "Merchant has not submitted KYC" });
      }

      // Update KYC
      merchant.kyc.status = "rejected";
      merchant.kyc.rejection_reason = reason;
      merchant.kyc.reviewed_by = adminId;
      merchant.kyc.reviewed_at = new Date();
      await merchant.kyc.save();

      // Update merchant verification status
      merchant.verification_status = MERCHANT_STATUS.REJECTED || "rejected";

      await merchant.save();

      res.status(200).json({
        success: true,
        message: "Merchant rejected successfully",
        data: merchant,
      });
    } catch (error) {
      // Better error handling for database constraint violations
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeDatabaseError"
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Database validation error. Please check merchant status values.",
          details: error.message,
        });
      }

      res.status(500).json({ success: false, error: error.message });
    }
  },
  /**
   * GET /api/v1/admin/merchants/webhook-health
   * Returns a platform-wide webhook integration health overview.
   * Useful for ops monitoring — shows which merchants have broken webhooks.
   */
  getMerchantWebhookHealth: async (req, res) => {
    try {
      const merchants = await Merchant.findAll({
        attributes: [
          "id",
          "business_name",
          "display_name",
          "webhook_url",
          "integration_health",
          "webhook_delivery_log",
          "verification_status",
        ],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "full_name", "email"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });

      const summary = { healthy: 0, degraded: 0, failing: 0, unconfigured: 0 };

      const rows = merchants.map((m) => {
        const health = m.integration_health || {};
        const log = Array.isArray(m.webhook_delivery_log) ? m.webhook_delivery_log : [];

        if (!m.webhook_url) {
          summary.unconfigured += 1;
          return {
            id: m.id,
            business_name: m.business_name || m.display_name,
            owner_email: m.owner?.email || null,
            webhook_url: null,
            health_status: "unconfigured",
            last_attempt_at: null,
            last_status: null,
            last_http_status: null,
            last_error: null,
            consecutive_failures: 0,
            total_attempts: 0,
          };
        }

        // Count consecutive failures from newest entries
        let consecutiveFailures = 0;
        for (const entry of log) {
          if (entry.status === "failed") consecutiveFailures += 1;
          else break;
        }

        const lastStatus = health.last_webhook_status || null;
        let healthStatus;
        if (consecutiveFailures >= 3) {
          healthStatus = "failing";
          summary.failing += 1;
        } else if (consecutiveFailures > 0) {
          healthStatus = "degraded";
          summary.degraded += 1;
        } else if (lastStatus === "delivered") {
          healthStatus = "healthy";
          summary.healthy += 1;
        } else {
          // Webhook configured but never fired
          healthStatus = "unconfigured";
          summary.unconfigured += 1;
        }

        return {
          id: m.id,
          business_name: m.business_name || m.display_name,
          owner_email: m.owner?.email || null,
          webhook_url: m.webhook_url,
          health_status: healthStatus,
          last_attempt_at: health.last_webhook_attempt_at || null,
          last_status: lastStatus,
          last_http_status: health.last_webhook_http_status || null,
          last_error: health.last_webhook_error || null,
          consecutive_failures: consecutiveFailures,
          total_attempts: log.length,
          verification_status: m.verification_status,
        };
      });

      // Sort: failing first, then degraded, healthy, unconfigured
      const order = { failing: 0, degraded: 1, healthy: 2, unconfigured: 3 };
      rows.sort((a, b) => (order[a.health_status] ?? 4) - (order[b.health_status] ?? 4));

      return res.status(200).json({
        success: true,
        data: {
          summary,
          total: merchants.length,
          merchants: rows,
        },
      });
    } catch (error) {
      console.error("[AdminWebhookHealth] Error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = adminMerchantController;
