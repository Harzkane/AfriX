const { sequelize } = require('./src/config/database');

async function checkMintRequests() {
    try {
        // Get mint requests with user details
        const [mintRequests] = await sequelize.query(`
            SELECT mr.*, u.email, u.full_name 
            FROM mint_requests mr
            LEFT JOIN users u ON mr.user_id = u.id
            ORDER BY mr.created_at DESC
        `);

        console.log('Mint Requests:');
        mintRequests.forEach(mr => {
            console.log(`  - ${mr.email}: ${mr.amount} ${mr.token_type} | Status: ${mr.status} | Agent: ${mr.agent_id ? 'Yes' : 'No'}`);
        });

        // Check if wallets were created
        const [wallets] = await sequelize.query(`
            SELECT w.*, u.email 
            FROM wallets w
            LEFT JOIN users u ON w.user_id = u.id
            LIMIT 10
        `);

        console.log('\nWallets in DB:');
        if (wallets.length === 0) {
            console.log('  NO WALLETS FOUND - This is the problem!');
        } else {
            wallets.forEach(w => {
                console.log(`  - ${w.email}: ${w.token_type} = ${w.balance}`);
            });
        }

        // Check transactions
        const [transactions] = await sequelize.query(`
            SELECT * FROM transactions 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        console.log('\nTransactions in DB:');
        if (transactions.length === 0) {
            console.log('  NO TRANSACTIONS FOUND');
        } else {
            transactions.forEach(tx => {
                console.log(`  - ${tx.type}: ${tx.amount} ${tx.token_type} | Status: ${tx.status}`);
            });
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkMintRequests();
