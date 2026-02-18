// File: src/controllers/adminUserController.js
const { User, Wallet, Transaction, Agent, Merchant } = require("../models");
const { USER_ROLES, VERIFICATION_LEVELS } = require("../config/constants");
const walletService = require("../services/walletService");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const adminUserController = {
  /**
   * Get user statistics (dashboard overview)
   * GET /api/v1/admin/users/stats
   */
  getStats: async (req, res) => {
    try {
      // Total users by role
      const totalUsers = await User.count();
      const regularUsers = await User.count({
        where: { role: USER_ROLES.USER },
      });
      const agentUsers = await User.count({
        where: { role: USER_ROLES.AGENT },
      });
      const merchantUsers = await User.count({
        where: { role: USER_ROLES.MERCHANT },
      });
      const adminUsers = await User.count({
        where: { role: USER_ROLES.ADMIN },
      });

      // Verification stats
      const emailVerified = await User.count({
        where: { email_verified: true },
      });
      const phoneVerified = await User.count({
        where: { phone_verified: true },
      });
      const identityVerified = await User.count({
        where: { identity_verified: true },
      });

      // Account status
      const activeUsers = await User.count({ where: { is_active: true } });
      const suspendedUsers = await User.count({
        where: { is_suspended: true },
      });
      const lockedUsers = await User.count({
        where: { locked_until: { [Op.gt]: new Date() } },
      });

      // Recent registrations (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentRegistrations = await User.count({
        where: { created_at: { [Op.gte]: thirtyDaysAgo } },
      });

      // Wallet statistics
      const totalWallets = await Wallet.count();
      const activeWallets = await Wallet.count({ where: { is_active: true } });
      const frozenWallets = await Wallet.count({ where: { is_frozen: true } });

      res.status(200).json({
        success: true,
        data: {
          user_counts: {
            total: totalUsers,
            by_role: {
              regular: regularUsers,
              agents: agentUsers,
              merchants: merchantUsers,
              admins: adminUsers,
            },
            recent_registrations_30d: recentRegistrations,
          },
          verification_stats: {
            email_verified: emailVerified,
            phone_verified: phoneVerified,
            identity_verified: identityVerified,
          },
          account_status: {
            active: activeUsers,
            suspended: suspendedUsers,
            locked: lockedUsers,
          },
          wallet_stats: {
            total_wallets: totalWallets,
            active: activeWallets,
            frozen: frozenWallets,
          },
        },
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List all users with filters
   * GET /api/v1/admin/users
   * Query: { role?, email_verified?, is_active?, is_suspended?, search?, limit?, offset? }
   */
  listUsers: async (req, res) => {
    try {
      const {
        role,
        email_verified,
        is_active,
        is_suspended,
        search,
        limit = 50,
        offset = 0,
      } = req.query;

      const where = {};

      if (role) where.role = role;
      if (email_verified !== undefined)
        where.email_verified = email_verified === "true";
      if (is_active !== undefined) where.is_active = is_active === "true";
      if (is_suspended !== undefined)
        where.is_suspended = is_suspended === "true";

      // Search by name or email
      if (search) {
        where[Op.or] = [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const users = await User.findAndCountAll({
        where,
        attributes: [
          "id",
          "full_name",
          "email",
          "phone_number",
          "country_code",
          "role",
          "email_verified",
          "phone_verified",
          "identity_verified",
          "verification_level",
          "is_active",
          "is_suspended",
          "last_login_at",
          "created_at",
        ],
        include: [
          {
            model: Wallet,
            as: "wallets",
            attributes: ["id", "token_type", "balance", "is_frozen"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: users.rows,
        pagination: {
          total: users.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < users.count,
        },
      });
    } catch (error) {
      console.error("List users error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get single user details
   * GET /api/v1/admin/users/:id
   */
  getUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [
          {
            model: User,
            as: "lastUnlockedBy",
            attributes: ["id", "full_name"],
            required: false,
          },
          {
            model: User,
            as: "lastResetAttemptsBy",
            attributes: ["id", "full_name"],
            required: false,
          },
          {
            model: Wallet,
            as: "wallets",
            attributes: [
              "id",
              "token_type",
              "balance",
              "pending_balance",
              "total_received",
              "total_sent",
              "transaction_count",
              "is_frozen",
              "frozen_reason",
              "created_at",
            ],
          },
          {
            model: Agent,
            as: "agent",
            required: false,
            attributes: [
              "id",
              "status",
              "tier",
              "deposit_usd",
              "available_capacity",
              "rating",
              "is_verified",
            ],
          },
          {
            model: Merchant,
            as: "merchant",
            required: false,
            attributes: [
              "id",
              "business_name",
              "verification_status",
              "created_at",
            ],
          },
        ],
      });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Get transaction summary
      const transactionStats = await Transaction.findOne({
        attributes: [
          [
            Transaction.sequelize.fn("COUNT", Transaction.sequelize.col("id")),
            "total_transactions",
          ],
          [
            Transaction.sequelize.fn(
              "SUM",
              Transaction.sequelize.literal(
                `CASE WHEN from_user_id = '${id}' AND status = 'completed' THEN amount ELSE 0 END`
              )
            ),
            "total_sent",
          ],
          [
            Transaction.sequelize.fn(
              "SUM",
              Transaction.sequelize.literal(
                `CASE WHEN to_user_id = '${id}' AND status = 'completed' THEN amount ELSE 0 END`
              )
            ),
            "total_received",
          ],
        ],
        where: {
          [Op.or]: [{ from_user_id: id }, { to_user_id: id }],
        },
        raw: true,
      });

      const userData = {
        ...user.toJSON(),
        transaction_summary: {
          total_transactions:
            parseInt(transactionStats?.total_transactions) || 0,
          total_sent: parseFloat(transactionStats?.total_sent) || 0,
          total_received: parseFloat(transactionStats?.total_received) || 0,
        },
      };

      res.status(200).json({ success: true, data: userData });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Suspend user account
   * POST /api/v1/admin/users/:id/suspend
   * Body: { reason: string, duration_days?: number }
   */
  suspendUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason, duration_days } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Suspension reason is required",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      if (user.role === USER_ROLES.ADMIN) {
        return res.status(400).json({
          success: false,
          error: "Cannot suspend admin users",
        });
      }

      if (user.is_suspended) {
        return res.status(400).json({
          success: false,
          error: "User is already suspended",
        });
      }

      user.is_suspended = true;
      user.suspension_reason = reason;

      if (duration_days) {
        const suspendedUntil = new Date();
        suspendedUntil.setDate(
          suspendedUntil.getDate() + parseInt(duration_days)
        );
        user.suspended_until = suspendedUntil;
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: "User suspended successfully",
        data: {
          user_id: user.id,
          is_suspended: user.is_suspended,
          suspension_reason: reason,
          suspended_until: user.suspended_until,
        },
      });
    } catch (error) {
      console.error("Suspend user error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Unsuspend user account
   * POST /api/v1/admin/users/:id/unsuspend
   */
  unsuspendUser: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      if (!user.is_suspended) {
        return res.status(400).json({
          success: false,
          error: "User is not suspended",
        });
      }

      user.is_suspended = false;
      user.suspension_reason = null;
      user.suspended_until = null;

      await user.save();

      res.status(200).json({
        success: true,
        message: "User unsuspended successfully",
        data: {
          user_id: user.id,
          is_suspended: user.is_suspended,
        },
      });
    } catch (error) {
      console.error("Unsuspend user error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Verify user email (manual verification)
   * POST /api/v1/admin/users/:id/verify-email
   */
  verifyEmail: async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      user.email_verified = true;
      user.email_verification_token = null;
      user.email_verification_expires = null;
      user.updateVerificationLevel();

      await user.save();

      res.status(200).json({
        success: true,
        message: "Email verified successfully",
        data: {
          user_id: user.id,
          email_verified: user.email_verified,
          verification_level: user.verification_level,
        },
      });
    } catch (error) {
      console.error("Verify email error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Reset user password (admin)
   * POST /api/v1/admin/users/:id/reset-password
   * Body: { new_password: string }
   */
  resetPassword: async (req, res) => {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      if (!new_password || new_password.length < 8) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 8 characters",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(12);
      user.password_hash = await bcrypt.hash(new_password, salt);

      // Reset login attempts
      user.login_attempts = 0;
      user.locked_until = null;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
        data: {
          user_id: user.id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Credit user wallet
   * POST /api/v1/admin/users/:id/credit-wallet
   * Body: { amount: number, token_type: string, description: string }
   */
  creditWallet: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, token_type, description } = req.body;

      if (!amount || !token_type) {
        return res.status(400).json({
          success: false,
          error: "amount and token_type are required",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const result = await walletService.credit({
        userId: id,
        amount: parseFloat(amount),
        token_type,
        type: "credit",
        metadata: {
          description: description || `Admin credit by ${req.user.email}`,
          admin_id: req.user.id,
        },
      });

      res.status(200).json({
        success: true,
        message: "Wallet credited successfully",
        data: {
          transaction: result.transaction,
          new_balance: result.wallet.balance,
        },
      });
    } catch (error) {
      console.error("Credit wallet error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Debit user wallet
   * POST /api/v1/admin/users/:id/debit-wallet
   * Body: { amount: number, token_type: string, description: string }
   */
  debitWallet: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, token_type, description } = req.body;

      if (!amount || !token_type) {
        return res.status(400).json({
          success: false,
          error: "amount and token_type are required",
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const result = await walletService.debit({
        userId: id,
        amount: parseFloat(amount),
        token_type,
        metadata: {
          description: description || `Admin debit by ${req.user.email}`,
          admin_id: req.user.id,
        },
      });

      res.status(200).json({
        success: true,
        message: "Wallet debited successfully",
        data: {
          transaction: result.transaction,
          new_balance: result.wallet.balance,
        },
      });
    } catch (error) {
      console.error("Debit wallet error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Freeze user wallet
   * POST /api/v1/admin/users/:id/freeze-wallet
   * Body: { token_type: string, reason: string }
   */
  freezeWallet: async (req, res) => {
    try {
      const { id } = req.params;
      const { token_type, reason } = req.body;

      if (!token_type || !reason) {
        return res.status(400).json({
          success: false,
          error: "token_type and reason are required",
        });
      }

      const wallet = await Wallet.findOne({
        where: { user_id: id, token_type },
      });

      if (!wallet) {
        return res
          .status(404)
          .json({ success: false, error: "Wallet not found" });
      }

      if (wallet.is_frozen) {
        return res.status(400).json({
          success: false,
          error: "Wallet is already frozen",
        });
      }

      await wallet.freeze(reason);

      res.status(200).json({
        success: true,
        message: "Wallet frozen successfully",
        data: {
          wallet_id: wallet.id,
          token_type: wallet.token_type,
          is_frozen: wallet.is_frozen,
          frozen_reason: reason,
        },
      });
    } catch (error) {
      console.error("Freeze wallet error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Unfreeze user wallet
   * POST /api/v1/admin/users/:id/unfreeze-wallet
   * Body: { token_type: string }
   */
  unfreezeWallet: async (req, res) => {
    try {
      const { id } = req.params;
      const { token_type } = req.body;

      if (!token_type) {
        return res.status(400).json({
          success: false,
          error: "token_type is required",
        });
      }

      const wallet = await Wallet.findOne({
        where: { user_id: id, token_type },
      });

      if (!wallet) {
        return res
          .status(404)
          .json({ success: false, error: "Wallet not found" });
      }

      if (!wallet.is_frozen) {
        return res.status(400).json({
          success: false,
          error: "Wallet is not frozen",
        });
      }

      await wallet.unfreeze();

      res.status(200).json({
        success: true,
        message: "Wallet unfrozen successfully",
        data: {
          wallet_id: wallet.id,
          token_type: wallet.token_type,
          is_frozen: wallet.is_frozen,
        },
      });
    } catch (error) {
      console.error("Unfreeze wallet error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = adminUserController;
