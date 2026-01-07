// File: /Users/harz/AfriExchange/afriX_backend/src/middleware/auth.js

const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const { HTTP_STATUS } = require("../config/constants");
const { getCache, setCache } = require("../utils/cache");

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

    // Try to get user from cache
    let user = await getCache(`user:${decoded.id}`);

    if (!user) {
      // Fetch from database
      user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "User not found",
        });
      }

      // Cache user
      await setCache(`user:${decoded.id}`, user.toJSON(), 3600);
    }

    // Check if user is active
    if (!user.is_active || user.is_suspended) {
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
  authorize,
  authorizeAdmin,
  requireEmailVerification,
  requireEducation,
  optionalAuth,
};
