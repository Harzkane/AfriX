const { User, Wallet, Transaction } = require('../src/models');
const { Op } = require('sequelize');

async function run() {
    try {
        const emails = ['user1_ng@gmail.com', 'agent3_ng@gmail.com'];

        for (const email of emails) {
            console.log(`\n================================`);
            console.log(`Inspecting user: ${email}`);
            console.log(`================================`);

            const user = await User.findOne({
                where: { email },
                include: [
                    {
                        model: Wallet,
                        as: 'wallets',
                    }
                ]
            });

            if (!user) {
                console.log('User not found!');
                continue;
            }

            console.log(`User ID: ${user.id}`);
            console.log(`Role: ${user.role}`);

            if (!user.wallets || user.wallets.length === 0) {
                console.log('NO WALLETS FOUND via association!');
            } else {
                console.log(`Wallets found (${user.wallets.length}):`);
                user.wallets.forEach(w => {
                    console.log(` - ${w.token_type}: Balance=${w.balance}, Pending=${w.pending_balance}, Frozen=${w.is_frozen}, Active=${w.is_active}`);
                });
            }

            // Check Transactions
            const transactions = await Transaction.findAll({
                where: {
                    [Op.or]: [
                        { from_user_id: user.id },
                        { to_user_id: user.id }
                    ]
                },
                order: [['created_at', 'DESC']],
                limit: 5
            });

            console.log(`\nRecent Transactions (${transactions.length}):`);
            transactions.forEach(t => {
                const flow = t.from_user_id === user.id ? 'OUT' : 'IN';
                console.log(` - [${t.created_at.toISOString()}] ${t.type} (${flow}): ${t.amount} ${t.token_type} (Status: ${t.status})`);
            });

            // Sum transactions manually to verify consistency
            const totalIn = await Transaction.sum('amount', { where: { to_user_id: user.id, status: 'completed' } }) || 0;
            const totalOut = await Transaction.sum('amount', { where: { from_user_id: user.id, status: 'completed' } }) || 0;
            console.log(`\nCalculated from Tx: IN=${totalIn}, OUT=${totalOut}, NET=${totalIn - totalOut}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        const { sequelize } = require('../src/models');
        await sequelize.close();
    }
}

run();
