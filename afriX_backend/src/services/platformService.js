// File: src/services/platformService.js

/**
 * Platform Service
 * 
 * Manages platform system user and fee collection wallets.
 * The platform user owns all fee collection wallets (NT, CT, USDT).
 */

const { User, Wallet } = require("../models");
const { TOKEN_TYPES, PLATFORM_CONFIG } = require("../config/constants");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Lazy-load walletService to avoid circular dependency (walletService → platformService → walletService)
function getWalletService() {
  return require("./walletService");
}

// Cache platform user and wallets to avoid repeated DB queries
let platformUserCache = null;
let platformWalletsCache = null;

/**
 * Get or create platform system user
 * This user owns all platform fee wallets
 */
async function getPlatformUser() {
  if (platformUserCache) {
    return platformUserCache;
  }

  const platformEmail = PLATFORM_CONFIG.SYSTEM_USER_EMAIL;
  
  // Check if platform user exists
  let platformUser = await User.findOne({
    where: { email: platformEmail },
  });

  if (!platformUser) {
    // Create platform user with secure random password
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    platformUser = await User.create({
      email: platformEmail,
      password_hash: passwordHash, // Random; not stored anywhere. This account must never be used to log in.
      full_name: "AfriToken Platform",
      country_code: "NG", // Default to Nigeria
      role: "admin",
      email_verified: true,
      phone_verified: false,
      identity_verified: false,
      verification_level: 0,
      is_active: true,
    });

    console.log(`✅ Platform system user created: ${platformEmail}`);
  }

  platformUserCache = platformUser;
  return platformUser;
}

/**
 * Get or create platform wallets for NT, CT, USDT
 * Returns object with token_type as key and Wallet as value
 */
async function getPlatformWallets(transaction = null) {
  if (platformWalletsCache && !transaction) {
    return platformWalletsCache;
  }

  const platformUser = await getPlatformUser();
  const walletService = getWalletService();
  const wallets = {};

  // Create wallets for each token type
  for (const tokenType of Object.values(TOKEN_TYPES)) {
    wallets[tokenType] = await walletService.getOrCreateWallet(
      platformUser.id,
      tokenType,
      transaction
    );
  }

  if (!transaction) {
    platformWalletsCache = wallets;
  }

  return wallets;
}

/**
 * Get platform wallet for a specific token type
 */
async function getPlatformWallet(tokenType, transaction = null) {
  const wallets = await getPlatformWallets(transaction);
  return wallets[tokenType];
}

/**
 * Collect fee to platform wallet
 * This is a helper function used by transaction services
 */
async function collectFee({
  tokenType,
  feeAmount,
  transactionType,
  transactionId = null,
  dbTransaction = null,
}) {
  if (!PLATFORM_CONFIG.FEE_COLLECTION_ENABLED) {
    console.warn("⚠️ Fee collection is disabled in config");
    return null;
  }

  if (!feeAmount || parseFloat(feeAmount) <= 0) {
    return null; // No fee to collect
  }

  const platformWallet = await getPlatformWallet(tokenType, dbTransaction);
  const fee = parseFloat(feeAmount);

  // Credit platform wallet
  const currentBalance = parseFloat(platformWallet.balance) || 0;
  platformWallet.balance = currentBalance + fee;
  platformWallet.total_received = (parseFloat(platformWallet.total_received) || 0) + fee;
  platformWallet.transaction_count += 1;

  await platformWallet.save({ transaction: dbTransaction });

  // Update cache if not in a transaction
  if (!dbTransaction && platformWalletsCache) {
    platformWalletsCache[tokenType] = platformWallet;
  }

  console.log(
    `💰 Fee collected: ${fee} ${tokenType} (${transactionType}) → Platform wallet`
  );

  return platformWallet;
}

/**
 * Get platform fee balances for all token types.
 * Reads directly from DB so balances are always current (avoids stale cache
 * when fees were collected inside a transaction and cache wasn't updated).
 */
async function getPlatformFeeBalances() {
  const platformUser = await getPlatformUser();
  const rows = await Wallet.findAll({
    where: { user_id: platformUser.id },
    attributes: ["token_type", "balance"],
    raw: true,
  });
  const result = { NT: 0, CT: 0, USDT: 0 };
  (rows || []).forEach((r) => {
    const key = r.token_type || "NT";
    if (result[key] !== undefined) {
      result[key] = parseFloat(r.balance) || 0;
    }
  });
  return result;
}

/**
 * Clear cache (useful for testing or after manual updates)
 */
function clearCache() {
  platformUserCache = null;
  platformWalletsCache = null;
}

module.exports = {
  getPlatformUser,
  getPlatformWallets,
  getPlatformWallet,
  collectFee,
  getPlatformFeeBalances,
  clearCache,
};
