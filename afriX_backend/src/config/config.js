// /Users/harz/AfriExchange/afriX_backend/src/config/config.js

require("dotenv").config();

// Helper function to parse DATABASE_URL or use individual vars
const getDbConfig = (env) => {
  const useLocal = process.env.DB_USE_LOCAL === "true";

  if (process.env.DATABASE_URL && env === "production" && !useLocal) {
    // Parse DATABASE_URL for production (Railway, Heroku, etc.)
    const url = new URL(process.env.DATABASE_URL);
    return {
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      dialect: "postgres",
      dialectOptions: {
        ssl:
          process.env.DB_SSL === "false"
            ? false
            : { require: true, rejectUnauthorized: false },
      },
    };
  }

  // Use individual environment variables for development or if DB_USE_LOCAL is true
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl:
        process.env.DB_SSL === "true"
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  };
};

module.exports = {
  development: getDbConfig("development"),
  production: getDbConfig("production"),
};
