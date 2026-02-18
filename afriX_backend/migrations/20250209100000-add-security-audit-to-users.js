"use strict";

function skipIfExists(e) {
  const msg = (e && (e.message || e.original?.message || "")) || "";
  if (msg.includes("already exists") || msg.includes("Duplicate column")) return;
  throw e;
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const cols = [
      { name: "last_unlocked_at", def: { type: Sequelize.DATE, allowNull: true } },
      { name: "last_unlocked_by_id", def: { type: Sequelize.UUID, allowNull: true, references: { model: "users", key: "id" } } },
      { name: "last_reset_attempts_at", def: { type: Sequelize.DATE, allowNull: true } },
      { name: "last_reset_attempts_by_id", def: { type: Sequelize.UUID, allowNull: true, references: { model: "users", key: "id" } } },
    ];
    for (const { name, def } of cols) {
      try {
        await queryInterface.addColumn("users", name, def);
      } catch (e) {
        skipIfExists(e);
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("users", "last_unlocked_at");
    await queryInterface.removeColumn("users", "last_unlocked_by_id");
    await queryInterface.removeColumn("users", "last_reset_attempts_at");
    await queryInterface.removeColumn("users", "last_reset_attempts_by_id");
  },
};
