// File: src/scripts/create-agent-reviews-table.js

require("dotenv").config();
const { sequelize } = require("../config/database");

async function createAgentReviewsTable() {
  try {
    console.log("Creating agent_reviews table...");

    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = CURRENT_SCHEMA() 
        AND table_name = 'agent_reviews';
    `);

    if (results.length > 0) {
      console.log("⚠️  Table 'agent_reviews' already exists. Skipping.");
      process.exit(0);
    }

    // Create table
    console.log("📝 Creating table...");
    await sequelize.query(`
      CREATE TABLE agent_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        agent_id UUID NOT NULL,
        transaction_id UUID NOT NULL UNIQUE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('MINT', 'BURN')),
        is_flagged BOOLEAN DEFAULT FALSE,
        agent_response TEXT,
        agent_response_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        -- Foreign keys
        CONSTRAINT fk_agent_reviews_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_agent_reviews_agent 
          FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        CONSTRAINT fk_agent_reviews_transaction 
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Table 'agent_reviews' created!");

    // Create indexes
    console.log("📝 Creating indexes...");

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent 
      ON agent_reviews(agent_id);
    `);
    console.log("✅ Index: idx_agent_reviews_agent");

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_reviews_user 
      ON agent_reviews(user_id);
    `);
    console.log("✅ Index: idx_agent_reviews_user");

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_reviews_transaction 
      ON agent_reviews(transaction_id);
    `);
    console.log("✅ Index: idx_agent_reviews_transaction");

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_reviews_rating 
      ON agent_reviews(rating);
    `);
    console.log("✅ Index: idx_agent_reviews_rating");

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_reviews_created 
      ON agent_reviews(created_at);
    `);
    console.log("✅ Index: idx_agent_reviews_created");

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📊 Table Structure:");
    console.log("   - id: UUID (Primary Key)");
    console.log("   - user_id: UUID → users(id)");
    console.log("   - agent_id: UUID → agents(id)");
    console.log("   - transaction_id: UUID → transactions(id) [UNIQUE]");
    console.log("   - rating: INTEGER (1-5)");
    console.log("   - review_text: TEXT (optional)");
    console.log("   - transaction_type: ENUM('MINT', 'BURN')");
    console.log("   - is_flagged: BOOLEAN");
    console.log("   - agent_response: TEXT (optional)");
    console.log("   - agent_response_at: TIMESTAMP");
    console.log("   - created_at, updated_at: TIMESTAMP");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("\nError details:", error);
    process.exit(1);
  }
}

createAgentReviewsTable();
