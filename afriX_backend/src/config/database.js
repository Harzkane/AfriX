// File: /Users/harz/AfriExchange/afriX_backend/src/config/database.js

const { Sequelize } = require("sequelize");
const winston = require("winston");
require("dotenv").config();

// Logger for database operations
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: "logs/database.log",
      level: "error",
    }),
  ],
});

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "afritoken",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  dialect: "postgres",
  dialectOptions: {
    ssl:
      process.env.DB_SSL === "true"
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
  },

  // Connection pool configuration
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 5,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 60000, // 60 seconds to acquire a connection
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
  },

  // Logging
  logging: (msg) => {
    if (process.env.NODE_ENV === "development") {
      logger.debug(msg);
    }
  },

  // Disable logging in test environment
  ...(process.env.NODE_ENV === "test" && { logging: false }),

  // Timezone
  timezone: "+01:00", // WAT (West Africa Time)

  // Other options
  define: {
    timestamps: true,
    underscored: true, // Use snake_case for columns
    freezeTableName: true, // Don't pluralize table names
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
};

// Initialize Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connection established successfully");
    return true;
  } catch (error) {
    logger.error("❌ Unable to connect to database:", error);
    throw error;
  }
};

/**
 * Initialize database (create tables)
 * init the database safely for dev and prod, using this new DB_FORCE_SYNC approach so you don’t accidentally lose Railway data.
 * For local testing, you can temporarily set DB_FORCE_SYNC=true to reset tables.
 * On Railway (production), keep it false so tables are never dropped.
 */
const initDatabase = async () => {
  try {
    if (
      process.env.NODE_ENV === "development" &&
      process.env.DB_FORCE_SYNC === "true"
    ) {
      // Only drop tables if you explicitly opt-in
      await sequelize.sync({ force: true });
      console.log("✅ Database models synchronized (tables recreated)");
    } else {
      await sequelize.sync({ alter: false }); // Safe sync
      console.log("✅ Database models synchronized");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
};

// const initDatabase = async () => {
//   try {
//     // Use force in development to avoid ALTER issues
//     // WARNING: This drops all tables and recreates them
//     if (process.env.NODE_ENV === "development") {
//       await sequelize.sync({ force: true });
//       console.log("✅ Database models synchronized (tables recreated)");
//     } else {
//       await sequelize.sync({ alter: false });
//       console.log("✅ Database models synchronized");
//     }
//   } catch (error) {
//     console.error("❌ Database initialization failed:", error);
//     throw error; // Re-throw to prevent server from starting with broken DB
//   }
// };

/**
 * Close database connection
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error closing database connection:", error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  initDatabase,
  closeConnection,
};
