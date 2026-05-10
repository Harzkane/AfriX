require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User, Wallet, Agent } = require("../models");
const {
  TOKEN_TYPES,
  USER_ROLES,
  AGENT_STATUS,
  AGENT_TIERS,
} = require("../config/constants");

const TEST_USER_EMAIL =
  (process.env.SN_TEST_USER_EMAIL || "harzkane@gmail.com").toLowerCase();
const TEST_USER_PASSWORD =
  process.env.SN_TEST_USER_PASSWORD || "Password123!";
const TEST_USER_NAME =
  process.env.SN_TEST_USER_NAME || "Harzkane Senegal Test User";
const TEST_USER_PHONE =
  process.env.SN_TEST_USER_PHONE || "+221770000001";
const TEST_USER_CT_BALANCE = Number(
  process.env.SN_TEST_USER_CT_BALANCE || 10000000
);

const TEST_AGENT_EMAIL =
  (process.env.SN_TEST_AGENT_EMAIL || "agent_sn@gmail.com").toLowerCase();
const TEST_AGENT_PASSWORD =
  process.env.SN_TEST_AGENT_PASSWORD || "Password123!";
const TEST_AGENT_NAME =
  process.env.SN_TEST_AGENT_NAME || "Senegal Test Agent";
const TEST_AGENT_PHONE =
  process.env.SN_TEST_AGENT_PHONE || "+221770000002";
const TEST_AGENT_USDT_BALANCE = Number(
  process.env.SN_TEST_AGENT_USDT_BALANCE || 50000
);
const TEST_AGENT_CT_BALANCE = Number(
  process.env.SN_TEST_AGENT_CT_BALANCE || 0
);

const COUNTRY = "SN";
const CITY = process.env.SN_TEST_CITY || "Dakar";

const makeWalletAddress = () => `0x${crypto.randomBytes(20).toString("hex")}`;

async function ensureWallet(userId, tokenType, minimumBalance = 0) {
  let wallet = await Wallet.findOne({
    where: { user_id: userId, token_type: tokenType },
  });

  if (!wallet) {
    wallet = await Wallet.create({
      user_id: userId,
      token_type: tokenType,
      blockchain_address: makeWalletAddress(),
      encrypted_private_key: crypto.randomBytes(64).toString("hex"),
      balance: minimumBalance,
      pending_balance: 0,
      is_active: true,
      is_frozen: false,
    });
    return wallet;
  }

  if (Number(wallet.balance) < minimumBalance) {
    wallet.balance = minimumBalance;
  }

  wallet.is_active = true;
  wallet.is_frozen = false;
  await wallet.save();

  return wallet;
}

async function ensureUser({
  email,
  password,
  fullName,
  phoneNumber,
  role,
}) {
  let user = await User.findOne({ where: { email } });

  if (!user) {
    user = await User.create({
      email,
      password_hash: password,
      full_name: fullName,
      phone_number: phoneNumber,
      country_code: COUNTRY,
      role,
      email_verified: true,
      phone_verified: true,
      identity_verified: true,
      verification_level: 3,
      is_active: true,
      language: "fr",
      theme: "xof",
    });

    return { user, created: true };
  }

  user.full_name = user.full_name || fullName;
  user.phone_number = phoneNumber;
  user.country_code = COUNTRY;
  user.role = role;
  user.email_verified = true;
  user.phone_verified = true;
  user.identity_verified = true;
  user.verification_level = Math.max(user.verification_level || 0, 3);
  user.is_active = true;
  user.language = user.language || "fr";
  user.theme = "xof";
  await user.save();

  return { user, created: false };
}

