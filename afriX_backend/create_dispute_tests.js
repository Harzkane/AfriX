// create_dispute_tests.js
const { User, Agent, Escrow, Dispute, Transaction } = require("./src/models");
const {
    ESCROW_STATUS,
    DISPUTE_STATUS,
    DISPUTE_ESCALATION_LEVELS
} = require("./src/config/constants");
const { v4: uuidv4 } = require("uuid");

async function createDisputeTests() {
    try {
        console.log("Creating disputes test data...");

        // 1. Create involved parties
        const user = await User.create({
            full_name: "Unhappy User",
            email: `unhappy_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: true
        });

        const agentUser = await User.create({
            full_name: "Agent Smith",
            email: `agent_${Date.now()}@example.com`,
            password: "Password123!",
            role: "agent",
            is_email_verified: true
        });

        // Create Agent profile (if needed by your logic, often linked to User)
        // NOTE: In your schema Agent model might be separate or linked. Assuming it works with id.
        const agent = await Agent.create({
            user_id: agentUser.id,
            tier: "1",
            rating: 4.5,
            deposit_usd: 1000,
            available_capacity: 5000,
            status: "active"
        });

        // 2. Create Transaction & Escrow
        const transaction = await Transaction.create({
            to_user_id: user.id, // User receiving tokens (Mint)
            agent_id: agent.id,
            type: "mint",
            amount: 100,
            token_type: "USDT",
            status: "pending",
            reference: `TX-${Date.now()}`
        });

        const escrow = await Escrow.create({
            transaction_id: transaction.id,
            agent_id: agent.id,
            from_user_id: user.id,
            amount: 100,
            token_type: "USDT",
            status: ESCROW_STATUS.DISPUTED
        });

        // 3. Create Open Dispute
        await Dispute.create({
            escrow_id: escrow.id,
            transaction_id: transaction.id,
            opened_by_user_id: user.id,
            agent_id: agent.id,
            reason: "Agent did not release tokens",
            details: "I sent the cash 2 hours ago but still haven't received my crypto.",
            status: DISPUTE_STATUS.OPEN,
            escalation_level: DISPUTE_ESCALATION_LEVELS.AUTO
        });

        // 4. Create Escalated Dispute (Optional)
        const transaction2 = await Transaction.create({
            from_user_id: user.id, // User sending tokens (Burn)
            agent_id: agent.id,
            type: "burn",
            amount: 200,
            token_type: "USDT",
            status: "pending",
            reference: `TX-ESC-${Date.now()}`
        });

        const escrow2 = await Escrow.create({
            transaction_id: transaction2.id,
            agent_id: agent.id,
            from_user_id: user.id,
            amount: 200,
            token_type: "USDT",
            status: ESCROW_STATUS.DISPUTED
        });

        await Dispute.create({
            escrow_id: escrow2.id,
            transaction_id: transaction2.id,
            opened_by_user_id: user.id,
            agent_id: agent.id,
            reason: "Urgent: Fraud Suspected",
            details: "Agent asking for extra fees via WhatsApp.",
            status: DISPUTE_STATUS.OPEN,
            escalation_level: "arbitration"
        });

        console.log("✅ Dispute seed data created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create dispute seed data:", err);
        process.exit(1);
    }
}

createDisputeTests();
