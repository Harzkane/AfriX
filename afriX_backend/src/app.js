// File: /Users/harz/AfriExchange/afriX_backend/src/app.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
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
const integrationRoutes = require("./routes/integrations");
const portfolioRoutes = require("./routes/portfolio");

// Import middleware
const { sanitizeInput } = require("./middleware/validation");

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet()); // Security headers

// CORS configuration
// Fail-closed: if CORS_ORIGIN is not set, no origin is allowed.
// Set CORS_ORIGIN in your .env / Render env vars (comma-separated for multiple origins).
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0 && process.env.NODE_ENV === "production") {
  console.warn(
    "[WARN] CORS_ORIGIN is not set in production. All cross-origin requests will be blocked. Set CORS_ORIGIN in your environment variables."
  );
}

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: process.env.CORS_CREDENTIALS === "true",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ============================================
// REQUEST CORRELATION ID
// ============================================
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || require("crypto").randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
});

// ============================================
// BODY PARSING MIDDLEWARE
// ============================================
// Standard JSON limit set to 500kb to protect memory while allowing payment proof base64 uploads
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// ============================================
// LOGGING MIDDLEWARE
// ============================================
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ============================================
// GLOBAL RATE LIMITER
// ============================================
// Protects all API routes from DDoS and enumeration attacks.
// Auth routes have stricter per-route limiters applied on top of this.
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,                  // 300 requests per window per IP across all API routes
    message: { success: false, message: "Too many requests from this IP, please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "development", // Bypass during local dev testing
  })
);

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
app.use(`/api/${API_VERSION}/integrations`, integrationRoutes);
app.use(`/api/${API_VERSION}/portfolio`, portfolioRoutes);

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
