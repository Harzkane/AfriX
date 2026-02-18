/**
 * Seed a single test agent: agent10_ng@gmail.com / Password123!
 * Creates the user (if missing) and agent profile with the new list fields
 * (city, is_online, max_transaction_limit, daily_transaction_limit) for testing.
 *
 * Run from repo root: node afriX_backend/scripts/seed-agent10-ng.js
 * Or from afriX_backend: node scripts/seed-agent10-ng.js
 */
require("dotenv").config();
const { sequelize } = require("../src/config/database");
const { User, Agent } = require("../src/models");
const { AGENT_STATUS, AGENT_TIERS, COUNTRIES, CURRENCIES, USER_ROLES } = require("../src/config/constants");

const EMAIL = "agent10_ng@gmail.com";
const PASSWORD = "Password123!";

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    let user = await User.findOne({ where: { email: EMAIL } });
    if (!user) {
      user = await User.create({
        email: EMAIL,
        password_hash: PASSWORD, // hook will hash it
        full_name: "Agent 10 Nigeria",
        country_code: COUNTRIES.NIGERIA,
        role: USER_ROLES.USER,
        email_verified: true,
        verification_level: 1,
      });
      console.log("   + Created user:", user.email);
    } else {
      console.log("   * User already exists:", user.email);
    }

    let agent = await Agent.findOne({ where: { user_id: user.id } });
    if (!agent) {
      agent = await Agent.create({
        user_id: user.id,
        country: COUNTRIES.NIGERIA,
        currency: CURRENCIES.NGN,
        withdrawal_address: "0x5d0d0e728e6656A279707262e403Ca2f2C2AA746",
        status: AGENT_STATUS.ACTIVE,
        tier: AGENT_TIERS.STANDARD,
        deposit_usd: 100000,
        available_capacity: 100000,
        total_minted: 0,
        total_burned: 0,
        commission_rate: 0.01,
        rating: 4.8,
        response_time_minutes: 5,
        is_verified: true,
        // New list fields (for agent list UI testing)
        city: "Lagos",
        is_online: true,
        max_transaction_limit: 500000,
        daily_transaction_limit: 2000000,
        // Contact / bank
        phone_number: "+2348012345010",
        whatsapp_number: "+2348012345010",
        bank_name: "GTBank",
        account_number: "0123456780",
        account_name: "Agent 10 Nigeria Business",
      });
      console.log("   + Created agent profile for:", user.email);
    } else {
      // Update existing agent with new list fields if they were null
      await agent.update({
        status: AGENT_STATUS.ACTIVE,
        city: agent.city || "Lagos",
        is_online: agent.is_online != null ? agent.is_online : true,
        max_transaction_limit: agent.max_transaction_limit ?? 500000,
        daily_transaction_limit: agent.daily_transaction_limit ?? 2000000,
      });
      console.log("   * Agent already exists, updated list fields for:", user.email);
    }

    console.log("\n✨ Seed done. You can log in with:");
    console.log("   Email:", EMAIL);
    console.log("   Password:", PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    if (err.errors) err.errors.forEach((e) => console.error("   -", e.message));
    process.exit(1);
  }
}

seed();
