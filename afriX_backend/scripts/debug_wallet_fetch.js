const { User, Wallet, sequelize } = require('../src/models');
const walletService = require('../src/services/walletService');
const { USER_ROLES } = require('../src/config/constants');
const crypto = require('crypto');

async function run() {
    const transaction = await sequelize.transaction();
    try {
        console.log('--- Starting Debug Script ---');

        // 1. Create a User without wallet
        const email = `test_wallet_${Date.now()}@example.com`;
        const user = await User.create({
            email,
            password_hash: 'hash',
            full_name: 'Test Wallet User',
            country_code: 'NG',
            role: USER_ROLES.USER,
            email_verified: true,
        }, { transaction });

        console.log(`User created: ${user.id}`);

        // Verify no wallets
        const walletsBefore = await Wallet.findAll({ where: { user_id: user.id }, transaction });
        console.log(`Wallets before credit: ${walletsBefore.length}`);

        // 2. Credit the user (should create wallet)
        // We need to commit the user first or share transaction? 
        // walletService.credit uses its own transaction unless we pass it, 
        // but looking at walletService.js, it starts a new transaction: sequelize.transaction(async (t) => ...
        // So we should probably commit the user creation first.

        await transaction.commit();

        // Now credit
        console.log('Crediting user...');
        await walletService.credit({
            userId: user.id,
            amount: 100,
            token_type: 'NT',
            description: 'Test Credit'
        });

        // 3. Fetch user like adminUserController.getUser
        console.log('Fetching user details...');
        const userWithWallets = await User.findByPk(user.id, {
            include: [
                {
                    model: Wallet,
                    as: 'wallets',
                }
            ]
        });

        console.log('User found:', !!userWithWallets);
        if (userWithWallets) {
            console.log(`Wallets found (getUser): ${userWithWallets.wallets.length}`);
            userWithWallets.wallets.forEach(w => {
                console.log(` - ${w.token_type}: ${w.balance}`);
            });
        }

        // 4. Clean up
        await User.destroy({ where: { id: user.id } }); // Cascades to wallets

    } catch (error) {
        console.error('Error:', error);
        if (!transaction.finished) await transaction.rollback();
    } finally {
        await sequelize.close();
    }
}

run();
