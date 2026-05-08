// Create or reuse a dedicated Path A pilot merchant for remote integration tests.
// To run: npm run seed:path-a-pilot-merchant

require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User, Wallet, Merchant } = require("../models");
const {
  MERCHANT_STATUS,
  MERCHANT_TYPES,
  TOKEN_TYPES,
  USER_ROLES,
} = require("../config/constants");

const MERCHANT_EMAIL =
  process.env.PATH_A_PILOT_MERCHANT_EMAIL || "path-a-pilot@afriexchange.local";
const MERCHANT_PASSWORD =
  process.env.PATH_A_PILOT_MERCHANT_PASSWORD ||
  `PathA-${crypto.randomBytes(12).toString("hex")}`;
const BUSINESS_NAME =
  process.env.PATH_A_PILOT_MERCHANT_BUSINESS_NAME || "Path A Pilot Store";
const DISPLAY_NAME =
  process.env.PATH_A_PILOT_MERCHANT_DISPLAY_NAME || "Path A Pilot";
const COUNTRY = process.env.PATH_A_PILOT_MERCHANT_COUNTRY || "SN";
const CITY = process.env.PATH_A_PILOT_MERCHANT_CITY || "Dakar";
const PHONE = process.env.PATH_A_PILOT_MERCHANT_PHONE || "";

const makeWalletAddress = () => `0x${crypto.randomBytes(20).toString("hex")}`;
const buildPhoneNumber = (email) => {
  const digits = crypto
    .createHash("sha256")
    .update(email)
    .digest("hex")
    .replace(/\D/g, "")
    .slice(0, 9)
    .padEnd(9, "0");

  return `+221${digits}`;
};

async function ensurePathAPilotMerchant() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected");

    const phoneNumber = PHONE || buildPhoneNumber(MERCHANT_EMAIL.toLowerCase());

    let user = await User.findOne({
      where: { email: MERCHANT_EMAIL.toLowerCase() },
    });

    if (!user) {
      user = await User.create({
        email: MERCHANT_EMAIL.toLowerCase(),
        password_hash: MERCHANT_PASSWORD,
        full_name: "Path A Pilot Merchant",
        phone_number: phoneNumber,
        country_code: COUNTRY,
        role: USER_ROLES.MERCHANT,
        email_verified: true,
        phone_verified: true,
        identity_verified: true,
        verification_level: 3,
        is_active: true,
      });
      console.log(`Created Path A pilot user: ${user.email}`);
      console.log(`- initial password: ${MERCHANT_PASSWORD}`);
    } else {
      user.role = USER_ROLES.MERCHANT;
      user.email_verified = true;
      user.phone_verified = true;
      user.identity_verified = true;
      user.verification_level = Math.max(user.verification_level || 0, 3);
      user.is_active = true;
      user.phone_number = phoneNumber;
      await user.save();
      console.log(`Reused Path A pilot user: ${user.email}`);
      if (!process.env.PATH_A_PILOT_MERCHANT_PASSWORD) {
        console.log(
          "No PATH_A_PILOT_MERCHANT_PASSWORD is set in .env, so the existing merchant password may be unknown."
        );
        console.log(
          "Run `npm run reset:path-a-pilot-merchant-password` to set and print a fresh login password."
        );
      }
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
        is_frozen: false,
      });
      console.log(`Created CT settlement wallet: ${wallet.id}`);
    } else {
      console.log(`Reused CT settlement wallet: ${wallet.id}`);
    }

    let merchant = await Merchant.findOne({
      where: {
        user_id: user.id,
        business_name: BUSINESS_NAME,
      },
    });

    if (!merchant) {
      merchant = await Merchant.create({
        user_id: user.id,
        business_name: BUSINESS_NAME,
        display_name: DISPLAY_NAME,
        business_type: MERCHANT_TYPES.ECOMMERCE,
        description: "Dedicated merchant used for Path A remote pilot testing.",
        business_email: user.email,
        business_phone: phoneNumber,
        country: COUNTRY,
        city: CITY,
        address: "Path A pilot merchant profile",
        settlement_wallet_id: wallet.id,
        default_token_type: TOKEN_TYPES.CT,
        verification_status: MERCHANT_STATUS.APPROVED,
      });

      await merchant.generateApiKey();
      console.log(`Created Path A pilot merchant: ${merchant.id}`);
    } else {
      merchant.settlement_wallet_id = wallet.id;
      merchant.default_token_type = TOKEN_TYPES.CT;
      merchant.verification_status = MERCHANT_STATUS.APPROVED;
      merchant.business_email = merchant.business_email || user.email;
      merchant.business_phone = merchant.business_phone || phoneNumber;
      await merchant.save();

      if (!merchant.api_key) {
        await merchant.generateApiKey();
      }

      console.log(`Reused Path A pilot merchant: ${merchant.id}`);
    }

    await merchant.reload();

    console.log("");
    console.log("Use these in AfriExchange/afriX_backend/.env:");
    console.log(`PATH_A_PILOT_MERCHANT_EMAIL=${user.email}`);
    console.log(`PATH_A_PILOT_MERCHANT_ID=${merchant.id}`);
    console.log(`PATH_A_PILOT_MERCHANT_API_KEY=${merchant.api_key}`);
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
    console.error("Failed to create Path A pilot merchant:", error);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close errors while reporting the original failure.
    }
    process.exit(1);
  }
}

ensurePathAPilotMerchant();
