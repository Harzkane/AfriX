// File: /Users/harz/AfriExchange/afriX_backend/src/config/constants.js

/**
 * Application Constants
 *
 * IMPORTANT: All terminology follows regulatory-safe guidelines.
 * See docs/terminology-guide.md for complete reference.
 */

// ============================================
// MERCHANT CONSTANTS
// ============================================
const MERCHANT_STATUS = {
  PENDING: "pending", // Application submitted
  APPROVED: "approved", // Verified and active
  REJECTED: "rejected", // Application rejected
  ACTIVE: "active", // Currently accepting payments
  INACTIVE: "inactive", // Temporarily unavailable
  SUSPENDED: "suspended", // Suspended for violations
  BANNED: "banned", // Permanently banned
};

const MERCHANT_TYPES = {
  RETAIL: "retail", // Physical stores
  ECOMMERCE: "ecommerce", // Online stores
  SERVICE: "service", // Service providers
  FOOD: "food", // Restaurants and food vendors
  TRAVEL: "travel", // Travel and hospitality
  EDUCATION: "education", // Educational institutions
  ENTERTAINMENT: "entertainment", // Entertainment venues
  OTHER: "other", // Other business types
};

const MERCHANT_TIERS = {
  BASIC: "basic", // Small businesses
  STANDARD: "standard", // Medium businesses
  PREMIUM: "premium", // Large businesses
  ENTERPRISE: "enterprise", // Custom solutions
};

const MERCHANT_PAYMENT_TYPES = {
  IN_PERSON: "in_person", // Physical store payments
  ONLINE: "online", // E-commerce payments
  INVOICE: "invoice", // Invoice-based payments
  SUBSCRIPTION: "subscription", // Recurring payments
};

const MERCHANT_SETTLEMENT_FREQUENCY = {
  INSTANT: "instant", // Immediate settlement
  DAILY: "daily", // Once per day
  WEEKLY: "weekly", // Once per week
  MONTHLY: "monthly", // Once per month
};

// ============================================
// TOKEN TYPES
// ============================================
const TOKEN_TYPES = {
  NT: "NT", // Naira Token
  CT: "CT", // CFA Token
  USDT: "USDT", // Tether USD
};

// ============================================
// USER ROLES
// ============================================
const USER_ROLES = {
  USER: "user", // Regular platform user
  AGENT: "agent", // Independent agent facilitating exchanges
  MERCHANT: "merchant", // Business accepting tokens
  ADMIN: "admin", // Platform administrator
};

// ============================================
// TRANSACTION TYPES (Using approved terminology)
// ============================================
const TRANSACTION_TYPES = {
  TRANSFER: "transfer", // P2P token transfer
  SWAP: "swap", // Token-to-token exchange
  MINT: "mint", // Token acquisition from agent
  BURN: "burn", // Token exchange to agent for fiat
  COLLECTION: "collection", // Merchant token collection
  CREDIT: "credit", // Manual credit (admin)
  DEBIT: "debit", // Manual debit (admin)
  AGENT_DEPOSIT: "agent_deposit", // ← NEW
  AGENT_WITHDRAWAL: "agent_withdrawal", // ← NEW
};

// ============================================
// WITHDRAWAL STATUS Agent (Using approved terminology)
// ============================================
const WITHDRAWAL_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
};

// ============================================
// TRANSACTION STATUS
// ============================================
const TRANSACTION_STATUS = {
  PENDING: "pending", // Initiated, waiting for action
  PROCESSING: "processing", // In progress
  COMPLETED: "completed", // Successfully finished
  FAILED: "failed", // Failed to complete
  CANCELLED: "cancelled", // User cancelled
  DISPUTED: "disputed", // Under dispute
  REFUNDED: "refunded", // Tokens returned
};

// ============================================
// TOKEN OPERATION TYPES
// ============================================
const TOKEN_OPERATION_TYPES = {
  MINT: "mint",
  BURN: "burn",
  TRANSFER: "transfer",
  SWAP: "swap",
  MERCHANT_PAYMENT: "merchant_payment",
  REFUND: "refund",
};

