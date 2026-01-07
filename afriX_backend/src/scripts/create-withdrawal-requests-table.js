// src/scripts/create-withdrawal-requests-table.js
require("dotenv").config();
const { sequelize } = require("../config/database");

async function createWithdrawalRequestsTable() {
  try {
    console.log("Creating withdrawal_requests table...");

    await sequelize.authenticate();
    console.log("Database connected");

    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = CURRENT_SCHEMA() 
        AND table_name = 'withdrawal_requests';
    `);

    if (results.length > 0) {
      console.log("Table 'withdrawal_requests' already exists. Skipping.");
      process.exit(0);
    }

    // Create table
    await sequelize.query(`
      CREATE TABLE withdrawal_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL,
        amount_usd DECIMAL(20,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        admin_notes TEXT,
        paid_tx_hash VARCHAR(255),
        paid_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected', 'paid'))
      );
    `);
    console.log("Table 'withdrawal_requests' created!");

    // Add index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_agent ON withdrawal_requests(agent_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
    `);
    console.log("Indexes created");

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

createWithdrawalRequestsTable();
