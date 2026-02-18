const { sequelize, initDatabase } = require("../config/database");
const platformService = require("../services/platformService");

async function initProduction() {
    try {
        console.log("🚀 Starting Production Initialization...");

        // 1. Ensure DB connection
        await sequelize.authenticate();
        console.log("✅ Database connected.");

        // 2. Ensure Schema Exists
        console.log("📊 Syncing Database Schema...");
        await initDatabase();

        // 3. Initialize Platform User (Admin)
        console.log("👤 Checking/Creating Platform User...");
        const platformUser = await platformService.getPlatformUser();
        console.log(`   -> Platform User ID: ${platformUser.id}`);

        // 4. Initialize Platform Wallets
        console.log("fw Checking/Creating Platform Wallets...");
        const wallets = await platformService.getPlatformWallets();
        Object.keys(wallets).forEach(type => {
            console.log(`   -> ${type} Wallet: ${wallets[type].blockchain_address}`);
        });

        console.log("\n✅ Production Initialization Complete! generic");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Initialization Failed:", error);
        process.exit(1);
    }
}

initProduction();
