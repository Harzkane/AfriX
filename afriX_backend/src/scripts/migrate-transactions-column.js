// File: src/scripts/migrate-transactions-column.js
// node src/scripts/migrate-transactions-column.js

require("dotenv").config();
const { sequelize } = require("../config/database");

async function migrateTransactionsColumn() {
  try {
    console.log("🔄 Starting transaction table migration...");

    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Check if 'currency' column exists
    const [columns] = await sequelize.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      AND column_name = 'currency';
    `);

    if (columns.length > 0) {
      console.log("📋 Found 'currency' column, renaming to 'token_type'...");

      // Rename the column
      await sequelize.query(
        "ALTER TABLE transactions RENAME COLUMN currency TO token_type;"
      );

      console.log("✅ Column renamed: currency → token_type");
    } else {
      console.log("ℹ️  'currency' column not found.");

      // Check if token_type already exists
      const [tokenTypeColumns] = await sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'token_type';
      `);

      if (tokenTypeColumns.length > 0) {
        console.log(
          "✅ 'token_type' column already exists. No migration needed."
        );
      } else {
        console.log("⚠️  Neither 'currency' nor 'token_type' column exists.");
        console.log("🔧 Creating 'token_type' column...");

        // Create the ENUM type if it doesn't exist
        await sequelize.query(`
          DO $$ BEGIN
            CREATE TYPE token_type_enum AS ENUM ('NT', 'CT', 'USDT');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);

        // Add the column
        await sequelize.query(`
          ALTER TABLE transactions 
          ADD COLUMN token_type token_type_enum NOT NULL DEFAULT 'NT';
        `);

        console.log("✅ 'token_type' column created successfully");
      }
    }

    console.log("✨ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

migrateTransactionsColumn();
