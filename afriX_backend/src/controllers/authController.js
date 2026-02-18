// File: /Users/harz/AfriExchange/afriX_backend/src/controllers/authController.js

const crypto = require("crypto");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const { generateToken, generateRefreshToken } = require("../utils/jwt");
const { sendVerificationEmail } = require("../services/emailService");
const {
  HTTP_STATUS,
  RESPONSE_MESSAGES,
  REGEX_PATTERNS,
} = require("../config/constants");
// const { redis, REDIS_ENABLED } = require("../config/redis");
const { setCache, getCache, deleteCache } = require("../utils/cache");
const { sequelize } = require("../config/database");
const walletService = require("../services/walletService");
const { TOKEN_TYPES } = require("../config/constants");

// Cache helpers that work with or without Redis
// const setCache = async (key, value, ttl) => {
//   if (!REDIS_ENABLED || !redis) return;
//   try {
//     await redis.setex(key, ttl, JSON.stringify(value));
//   } catch (error) {
//     console.error("Cache set error:", error);
//   }
// };

// const getCache = async (key) => {
//   if (!REDIS_ENABLED || !redis) return null;
//   try {
//     const data = await redis.get(key);
//     return data ? JSON.parse(data) : null;
//   } catch (error) {
//     console.error("Cache get error:", error);
//     return null;
//   }
// };

// const deleteCache = async (key) => {
//   if (!REDIS_ENABLED || !redis) return;
//   try {
//     await redis.del(key);
//   } catch (error) {
//     console.error("Cache delete error:", error);
//   }
// };

/**
 * Register admin user (should be protected in production)
 * POST /api/v1/auth/register-admin
 */
const registerAdmin = async (req, res) => {
  try {
    const { email, password, full_name, country_code, language, admin_secret } =
      req.body;

    // Validate admin secret (set this in your .env file)
    const ADMIN_REGISTRATION_SECRET =
      process.env.ADMIN_REGISTRATION_SECRET || "your-super-secret-key";

    if (admin_secret !== ADMIN_REGISTRATION_SECRET) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Invalid admin registration secret",
      });
    }

    // Validate input
    if (!email || !password || !full_name || !country_code) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email, password, name, and country are required",
      });
    }

    // Validate email format
    if (!REGEX_PATTERNS.EMAIL.test(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password strength
    if (!REGEX_PATTERNS.PASSWORD.test(password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "A profile with this email already exists",
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Generate referral code
    const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Create ADMIN user profile
    const result = await sequelize.transaction(async (t) => {
      const user = await User.create({
        email: email.toLowerCase(),
        password_hash: password,
        full_name,
        country_code: country_code.toUpperCase(),
        language: language || (country_code === "NG" ? "en" : "fr"),
        role: "admin", // ⭐ THIS IS THE KEY DIFFERENCE
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires,
        referral_code: referralCode,
        email_verified: true, // Auto-verify admin
      }, { transaction: t });

      // Create Wallets for Admin
      for (const tokenType of Object.values(TOKEN_TYPES)) {
        await walletService.getOrCreateWallet(user.id, tokenType, t);
      }

      return user;
    });

    const user = result;

    // Send verification email (optional for admin)
    try {
      await sendVerificationEmail(
        user.email,
        user.full_name,
        verificationToken
      );
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
    }

    // Generate JWT tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Admin profile created successfully",
      data: {
        user: user.toSafeObject(),
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: "24h",
        },
      },
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create admin profile. Please try again.",
    });
  }
};

