// Create or reuse the dedicated AfriExchange merchant used by RentHub.
// To run: node src/scripts/create_renthub_merchant.js

require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User, Wallet, Merchant } = require("../models");
const {
  MERCHANT_STATUS,
  MERCHANT_TYPES,
  TOKEN_TYPES,
  USER_ROLES,
} = require("../config/constants");

const RENTHUB_EMAIL =
  process.env.RENTHUB_MERCHANT_EMAIL || "renthub@afriexchange.local";
const RENTHUB_PASSWORD =
  process.env.RENTHUB_MERCHANT_PASSWORD ||
  `RentHub-${crypto.randomBytes(12).toString("hex")}`;
const RENTHUB_BUSINESS_NAME =
  process.env.RENTHUB_MERCHANT_BUSINESS_NAME || "RentHub";
const RENTHUB_DISPLAY_NAME =
  process.env.RENTHUB_MERCHANT_DISPLAY_NAME || "RentHub";
const RENTHUB_COUNTRY = process.env.RENTHUB_MERCHANT_COUNTRY || "NG";
const RENTHUB_CITY = process.env.RENTHUB_MERCHANT_CITY || "Lagos";
const RENTHUB_PHONE = process.env.RENTHUB_MERCHANT_PHONE || "+2340000000000";

const makeWalletAddress = () => `0x${crypto.randomBytes(20).toString("hex")}`;

