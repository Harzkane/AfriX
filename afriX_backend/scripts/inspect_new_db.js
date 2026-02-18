const { User, Wallet, Transaction, sequelize } = require('../src/models');

async function inspectDatabase() {
    try {
        console.log('--- Inspecting Database: afritoken ---');

        // Count Users
        const userCount = await User.count();
        console.log(`User Count: ${userCount}`);

        // Count Wallets
        const walletCount = await Wallet.count();
        console.log(`Wallet Count: ${walletCount}`);

        // Count Transactions
        const txCount = await Transaction.count();
        console.log(`Transaction Count: ${txCount}`);

        // Check specific users if they exist in this DB
        const emails = ['user1_ng@gmail.com', 'agent3_ng@gmail.com'];
        for (const email of emails) {
            const user = await User.findOne({ where: { email } });
            if (user) {
                const userWallets = await Wallet.findAll({ where: { user_id: user.id } });
                console.log(`\nUser ${email}:`);
                console.log(` - ID: ${user.id}`);
                console.log(` - Wallets: ${userWallets.length}`);
                userWallets.forEach(w => console.log(`   > ${w.token_type}: ${w.balance}`));
            } else {
                console.log(`\nUser ${email} NOT FOUND in this DB.`);
            }
        }

        // Check for users WITHOUT wallets
        const usersWithoutWallets = await sequelize.query(`
        SELECT u.email FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        WHERE w.id IS NULL
    `, { type: sequelize.QueryTypes.SELECT });

        console.log(`\nUsers with NO wallets: ${usersWithoutWallets.length}`);
        if (usersWithoutWallets.length > 0) {
            console.log('Sample:', usersWithoutWallets.slice(0, 3).map(u => u.email));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

inspectDatabase();