/**
 * Register new user profile
 * POST /api/v1/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, full_name, country_code, language } = req.body;

    // Validate input
    if (!email || !password || !full_name || !country_code) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email, password, name, and country are required",
      });
    }

    // Validate email format
    if (!REGEX_PATTERNS.EMAIL.test(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate password strength
    if (!REGEX_PATTERNS.PASSWORD.test(password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "A profile with this email already exists",
      });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate referral code
    const referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Create user profile (NOT "account")
    const result = await sequelize.transaction(async (t) => {
      const user = await User.create({
        email: email.toLowerCase(),
        password_hash: password, // Will be hashed by beforeCreate hook
        full_name,
        country_code: country_code.toUpperCase(),
        language: language || (country_code === "NG" ? "en" : "fr"),
        email_verification_token: verificationToken,
        email_verification_expires: verificationExpires,
        referral_code: referralCode,
      }, { transaction: t });

      // Create Wallets for User
      for (const tokenType of Object.values(TOKEN_TYPES)) {
        await walletService.getOrCreateWallet(user.id, tokenType, t);
      }

      return user;
    });

    const user = result;

    // Send verification email
    try {
      await sendVerificationEmail(
        user.email,
        user.full_name,
        verificationToken
      );
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Don't fail registration if email fails
    }

    // Generate JWT tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Return success response
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.PROFILE_CREATED,
      data: {
        user: user.toSafeObject(),
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: "24h",
        },
      },
      education_reminder: {
        message: RESPONSE_MESSAGES.EDUCATION.TOKENS_NOT_MONEY,
        required_before_exchange: true,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create profile. Please try again.",
    });
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: RESPONSE_MESSAGES.ERROR.INVALID_CREDENTIALS,
      });
    }

    // Check if profile is locked
    if (user.isLocked()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message:
          "Profile temporarily locked due to multiple failed login attempts. Please try again later.",
      });
    }

    // Check if profile is suspended
    if (user.isSuspended()) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: `Profile suspended: ${user.suspension_reason || "Contact support for details"
          }`,
      });
    }

    // Check if profile is active
    if (!user.is_active) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Profile is inactive. Please contact support.",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: RESPONSE_MESSAGES.ERROR.INVALID_CREDENTIALS,
      });
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      // Generate a temporary token for 2FA validation
      const tempToken = generateToken(user.id, "5m"); // Short lived token

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "2FA verification required",
        requires_2fa: true,
        temp_token: tempToken
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login info
    user.last_login_ip = req.ip || req.connection.remoteAddress;
    await user.save();

    // Generate JWT tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Cache user profile
    await setCache(`user:${user.id}`, user.toSafeObject(), 3600);

    // Return success response
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toSafeObject(),
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: "24h",
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * Verify email
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Find user with this token
    const user = await User.findOne({
      where: {
        email_verification_token: token,
        email_verification_expires: {
          [User.sequelize.Sequelize.Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Mark email as verified
    user.email_verified = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    user.updateVerificationLevel();
    await user.save();

    // Clear cache
    await deleteCache(`user:${user.id}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Email verified successfully",
      data: {
        verification_level: user.verification_level,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Email verification failed. Please try again.",
    });
  }
};

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Don't reveal if email exists
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: RESPONSE_MESSAGES.SUCCESS.VERIFICATION_SENT,
      });
    }

    if (user.email_verified) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email already verified",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.email_verification_token = verificationToken;
    user.email_verification_expires = verificationExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, user.full_name, verificationToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: RESPONSE_MESSAGES.SUCCESS.VERIFICATION_SENT,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to send verification email. Please try again.",
    });
  }
};

/**
 * Request password reset
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    // Don't reveal if email exists (security best practice)
    if (!user) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "If this email exists, a password reset link has been sent",
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    user.password_reset_token = resetToken;
    user.password_reset_expires = resetExpires;
    await user.save();

    // Send password reset email
    try {
      const { sendPasswordResetEmail } = require("../services/emailService");
      await sendPasswordResetEmail(user.email, user.full_name, resetToken);
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      // Optionally: continue without failing the request
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "If this email exists, a password reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to process password reset request. Please try again.",
    });
  }
};

/**
 * Reset password
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // Validate new password strength
    if (!REGEX_PATTERNS.PASSWORD.test(new_password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message:
          "Password must be at least 8 characters with uppercase, lowercase, and number",
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: {
          [User.sequelize.Sequelize.Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Update password
    user.password_hash = new_password; // Will be hashed by beforeUpdate hook
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    // Clear cache
    await deleteCache(`user:${user.id}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Password reset failed. Please try again.",
    });
  }
};

/**
 * Change password (authenticated)
 * POST /api/v1/auth/change-password
 * Body: { current_password, new_password }
 */
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Current password and new password are required",
      });
    }
    if (!REGEX_PATTERNS.PASSWORD.test(new_password)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: RESPONSE_MESSAGES.ERROR.PASSWORD_REQUIREMENTS || "Password must be at least 8 characters with uppercase, lowercase, number and special character",
      });
    }
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }
    const isValid = await user.comparePassword(current_password);
    if (!isValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    user.password_hash = new_password; // beforeUpdate will hash
    await user.save();
    await deleteCache(`user:${user.id}`);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

/**
 * Logout user (invalidate token)
 * POST /api/v1/auth/logout
 */
const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Clear user cache
    await deleteCache(`user:${userId}`);
    await deleteCache(`wallets:${userId}`);

    // TODO: Add token to blacklist in Redis

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Logout failed. Please try again.",
    });
  }
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Always fetch fresh data from database (don't use cache for this endpoint)
    // This ensures we get the latest updates, especially for agent data
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Get user object
    const userData = user.toSafeObject();

    // If user is an agent, include agent-specific data
    const Agent = require("../models/Agent");
    const agent = await Agent.findOne({ where: { user_id: userId } });

    if (agent) {
      // Merge agent-specific fields into user data
      userData.phone_number = agent.phone_number || userData.phone_number;
      userData.whatsapp_number = agent.whatsapp_number;
      userData.bank_name = agent.bank_name;
      userData.account_number = agent.account_number;
      userData.account_name = agent.account_name;
      userData.withdrawal_address = agent.withdrawal_address;
      userData.is_verified = agent.is_verified;
      userData.country = agent.country;
      userData.mobile_money_provider = agent.mobile_money_provider;
      userData.mobile_money_number = agent.mobile_money_number;
    }

    // Cache the merged result for future requests
    await setCache(`user:${userId}`, userData, 3600);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve user profile",
    });
  }
};

