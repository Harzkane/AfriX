// File: src/scripts/fix-agent-reviews-constraint.js
// Run: node src/scripts/fix-agent-reviews-constraint.js

require("dotenv").config();
const { sequelize } = require("../config/database");

async function fixAgentReviewsConstraint() {
  try {
    console.log("🔄 Fixing agent_reviews constraint...");

    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Check if table exists
    const [tableExists] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = CURRENT_SCHEMA() 
        AND table_name = 'agent_reviews';
    `);

    if (tableExists.length === 0) {
      console.log("❌ Table 'agent_reviews' does not exist!");
      console.log(
        "💡 Run: node src/scripts/create-agent-reviews-table.js first"
      );
      process.exit(1);
    }

    console.log("📋 Table 'agent_reviews' exists");

    // Check current constraint
    const [constraints] = await sequelize.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE '%transaction_type%'
        AND constraint_schema = CURRENT_SCHEMA();
    `);

    console.log("\n📊 Current constraints:");
    constraints.forEach((c) => {
      console.log(`   - ${c.constraint_name}: ${c.check_clause}`);
    });

    // Drop the old constraint
    console.log("\n🗑️  Dropping old constraint...");
    await sequelize.query(`
      ALTER TABLE agent_reviews 
      DROP CONSTRAINT IF EXISTS agent_reviews_transaction_type_check;
    `);
    console.log("✅ Old constraint dropped");

    // Check what values are currently in the column
    const [existingData] = await sequelize.query(`
      SELECT DISTINCT transaction_type 
      FROM agent_reviews;
    `);

    console.log("\n📊 Existing transaction_type values:");
    if (existingData.length > 0) {
      existingData.forEach((row) => {
        console.log(`   - "${row.transaction_type}"`);
      });

      // Update any lowercase values to uppercase
      console.log("\n🔄 Converting lowercase values to uppercase...");
      await sequelize.query(`
        UPDATE agent_reviews 
        SET transaction_type = UPPER(transaction_type);
      `);
      console.log("✅ Values converted to uppercase");
    } else {
      console.log("   (No data in table yet)");
    }

    // Add new constraint that accepts both cases (for safety)
    console.log("\n➕ Adding new flexible constraint...");
    await sequelize.query(`
      ALTER TABLE agent_reviews 
      ADD CONSTRAINT agent_reviews_transaction_type_check 
      CHECK (UPPER(transaction_type) IN ('MINT', 'BURN'));
    `);
    console.log("✅ New constraint added (case-insensitive)");

    // Verify the fix
    console.log("\n🔍 Verifying constraint...");
    const [newConstraints] = await sequelize.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name = 'agent_reviews_transaction_type_check'
        AND constraint_schema = CURRENT_SCHEMA();
    `);

    if (newConstraints.length > 0) {
      console.log("✅ Constraint verified:");
      console.log(`   ${newConstraints[0].check_clause}`);
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n💡 Now both 'mint' and 'MINT' will work!");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

fixAgentReviewsConstraint();
