// File: src/scripts/sync-withdrawal-requests-schema.js
// Run: node src/scripts/sync-withdrawal-requests-schema.js
// Purpose: Create/sync withdrawal_requests table

require("dotenv").config();
const { sequelize } = require("../config/database");

async function syncWithdrawalRequestsSchema() {
  try {
    console.log("🔄 Starting withdrawal_requests table synchronization...\n");

    await sequelize.authenticate();
    console.log("✅ Database connected\n");

    // Check if table exists
    const [tableExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = CURRENT_SCHEMA()
        AND table_name = 'withdrawal_requests'
      );
    `);

    if (!tableExists[0].exists) {
      console.log("📦 Creating withdrawal_requests table...\n");

      await sequelize.query(`
        CREATE TABLE withdrawal_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          amount_usd DECIMAL(20, 2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          admin_notes TEXT,
          paid_tx_hash VARCHAR(66),
          paid_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT chk_withdrawal_amount_positive CHECK (amount_usd > 0),
          CONSTRAINT chk_withdrawal_status CHECK (status IN ('pending', 'approved', 'rejected', 'paid'))
        );
      `);
      console.log("✅ Table created");

      // Add indexes
      await sequelize.query(`
        CREATE INDEX idx_withdrawal_requests_agent_id ON withdrawal_requests(agent_id);
        CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
        CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);
      `);
      console.log("✅ Indexes created");

      // Add comments
      await sequelize.query(`
        COMMENT ON TABLE withdrawal_requests IS 'Agent USDT withdrawal requests from platform treasury';
        COMMENT ON COLUMN withdrawal_requests.agent_id IS 'Reference to agent making withdrawal';
        COMMENT ON COLUMN withdrawal_requests.amount_usd IS 'USDT amount to withdraw';
        COMMENT ON COLUMN withdrawal_requests.status IS 'Request status: pending, approved, rejected, paid';
        COMMENT ON COLUMN withdrawal_requests.admin_notes IS 'Admin notes for approval/rejection';
        COMMENT ON COLUMN withdrawal_requests.paid_tx_hash IS 'Blockchain transaction hash after payment';
        COMMENT ON COLUMN withdrawal_requests.paid_at IS 'Timestamp when payment was sent';
      `);
      console.log("✅ Comments added");
    } else {
      console.log("✓ Table 'withdrawal_requests' already exists");

      // Get existing columns
      const [existingColumns] = await sequelize.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = CURRENT_SCHEMA()
          AND table_name = 'withdrawal_requests';
      `);

      const existingColumnNames = existingColumns.map((col) => col.column_name);
      console.log("📋 Existing columns:", existingColumnNames.join(", "));
      console.log("");

      // Columns that should exist
      const requiredColumns = [
        {
          name: "id",
          sql: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
          skip: true,
        },
        { name: "agent_id", sql: "UUID NOT NULL" },
        { name: "amount_usd", sql: "DECIMAL(20, 2) NOT NULL" },
        { name: "status", sql: "VARCHAR(20) NOT NULL DEFAULT 'pending'" },
        { name: "admin_notes", sql: "TEXT" },
        { name: "paid_tx_hash", sql: "VARCHAR(66)" },
        { name: "paid_at", sql: "TIMESTAMP" },
        {
          name: "created_at",
          sql: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
          skip: true,
        },
        {
          name: "updated_at",
          sql: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
          skip: true,
        },
      ];

      let addedCount = 0;

      for (const column of requiredColumns) {
        if (column.skip || existingColumnNames.includes(column.name)) {
          continue;
        }

        console.log(`➕ Adding column '${column.name}'...`);
        await sequelize.query(`
          ALTER TABLE withdrawal_requests
          ADD COLUMN ${column.name} ${column.sql};
        `);
        addedCount++;
      }

      if (addedCount > 0) {
        console.log(`✅ ${addedCount} columns added`);
      }
    }

    // Show final schema
    console.log("\n📊 Final withdrawal_requests table schema:");
    const [finalColumns] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = CURRENT_SCHEMA()
        AND table_name = 'withdrawal_requests'
      ORDER BY ordinal_position;
    `);

    console.table(finalColumns);

    // Show statistics
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'paid') as paid
      FROM withdrawal_requests;
    `);

    if (stats[0].total_requests > 0) {
      console.log("\n📈 Withdrawal Request Statistics:");
      console.log(`   • Total requests: ${stats[0].total_requests}`);
      console.log(`   • Pending: ${stats[0].pending}`);
      console.log(`   • Approved: ${stats[0].approved}`);
      console.log(`   • Rejected: ${stats[0].rejected}`);
      console.log(`   • Paid: ${stats[0].paid}`);
    }

    console.log("\n✅ Synchronization completed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

syncWithdrawalRequestsSchema();
