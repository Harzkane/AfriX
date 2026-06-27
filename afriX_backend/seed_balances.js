// node seed_balances.js

const { Wallet } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function seedBalances() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Updating CT wallet balances...');
        const [ctUpdated] = await Wallet.update(
            { balance: 10000000.00 },
            { where: { token_type: 'CT' } }
        );
        console.log(`Updated ${ctUpdated} CT wallets to 10,000,000.`);

        console.log('Updating USDT wallet balances...');
        const [usdtUpdated] = await Wallet.update(
            { balance: 50000.00 },
            { where: { token_type: 'USDT' } }
        );
        console.log(`Updated ${usdtUpdated} USDT wallets to 50,000.`);

        console.log('Updating NT wallet balances...');
        const [ntUpdated] = await Wallet.update(
            { balance: 1000000.00 },
            { where: { token_type: 'NT' } }
        );
        console.log(`Updated ${ntUpdated} NT wallets to 1,000,000.`);

        console.log('\n✨ All balances seeded successfully!');
    } catch (err) {
        console.error('❌ Error seeding balances:', err);
    } finally {
        process.exit();
    }
}

seedBalances();
