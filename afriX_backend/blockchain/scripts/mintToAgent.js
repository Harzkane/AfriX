// afriX_backend/src/blockchain/scripts/mintToAgent.js

// Mint Test USDT to New Agent Account (New Agent Account)
import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const tokenAddress = process.env.TEST_USDT_ADDRESS || "0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59";
  
  // 🆕 Agent test wallet (from MetaMask Account 2)
  const agentWallet = process.env.AGENT_WALLET_ADDRESS;
  
  if (!agentWallet) {
    throw new Error("❌ AGENT_WALLET_ADDRESS not set in .env");
  }
  
  // Give agent 500 USDT to test deposits
  const mintAmount = ethers.parseUnits("500", 6);

  console.log(`\n👤 Minting to Agent Test Account`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`💰 Amount: ${ethers.formatUnits(mintAmount, 6)} tUSDT`);
  console.log(`📍 Agent: ${agentWallet}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const token = await ethers.getContractAt("TestUSDT", tokenAddress);
  const tx = await token.mint(agentWallet, mintAmount);
  
  console.log(`⏳ Waiting for confirmation...`);
  await tx.wait();

  console.log(`\n✅ Successfully minted to agent!`);
  console.log(`🔗 Transaction: ${tx.hash}`);
  console.log(`🔍 PolygonScan: https://amoy.polygonscan.com/tx/${tx.hash}\n`);
  
  // Verify balance
  const balance = await token.balanceOf(agentWallet);
  console.log(`💰 Agent Balance: ${ethers.formatUnits(balance, 6)} tUSDT\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});