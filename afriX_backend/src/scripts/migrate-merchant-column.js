// File: src/scripts/migrate-merchant-column.js
require("dotenv").config();
const { sequelize } = require("../config/database");

async function migrateMerchantColumn() {
  try {
    console.log("🔄 Starting migration...");

    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Rename the column
    await sequelize.query(
      "ALTER TABLE merchants RENAME COLUMN default_currency TO default_token_type;"
    );

    console.log("✅ Column renamed: default_currency → default_token_type");
    console.log("✨ Migration completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);

    // If column already renamed or doesn't exist
    if (error.message.includes("does not exist")) {
      console.log(
        "ℹ️  Column might already be renamed or table structure is different"
      );
    }

    process.exit(1);
  }
}

migrateMerchantColumn();
