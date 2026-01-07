// seeders/demo-users.js
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface, sequelize) => {
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash("Password123!", salt);

    const now = new Date();

    const countries = [
      { code: "NG", name: "Nigeria" },
      { code: "BJ", name: "Benin" },
      { code: "CI", name: "Ivory Coast" },
      { code: "SN", name: "Senegal" },
      { code: "TG", name: "Togo" },
    ];

    const users = [
      // Admin
      {
        id: "d5986677-6d3c-4877-96d8-a1049fba32aa",
        email: "admin@gmail.com",
        password_hash: passwordHash,
        full_name: "System Administrator",
        country_code: "NG",
        role: "admin",
        email_verified: true,
        verification_level: 1,
        referral_code: "ADMIN001",
        created_at: now,
        updated_at: now,
      },
    ];

    // Generate users for each country
    countries.forEach((country) => {
      const code = country.code.toLowerCase();

      // Agent Users (3 per country)
      for (let i = 1; i <= 3; i++) {
        users.push({
          id: uuidv4(),
          email: `agent${i}_${code}@gmail.com`,
          password_hash: passwordHash,
          full_name: `Agent ${i} ${country.name}`,
          country_code: country.code,
          role: "user", // Will be upgraded to agent via Agent profile
          email_verified: true,
          verification_level: 1,
          referral_code: `AGENT${i}_${country.code}`,
          created_at: now,
          updated_at: now,
        });
      }

      // User 1
      users.push({
        id: uuidv4(),
        email: `user1_${code}@gmail.com`,
        password_hash: passwordHash,
        full_name: `User One ${country.name}`,
        country_code: country.code,
        role: "user",
        email_verified: true,
        verification_level: 1,
        referral_code: `USER1_${country.code}`,
        created_at: now,
        updated_at: now,
      });

      // User 2
      users.push({
        id: uuidv4(),
        email: `user2_${code}@gmail.com`,
        password_hash: passwordHash,
        full_name: `User Two ${country.name}`,
        country_code: country.code,
        role: "user",
        email_verified: true,
        verification_level: 1,
        referral_code: `USER2_${country.code}`,
        created_at: now,
        updated_at: now,
      });
    });

    // Check if users exist before inserting
    for (const user of users) {
      const exists = await queryInterface.rawSelect(
        "users",
        {
          where: { email: user.email },
        },
        ["id"]
      );

      if (!exists) {
        await queryInterface.bulkInsert("users", [user]);
        console.log(`   + Created user: ${user.email}`);
      } else {
        console.log(`   * User already exists: ${user.email}`);
        // Update user ID to match existing record for FK relationships
        user.id = exists.id;
      }
    }

    // Seed Education Records for all users
    const educationRecords = [];
    const educationModules = [
      "what_are_tokens",
      "how_agents_work",
      "understanding_value",
      "safety_security",
    ];

    for (const user of users) {
      for (const module of educationModules) {
        educationRecords.push({
          id: uuidv4(),
          user_id: user.id, // Now using the CORRECT (possibly updated) user ID
          module: module,
          completed: true,
          completed_at: now,
          attempts: 1,
          score: 100,
          created_at: now,
          updated_at: now,
        });
      }
    }

    // Insert education records using raw SQL with ON CONFLICT DO NOTHING
    try {
      console.log(
        "DEBUG: Preparing to seed education for users:",
        users.map((u) => ({ email: u.email, id: u.id }))
      );
      // Construct values string for bulk insert
      const values = educationRecords
        .map((r) => {
          return `('${r.id}', '${r.user_id}', '${
            r.module
          }', true, '${r.completed_at.toISOString()}', ${r.attempts}, ${
            r.score
          }, '${r.created_at.toISOString()}', '${r.updated_at.toISOString()}')`;
        })
        .join(",");

      if (values.length > 0) {
        console.log(
          "DEBUG: Executing SQL insert for users:",
          users.map((u) => u.id)
        );
        await queryInterface.sequelize.query(
          `INSERT INTO education (id, user_id, module, completed, completed_at, attempts, score, created_at, updated_at) 
                     VALUES ${values}
                     ON CONFLICT (user_id, module) DO UPDATE SET 
                        completed = EXCLUDED.completed,
                        completed_at = EXCLUDED.completed_at,
                        score = EXCLUDED.score,
                        updated_at = EXCLUDED.updated_at`
        );
        console.log("   + Seeded education records (raw SQL)");
      }
    } catch (error) {
      console.error("Failed to seed education records:", error);
    }

    // Sync User flags (since bulkInsert doesn't trigger hooks)
    try {
      const userEmails = users.map((u) => u.email);
      await queryInterface.sequelize.query(
        `UPDATE users 
                 SET education_what_are_tokens = true,
                     education_how_agents_work = true,
                     education_understanding_value = true,
                     education_safety_security = true
                 WHERE email IN (:emails)`,
        {
          replacements: { emails: userEmails },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
      console.log("   + Synced user education flags");
    } catch (error) {
      console.error("Failed to sync user flags:", error);
    }
  },

  down: async (queryInterface, sequelize) => {
    await queryInterface.bulkDelete("users", null, {});
  },
};
