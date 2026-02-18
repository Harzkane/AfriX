// File: /Users/harz/AfriExchange/afriX_backend/src/app.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const merchantRoutes = require("./routes/merchants");
const paymentRoutes = require("./routes/payments");
const transactionRoutes = require("./routes/transactions");
const userRoutes = require("./routes/users");
const walletRoutes = require("./routes/wallets");
const agentRoutes = require("./routes/agents");
const requestRoutes = require("./routes/requests");
const adminRoutes = require("./routes/admin");
const escrowRoutes = require("./routes/escrows");
const disputeRoutes = require("./routes/disputes");
const educationRoutes = require("./routes/education");
const configRoutes = require("./routes/config");
const notificationRoutes = require("./routes/notifications");

// Import middleware
const { sanitizeInput } = require("./middleware/validation");

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet()); // Security headers

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  credentials: process.env.CORS_CREDENTIALS === "true",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// LOGGING MIDDLEWARE
// ============================================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ============================================
// INPUT SANITIZATION
// ============================================
app.use(sanitizeInput);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AfriToken API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API ROUTES
// ============================================
const API_VERSION = process.env.API_VERSION || "v1";

app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/merchants`, merchantRoutes);
app.use(`/api/${API_VERSION}/transactions`, transactionRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/wallets`, walletRoutes);
app.use(`/api/${API_VERSION}/agents`, agentRoutes);
app.use(`/api/${API_VERSION}/requests`, requestRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/escrows`, escrowRoutes);
app.use(`/api/${API_VERSION}/disputes`, disputeRoutes);
app.use(`/api/${API_VERSION}/education`, educationRoutes);
app.use(`/api/${API_VERSION}/config`, configRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);

// ============================================
// ROOT ENDPOINT
// ============================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to AfriToken API",
    version: API_VERSION,
    documentation: `${process.env.FRONTEND_URL}/docs`,
    endpoints: {
      health: "/health",
      auth: `/api/${API_VERSION}/auth`,
      merchants: `/api/${API_VERSION}/merchants`,
      payments: `/api/${API_VERSION}/payments`,
      agents: `/api/${API_VERSION}/agents`,
      escrows: `/api/${API_VERSION}/escrows`,
      disputes: `/api/${API_VERSION}/disputes`,
    },
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
