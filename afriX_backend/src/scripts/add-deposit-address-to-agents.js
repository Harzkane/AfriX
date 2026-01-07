// File: src/scripts/add-deposit-address-to-agents.js
// cd ~/Doc/b/AfriExchange/afriX_backend
// node src/scripts/add-deposit-address-to-agents.js
require("dotenv").config();
const { sequelize } = require("../config/database");

async function addDepositAddressColumn() {
  try {
    console.log(
      "Starting deposit_address column migration for agents table..."
    );

    // 1. Connect to DB
    await sequelize.authenticate();
    console.log("Database connected");

    // 2. Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = CURRENT_SCHEMA()
        AND table_name = 'agents'
        AND column_name = 'deposit_address';
    `);

    if (results.length > 0) {
      console.log("Column 'deposit_address' already exists. Skipping.");
      process.exit(0);
    }

    // 3. Add the column (PostgreSQL syntax)
    await sequelize.query(`
      ALTER TABLE agents
      ADD COLUMN deposit_address VARCHAR(42);
    `);
    console.log("Column 'deposit_address' added successfully!");

    // 4. Add constraint: CHECK for 0x + 40 hex chars
    await sequelize.query(`
      ALTER TABLE agents
      ADD CONSTRAINT chk_agents_deposit_address_format
      CHECK (deposit_address ~ '^0x[a-fA-F0-9]{40}$');
    `);
    console.log("CHECK constraint added for Ethereum address format");

    // 5. Add comment
    await sequelize.query(`
      COMMENT ON COLUMN agents.deposit_address IS 'Polygon USDT deposit address for agent';
    `);
    console.log("Comment added to deposit_address column");

    // 6. Optional: Add index (useful for lookups by address)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agents_deposit_address ON agents(deposit_address);
    `);
    console.log("Index 'idx_agents_deposit_address' created");

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    if (error.message.includes("already exists")) {
      console.log(
        "Column 'deposit_address' or constraint already exists. Nothing to do."
      );
    } else if (error.message.includes("permission")) {
      console.log("Permission denied. Check DB user privileges.");
    }
    process.exit(1);
  }
}

// Run it
addDepositAddressColumn();
