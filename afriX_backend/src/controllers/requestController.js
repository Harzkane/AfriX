// src/controllers/requestController.js
const { MintRequest, BurnRequest, Agent, Dispute, Transaction, User, sequelize } = require("../models");
const escrowService = require("../services/escrowService");
const transactionService = require("../services/transactionService");
const { deliver } = require("../services/notificationService");
const { uploadToR2 } = require("../services/r2Service");
const { ApiError } = require("../utils/errors");
const educationService = require("../services/educationService");
const { generateQR } = require("../utils/qrcode");
const {
  MINT_REQUEST_STATUS,
  BURN_REQUEST_STATUS,
  DISPUTE_STATUS,
  AGENT_CONFIG,
  EXCHANGE_RATES,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} = require("../config/constants");

function tokenAmountToUsdt(amount, tokenType) {
  const rate =
    tokenType === "NT"
      ? EXCHANGE_RATES.NT_TO_USDT
      : tokenType === "CT"
        ? EXCHANGE_RATES.CT_TO_USDT
        : 1;
  return parseFloat(amount) * (rate || 0);
}

const THIRTY_MINUTES = 30 * 60 * 1000;
// After proof is submitted, give agent time to approve (e.g. 24h) so user doesn't see "Request Expired" while waiting
const PROOF_SUBMITTED_EXPIRY_MS = 24 * 60 * 60 * 1000;

