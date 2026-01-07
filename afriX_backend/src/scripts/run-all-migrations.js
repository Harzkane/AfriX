// File: src/scripts/run-all-migrations.js
// Run: node src/scripts/run-all-migrations.js
// Purpose: Execute all schema migrations in correct order

require("dotenv").config();
const { sequelize } = require("../config/database");
const { execSync } = require("child_process");
const path = require("path");

async function runAllMigrations() {
  console.log("🚀 Starting all migrations...\n");
  console.log("=".repeat(60));

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection successful\n");

    // List of migration scripts in order
    const migrations = [
      {
        name: "Sync Agents Schema",
        file: "sync-agents-schema.js",
        description: "Add missing columns to agents table",
      },
      {
        name: "Sync Withdrawal Requests Schema",
        file: "sync-withdrawal-requests-schema.js",
        description: "Create/update withdrawal_requests table",
      },
    ];

    let successCount = 0;
    let failCount = 0;

    // Run each migration
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(`\n[${i + 1}/${migrations.length}] ${migration.name}`);
      console.log(`    ${migration.description}`);
      console.log("-".repeat(60));

      try {
        const scriptPath = path.join(__dirname, migration.file);
        console.log(`    Running: ${migration.file}\n`);

        execSync(`node ${scriptPath}`, {
          stdio: "inherit",
          cwd: path.join(__dirname, ".."),
        });

        console.log(`    ✅ ${migration.name} completed`);
        successCount++;
      } catch (error) {
        console.error(`    ❌ ${migration.name} failed`);
        failCount++;

        // Continue with other migrations even if one fails
        console.log("    Continuing with remaining migrations...");
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary");
    console.log("=".repeat(60));
    console.log(`✅ Successful: ${successCount}/${migrations.length}`);
    console.log(`❌ Failed: ${failCount}/${migrations.length}`);

    if (failCount === 0) {
      console.log("\n🎉 All migrations completed successfully!");
      console.log("\n✨ Your database schema is now fully synced!");
      console.log("\nNext steps:");
      console.log("1. Test agent registration: POST /api/v1/agents/register");
      console.log("2. Test deposit verification: POST /api/v1/agents/deposit");
      console.log(
        "3. Test withdrawal requests: POST /api/v1/agents/withdraw-request"
      );
    } else {
      console.log("\n⚠️  Some migrations failed. Please check errors above.");
    }

    console.log("=".repeat(60) + "\n");
    process.exit(failCount === 0 ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Migration suite failed:", error.message);
    process.exit(1);
  }
}

runAllMigrations();
