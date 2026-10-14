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

// Run daily at midnight to capture portfolio snapshots
const { runPortfolioSnapshotJob } = require("./portfolioSnapshotJob");
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily runPortfolioSnapshotJob...");
  try {
    await runPortfolioSnapshotJob();
  } catch (error) {
    console.error("runPortfolioSnapshotJob failed:", error);
  }
});

// Run every 10 minutes to process expired escrows
const { autoDisputeJob } = require("./autoDisputeJob");
cron.schedule("*/10 * * * *", async () => {
  console.log("Running autoDisputeJob...");
  try {
    await autoDisputeJob();
  } catch (error) {
    console.error("autoDisputeJob failed:", error);
  }
});
