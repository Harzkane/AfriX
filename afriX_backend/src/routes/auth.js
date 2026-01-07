// File: /Users/harz/AfriExchange/afriX_backend/src/routes/auth.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");


/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user profile
 * @access  Public
*/
router.post("/register", validateRegistration, authController.register);

/**
 * @route   POST /api/v1/auth/register-admin
 * @desc    Register admin user (protected by secret)
 * @access  Public (but requires secret)
 */
router.post("/register-admin", validateRegistration, authController.registerAdmin);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", validateLogin, authController.login);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post("/verify-email", authController.verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
router.post("/resend-verification", authController.resendVerification);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post("/reset-password", authController.resetPassword);

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
 * @desc    Validate 2FA during login
 * @access  Public (with temp token)
 */
router.post("/2fa/validate", authController.validate2FA);

module.exports = router;
