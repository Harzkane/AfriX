// File: src/controllers/adminEducationAuthController.js
const { User, Education } = require("../models");
const { EDUCATION_MODULES, EDUCATION_CONFIG } = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { deleteCache } = require("../utils/cache");

const adminEducationAuthController = {
  // =====================================================
  // EDUCATION MANAGEMENT
  // =====================================================

  /**
   * Get education statistics
   * GET /api/v1/admin/education/stats
   */
  getEducationStats: async (req, res) => {
    try {
      const totalUsers = await User.count();

      // Education completion by module
      const completionByModule = {};
      for (const module of Object.values(EDUCATION_MODULES)) {
        const completed = await Education.count({
          where: { module, completed: true },
        });
        const inProgress = await Education.count({
          where: { module, completed: false, attempts: { [Op.gt]: 0 } },
        });
        const notStarted = totalUsers - completed - inProgress;

        completionByModule[module] = {
          completed,
          in_progress: inProgress,
          not_started: notStarted,
          completion_rate:
            totalUsers > 0 ? ((completed / totalUsers) * 100).toFixed(2) : 0,
        };
      }

      // Average attempts per module
      const avgAttempts = await Education.findAll({
        attributes: [
          "module",
          [sequelize.fn("AVG", sequelize.col("attempts")), "avg_attempts"],
          [sequelize.fn("AVG", sequelize.col("score")), "avg_score"],
        ],
        group: ["module"],
        raw: true,
      });

      // Recent completions (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentCompletions = await Education.count({
        where: {
          completed: true,
          completed_at: { [Op.gte]: sevenDaysAgo },
        },
      });

      // Users who completed all modules
      const fullyEducated = await sequelize.query(
        `
        SELECT COUNT(DISTINCT user_id) as count
        FROM education
        WHERE completed = true
        GROUP BY user_id
        HAVING COUNT(*) = ${Object.keys(EDUCATION_MODULES).length}
      `,
        { type: sequelize.QueryTypes.SELECT }
      );

      res.status(200).json({
        success: true,
        data: {
          total_users: totalUsers,
          completion_by_module: completionByModule,
          average_performance: avgAttempts.reduce((acc, item) => {
            acc[item.module] = {
              avg_attempts: parseFloat(item.avg_attempts || 0).toFixed(2),
              avg_score: parseFloat(item.avg_score || 0).toFixed(2),
            };
            return acc;
          }, {}),
          recent_completions_7d: recentCompletions,
          fully_educated_users: fullyEducated[0]?.count || 0,
          education_config: {
            required: EDUCATION_CONFIG.REQUIRED,
            pass_score: EDUCATION_CONFIG.PASS_SCORE,
            max_attempts: EDUCATION_CONFIG.MAX_ATTEMPTS,
          },
        },
      });
    } catch (error) {
      console.error("Get education stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List users' education progress
   * GET /api/v1/admin/education/progress
   * Query: { module?, completed?, user_id?, limit?, offset? }
   */
  listProgress: async (req, res) => {
    try {
      const { module, completed, user_id, limit = 50, offset = 0 } = req.query;

      const where = {};

      if (module) where.module = module;
      if (completed !== undefined) where.completed = completed === "true";
      if (user_id) where.user_id = user_id;

      const progress = await Education.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email", "country_code"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: progress.rows,
        pagination: {
          total: progress.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < progress.count,
        },
      });
    } catch (error) {
      console.error("List education progress error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List users with education summary (one row per user)
   * GET /api/v1/admin/education/users
   * Query: { status?: "all" | "completed" | "in_progress", limit?, offset? }
   */
  listUsersWithEducation: async (req, res) => {
    try {
      const { status = "all", limit = 50, offset = 0 } = req.query;
      const totalModules = Object.keys(EDUCATION_MODULES).length;
      const modulesForMint = EDUCATION_CONFIG.MODULES_REQUIRED_FOR_MINT.length;
      const modulesForBurn = EDUCATION_CONFIG.MODULES_REQUIRED_FOR_BURN.length;

      const statusFilter =
        status === "completed"
          ? "HAVING SUM(CASE WHEN e.completed THEN 1 ELSE 0 END) = :totalModules"
          : status === "in_progress"
            ? "HAVING SUM(CASE WHEN e.completed THEN 1 ELSE 0 END) < :totalModules AND COUNT(e.id) > 0"
            : "HAVING COUNT(e.id) > 0";

      const rows = await sequelize.query(
        `
        SELECT
          u.id,
          u.full_name,
          u.email,
          COALESCE(SUM(CASE WHEN e.completed THEN 1 ELSE 0 END), 0)::int AS completed_modules,
          :totalModules::int AS total_modules,
          ROUND((COALESCE(SUM(CASE WHEN e.completed THEN 1 ELSE 0 END), 0)::numeric / :totalModules) * 100, 2)::text AS completion_percentage
        FROM users u
        INNER JOIN education e ON e.user_id = u.id
        GROUP BY u.id, u.full_name, u.email
        ${statusFilter}
        ORDER BY completed_modules DESC, u.full_name ASC
        LIMIT :limit OFFSET :offset
      `,
        {
          replacements: {
            totalModules,
            limit: parseInt(limit),
            offset: parseInt(offset),
          },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const countRows = await sequelize.query(
        `
        SELECT COUNT(*) AS total FROM (
          SELECT u.id
          FROM users u
          INNER JOIN education e ON e.user_id = u.id
          GROUP BY u.id
          ${statusFilter}
        ) sub
      `,
        {
          replacements: { totalModules },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      const total = parseInt(countRows?.[0]?.total ?? 0, 10);
      const data = (Array.isArray(rows) ? rows : []).map((row) => ({
        user_id: row.id,
        full_name: row.full_name,
        email: row.email,
        completed_modules: parseInt(row.completed_modules, 10),
        total_modules: totalModules,
        completion_percentage: row.completion_percentage,
        can_mint: parseInt(row.completed_modules, 10) >= modulesForMint,
        can_burn: parseInt(row.completed_modules, 10) >= modulesForBurn,
      }));

      res.status(200).json({
        success: true,
        data,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + data.length < total,
        },
      });
    } catch (error) {
      console.error("List users with education error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get user's education progress
   * GET /api/v1/admin/education/users/:user_id/progress
   */
  getUserProgress: async (req, res) => {
    try {
      const { user_id } = req.params;

      const user = await User.findByPk(user_id, {
        attributes: [
          "id",
          "full_name",
          "email",
          "education_what_are_tokens",
          "education_how_agents_work",
          "education_understanding_value",
          "education_safety_security",
        ],
      });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const progress = await Education.findAll({
        where: { user_id },
        order: [["created_at", "ASC"]],
      });

      // Calculate overall completion
      const totalModules = Object.keys(EDUCATION_MODULES).length;
      const completedModules = progress.filter((p) => p.completed).length;
      const completionPercentage = (
        (completedModules / totalModules) *
        100
      ).toFixed(2);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
          },
          summary: {
            total_modules: totalModules,
            completed_modules: completedModules,
            completion_percentage: completionPercentage,
            can_mint:
              completedModules >=
              EDUCATION_CONFIG.MODULES_REQUIRED_FOR_MINT.length,
            can_burn:
              completedModules >=
              EDUCATION_CONFIG.MODULES_REQUIRED_FOR_BURN.length,
          },
          progress: progress,
          user_flags: {
            education_what_are_tokens: user.education_what_are_tokens,
            education_how_agents_work: user.education_how_agents_work,
            education_understanding_value: user.education_understanding_value,
            education_safety_security: user.education_safety_security,
          },
        },
      });
    } catch (error) {
      console.error("Get user education progress error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Reset user's education progress
   * POST /api/v1/admin/education/users/:user_id/reset
   * Body: { module?: string, reason: string }
   */
  resetProgress: async (req, res) => {
    try {
      const { user_id } = req.params;
      const { module, reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Reset reason is required",
        });
      }

      const user = await User.findByPk(user_id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      if (module) {
        // Reset specific module
        const progress = await Education.findOne({
          where: { user_id, module },
        });

        if (!progress) {
          return res.status(404).json({
            success: false,
            error: "Education progress not found for this module",
          });
        }

        progress.completed = false;
        progress.completed_at = null;
        progress.attempts = 0;
        progress.score = 0;
        await progress.save();

        // Update user flag
        const field = `education_${module}`;
        await User.update({ [field]: false }, { where: { id: user_id } });

        res.status(200).json({
          success: true,
          message: `Education progress reset for module: ${module}`,
          data: {
            user_id,
            module,
            reason,
            reset_by: req.user.id,
          },
        });
      } else {
        // Reset all modules
        await Education.update(
          {
            completed: false,
            completed_at: null,
            attempts: 0,
            score: 0,
          },
          { where: { user_id } }
        );

        // Update all user flags
        await User.update(
          {
            education_what_are_tokens: false,
            education_how_agents_work: false,
            education_understanding_value: false,
            education_safety_security: false,
          },
          { where: { id: user_id } }
        );

        res.status(200).json({
          success: true,
          message: "All education progress reset",
          data: {
            user_id,
            modules_reset: "all",
            reason,
            reset_by: req.user.id,
          },
        });
      }
    } catch (error) {
      console.error("Reset education progress error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Manually mark module as complete
   * POST /api/v1/admin/education/users/:user_id/complete
   * Body: { module: string, reason: string }
   */
  markComplete: async (req, res) => {
    try {
      const { user_id } = req.params;
      const { module, reason } = req.body;

      if (!module || !reason) {
        return res.status(400).json({
          success: false,
          error: "Module and reason are required",
        });
      }

      if (!Object.values(EDUCATION_MODULES).includes(module)) {
        return res.status(400).json({
          success: false,
          error: "Invalid module",
        });
      }

      const user = await User.findByPk(user_id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Get or create education record
      let progress = await Education.findOne({
        where: { user_id, module },
      });

      if (!progress) {
        progress = await Education.create({
          user_id,
          module,
          completed: false,
          attempts: 0,
          score: 0,
        });
      }

      // Mark as complete
      progress.completed = true;
      progress.completed_at = new Date();
      progress.score = 100; // Admin override = perfect score
      await progress.save();

      // Update user flag
      const field = `education_${module}`;
      await User.update({ [field]: true }, { where: { id: user_id } });

      res.status(200).json({
        success: true,
        message: `Education module marked as complete: ${module}`,
        data: {
          user_id,
          module,
          reason,
          completed_by: req.user.id,
        },
      });
    } catch (error) {
      console.error("Mark education complete error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // =====================================================
  // AUTHENTICATION & SECURITY MONITORING
  // =====================================================

  /**
   * Get login security statistics
   * GET /api/v1/admin/security/stats
   */
  getSecurityStats: async (req, res) => {
    try {
      // Users with failed login attempts
      const usersWithFailedLogins = await User.count({
        where: { login_attempts: { [Op.gt]: 0 } },
      });

      // Currently locked accounts
      const lockedAccounts = await User.count({
        where: { locked_until: { [Op.gt]: new Date() } },
      });

      // Suspended accounts
      const suspendedAccounts = await User.count({
        where: { is_suspended: true },
      });

      // Recent logins (last 24h)
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLogins = await User.count({
        where: { last_login_at: { [Op.gte]: last24h } },
      });

      // Unverified emails
      const unverifiedEmails = await User.count({
        where: { email_verified: false },
      });

      // Users by country (top 5)
      const usersByCountry = await User.findAll({
        attributes: [
          "country_code",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["country_code"],
        order: [[sequelize.literal("COUNT(id)"), "DESC"]],
        limit: 5,
        raw: true,
      });

      res.status(200).json({
        success: true,
        data: {
          failed_login_attempts: usersWithFailedLogins,
          locked_accounts: lockedAccounts,
          suspended_accounts: suspendedAccounts,
          recent_logins_24h: recentLogins,
          unverified_emails: unverifiedEmails,
          users_by_country: usersByCountry.map((item) => ({
            country: item.country_code,
            count: parseInt(item.count),
          })),
        },
      });
    } catch (error) {
      console.error("Get security stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List users with security issues
   * GET /api/v1/admin/security/issues
   * Query: { issue_type?: "locked" | "failed_logins" | "unverified", limit?, offset? }
   */
  listSecurityIssues: async (req, res) => {
    try {
      const { issue_type, limit = 50, offset = 0 } = req.query;

      let where = {};

      if (issue_type === "locked") {
        where.locked_until = { [Op.gt]: new Date() };
      } else if (issue_type === "failed_logins") {
        where.login_attempts = { [Op.gte]: 3 };
      } else if (issue_type === "unverified") {
        where.email_verified = false;
        where.created_at = {
          [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        }; // Older than 7 days
      } else {
        // Show all issues
        where[Op.or] = [
          { locked_until: { [Op.gt]: new Date() } },
          { login_attempts: { [Op.gte]: 3 } },
          { is_suspended: true },
        ];
      }

      const users = await User.findAndCountAll({
        where,
        attributes: [
          "id",
          "full_name",
          "email",
          "country_code",
          "login_attempts",
          "locked_until",
          "is_suspended",
          "suspension_reason",
          "email_verified",
          "last_login_at",
          "created_at",
          "last_unlocked_at",
          "last_unlocked_by_id",
          "last_reset_attempts_at",
          "last_reset_attempts_by_id",
        ],
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
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["login_attempts", "DESC"]],
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
      console.error("List security issues error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Unlock user account
   * POST /api/v1/admin/security/users/:user_id/unlock
   */
  unlockAccount: async (req, res) => {
    try {
      const { user_id } = req.params;

      const user = await User.findByPk(user_id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      if (!user.locked_until || user.locked_until < new Date()) {
        return res.status(400).json({
          success: false,
          error: "Account is not locked",
        });
      }

      // Reset login attempts and unlock; record audit
      user.login_attempts = 0;
      user.locked_until = null;
      user.last_unlocked_at = new Date();
      user.last_unlocked_by_id = req.user.id;
      await user.save();

      // Clear cache
      await deleteCache(`user:${user_id}`);

      res.status(200).json({
        success: true,
        message: "Account unlocked successfully",
        data: {
          user_id: user.id,
          email: user.email,
          unlocked_by: req.user.id,
        },
      });
    } catch (error) {
      console.error("Unlock account error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Reset failed login attempts
   * POST /api/v1/admin/security/users/:user_id/reset-attempts
   */
  resetLoginAttempts: async (req, res) => {
    try {
      const { user_id } = req.params;

      const user = await User.findByPk(user_id);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const previousAttempts = user.login_attempts;

      user.login_attempts = 0;
      user.locked_until = null;
      user.last_reset_attempts_at = new Date();
      user.last_reset_attempts_by_id = req.user.id;
      await user.save();

      await deleteCache(`user:${user_id}`);

      res.status(200).json({
        success: true,
        message: "Login attempts reset successfully",
        data: {
          user_id: user.id,
          email: user.email,
          previous_attempts: previousAttempts,
          reset_by: req.user.id,
        },
      });
    } catch (error) {
      console.error("Reset login attempts error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = adminEducationAuthController;
