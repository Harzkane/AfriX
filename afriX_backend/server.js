// File: /Users/harz/AfriExchange/afriX_backend/server.js

require("dotenv").config();
const app = require("./src/app");
const { testConnection, initDatabase } = require("./src/config/database");
const { seedReviewersLib } = require("./src/scripts/seed_reviewer_accounts_lib");
const {
  testConnection: testRedis,
  REDIS_ENABLED,
} = require("./src/config/redis");
require("./src/jobs/scheduler"); // Start background jobs (expiry, etc.)

const PORT = process.env.PORT || 5000;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    console.log("🚀 Starting AfriToken Backend...\n");

    // Test database connection
    console.log("📊 Testing database connection...");
    await testConnection();

    // Initialize database (create tables)
    console.log("🔧 Initializing database...");
    await initDatabase();

    // Seed reviewer accounts automatically
    await seedReviewersLib();

    // Test Redis connection only if enabled
    if (REDIS_ENABLED) {
      console.log("💾 Testing Redis connection...");
      const redisConnected = await testRedis();
      if (!redisConnected) {
        console.log("⚠️  Redis connection failed - continuing without cache");
      }
    } else {
      console.log("💾 Redis is disabled (using in-memory cache)");
    }

    // Start Express server (0.0.0.0 = accept connections from LAN/hotspot, not just localhost)
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`🌐 On network: http://<this-machine-ip>:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log("\n📝 Available endpoints:");
      console.log(`   - POST /api/v1/auth/register`);
      console.log(`   - POST /api/v1/auth/login`);
      console.log(`   - POST /api/v1/auth/verify-email`);
      console.log(`   - GET  /api/v1/auth/me`);
      console.log("\n🎯 Ready for Postman testing!\n");
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${PORT} is already in use. Please free the port or change PORT in .env`
        );
        process.exit(1);
      }
      console.error("❌ Server error:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n⚠️  SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Catch unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit on unhandled rejection in development
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

// Start the server
startServer();
