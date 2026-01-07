// File: src/controllers/userController.js
const { User, Agent, Wallet, Transaction, Merchant } = require("../models");
const {
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
  AGENT_STATUS,
} = require("../config/constants");
const userService = require("../services/userService");
const { ApiError } = require("../utils/errors");

/**
 * User Controller
 * Handles profile, balances, and summary endpoints.
 */
const userController = {
  /**
   * Get authenticated user's profile and wallets.
   */
  async getProfile(req, res, next) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ["id", "full_name", "email", "role", "verification_level"],
        include: [
          {
            model: Wallet,
            as: "wallets",
            attributes: ["id", "token_type", "balance", "created_at"],
          },
        ],
      });

      if (!user) throw new ApiError("User not found", 404);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update profile info (name, phone, language, etc.)
   */
  async updateProfile(req, res, next) {
    try {
      const { full_name, phone_number, language, theme } = req.body;

      const user = await User.findByPk(req.user.id);
      if (!user) throw new ApiError("User not found", 404);

      if (full_name) user.full_name = full_name;

      // Handle phone number update and verification reset
      if (phone_number && phone_number !== user.phone_number) {
        user.phone_number = phone_number;
        user.phone_verified = false;
        user.updateVerificationLevel();
      }

      if (language) user.language = language;
      if (theme) user.theme = theme;

      // Education Progress Updates
      if (req.body.education_what_are_tokens !== undefined)
        user.education_what_are_tokens = req.body.education_what_are_tokens;
      if (req.body.education_how_agents_work !== undefined)
        user.education_how_agents_work = req.body.education_how_agents_work;
      if (req.body.education_understanding_value !== undefined)
        user.education_understanding_value = req.body.education_understanding_value;
      if (req.body.education_safety_security !== undefined)
        user.education_safety_security = req.body.education_safety_security;

      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/users/find-agents
   * Query params: country, limit
   */
  async findAgents(req, res, next) {
    try {
      const { country, limit } = req.query;
      const userCountry = country || req.user?.country_code;

      const agents = await userService.findAgents({
        country: userCountry,
        limit: limit ? parseInt(limit) : 10,
      });

      res.json({
        success: true,
        data: agents,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get aggregated balances across all wallets.
   */
  async getBalances(req, res, next) {
    try {
      const wallets = await Wallet.findAll({
        where: { user_id: req.user.id },
        attributes: ["token_type", "balance"],
      });

      const totals = wallets.reduce((acc, w) => {
        acc[w.token_type] = parseFloat(w.balance);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          balances: totals,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get activity summary (sent, received, merchant payments, etc.)
   */
  async getSummary(req, res, next) {
    try {
      const uid = req.user.id;

      const totalSent = await Transaction.sum("amount", {
        where: { from_user_id: uid, status: TRANSACTION_STATUS.COMPLETED }, // Use the constant
      });
      const totalReceived = await Transaction.sum("amount", {
        where: { to_user_id: uid, status: TRANSACTION_STATUS.COMPLETED }, // Use the constant
      });
      const merchantPayments = await Transaction.count({
        where: { from_user_id: uid, type: TRANSACTION_TYPES.COLLECTION },
      });

      res.json({
        success: true,
        data: {
          total_sent: totalSent || 0,
          total_received: totalReceived || 0,
          merchant_payments: merchantPayments || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get merchant profile for logged-in merchant user.
   */
  async getMerchantProfile(req, res, next) {
    try {
      const merchant = await Merchant.findOne({
        where: { user_id: req.user.id },
      });
      if (!merchant) throw new ApiError("Merchant profile not found", 404);

      res.json({
        success: true,
        data: merchant,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/users/fcm-token
   * Update user's FCM token for push notifications.
   */
  async updateFcmToken(req, res, next) {
    try {
      const { fcm_token } = req.body;
      if (!fcm_token) throw new ApiError("FCM token required", 400);

      await User.update({ fcm_token }, { where: { id: req.user.id } });

      res.json({ success: true, message: "FCM token saved" });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;
