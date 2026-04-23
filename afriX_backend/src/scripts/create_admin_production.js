// File: src/scripts/create_admin_production.js
// To run: node src/scripts/create_admin_production.js
require("dotenv").config();
const { sequelize } = require("../config/database");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

async function createAdmin() {
    try {
        console.log("🚀 connecting to DB...");
        await sequelize.authenticate();
        console.log("✅ Database connected");

        const email = "admin@gmail.com";
        const password = "password123"; // Default initial password to be changed by user

        let user = await User.findOne({ where: { email } });

        if (user) {
            console.log(`⚠️  Admin user already exists: ${email}`);
            console.log(`Updating role and password...`);
            user.role = 'admin';
            user.email_verified = true;
            user.password_hash = password; // Hook will hash this
            await user.save();
            console.log("✅ Admin user updated successfully.");
        } else {
            console.log(`👤 Creating new admin user: ${email}`);

            user = await User.create({
                email,
                password_hash: password, // Hook will hash this
                full_name: "Super Admin",
                country_code: "NG",
                role: "admin",
                email_verified: true,
                phone_verified: true,
                identity_verified: true,
                verification_level: 3,
                is_active: true
            });
            console.log(`✅ Admin user created successfully!`);
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${password}`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating admin:", error);
        process.exit(1);
    }
}

createAdmin();
