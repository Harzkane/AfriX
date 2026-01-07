// jobs/scheduler.js
const cron = require("node-cron");
const { expireRequests } = require("./expireRequests");

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log("Running expireRequests job...");
  try {
    await expireRequests();
  } catch (error) {
    console.error("expireRequests failed:", error);
  }
});
