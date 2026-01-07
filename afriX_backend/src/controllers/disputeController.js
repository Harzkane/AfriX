// File: src/controllers/disputeController.js
const disputeService = require("../services/disputeService");
const { ApiError } = require("../utils/errors");

const disputeController = {
  /**
   * POST /api/disputes
   * Body: { escrowId, transactionId?, reason, details }
   */
  async open(req, res, next) {
    try {
      const { escrowId, transactionId, mintRequestId, reason, details, agentId } = req.body;
      if ((!escrowId && !mintRequestId) || !reason)
        throw new ApiError("escrowId (or mintRequestId) and reason are required", 400);

      const dispute = await disputeService.openDispute({
        escrowId,
        transactionId,
        mintRequestId,
        openedByUserId: req.user.id,
        agentId,
        reason,
        details,
      });

      res.status(201).json({ success: true, data: dispute });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/disputes/:id/resolve
   * Admin only: { action, penalty_amount_usd?, notes }
   */
  async resolve(req, res, next) {
    try {
      const { id } = req.params;
      const { action, penalty_amount_usd, notes } = req.body;
      // NOTE: Ensure admin middleware applied on route
      const result = await disputeService.resolveDispute(id, req.user.id, {
        action,
        penalty_amount_usd,
        notes,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const Dispute = require("../models/Dispute");
      const d = await Dispute.findByPk(req.params.id);
      if (!d) throw new ApiError("Dispute not found", 404);
      res.json({ success: true, data: d });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const Dispute = require("../models/Dispute");
      const disputes = await Dispute.findAll({
        order: [["created_at", "DESC"]],
        limit: 100,
      });
      res.json({ success: true, data: disputes });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = disputeController;
