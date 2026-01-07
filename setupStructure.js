/**
 * setupStructure.js
 * Generate AfriX backend folder structure automatically
 */

const fs = require("fs");
const path = require("path");

const baseDir = "/Users/harz/AfriExchange/afriX_backends";

const structure = {
  src: {
    config: [
      "database.js",
      "redis.js",
      "blockchain.js",
      "cloudflare.js",
      "constants.js",
    ],
    models: [
      "User.js",
      "Wallet.js",
      "Transaction.js",
      "Agent.js",
      "MintingTransaction.js",
      "BurningTransaction.js",
      "Dispute.js",
      "AgentCapacityLog.js",
      "ExchangeRate.js",
      "EducationProgress.js",
    ],
    controllers: [
      "authController.js",
      "userController.js",
      "walletController.js",
      "transactionController.js",
      "mintController.js",
      "burnController.js",
      "agentController.js",
      "disputeController.js",
      "rateController.js",
      "educationController.js",
    ],
    services: [
      "authService.js",
      "blockchainService.js",
      "emailService.js",
      "notificationService.js",
      "agentMatchingService.js",
      "disputeService.js",
      "analyticsService.js",
      "rateService.js",
      "storageService.js",
      "educationService.js",
      "terminologyService.js",
    ],
    middleware: [
      "auth.js",
      "validation.js",
      "rateLimiter.js",
      "errorHandler.js",
      "logger.js",
      "terminologyChecker.js",
    ],
    routes: [
      "auth.js",
      "users.js",
      "wallets.js",
      "transactions.js",
      "agents.js",
      "disputes.js",
      "rates.js",
      "education.js",
    ],
    utils: [
      "jwt.js",
      "validation.js",
      "encryption.js",
      "qrcode.js",
      "terminology.js",
      "helpers.js",
    ],
    jobs: [
      "rateUpdateJob.js",
      "transactionCleanupJob.js",
      "agentPerformanceJob.js",
      "depositVerificationJob.js",
      "autoDisputeJob.js",
      "educationReminderJob.js",
    ],
    websocket: ["server.js", "handlers.js"],
    app: "app.js",
  },
  migrations: [
    "001-create-users.js",
    "002-create-wallets.js",
    "003-create-transactions.js",
    "004-create-agents.js",
    "005-create-exchange-rates.js",
    "006-create-education-progress.js",
  ],
  seeders: ["demo-users.js", "demo-agents.js", "education-modules.js"],
  tests: {
    unit: {
      services: [],
      controllers: [],
      utils: [],
      files: ["terminology.test.js"],
    },
    integration: { api: [] },
    files: ["setup.js"],
  },
  docs: ["terminology-guide.md", "api-docs.md", "education-content.md"],
  files: [
    ".env.example",
    ".gitignore",
    "package.json",
    "README.md",
    "server.js",
  ],
};

// Helper to create folders and files recursively
function createStructure(base, obj) {
  if (Array.isArray(obj)) {
    obj.forEach((item) => {
      const target = path.join(base, item);
      if (item.includes(".")) {
        if (!fs.existsSync(target)) {
          fs.writeFileSync(target, `// ${item}\n`, "utf8");
          console.log("📄 Created:", target);
        }
      } else {
        if (!fs.existsSync(target)) {
          fs.mkdirSync(target, { recursive: true });
          console.log("📁 Created folder:", target);
        }
      }
    });
  } else if (typeof obj === "object") {
    Object.entries(obj).forEach(([key, val]) => {
      if (key === "files") {
        val.forEach((f) => {
          const filePath = path.join(base, f);
          if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, `// ${f}\n`, "utf8");
            console.log("📄 Created:", filePath);
          }
        });
      } else {
        const dirPath = path.join(base, key);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log("📁 Created folder:", dirPath);
        }
        createStructure(dirPath, val);
      }
    });
  } else if (typeof obj === "string") {
    const filePath = path.join(base, obj);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `// ${obj}\n`, "utf8");
      console.log("📄 Created:", filePath);
    }
  }
}

// Ensure base directory exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
  console.log("📁 Created base directory:", baseDir);
}

// Create the structure
createStructure(baseDir, structure);

console.log("\n✅ AfriX backend folder structure generated successfully!");
