// File: src/controllers/adminOperationsController.js
const { Dispute, Escrow, Transaction, Agent, User } = require("../models");
const MintRequest = require("../models/MintRequest");
const BurnRequest = require("../models/BurnRequest");
const disputeService = require("../services/disputeService");
const escrowService = require("../services/escrowService");
const {
  DISPUTE_STATUS,
  DISPUTE_ESCALATION_LEVELS,
  ESCROW_STATUS,
  MINT_REQUEST_STATUS,
  BURN_REQUEST_STATUS,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");

const adminOperationsController = {
  // =====================================================
  // DISPUTE MANAGEMENT
  // =====================================================

  /**
   * Get dispute statistics
   * GET /api/v1/admin/operations/disputes/stats
   */
  getDisputeStats: async (req, res) => {
    try {
      const totalDisputes = await Dispute.count();
      const openDisputes = await Dispute.count({
        where: { status: DISPUTE_STATUS.OPEN },
      });
      const resolvedDisputes = await Dispute.count({
        where: { status: DISPUTE_STATUS.RESOLVED },
      });
      const escalatedDisputes = await Dispute.count({
        where: {
          escalation_level: {
            [Op.in]: [
              DISPUTE_ESCALATION_LEVELS.LEVEL_2,
              DISPUTE_ESCALATION_LEVELS.LEVEL_3,
            ],
          },
        },
      });

      // Get resolution breakdown
      const resolvedWithRefund = await Dispute.count({
        where: {
          status: DISPUTE_STATUS.RESOLVED,
          resolution: { [Op.ne]: null },
        },
      });

      // Recent disputes (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentDisputes = await Dispute.count({
        where: { created_at: { [Op.gte]: sevenDaysAgo } },
      });

      res.status(200).json({
        success: true,
        data: {
          total_disputes: totalDisputes,
          open: openDisputes,
          resolved: resolvedDisputes,
          escalated: escalatedDisputes,
          resolved_with_action: resolvedWithRefund,
          recent_7_days: recentDisputes,
        },
      });
    } catch (error) {
      console.error("Get dispute stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List all disputes with filters
   * GET /api/v1/admin/operations/disputes
   * Query: { status?, escalation_level?, agent_id?, user_id?, limit?, offset? }
   */
  listDisputes: async (req, res) => {
    try {
      const {
        status,
        escalation_level,
        agent_id,
        user_id,
        limit = 50,
        offset = 0,
      } = req.query;

      const where = {};

      if (status) where.status = status;
      if (escalation_level) where.escalation_level = escalation_level;
      if (agent_id) where.agent_id = agent_id;
      if (user_id) where.opened_by_user_id = user_id;

      const disputes = await Dispute.findAndCountAll({
        where,
        include: [
          {
            model: Escrow,
            as: "escrow",
            attributes: ["id", "amount", "token_type", "status"],
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "tier", "rating"],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: disputes.rows,
        pagination: {
          total: disputes.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < disputes.count,
        },
      });
    } catch (error) {
      console.error("List disputes error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get single dispute with full details
   * GET /api/v1/admin/operations/disputes/:id
   */
  getDispute: async (req, res) => {
    try {
      const { id } = req.params;

      const dispute = await Dispute.findByPk(id, {
        include: [
          {
            model: Escrow,
            as: "escrow",
            include: [
              {
                model: Transaction,
                as: "transaction",
                attributes: ["id", "reference", "type", "amount", "status"],
              },
            ],
          },
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email", "phone_number"],
          },
          {
            model: Agent,
            as: "agent",
            attributes: [
              "id",
              "tier",
              "rating",
              "deposit_usd",
              "available_capacity",
            ],
            required: false,
          },
        ],
      });

      if (!dispute) {
        return res
          .status(404)
          .json({ success: false, error: "Dispute not found" });
      }

      res.status(200).json({ success: true, data: dispute });
    } catch (error) {
      console.error("Get dispute error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Escalate dispute level
   * POST /api/v1/admin/operations/disputes/:id/escalate
   * Body: { escalation_level: string, notes?: string }
   */
  escalateDispute: async (req, res) => {
    try {
      const { id } = req.params;
      const { escalation_level, notes } = req.body;

      if (
        !Object.values(DISPUTE_ESCALATION_LEVELS).includes(escalation_level)
      ) {
        return res.status(400).json({
          success: false,
          error: "Invalid escalation level",
        });
      }

      const dispute = await Dispute.findByPk(id);

      if (!dispute) {
        return res
          .status(404)
          .json({ success: false, error: "Dispute not found" });
      }

      if (dispute.status !== DISPUTE_STATUS.OPEN) {
        return res.status(400).json({
          success: false,
          error: "Can only escalate open disputes",
        });
      }

      dispute.escalation_level = escalation_level;
      dispute.resolution = {
        ...(dispute.resolution || {}),
        escalation_notes: notes,
        escalated_by: req.user.id,
        escalated_at: new Date(),
      };

      await dispute.save();

      res.status(200).json({
        success: true,
        message: "Dispute escalated successfully",
        data: dispute,
      });
    } catch (error) {
      console.error("Escalate dispute error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // =====================================================
  // ESCROW MANAGEMENT
  // =====================================================

  /**
   * Get escrow statistics
   * GET /api/v1/admin/operations/escrows/stats
   */
  getEscrowStats: async (req, res) => {
    try {
      const totalEscrows = await Escrow.count();
      const lockedEscrows = await Escrow.count({
        where: { status: ESCROW_STATUS.LOCKED },
      });
      const completedEscrows = await Escrow.count({
        where: { status: ESCROW_STATUS.COMPLETED },
      });
      const disputedEscrows = await Escrow.count({
        where: { status: ESCROW_STATUS.DISPUTED },
      });
      const refundedEscrows = await Escrow.count({
        where: { status: ESCROW_STATUS.REFUNDED },
      });

      // Expired escrows needing attention
      const now = new Date();
      const expiredEscrows = await Escrow.count({
        where: {
          status: ESCROW_STATUS.LOCKED,
          expires_at: { [Op.lt]: now },
        },
      });

      // Total value locked
      const lockedValue = await Escrow.sum("amount", {
        where: { status: ESCROW_STATUS.LOCKED },
      });

      res.status(200).json({
        success: true,
        data: {
          total_escrows: totalEscrows,
          locked: lockedEscrows,
          completed: completedEscrows,
          disputed: disputedEscrows,
          refunded: refundedEscrows,
          expired_needs_action: expiredEscrows,
          total_value_locked: parseFloat(lockedValue || 0).toFixed(2),
        },
      });
    } catch (error) {
      console.error("Get escrow stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List all escrows with filters
   * GET /api/v1/admin/operations/escrows
   * Query: { status?, expired?, agent_id?, user_id?, limit?, offset? }
   */
  listEscrows: async (req, res) => {
    try {
      const {
        status,
        expired,
        agent_id,
        user_id,
        limit = 50,
        offset = 0,
      } = req.query;

      const where = {};

      if (status) where.status = status;
      if (agent_id) where.agent_id = agent_id;
      if (user_id) where.from_user_id = user_id;

      // Filter expired escrows
      if (expired === "true") {
        where.status = ESCROW_STATUS.LOCKED;
        where.expires_at = { [Op.lt]: new Date() };
      }

      const escrows = await Escrow.findAndCountAll({
        where,
        include: [
          {
            model: Transaction,
            as: "transaction",
            attributes: ["id", "reference", "type", "amount", "status"],
          },
          {
            model: User,
            as: "fromUser", // ← FIXED: was "user"
            attributes: ["id", "full_name", "email"],
          },
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "tier", "rating"],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: escrows.rows,
        pagination: {
          total: escrows.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < escrows.count,
        },
      });
    } catch (error) {
      console.error("List escrows error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Force finalize escrow (admin override)
   * POST /api/v1/admin/operations/escrows/:id/force-finalize
   * Body: { notes?: string }
   */
  forceFinalize: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const result = await escrowService.finalizeBurn(id, {
        admin_override: true,
        admin_id: req.user.id,
        notes: notes || "Admin forced finalization",
      });

      res.status(200).json({
        success: true,
        message: "Escrow finalized by admin",
        data: result,
      });
    } catch (error) {
      console.error("Force finalize error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Process all expired escrows
   * POST /api/v1/admin/operations/escrows/process-expired
   */
  processExpiredEscrows: async (req, res) => {
    try {
      const { limit = 50 } = req.body;

      const results = await escrowService.processExpiredEscrows(limit);

      res.status(200).json({
        success: true,
        message: `Processed ${results.length} expired escrows`,
        data: results,
      });
    } catch (error) {
      console.error("Process expired escrows error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // =====================================================
  // REQUEST MANAGEMENT (MINT/BURN)
  // =====================================================

  /**
   * Get request statistics
   * GET /api/v1/admin/operations/requests/stats
   */
  getRequestStats: async (req, res) => {
    try {
      // Mint requests
      const totalMintRequests = await MintRequest.count();
      const pendingMintRequests = await MintRequest.count({
        where: { status: MINT_REQUEST_STATUS.PENDING },
      });
      const confirmedMintRequests = await MintRequest.count({
        where: { status: MINT_REQUEST_STATUS.CONFIRMED },
      });

      // Burn requests
      const totalBurnRequests = await BurnRequest.count();
      const pendingBurnRequests = await BurnRequest.count({
        where: { status: BURN_REQUEST_STATUS.PENDING },
      });
      const confirmedBurnRequests = await BurnRequest.count({
        where: { status: BURN_REQUEST_STATUS.CONFIRMED },
      });

      // Expired requests needing attention
      const now = new Date();
      const expiredMintRequests = await MintRequest.count({
        where: {
          status: MINT_REQUEST_STATUS.PENDING,
          expires_at: { [Op.lt]: now },
        },
      });
      const expiredBurnRequests = await BurnRequest.count({
        where: {
          status: BURN_REQUEST_STATUS.PENDING,
          expires_at: { [Op.lt]: now },
        },
      });

      res.status(200).json({
        success: true,
        data: {
          mint_requests: {
            total: totalMintRequests,
            pending: pendingMintRequests,
            confirmed: confirmedMintRequests,
            expired: expiredMintRequests,
          },
          burn_requests: {
            total: totalBurnRequests,
            pending: pendingBurnRequests,
            confirmed: confirmedBurnRequests,
            expired: expiredBurnRequests,
          },
        },
      });
    } catch (error) {
      console.error("Get request stats error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List mint requests
   * GET /api/v1/admin/operations/requests/mint
   * Query: { status?, agent_id?, user_id?, expired?, limit?, offset? }
   */
  listMintRequests: async (req, res) => {
    try {
      const {
        status,
        agent_id,
        user_id,
        expired,
        limit = 50,
        offset = 0,
      } = req.query;

      const where = {};

      if (status) where.status = status;
      if (agent_id) where.agent_id = agent_id;
      if (user_id) where.user_id = user_id;

      if (expired === "true") {
        where.expires_at = { [Op.lt]: new Date() };
        where.status = MINT_REQUEST_STATUS.PENDING;
      }

      const requests = await MintRequest.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "tier", "rating"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: requests.rows,
        pagination: {
          total: requests.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < requests.count,
        },
      });
    } catch (error) {
      console.error("List mint requests error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * List burn requests
   * GET /api/v1/admin/operations/requests/burn
   * Query: { status?, agent_id?, user_id?, expired?, limit?, offset? }
   */
  listBurnRequests: async (req, res) => {
    try {
      const {
        status,
        agent_id,
        user_id,
        expired,
        limit = 50,
        offset = 0,
      } = req.query;

      const where = {};

      if (status) where.status = status;
      if (agent_id) where.agent_id = agent_id;
      if (user_id) where.user_id = user_id;

      if (expired === "true") {
        where.expires_at = { [Op.lt]: new Date() };
        where.status = BURN_REQUEST_STATUS.PENDING;
      }

      const requests = await BurnRequest.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "tier", "rating"],
          },
          {
            model: Escrow,
            as: "escrow",
            attributes: ["id", "status", "amount"],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["created_at", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: requests.rows,
        pagination: {
          total: requests.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < requests.count,
        },
      });
    } catch (error) {
      console.error("List burn requests error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Cancel mint request (admin)
   * POST /api/v1/admin/operations/requests/mint/:id/cancel
   * Body: { reason: string }
   */
  cancelMintRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Cancellation reason is required",
        });
      }

      const request = await MintRequest.findByPk(id);

      if (!request) {
        return res
          .status(404)
          .json({ success: false, error: "Mint request not found" });
      }

      if (request.status === MINT_REQUEST_STATUS.CONFIRMED) {
        return res.status(400).json({
          success: false,
          error: "Cannot cancel confirmed request",
        });
      }

      request.status = "cancelled";
      await request.save();

      res.status(200).json({
        success: true,
        message: "Mint request cancelled successfully",
        data: { request_id: request.id, reason },
      });
    } catch (error) {
      console.error("Cancel mint request error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Cancel burn request (admin) - requires refunding escrow
   * POST /api/v1/admin/operations/requests/burn/:id/cancel
   * Body: { reason: string }
   */
  cancelBurnRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "Cancellation reason is required",
        });
      }

      const request = await BurnRequest.findByPk(id);

      if (!request) {
        return res
          .status(404)
          .json({ success: false, error: "Burn request not found" });
      }

      if (request.status === BURN_REQUEST_STATUS.CONFIRMED) {
        return res.status(400).json({
          success: false,
          error: "Cannot cancel confirmed request",
        });
      }

      // Refund escrow if exists
      if (request.escrow_id) {
        await escrowService.refundEscrow(request.escrow_id, {
          admin_cancelled: true,
          admin_id: req.user.id,
          reason,
        });
      }

      request.status = "cancelled";
      await request.save();

      res.status(200).json({
        success: true,
        message: "Burn request cancelled and escrow refunded",
        data: { request_id: request.id, reason },
      });
    } catch (error) {
      console.error("Cancel burn request error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = adminOperationsController;
