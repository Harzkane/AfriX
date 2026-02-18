// create_security_tests.js
const { User } = require("./src/models");
const { v4: uuidv4 } = require("uuid");

async function createSecurityTests() {
    try {
        console.log("Creating security test users...");

        // 1. Locked User
        console.log("Creating Locked User...");
        await User.create({
            full_name: "Locked User",
            email: `locked_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: true,
            login_attempts: 5,
            locked_until: new Date(Date.now() + 60 * 60 * 1000) // Locked for 1 hour
        });

        // 2. Suspicious User (High Attempts)
        console.log("Creating Suspicious User...");
        await User.create({
            full_name: "Suspicious User",
            email: `suspicious_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: true,
            login_attempts: 4 // > 3 threshold
        });

        // 3. Suspended User
        console.log("Creating Suspended User...");
        await User.create({
            full_name: "Suspended User",
            email: `suspended_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: true,
            is_suspended: true,
            suspension_reason: "Violation of terms"
        });

        // 4. Unverified User
        console.log("Creating Unverified User...");
        await User.create({
            full_name: "Unverified User",
            email: `unverified_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: false,
            created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days old
        });

        console.log("✅ Security seed data created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create security seed data:", err);
        process.exit(1);
    }
}

createSecurityTests();
