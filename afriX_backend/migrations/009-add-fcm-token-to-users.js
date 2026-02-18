"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            await queryInterface.addColumn("users", "fcm_token", {
                type: Sequelize.STRING(255),
                allowNull: true,
                comment: "Firebase Cloud Messaging token for push notifications",
            });
        } catch (e) {
            const msg = (e && (e.message || e.original?.message || "")) || "";
            if (!msg.includes("already exists") && !msg.includes("Duplicate column")) throw e;
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("users", "fcm_token");
    },
};
