// create_agent_tests.js
const { User, Agent, AgentKyc } = require("./src/models");

async function createAgentTests() {
    try {
        console.log("Creating agent management test data...");

        // 1. Pending Agent (Needs KYC Review)
        console.log("Creating Pending Agent...");
        const user1 = await User.create({
            full_name: "Pending Agent",
            email: `pending_agent_${Date.now()}@example.com`,
            password: "Password123!",
            role: "agent",
            is_email_verified: true
        });
        const agent1 = await Agent.create({
            user_id: user1.id,
            status: "pending",
            tier: "silver",
            country: "NG",
            deposit_usd: 0,
            is_verified: false
        });
        // Create KYC submission
        await AgentKyc.create({
            agent_id: agent1.id,
            status: "under_review",
            document_url: "https://example.com/id.pdf",
            id_number: "NIN-12345678",
            submitted_at: new Date()
        });


        // 2. Active Agent (Verified with history)
        console.log("Creating Active Agent...");
        const user2 = await User.create({
            full_name: "Top Agent",
            email: `top_agent_${Date.now()}@example.com`,
            password: "Password123!",
            role: "agent",
            is_email_verified: true
        });
        const agent2 = await Agent.create({
            user_id: user2.id,
            status: "active",
            tier: "gold",
            country: "GH",
            deposit_usd: 5000,
            available_capacity: 4500, // Minted 500
            total_minted: 5000,
            total_burned: 4500,
            is_verified: true
        });
        await AgentKyc.create({
            agent_id: agent2.id,
            status: "approved",
            document_url: "https://example.com/id2.pdf",
            id_number: "GHA-87654321",
            submitted_at: new Date(),
            reviewed_at: new Date()
        });

        console.log("✅ Agent management seed data created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create agent seed data:", err);
        process.exit(1);
    }
}

createAgentTests();
