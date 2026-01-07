// afriX_backend/src/blockchain/scripts/mintTokens.js
// import "dotenv/config";
// import pkg from "hardhat";
// const { ethers } = pkg;

// async function main() {
//   const tokenAddress = process.env.TEST_USDT_ADDRESS || "0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59"; // deployed contract
//   const agentWallet = process.env.TREASURY_WALLET_ADDRESS || "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e"; // receiver

//   // 200 tokens with 6 decimals
//   const mintAmount = ethers.parseUnits("200", 6);

//   console.log(`🚀 Minting ${ethers.formatUnits(mintAmount, 6)} tUSDT to ${agentWallet}...`);

//   const token = await ethers.getContractAt("TestUSDT", tokenAddress);
//   const tx = await token.mint(agentWallet, mintAmount);
//   await tx.wait();

//   console.log(`✅ Successfully minted 200 tUSDT to ${agentWallet}`);
//   console.log(`🔗 Transaction hash: ${tx.hash}`);
// }

// main().catch((error) => {
//   console.error("❌ Error:", error);
//   process.exit(1);
// });

// (Platform Treasury - Keep As Is)
import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const tokenAddress = process.env.TEST_USDT_ADDRESS || "0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59";
  const treasuryWallet = process.env.TREASURY_WALLET_ADDRESS || "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e";
  
  // Mint to platform treasury
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDT for treasury

  console.log(`\n🏦 Minting to Platform Treasury`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`💰 Amount: ${ethers.formatUnits(mintAmount, 6)} tUSDT`);
  console.log(`📍 Treasury: ${treasuryWallet}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const token = await ethers.getContractAt("TestUSDT", tokenAddress);
  const tx = await token.mint(treasuryWallet, mintAmount);
  await tx.wait();

  console.log(`✅ Successfully minted to treasury`);
  console.log(`🔗 Transaction: ${tx.hash}\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});