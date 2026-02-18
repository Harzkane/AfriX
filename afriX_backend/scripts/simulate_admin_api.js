const { User, Wallet, Transaction, Agent, Merchant } = require('../src/models');
const { Op } = require('sequelize');

async function getUserSimulated(userId) {
    try {
        console.log(`Fetching Data for User ID: ${userId}`);

        const user = await User.findByPk(userId, {
            include: [
                {
                    model: Wallet,
                    as: "wallets",
                    attributes: [
                        "id",
                        "token_type",
                        "balance",
                        "pending_balance",
                        "total_received",
                        "total_sent",
                        "transaction_count",
                        "is_frozen",
                        "frozen_reason",
                        "created_at",
                    ],
                },
                {
                    model: Agent,
                    as: "agent",
                    required: false,
                },
                {
                    model: Merchant,
                    as: "merchant",
                    required: false,
                },
            ],
        });

        if (!user) {
            console.log("User not found via findByPk");
            return;
        }

        // Get transaction summary (logic from controller)
        const transactionStats = await Transaction.findOne({
            attributes: [
                [
                    Transaction.sequelize.fn("COUNT", Transaction.sequelize.col("id")),
                    "total_transactions",
                ],
                [
                    Transaction.sequelize.fn(
                        "SUM",
                        Transaction.sequelize.literal(
                            `CASE WHEN from_user_id = '${userId}' AND status = 'completed' THEN amount ELSE 0 END`
                        )
                    ),
                    "total_sent",
                ],
                [
                    Transaction.sequelize.fn(
                        "SUM",
                        Transaction.sequelize.literal(
                            `CASE WHEN to_user_id = '${userId}' AND status = 'completed' THEN amount ELSE 0 END`
                        )
                    ),
                    "total_received",
                ],
            ],
            where: {
                [Op.or]: [{ from_user_id: userId }, { to_user_id: userId }],
            },
            raw: true,
        });

        const userData = {
            ...user.toJSON(),
            transaction_summary: {
                total_transactions:
                    parseInt(transactionStats?.total_transactions) || 0,
                total_sent: parseFloat(transactionStats?.total_sent) || 0,
                total_received: parseFloat(transactionStats?.total_received) || 0,
            },
        };

        console.log("--- CONTROLLER RESPONSE PREVIEW ---");
        console.log(`User: ${userData.email}`);
        console.log(`Wallets Array Length: ${userData.wallets ? userData.wallets.length : 'NULL'}`);
        if (userData.wallets) {
            userData.wallets.forEach(w => {
                console.log(` > ${w.token_type}: ${w.balance}`);
            });
        }
        console.log("-----------------------------------");

    } catch (error) {
        console.error("Error simulating getUser:", error);
    }
}

async function run() {
    const { sequelize } = require('../src/models');
    try {
        const user1 = await User.findOne({ where: { email: 'user1_ng@gmail.com' } });
        if (user1) await getUserSimulated(user1.id);
        else console.log("user1_ng not found for simulation");

        const agent3 = await User.findOne({ where: { email: 'agent3_ng@gmail.com' } });
        if (agent3) await getUserSimulated(agent3.id);
        else console.log("agent3_ng not found for simulation");

    } finally {
        await sequelize.close();
    }
}

run();
