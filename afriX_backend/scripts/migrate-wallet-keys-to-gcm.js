/**
 * scripts/migrate-wallet-keys-to-gcm.js
 *
 * One-shot migration: re-encrypts all wallet private keys that were stored
 * with AES-256-CBC (legacy format: `<iv_hex>:<ciphertext_hex>`) to the new
 * AES-256-GCM format (`gcm:<iv_hex>:<authTag_hex>:<ciphertext_hex>`).
 *
 * Safety guarantees
 * -----------------
 *  - Skips wallets whose key is already in GCM format (idempotent — safe to
 *    re-run if the process was interrupted).
 *  - Processes wallets in batches of 100 so the DB is not locked for long.
 *  - Each wallet is updated in its own transaction; a failure on one row is
 *    logged and skipped, not aborted.
 *  - Dry-run mode (--dry-run flag) decrypts every key and prints the first
 *    8 chars as a sanity check but writes nothing to the DB.
 *
 * Usage
 * -----
 *   node scripts/migrate-wallet-keys-to-gcm.js           # live
 *   node scripts/migrate-wallet-keys-to-gcm.js --dry-run # inspect only
 */

"use strict";

require("dotenv").config();
const crypto = require("crypto");
const { Sequelize, QueryTypes } = require("sequelize");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 100;

if (!process.env.ENCRYPTION_KEY) {
  console.error("❌  ENCRYPTION_KEY env var is not set. Aborting.");
  process.exit(1);
}

const KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
if (KEY.length !== 32) {
  console.error("❌  ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Aborting.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------
function decryptCBC(encrypted) {
  const [ivHex, ciphertext] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", KEY, iv);
  let dec = decipher.update(ciphertext, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

function decryptGCM(encrypted) {
  const parts = encrypted.split(":");
  if (parts.length !== 4) throw new Error("Invalid GCM format");
  const [, ivHex, authTagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(authTag);
  let dec = decipher.update(ciphertext, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

function encryptGCM(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  let enc = cipher.update(plaintext, "utf8", "hex");
  enc += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `gcm:${iv.toString("hex")}:${authTag.toString("hex")}:${enc}`;
}

// ---------------------------------------------------------------------------
// DB connection
// ---------------------------------------------------------------------------
const sequelize = new Sequelize(
  process.env.DATABASE_URL || process.env.DB_URL,
  {
    dialect: "postgres",
    logging: false,
    dialectOptions: process.env.DATABASE_URL?.includes("sslmode=require")
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  }
);

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------
async function migrate() {
  console.log(`\n🔑  Wallet key migration — AES-256-CBC → AES-256-GCM`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`   Batch size: ${BATCH_SIZE}\n`);

  await sequelize.authenticate();

  // Count work to do
  const [{ count }] = await sequelize.query(
    `SELECT COUNT(*) AS count FROM wallets WHERE encrypted_private_key NOT LIKE 'gcm:%'`,
    { type: QueryTypes.SELECT }
  );

  console.log(`   Wallets to migrate: ${count}`);
  if (Number(count) === 0) {
    console.log("   ✅  All keys are already in GCM format — nothing to do.\n");
    await sequelize.close();
    return;
  }

  let offset = 0;
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  while (true) {
    const rows = await sequelize.query(
      `SELECT id, encrypted_private_key FROM wallets
         WHERE encrypted_private_key NOT LIKE 'gcm:%'
         ORDER BY id
         LIMIT :limit OFFSET :offset`,
      { replacements: { limit: BATCH_SIZE, offset }, type: QueryTypes.SELECT }
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      const { id, encrypted_private_key } = row;

      try {
        // Decrypt with old CBC path
        const plainKey = decryptCBC(encrypted_private_key);

        if (DRY_RUN) {
          // Sanity-check: re-encrypt GCM then immediately decrypt to verify round-trip
          const gcm = encryptGCM(plainKey);
          const roundTrip = decryptGCM(gcm);
          if (roundTrip !== plainKey) throw new Error("Round-trip mismatch");
          console.log(`   [dry] wallet ${id} — ok (key starts 0x${plainKey.slice(2, 10)}…)`);
          migrated++;
          continue;
        }

        // Re-encrypt with GCM
        const newEncrypted = encryptGCM(plainKey);

        await sequelize.query(
          `UPDATE wallets SET encrypted_private_key = :newEncrypted WHERE id = :id`,
          { replacements: { newEncrypted, id } }
        );

        migrated++;
        if (migrated % 50 === 0) {
          process.stdout.write(`   … ${migrated} migrated so far\r`);
        }
      } catch (err) {
        errors++;
        console.error(`   ❌  wallet ${id} — ${err.message}`);
        skipped++;
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`\n   ✅  Done.`);
  console.log(`   Migrated : ${migrated}`);
  console.log(`   Errors   : ${errors}`);
  if (DRY_RUN) console.log("   (No writes were made — re-run without --dry-run to apply)\n");

  await sequelize.close();
}

migrate().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
