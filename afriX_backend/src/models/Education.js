// File: afriX_backend/src/models/Education.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { EDUCATION_MODULES } = require("../config/constants");

/**
 * Education Progress Model
 * Tracks user completion of educational modules.
 * Used to gate mint/burn actions.
 */
const Education = sequelize.define(
  "education",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    module: {
      type: DataTypes.ENUM(...Object.values(EDUCATION_MODULES)),
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Last quiz score (0–100)",
    },
  },
  {
    timestamps: true,
    indexes: [
      { unique: true, fields: ["user_id", "module"] },
      { fields: ["user_id"] },
      { fields: ["completed"] },
    ],
  }
);

// Sync with User model boolean flags
Education.afterCreate(async (record) => {
  if (record.completed) {
    await updateUserEducationFlag(record.user_id, record.module, true);
  }
});

Education.afterUpdate(async (record) => {
  if (record.changed("completed") && record.completed) {
    await updateUserEducationFlag(record.user_id, record.module, true);
  }
});

async function updateUserEducationFlag(userId, module, value) {
  const User = require("./User"); // Avoid circular dependency
  if (!userId || !module) return;

  const field = `education_${module}`;
  await User.update({ [field]: value }, { where: { id: userId } });
}

module.exports = Education;
