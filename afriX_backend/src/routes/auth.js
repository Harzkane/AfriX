// File: /Users/harz/AfriExchange/afriX_backend/src/routes/auth.js

const express = require("express");
const router = express.Router();
const { rateLimit } = require("express-rate-limit");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

// ─────────────────────────────────────────────
// RATE LIMITERS
// ─────────────────────────────────────────────

/** Strict limiter for login — prevents brute-force / credential stuffing */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 attempts per window per IP
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development",
});

/** General limiter for public auth endpoints (register, verify, forgot password) */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,                    // 20 requests per hour per IP
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development",
});

/** Strict limiter for password reset / 2FA — prevents OTP enumeration */
const sensitiveAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // Only 5 attempts per hour per IP
  message: { success: false, message: "Too many attempts. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development",
});

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user profile
 * @access  Public
 */
router.post("/register", authLimiter, validateRegistration, authController.register);

/**
 * @route   POST /api/v1/auth/register-admin
 * @desc    Register admin user (protected by ADMIN_REGISTRATION_SECRET env var)
 * @access  DISABLED in production — comment back in only to seed the first admin,
 *          then comment out again and redeploy immediately.
 *          Never leave this route open in a live environment.
 */
// router.post("/register-admin", validateRegistration, authController.registerAdmin);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", loginLimiter, validateLogin, authController.login);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post("/verify-email", authLimiter, authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post("/resend-verification", authLimiter, authController.resendVerification);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post("/forgot-password", sensitiveAuthLimiter, authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password", sensitiveAuthLimiter, authController.resetPassword);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (requires current password)
 * @access  Private
 */
router.post("/change-password", authenticate, authController.changePassword);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/2fa/setup
 * @desc    Setup 2FA (Get secret/QR)
 * @access  Private
 */
router.post("/2fa/setup", authenticate, authController.setup2FA);

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify 2FA (Enable)
 * @access  Private
 */
router.post("/2fa/verify", authenticate, authController.verify2FA);

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post("/2fa/disable", authenticate, authController.disable2FA);

/**
 * @route   POST /api/v1/auth/2fa/validate
 * @desc    Validate 2FA during login (uses short-lived temp_token)
 * @access  Public (with temp token)
 */
router.post("/2fa/validate", sensitiveAuthLimiter, authController.validate2FA);

/**
 * @route   POST /api/v1/auth/send-phone-otp
 * @desc    Send OTP to user phone number for Level 2 verification
 * @access  Private
 */
router.post("/send-phone-otp", authenticate, authController.sendPhoneOtp);

/**
 * @route   POST /api/v1/auth/verify-phone-otp
 * @desc    Verify OTP to unlock Level 2 ($500/day limit)
 * @access  Private
 */
router.post("/verify-phone-otp", authenticate, authController.verifyPhoneOtp);

module.exports = router;
