"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface
      .showAllTables()
      .then((tables) => tables.includes("notifications"));
    if (!tableExists) {
      await queryInterface.createTable("notifications", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: "users", key: "id" },
          onDelete: "CASCADE",
        },
        type: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        data: {
          type: Sequelize.JSONB,
          allowNull: true,
          defaultValue: {},
        },
        is_read: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        },
        read_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        push_sent_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        email_sent_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    }
    // Use raw SQL so re-running migration doesn't fail if index already exists
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at" ON "notifications" ("user_id", "created_at")'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read" ON "notifications" ("user_id", "is_read")'
    );

    const settingsExists = await queryInterface
      .showAllTables()
      .then((tables) => tables.includes("user_notification_settings"));
    if (!settingsExists) {
      await queryInterface.createTable("user_notification_settings", {
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      push_transactions: { type: Sequelize.BOOLEAN, defaultValue: true },
      push_requests: { type: Sequelize.BOOLEAN, defaultValue: true },
      push_agent_updates: { type: Sequelize.BOOLEAN, defaultValue: true },
      push_security: { type: Sequelize.BOOLEAN, defaultValue: true },
      push_marketing: { type: Sequelize.BOOLEAN, defaultValue: false },
      email_transaction_receipts: { type: Sequelize.BOOLEAN, defaultValue: true },
      email_agent_updates: { type: Sequelize.BOOLEAN, defaultValue: true },
      email_security: { type: Sequelize.BOOLEAN, defaultValue: true },
      email_marketing: { type: Sequelize.BOOLEAN, defaultValue: false },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("notifications");
    await queryInterface.dropTable("user_notification_settings");
  },
};
