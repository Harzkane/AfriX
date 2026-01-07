Perfect ✅
Here’s a **ready-to-save document** you can place in your repo as
📄 `docs/testnet-setup.md`

---

# 🧩 Polygon Amoy Testnet Setup for tUSDT Deployment

This document explains how we configured and deployed the **TestUSDT ERC20 token** on the **Polygon Amoy Testnet**, minted tokens successfully, and connected via **Alchemy RPC**.

---

## ⚙️ 1. Prerequisites

Ensure you have the following installed:

```bash
node -v      # >= 18.x or >= 22.x (LTS recommended)
npm -v       # >= 8.x
```

Then install Hardhat and dependencies:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install dotenv ethers
```

---

## 🗂️ 2. Folder Structure

```
afriX_backend/
│
├── blockchain/
│   ├── contracts/
│   │   └── TestUSDT.sol
│   ├── scripts/
│   │   ├── deployTestUSDT.js
│   │   └── mintTokens.js
│   └── hardhat.config.cjs
│
├── .env
└── package.json
```

---

## 🔐 3. Environment Variables (.env)

```ini
# ALCHEMY RPC (Amoy Testnet)
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/ZbJEvuT_OzIeNEhFsm0UmZvQwh8rmx9Z

# Wallet Private Key (from your MetaMask Amoy test account)
PRIVATE_KEY=0x126b7de4e68fcb27191274f22e2001eb9e671fd0c83ab3df0527aea9e8f4330f

# Treasury Wallet (same as MetaMask wallet or your backend wallet)
TREASURY_WALLET_ADDRESS=0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e

# Test token contract (will be updated after deploy)
TEST_USDT_ADDRESS=0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
```

---

## 🧱 4. Hardhat Configuration

📄 `blockchain/hardhat.config.cjs`

```js
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { PRIVATE_KEY, POLYGON_RPC_URL } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: POLYGON_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
```

---

## 💰 5. Smart Contract — TestUSDT.sol

📄 `blockchain/contracts/TestUSDT.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestUSDT is ERC20, Ownable {
    constructor() ERC20("Test USDT", "tUSDT") Ownable(msg.sender) {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
```

---

## 🚀 6. Deployment Script

📄 `blockchain/scripts/deployTestUSDT.js`

```js
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying TestUSDT with:", deployer.address);

  const TestUSDT = await ethers.getContractFactory("TestUSDT");
  const token = await TestUSDT.deploy();
  await token.waitForDeployment();

  console.log("✅ TestUSDT deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run it:

```bash
npx hardhat run scripts/deployTestUSDT.js --network amoy
```

✅ Example output:

```
🚀 Deploying TestUSDT with: 0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
✅ TestUSDT deployed to: 0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
```

---

## 💸 7. Mint Tokens Script

📄 `blockchain/scripts/mintTokens.js`

```js
import dotenv from "dotenv";
import pkg from "hardhat";
dotenv.config();
const { ethers } = pkg;

async function main() {
  const tokenAddress = process.env.TEST_USDT_ADDRESS;
  const agentWallet = process.env.TREASURY_WALLET_ADDRESS;

  const mintAmount = ethers.parseUnits("200", 6);
  const token = await ethers.getContractAt("TestUSDT", tokenAddress);

  console.log(
    `🚀 Minting ${ethers.formatUnits(mintAmount, 6)} tUSDT to ${agentWallet}...`
  );
  const tx = await token.mint(agentWallet, mintAmount);
  await tx.wait();

  console.log(`✅ Successfully minted 200 tUSDT to ${agentWallet}`);
  console.log(`🔗 Transaction hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run it:

```bash
npx hardhat run scripts/mintTokens.js --network amoy
```

✅ Example output:

```
🚀 Minting 200.0 tUSDT to 0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e...
✅ Successfully minted 200 tUSDT to 0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
🔗 Transaction hash: 0x753ab976dc2ea439813bd3b7ead5e3e67bf9fce39fb8257a025552effed0101d
```

---

## 🧾 8. Confirm Token in MetaMask

1. Open **MetaMask → Polygon Amoy Testnet**
2. Click **Import Tokens**
3. Paste the deployed address:
   `0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59`
4. Symbol auto-detects as **tUSDT**
5. You’ll now see your balance (e.g., `200 tUSDT`)

---

## 🔗 9. Useful References

- **Alchemy Dashboard:**
  [https://dashboard.alchemy.com/apps/522eda0r245a4byw/setup](https://dashboard.alchemy.com/apps/522eda0r245a4byw/setup)

- **Amoy Testnet RPC:**
  `https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY`

- **Polygon Faucet (for test MATIC):**
  [https://faucet.polygon.technology/](https://faucet.polygon.technology/)

- **Block Explorer (Amoy):**
  [https://amoy.polygonscan.com/](https://amoy.polygonscan.com/)

---

## 🧰 10. Troubleshooting

| Issue                                          | Cause                                         | Fix                                                                          |
| ---------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| `No signer found`                              | Private key missing or not prefixed with `0x` | Add `0x` before the private key                                              |
| `private key too long`                         | You included both `0x` and whitespace         | Trim `.env` file values                                                      |
| `balance = 0`                                  | Token not imported into MetaMask              | Add deployed contract manually                                               |
| `Cannot find @nomicfoundation/hardhat-toolbox` | Version mismatch                              | `npm install --save-dev @nomicfoundation/hardhat-toolbox --legacy-peer-deps` |
