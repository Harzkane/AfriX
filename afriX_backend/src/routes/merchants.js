// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/routes/merchants.js

const express = require("express");
const multer = require("multer");
const router = express.Router();
const merchantController = require("../controllers/merchantController");
const { authenticate, authorizeAdmin } = require("../middleware/auth");
const {
  validateMerchantRegistration,
  validateMerchantUpdate,
  validatePaymentRequest,
} = require("../middleware/validation");
const merchantVerificationController = require("../controllers/merchantVerificationController");
const { upload } = require("../middleware/upload");

/**
 * Merchant Routes
 * Base path: /api/merchants
 */

// Merchant registration
router.post(
  "/register",
  authenticate,
  validateMerchantRegistration,
  merchantController.register
);

// Get merchant profile
router.get("/profile", authenticate, merchantController.getProfile);

// Update merchant profile
router.put(
  "/profile",
  authenticate,
  validateMerchantUpdate,
  merchantController.updateProfile
);

// Create payment request
router.post(
  "/payment-request",
  authenticate,
  validatePaymentRequest,
  merchantController.createPaymentRequest
);

// Get merchant transactions
router.get("/transactions", authenticate, merchantController.getTransactions);

// Regenerate API key
router.post(
  "/regenerate-api-key",
  authenticate,
  merchantController.regenerateApiKey
);

// Dashboard summary
router.get("/dashboard", authenticate, merchantController.getDashboardSummary);

// Submit verification
router.post(
  "/verify",
  authenticate,
  merchantVerificationController.submitVerification
);

router.post(
  "/kyc/upload",
  authenticate,
  upload.fields([
    { name: "business_certificate", maxCount: 1 },
    { name: "id_card", maxCount: 1 },
    { name: "proof_of_address", maxCount: 1 },
  ]),
  merchantController.uploadKyc
);

// Admin approves verification
// router.post(
//   "/:id/approve",
//   authorizeAdmin,
//   merchantVerificationController.approveVerification
// );

module.exports = router;
