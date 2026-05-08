// cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend
// npm run reset:path-a-pilot-payer-password

require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User } = require("../models");
const { USER_ROLES } = require("../config/constants");

const PAYER_EMAIL =
  process.env.PATH_A_PILOT_PAYER_EMAIL || "path-a-pilot-buyer@afriexchange.local";
const nextPassword =
  process.env.PATH_A_PILOT_PAYER_PASSWORD ||
  `PathA-Buyer-${crypto.randomBytes(10).toString("hex")}`;

async function resetPathAPilotPayerPassword() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected");

    const user = await User.findOne({
      where: { email: PAYER_EMAIL.toLowerCase() },
    });

    if (!user) {
      throw new Error(
        `Payer user not found for ${PAYER_EMAIL}. Run npm run seed:path-a-pilot-payer first.`
      );
    }

    user.role = USER_ROLES.USER;
    user.is_active = true;
    user.password_hash = nextPassword;
    await user.save();

    console.log("");
    console.log("Path A pilot payer password reset successfully.");
    console.log(`- email: ${user.email}`);
    console.log(`- password: ${nextPassword}`);

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to reset Path A pilot payer password:", error);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close errors while reporting the original failure.
    }
    process.exit(1);
  }
}

resetPathAPilotPayerPassword();
