// File: src/models/AgentReview.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * AgentReview Model
 *
 * Stores user ratings and reviews for agents after completed transactions.
 * One review per transaction ensures authenticity.
 */
const AgentReview = sequelize.define(
  "agent_reviews",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "User who submitted the review",
    },

    agent_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: "Agent being reviewed",
    },

    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // Prevents duplicate reviews for same transaction
      comment: "Related mint/burn transaction",
    },

    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
      comment: "Star rating 1-5",
    },

    review_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Optional written feedback from user",
    },

    transaction_type: {
      type: DataTypes.ENUM("MINT", "BURN"),
      allowNull: false,
      comment: "Type of transaction reviewed",
    },

    // Helpful for moderation
    is_flagged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Flagged for inappropriate content",
    },

    agent_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Optional response from agent",
    },

    agent_response_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When agent responded",
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["agent_id"] },
      { fields: ["user_id"] },
      { fields: ["transaction_id"], unique: true },
      { fields: ["rating"] },
      { fields: ["created_at"] },
    ],
  }
);

module.exports = AgentReview;
