// create_education_tests.js
const { User, Education } = require("./src/models");

async function createEducationTests() {
    try {
        console.log("Creating education test data...");

        // 1. Fully Educated User
        console.log("Creating Fully Educated User...");
        const smartUser = await User.create({
            full_name: "Smart Student",
            email: `smart_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: true,
            // Flags
            education_what_are_tokens: true,
            education_how_agents_work: true,
            education_understanding_value: true,
            education_safety_security: true
        });

        const modules = [
            "what_are_tokens",
            "how_agents_work",
            "understanding_value",
            "safety_security"
        ];

        for (const mod of modules) {
            await Education.create({
                user_id: smartUser.id,
                module: mod,
                completed: true,
                attempts: 1,
                score: 100,
                completed_at: new Date()
            });
        }

        // 2. Struggling User (In Progress)
        console.log("Creating Struggling Student...");
        const strugglingUser = await User.create({
            full_name: "Struggling Student",
            email: `struggling_${Date.now()}@example.com`,
            password: "Password123!",
            role: "user",
            is_email_verified: true,
            // Flags
            education_what_are_tokens: true,
            education_how_agents_work: false
        });

        // Completed first
        await Education.create({
            user_id: strugglingUser.id,
            module: "what_are_tokens",
            completed: true,
            attempts: 1,
            score: 90,
            completed_at: new Date()
        });

        // Failed second
        await Education.create({
            user_id: strugglingUser.id,
            module: "how_agents_work",
            completed: false,
            attempts: 3, // High attempts
            score: 40,
            completed_at: null
        });

        console.log("✅ Education seed data created successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed to create education seed data:", err);
        process.exit(1);
    }
}

createEducationTests();
