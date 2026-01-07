// node src/scripts/update-agent-capacity.js
const { sequelize } = require("../config/database");

async function updateAgentCapacity() {
    try {
        await sequelize.authenticate();
        console.log("Connected.");

        // Update all agents to have higher capacity
        await sequelize.query(`
      UPDATE agents 
      SET available_capacity = 5000000, 
          deposit_usd = 5000000
      WHERE status = 'active'
    `);

        console.log("✅ Updated all active agents to have 50,000 capacity");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

updateAgentCapacity();