const requestController = {
  // === LIST REQUESTS (for agents) ===
  async getAgentRequests(req, res, next) {
    try {
      const userId = req.user.id;

      // Find agent record for this user
      const agent = await Agent.findOne({ where: { user_id: userId } });

      if (!agent) {
        throw new ApiError("Agent not found", 404);
      }

      // Fetch all mint requests for this agent
      const mintRequests = await MintRequest.findAll({
        where: { agent_id: agent.id },
        include: [
          {
            model: require("../models/User"),
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Fetch all burn requests for this agent
      const burnRequests = await BurnRequest.findAll({
        where: { agent_id: agent.id },
        include: [
          {
            model: require("../models/User"),
            as: "user",
            attributes: ["id", "full_name", "email"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Format and combine requests
      const formattedMintRequests = mintRequests.map((r) => ({
        id: r.id,
        type: "mint",
        user_id: r.user_id,
        user: r.user,
        amount: r.amount,
        token_type: r.token_type,
        status: r.status,
        payment_proof_url: r.payment_proof_url,
        created_at: r.created_at,
        expires_at: r.expires_at,
      }));

      const formattedBurnRequests = burnRequests.map((r) => ({
        id: r.id,
        type: "burn",
        user_id: r.user_id,
        user: r.user,
        amount: r.amount,
        token_type: r.token_type,
        status: r.status,
        bank_account: r.user_bank_account,
        fiat_proof_url: r.fiat_proof_url,
        escrow_id: r.escrow_id,
        created_at: r.created_at,
        expires_at: r.expires_at,
      }));

      // Combine and sort by created_at
      const allRequests = [...formattedMintRequests, ...formattedBurnRequests].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      res.json({
        success: true,
        data: allRequests,
      });
    } catch (error) {
      next(error);
    }
  },

  // === LIST REQUESTS (for users) ===
  async getUserRequests(req, res, next) {
    try {
      const userId = req.user.id;
      console.log(`🔍 getUserRequests: UserID=${userId}`);

      // Fetch all mint requests for this user
      const mintRequests = await MintRequest.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "tier", "rating"],
            include: [
              {
                model: require("../models/User"),
                as: "user",
                attributes: ["full_name", "email"],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      console.log(`🔍 getUserRequests: Found ${mintRequests.length} mint requests`);
      mintRequests.forEach(r => console.log(`  - MintID: ${r.id}`));

      // Fetch all burn requests for this user
      const burnRequests = await BurnRequest.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "tier", "rating"],
            include: [
              {
                model: require("../models/User"),
                as: "user",
                attributes: ["full_name"],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      const burnEscrowIds = burnRequests
        .map((request) => request.escrow_id)
        .filter(Boolean);

      const relatedDisputes = burnEscrowIds.length
        ? await Dispute.findAll({
            where: {
              escrow_id: burnEscrowIds,
            },
            order: [["created_at", "DESC"]],
          })
        : [];

      const latestDisputeByEscrowId = new Map();
      relatedDisputes.forEach((dispute) => {
        if (!dispute.escrow_id || latestDisputeByEscrowId.has(dispute.escrow_id)) return;
        latestDisputeByEscrowId.set(dispute.escrow_id, dispute);
      });

      // Format and combine requests
      const formattedMintRequests = mintRequests.map((r) => ({
        id: r.id,
        type: "mint",
        agent_id: r.agent_id,
        agent: r.agent,
        amount: r.amount,
        token_type: r.token_type,
        status: r.status,
        payment_proof_url: r.payment_proof_url,
        created_at: r.created_at,
        expires_at: r.expires_at,
      }));

      const formattedBurnRequests = burnRequests.map((r) => {
        const latestDispute = r.escrow_id
          ? latestDisputeByEscrowId.get(r.escrow_id)
          : null;
        const hasActiveDispute =
          latestDispute &&
          [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.INVESTIGATING].includes(latestDispute.status);

        return {
          id: r.id,
          type: "burn",
          agent_id: r.agent_id,
          agent: r.agent,
          amount: r.amount,
          token_type: r.token_type,
          status: hasActiveDispute ? BURN_REQUEST_STATUS.DISPUTED : r.status,
          bank_account: r.user_bank_account,
          fiat_proof_url: r.fiat_proof_url,
          escrow_id: r.escrow_id,
          latest_dispute: latestDispute || null,
          created_at: r.created_at,
          expires_at: r.expires_at,
        };
      });

      // Fetch payment requests created by this user (COLLECTION transactions they own)
      const paymentRequests = await Transaction.findAll({
        where: {
          to_user_id: userId,
          type: TRANSACTION_TYPES.COLLECTION,
        },
        order: [["created_at", "DESC"]],
      });

      const formattedPaymentRequests = paymentRequests.map((r) => ({
        id: r.id,
        type: "payment_request",
        reference: r.reference,
        amount: r.amount,
        token_type: r.token_type,
        status: r.status,
        description: r.description,
        recipient_email: r.metadata?.customer_email || r.metadata?.recipient_email || null,
        mode: r.metadata?.mode || "p2p",
        created_at: r.created_at,
        expires_at: r.metadata?.expires_at || null,
      }));

      // Combine and sort by created_at
      const allRequests = [...formattedMintRequests, ...formattedBurnRequests, ...formattedPaymentRequests].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      res.json({
        success: true,
        data: allRequests,
      });
    } catch (error) {
      next(error);
    }
  },

  async createPaymentRequest(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        amount,
        token_type,
        description,
        reference,
        customer_email,
        recipient_email,
        expiration_days,
        privacy,
        mode,
        metadata = {},
      } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        throw new ApiError("Valid amount is required", 400);
      }

      if (!token_type) {
        throw new ApiError("token_type is required", 400);
      }

      const paymentReference =
        reference ||
        `RQST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      let transaction = await Transaction.findOne({
        where: {
          reference: paymentReference,
          type: TRANSACTION_TYPES.COLLECTION,
        },
      });

      const requestMetadata = {
        customer_email: customer_email || null,
        recipient_email: recipient_email || null,
        expiration_days: expiration_days || null,
        privacy: privacy || null,
        mode: mode || "p2p",
        ...metadata,
      };

      if (transaction) {
        if (transaction.status !== TRANSACTION_STATUS.PENDING) {
          throw new ApiError(
            "A completed or cancelled payment already exists for this reference",
            400
          );
        }

        transaction.amount = amount;
        transaction.token_type = token_type;
        transaction.description =
          description || `Payment request for ${req.user.email}`;
        transaction.metadata = {
          ...(transaction.metadata || {}),
          ...requestMetadata,
        };
        await transaction.save();
      } else {
        transaction = await Transaction.create({
          from_user_id: null,
          to_user_id: userId,
          merchant_id: null,
          amount,
          token_type,
          type: TRANSACTION_TYPES.COLLECTION,
          status: TRANSACTION_STATUS.PENDING,
          description: description || `Payment request for ${req.user.email}`,
          reference: paymentReference,
          metadata: requestMetadata,
        });
      }

      const paymentData = {
        transaction_id: transaction.id,
        reference: paymentReference,
        amount: String(amount),
        currency: token_type,
        token_type,
      };

      const qrCode = await generateQR(JSON.stringify(paymentData));
      const webBaseUrl = (process.env.AFRIX_WEB_URL || "https://afritoken.com").replace(/\/$/, "");

      res.status(201).json({
        success: true,
        data: {
          transaction_id: transaction.id,
          reference: paymentReference,
          payment_url: `${webBaseUrl}/pay/${paymentReference}`,
          qr_code: qrCode,
          amount,
          currency: token_type,
          token_type,
          status: transaction.status,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getPaymentRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const cleanId = id.replace(/^RQST-/i, "");
      const { Op } = require("sequelize");

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      const orConditions = [{ reference: id }, { reference: cleanId }];
      if (isUuid) {
        orConditions.push({ id: cleanId });
      }

      const transaction = await Transaction.findOne({
        where: {
          type: TRANSACTION_TYPES.COLLECTION,
          [Op.or]: orConditions,
        },
        include: [
          { model: User, as: "toUser", attributes: ["id", "email", "full_name"] },
        ],
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: { message: "Payment request not found" },
        });
      }

      return res.json({
        success: true,
        data: {
          id: transaction.id,
          reference: transaction.reference,
          status: transaction.status,
          amount: transaction.amount,
          token_type: transaction.token_type,
          description: transaction.description,
          to_user: transaction.toUser
            ? { email: transaction.toUser.email, name: transaction.toUser.full_name }
            : null,
          created_at: transaction.created_at,
          paid_at: transaction.status === TRANSACTION_STATUS.COMPLETED ? transaction.updated_at : null,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // === MINT FLOW ===
  async createMintRequest(req, res, next) {
    try {
      const { agent_id, amount, token_type } = req.body;
      const userId = req.user.id;

      // ENFORCE DAILY TRANSACTION LIMITS
      const userService = require("../services/userService");
      await userService.checkTransactionLimits(userId, amount, token_type);

      // ENFORCE EDUCATION
      await educationService.enforceEducation(userId, "mint");

      // Check if user is trying to mint to themselves (if they are an agent)
      const agent = await Agent.findByPk(agent_id);
      if (!agent) {
        throw new ApiError("Agent not found", 404);
      }

      if (agent.user_id === userId) {
        throw new ApiError(
          "Agents cannot create mint requests to themselves. Please select a different agent.",
          400
        );
      }

      // ✅ GAP 3 FIX: Enforce per-transaction limit set by the agent's deposit tier.
      // Prevents users from submitting amounts that exceed what the agent can
      // realistically back with their security deposit for dispute recovery.
      // IMPORTANT: max_transaction_limit is stored in USDT, so we must convert
      // the raw token amount to its USDT equivalent before comparing.
      const amountUsdtMint = tokenAmountToUsdt(amount, token_type);
      if (
        agent.max_transaction_limit != null &&
        amountUsdtMint > parseFloat(agent.max_transaction_limit)
      ) {
        throw new ApiError(
          `Amount exceeds this agent's transaction limit of $${parseFloat(agent.max_transaction_limit).toFixed(2)} USDT equivalent`,
          400
        );
      }

      const expires_at = new Date(Date.now() + THIRTY_MINUTES);

      const request = await MintRequest.create({
        user_id: userId,
        agent_id,
        amount,
        token_type,
        expires_at,
      });

      res.status(201).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  async uploadMintProof(req, res, next) {
    try {
      const { request_id } = req.params;
      const file = req.file;
      if (!file) throw new ApiError("Proof image required", 400);

      const request = await MintRequest.findByPk(request_id);
      if (!request || request.user_id !== req.user.id)
        throw new ApiError("Request not found", 404);
      if (request.status !== MINT_REQUEST_STATUS.PENDING)
        throw new ApiError("Request already processed", 400);

      const url = await uploadToR2(
        file.buffer,
        file.originalname,
        "mint-proofs"
      );
      request.payment_proof_url = url;
      request.status = MINT_REQUEST_STATUS.PROOF_SUBMITTED;
      // Extend expiry so user doesn't see "Request Expired" while waiting for agent approval
      request.expires_at = new Date(Date.now() + PROOF_SUBMITTED_EXPIRY_MS);
      await request.save();

      const agent = await Agent.findByPk(request.agent_id);
      if (agent) {
        await deliver(agent.user_id, "NEW_MINT_REQUEST", {
          title: "New Mint Request",
          message: `User uploaded payment proof for ${Number(request.amount).toFixed(2)} ${request.token_type}`,
          data: { requestId: request.id, amount: request.amount, token_type: request.token_type },
        });
      } else {
        console.warn(`⚠️ Agent ${request.agent_id} not found for notification`);
      }

      res.json({ success: true, data: request });
    } catch (error) {
      console.error(`❌ Error in uploadMintProof:`, error);
      next(error);
    }
  },

  async getMintRequest(req, res, next) {
    try {
      const { request_id } = req.params;
      const userId = req.user.id;

      console.log(`🔍 getMintRequest: ID=${request_id} (len=${request_id.length}), User=${userId}`);

      // DEBUG: List Check (Replicate getUserRequests logic)
      const allUserMints = await MintRequest.findAll({ where: { user_id: userId } });
      const foundInList = allUserMints.find(r => r.id === request_id);
      console.log(`🔍 getMintRequest (List Check): Found in list? ${!!foundInList}`);
      if (foundInList) {
        console.log(`🔍 getMintRequest (List Check): Item details:`, JSON.stringify(foundInList));
      } else {
        console.log(`🔍 getMintRequest (List Check): Available IDs:`, allUserMints.map(r => r.id));
      }

      // DEBUG: Fetch without include
      const debugRequest = await MintRequest.findByPk(request_id);
      console.log(`🔍 getMintRequest (RAW): Found? ${!!debugRequest}`);
      if (debugRequest) {
        console.log(`🔍 getMintRequest (RAW): AgentID=${debugRequest.agent_id}`);
      }

      const request = await MintRequest.findByPk(request_id, {
        include: [
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "user_id", "tier", "rating", "phone_number"],
            include: [
              {
                model: require("../models/User"),
                as: "user",
                attributes: ["full_name", "email"],
              },
            ],
          },
        ],
      });

      console.log(`🔍 getMintRequest: Found? ${!!request}`);

      if (!request) {
        throw new ApiError("Mint request not found", 404);
      }

      // Verify user owns this request or is the agent
      const isOwner = request.user_id === userId;
      const isAgent = request.agent && request.agent.user_id === userId;

      if (!isOwner && !isAgent) {
        throw new ApiError("Access denied", 403);
      }

      const latestDispute = await Dispute.findOne({
        where: { mint_request_id: request.id },
        attributes: [
          "id",
          "status",
          "escalation_level",
          "reason",
          "details",
          "created_at",
          "updated_at",
          "resolution",
        ],
        order: [["created_at", "DESC"]],
      });

      res.json({
        success: true,
        data: {
          ...request.toJSON(),
          latest_dispute: latestDispute ? latestDispute.toJSON() : null,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async confirmMint(req, res, next) {
    try {
      const { request_id, bank_reference } = req.body;

      if (!request_id) {
        throw new ApiError("request_id is required", 400);
      }

      // Find the mint request
      const mintRequest = await MintRequest.findByPk(request_id);
      if (!mintRequest) {
        throw new ApiError("Mint request not found", 404);
      }

      // Validate status
      if (mintRequest.status !== MINT_REQUEST_STATUS.PROOF_SUBMITTED) {
        throw new ApiError(
          "Request must be in proof_submitted status to confirm",
          400
        );
      }

      // Check if request has expired
      if (new Date() > new Date(mintRequest.expires_at)) {
        mintRequest.status = MINT_REQUEST_STATUS.EXPIRED;
        await mintRequest.save();
        throw new ApiError("Mint request has expired", 400);
      }

      // ✅ USE processAgentMint instead of recordMint
      const result = await transactionService.processAgentMint(
        mintRequest.user_id,
        mintRequest.agent_id,
        parseFloat(mintRequest.amount),
        mintRequest.token_type,
        {
          request_id: mintRequest.id,
          bank_reference: bank_reference || null,
          description: `Minted ${mintRequest.amount} ${mintRequest.token_type} via mint request`,
        }
      );

      // Update mint request status
      mintRequest.status = MINT_REQUEST_STATUS.CONFIRMED;
      mintRequest.confirmed_at = new Date();
      mintRequest.bank_reference = bank_reference || null;
      await mintRequest.save();

      await deliver(mintRequest.user_id, "TOKENS_MINTED", {
        title: "Tokens Minted!",
        message: `Your ${Number(mintRequest.amount).toFixed(2)} ${mintRequest.token_type} tokens have been minted`,
        data: { requestId: mintRequest.id, transactionId: result?.id, amount: mintRequest.amount, token_type: mintRequest.token_type },
      });

      res.json({
        success: true,
        message: "Mint request confirmed and tokens minted",
        data: {
          request: mintRequest,
          transaction: result,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // === REJECT MINT ===
  async rejectMint(req, res, next) {
    try {
      const { request_id, reason } = req.body;

      if (!request_id) {
        throw new ApiError("request_id is required", 400);
      }
      if (!reason) {
        throw new ApiError("Rejection reason is required", 400);
      }

      const mintRequest = await MintRequest.findByPk(request_id);
      if (!mintRequest) {
        throw new ApiError("Mint request not found", 404);
      }

      // Validate status
      if (
        mintRequest.status !== MINT_REQUEST_STATUS.PROOF_SUBMITTED &&
        mintRequest.status !== MINT_REQUEST_STATUS.PENDING
      ) {
        throw new ApiError(
          "Request must be in pending or proof_submitted status to reject",
          400
        );
      }

      // Verify ownership (Agent)
      const agent = await Agent.findOne({ where: { user_id: req.user.id } });
      if (!agent || agent.id !== mintRequest.agent_id) {
        throw new ApiError("Access denied", 403);
      }

      // Update status
      mintRequest.status = MINT_REQUEST_STATUS.REJECTED;
      mintRequest.rejection_reason = reason;
      await mintRequest.save();

      await deliver(mintRequest.user_id, "MINT_REJECTED", {
        title: "Mint Request Rejected",
        message: `Your mint request for ${Number(mintRequest.amount).toFixed(2)} ${mintRequest.token_type} was rejected. Reason: ${reason}`,
        data: { requestId: mintRequest.id, reason },
      });

      res.json({
        success: true,
        message: "Mint request rejected",
        data: mintRequest,
      });
    } catch (error) {
      next(error);
    }
  },

  // === CANCEL MINT (User) ===
  async cancelMintRequest(req, res, next) {
    try {
      const { request_id } = req.params;
      const userId = req.user.id;

      const mintRequest = await MintRequest.findByPk(request_id);
      if (!mintRequest) {
        throw new ApiError("Mint request not found", 404);
      }

      // Verify ownership (User who created the request)
      if (mintRequest.user_id !== userId) {
        throw new ApiError("Access denied", 403);
      }

      // Only allow cancellation if status is PENDING
      if (mintRequest.status !== MINT_REQUEST_STATUS.PENDING) {
        throw new ApiError(
          "Can only cancel requests in pending status (before proof upload)",
          400
        );
      }

      // Delete the request
      await mintRequest.destroy();

      res.json({
        success: true,
        message: "Mint request cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  // === BURN FLOW ===
  async createBurnRequest(req, res, next) {
    try {
      const { agent_id, amount, token_type, bank_account } = req.body;
      const userId = req.user.id;

      // ENFORCE DAILY TRANSACTION LIMITS
      const userService = require("../services/userService");
      await userService.checkTransactionLimits(userId, amount, token_type);

      // ENFORCE EDUCATION
      await educationService.enforceEducation(userId, "burn");

      // Check if user is trying to burn to themselves (if they are an agent)
      const agent = await Agent.findByPk(agent_id);
      if (!agent) {
        throw new ApiError("Agent not found", 404);
      }

      if (agent.user_id === userId) {
        throw new ApiError(
          "Agents cannot create burn requests to themselves. Please select a different agent.",
          400
        );
      }

      // ✅ GAP 3 FIX: Enforce per-transaction limit for burns.
      // Burns don't require capacity (agents are receiving tokens, not issuing them),
      // but we still cap by max_transaction_limit so a single agent can't be hit
      // with a burn that dwarfs their deposit_usd (making dispute penalties meaningless).
      // Note: NO capacity check here — burns are how agents recover capacity.
      // IMPORTANT: max_transaction_limit is stored in USDT, so we must convert
      // the raw token amount to its USDT equivalent before comparing.
      const amountUsdtBurn = tokenAmountToUsdt(amount, token_type);
      if (
        agent.max_transaction_limit != null &&
        amountUsdtBurn > parseFloat(agent.max_transaction_limit)
      ) {
        throw new ApiError(
          `Amount exceeds this agent's transaction limit of $${parseFloat(agent.max_transaction_limit).toFixed(2)} USDT equivalent`,
          400
        );
      }

      const expires_at = new Date(Date.now() + THIRTY_MINUTES);

      const { escrow, tx } = await escrowService.lockForBurn(
        userId,
        agent_id,
        token_type,
        amount,
        { bank_account }
      );

      const request = await BurnRequest.create({
        user_id: userId,
        agent_id,
        amount,
        token_type,
        user_bank_account: bank_account,
        escrow_id: escrow.id,
        status: BURN_REQUEST_STATUS.ESCROWED,
        expires_at,
      });

      // Update transaction metadata with request_id for frontend navigation
      if (tx) {
        tx.metadata = { ...(tx.metadata || {}), request_id: request.id };
        await tx.save();
      }

      const agentForNotif = await Agent.findByPk(request.agent_id, { attributes: ["user_id"] });
      if (agentForNotif) {
        await deliver(agentForNotif.user_id, "NEW_BURN_REQUEST", {
          title: "New Burn Request",
          message: `New burn request for ${Number(request.amount).toFixed(2)} ${request.token_type}`,
          data: { requestId: request.id, amount: request.amount, token_type: request.token_type },
        });
      }

      res.status(201).json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  // === REJECT BURN ===
  async rejectBurn(req, res, next) {
    try {
      const { request_id, reason } = req.body;

      if (!request_id) {
        throw new ApiError("request_id is required", 400);
      }
      if (!reason) {
        throw new ApiError("Rejection reason is required", 400);
      }

      const burnRequest = await BurnRequest.findByPk(request_id);
      if (!burnRequest) {
        throw new ApiError("Burn request not found", 404);
      }

      // Validate status (must be ESCROWED or PENDING if not yet locked)
      // Actually, if it's PENDING, no escrow yet? 
      // createBurnRequest creates it as ESCROWED immediately.
      if (burnRequest.status !== BURN_REQUEST_STATUS.ESCROWED) {
        throw new ApiError(
          "Request must be in escrowed status to reject",
          400
        );
      }

      // Verify ownership (Agent)
      const agent = await Agent.findOne({ where: { user_id: req.user.id } });
      if (!agent || agent.id !== burnRequest.agent_id) {
        throw new ApiError("Access denied", 403);
      }

      // Refund Escrow
      if (burnRequest.escrow_id) {
        await escrowService.refundEscrow(burnRequest.escrow_id, {
          reason: `Agent rejected: ${reason}`,
          rejected_by: req.user.id
        });
      }

      // Update status
      burnRequest.status = BURN_REQUEST_STATUS.REJECTED;
      burnRequest.rejection_reason = reason;
      await burnRequest.save();

      await deliver(burnRequest.user_id, "BURN_REJECTED", {
        title: "Burn Request Rejected",
        message: `Your burn request for ${Number(burnRequest.amount).toFixed(2)} ${burnRequest.token_type} was rejected and tokens refunded. Reason: ${reason}`,
        data: { requestId: burnRequest.id, reason },
      });

      res.json({
        success: true,
        message: "Burn request rejected and tokens refunded",
        data: burnRequest,
      });
    } catch (error) {
      next(error);
    }
  },

  async confirmFiatSent(req, res, next) {
    try {
      // Multer parses form-data → req.body is now available
      const request_id = req.params.request_id; // ← FROM URL
      const { bank_reference } = req.body; // ← FROM form-data
      const file = req.file; // ← FROM upload

      if (!file) throw new ApiError("Proof image required", 400);

      const request = await BurnRequest.findByPk(request_id, {
        include: [{ model: Agent, as: "agent", attributes: ["user_id"] }],
      });

      if (!request || !request.agent || request.agent.user_id !== req.user.id)
        throw new ApiError("Invalid request", 400);
      if (request.status !== BURN_REQUEST_STATUS.ESCROWED)
        throw new ApiError("Request not in escrowed state", 400);

      const isExpired = request.expires_at && new Date(request.expires_at) < new Date();
      if (isExpired) {
        throw new ApiError("Burn request has expired", 400);
      }

      const url = await uploadToR2(
        file.buffer,
        file.originalname,
        "burn-proofs"
      );

      request.fiat_proof_url = url;
      request.agent_bank_reference = bank_reference;
      request.status = BURN_REQUEST_STATUS.FIAT_SENT;
      // Reset 30 min timer: User now has 30 mins from THIS moment to confirm receipt
      request.expires_at = new Date(Date.now() + THIRTY_MINUTES);
      await request.save();

      await deliver(request.user_id, "FIAT_SENT", {
        title: "Fiat Sent!",
        message: "Agent sent fiat. Confirm receipt within 30 mins.",
        data: { requestId: request.id },
      });

      res.json({ success: true, data: request });
    } catch (error) {
      next(error);
    }
  },

  async getBurnRequest(req, res, next) {
    try {
      const { request_id } = req.params;
      const userId = req.user.id;

      let request = await BurnRequest.findByPk(request_id, {
        include: [
          {
            model: Agent,
            as: "agent",
            attributes: ["id", "user_id", "tier", "rating", "phone_number"],
            include: [
              {
                model: require("../models/User"),
                as: "user",
                attributes: ["full_name", "email"],
              },
            ],
          },
        ],
      });

      // Fallback: If not found by ID, try finding via Escrow -> Transaction ID
      // This handles old transactions where metadata.request_id is missing
      if (!request) {
        const Escrow = require("../models/Escrow");
        const escrow = await Escrow.findOne({
          where: { transaction_id: request_id },
        });

        if (escrow) {
          request = await BurnRequest.findOne({
            where: { escrow_id: escrow.id },
            include: [
              {
                model: Agent,
                as: "agent",
                attributes: ["id", "user_id", "tier", "rating", "phone_number"],
                include: [
                  {
                    model: require("../models/User"),
                    as: "user",
                    attributes: ["full_name", "email"],
                  },
                ],
              },
            ],
          });
        }
      }

      if (!request) {
        throw new ApiError("Burn request not found", 404);
      }

      // Verify user owns this request or is the agent
      const isOwner = request.user_id === userId;
      const isAgent = request.agent && request.agent.user_id === userId;

      if (!isOwner && !isAgent) {
        throw new ApiError("Access denied", 403);
      }

      const latestDispute = request.escrow_id
        ? await Dispute.findOne({
            where: { escrow_id: request.escrow_id },
            order: [["created_at", "DESC"]],
          })
        : null;

      const hasActiveDispute =
        latestDispute &&
        [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.INVESTIGATING].includes(latestDispute.status);

      const requestJson = request.toJSON();
      if (hasActiveDispute) {
        requestJson.status = BURN_REQUEST_STATUS.DISPUTED;
      }
      requestJson.latest_dispute = latestDispute ? latestDispute.toJSON() : null;

      res.json({
        success: true,
        data: requestJson,
      });
    } catch (error) {
      next(error);
    }
  },

  async confirmBurn(req, res, next) {
    try {
      const { request_id } = req.body;
      const userId = req.user.id;

      const request = await BurnRequest.findByPk(request_id);
      if (!request || request.user_id !== userId)
        throw new ApiError("Invalid request", 400);
      if (request.status !== BURN_REQUEST_STATUS.FIAT_SENT)
        throw new ApiError("Agent has not sent fiat", 400);

      const result = await sequelize.transaction(async (t) => {
        // ✅ USE escrowService.finalizeBurn to avoid double-deduction
        // Tokens are already in escrow pending_balance, finalizeBurn clears them.
        const finalizeResult = await escrowService.finalizeBurn(
          request.escrow_id,
          {
            request_id: request.id,
            description: `Burned ${request.amount} ${request.token_type} via burn request confirmation`,
          },
          t
        );

        request.status = BURN_REQUEST_STATUS.CONFIRMED;
        await request.save({ transaction: t });

        return finalizeResult;
      });

      const tx = result.tx;

      const agentForBurnNotif = await Agent.findByPk(request.agent_id, {
        attributes: ["user_id"],
      });
      if (agentForBurnNotif) {
        await deliver(agentForBurnNotif.user_id, "BURN_CONFIRMED", {
          title: "Burn Confirmed!",
          message: "User confirmed fiat receipt. Tokens burned.",
          data: { requestId: request.id },
        });
      }

      res.json({ success: true, data: tx });
    } catch (error) {
      next(error);
    }
  },

  // ===== PAYMENT REQUEST (P2P) =====
  // Delegated to merchantController which handles non-merchant P2P payment requests
  createPaymentRequest: (...args) => {
    const merchantController = require("./merchantController");
    return merchantController.createPaymentRequest(...args);
  },

  getPaymentRequestById: (...args) => {
    const merchantController = require("./merchantController");
    return merchantController.getPaymentRequestById(...args);
  },

  // Cancel a pending payment request created by the authenticated user
  async cancelPaymentRequest(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params; // reference like RQST-XXXXXX or transaction UUID

      // Look up by reference string first, then by UUID
      const { Op } = require("sequelize");
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const whereClause = {
        to_user_id: userId,
        type: TRANSACTION_TYPES.COLLECTION,
        status: TRANSACTION_STATUS.PENDING,
        ...(isUUID ? { [Op.or]: [{ id }, { reference: id }] } : { reference: id }),
      };

      const transaction = await Transaction.findOne({ where: whereClause });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Payment request not found or already completed/cancelled",
        });
      }

      transaction.status = TRANSACTION_STATUS.CANCELLED;
      await transaction.save();

      res.json({
        success: true,
        message: "Payment request cancelled successfully",
        data: { reference: transaction.reference, status: TRANSACTION_STATUS.CANCELLED },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = requestController;
