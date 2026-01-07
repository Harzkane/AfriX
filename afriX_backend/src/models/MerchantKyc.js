const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const MerchantKyc = sequelize.define(
  "merchant_kyc",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    merchant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // one KYC record per merchant
      comment: "Linked merchant ID",
    },

    business_certificate_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    id_document_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    proof_of_address_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    selfie_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "under_review",
        "approved",
        "rejected",
        "resubmission_required"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },

    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// Associations
const Merchant = require("./Merchant");
Merchant.hasOne(MerchantKyc, { foreignKey: "merchant_id", as: "kyc" });
MerchantKyc.belongsTo(Merchant, { foreignKey: "merchant_id", as: "merchant" });

module.exports = MerchantKyc;
