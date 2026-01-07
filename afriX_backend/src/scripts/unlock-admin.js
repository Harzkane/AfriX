require("dotenv").config();
const { sequelize } = require("../config/database");
const User = require("../models/User");

async function unlockAdmin() {
    console.log("🔓 Unlocking admin account...");

    try {
        await sequelize.authenticate();
        console.log("✅ Database connected");

        const email = "admin@gmail.com";
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`Found user: ${user.email}`);
        console.log(`Current login attempts: ${user.login_attempts}`);
        console.log(`Locked until: ${user.locked_until}`);

        // Reset lock
        user.login_attempts = 0;
        user.locked_until = null;
        await user.save();

        console.log("✅ Admin account unlocked successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error unlocking account:", error);
        process.exit(1);
    }
}

unlockAdmin();
