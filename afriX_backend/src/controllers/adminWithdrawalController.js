// File: src/controllers/adminWithdrawalController.js
const { ethers } = require("ethers"); // ← ADD THIS
const { WITHDRAWAL_STATUS, EXCHANGE_RATES } = require("../config/constants");
const { POLYGON_RPC } = require("../config/treasury"); // ← ADD THIS
const { WithdrawalRequest, Agent } = require("../models");
const { deliver } = require("../services/notificationService");
const { ApiError } = require("../utils/errors");
const { Op } = require("sequelize");

function tokenAmountToUsdt(amount, tokenType) {
  const rate =
    tokenType === "NT"
      ? EXCHANGE_RATES.NT_TO_USDT
      : tokenType === "CT"
        ? EXCHANGE_RATES.CT_TO_USDT
        : 1;
  return parseFloat(amount) * (rate || 0);
}

function getAgentTokenSymbol(currency) {
  if (currency === "NGN") return "NT";
  if (currency === "XOF") return "CT";
  return "USDT";
}

function getOutstandingUsdt(agent) {
  if (!agent) return 0;
  const totalMinted = parseFloat(agent.total_minted) || 0;
  const totalBurned = parseFloat(agent.total_burned) || 0;
  const outstandingTokens = Math.max(0, totalMinted - totalBurned);
  const tokenSymbol = getAgentTokenSymbol(agent.currency);
  return tokenAmountToUsdt(outstandingTokens, tokenSymbol);
}

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
            "currency",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Calculate withdrawable info for each request
    const enrichedRequests = requests.map((req) => {
      const outstanding = getOutstandingUsdt(req.agent);
      const maxWithdraw = Math.max(0, req.agent.deposit_usd - outstanding);

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
    const outstanding = getOutstandingUsdt(request.agent);
    const maxWithdraw = Math.max(0, request.agent.deposit_usd - outstanding);

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

    await deliver(request.agent.user_id, "WITHDRAWAL_APPROVED", {
      title: "Withdrawal Approved",
      message: `$${request.amount_usd} USDT approved. Payment will be sent to ${request.agent.withdrawal_address}`,
      data: { request_id: request.id, amount_usd: request.amount_usd },
    });

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
    let receipt;
    try {
      const provider = new ethers.JsonRpcProvider(POLYGON_RPC);
      receipt = await provider.getTransactionReceipt(tx_hash);
    } catch (err) {
      throw new ApiError(`Blockchain verification failed: ${err.message}`, 400);
    }

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

    // ✅ Sync max_transaction_limit on withdrawal payouts
    agent.max_transaction_limit = agent.deposit_usd;

    await agent.save();

    // Update withdrawal request
    request.status = WITHDRAWAL_STATUS.PAID;
    request.paid_tx_hash = tx_hash;
    request.paid_at = new Date();
    await request.save();

    await deliver(agent.user_id, "WITHDRAWAL_PAID", {
      title: "Withdrawal Paid!",
      message: `$${request.amount_usd} USDT sent to ${agent.withdrawal_address}. Tx: ${tx_hash.substring(0, 10)}...`,
      data: { request_id: request.id, amount_usd: request.amount_usd, tx_hash: tx_hash },
    });

    res.json({ success: true, data: request });
  },

  /**
   * GET SINGLE WITHDRAWAL
   * GET /api/admin/withdrawals/:id
   */
  async getWithdrawal(req, res) {
    const { id } = req.params;

    const request = await WithdrawalRequest.findByPk(id, {
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
            "available_capacity",
            "tier",
            "rating",
            "currency",
          ],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({ success: false, error: "Withdrawal request not found" });
    }

    const agent = request.agent;
    const outstanding = getOutstandingUsdt(agent);
    const maxWithdraw = agent ? Math.max(0, parseFloat(agent.deposit_usd) - outstanding) : 0;

    res.json({
      success: true,
      data: {
        ...request.toJSON(),
        outstanding_tokens: outstanding,
        max_withdrawable: maxWithdraw,
        is_safe: request.amount_usd <= maxWithdraw,
      },
    });
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
          attributes: [
            "id",
            "user_id",
            "withdrawal_address",
            "deposit_usd",
            "total_minted",
            "total_burned",
            "currency",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Enrich with outstanding/max_withdrawable (same shape as listPending)
    const enriched = requests.map((r) => {
      const json = r.toJSON();
      if (json.agent) {
        const outstanding = getOutstandingUsdt(json.agent);
        const maxWithdraw = Math.max(0, json.agent.deposit_usd - outstanding);
        return { ...json, outstanding_tokens: outstanding, max_withdrawable: maxWithdraw, is_safe: json.amount_usd <= maxWithdraw };
      }
      return json;
    });

    res.json({ success: true, data: enriched });
  },
  /**
   * REJECT WITHDRAWAL
   * POST /api/admin/withdrawals/reject
   * Admin rejects withdrawal request
   */
  async reject(req, res) {
    const { request_id, reason } = req.body;

    if (!reason) throw new ApiError("Rejection reason is required", 400);

    const request = await WithdrawalRequest.findByPk(request_id, {
      include: [{ model: Agent, as: "agent" }],
    });

    if (!request || request.status !== WITHDRAWAL_STATUS.PENDING)
      throw new ApiError("Invalid request or not pending", 400);

    request.status = WITHDRAWAL_STATUS.REJECTED;
    request.admin_notes = reason;
    await request.save();

    await deliver(request.agent.user_id, "WITHDRAWAL_REJECTED", {
      title: "Withdrawal Rejected",
      message: `Your withdrawal request for $${request.amount_usd} was rejected. Reason: ${reason}`,
      data: { request_id: request.id, amount_usd: request.amount_usd, reason },
    });

    res.json({ success: true, data: request });
  },

  /**
   * GET WITHDRAWAL STATS
   * GET /api/admin/withdrawals/stats
   */
  async getStats(req, res) {
    const pendingCount = await WithdrawalRequest.count({
      where: { status: WITHDRAWAL_STATUS.PENDING }
    });

    const approvedCount = await WithdrawalRequest.count({
      where: { status: WITHDRAWAL_STATUS.APPROVED }
    });

    const paidCount = await WithdrawalRequest.count({
      where: { status: WITHDRAWAL_STATUS.PAID }
    });

    // Get total paid volume
    const paidRequests = await WithdrawalRequest.findAll({
      where: { status: WITHDRAWAL_STATUS.PAID },
      attributes: ['amount_usd']
    });

    const totalPaidVolume = paidRequests.reduce((sum, req) => sum + parseFloat(req.amount_usd), 0);

    res.json({
      success: true,
      data: {
        pending_count: pendingCount,
        approved_count: approvedCount,
        paid_count: paidCount,
        total_paid_volume: totalPaidVolume
      }
    });
  },
};

module.exports = adminWithdrawalController;
