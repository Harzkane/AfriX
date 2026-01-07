// File: src/controllers/walletController.js
const { Wallet, User } = require("../models");
const walletService = require("../services/walletService");
const { ApiError } = require("../utils/errors");
const { TRANSACTION_TYPES } = require("../config/constants");

/**
 * Wallet Controller
 * Handles wallet-level user operations (list, view, transfer).
 */
const walletController = {
  /**
   * List all wallets for the authenticated user.
   */
  async listMyWallets(req, res, next) {
    try {
      const wallets = await Wallet.findAll({
        where: { user_id: req.user.id },
        order: [["created_at", "DESC"]],
      });

      res.json({
        success: true,
        data: wallets,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a specific wallet by ID (must belong to the user).
   */
  async getWalletById(req, res, next) {
    try {
      const { id } = req.params;
      const wallet = await Wallet.findByPk(id);

      if (!wallet) throw new ApiError("Wallet not found", 404);
      if (wallet.user_id !== req.user.id)
        throw new ApiError("Unauthorized access to wallet", 403);

      res.json({
        success: true,
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Initiate a peer-to-peer token transfer to another user by email.
   */
  async transfer(req, res, next) {
    try {
      const { to_email, amount, token_type, description } = req.body;

      if (!to_email || !amount || !token_type)
        throw new ApiError(
          "to_email, amount, and token_type are required",
          400
        );

      const result = await walletService.transfer({
        fromUserId: req.user.id,
        toUserEmail: to_email,
        amount: parseFloat(amount),
        token_type,
        metadata: { description },
      });

      res.status(201).json({
        success: true,
        message: "Transfer completed successfully",
        data: result.transaction,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Manually credit wallet (admin/internal).
   */
  async credit(req, res, next) {
    try {
      if (req.user.role !== "admin")
        throw new ApiError("Only admin can credit wallets", 403);

      const { user_id, amount, token_type, description } = req.body;
      if (!user_id || !amount || !token_type)
        throw new ApiError("user_id, amount, and token_type are required", 400);

      const result = await walletService.credit({
        userId: user_id,
        amount: parseFloat(amount),
        token_type,
        type: TRANSACTION_TYPES.CREDIT,
        metadata: { description },
      });

      res.status(201).json({
        success: true,
        message: "Wallet credited successfully",
        data: result.transaction,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Manually debit wallet (admin/internal).
   */
  async debit(req, res, next) {
    try {
      if (req.user.role !== "admin")
        throw new ApiError("Only admin can debit wallets", 403);

      const { user_id, amount, token_type, description } = req.body;
      if (!user_id || !amount || !token_type)
        throw new ApiError("user_id, amount, and token_type are required", 400);

      const result = await walletService.debit({
        userId: user_id,
        amount: parseFloat(amount),
        token_type,
        metadata: { description },
      });

      res.status(201).json({
        success: true,
        message: "Wallet debited successfully",
        data: result.transaction,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get exchange rates for token swaps
   */
  async getExchangeRates(req, res, next) {
    try {
      const { from, to } = req.query;
      const { getExchangeRate } = require("../config/constants");

      if (!from || !to) {
        throw new ApiError("from and to query parameters are required", 400);
      }

      const rate = getExchangeRate(from, to);

      res.json({
        success: true,
        data: {
          from,
          to,
          rate,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Swap tokens between different types
   */
  async swap(req, res, next) {
    try {
      const { from_token, to_token, amount } = req.body;

      if (!from_token || !to_token || !amount) {
        throw new ApiError(
          "from_token, to_token, and amount are required",
          400
        );
      }

      if (from_token === to_token) {
        throw new ApiError("Cannot swap same token type", 400);
      }

      const result = await walletService.swap({
        userId: req.user.id,
        fromToken: from_token,
        toToken: to_token,
        amount: parseFloat(amount),
      });

      res.status(201).json({
        success: true,
        message: "Swap completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = walletController;
