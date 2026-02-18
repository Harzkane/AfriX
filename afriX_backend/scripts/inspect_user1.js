// /usr/local/opt/node@22/bin/node scripts/inspect_user1.js
const { User, Wallet } = require('../src/models');

async function run() {
    try {
        const email = 'user1_ng@gmail.com';
        console.log(`Inspecting user: ${email}`);

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
            return;
        }

        console.log(`User ID: ${user.id}`);
        console.log(`Role: ${user.role}`);
        console.log(`Active: ${user.is_active}`);

        if (!user.wallets || user.wallets.length === 0) {
            console.log('NO WALLETS FOUND via association!');
        } else {
            console.log(`Wallets found (${user.wallets.length}):`);
            user.wallets.forEach(w => {
                console.log(` - ID: ${w.id}`);
                console.log(`   Type: ${w.token_type}`);
                console.log(`   Balance: ${w.balance}`);
                console.log(`   Frozen: ${w.is_frozen}`);
                console.log(`   IsActive: ${w.is_active}`); // check if this field exists/is true
            });
        }

        // Double check with direct query in case association is broken/filtered
        const directWallets = await Wallet.findAll({ where: { user_id: user.id } });
        console.log(`\nDirect Wallet Query Count: ${directWallets.length}`);
        directWallets.forEach(w => {
            console.log(` - [Direct] ${w.token_type}: ${w.balance} (Active: ${w.is_active})`);
        });


    } catch (error) {
        console.error('Error:', error);
    } finally {
        // We need to close the connection to exit the script gracefully
        const { sequelize } = require('../src/models');
        await sequelize.close();
    }
}

run();