// ============================================
// AGENT STATUS
// ============================================
const AGENT_STATUS = {
  PENDING: "pending", // Application submitted
  APPROVED: "approved", // Verified and active
  ACTIVE: "active", // Currently accepting exchanges
  INACTIVE: "inactive", // Temporarily unavailable
  SUSPENDED: "suspended", // Suspended for violations
  BANNED: "banned", // Permanently banned
};

// ============================================
// AGENT TIERS
// ============================================
const AGENT_TIERS = {
  STARTER: "starter", // $500 deposit
  STANDARD: "standard", // $1,000 deposit
  PREMIUM: "premium", // $2,500+ deposit
  PLATINUM: "platinum", // Top performers
};

// ============================================
// AGENT ACTIVITY TYPES
// ============================================
const AGENT_ACTIVITY_TYPES = {
  MINT: "mint",
  BURN: "burn",
  DEPOSIT: "deposit",
  WITHDRAW: "withdraw",
  SUSPENSION: "suspension",
  REINSTATEMENT: "reinstatement",
};

// ============================================
// DISPUTE STATUS
// ============================================
const DISPUTE_STATUS = {
  OPEN: "open", // Newly opened
  INVESTIGATING: "investigating", // Under review
  RESOLVED: "resolved", // Resolved in favor of one party
  CLOSED: "closed", // Closed without resolution
};

// ============================================
// DISPUTE TYPES
// ============================================
const DISPUTE_TYPES = {
  AGENT_NO_MINT: "agent_no_mint", // Agent didn't mint after receiving fiat
  AGENT_WRONG_AMOUNT: "agent_wrong_amount", // Agent minted wrong amount
  USER_NO_FIAT: "user_no_fiat", // User claims didn't receive fiat
  DELAYED_SERVICE: "delayed_service", // Agent took too long
  COMMUNICATION: "communication", // Communication issues
};

// ============================================
// MINT REQUEST STATUS
// ============================================
const MINT_REQUEST_STATUS = {
  PENDING: "pending",
  PROOF_SUBMITTED: "proof_submitted",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
};

// ============================================
// BURN REQUEST STATUS
// ============================================
const BURN_REQUEST_STATUS = {
  PENDING: "pending",
  ESCROWED: "escrowed", // NEW: After tokens locked
  FIAT_SENT: "fiat_sent",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
};

// ============================================
// DISPUTE ESCALATION LEVELS
// ============================================
const DISPUTE_ESCALATION_LEVELS = {
  AUTO: "auto", // Automatically escalated (timeout)
  USER_REQUESTED: "user_requested", // User manually escalated
  ADMIN: "admin", // Admin manually escalated
  ARBITRATION: "arbitration", // Escalated to arbitration (final)
};

// ============================================
// EDUCATION MODULES
// ============================================
const EDUCATION_MODULES = {
  WHAT_ARE_TOKENS: "what_are_tokens",
  HOW_AGENTS_WORK: "how_agents_work",
  UNDERSTANDING_VALUE: "understanding_value",
  SAFETY_SECURITY: "safety_security",
};

// ============================================
// VERIFICATION LEVELS
// ============================================
const VERIFICATION_LEVELS = {
  NONE: 0, // No verification
  EMAIL: 1, // Email verified
  PHONE: 2, // Phone verified
  IDENTITY: 3, // ID verified (KYC)
};

// ============================================
// TRANSACTION LIMITS (in USD)
// ============================================
const TRANSACTION_LIMITS = {
  DAILY: {
    [VERIFICATION_LEVELS.EMAIL]: 100,
    [VERIFICATION_LEVELS.PHONE]: 500,
    [VERIFICATION_LEVELS.IDENTITY]: 2000,
  },
  PER_TRANSACTION: {
    [VERIFICATION_LEVELS.EMAIL]: 50,
    [VERIFICATION_LEVELS.PHONE]: 200,
    [VERIFICATION_LEVELS.IDENTITY]: 1000,
  },
};

