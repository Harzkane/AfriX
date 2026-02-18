// File: /Users/harz/AfriExchange/afriX_backend/src/models/User.js

const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const { sequelize } = require("../config/database");
const {
  USER_ROLES,
  VERIFICATION_LEVELS,
  COUNTRIES,
} = require("../config/constants");

/**
 * User Model
 *
 * Represents a platform user profile (not "account" - regulatory terminology)
 * Stores authentication, verification, and preferences
 */
const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // Basic Profile Information
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      // REMOVED: unique: true  -- handled in indexes below
      validate: {
        isEmail: true,
      },
      comment: "User email address for authentication",
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Bcrypt hashed password",
    },

    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "User full name",
    },

    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
      // REMOVED: unique: true  -- handled in indexes below
      comment: "Phone number for SMS notifications",
    },

    country_code: {
      type: DataTypes.STRING(2),
      allowNull: false,
      validate: {
        isIn: [Object.values(COUNTRIES)],
      },
      comment: "ISO 3166-1 alpha-2 country code",
    },

    // User Role
    role: {
      type: DataTypes.ENUM(...Object.values(USER_ROLES)),
      defaultValue: USER_ROLES.USER,
      allowNull: false,
      comment: "User role: user, agent, merchant, admin",
    },

    // Verification Status
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Email verification status",
    },

    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Token for email verification",
    },

    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Email verification token expiration",
    },

    phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Phone number verification status",
    },

    identity_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "KYC/Identity verification status",
    },

    verification_level: {
      type: DataTypes.INTEGER,
      defaultValue: VERIFICATION_LEVELS.NONE,
      comment: "0=None, 1=Email, 2=Phone, 3=Identity",
    },

    // Password Reset
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Token for password reset",
    },

    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Password reset token expiration",
    },

    // Education Progress (Critical for user understanding)
    education_what_are_tokens: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Completed "What Are Tokens?" education module',
    },

    education_how_agents_work: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Completed "How Agents Work" education module',
    },

    education_understanding_value: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Completed "Understanding Value" education module',
    },

    education_safety_security: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Completed "Safety & Security" education module',
    },

    // Preferences
    language: {
      type: DataTypes.STRING(2),
      defaultValue: "en",
      validate: {
        isIn: [["en", "fr"]],
      },
      comment: "Preferred language: en (English) or fr (French)",
    },

    theme: {
      type: DataTypes.STRING(20),
      defaultValue: "nigeria",
      validate: {
        isIn: [["nigeria", "xof"]],
      },
      comment: "UI theme preference",
    },

    push_notifications_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Push notification preferences",
    },

    email_notifications_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Email notification preferences",
    },

    sms_notifications_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "SMS notification preferences",
    },

    // Security & Activity
    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "2FA authentication status",
    },

    two_factor_secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "2FA secret key",
    },

    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Last successful login timestamp",
    },

    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "IP address of last login",
    },

    login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Failed login attempt counter",
    },

    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Profile locked until this timestamp",
    },

    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Profile active status",
    },

    is_suspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Profile suspension status",
    },

    suspension_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Reason for suspension",
    },

    suspended_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Suspension end date",
    },

    // Referral
    referral_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      // REMOVED: unique: true  -- handled in indexes below
      comment: "Unique referral code for this user",
    },

    referred_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "User ID who referred this user",
    },

    // Security audit (admin unlock / reset attempts)
    last_unlocked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_unlocked_by_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    last_reset_attempts_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_reset_attempts_by_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },

    // Timestamps
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["email"], unique: true },
      {
        fields: ["phone_number"],
        unique: true,
        where: { phone_number: { [sequelize.Sequelize.Op.ne]: null } },
      },
      { fields: ["country_code"] },
      { fields: ["role"] },
      { fields: ["email_verified"] },
      { fields: ["is_active"] },
      { fields: ["referral_code"], unique: true },
    ],
  }
);

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Hash password before saving
 */
User.beforeCreate(async (user) => {
  if (user.password_hash) {
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed("password_hash")) {
    const salt = await bcrypt.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 12
    );
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @returns {Promise<boolean>}
 */
User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

/**
 * Update verification level based on completed verifications
 */
User.prototype.updateVerificationLevel = function () {
  if (this.identity_verified) {
    this.verification_level = VERIFICATION_LEVELS.IDENTITY;
  } else if (this.phone_verified) {
    this.verification_level = VERIFICATION_LEVELS.PHONE;
  } else if (this.email_verified) {
    this.verification_level = VERIFICATION_LEVELS.EMAIL;
  } else {
    this.verification_level = VERIFICATION_LEVELS.NONE;
  }
};

/**
 * Check if profile is locked
 * @returns {boolean}
 */
User.prototype.isLocked = function () {
  return this.locked_until && this.locked_until > new Date();
};

/**
 * Check if profile is suspended
 * @returns {boolean}
 */
User.prototype.isSuspended = function () {
  if (!this.is_suspended) return false;

  // Check if suspension has expired
  if (this.suspended_until && this.suspended_until < new Date()) {
    this.is_suspended = false;
    this.suspended_until = null;
    this.suspension_reason = null;
    return false;
  }

  return true;
};

/**
 * Check if user has completed required education for action
 * @param {string} action - 'mint' or 'burn'
 * @returns {boolean}
 */
User.prototype.hasCompletedEducation = function (action) {
  if (!process.env.EDUCATION_REQUIRED === "true") return true;

  if (action === "mint") {
    return this.education_what_are_tokens;
  }

  if (action === "burn") {
    return this.education_what_are_tokens && this.education_how_agents_work;
  }

  return true;
};

/**
 * Get safe user object (exclude sensitive fields)
 * @returns {Object}
 */
User.prototype.toSafeObject = function () {
  const {
    password_hash,
    password_reset_token,
    password_reset_expires,
    email_verification_token,
    email_verification_expires,
    two_factor_secret,
    ...safeUser
  } = this.toJSON();

  return safeUser;
};

/**
 * Increment failed login attempts
 */
User.prototype.incrementLoginAttempts = async function () {
  this.login_attempts += 1;

  // Lock profile after 5 failed attempts for 30 minutes
  if (this.login_attempts >= 5) {
    this.locked_until = new Date(Date.now() + 30 * 60 * 1000);
  }

  await this.save();
};

/**
 * Reset login attempts after successful login
 */
User.prototype.resetLoginAttempts = async function () {
  this.login_attempts = 0;
  this.locked_until = null;
  this.last_login_at = new Date();
  await this.save();
};

module.exports = User;
