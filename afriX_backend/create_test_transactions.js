const { Transaction, Wallet, User } = require('./src/models');
const { TOKEN_TYPES, TRANSACTION_TYPES, TRANSACTION_STATUS } = require('./src/config/constants');
const { v4: uuidv4 } = require('uuid');

async function createTestTransactions() {
    try {
        console.log('Creating test transactions...\n');

        // Get some users with wallets
        const users = await User.findAll({
            limit: 5,
            include: [{
                model: Wallet,
                as: 'wallets'
            }]
        });

        if (users.length < 2) {
            console.log('❌ Need at least 2 users with wallets');
            return;
        }

        const transactions = [];

        // Create some MINT transactions
        for (let i = 0; i < 3; i++) {
            const user = users[i % users.length];
            const ntWallet = user.wallets.find(w => w.token_type === 'NT');

            if (ntWallet) {
                const amount = (i + 1) * 10000; // 10k, 20k, 30k

                const tx = await Transaction.create({
                    reference: `MINT-${Date.now()}-${i}`,
                    type: TRANSACTION_TYPES.MINT,
                    token_type: TOKEN_TYPES.NT,
                    amount: amount,
                    from_user_id: null, // Mints don't have a "from"
                    to_user_id: user.id,
                    status: TRANSACTION_STATUS.COMPLETED,
                    metadata: {
                        test_data: true,
                        created_by: 'initialization_script'
                    }
                });

                // Update wallet balance
                ntWallet.balance = parseFloat(ntWallet.balance) + amount;
                ntWallet.total_received = parseFloat(ntWallet.total_received) + amount;
                ntWallet.transaction_count += 1;
                await ntWallet.save();

                transactions.push(tx);
                console.log(`✅ Created MINT: ${amount} NT for ${user.email}`);
            }
        }

        // Create some TRANSFER transactions
        if (users.length >= 2) {
            const sender = users[0];
            const receiver = users[1];
            const senderWallet = sender.wallets.find(w => w.token_type === 'NT');
            const receiverWallet = receiver.wallets.find(w => w.token_type === 'NT');

            if (senderWallet && receiverWallet && parseFloat(senderWallet.balance) > 5000) {
                const amount = 5000;

                const tx = await Transaction.create({
                    reference: `TRANSFER-${Date.now()}`,
                    type: TRANSACTION_TYPES.TRANSFER,
                    token_type: TOKEN_TYPES.NT,
                    amount: amount,
                    from_user_id: sender.id,
                    to_user_id: receiver.id,
                    status: TRANSACTION_STATUS.COMPLETED,
                    metadata: {
                        test_data: true,
                        created_by: 'initialization_script'
                    }
                });

                // Update sender wallet
                senderWallet.balance = parseFloat(senderWallet.balance) - amount;
                senderWallet.total_sent = parseFloat(senderWallet.total_sent) + amount;
                senderWallet.transaction_count += 1;
                await senderWallet.save();

                // Update receiver wallet
                receiverWallet.balance = parseFloat(receiverWallet.balance) + amount;
                receiverWallet.total_received = parseFloat(receiverWallet.total_received) + amount;
                receiverWallet.transaction_count += 1;
                await receiverWallet.save();

                transactions.push(tx);
                console.log(`✅ Created TRANSFER: ${amount} NT from ${sender.email} to ${receiver.email}`);
            }
        }

        console.log(`\n✅ Successfully created ${transactions.length} test transactions`);
        console.log('\nTransaction Summary:');
        transactions.forEach(tx => {
            console.log(`  - ${tx.type}: ${tx.amount} ${tx.token_type} (${tx.status})`);
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit();
    }
}

createTestTransactions();
