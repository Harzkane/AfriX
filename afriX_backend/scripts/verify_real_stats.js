const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testStats() {
    try {
        console.log('--- Testing Transaction Stats API ---');
        // We simulate the admin request. We need a token or we can bypass if we run the controller logic directly.
        // For simplicity, let's just run the controller logic via a script if we have the models.
        const { Transaction, sequelize } = require('../src/models');
        const { TRANSACTION_STATUS } = require('../src/config/constants');
        const { Op } = require('sequelize');

        const totalTransactions = await Transaction.count();
        console.log(`Total Transactions: ${totalTransactions}`);

        const completedTransactions = await Transaction.count({
            where: { status: TRANSACTION_STATUS.COMPLETED },
        });

        // Volume History (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const volumeHistory = await Transaction.findAll({
            attributes: [
                [sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'month'],
                [sequelize.fn('count', sequelize.col('id')), 'count'],
                [sequelize.fn('sum', sequelize.col('amount')), 'amount'],
            ],
            where: {
                created_at: { [Op.gte]: sixMonthsAgo }
            },
            group: [sequelize.fn('date_trunc', 'month', sequelize.col('created_at'))],
            order: [[sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'ASC']],
            raw: true
        });

        console.log('\nVolume History:');
        volumeHistory.forEach(item => {
            console.log(` - ${item.month}: ${item.count} txs, ${item.amount} amount`);
        });

        const formattedHistory = volumeHistory.map(item => ({
            name: new Date(item.month).toLocaleString('default', { month: 'short' }),
            transactions: parseInt(item.count || 0),
            activity: Math.round(parseFloat(item.count || 0) * 0.7)
        }));

        console.log('\nFormatted for Chart:');
        console.log(JSON.stringify(formattedHistory, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // await sequelize.close();
    }
}

testStats();
