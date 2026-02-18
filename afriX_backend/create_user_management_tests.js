// create_user_management_tests.js
const { User, Wallet } = require("./src/models");
const { v4: uuidv4 } = require("uuid");

async function createUserTests() {
    try {
        console.log("Creating user management test data...");

        // 1. Regular Active User
        console.log("Creating Regular User...");
        const regularUser = await User.create({
            full_name: "Regular John",
            email: `john_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: true,
            is_active: true
        });
        // Create wallets
        await Wallet.create({ user_id: regularUser.id, token_type: "NT", balance: 1000 });
        await Wallet.create({ user_id: regularUser.id, token_type: "CT", balance: 50 });
        await Wallet.create({ user_id: regularUser.id, token_type: "USDT", balance: 0 });


        // 2. Suspended User
        console.log("Creating Suspended User...");
        const suspendedUser = await User.create({
            full_name: "Bad Guy",
            email: `bad_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: true,
            is_suspended: true,
            suspension_reason: "Fraudulent behavior"
        });
        await Wallet.create({ user_id: suspendedUser.id, token_type: "NT", balance: 0, is_frozen: true });

        // 3. Agent
        console.log("Creating Agent...");
        const agentUser = await User.create({
            full_name: "Agent Smith",
            email: `agent_${Date.now()}@example.com`,
            password: "Password123!",
            role: "agent",
            is_email_verified: true,
            identity_verified: true,
            verification_level: 2
        });
        await Wallet.create({ user_id: agentUser.id, token_type: "NT", balance: 50000 });

        console.log("✅ User management seed data created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create user seed data:", err);
        process.exit(1);
    }
}

createUserTests();
