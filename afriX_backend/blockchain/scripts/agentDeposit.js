// afriX_backend/src/blockchain/scripts/agentDeposit.js

// Create Agent Deposit Script
// Now create a script that simulates the agent sending USDT to treasury: (Agent → Treasury)

import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const tokenAddress = process.env.TEST_USDT_ADDRESS;
  const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
  
  if (!process.env.AGENT_PRIVATE_KEY) {
    throw new Error("❌ AGENT_PRIVATE_KEY not set in .env");
  }
  
  console.log(`\n💼 Agent Deposit Simulation`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  // Connect using agent's private key
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
  const agentSigner = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
  
  console.log(`👤 Agent: ${agentSigner.address}`);
  
  const token = await ethers.getContractAt("TestUSDT", tokenAddress, agentSigner);
  
  // Check agent's balance
  const balance = await token.balanceOf(agentSigner.address);
  console.log(`💰 Current Balance: ${ethers.formatUnits(balance, 6)} tUSDT`);
  
  // Agent deposits 150 USDT
  const depositAmount = ethers.parseUnits("150", 6);
  
  if (balance < depositAmount) {
    throw new Error(`❌ Insufficient balance! Need ${ethers.formatUnits(depositAmount, 6)} tUSDT`);
  }
  
  console.log(`\n📤 Depositing: ${ethers.formatUnits(depositAmount, 6)} tUSDT`);
  console.log(`📍 To Treasury: ${treasuryAddress}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  const tx = await token.transfer(treasuryAddress, depositAmount);
  console.log(`⏳ Waiting for confirmation...`);
  const receipt = await tx.wait();

  console.log(`\n✅ Deposit successful!`);
  console.log(`🔗 Transaction Hash: ${tx.hash}`);
  console.log(`🔍 PolygonScan: https://amoy.polygonscan.com/tx/${tx.hash}`);
  console.log(`\n📋 COPY THIS HASH FOR API VERIFICATION! 📋`);
  console.log(`   ${tx.hash}\n`);
  
  // Check new balances
  const newAgentBalance = await token.balanceOf(agentSigner.address);
  const treasuryBalance = await token.balanceOf(treasuryAddress);
  
  console.log(`💰 Final Balances:`);
  console.log(`   Agent: ${ethers.formatUnits(newAgentBalance, 6)} tUSDT`);
  console.log(`   Treasury: ${ethers.formatUnits(treasuryBalance, 6)} tUSDT\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});