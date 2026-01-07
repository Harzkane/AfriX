const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { authenticate } = require("../middleware/auth");
const { validateUUID } = require("../middleware/validation");

/**
 * Transaction routes
 * Base: /api/transactions
 */

// Create transaction (admin/internal)
router.post("/", authenticate, transactionController.create);

// Process user-to-user transfer
router.post("/transfer", authenticate, transactionController.userTransfer);

// Process merchant payment
router.post("/pay-merchant", authenticate, transactionController.payMerchant);

// List transactions (paginated) - must come before /:id
router.get("/", authenticate, transactionController.list);

// Get pending review transactions - must come before /:id
router.get("/pending-review", authenticate, transactionController.getPendingReviews);

// Get transaction by id
router.get(
  "/:id",
  authenticate,
  validateUUID("id"),
  transactionController.getById
);

// Verify transaction
router.get(
  "/:id/verify",
  authenticate,
  validateUUID("id"),
  transactionController.verify
);

module.exports = router;
