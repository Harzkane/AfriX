// afriX_backend/src/blockchain/scripts/checkBalances.js

// (Helper Script)
import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const tokenAddress = process.env.TEST_USDT_ADDRESS;
  const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
  const agentAddress = process.env.AGENT_WALLET_ADDRESS;

  console.log(`\n💰 Balance Check`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const token = await ethers.getContractAt("TestUSDT", tokenAddress);

  // Treasury balance
  const treasuryBalance = await token.balanceOf(treasuryAddress);
  console.log(`🏦 Treasury (${treasuryAddress})`);
  console.log(`   ${ethers.formatUnits(treasuryBalance, 6)} tUSDT\n`);

  // Agent balance (if set)
  if (agentAddress) {
    const agentBalance = await token.balanceOf(agentAddress);
    console.log(`👤 Agent (${agentAddress})`);
    console.log(`   ${ethers.formatUnits(agentBalance, 6)} tUSDT\n`);
  }

  // Check MATIC balances too
  const provider = ethers.provider;
  const treasuryMatic = await provider.getBalance(treasuryAddress);
  console.log(`⛽ Gas Balances (MATIC):`);
  console.log(`   Treasury: ${ethers.formatEther(treasuryMatic)}`);
  
  if (agentAddress) {
    const agentMatic = await provider.getBalance(agentAddress);
    console.log(`   Agent: ${ethers.formatEther(agentMatic)}\n`);
  }
}

main().catch(console.error);