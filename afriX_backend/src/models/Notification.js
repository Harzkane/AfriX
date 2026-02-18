// File: src/models/Notification.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * Notification model — inbox record for every user-facing event.
 * Push/email are delivery channels; this is the source of truth.
 */
const Notification = sequelize.define(
  "notifications",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
      comment: "Recipient user",
    },
    type: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: "Event type: TOKENS_MINTED, NEW_MINT_REQUEST, etc.",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Short title for push/inbox",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Body text",
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: "Payload: requestId, transactionId, amount, etc.",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    push_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When push was sent (audit)",
    },
    email_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When email was sent (audit)",
    },
  },
  {
    tableName: "notifications",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["user_id", "created_at"], order: [["created_at", "DESC"]] },
      { fields: ["user_id", "is_read"] },
    ],
  }
);

module.exports = Notification;
