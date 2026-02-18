const { User } = require('./src/models');
const { TOKEN_TYPES } = require('./src/config/constants');
const walletService = require('./src/services/walletService');

async function initializeWallets() {
    try {
        // Get all users
        const users = await User.findAll();

        console.log(`Found ${users.length} users in database`);

        let walletsCreated = 0;

        for (const user of users) {
            console.log(`\nProcessing user: ${user.email}`);

            // Create wallets for each token type using the service
            for (const tokenType of Object.values(TOKEN_TYPES)) {
                try {
                    const wallet = await walletService.getOrCreateWallet(user.id, tokenType);

                    if (wallet) {
                        console.log(`  ✅ ${tokenType} wallet ready (${wallet.blockchain_address.substring(0, 10)}...)`);
                        walletsCreated++;
                    }
                } catch (err) {
                    console.error(`  ❌ Failed to create ${tokenType} wallet:`, err.message);
                }
            }
        }

        console.log(`\n✅ Successfully initialized ${walletsCreated} wallets`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit();
    }
}

initializeWallets();
