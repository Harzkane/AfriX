// Migration script to add total_earnings and commission_rate columns
const { sequelize } = require('./src/config/database');

async function migrate() {
    try {
        console.log('🔄 Running migration: Add total_earnings and commission_rate to agents table');

        await sequelize.query(`
      ALTER TABLE agents 
      ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(20, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS commission_rate FLOAT DEFAULT 0.01;
    `);

        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
