const { Wallet, Transaction, User } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function checkData() {
    try {
        // Check all tables
        const [walletCount] = await sequelize.query('SELECT COUNT(*) as count FROM wallets');
        const [txCount] = await sequelize.query('SELECT COUNT(*) as count FROM transactions');
        const [mintCount] = await sequelize.query('SELECT COUNT(*) as count FROM mint_requests');
        const [burnCount] = await sequelize.query('SELECT COUNT(*) as count FROM burn_requests');
        const [escrowCount] = await sequelize.query('SELECT COUNT(*) as count FROM escrows');
        const [withdrawalCount] = await sequelize.query('SELECT COUNT(*) as count FROM withdrawal_requests');

        console.log(`Database Summary:`);
        console.log(`- Total Wallets: ${walletCount[0].count}`);
        console.log(`- Total Transactions: ${txCount[0].count}`);
        console.log(`- Total Mint Requests: ${mintCount[0].count}`);
        console.log(`- Total Burn Requests: ${burnCount[0].count}`);
        console.log(`- Total Escrows: ${escrowCount[0].count}`);
        console.log(`- Total Withdrawal Requests: ${withdrawalCount[0].count}`);

        // Get sample data
        const sampleWallets = await Wallet.findAll({
            limit: 3,
            include: [{
                model: User,
                as: 'user',
                attributes: ['email', 'full_name']
            }]
        });
        console.log('\nSample Wallets:');
        sampleWallets.forEach(w => {
            console.log(`  - ${w.user?.email}: ${w.token_type} = ${w.balance}`);
        });

        const sampleTx = await Transaction.findAll({ limit: 3 });
        console.log('\nSample Transactions:');
        sampleTx.forEach(tx => {
            console.log(`  - ${tx.type} | ${tx.amount} ${tx.token_type} | Status: ${tx.status}`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkData();
