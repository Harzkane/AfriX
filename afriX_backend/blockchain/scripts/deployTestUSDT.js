// blockchain/scripts/deployTestUSDT.js
// npx hardhat run scripts/deployTestUSDT.js --network amoy
import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  const signers = await ethers.getSigners();
  console.log("Signers available:", signers.length);

  if (signers.length === 0) {
    throw new Error("❌ No signer found! Check your PRIVATE_KEY in .env");
  }

  const [deployer] = signers;
  console.log("🚀 Deploying TestUSDT with:", deployer.address);

  const TestUSDT = await ethers.getContractFactory("TestUSDT");
  const token = await TestUSDT.deploy();

  await token.waitForDeployment();
  console.log("✅ TestUSDT deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
