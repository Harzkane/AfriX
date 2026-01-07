// File: src/models/Dispute.js
const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
const {
  DISPUTE_STATUS,
  DISPUTE_ESCALATION_LEVELS,
} = require("../config/constants");

class Dispute extends Model { }

Dispute.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    escrow_id: {
      type: DataTypes.UUID,
      allowNull: true, // ✅ Changed to true for Mint Disputes
      comment: "Linked escrow under dispute (optional)",
    },

    mint_request_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Linked mint request under dispute (optional)",
    },

    transaction_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Optional related transaction ID",
    },

    opened_by_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User who opened the dispute",
    },

    agent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Agent assigned to investigate the dispute",
    },

    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: "Summary reason for the dispute",
    },

    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Detailed explanation of the issue",
    },

    // ✅ Updated to use centralized DISPUTE_STATUS constants
    status: {
      type: DataTypes.ENUM(...Object.values(DISPUTE_STATUS)),
      allowNull: false,
      defaultValue: DISPUTE_STATUS.OPEN,
      comment: "Current resolution stage of the dispute",
    },

    // Optional escalation level (can be added to schema later if needed)
    escalation_level: {
      type: DataTypes.ENUM(...Object.values(DISPUTE_ESCALATION_LEVELS)),
      allowNull: true,
      defaultValue: DISPUTE_ESCALATION_LEVELS.LEVEL_1,
      comment: "Indicates the current dispute escalation stage",
    },

    resolution: {
      type: DataTypes.JSON,
      allowNull: true,
      comment:
        "Administrative resolution details, e.g., { action: 'refund', penalize_agent: 120 }",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "disputes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
    indexes: [
      { fields: ["escrow_id"] },
      { fields: ["transaction_id"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = Dispute;
