// File: src/scripts/sync-agents-schema.js
// Run: node src/scripts/sync-agents-schema.js
// Purpose: Sync agents table with Agent model schema

require("dotenv").config();
const { sequelize } = require("../config/database");

async function syncAgentsSchema() {
  try {
    console.log("🔄 Starting agents table schema synchronization...\n");

    // Connect to DB
    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    // Get existing columns
    const [existingColumns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = CURRENT_SCHEMA()
        AND table_name = 'agents';
    `);

    const existingColumnNames = existingColumns.map((col) => col.column_name);
    console.log("📋 Existing columns:", existingColumnNames.join(", "));
    console.log("");

    // Define all columns that should exist (matching Agent model)
    const requiredColumns = [
      {
        name: "id",
        sql: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
        comment: "Primary key",
        skip: true, // Should already exist
      },
      {
        name: "user_id",
        sql: "UUID NOT NULL",
        comment: "User reference who owns the agent profile",
        index: "idx_agents_user_id",
      },
      {
        name: "country",
        sql: "VARCHAR(50) NOT NULL",
        comment: "Agent operating country",
      },
      {
        name: "currency",
        sql: "VARCHAR(10) NOT NULL",
        comment: "Agent operating currency",
      },
      {
        name: "tier",
        sql: "VARCHAR(20) DEFAULT 'starter'",
        comment: "Agent tier (starter, standard, premium, platinum)",
      },
      {
        name: "status",
        sql: "VARCHAR(20) DEFAULT 'pending'",
        comment: "Agent status (pending, active, suspended, inactive)",
      },
      {
        name: "withdrawal_address",
        sql: "VARCHAR(42)",
        comment: "Agent personal wallet for USDT withdrawals",
        constraint:
          "CHECK (withdrawal_address IS NULL OR withdrawal_address ~ '^0x[a-fA-F0-9]{40}$')",
        constraintName: "chk_agents_withdrawal_address_format",
        index: "idx_agents_withdrawal_address",
      },
      {
        name: "deposit_address",
        sql: "VARCHAR(42)",
        comment: "Polygon USDT deposit address for agent",
        constraint:
          "CHECK (deposit_address IS NULL OR deposit_address ~ '^0x[a-fA-F0-9]{40}$')",
        constraintName: "chk_agents_deposit_address_format",
        index: "idx_agents_deposit_address",
      },
      {
        name: "deposit_usd",
        sql: "FLOAT DEFAULT 0",
        comment: "Total USDT deposited by agent to platform treasury",
      },
      {
        name: "available_capacity",
        sql: "FLOAT DEFAULT 0",
        comment: "Amount of USDT-backed tokens the agent can mint/burn",
      },
      {
        name: "total_minted",
        sql: "FLOAT DEFAULT 0",
        comment: "Total tokens issued to users (reduces available capacity)",
      },
      {
        name: "total_burned",
        sql: "FLOAT DEFAULT 0",
        comment: "Total tokens bought back from users (increases capacity)",
      },
      {
        name: "rating",
        sql: "FLOAT DEFAULT 5.0",
        comment: "Agent rating (0-5)",
        constraint: "CHECK (rating >= 0 AND rating <= 5)",
        constraintName: "chk_agents_rating_range",
      },
      {
        name: "response_time_minutes",
        sql: "INTEGER DEFAULT 5",
        comment: "Average response time in minutes",
      },
      {
        name: "is_verified",
        sql: "BOOLEAN DEFAULT false",
        comment: "KYC verification status",
      },
      {
        name: "phone_number",
        sql: "VARCHAR(20)",
        comment: "Agent phone number",
      },
      {
        name: "whatsapp_number",
        sql: "VARCHAR(20)",
        comment: "Agent WhatsApp number",
      },
      {
        name: "bank_name",
        sql: "VARCHAR(100)",
        comment: "Agent bank name",
      },
      {
        name: "account_number",
        sql: "VARCHAR(50)",
        comment: "Agent bank account number",
      },
      {
        name: "account_name",
        sql: "VARCHAR(100)",
        comment: "Agent bank account name",
      },
      {
        name: "created_at",
        sql: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        comment: "Record creation timestamp",
        skip: true, // Should already exist
      },
      {
        name: "updated_at",
        sql: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        comment: "Record update timestamp",
        skip: true, // Should already exist
      },
    ];

    let addedCount = 0;
    let skippedCount = 0;

    // Process each column
    for (const column of requiredColumns) {
      if (column.skip) {
        console.log(`⏭️  Skipping '${column.name}' (core column)`);
        skippedCount++;
        continue;
      }

      if (existingColumnNames.includes(column.name)) {
        console.log(`✓ Column '${column.name}' already exists`);
        skippedCount++;
        continue;
      }

      console.log(`\n➕ Adding column '${column.name}'...`);

      // Add column
      await sequelize.query(`
        ALTER TABLE agents
        ADD COLUMN ${column.name} ${column.sql};
      `);
      console.log(`   ✓ Column added`);

      // Add comment
      if (column.comment) {
        await sequelize.query(`
          COMMENT ON COLUMN agents.${column.name} IS '${column.comment}';
        `);
        console.log(`   ✓ Comment added`);
      }

      // Add constraint if specified
      if (column.constraint && column.constraintName) {
        try {
          await sequelize.query(`
            ALTER TABLE agents
            ADD CONSTRAINT ${column.constraintName}
            ${column.constraint};
          `);
          console.log(`   ✓ Constraint '${column.constraintName}' added`);
        } catch (err) {
          if (err.message.includes("already exists")) {
            console.log(`   ⚠️  Constraint already exists, skipping`);
          } else {
            console.error(`   ❌ Failed to add constraint:`, err.message);
          }
        }
      }

      // Add index if specified
      if (column.index) {
        try {
          await sequelize.query(`
            CREATE INDEX IF NOT EXISTS ${column.index} ON agents(${column.name});
          `);
          console.log(`   ✓ Index '${column.index}' created`);
        } catch (err) {
          console.error(`   ⚠️  Index creation failed:`, err.message);
        }
      }

      addedCount++;
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Schema synchronization completed!`);
    console.log(`   • ${addedCount} columns added`);
    console.log(`   • ${skippedCount} columns already existed`);
    console.log("=".repeat(60));

    // Show final schema
    console.log("\n📊 Final agents table schema:");
    const [finalColumns] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = CURRENT_SCHEMA()
        AND table_name = 'agents'
      ORDER BY ordinal_position;
    `);

    console.table(finalColumns);

    // Check for any agents that need to update their withdrawal_address
    const [agentStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_agents,
        COUNT(withdrawal_address) as with_withdrawal,
        COUNT(*) - COUNT(withdrawal_address) as missing_withdrawal
      FROM agents;
    `);

    if (agentStats[0].total_agents > 0) {
      console.log("\n📈 Agent Statistics:");
      console.log(`   • Total agents: ${agentStats[0].total_agents}`);
      console.log(
        `   • With withdrawal address: ${agentStats[0].with_withdrawal}`
      );
      console.log(
        `   • Missing withdrawal address: ${agentStats[0].missing_withdrawal}`
      );

      if (agentStats[0].missing_withdrawal > 0) {
        console.log(
          "\n⚠️  Note: Some agents need to update their withdrawal_address"
        );
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

// Run it
syncAgentsSchema();
