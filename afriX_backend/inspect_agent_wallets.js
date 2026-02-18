const { Agent, User, Wallet } = require("./src/models");

async function inspect() {
    try {
        const agents = await Agent.findAll({
            limit: 5,
            include: [
                {
                    model: User,
                    as: "user",
                    include: [
                        {
                            model: Wallet,
                            as: "wallets"
                        }
                    ]
                }
            ]
        });

        console.log(`Found ${agents.length} agents.`);
        agents.forEach((agent, i) => {
            console.log(`\nAgent ${i + 1}: ${agent.business_name || 'No Name'}`);
            console.log(`User ID: ${agent.user_id}`);
            if (agent.user) {
                console.log(`User Email: ${agent.user.email}`);
                console.log(`Wallets Count: ${agent.user.wallets ? agent.user.wallets.length : 0}`);
                if (agent.user.wallets) {
                    agent.user.wallets.forEach(w => {
                        console.log(` - ${w.token_type}: ${w.balance}`);
                    });
                }
            } else {
                console.log(`User NOT found for agent!`);
            }
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
