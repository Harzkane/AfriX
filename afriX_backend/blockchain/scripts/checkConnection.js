// afriX_backend/src/blockchain/scripts/checkConnection.js
// You can verify your Alchemy setup and wallet connection easily:
// npx hardhat run scripts/checkConnection.js --network amoy
import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  console.log(`\n🔌 Testing Blockchain Connection`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Get RPC URL
  const rpcUrl = process.env.POLYGON_AMOY_RPC_URL || process.env.POLYGON_RPC_URL;
  console.log(`📡 RPC URL: ${rpcUrl}`);

  try {
    // Create provider with timeout settings
    const provider = new ethers.JsonRpcProvider(rpcUrl, {
      chainId: 80002,
      name: "amoy"
    });

    // Set longer timeout for initial connection
    provider.pollingInterval = 5000;

    console.log(`⏳ Connecting to network...\n`);

    // Test network connection
    const network = await provider.getNetwork();
    console.log(`✅ Connected to: ${network.name}`);
    console.log(`🔗 Chain ID: ${network.chainId}\n`);

    // Get block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`📦 Current Block: ${blockNumber}\n`);

    // Check Treasury wallet
    const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;
    if (treasuryAddress) {
      const treasuryBalance = await provider.getBalance(treasuryAddress);
      console.log(`🏦 Treasury Wallet:`);
      console.log(`   Address: ${treasuryAddress}`);
      console.log(`   Balance: ${ethers.formatEther(treasuryBalance)} MATIC\n`);
    }

    // Check Agent wallet (if exists)
    const agentAddress = process.env.AGENT_WALLET_ADDRESS;
    if (agentAddress) {
      const agentBalance = await provider.getBalance(agentAddress);
      console.log(`👤 Agent Wallet:`);
      console.log(`   Address: ${agentAddress}`);
      console.log(`   Balance: ${ethers.formatEther(agentBalance)} MATIC\n`);
    }

    // Check USDT contract
    const usdtAddress = process.env.TEST_USDT_ADDRESS;
    if (usdtAddress) {
      const code = await provider.getCode(usdtAddress);
      const isContract = code !== "0x";
      console.log(`🪙 USDT Contract:`);
      console.log(`   Address: ${usdtAddress}`);
      console.log(`   Status: ${isContract ? "✅ Deployed" : "❌ Not Found"}\n`);

      if (isContract) {
        const USDT_ABI = [
          "function balanceOf(address) view returns (uint256)",
          "function totalSupply() view returns (uint256)"
        ];
        
        const token = new ethers.Contract(usdtAddress, USDT_ABI, provider);
        const totalSupply = await token.totalSupply();
        console.log(`   Total Supply: ${ethers.formatUnits(totalSupply, 6)} tUSDT\n`);
      }
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ All connections successful!\n`);

  } catch (error) {
    console.error(`\n❌ Connection Error:`);
    console.error(`   ${error.message}\n`);
    
    if (error.code === "TIMEOUT") {
      console.log(`💡 Troubleshooting Tips:`);
      console.log(`   1. Check your Alchemy API key is valid`);
      console.log(`   2. Verify internet connection`);
      console.log(`   3. Try the public RPC: https://rpc-amoy.polygon.technology`);
      console.log(`   4. Check Alchemy dashboard for rate limits\n`);
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Fatal Error:", error);
  process.exit(1);
});


// ❯ # Test if you can reach Alchemy
// curl -I https://polygon-amoy.g.alchemy.com

// # Test public Polygon RPC
// curl -I https://rpc-amoy.polygon.technology
// HTTP/2 404 
// date: Wed, 05 Nov 2025 20:09:50 GMT
// server: istio-envoy

// HTTP/2 415 
// date: Wed, 05 Nov 2025 20:09:58 GMT
// content-type: text/plain; charset=utf-8
// server: cloudflare
// cf-ray: 999efde9a8a61db0-FRA
// cf-cache-status: DYNAMIC
// vary: Origin
// via: 1.1 google
// cf-apo-via: origin,host
// referrer-policy: strict-origin-when-cross-origin
// strict-transport-security: max-age=63072000; includeSubDomains
// x-content-type-options: nosniff
// x-frame-options: SAMEORIGIN
// x-xss-protection: 0
