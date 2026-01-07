const { sequelize } = require("./src/config/database");

async function addFcmToken() {
    try {
        await sequelize.authenticate();
        console.log("Connected.");

        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable('users');

        if (!tableDescription.fcm_token) {
            console.log("Adding fcm_token column...");
            await queryInterface.addColumn("users", "fcm_token", {
                type: sequelize.Sequelize.STRING(255),
                allowNull: true,
                comment: "Firebase Cloud Messaging token for push notifications",
            });
            console.log("✅ fcm_token column added successfully.");
        } else {
            console.log("ℹ️ fcm_token column already exists.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error adding column:", error);
        process.exit(1);
    }
}

addFcmToken();
