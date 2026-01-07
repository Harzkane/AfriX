"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("users", "fcm_token", {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: "Firebase Cloud Messaging token for push notifications",
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("users", "fcm_token");
    },
};
