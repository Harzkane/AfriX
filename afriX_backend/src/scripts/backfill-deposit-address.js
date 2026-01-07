// src/scripts/backfill-deposit-address.js
// cd ~/Doc/b/AfriExchange/afriX_backend
// node src/scripts/backfill-deposit-address.js
require("dotenv").config();
const { sequelize } = require("../config/database");
const { Agent } = require("../models");
const { ethers } = require("ethers");
const crypto = require("crypto");

const encryptPrivateKey = async (pk) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(pk, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

async function backfill() {
  await sequelize.authenticate();
  const agents = await Agent.findAll({ where: { deposit_address: null } });
  console.log(`Backfilling ${agents.length} agents...`);

  for (const agent of agents) {
    const wallet = ethers.Wallet.createRandom();
    const encrypted = await encryptPrivateKey(wallet.privateKey);
    agent.deposit_address = wallet.address.toLowerCase();
    agent.deposit_private_key_encrypted = encrypted;
    await agent.save();
    console.log(`Updated agent ${agent.id}: ${wallet.address}`);
  }
  console.log("Backfill complete!");
  process.exit(0);
}

backfill();