async function ensureAgentProfile(userId) {
  let agent = await Agent.findOne({ where: { user_id: userId } });

  if (!agent) {
    agent = await Agent.create({
      user_id: userId,
      country: COUNTRY,
      city: CITY,
      currency: "XOF",
      tier: AGENT_TIERS.STANDARD,
      status: AGENT_STATUS.ACTIVE,
      withdrawal_address: "0x5d0d0e728e6656A279707262e403Ca2f2C2AA746",
      deposit_usd: TEST_AGENT_USDT_BALANCE,
      available_capacity: TEST_AGENT_USDT_BALANCE,
      total_minted: 0,
      total_burned: 0,
      rating: 5,
      is_verified: true,
      is_online: true,
      max_transaction_limit: 1000000,
      daily_transaction_limit: 10000000,
      commission_rate: 0.01,
      response_time_minutes: 5,
      phone_number: TEST_AGENT_PHONE,
      whatsapp_number: TEST_AGENT_PHONE,
      mobile_money_provider: "Wave",
      mobile_money_number: TEST_AGENT_PHONE,
      bank_name: "CBAO",
      account_number: "SN7600100100000012345678",
      account_name: TEST_AGENT_NAME,
    });

    return { agent, created: true };
  }

  agent.country = COUNTRY;
  agent.city = CITY;
  agent.currency = "XOF";
  agent.tier = AGENT_TIERS.STANDARD;
  agent.status = AGENT_STATUS.ACTIVE;
  agent.is_verified = true;
  agent.is_online = true;
  agent.phone_number = TEST_AGENT_PHONE;
  agent.whatsapp_number = TEST_AGENT_PHONE;
  agent.mobile_money_provider = agent.mobile_money_provider || "Wave";
  agent.mobile_money_number = TEST_AGENT_PHONE;
  agent.bank_name = agent.bank_name || "CBAO";
  agent.account_number = agent.account_number || "SN7600100100000012345678";
  agent.account_name = agent.account_name || TEST_AGENT_NAME;
  agent.deposit_usd = Math.max(
    Number(agent.deposit_usd || 0),
    TEST_AGENT_USDT_BALANCE
  );
  agent.available_capacity = Math.max(
    Number(agent.available_capacity || 0),
    TEST_AGENT_USDT_BALANCE
  );
  await agent.save();

  return { agent, created: false };
}

async function seedSenegalPathATestAccounts() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected");

    const { user: buyer, created: buyerCreated } = await ensureUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      fullName: TEST_USER_NAME,
      phoneNumber: TEST_USER_PHONE,
      role: USER_ROLES.USER,
    });

    const buyerCtWallet = await ensureWallet(
      buyer.id,
      TOKEN_TYPES.CT,
      TEST_USER_CT_BALANCE
    );

    const { user: agentUser, created: agentUserCreated } = await ensureUser({
      email: TEST_AGENT_EMAIL,
      password: TEST_AGENT_PASSWORD,
      fullName: TEST_AGENT_NAME,
      phoneNumber: TEST_AGENT_PHONE,
      role: USER_ROLES.AGENT,
    });

    const agentUsdtWallet = await ensureWallet(
      agentUser.id,
      TOKEN_TYPES.USDT,
      TEST_AGENT_USDT_BALANCE
    );
    const agentCtWallet = await ensureWallet(
      agentUser.id,
      TOKEN_TYPES.CT,
      TEST_AGENT_CT_BALANCE
    );

    const { agent, created: agentCreated } = await ensureAgentProfile(
      agentUser.id
    );

    console.log("");
    console.log(
      buyerCreated
        ? `Created Senegal buyer: ${buyer.email}`
        : `Reused Senegal buyer: ${buyer.email}`
    );
    console.log(`- password: ${TEST_USER_PASSWORD}`);
    console.log(`- country: ${buyer.country_code}`);
    console.log(`- CT wallet id: ${buyerCtWallet.id}`);
    console.log(`- CT balance: ${buyerCtWallet.balance}`);

    console.log("");
    console.log(
      agentUserCreated || agentCreated
        ? `Created Senegal agent: ${agentUser.email}`
        : `Reused Senegal agent: ${agentUser.email}`
    );
    console.log(`- password: ${TEST_AGENT_PASSWORD}`);
    console.log(`- agent_id: ${agent.id}`);
    console.log(`- country: ${agent.country}`);
    console.log(`- city: ${agent.city || CITY}`);
    console.log(`- status: ${agent.status}`);
    console.log(`- USDT wallet id: ${agentUsdtWallet.id}`);
    console.log(`- USDT balance: ${agentUsdtWallet.balance}`);
    console.log(`- CT wallet id: ${agentCtWallet.id}`);
    console.log(`- CT balance: ${agentCtWallet.balance}`);
    console.log(`- deposit_usd: ${agent.deposit_usd}`);
    console.log(`- available_capacity: ${agent.available_capacity}`);

    console.log("");
    console.log("Credentials:");
    console.log(`- buyer: ${TEST_USER_EMAIL} / ${TEST_USER_PASSWORD}`);
    console.log(`- agent: ${TEST_AGENT_EMAIL} / ${TEST_AGENT_PASSWORD}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed Senegal Path A test accounts:", error);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close errors while reporting the original failure.
    }
    process.exit(1);
  }
}

seedSenegalPathATestAccounts();
