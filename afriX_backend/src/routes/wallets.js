// File: src/routes/wallets.js
const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { authenticate } = require("../middleware/auth");

/**
 * Wallet Routes
 * Authenticated user access for wallet operations.
 */

router.use(authenticate);

// List user wallets
router.get("/", walletController.listMyWallets);

// Get exchange rates (MUST be before /:id route)
router.get("/rates", walletController.getExchangeRates);

// Swap tokens
router.post("/swap", walletController.swap);

// Get wallet by ID
router.get("/:id", walletController.getWalletById);

// Transfer tokens to another user
router.post("/transfer", walletController.transfer);

// Admin-only: credit wallet
router.post("/credit", walletController.credit);

// Admin-only: debit wallet
router.post("/debit", walletController.debit);

module.exports = router;
