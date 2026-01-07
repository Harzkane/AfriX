// FILE: src/models/AgentKyc.js

const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

/**
 * AgentKyc Model
 * Stores KYC documents and verification status for agents
 */
const AgentKyc = sequelize.define(
  "agent_kyc",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    agent_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // One KYC record per agent
      comment: "Reference to agent",
    },

    // Document URLs (stored in R2)
    id_document_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Government-issued ID (passport, driver's license, national ID)",
    },

    id_document_type: {
      type: DataTypes.ENUM("passport", "drivers_license", "national_id"),
      allowNull: true,
    },

    selfie_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Selfie holding ID document",
    },

    proof_of_address_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Utility bill, bank statement (last 3 months)",
    },

    business_registration_url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Optional: Business registration certificate",
    },

    // Personal Details
    full_legal_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Full name as on ID document",
    },

    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    id_document_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "ID/Passport number",
    },

    nationality: {
      type: DataTypes.STRING(2),
      allowNull: true,
      comment: "ISO 3166-1 alpha-2 country code",
    },

    residential_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Verification Status
    status: {
      type: DataTypes.ENUM(
        "pending",
        "under_review",
        "approved",
        "rejected",
        "resubmission_required"
      ),
      defaultValue: "pending",
      allowNull: false,
    },

    // Admin Review
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: "Admin user who reviewed KYC",
    },

    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Reason for rejection (shown to agent)",
    },

    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Internal notes (not shown to agent)",
    },

    // Compliance
    risk_level: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: true,
      comment: "Risk assessment by compliance team",
    },

    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When agent submitted all documents",
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["agent_id"], unique: true },
      { fields: ["status"] },
      { fields: ["reviewed_at"] },
    ],
  }
);

module.exports = AgentKyc;
