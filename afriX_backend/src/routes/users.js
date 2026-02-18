// File: src/routes/users.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

/**
 * User Routes
 * Authenticated access for profile and wallet data.
 */

router.use(authenticate);

// Get current user profile + wallets
router.get("/me", userController.getProfile);

// Update profile details
router.put("/update", userController.updateProfile);
// Alias for mobile (Profile & Notifications screens)
router.put("/profile", userController.updateProfile);

// Find agents by country and currency
router.get("/find-agents", userController.findAgents);

// Get total balances across wallets
router.get("/balances", userController.getBalances);

// Get activity summary (totals, counts)
router.get("/summary", userController.getSummary);

// Get merchant profile (if user is a merchant)
router.get("/merchant", userController.getMerchantProfile);

// Update FCM token for push notifications
router.post("/fcm-token", authenticate, userController.updateFcmToken);

module.exports = router;
