const { User, Wallet, sequelize } = require('../src/models');
const walletService = require('../src/services/walletService');

async function run() {
    try {
        const email = 'user1_ng@gmail.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log(`Crediting user: ${email} (${user.id})`);

        // Credit NT
        await walletService.credit({
            userId: user.id,
            amount: 1000,
            token_type: 'NT',
            description: 'Test Credit Debugging UI'
        });
        console.log('Credited 1000 NT');

        // Credit USDT
        await walletService.credit({
            userId: user.id,
            amount: 500,
            token_type: 'USDT',
            description: 'Test Credit Debugging UI'
        });
        console.log('Credited 500 USDT');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

run();
