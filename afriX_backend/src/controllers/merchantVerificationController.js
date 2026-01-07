// src/controllers/merchantVerificationController.js

const { Merchant, MerchantKyc } = require("../models");
const { MERCHANT_STATUS } = require("../config/constants");

const merchantVerificationController = {
  /**
   * Submit KYC verification (merchant)
   * POST /api/merchants/verify
   * Body: { documents: { selfie?, ... } }
   */
  submitVerification: async (req, res) => {
    try {
      const merchantId = req.user.id;

      const merchant = await Merchant.findByPk(merchantId, {
        include: [{ model: MerchantKyc, as: "kyc" }],
      });
      if (!merchant)
        return res
          .status(404)
          .json({ success: false, error: "Merchant not found" });

      // Upsert KYC record
      const [kyc, created] = await MerchantKyc.upsert(
        {
          merchant_id: merchant.id,
          status: "pending",
          submitted_at: new Date(),
          ...req.body.documents, // optional document URLs / data
        },
        { returning: true }
      );

      // Update merchant verification status
      merchant.verification_status = MERCHANT_STATUS.PENDING;
      await merchant.save();

      res.status(200).json({
        success: true,
        message: created
          ? "KYC submitted successfully"
          : "KYC updated successfully",
        kyc,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Approve merchant (admin)
   * Now handled in adminMerchantController
   */
  approveVerification: async (req, res) => {
    return res.status(400).json({
      success: false,
      message: "Admin must use /api/admin/merchants/:id/approve to approve KYC",
    });
  },

  /**
   * Reject merchant (admin)
   * Now handled in adminMerchantController
   */
  rejectVerification: async (req, res) => {
    return res.status(400).json({
      success: false,
      message: "Admin must use /api/admin/merchants/:id/reject to reject KYC",
    });
  },
};

module.exports = merchantVerificationController;
