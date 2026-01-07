// seeders/demo-agents.js
const { v4: uuidv4 } = require("uuid");

module.exports = {
    up: async (queryInterface, sequelize) => {
        const now = new Date();

        const countries = [
            { code: "NG", currency: "NGN", bank: "GTBank", account: "0123456789" },
            { code: "BJ", currency: "XOF", bank: "Ecobank Benin", account: "BJ7600100100000012345678" },
            { code: "CI", currency: "XOF", bank: "NSIA Banque", account: "CI7600100100000012345678" },
            { code: "SN", currency: "XOF", bank: "CBAO", account: "SN7600100100000012345678" },
            { code: "TG", currency: "XOF", bank: "Orabank", account: "TG7600100100000012345678" }
        ];

        for (const country of countries) {
            // Create profiles for 3 agents per country
            for (let i = 1; i <= 3; i++) {
                const agentEmail = `agent${i}_${country.code.toLowerCase()}@gmail.com`;
                const userId = await queryInterface.rawSelect(
                    "users",
                    {
                        where: { email: agentEmail },
                    },
                    ["id"]
                );

                if (userId) {
                    // Delete existing agent profile to ensure update
                    await queryInterface.bulkDelete("agents", { user_id: userId });

                    // Vary account number slightly for each agent
                    const baseAccount = country.account.slice(0, -1);
                    const uniqueAccount = baseAccount + i;

                    const agent = {
                        id: uuidv4(),
                        user_id: userId,
                        country: country.code,
                        currency: country.currency,
                        tier: "starter",
                        status: "active",
                        withdrawal_address: "0x5d0d0e728e6656A279707262e403Ca2f2C2AA746",
                        deposit_usd: 50000.0 + (i * 50000), // Vary deposit: 10k, 15k, 20k
                        available_capacity: 50000.0 + (i * 50000),
                        total_minted: 0,
                        total_burned: 0,
                        rating: 4.5 + (i * 0.1), // Vary rating: 4.6, 4.7, 4.8
                        is_verified: true,
                        phone_number: `+234801234567${i}`,
                        whatsapp_number: `+234801234567${i}`,
                        bank_name: country.bank,
                        account_number: uniqueAccount,
                        account_name: `Agent ${i} ${country.code} Business`,
                        created_at: now,
                        updated_at: now,
                    };

                    await queryInterface.bulkInsert("agents", [agent]);
                    console.log(`   + Created/Updated agent profile for: ${agentEmail}`);
                } else {
                    console.log(`   ⚠️  User not found for agent: ${agentEmail}`);
                }
            }
        }
    },

    down: async (queryInterface, sequelize) => {
        await queryInterface.bulkDelete("agents", null, {});
    },
};
