// File: src/scripts/add-fcm-token-column.js
require("dotenv").config();
const { sequelize } = require("../config/database");

async function addFcmTokenColumn() {
  try {
    console.log("Starting FCM token column migration...");

    // 1. Connect to DB
    await sequelize.authenticate();
    console.log("Database connected");

    // 2. Check if column already exists
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND column_name = 'fcm_token';
    `);

    if (results.length > 0) {
      console.log("Column 'fcm_token' already exists. Skipping.");
      process.exit(0);
    }

    // 3. Add the column (PostgreSQL syntax)
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN fcm_token TEXT;
    `);
    console.log("Column 'fcm_token' added successfully!");

    // 4. Add comment (PostgreSQL uses COMMENT ON)
    await sequelize.query(`
      COMMENT ON COLUMN users.fcm_token IS 'FCM token for push notifications';
    `);
    console.log("Comment added to fcm_token column");

    // 5. Optional: Add index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token);
    `);
    console.log("Index 'idx_users_fcm_token' created");

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);

    if (error.message.includes("already exists")) {
      console.log("Column 'fcm_token' already exists. Nothing to do.");
    } else if (error.message.includes("permission")) {
      console.log("Permission denied. Check DB user privileges.");
    }

    process.exit(1);
  }
}

// Run it
addFcmTokenColumn();

//   ~/Doc/b/AfriExchange/afriX_backend ❯ node src/scripts/add-fcm-token-column.js
