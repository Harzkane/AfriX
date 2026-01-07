// File: src/controllers/escrowController.js
const escrowService = require("../services/escrowService");
const { ApiError } = require("../utils/errors");

const escrowController = {
  /**
   * POST /api/escrows/lock
   * Body: { agent_id?, token_type, amount, metadata? }
   * Auth required: user
   */
  async lockForBurn(req, res, next) {
    try {
      const userId = req.user.id;
      const { agent_id, token_type, amount, metadata } = req.body;
      if (!token_type || !amount)
        throw new ApiError("token_type and amount required", 400);

      const { tx, escrow } = await escrowService.lockForBurn(
        userId,
        agent_id || null,
        token_type,
        amount,
        metadata
      );
      res
        .status(201)
        .json({ success: true, data: { transaction: tx, escrow } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/escrows/:id/finalize
   * Agent/admin triggers finalize after fiat sent
   */
  async finalize(req, res, next) {
    try {
      const { id } = req.params;
      const evidence = req.body || {};
      const result = await escrowService.finalizeBurn(id, evidence);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/escrows/:id/refund
   * Admin refunds escrow to user
   */
  async refund(req, res, next) {
    try {
      const { id } = req.params;
      const notes = req.body || {};
      const result = await escrowService.refundEscrow(id, notes);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/escrows/:id
   */
  async get(req, res, next) {
    try {
      const { id } = req.params;
      const Escrow = require("../models/Escrow");
      const e = await Escrow.findByPk(id);
      if (!e) throw new ApiError("Escrow not found", 404);
      res.json({ success: true, data: e });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = escrowController;
