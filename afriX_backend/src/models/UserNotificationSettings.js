// File: src/models/UserNotificationSettings.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Granular notification preferences per user (push + email only).
 * Master switches (push_notifications_enabled, email_notifications_enabled) stay on User.
 */
const UserNotificationSettings = sequelize.define(
  "user_notification_settings",
  {
    user_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    // Push categories
    push_transactions: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Tokens received/sent, mint/burn completed",
    },
    push_requests: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "New request, request updated",
    },
    push_agent_updates: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Withdrawal status, reviews",
    },
    push_security: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Login, password change",
    },
    push_marketing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Promos, news",
    },
    // Email categories
    email_transaction_receipts: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Receipt after mint/burn/transfer",
    },
    email_agent_updates: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Withdrawal status, reviews",
    },
    email_security: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "Security-related",
    },
    email_marketing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Newsletter, promos",
    },
  },
  {
    tableName: "user_notification_settings",
    underscored: true,
    timestamps: true,
    createdAt: false,
    updatedAt: "updated_at",
  }
);

module.exports = UserNotificationSettings;
