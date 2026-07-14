// afriX_backend/blockchain/scripts/mintCustom.js
import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const tokenAddress = process.env.TEST_USDT_ADDRESS || "0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59";

  // Read parameters from environment variables to avoid Hardhat CLI parser errors (HH308)
  // Usage: TARGET_ADDRESS=0x... AMOUNT=5000000 npx hardhat run scripts/mintCustom.js --network amoy
  const targetAddress = process.env.TARGET_ADDRESS || process.env.TREASURY_WALLET_ADDRESS;
  const amountStr = process.env.AMOUNT || "50000"; // Default to 50000 tUSDT

  if (!targetAddress) {
    throw new Error("❌ Target address is required. Set TARGET_ADDRESS env var or TREASURY_WALLET_ADDRESS in .env");
  }

  const mintAmount = ethers.parseUnits(amountStr, 6);

  console.log(`\n🪙 Minting Custom tUSDT`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`💰 Amount: ${amountStr} tUSDT`);
  console.log(`📍 Recipient: ${targetAddress}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const token = await ethers.getContractAt("TestUSDT", tokenAddress);
  const tx = await token.mint(targetAddress, mintAmount);

  console.log(`⏳ Waiting for confirmation...`);
  await tx.wait();

  console.log(`\n✅ Successfully minted!`);
  console.log(`🔗 Transaction: ${tx.hash}`);

  const balance = await token.balanceOf(targetAddress);
  console.log(`💰 New Balance: ${ethers.formatUnits(balance, 6)} tUSDT\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
