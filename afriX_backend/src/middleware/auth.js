// File: /Users/harz/AfriExchange/afriX_backend/src/middleware/auth.js

const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const Merchant = require("../models/Merchant");
const { HTTP_STATUS } = require("../config/constants");
const { getCache, setCache } = require("../utils/cache");

const loadActiveUserById = async (userId) => {
  let user = await getCache(`user:${userId}`);

  if (!user) {
    user = await User.findByPk(userId);

    if (!user) {
      return null;
    }

    await setCache(`user:${userId}`, user.toJSON(), 3600);
  }

  if (!user.is_active || user.is_suspended) {
    return { suspended: true };
  }

  return user;
};

/**
 * Authenticate user from JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const user = await loadActiveUserById(decoded.id);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.suspended) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Profile suspended or inactive",
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * Authenticate merchant-facing routes using either:
 * - merchant portal JWT auth
 * - merchant API key auth for backend-to-backend Path A integrations
 *
 * Supported API key headers:
 * - Authorization: Bearer <merchant_api_key>
 * - x-merchant-api-key: <merchant_api_key>
 * - x-api-key: <merchant_api_key>
 */
const authenticateMerchantAccess = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7).trim()
        : "";
    const headerApiKey =
      req.header("x-merchant-api-key")?.trim() || req.header("x-api-key")?.trim() || "";

    const tokenOrKey = bearerToken || headerApiKey;

    if (!tokenOrKey) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication token or merchant API key required",
      });
    }

    const decoded = verifyToken(tokenOrKey);

    if (decoded?.id) {
      const user = await loadActiveUserById(decoded.id);

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.suspended) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Profile suspended or inactive",
        });
      }

      req.user = user;
      req.userId = decoded.id;
      req.authType = "jwt";
      return next();
    }

    const merchant = await Merchant.findByApiKey(tokenOrKey);

    if (!merchant) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired authentication credential",
      });
    }

    const owner = await loadActiveUserById(merchant.user_id);

    if (!owner) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Merchant owner not found",
      });
    }

    if (owner.suspended) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Merchant owner profile suspended or inactive",
      });
    }

    req.user = owner;
    req.userId = merchant.user_id;
    req.merchant = merchant;
    req.authType = "merchant_api_key";
    return next();
  } catch (error) {
    console.error("Merchant authentication error:", error);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

/**
 * Check if user has specific role
 * @param {string[]} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

/**
 * Restrict to admin users only
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Admin access only",
    });
  }

  next();
};

/**
 * Check if user has completed email verification
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.email_verified) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "Email verification required before performing this action",
      verification_required: true,
    });
  }

  next();
};

/**
 * Check if user has completed required education
 * @param {string} action - Action type ('mint' or 'burn')
 */
const requireEducation = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!req.user.hasCompletedEducation(action)) {
      const requiredModules =
        action === "mint"
          ? ["what_are_tokens"]
          : ["what_are_tokens", "how_agents_work"];

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Please complete required education modules first",
        education_required: true,
        modules_needed: requiredModules,
      });
    }

    next();
  };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (decoded) {
      const user = await User.findByPk(decoded.id);
      if (user && user.is_active) {
        req.user = user;
        req.userId = decoded.id;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authenticateMerchantAccess,
  authorize,
  authorizeAdmin,
  requireEmailVerification,
  requireEducation,
  optionalAuth,
};
