// cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend
// npm run reset:kaalis-merchant-password

// Kaalis merchant password reset successfully.
// - email: kaalis@afriexchange.local
// - password: Kaalis-047b9865daefbd086c771826

require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User } = require("../models");
const { USER_ROLES } = require("../config/constants");

const KAALIS_EMAIL =
  process.env.KAALIS_MERCHANT_EMAIL || "kaalis@afriexchange.local";
const nextPassword =
  process.env.KAALIS_MERCHANT_PASSWORD ||
  `Kaalis-${crypto.randomBytes(12).toString("hex")}`;

async function resetKaalisMerchantPassword() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected");

    const user = await User.findOne({
      where: { email: KAALIS_EMAIL.toLowerCase() },
    });

    if (!user) {
      throw new Error(
        `Merchant user not found for ${KAALIS_EMAIL}. Run npm run seed:kaalis-merchant first.`
      );
    }

    user.role = USER_ROLES.MERCHANT;
    user.is_active = true;
    user.password_hash = nextPassword;
    await user.save();

    console.log("");
    console.log("Kaalis merchant password reset successfully.");
    console.log(`- email: ${user.email}`);
    console.log(`- password: ${nextPassword}`);
    console.log("");
    console.log("Merchant login URL:");
    console.log("- http://localhost:3000/merchant/login");
    console.log("");
    console.log(
      "Tip: Set KAALIS_MERCHANT_PASSWORD in .env before running this script if you want a stable known password."
    );

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to reset Kaalis merchant password:", error);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close errors while reporting the original failure.
    }
    process.exit(1);
  }
}

resetKaalisMerchantPassword();


// ❯ npm run seed:kaalis-merchant

// > afrix_backend@1.0.0 seed:kaalis-merchant
// > node src/scripts/create_kaalis_merchant.js

// [dotenv@17.2.3] injecting env (124) from .env -- tip: 📡 add observability to secrets: https://dotenvx.com/ops
// [dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
// Connecting to AfriExchange database...
// Database connected
// Created Kaalis integration user: kaalis@afriexchange.local
// - initial password: Kaalis-047b9865daefbd086c771826
// Created CT settlement wallet: d5c1a635-4059-4e3a-b750-f58dda77f6df
// Created Kaalis merchant: 0ebdf855-b7f0-4c5e-8c7e-557407aa692d

// Use this in AfriExchange/afriX_backend/.env:
// KAALIS_AFRIEXCHANGE_MERCHANT_ID=0ebdf855-b7f0-4c5e-8c7e-557407aa692d

// Merchant details:
// - merchant_id: 0ebdf855-b7f0-4c5e-8c7e-557407aa692d
// - user_id: f91992b4-0a4b-4e45-9158-7d070a9778dc
// - settlement_wallet_id: d5c1a635-4059-4e3a-b750-f58dda77f6df
// - token_type: CT
// - verification_status: approved