// ============================================
// PLATFORM FEES (in percentage)
// ============================================
const PLATFORM_FEES = {
  P2P_TRANSFER: 0.5, // 0.5% for peer-to-peer transfers
  TOKEN_SWAP: 1.5, // 1.5% for token swaps
  MERCHANT_COLLECTION: 2.0, // 2% for merchant collections
  AGENT_FACILITATION: 1.0, // 1% for agent-facilitated exchanges
};

// ============================================
// PLATFORM CONFIGURATION
// ============================================
const PLATFORM_CONFIG = {
  SYSTEM_USER_EMAIL: process.env.PLATFORM_USER_EMAIL || "platform@afritoken.com",
  FEE_COLLECTION_ENABLED: process.env.FEE_COLLECTION_ENABLED !== "false", // Default: true
};

// ============================================
// AGENT CONFIGURATION
// ============================================
const AGENT_CONFIG = {
  MIN_DEPOSIT_USD: parseInt(process.env.AGENT_MIN_DEPOSIT_USD) || 500,
  RECOMMENDED_DEPOSIT_USD:
    parseInt(process.env.AGENT_RECOMMENDED_DEPOSIT_USD) || 1000,
  PREMIUM_DEPOSIT_USD: parseInt(process.env.AGENT_PREMIUM_DEPOSIT_USD) || 2500,
  RATE_DEVIATION_PERCENT:
    parseInt(process.env.AGENT_RATE_DEVIATION_PERCENT) || 5,
  MAX_PENDING_EXCHANGES: 10,
  RESPONSE_TIME_LIMIT_MINUTES: 15,
};

// ============================================
// ESCROW CONFIGURATION
// ============================================
const ESCROW_CONFIG = {
  TIMEOUT_HOURS: parseInt(process.env.ESCROW_TIMEOUT_HOURS) || 1, // Reduced to 1h default
  AUTO_DISPUTE_HOURS: parseInt(process.env.AUTO_DISPUTE_DELAY_HOURS) || 1,
  MAX_ESCROW_AMOUNT_USD: 5000,
};

// ============================================
// ESCROW STATUS
// ============================================
const ESCROW_STATUS = {
  LOCKED: "locked", // Tokens locked in escrow
  COMPLETED: "completed", // Escrow process completed successfully
  REFUNDED: "refunded", // Funds refunded to user
  DISPUTED: "disputed", // Escrow moved to dispute process
  CANCELLED: "cancelled", // Cancelled by user or system
  // Optional: keep extended statuses if used elsewhere
  PENDING: "pending",
  FUNDED: "funded",
  RELEASED: "released",
  EXPIRED: "expired",
};

// ============================================
// EDUCATION CONFIGURATION
// ============================================
const EDUCATION_CONFIG = {
  REQUIRED: process.env.EDUCATION_REQUIRED === "true",
  PASS_SCORE: parseInt(process.env.EDUCATION_PASS_SCORE) || 80,
  MAX_ATTEMPTS: parseInt(process.env.EDUCATION_MAX_ATTEMPTS) || 5,
  MODULES_REQUIRED_FOR_MINT: [EDUCATION_MODULES.WHAT_ARE_TOKENS],
  MODULES_REQUIRED_FOR_BURN: [
    EDUCATION_MODULES.WHAT_ARE_TOKENS,
    EDUCATION_MODULES.HOW_AGENTS_WORK,
  ],
};

