// File: src/controllers/adminAgentController.js
const { Agent, AgentKyc, User } = require("../models");
const { AGENT_STATUS } = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");

const adminAgentController = {
  /**
   * List all agents (optionally filter by status or is_verified)
   * GET /api/v1/admin/agents?status=pending|active|suspended&verified=true|false
   */
  listAgents: async (req, res) => {
    try {
      const { status, verified, country, tier } = req.query;
      const where = {};

      if (status) where.status = status;
      if (verified !== undefined) where.is_verified = verified === "true";
      if (country) where.country = country;
      if (tier) where.tier = tier;

      const agents = await Agent.findAll({
        where,
        include: [
          {
            model: AgentKyc,
            as: "kyc",
            required: false,
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email", "phone_number"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Enrich with financial calculations
      const enrichedAgents = agents.map((agent) => {
        const outstanding = agent.total_minted - agent.total_burned;
        const maxWithdraw = agent.deposit_usd - outstanding;

        return {
          ...agent.toJSON(),
          financial_summary: {
            outstanding_tokens: outstanding,
            max_withdrawable: maxWithdraw,
            utilization_percentage:
              agent.deposit_usd > 0
                ? ((outstanding / agent.deposit_usd) * 100).toFixed(2)
                : 0,
          },
        };
      });

      res.status(200).json({
        success: true,
        data: enrichedAgents,
        count: enrichedAgents.length,
      });
    } catch (error) {
      console.error("List agents error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get a single agent + KYC details + financial summary
   * GET /api/v1/admin/agents/:id
   */
  getAgent: async (req, res) => {
    try {
      const { id } = req.params;
      const agent = await Agent.findByPk(id, {
        include: [
          {
            model: AgentKyc,
            as: "kyc",
          },
          {
            model: User,
            as: "user",
            attributes: [
              "id",
              "full_name",
              "email",
              "phone_number",
              "country_code",
              "created_at",
            ],
          },
        ],
      });

      if (!agent) {
        return res
          .status(404)
          .json({ success: false, error: "Agent not found" });
      }

      // Calculate financial metrics
      const outstanding = agent.total_minted - agent.total_burned;
      const maxWithdraw = agent.deposit_usd - outstanding;

      const agentData = {
        ...agent.toJSON(),
        financial_summary: {
          outstanding_tokens: outstanding,
          max_withdrawable: maxWithdraw,
          utilization_percentage:
            agent.deposit_usd > 0
              ? ((outstanding / agent.deposit_usd) * 100).toFixed(2)
              : 0,
          total_revenue: agent.total_minted - agent.total_burned, // Simplified metric
        },
      };

      res.status(200).json({ success: true, data: agentData });
    } catch (error) {
      console.error("Get agent error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Approve agent KYC
   * POST /api/v1/admin/agents/:id/approve-kyc
   */
  approveKyc: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const agent = await Agent.findByPk(id, {
        include: [{ model: AgentKyc, as: "kyc" }],
      });

      if (!agent) {
        return res
          .status(404)
          .json({ success: false, error: "Agent not found" });
      }

      if (!agent.kyc) {
        return res.status(400).json({
          success: false,
          error: "Agent has not submitted KYC",
        });
      }

      if (agent.kyc.status === "approved") {
        return res.status(400).json({
          success: false,
          error: "KYC already approved",
        });
      }

      // Update KYC
      agent.kyc.status = "approved";
      agent.kyc.reviewed_by = adminId;
      agent.kyc.reviewed_at = new Date();
      await agent.kyc.save();

      // Update agent verification status
      agent.is_verified = true;
      await agent.save();

      res.status(200).json({
        success: true,
        message: "Agent KYC approved successfully",
        data: {
          agent_id: agent.id,
          is_verified: agent.is_verified,
          kyc_status: agent.kyc.status,
        },
      });
    } catch (error) {
      console.error("Approve agent KYC error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Reject agent KYC
   * POST /api/v1/admin/agents/:id/reject-kyc
   * Body: { reason: string }
   */
  rejectKyc: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Rejection reason is required",
        });
      }

      const agent = await Agent.findByPk(id, {
        include: [{ model: AgentKyc, as: "kyc" }],
      });

      if (!agent) {
        return res
          .status(404)
          .json({ success: false, error: "Agent not found" });
      }

      if (!agent.kyc) {
        return res.status(400).json({
          success: false,
          error: "Agent has not submitted KYC",
        });
      }

      // Update KYC
      agent.kyc.status = "rejected";
      agent.kyc.rejection_reason = reason;
      agent.kyc.reviewed_by = adminId;
      agent.kyc.reviewed_at = new Date();
      await agent.kyc.save();

      // Update agent verification status
      agent.is_verified = false;
      await agent.save();

      res.status(200).json({
        success: true,
        message: "Agent KYC rejected successfully",
        data: {
          agent_id: agent.id,
          is_verified: agent.is_verified,
          kyc_status: agent.kyc.status,
          rejection_reason: reason,
        },
      });
    } catch (error) {
      console.error("Reject agent KYC error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Suspend agent
   * POST /api/v1/admin/agents/:id/suspend
   * Body: { reason: string }
   */
  suspendAgent: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Suspension reason is required",
        });
      }

      const agent = await Agent.findByPk(id);

      if (!agent) {
        return res
          .status(404)
          .json({ success: false, error: "Agent not found" });
      }

      if (agent.status === AGENT_STATUS.SUSPENDED) {
        return res.status(400).json({
          success: false,
          error: "Agent is already suspended",
        });
      }

      // Store previous status for potential restoration
      const previousStatus = agent.status;

      agent.status = AGENT_STATUS.SUSPENDED;
      await agent.save();

      // You can log this action in an admin_actions table if needed
      // await AdminAction.create({ ... })

      res.status(200).json({
        success: true,
        message: "Agent suspended successfully",
        data: {
          agent_id: agent.id,
          previous_status: previousStatus,
          current_status: agent.status,
          reason,
        },
      });
    } catch (error) {
      console.error("Suspend agent error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Activate/Reactivate agent
   * POST /api/v1/admin/agents/:id/activate
   */
  activateAgent: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const agent = await Agent.findByPk(id);

      if (!agent) {
        return res
          .status(404)
          .json({ success: false, error: "Agent not found" });
      }

      if (agent.status === AGENT_STATUS.ACTIVE) {
        return res.status(400).json({
          success: false,
          error: "Agent is already active",
        });
      }

      // Check if agent meets activation requirements
      if (agent.deposit_usd < 100) {
        return res.status(400).json({
          success: false,
          error: "Agent must have at least $100 deposit to activate",
        });
      }

      const previousStatus = agent.status;
      agent.status = AGENT_STATUS.ACTIVE;
      await agent.save();

      res.status(200).json({
        success: true,
        message: "Agent activated successfully",
        data: {
          agent_id: agent.id,
          previous_status: previousStatus,
          current_status: agent.status,
        },
      });
    } catch (error) {
      console.error("Activate agent error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get agent statistics (dashboard overview)
   * GET /api/v1/admin/agents/stats
   */
  getStats: async (req, res) => {
    try {
      // Total agents by status
      const totalAgents = await Agent.count();
      const activeAgents = await Agent.count({
        where: { status: AGENT_STATUS.ACTIVE },
      });
      const pendingAgents = await Agent.count({
        where: { status: AGENT_STATUS.PENDING },
      });
      const suspendedAgents = await Agent.count({
        where: { status: AGENT_STATUS.SUSPENDED },
      });

      // KYC stats
      const verifiedAgents = await Agent.count({
        where: { is_verified: true },
      });
      const pendingKyc = await AgentKyc.count({
        where: { status: "under_review" },
      });

      // Financial stats
      const agents = await Agent.findAll({
        attributes: ["deposit_usd", "total_minted", "total_burned"],
      });

      const totalDeposits = agents.reduce(
        (sum, a) => sum + parseFloat(a.deposit_usd || 0),
        0
      );
      const totalMinted = agents.reduce(
        (sum, a) => sum + parseFloat(a.total_minted || 0),
        0
      );
      const totalBurned = agents.reduce(
        (sum, a) => sum + parseFloat(a.total_burned || 0),
        0
      );

      res.status(200).json({
        success: true,
        data: {
          agent_counts: {
            total: totalAgents,
            active: activeAgents,
            pending: pendingAgents,
            suspended: suspendedAgents,
          },
          kyc_stats: {
            verified: verifiedAgents,
            pending_review: pendingKyc,
          },
          financial_summary: {
            total_deposits_usd: totalDeposits.toFixed(2),
            total_tokens_minted: totalMinted.toFixed(2),
            total_tokens_burned: totalBurned.toFixed(2),
            outstanding_tokens: (totalMinted - totalBurned).toFixed(2),
          },
        },
      });
    } catch (error) {
      console.error("Get agent stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = adminAgentController;
