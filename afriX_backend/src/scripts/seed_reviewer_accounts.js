// Create reviewer accounts with wallets, education flags, and balances.
// To run: node src/scripts/seed_reviewer_accounts.js

require("dotenv").config();
const crypto = require("crypto");
const { sequelize, User, Wallet } = require("../models");
const { TOKEN_TYPES, USER_ROLES } = require("../config/constants");
const walletService = require("../services/walletService");

const REVIEWER_PASS = "Reviewer123!";
const ACCOUNTS = [
  {
    email: "reviewer@nexgentech.dev",
    name: "App Reviewer Primary",
    referral: "REVIEWER1"
  },
  {
    email: "tester2@nexgentech.dev",
    name: "App Reviewer Secondary",
    referral: "REVIEWER2"
  }
];

const BALANCES = {
  NT: 1000000.00,
  CT: 10000000.00,
  USDT: 50000.00
};

async function seedReviewerAccounts() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connected");

    for (const acc of ACCOUNTS) {
      console.log(`\nProcessing reviewer account: ${acc.email}`);
      
      let user = await User.findOne({
        where: { email: acc.email.toLowerCase() },
      });

      if (!user) {
        user = await User.create({
          email: acc.email.toLowerCase(),
          password_hash: REVIEWER_PASS,
          full_name: acc.name,
          country_code: "NG",
          role: USER_ROLES.USER,
          email_verified: true,
          phone_verified: true,
          identity_verified: true,
          verification_level: 3,
          is_active: true,
          login_attempts: 0,
          locked_until: null,
          referral_code: acc.referral,
          education_what_are_tokens: true,
          education_how_agents_work: true,
          education_understanding_value: true,
          education_safety_security: true
        });
        console.log(`✅ Created user: ${user.email}`);
      } else {
        user.password_hash = REVIEWER_PASS;
        user.full_name = acc.name;
        user.email_verified = true;
        user.phone_verified = true;
        user.identity_verified = true;
        user.verification_level = 3;
        user.is_active = true;
        user.login_attempts = 0;
        user.locked_until = null;
        user.education_what_are_tokens = true;
        user.education_how_agents_work = true;
        user.education_understanding_value = true;
        user.education_safety_security = true;
        await user.save();
        console.log(`✅ Updated existing user: ${user.email}`);
      }

      // Initialize wallets and set balances
      for (const tokenType of Object.values(TOKEN_TYPES)) {
        try {
          const wallet = await walletService.getOrCreateWallet(user.id, tokenType);
          if (wallet) {
            wallet.balance = BALANCES[tokenType] || 0.00;
            wallet.is_active = true;
            wallet.is_frozen = false;
            await wallet.save();
            console.log(`   - Wallet ${tokenType} initialized with balance: ${wallet.balance}`);
          }
        } catch (walletErr) {
          console.error(`   ❌ Failed to set up ${tokenType} wallet:`, walletErr.message);
        }
      }

      // Create Education Module completed records in database
      try {
        const educationModules = [
          "what_are_tokens",
          "how_agents_work",
          "understanding_value",
          "safety_security",
        ];
        
        for (const module of educationModules) {
          await sequelize.query(
            `INSERT INTO education (id, user_id, module, completed, completed_at, attempts, score, created_at, updated_at) 
             VALUES (gen_random_uuid(), :userId, :module, true, NOW(), 1, 100, NOW(), NOW())
             ON CONFLICT (user_id, module) DO NOTHING`,
            {
              replacements: { userId: user.id, module },
              type: sequelize.QueryTypes.INSERT
            }
          );
        }
        console.log("   - Education completion records ensured");
      } catch (eduErr) {
        console.error("   ❌ Failed to seed education records:", eduErr.message);
      }
    }

    console.log("\n✨ Reviewer accounts seeded successfully!");
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed reviewer accounts:", error);
    try {
      await sequelize.close();
    } catch (_) {}
    process.exit(1);
  }
}

seedReviewerAccounts();
