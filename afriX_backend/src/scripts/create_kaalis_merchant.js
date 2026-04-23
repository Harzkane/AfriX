// Create or reuse the dedicated AfriExchange merchant used by Kaalis.
// To run: node src/scripts/create_kaalis_merchant.js
require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User, Wallet, Merchant } = require("../models");
const {
  MERCHANT_STATUS,
  MERCHANT_TYPES,
  TOKEN_TYPES,
  USER_ROLES,
} = require("../config/constants");

const KAALIS_EMAIL = process.env.KAALIS_MERCHANT_EMAIL || "kaalis@afriexchange.local";
const KAALIS_PASSWORD =
  process.env.KAALIS_MERCHANT_PASSWORD || `Kaalis-${crypto.randomBytes(12).toString("hex")}`;
const KAALIS_BUSINESS_NAME =
  process.env.KAALIS_MERCHANT_BUSINESS_NAME || "Kaalis Store";
const KAALIS_DISPLAY_NAME =
  process.env.KAALIS_MERCHANT_DISPLAY_NAME || "Kaalis";
const KAALIS_COUNTRY = process.env.KAALIS_MERCHANT_COUNTRY || "SN";
const KAALIS_CITY = process.env.KAALIS_MERCHANT_CITY || "Dakar";
const KAALIS_PHONE = process.env.KAALIS_MERCHANT_PHONE || "+221000000000";

const makeWalletAddress = () => `0x${crypto.randomBytes(20).toString("hex")}`;

async function ensureKaalisMerchant() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected");

    let user = await User.findOne({ where: { email: KAALIS_EMAIL } });

    if (!user) {
      user = await User.create({
        email: KAALIS_EMAIL,
        password_hash: KAALIS_PASSWORD,
        full_name: "Kaalis Store Integration",
        phone_number: KAALIS_PHONE,
        country_code: KAALIS_COUNTRY,
        role: USER_ROLES.MERCHANT,
        email_verified: true,
        phone_verified: true,
        identity_verified: true,
        verification_level: 3,
        is_active: true,
      });
      console.log(`Created Kaalis integration user: ${KAALIS_EMAIL}`);
    } else {
      user.role = USER_ROLES.MERCHANT;
      user.email_verified = true;
      user.phone_verified = true;
      user.identity_verified = true;
      user.verification_level = Math.max(user.verification_level || 0, 3);
      user.is_active = true;
      await user.save();
      console.log(`Reused Kaalis integration user: ${KAALIS_EMAIL}`);
    }

    let wallet = await Wallet.findOne({
      where: { user_id: user.id, token_type: TOKEN_TYPES.CT },
    });

    if (!wallet) {
      wallet = await Wallet.create({
        user_id: user.id,
        token_type: TOKEN_TYPES.CT,
        blockchain_address: makeWalletAddress(),
        encrypted_private_key: crypto.randomBytes(64).toString("hex"),
        balance: 0,
        pending_balance: 0,
        is_active: true,
      });
      console.log(`Created CT settlement wallet: ${wallet.id}`);
    } else {
      console.log(`Reused CT settlement wallet: ${wallet.id}`);
    }

    let merchant = await Merchant.findOne({
      where: {
        user_id: user.id,
        business_name: KAALIS_BUSINESS_NAME,
      },
    });

    if (!merchant) {
      merchant = await Merchant.create({
        user_id: user.id,
        business_name: KAALIS_BUSINESS_NAME,
        display_name: KAALIS_DISPLAY_NAME,
        business_type: MERCHANT_TYPES.ECOMMERCE,
        description: "Dedicated merchant settlement account for Kaalis Store XOF checkout.",
        business_email: KAALIS_EMAIL,
        business_phone: KAALIS_PHONE,
        country: KAALIS_COUNTRY,
        city: KAALIS_CITY,
        address: "Kaalis Store integration settlement profile",
        settlement_wallet_id: wallet.id,
        default_token_type: TOKEN_TYPES.CT,
        verification_status: MERCHANT_STATUS.APPROVED,
      });

      await merchant.generateApiKey();
      console.log(`Created Kaalis merchant: ${merchant.id}`);
    } else {
      merchant.settlement_wallet_id = wallet.id;
      merchant.default_token_type = TOKEN_TYPES.CT;
      merchant.verification_status = MERCHANT_STATUS.APPROVED;
      merchant.business_email = merchant.business_email || KAALIS_EMAIL;
      merchant.business_phone = merchant.business_phone || KAALIS_PHONE;
      await merchant.save();
      console.log(`Reused Kaalis merchant: ${merchant.id}`);
    }

    console.log("");
    console.log("Use this in AfriExchange/afriX_backend/.env:");
    console.log(`KAALIS_AFRIEXCHANGE_MERCHANT_ID=${merchant.id}`);
    console.log("");
    console.log("Merchant details:");
    console.log(`- merchant_id: ${merchant.id}`);
    console.log(`- user_id: ${user.id}`);
    console.log(`- settlement_wallet_id: ${wallet.id}`);
    console.log(`- token_type: ${merchant.default_token_type}`);
    console.log(`- verification_status: ${merchant.verification_status}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create Kaalis merchant:", error);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close errors while reporting the original failure.
    }
    process.exit(1);
  }
}

ensureKaalisMerchant();



//  npm run seed:kaalis-merchant

// > afrix_backend@1.0.0 seed:kaalis-merchant
// > node src/scripts/create_kaalis_merchant.js

// [dotenv@17.2.3] injecting env (112) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
// [dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️  override existing env vars with { override: true }
// Connecting to AfriExchange database...
// Database connected
// Created Kaalis integration user: kaalis@afriexchange.local
// Created CT settlement wallet: 406f10b4-58c2-48c0-8a60-78bf81bf4e9e
// Created Kaalis merchant: 04b76353-6d94-419d-9b10-4e84161575c1

// Use this in AfriExchange/afriX_backend/.env:
// KAALIS_AFRIEXCHANGE_MERCHANT_ID=04b76353-6d94-419d-9b10-4e84161575c1

// Merchant details:
// - merchant_id: 04b76353-6d94-419d-9b10-4e84161575c1
// - user_id: f228ef75-c18d-495e-8295-eb61832c219c
// - settlement_wallet_id: 406f10b4-58c2-48c0-8a60-78bf81bf4e9e
// - token_type: CT
// - verification_status: approved