async function ensureRentHubMerchant() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected");

    // ── 1. User ──────────────────────────────────────────────────────────────
    let user = await User.findOne({ where: { email: RENTHUB_EMAIL } });

    if (!user) {
      user = await User.create({
        email: RENTHUB_EMAIL,
        password_hash: RENTHUB_PASSWORD,
        full_name: "RentHub Integration",
        phone_number: RENTHUB_PHONE,
        country_code: RENTHUB_COUNTRY,
        role: USER_ROLES.MERCHANT,
        email_verified: true,
        phone_verified: true,
        identity_verified: true,
        verification_level: 3,
        is_active: true,
      });
      console.log(`Created RentHub integration user: ${RENTHUB_EMAIL}`);
      console.log(`- initial password: ${RENTHUB_PASSWORD}`);
    } else {
      user.role = USER_ROLES.MERCHANT;
      user.email_verified = true;
      user.phone_verified = true;
      user.identity_verified = true;
      user.verification_level = Math.max(user.verification_level || 0, 3);
      user.is_active = true;
      await user.save();
      console.log(`Reused RentHub integration user: ${RENTHUB_EMAIL}`);
      if (!process.env.RENTHUB_MERCHANT_PASSWORD) {
        console.log(
          "No RENTHUB_MERCHANT_PASSWORD set in .env — existing password unchanged."
        );
        console.log(
          "Run `npm run reset:renthub-merchant-password` to set and print a fresh login password."
        );
      }
    }

    // ── 2. Settlement Wallets (NT for Nigeria / RentHub, CT for CFA) ──────────
    let ntWallet = await Wallet.findOne({
      where: { user_id: user.id, token_type: TOKEN_TYPES.NT },
    });

    if (!ntWallet) {
      ntWallet = await Wallet.create({
        user_id: user.id,
        token_type: TOKEN_TYPES.NT,
        blockchain_address: makeWalletAddress(),
        encrypted_private_key: crypto.randomBytes(64).toString("hex"),
        balance: 100000000, // Pre-fund 100M test NT balance for automated escrow dispatches
        pending_balance: 0,
        is_active: true,
      });
      console.log(`Created NT settlement wallet: ${ntWallet.id} (pre-funded for testing)`);
    } else {
      console.log(`Reused NT settlement wallet: ${ntWallet.id}`);
    }

    let ctWallet = await Wallet.findOne({
      where: { user_id: user.id, token_type: TOKEN_TYPES.CT },
    });

    if (!ctWallet) {
      ctWallet = await Wallet.create({
        user_id: user.id,
        token_type: TOKEN_TYPES.CT,
        blockchain_address: makeWalletAddress(),
        encrypted_private_key: crypto.randomBytes(64).toString("hex"),
        balance: 0,
        pending_balance: 0,
        is_active: true,
      });
      console.log(`Created CT settlement wallet: ${ctWallet.id}`);
    }

    // ── 3. Merchant record ──────────────────────────────────────────────────
    let merchant = await Merchant.findOne({
      where: {
        user_id: user.id,
        business_name: RENTHUB_BUSINESS_NAME,
      },
    });

    if (!merchant) {
      merchant = await Merchant.create({
        user_id: user.id,
        business_name: RENTHUB_BUSINESS_NAME,
        display_name: RENTHUB_DISPLAY_NAME,
        business_type: MERCHANT_TYPES.ECOMMERCE,
        description:
          "Dedicated merchant settlement account for RentHub escrow rent collection (Nigeria).",
        business_email: RENTHUB_EMAIL,
        business_phone: RENTHUB_PHONE,
        country: RENTHUB_COUNTRY,
        city: RENTHUB_CITY,
        address: "RentHub integration settlement profile",
        settlement_wallet_id: ntWallet.id,
        default_token_type: TOKEN_TYPES.NT,
        verification_status: MERCHANT_STATUS.APPROVED,
      });

      await merchant.generateApiKey();
      console.log(`Created RentHub merchant: ${merchant.id}`);
    } else {
      merchant.settlement_wallet_id = ntWallet.id;
      merchant.default_token_type = TOKEN_TYPES.NT;
      merchant.verification_status = MERCHANT_STATUS.APPROVED;
      merchant.business_email = merchant.business_email || RENTHUB_EMAIL;
      merchant.business_phone = merchant.business_phone || RENTHUB_PHONE;
      await merchant.save();
      console.log(`Reused RentHub merchant: ${merchant.id}`);
    }

    // ── 4. Generate & display the API key ────────────────────────────────────
    // The api_key is generated/stored by merchant.generateApiKey() above.
    // Reload to get the plain-text key (only available right after generation).
    const freshMerchant = await Merchant.findByPk(merchant.id);
    const apiKey = freshMerchant?.api_key || merchant.api_key || "(see DB — key already hashed)";

    console.log("");
    console.log("=".repeat(60));
    console.log("✅  RentHub Merchant Created / Confirmed");
    console.log("=".repeat(60));
    console.log("");
    console.log("Add these to renthub/apps/api/.env:");
    console.log(`  AFRIEXCHANGE_API_URL=http://localhost:5001/api/v1`);
    console.log(`  RENTHUB_AFRIEXCHANGE_API_KEY=${apiKey}`);
    console.log(`  AFRIEXCHANGE_LINKED_MERCHANT_ID=${merchant.id}`);
    console.log(`  AFRIEXCHANGE_LINKED_MERCHANT_NAME=${RENTHUB_BUSINESS_NAME}`);
    console.log(
      `  AFRIEXCHANGE_WEBHOOK_CALLBACK_URL=http://localhost:5001/api/afriexchange/webhooks`
    );
    console.log("");
    console.log("Also add to AfriExchange/afriX_backend/.env:");
    console.log(`  RENTHUB_AFRIEXCHANGE_MERCHANT_ID=${merchant.id}`);
    console.log("");
    console.log("Merchant details:");
    console.log(`  - merchant_id:          ${merchant.id}`);
    console.log(`  - user_id:              ${user.id}`);
    console.log(`  - settlement_wallet_id: ${wallet.id}`);
    console.log(`  - token_type:           ${merchant.default_token_type}`);
    console.log(`  - verification_status:  ${merchant.verification_status}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create RentHub merchant:", error);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close errors.
    }
    process.exit(1);
  }
}

ensureRentHubMerchant();
