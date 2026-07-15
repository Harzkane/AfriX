// File: /Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/routes/merchants.js

const express = require("express");
const multer = require("multer");
const { rateLimit } = require("express-rate-limit");
const router = express.Router();
const merchantController = require("../controllers/merchantController");
const { authenticate, authenticateMerchantAccess, authorizeAdmin } = require("../middleware/auth");
const {
  validateMerchantRegistration,
  validateMerchantUpdate,
  validatePaymentRequest,
} = require("../middleware/validation");
const merchantVerificationController = require("../controllers/merchantVerificationController");
const { upload } = require("../middleware/upload");

// ---------------------------------------------------------------------------
// Rate Limiters
// All limits are per IP. Return JSON to keep the response format consistent.
// ---------------------------------------------------------------------------

/** General read endpoints: profile, transactions, dashboard, onboarding status */
const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many requests — please slow down and try again." } },
});

/** Write / mutation endpoints: payment requests, profile updates, KYC */
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many requests — please slow down and try again." } },
});

/** Sensitive / destructive endpoints: API key rotation, registration */
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many sensitive requests — please wait before trying again." } },
});


/**
 * Merchant Routes
 * Base path: /api/merchants
 */

/**
 * Merchant Routes
 * Base path: /api/merchants
 */

// Merchant registration — sensitive: 5 req / 15 min
router.post(
  "/register",
  sensitiveLimiter,
  authenticate,
  validateMerchantRegistration,
  merchantController.register
);

// Get merchant profile — read: 60 req / min
router.get("/profile", readLimiter, authenticateMerchantAccess, merchantController.getProfile);

// Update merchant profile — write: 20 req / min
router.put(
  "/profile",
  writeLimiter,
  authenticateMerchantAccess,
  validateMerchantUpdate,
  merchantController.updateProfile
);

// Create payment request — write: 20 req / min
router.post(
  "/payment-request",
  writeLimiter,
  authenticateMerchantAccess,
  validatePaymentRequest,
  merchantController.createPaymentRequest
);

// Get merchant transactions — read: 60 req / min
router.get("/transactions", readLimiter, authenticateMerchantAccess, merchantController.getTransactions);
router.get("/transactions/:id", readLimiter, authenticateMerchantAccess, merchantController.getTransactionById);

// Regenerate API key — sensitive: 5 req / 15 min
router.post(
  "/regenerate-api-key",
  sensitiveLimiter,
  authenticate,
  merchantController.regenerateApiKey
);

// Regenerate webhook secret — sensitive: 5 req / 15 min
router.post(
  "/regenerate-webhook-secret",
  sensitiveLimiter,
  authenticate,
  merchantController.regenerateWebhookSecret
);


// Dashboard summary — read: 60 req / min
router.get("/dashboard", readLimiter, authenticateMerchantAccess, merchantController.getDashboardSummary);

// Submit verification — write: 20 req / min
router.post(
  "/verify",
  writeLimiter,
  authenticate,
  merchantVerificationController.submitVerification
);

// KYC upload — write: 20 req / min
router.post(
  "/kyc/upload",
  writeLimiter,
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

// Get merchant onboarding / integration readiness status — read: 60 req / min
router.get("/onboarding-status", readLimiter, authenticateMerchantAccess, merchantController.getOnboardingStatus);

// Webhook delivery log — read: 60 req / min
router.get("/webhook-delivery-log", readLimiter, authenticateMerchantAccess, merchantController.getWebhookDeliveryLog);

// Sandbox: fire a test webhook delivery — write: 20 req / min
router.post("/sandbox/ping-webhook", writeLimiter, authenticateMerchantAccess, merchantController.sandboxPingWebhook);

// Refund a collection back to the buyer — sensitive: 5 req / 15 min
// Only COMPLETED collections owned by the authenticated merchant can be refunded.
router.post(
  "/collections/:id/refund",
  sensitiveLimiter,
  authenticateMerchantAccess,
  merchantController.refundCollection
);

module.exports = router;
