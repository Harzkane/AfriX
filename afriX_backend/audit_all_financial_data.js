const { sequelize } = require('./src/config/database');

async function auditAllFinancialData() {
    try {
        console.log('=== COMPLETE DATABASE AUDIT ===\n');

        // Check all financial tables
        const [transactions] = await sequelize.query('SELECT COUNT(*) as count, type, status FROM transactions GROUP BY type, status');
        const [wallets] = await sequelize.query('SELECT COUNT(*) as count, token_type, is_frozen FROM wallets GROUP BY token_type, is_frozen');
        const [mintRequests] = await sequelize.query('SELECT COUNT(*) as count, status FROM mint_requests GROUP BY status');
        const [burnRequests] = await sequelize.query('SELECT COUNT(*) as count, status FROM burn_requests GROUP BY status');
        const [escrows] = await sequelize.query('SELECT COUNT(*) as count, status FROM escrows GROUP BY status');
        const [withdrawals] = await sequelize.query('SELECT COUNT(*) as count, status FROM withdrawal_requests GROUP BY status');

        console.log('📊 TRANSACTIONS:');
        if (transactions.length === 0) {
            console.log('   No transactions found');
        } else {
            transactions.forEach(t => {
                console.log(`   - ${t.type} (${t.status}): ${t.count}`);
            });
        }

        console.log('\n💰 WALLETS:');
        if (wallets.length === 0) {
            console.log('   No wallets found');
        } else {
            wallets.forEach(w => {
                console.log(`   - ${w.token_type} (${w.is_frozen ? 'Frozen' : 'Active'}): ${w.count}`);
            });
        }

        console.log('\n🪙 MINT REQUESTS:');
        if (mintRequests.length === 0) {
            console.log('   No mint requests found');
        } else {
            mintRequests.forEach(m => {
                console.log(`   - ${m.status}: ${m.count}`);
            });
        }

        console.log('\n🔥 BURN REQUESTS:');
        if (burnRequests.length === 0) {
            console.log('   No burn requests found');
        } else {
            burnRequests.forEach(b => {
                console.log(`   - ${b.status}: ${b.count}`);
            });
        }

        console.log('\n🔒 ESCROWS:');
        if (escrows.length === 0) {
            console.log('   No escrows found');
        } else {
            escrows.forEach(e => {
                console.log(`   - ${e.status}: ${e.count}`);
            });
        }

        console.log('\n💸 WITHDRAWAL REQUESTS:');
        if (withdrawals.length === 0) {
            console.log('   No withdrawal requests found');
        } else {
            withdrawals.forEach(w => {
                console.log(`   - ${w.status}: ${w.count}`);
            });
        }

        // Get sample data from each table
        console.log('\n\n=== SAMPLE DATA ===\n');

        const [sampleTx] = await sequelize.query('SELECT id, type, amount, token_type, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 3');
        console.log('Recent Transactions:');
        sampleTx.forEach(tx => {
            console.log(`  - ${tx.type}: ${tx.amount} ${tx.token_type} (${tx.status}) - ${new Date(tx.created_at).toLocaleString()}`);
        });

        const [sampleMint] = await sequelize.query('SELECT id, amount, token_type, status, created_at FROM mint_requests ORDER BY created_at DESC LIMIT 3');
        if (sampleMint.length > 0) {
            console.log('\nRecent Mint Requests:');
            sampleMint.forEach(m => {
                console.log(`  - ${m.amount} ${m.token_type} (${m.status}) - ${new Date(m.created_at).toLocaleString()}`);
            });
        }

        console.log('\n\n=== WHAT FINANCIAL MODULE SHOWS ===');
        console.log('Currently, the Financial Module displays:');
        console.log('✅ Transactions from the "transactions" table');
        console.log('✅ Wallets from the "wallets" table');
        console.log('❌ Mint requests (NOT shown - these are in adminOperationsController)');
        console.log('❌ Burn requests (NOT shown - these are in adminOperationsController)');
        console.log('❌ Escrows (NOT shown - these are in adminOperationsController)');
        console.log('❌ Withdrawal requests (NOT shown - separate module needed)');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

auditAllFinancialData();
