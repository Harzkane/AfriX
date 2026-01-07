// File: /Users/harz/AfriExchange/afriX_backend/src/config/redis.js

const Redis = require("ioredis");
const winston = require("winston");

// Logger setup
const logger = winston.createLogger({
  level: "info",
  transports: [new winston.transports.Console()],
});

// Check if Redis is enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED !== "false";

let redis = null;

if (REDIS_ENABLED) {
  const useSSL = process.env.REDIS_SSL === "true";

  const redisConfig = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    username: process.env.REDIS_USER || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    connectTimeout: 10000,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying after 3 attempts
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true, // Don't connect immediately
    ...(useSSL
      ? {
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {}),
  };

  logger.info(
    `🔌 Connecting to Redis at ${redisConfig.host}:${redisConfig.port} (SSL=${useSSL})`
  );

  redis = new Redis(redisConfig);

  // Handle connection errors gracefully
  redis.on("error", (err) => {
    logger.error("Redis connection error:", err.message);
  });

  redis.on("connect", () => {
    logger.info("✅ Redis connected successfully");
  });

  redis.on("ready", () => {
    logger.info("✅ Redis is ready to accept commands");
  });
} else {
  logger.info("ℹ️  Redis is disabled");
}

// Test connection
const testConnection = async () => {
  if (!REDIS_ENABLED) {
    logger.info("ℹ️  Redis is disabled - skipping connection test");
    return false;
  }

  try {
    await redis.connect();
    const pong = await redis.ping();
    if (pong === "PONG") {
      logger.info("✅ Redis connection established successfully");
      return true;
    } else {
      throw new Error("Unexpected Redis PING response");
    }
  } catch (error) {
    logger.error("❌ Redis connection failed:", error.message);
    return false;
  }
};

module.exports = { redis, testConnection, REDIS_ENABLED };
