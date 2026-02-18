// create_withdrawal_tests.js
const { WithdrawalRequest, Agent, User } = require("./src/models");
const { WITHDRAWAL_STATUS } = require("./src/config/constants");
const { v4: uuidv4 } = require("uuid");

async function createTestWithdrawals() {
    try {
        console.log("Finding an agent...");
        let agent = await Agent.findOne({ include: ["user"] });

        if (!agent) {
            console.log("No agent found. Creating one...");
            const user = await User.create({
                full_name: "Test Agent User",
                email: `agent_test_${Date.now()}@example.com`,
                password: "Password123!",
                role: "agent",
                is_email_verified: true,
                phone: "+2348000000000"
            });

            agent = await Agent.create({
                user_id: user.id,
                business_name: "Test Agency",
                country: "NG",
                status: "active",
                deposit_usd: 5000,
                available_capacity: 5000,
                withdrawal_address: "0x1234567890abcdef1234567890abcdef12345678"
            });
        }

        console.log(`Using Agent: ${agent.id} (${agent.user?.email || "No email"})`);

        // 1. Create PENDING request
        console.log("Creating PENDING withdrawal...");
        const pending = await WithdrawalRequest.create({
            agent_id: agent.id,
            amount_usd: 500.00,
            status: WITHDRAWAL_STATUS.PENDING
        });
        console.log(`Pending Request ID: ${pending.id}`);

        // 2. Create APPROVED request
        console.log("Creating APPROVED withdrawal...");
        const approved = await WithdrawalRequest.create({
            agent_id: agent.id,
            amount_usd: 1200.50,
            status: WITHDRAWAL_STATUS.APPROVED
        });
        console.log(`Approved Request ID: ${approved.id}`);

        // 3. Create PAID request
        console.log("Creating PAID withdrawal...");
        await WithdrawalRequest.create({
            agent_id: agent.id,
            amount_usd: 250.00,
            status: WITHDRAWAL_STATUS.PAID,
            paid_tx_hash: "0xabcdef1234567890abcdef1234567890abcdef12",
            paid_at: new Date()
        });

        // 4. Create REJECTED request
        console.log("Creating REJECTED withdrawal...");
        await WithdrawalRequest.create({
            agent_id: agent.id,
            amount_usd: 10000.00,
            status: WITHDRAWAL_STATUS.REJECTED,
            admin_notes: "Insufficient balance for withdrawal"
        });

        console.log("✅ Seed data created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create seed data:", err);
        process.exit(1);
    }
}

createTestWithdrawals();
