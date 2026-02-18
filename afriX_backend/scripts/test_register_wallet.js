const { User, Wallet, sequelize } = require('../src/models');
const { USER_ROLES } = require('../src/config/constants');
const crypto = require('crypto');

async function run() {
    const transaction = await sequelize.transaction();
    try {
        // We cannot easily test the API controller function directly without mocking req, res.
        // However, the change was in 'authController.js'.
        // To assume it works, we would need to call the endpoint or the function.
        // Importing the controller...

        const authController = require('../src/controllers/authController');

        const email = `test_auto_wallet_${Date.now()}@example.com`;
        const req = {
            body: {
                email,
                password: 'Password123!',
                full_name: 'Test Auto Wallet',
                country_code: 'NG'
            }
        };

        let responseData = {};
        const res = {
            status: (code) => {
                console.log(`Status: ${code}`);
                return {
                    json: (data) => {
                        responseData = data;
                        console.log('Response:', JSON.stringify(data, null, 2));
                    }
                }
            }
        };

        await authController.register(req, res);

        if (responseData.success) {
            const userId = responseData.data.user.id;
            console.log(`User created: ${userId}`);

            const wallets = await Wallet.findAll({ where: { user_id: userId } });
            console.log(`Wallets found: ${wallets.length}`);
            wallets.forEach(w => console.log(` - ${w.token_type}`));

            if (wallets.length === 3) {
                console.log('SUCCESS: All 3 wallets created automatically.');
            } else {
                console.log('FAILURE: Wallets missing.');
            }

            // Cleanup
            await User.destroy({ where: { id: userId } });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

run();