// ============================================
// CACHE KEYS (with TTL in seconds)
// ============================================
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:${userId}`,
  USER_WALLETS: (userId) => `wallets:${userId}`,
  EXCHANGE_RATES: "rates:current",
  AGENT_LIST: (country) => `agents:${country}`,
  TRANSACTION: (txId) => `tx:${txId}`,

  // TTL values
  TTL: {
    USER_PROFILE: 3600, // 1 hour
    USER_WALLETS: 300, // 5 minutes
    EXCHANGE_RATES: 300, // 5 minutes
    AGENT_LIST: 600, // 10 minutes
    TRANSACTION: 1800, // 30 minutes
  },
};

// ============================================
// EMAIL TEMPLATES
// ============================================
const EMAIL_TEMPLATES = {
  WELCOME: "welcome",
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset",
  TRANSACTION_RECEIPT: "transaction_receipt",
  AGENT_APPROVAL: "agent_approval",
  DISPUTE_OPENED: "dispute_opened",
  DISPUTE_RESOLVED: "dispute_resolved",
};

// ============================================
// NOTIFICATION CHANNELS (how we send)
// ============================================
const NOTIFICATION_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  IN_APP: "in_app",
};

// Legacy alias
const NOTIFICATION_TYPES = NOTIFICATION_CHANNELS;

// ============================================
// NOTIFICATION EVENT TYPES (inbox + preferences)
// ============================================
const NOTIFICATION_EVENT_TYPES = {
  // User-facing
  TOKENS_MINTED: "TOKENS_MINTED",
  MINT_REJECTED: "MINT_REJECTED",
  BURN_REJECTED: "BURN_REJECTED",
  FIAT_SENT: "FIAT_SENT",
  BURN_CONFIRMED: "BURN_CONFIRMED",
  // Agent-facing
  NEW_MINT_REQUEST: "NEW_MINT_REQUEST",
  NEW_BURN_REQUEST: "NEW_BURN_REQUEST",
  DEPOSIT_CONFIRMED: "DEPOSIT_CONFIRMED",
  WITHDRAWAL_REQUESTED: "WITHDRAWAL_REQUESTED",
  WITHDRAWAL_APPROVED: "WITHDRAWAL_APPROVED",
  WITHDRAWAL_REJECTED: "WITHDRAWAL_REJECTED",
  WITHDRAWAL_PAID: "WITHDRAWAL_PAID",
  NEW_REVIEW: "NEW_REVIEW",
  // Security (future)
  SECURITY_LOGIN: "SECURITY_LOGIN",
  SECURITY_PASSWORD: "SECURITY_PASSWORD",
  // Marketing (future)
  MARKETING_PROMO: "MARKETING_PROMO",
};

// Event type -> preference category (for granular push/email flags)
const NOTIFICATION_CATEGORY = {
  transactions: [
    NOTIFICATION_EVENT_TYPES.TOKENS_MINTED,
    NOTIFICATION_EVENT_TYPES.MINT_REJECTED,
    NOTIFICATION_EVENT_TYPES.BURN_REJECTED,
    NOTIFICATION_EVENT_TYPES.BURN_CONFIRMED,
  ],
  requests: [
    NOTIFICATION_EVENT_TYPES.NEW_MINT_REQUEST,
    NOTIFICATION_EVENT_TYPES.NEW_BURN_REQUEST,
    NOTIFICATION_EVENT_TYPES.FIAT_SENT,
  ],
  agent_updates: [
    NOTIFICATION_EVENT_TYPES.DEPOSIT_CONFIRMED,
    NOTIFICATION_EVENT_TYPES.WITHDRAWAL_REQUESTED,
    NOTIFICATION_EVENT_TYPES.WITHDRAWAL_APPROVED,
    NOTIFICATION_EVENT_TYPES.WITHDRAWAL_REJECTED,
    NOTIFICATION_EVENT_TYPES.WITHDRAWAL_PAID,
    NOTIFICATION_EVENT_TYPES.NEW_REVIEW,
  ],
  security: [
    NOTIFICATION_EVENT_TYPES.SECURITY_LOGIN,
    NOTIFICATION_EVENT_TYPES.SECURITY_PASSWORD,
  ],
  marketing: [NOTIFICATION_EVENT_TYPES.MARKETING_PROMO],
};

// ============================================
// SUPPORTED COUNTRIES
// ============================================
const COUNTRIES = {
  NIGERIA: "NG",
  BENIN: "BJ",
  BURKINA_FASO: "BF",
  IVORY_COAST: "CI",
  MALI: "ML",
  NIGER: "NE",
  SENEGAL: "SN",
  TOGO: "TG",
};

const COUNTRY_DETAILS = {
  [COUNTRIES.NIGERIA]: { name: "Nigeria", currency: "NGN" },
  [COUNTRIES.BENIN]: { name: "Benin", currency: "XOF" },
  [COUNTRIES.BURKINA_FASO]: { name: "Burkina Faso", currency: "XOF" },
  [COUNTRIES.IVORY_COAST]: { name: "Côte d'Ivoire", currency: "XOF" },
  [COUNTRIES.MALI]: { name: "Mali", currency: "XOF" },
  [COUNTRIES.NIGER]: { name: "Niger", currency: "XOF" },
  [COUNTRIES.SENEGAL]: { name: "Senegal", currency: "XOF" },
  [COUNTRIES.TOGO]: { name: "Togo", currency: "XOF" },
};

// ============================================
// SUPPORTED CURRENCIES
// ============================================
const CURRENCIES = {
  NGN: "NGN", // Nigerian Naira
  XOF: "XOF", // West African CFA Franc
  USD: "USD", // US Dollar
};

// Token to currency mapping
const TOKEN_CURRENCY_MAP = {
  [TOKEN_TYPES.NT]: CURRENCIES.NGN,
  [TOKEN_TYPES.CT]: CURRENCIES.XOF,
  [TOKEN_TYPES.USDT]: CURRENCIES.USD,
};

// ============================================
// EXCHANGE RATES (Default rates - Admin can update)
// ============================================
const EXCHANGE_RATES = {
  // Base rates (1 token = X of target token)
  // NT_TO_CT: 1.0, // 1 NT = 1 CT (default 1:1)
  // NT_TO_USDT: 1.0, // 1 NT = 1 USDT (default 1:1)
  // CT_TO_NT: 1.0, // 1 CT = 1 NT (default 1:1)
  // CT_TO_USDT: 1.0, // 1 CT = 1 USDT (default 1:1)
  // USDT_TO_NT: 1.0, // 1 USDT = 1 NT (default 1:1)
  // USDT_TO_CT: 1.0, // 1 USDT = 1 CT (default 1:1)

  NT_TO_CT: 0.37, // 1 NT = 1 CT (default 1:1)
  NT_TO_USDT: 0.00067, // 1 NT = 1 USDT (default 1:1)
  CT_TO_NT: 2.7, // 1 CT = 1 NT (default 1:1)
  CT_TO_USDT: 0.00177, // 1 CT = 1 USDT (default 1:1)
  USDT_TO_NT: 1500, // 1 USDT = 1 NT (default 1:1)
  USDT_TO_CT: 565, // 1 USDT = 1 CT (default 1:1)

  // Fiat exchange rates (for reference - updated by admin)
  NGN_TO_USD: 0.00067, // 1 NGN ≈ 0.0013 USD (example rate)
  XOF_TO_USD: 0.00177, // 1 XOF ≈ 0.0017 USD (example rate)
  USD_TO_NGN: 1500, // 1 USD ≈ 770 NGN (example rate)
  USD_TO_XOF: 565, // 1 USD ≈ 600 XOF (example rate)
};

// Helper function to get exchange rate
const getExchangeRate = (fromToken, toToken) => {
  if (fromToken === toToken) return 1.0;

  const rateKey = `${fromToken}_TO_${toToken}`;
  return EXCHANGE_RATES[rateKey] || 1.0; // Default to 1:1 if not found
};

// ============================================
// PAYMENT METHODS (for fiat transfers)
// ============================================
const PAYMENT_METHODS = {
  BANK_TRANSFER: "bank_transfer",
  MOBILE_MONEY: "mobile_money",
};

// Nigerian payment providers
const NIGERIAN_PROVIDERS = [
  "GTBank",
  "Access Bank",
  "First Bank",
  "UBA",
  "Zenith Bank",
  "Opay",
  "Palmpay",
  "Kuda",
  "Moniepoint",
];

// XOF payment providers (mobile money dominant in XOF countries)
const XOF_PROVIDERS = [
  "Orange Money",
  "MTN Mobile Money",
  "Moov Money",
  "Wave",
  "Kiren Money",
];

// ============================================
// RESPONSE MESSAGES (Regulatory-safe)
// ============================================
const RESPONSE_MESSAGES = {
  // Success messages
  SUCCESS: {
    PROFILE_CREATED: "Profile created successfully",
    TOKEN_TRANSFER_COMPLETED: "Token transfer completed successfully",
    TOKEN_SWAP_COMPLETED: "Token swap completed successfully",
    EXCHANGE_INITIATED: "Exchange initiated with agent",
    VERIFICATION_SENT: "Verification code sent to your email",
    EDUCATION_COMPLETED: "Education module completed",
  },

  // Error messages (using approved terminology)
  ERROR: {
    INSUFFICIENT_TOKENS: "Insufficient token balance",
    INVALID_RECIPIENT: "Invalid recipient address",
    AGENT_NO_CAPACITY: "Agent does not have sufficient capacity",
    EDUCATION_REQUIRED: "Please complete required education modules first",
    VERIFICATION_REQUIRED: "Email verification required",
    TRANSACTION_FAILED: "Transaction failed to complete",
    RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later",
    INVALID_CREDENTIALS: "Invalid email or password",
    TOKEN_NOT_FOUND: "Token type not supported",
    EXCHANGE_TIMEOUT: "Exchange request timed out",
  },

  // Regulatory-safe explanations
  EDUCATION: {
    TOKENS_NOT_MONEY:
      "Tokens are digital assets that represent value on our platform, not actual currency",
    AGENTS_ARE_INDEPENDENT:
      "Agents are independent contractors who facilitate token-fiat exchanges",
    PLATFORM_ROLE:
      "AfriToken provides the technology platform; exchanges occur between users and agents",
    ESCROW_PROTECTION:
      "Your tokens are protected by smart contract escrow during exchanges",
  },
};

// ============================================
// REGEX PATTERNS
// ============================================
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  ETHEREUM_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
};

// ============================================
// API RESPONSE CODES
// ============================================
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ============================================
// BLOCKCHAIN CONFIGURATION
// ============================================
const BLOCKCHAIN_CONFIG = {
  CONFIRMATION_BLOCKS: 6,
  GAS_LIMIT: parseInt(process.env.GAS_LIMIT) || 300000,
  GAS_PRICE_MULTIPLIER: parseFloat(process.env.GAS_PRICE_MULTIPLIER) || 1.2,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
};

// ============================================
// LOGGER LEVELS
// ============================================
const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  HTTP: "http",
  DEBUG: "debug",
};

// ============================================
// ENVIRONMENT FLAGS
// ============================================
const ENV = {
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
  IS_TEST: process.env.NODE_ENV === "test",
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  MERCHANT_STATUS,
  MERCHANT_TYPES,
  MERCHANT_TIERS,
  MERCHANT_PAYMENT_TYPES,
  MERCHANT_SETTLEMENT_FREQUENCY,
  TOKEN_TYPES,
  USER_ROLES,
  TRANSACTION_TYPES,
  WITHDRAWAL_STATUS,
  TRANSACTION_STATUS,
  TOKEN_OPERATION_TYPES,
  AGENT_STATUS,
  AGENT_TIERS,
  AGENT_ACTIVITY_TYPES,
  DISPUTE_STATUS,
  DISPUTE_TYPES,
  MINT_REQUEST_STATUS,
  BURN_REQUEST_STATUS,
  DISPUTE_ESCALATION_LEVELS,
  EDUCATION_MODULES,
  VERIFICATION_LEVELS,
  TRANSACTION_LIMITS,
  PLATFORM_FEES,
  PLATFORM_CONFIG,
  AGENT_CONFIG,
  ESCROW_CONFIG,
  ESCROW_STATUS,
  EDUCATION_CONFIG,
  CACHE_KEYS,
  EMAIL_TEMPLATES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_CATEGORY,
  COUNTRIES,
  COUNTRY_DETAILS,
  CURRENCIES,
  TOKEN_CURRENCY_MAP,
  EXCHANGE_RATES,
  getExchangeRate,
  PAYMENT_METHODS,
  NIGERIAN_PROVIDERS,
  XOF_PROVIDERS,
  RESPONSE_MESSAGES,
  REGEX_PATTERNS,
  HTTP_STATUS,
  BLOCKCHAIN_CONFIG,
  LOG_LEVELS,
  ENV,
};