#!/usr/bin/env node
/**
 * One-time script: Initialize platform system user and fee collection wallets
 * Run: node scripts/init-platform-user.js
 * (Run from afriX_backend directory, with .env loaded)
 *
 * Platform user (platform@afritoken.com):
 * - No password needed: this account must never be used to log in.
 * - A random password is set and not stored anywhere, so the account cannot be used for login.
 * - It exists only to own the platform fee wallets (NT, CT, USDT).
 */

require("dotenv").config();
const path = require("path");

// Ensure we load .env from backend root
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  console.log("Initializing platform system user and wallets...\n");

  const { sequelize } = require("../src/config/database");
  await sequelize.authenticate();
  console.log("Database connected.\n");

  const platformService = require("../src/services/platformService");

  try {
    const platformUser = await platformService.getPlatformUser();
    console.log("Platform user:", {
      id: platformUser.id,
      email: platformUser.email,
      full_name: platformUser.full_name,
      role: platformUser.role,
    });

    const wallets = await platformService.getPlatformWallets();
    console.log("\nPlatform fee wallets:");
    for (const [tokenType, wallet] of Object.entries(wallets)) {
      console.log(`  ${tokenType}: wallet_id=${wallet.id}, balance=${wallet.balance}, address=${wallet.blockchain_address}`);
    }

    const balances = await platformService.getPlatformFeeBalances();
    console.log("\nPlatform fee balances:", balances);
    console.log("\n✅ Platform user and wallets ready.");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
