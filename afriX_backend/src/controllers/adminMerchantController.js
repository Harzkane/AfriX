const { Merchant, MerchantKyc, User } = require("../models");
const { MERCHANT_STATUS } = require("../config/constants");

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
        include: [{ model: MerchantKyc, as: "kyc" }],
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({ success: true, data: merchants });
    } catch (error) {
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
        include: [{ model: MerchantKyc, as: "kyc" }],
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
};

module.exports = adminMerchantController;
