"use strict";

/**
 * Migration: Add "escrowed" value to burn_requests.status enum
 *
 * The BURN_REQUEST_STATUS constant added "escrowed" as a new status, but the
 * PostgreSQL ENUM type on the burn_requests table was created before that value
 * was introduced. This causes a 500 error (invalid input value for enum) whenever
 * createBurnRequest tries to insert a row with status = 'escrowed'.
 *
 * PostgreSQL ENUMs can only be extended with ALTER TYPE … ADD VALUE.
 * The new value is added IF NOT EXISTS so the migration is safe to re-run.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add "escrowed" to the enum type used by burn_requests.status
    // IF NOT EXISTS prevents errors if the value is already present (Postgres 9.6+).
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_burn_requests_status" ADD VALUE IF NOT EXISTS 'escrowed';`
    );

    // Also ensure "disputed" is present (added at the same time as escrowed).
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_burn_requests_status" ADD VALUE IF NOT EXISTS 'disputed';`
    );

    // Ensure "cancelled" is present as well.
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_burn_requests_status" ADD VALUE IF NOT EXISTS 'cancelled';`
    );

    console.log(
      "[migration] ✅ burn_requests status enum updated with escrowed / disputed / cancelled"
    );
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL does not support removing enum values without recreating the type.
    // This is intentionally a no-op; reverting would require a full table rebuild.
    console.log(
      "[migration] ⚠️  down: cannot remove enum values from PostgreSQL ENUM types without a table rebuild. Skipping."
    );
  },
};
