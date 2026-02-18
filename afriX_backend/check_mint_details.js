const { sequelize } = require('./src/config/database');

async function checkMintRequestsDetailed() {
    try {
        // Get detailed mint request info
        const [mintRequests] = await sequelize.query(`
            SELECT 
                mr.id,
                mr.user_id,
                mr.agent_id,
                mr.amount,
                mr.token_type,
                mr.status,
                mr.payment_proof_url,
                mr.created_at,
                u.email as user_email,
                a.email as agent_email
            FROM mint_requests mr
            LEFT JOIN users u ON mr.user_id = u.id
            LEFT JOIN users a ON mr.agent_id = a.id
            ORDER BY mr.created_at DESC
        `);

        console.log('=== MINT REQUESTS BREAKDOWN ===\n');
        console.log(`Total: ${mintRequests.length} requests\n`);

        const statusCounts = {};
        mintRequests.forEach(mr => {
            statusCounts[mr.status] = (statusCounts[mr.status] || 0) + 1;
        });

        console.log('Status Distribution:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`  - ${status}: ${count}`);
        });

        console.log('\nDetailed Requests:');
        mintRequests.forEach((mr, i) => {
            console.log(`\n${i + 1}. Request ID: ${mr.id.substring(0, 8)}...`);
            console.log(`   User: ${mr.user_email}`);
            console.log(`   Agent: ${mr.agent_email || 'N/A'}`);
            console.log(`   Amount: ${mr.amount} ${mr.token_type}`);
            console.log(`   Status: ${mr.status}`);
            console.log(`   Proof: ${mr.payment_proof_url ? 'Yes' : 'No'}`);
            console.log(`   Created: ${mr.created_at}`);
        });

        console.log('\n=== WHAT NEEDS TO HAPPEN ===');
        console.log('These mint requests need to be:');
        console.log('1. Reviewed by an admin');
        console.log('2. Approved (which will create Transaction records)');
        console.log('3. Then they will appear in the Financial Module');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkMintRequestsDetailed();
