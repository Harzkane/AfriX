const { User, Wallet, sequelize } = require('../src/models');
const walletService = require('../src/services/walletService');
const { TOKEN_TYPES, USER_ROLES } = require('../src/config/constants');

async function runBackfill() {
    console.log('--- Starting Wallet Backfill ---');
    let updatedCount = 0;
    let skippedCount = 0;

    try {
        const users = await User.findAll({
            attributes: ['id', 'email', 'full_name'],
        });

        console.log(`Found ${users.length} users in total.`);

        for (const user of users) {
            // Find what wallets this user has
            const wallets = await Wallet.findAll({ where: { user_id: user.id } });
            const existingTypes = wallets.map(w => w.token_type);
            const allTypes = Object.values(TOKEN_TYPES);

            let missingTypes = allTypes.filter(t => !existingTypes.includes(t));

            if (missingTypes.length === 0) {
                // console.log(`Skipping ${user.email} (all wallets exist)`);
                skippedCount++;
                continue;
            }

            console.log(`Backfilling for ${user.email} (Missing: ${missingTypes.join(', ')})`);

            for (const tokenType of missingTypes) {
                await walletService.getOrCreateWallet(user.id, tokenType);
            }
            updatedCount++;
        }

        console.log(`\n--- Backfill Complete ---`);
        console.log(`Updated users: ${updatedCount}`);
        console.log(`Skipped users: ${skippedCount}`);

    } catch (error) {
        console.error('Error in backfill:', error);
    } finally {
        await sequelize.close();
    }
}

runBackfill();
