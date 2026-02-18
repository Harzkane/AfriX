// migrations/runner.js
require("dotenv").config();
const { sequelize } = require("../src/config/database");
const { Umzug, SequelizeStorage } = require("umzug");

const umzug = new Umzug({
    migrations: {
        glob: "migrations/*[0-9]*.js", // exclude runner.js (no digit in name)
        resolve: ({ name, path, context }) => {
            const migration = require(path);
            if (!migration || typeof migration.up !== 'function') {
                return {
                    name,
                    up: async () => console.log(`Skipping invalid migration: ${name}`),
                    down: async () => console.log(`Skipping invalid migration: ${name}`),
                };
            }
            return {
                name,
                up: async () => migration.up(context.getQueryInterface(), context.constructor),
                down: async () => migration.down(context.getQueryInterface(), context.constructor),
            };
        },
    },
    context: sequelize,
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connected");
        await umzug.up();
        console.log("✅ Migrations executed successfully");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
})();
