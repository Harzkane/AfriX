// Create or reuse a dedicated Path A pilot payer for remote integration tests.
// To run: npm run seed:path-a-pilot-payer

require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User, Wallet } = require("../models");
const { TOKEN_TYPES, USER_ROLES } = require("../config/constants");

const PAYER_EMAIL =
  process.env.PATH_A_PILOT_PAYER_EMAIL || "path-a-pilot-buyer@afriexchange.local";
const PAYER_PASSWORD =
  process.env.PATH_A_PILOT_PAYER_PASSWORD ||
  `PathA-Buyer-${crypto.randomBytes(10).toString("hex")}`;
const PAYER_NAME =
  process.env.PATH_A_PILOT_PAYER_NAME || "Path A Pilot Buyer";
const COUNTRY = process.env.PATH_A_PILOT_PAYER_COUNTRY || "NG";
const PHONE = process.env.PATH_A_PILOT_PAYER_PHONE || "";
const CT_BALANCE = Number(process.env.PATH_A_PILOT_PAYER_CT_BALANCE || 1000);

const makeWalletAddress = () => `0x${crypto.randomBytes(20).toString("hex")}`;
const buildPhoneNumber = (email) => {
  const digits = crypto
    .createHash("sha256")
    .update(email)
    .digest("hex")
    .replace(/\D/g, "")
    .slice(0, 9)
    .padEnd(9, "0");

  return `+234${digits}`;
};

async function ensureWallet(userId, tokenType, balance = 0) {
  let wallet = await Wallet.findOne({
    where: { user_id: userId, token_type: tokenType },
  });

  if (!wallet) {
    wallet = await Wallet.create({
      user_id: userId,
      token_type: tokenType,
      blockchain_address: makeWalletAddress(),
      encrypted_private_key: crypto.randomBytes(64).toString("hex"),
      balance,
      pending_balance: 0,
      is_active: true,
      is_frozen: false,
    });
    return wallet;
  }

  if (Number(wallet.balance) < balance) {
    wallet.balance = balance;
    wallet.is_active = true;
    wallet.is_frozen = false;
    await wallet.save();
  }

  return wallet;
}

async function ensurePathAPilotPayer() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected");

    const phoneNumber = PHONE || buildPhoneNumber(PAYER_EMAIL.toLowerCase());

    let user = await User.findOne({
      where: { email: PAYER_EMAIL.toLowerCase() },
    });

    if (!user) {
      user = await User.create({
        email: PAYER_EMAIL.toLowerCase(),
        password_hash: PAYER_PASSWORD,
        full_name: PAYER_NAME,
        phone_number: phoneNumber,
        country_code: COUNTRY,
        role: USER_ROLES.USER,
        email_verified: true,
        phone_verified: true,
        identity_verified: true,
        verification_level: 3,
        is_active: true,
      });
      console.log(`Created Path A pilot payer: ${user.email}`);
      console.log(`- initial password: ${PAYER_PASSWORD}`);
    } else {
      user.role = USER_ROLES.USER;
      user.full_name = user.full_name || PAYER_NAME;
      user.email_verified = true;
      user.phone_verified = true;
      user.identity_verified = true;
      user.verification_level = Math.max(user.verification_level || 0, 3);
      user.is_active = true;
      user.phone_number = phoneNumber;
      await user.save();
      console.log(`Reused Path A pilot payer: ${user.email}`);
      if (!process.env.PATH_A_PILOT_PAYER_PASSWORD) {
        console.log(
          "No PATH_A_PILOT_PAYER_PASSWORD is set in .env, so the existing payer password may be unknown."
        );
        console.log(
          "Run `npm run reset:path-a-pilot-payer-password` to set and print a fresh login password."
        );
      }
    }

    const wallet = await ensureWallet(user.id, TOKEN_TYPES.CT, CT_BALANCE);

    console.log("");
    console.log("Use these in AfriExchange/afriX_backend/.env:");
    console.log(`PATH_A_PILOT_PAYER_EMAIL=${user.email}`);
    console.log(`PATH_A_PILOT_PAYER_PASSWORD=${PAYER_PASSWORD}`);
    console.log("");
    console.log("Payer details:");
    console.log(`- user_id: ${user.id}`);
    console.log(`- wallet_id: ${wallet.id}`);
    console.log(`- token_type: ${wallet.token_type}`);
    console.log(`- balance: ${wallet.balance}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create Path A pilot payer:", error);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close errors while reporting the original failure.
    }
    process.exit(1);
  }
}

ensurePathAPilotPayer();
