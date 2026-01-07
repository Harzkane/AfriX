// File: src/controllers/adminWithdrawalController.js
const { ethers } = require("ethers"); // ← ADD THIS
const { WITHDRAWAL_STATUS } = require("../config/constants");
const { POLYGON_RPC } = require("../config/treasury"); // ← ADD THIS
const { WithdrawalRequest, Agent } = require("../models");
const { sendPush } = require("../services/notificationService");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");

const adminWithdrawalController = {
  /**
   * LIST PENDING WITHDRAWALS
   * GET /api/admin/withdrawals/pending
   * Returns all withdrawal requests awaiting approval
   */
  async listPending(req, res) {
    const requests = await WithdrawalRequest.findAll({
      where: { status: WITHDRAWAL_STATUS.PENDING },
      include: [
        {
          model: Agent,
          as: "agent",
          attributes: [
            "id",
            "user_id",
            "withdrawal_address",
            "deposit_usd",
            "total_minted",
            "total_burned",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Calculate withdrawable info for each request
    const enrichedRequests = requests.map((req) => {
      const outstanding = req.agent.total_minted - req.agent.total_burned;
      const maxWithdraw = req.agent.deposit_usd - outstanding;

      return {
        ...req.toJSON(),
        outstanding_tokens: outstanding,
        max_withdrawable: maxWithdraw,
        is_safe: req.amount_usd <= maxWithdraw, // Safety check
      };
    });

    res.json({ success: true, data: enrichedRequests });
  },

  /**
   * APPROVE WITHDRAWAL
   * POST /api/admin/withdrawals/approve
   * Admin approves withdrawal request (ready for payment)
   */
  async approve(req, res) {
    const { request_id } = req.body;
    const request = await WithdrawalRequest.findByPk(request_id, {
      include: [{ model: Agent, as: "agent" }],
    });

    if (!request || request.status !== WITHDRAWAL_STATUS.PENDING)
      throw new ApiError("Invalid request", 400);

    // Double-check withdrawal is safe
    const outstanding = request.agent.total_minted - request.agent.total_burned;
    const maxWithdraw = request.agent.deposit_usd - outstanding;

    if (request.amount_usd > maxWithdraw) {
      throw new ApiError(
        `Cannot approve: Agent has insufficient free deposit. Max: $${maxWithdraw.toFixed(
          2
        )}`,
        400
      );
    }

    request.status = WITHDRAWAL_STATUS.APPROVED;
    await request.save();

    await sendPush(
      request.agent.user_id,
      "Withdrawal Approved",
      `$${request.amount_usd} USDT approved. Payment will be sent to ${request.agent.withdrawal_address}`
    );

    res.json({
      success: true,
      data: request,
      payment_info: {
        send_to: request.agent.withdrawal_address,
        amount_usd: request.amount_usd,
        network: "Polygon",
        token: "USDT",
      },
    });
  },

  /**
   * MARK AS PAID
   * POST /api/admin/withdrawals/paid
   * Admin sends USDT from MetaMask, then records tx_hash
   * This reduces agent's deposit and capacity
   */
  async markPaid(req, res) {
    const { request_id, tx_hash } = req.body;

    if (!tx_hash) throw new ApiError("Transaction hash required", 400);

    const request = await WithdrawalRequest.findByPk(request_id, {
      include: [{ model: Agent, as: "agent" }],
    });

    if (!request || request.status !== WITHDRAWAL_STATUS.APPROVED)
      throw new ApiError("Request not approved", 400);

    // VERIFY WITHDRAWAL TRANSACTION ON BLOCKCHAIN
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    const receipt = await provider.getTransactionReceipt(tx_hash);

    if (!receipt) {
      throw new ApiError("Transaction not found on blockchain", 400);
    }

    if (!receipt.status) {
      throw new ApiError("Transaction failed on blockchain", 400);
    }

    // Optional: Verify transaction sent to correct address
    // You can parse logs here to confirm destination and amount

    const agent = request.agent;

    // Reduce agent's deposit and capacity
    agent.deposit_usd -= parseFloat(request.amount_usd);
    agent.available_capacity -= parseFloat(request.amount_usd);

    // Prevent negative balances (safety check)
    if (agent.deposit_usd < 0) agent.deposit_usd = 0;
    if (agent.available_capacity < 0) agent.available_capacity = 0;

    await agent.save();

    // Update withdrawal request
    request.status = WITHDRAWAL_STATUS.PAID;
    request.paid_tx_hash = tx_hash;
    request.paid_at = new Date();
    await request.save();

    await sendPush(
      agent.user_id,
      "Withdrawal Paid!",
      `$${request.amount_usd} USDT sent to ${
        agent.withdrawal_address
      }. Tx: ${tx_hash.substring(0, 10)}...`
    );

    res.json({ success: true, data: request });
  },

  /**
   * LIST ALL WITHDRAWALS (with filters)
   * GET /api/admin/withdrawals
   * Optional: For admin dashboard analytics
   */
  async listAll(req, res) {
    const { status, agent_id, start_date, end_date } = req.query;
    const where = {};

    if (status) where.status = status;
    if (agent_id) where.agent_id = agent_id;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const requests = await WithdrawalRequest.findAll({
      where,
      include: [
        {
          model: Agent,
          as: "agent",
          attributes: ["id", "user_id", "withdrawal_address"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({ success: true, data: requests });
  },
};

module.exports = adminWithdrawalController;
