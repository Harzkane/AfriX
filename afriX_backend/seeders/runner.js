// seeders/runner.js
require("dotenv").config();
const { sequelize } = require("../src/config/database");
const fs = require("fs");
const path = require("path");

const runSeeders = async () => {
    try {
        console.log("🌱 Starting database seeder...");

        // Connect to database
        await sequelize.authenticate();
        console.log("✅ Connected to database");

        // List of seeders to run in order
        const seeders = [
            "demo-users.js",
            "demo-agents.js"
        ];

        for (const file of seeders) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                console.log(`\n▶️  Running ${file}...`);
                const seeder = require(filePath);
                if (typeof seeder.up === "function") {
                    await seeder.up(sequelize.getQueryInterface(), sequelize);
                    console.log(`✅ ${file} completed`);
                } else {
                    console.log(`⚠️  ${file} does not export an 'up' function`);
                }
            } else {
                console.log(`❌ File not found: ${file}`);
            }
        }

        console.log("\n✨ All seeders completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
};

runSeeders();