/**
 * Setup 2FA
 * POST /api/v1/auth/2fa/setup
 */
const setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate secret
    const speakeasy = require("speakeasy");
    const secret = speakeasy.generateSecret({
      name: `AfriExchange (${user.email})`,
    });

    // Generate QR code
    const QRCode = require("qrcode");
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret temporarily (or permanently but marked as unverified if you prefer)
    // Here we return it to the client to verify. We don't save it to the user model 
    // until they verify it to prevent locking them out if they fail to scan.
    // BUT, for statelessness, we might need to save it or send it back signed.
    // Better approach: Save it to the user record but keep `two_factor_enabled` as false.

    user.two_factor_secret = secret.base32;
    await user.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        secret: secret.base32,
        qr_code: qrCodeUrl,
      },
    });
  } catch (error) {
    console.error("Setup 2FA error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to setup 2FA",
    });
  }
};

/**
 * Verify 2FA (Enable it)
 * POST /api/v1/auth/2fa/verify
 */
const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || !user.two_factor_secret) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "2FA setup not initiated",
      });
    }

    const speakeasy = require("speakeasy");
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: token,
    });

    if (!verified) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Enable 2FA
    user.two_factor_enabled = true;
    await user.save();

    // Clear cache
    await deleteCache(`user:${userId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "2FA enabled successfully",
    });
  } catch (error) {
    console.error("Verify 2FA error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to verify 2FA",
    });
  }
};

/**
 * Disable 2FA
 * POST /api/v1/auth/2fa/disable
 */
const disable2FA = async (req, res) => {
  try {
    const { password, token } = req.body; // Require password and OTP for security
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Verify OTP (optional but recommended)
    if (token) {
      const speakeasy = require("speakeasy");
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: "base32",
        token: token,
      });

      if (!verified) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid OTP",
        });
      }
    }

    user.two_factor_enabled = false;
    user.two_factor_secret = null;
    await user.save();

    // Clear cache
    await deleteCache(`user:${userId}`);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    console.error("Disable 2FA error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to disable 2FA",
    });
  }
};

/**
 * Validate 2FA (Login step 2)
 * POST /api/v1/auth/2fa/validate
 */
const validate2FA = async (req, res) => {
  try {
    const { temp_token, token } = req.body;

    if (!temp_token || !token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Token and OTP required"
      });
    }

    // Verify temp token (which contains userId)
    // NOTE: In a real app, use a specific secret for temp tokens or a short-lived JWT
    const jwt = require("jsonwebtoken");
    let decoded;
    try {
      decoded = jwt.verify(temp_token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired session"
      });
    }

    const userId = decoded.id;
    const user = await User.findByPk(userId);

    if (!user || !user.two_factor_enabled) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid request"
      });
    }

    const speakeasy = require("speakeasy");
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: "base32",
      token: token,
    });

    if (!verified) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Generate real tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Reset login attempts
    await user.resetLoginAttempts();
    user.last_login_ip = req.ip || req.connection.remoteAddress;
    await user.save();

    // Cache user
    await setCache(`user:${user.id}`, user.toSafeObject(), 3600);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toSafeObject(),
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: "24h",
        },
      },
    });

  } catch (error) {
    console.error("Validate 2FA error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Validation failed",
    });
  }
};

module.exports = {
  registerAdmin,
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  getCurrentUser,
  setup2FA,
  verify2FA,
  disable2FA,
  validate2FA
};
