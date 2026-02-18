const { sequelize } = require('./src/config/database');

async function checkUsers() {
    try {
        // Get users and their wallets
        const [users] = await sequelize.query(`
            SELECT u.id, u.email, u.full_name, u.role,
                   COUNT(w.id) as wallet_count
            FROM users u
            LEFT JOIN wallets w ON u.id = w.user_id
            WHERE u.email IN ('user1_ng@gmail.com', 'user2_ng@gmail.com', 'agent3_ng@gmail.com')
            GROUP BY u.id, u.email, u.full_name, u.role
        `);

        console.log('Users and their wallets:');
        users.forEach(u => {
            console.log(`  - ${u.email} (${u.role}): ${u.wallet_count} wallets`);
        });

        // Check if these users exist at all
        const [allUsers] = await sequelize.query(`
            SELECT email, role FROM users 
            WHERE email LIKE '%_ng@gmail.com'
            ORDER BY email
        `);

        console.log('\nAll Nigerian users in DB:');
        allUsers.forEach(u => {
            console.log(`  - ${u.email} (${u.role})`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkUsers();
