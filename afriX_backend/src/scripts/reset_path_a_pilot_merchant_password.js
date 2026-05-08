// cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend
// npm run reset:path-a-pilot-merchant-password

require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User } = require("../models");
const { USER_ROLES } = require("../config/constants");

const MERCHANT_EMAIL =
  process.env.PATH_A_PILOT_MERCHANT_EMAIL || "path-a-pilot@afriexchange.local";
const nextPassword =
  process.env.PATH_A_PILOT_MERCHANT_PASSWORD ||
  `PathA-${crypto.randomBytes(12).toString("hex")}`;

async function resetPathAPilotMerchantPassword() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected");

    const user = await User.findOne({
      where: { email: MERCHANT_EMAIL.toLowerCase() },
    });

    if (!user) {
      throw new Error(
        `Merchant user not found for ${MERCHANT_EMAIL}. Run npm run seed:path-a-pilot-merchant first.`
      );
    }

    user.role = USER_ROLES.MERCHANT;
    user.is_active = true;
    user.password_hash = nextPassword;
    await user.save();

    console.log("");
    console.log("Path A pilot merchant password reset successfully.");
    console.log(`- email: ${user.email}`);
    console.log(`- password: ${nextPassword}`);
    console.log("");
    console.log("Merchant login URL:");
    console.log("- http://localhost:3000/merchant/login");
    console.log("");
    console.log(
      "Tip: Set PATH_A_PILOT_MERCHANT_PASSWORD in .env before running this script if you want a stable known password."
    );

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to reset Path A pilot merchant password:", error);
    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close errors while reporting the original failure.
    }
    process.exit(1);
  }
}

resetPathAPilotMerchantPassword();
