// File: src/scripts/add-withdrawal-address-to-agents.js
// Run: node src/scripts/add-withdrawal-address-to-agents.js

require("dotenv").config();
const { sequelize } = require("../config/database");

async function addWithdrawalAddressColumn() {
  try {
    console.log(
      "Starting withdrawal_address column migration for agents table..."
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
        AND column_name = 'withdrawal_address';
    `);

    if (results.length > 0) {
      console.log("Column 'withdrawal_address' already exists. Skipping.");
      process.exit(0);
    }

    // 3. Add the column (PostgreSQL syntax)
    // Check if there are any existing agents
    const [agentCount] = await sequelize.query(`
      SELECT COUNT(*) as count FROM agents;
    `);

    if (agentCount[0].count > 0) {
      console.log(`⚠️  Found ${agentCount[0].count} existing agents`);
      console.log(
        "Adding column as NULLABLE to avoid breaking existing data..."
      );

      await sequelize.query(`
        ALTER TABLE agents
        ADD COLUMN withdrawal_address VARCHAR(42);
      `);
    } else {
      console.log("No existing agents found. Adding column as NOT NULL...");

      await sequelize.query(`
        ALTER TABLE agents
        ADD COLUMN withdrawal_address VARCHAR(42) NOT NULL;
      `);
    }

    console.log("Column 'withdrawal_address' added successfully!");

    // 4. Add constraint: CHECK for 0x + 40 hex chars
    await sequelize.query(`
      ALTER TABLE agents
      ADD CONSTRAINT chk_agents_withdrawal_address_format
      CHECK (withdrawal_address IS NULL OR withdrawal_address ~ '^0x[a-fA-F0-9]{40}$');
    `);
    console.log("CHECK constraint added for Ethereum address format");

    // 5. Add comment
    await sequelize.query(`
      COMMENT ON COLUMN agents.withdrawal_address IS 'Agent personal wallet for USDT withdrawals';
    `);
    console.log("Comment added to withdrawal_address column");

    // 6. Optional: Add index (useful for lookups by address)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agents_withdrawal_address ON agents(withdrawal_address);
    `);
    console.log("Index 'idx_agents_withdrawal_address' created");

    // 7. Update existing agents with a placeholder (optional)
    // You may want to skip this and require agents to update their profile
    const [existingAgents] = await sequelize.query(`
      SELECT COUNT(*) as count FROM agents WHERE withdrawal_address IS NULL;
    `);

    if (existingAgents[0].count > 0) {
      console.log(
        `\n⚠️  Found ${existingAgents[0].count} agents without withdrawal_address`
      );
      console.log(
        "These agents will need to update their profile with a valid address."
      );
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\nNext steps:");
    console.log(
      "1. Existing agents should update their profiles with withdrawal_address"
    );
    console.log(
      "2. New agents must provide withdrawal_address during registration"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);

    if (error.message.includes("already exists")) {
      console.log(
        "Column 'withdrawal_address' or constraint already exists. Nothing to do."
      );
    } else if (error.message.includes("permission")) {
      console.log("Permission denied. Check DB user privileges.");
    } else {
      console.error("Full error:", error);
    }

    process.exit(1);
  }
}

// Run it
addWithdrawalAddressColumn();
