// File: AfriExchange/afriX_backend/src/routes/payments.js

const express = require("express");
const router = express.Router();
const { authenticate, optionalAuth } = require("../middleware/auth");
const {
  validatePaymentRequest,
  validateUUID,
} = require("../middleware/validation");
const paymentController = require("../controllers/paymentController");

/**
 * Payment Routes
 * Base path: /api/payments
 */

// Process a payment to a merchant
router.post(
  "/process",
  authenticate,
  validatePaymentRequest,
  paymentController.processPayment
);

// Get payment details by ID (public endpoint with optional auth)
router.get(
  "/:id",
  optionalAuth,
  validateUUID("id"),
  paymentController.getPaymentDetails
);

// Verify payment status
router.get(
  "/:id/verify",
  authenticate,
  validateUUID("id"),
  paymentController.verifyPayment
);

// Cancel pending payment
router.post(
  "/:id/cancel",
  authenticate,
  validateUUID("id"),
  paymentController.cancelPayment
);

module.exports = router;
