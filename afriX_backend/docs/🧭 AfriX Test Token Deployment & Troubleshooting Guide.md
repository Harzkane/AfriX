Here’s a **complete, well-documented guide** summarizing **everything you just did** — including verified links, commands, and explanations.
You can keep this as your **AfriX Test Token Deployment & Troubleshooting Reference** for Polygon Amoy.

---

## 🧭 AfriX Test Token Deployment & Troubleshooting Guide

**Network:** Polygon Amoy (Testnet)
**Token:** `TestUSDT (tUSDT)`
**Contract Address:** `0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59`

---

### 🪜 Step 1 — Prepare the Environment

#### 1. Ensure Node.js and Hardhat are installed

Use **Node.js ≥ v22 LTS** for full compatibility.

```bash
node -v
npm -v
```

If outdated:

```bash
nvm install 22
nvm use 22
```

Install Hardhat:

```bash
npm install --save-dev hardhat
```

---

### 🪜 Step 2 — Install Dependencies

Run these from your `blockchain/` project folder:

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install ethers@6 dotenv
```

---

### 🪜 Step 3 — Configure Hardhat (`hardhat.config.cjs`)

> Since your `package.json` uses `"type": "module"`, Hardhat config must use `.cjs`.

```js
// blockchain/hardhat.config.cjs, 
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

const { PRIVATE_KEY, POLYGON_RPC_URL } = process.env;

module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};
```

---

### 🪜 Step 4 — Environment Variables (`.env`)

Example `.env`:

```bash
# Polygon Amoy (Testnet)
POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_TESTNET_CHAIN_ID=80002

# Wallet private key (no "0x" prefix)
PRIVATE_KEY=126b7de4e68fcb27191274f22e2001eb9e671fd0c83ab3df0527aea9e8f4330f

# Contract + Treasury Wallet
TEST_USDT_ADDRESS=0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
TREASURY_WALLET_ADDRESS=0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
```

> 💡 Always **remove the `0x` prefix** from the private key in `.env`.
> Hardhat automatically adds it internally.

---

### 🪜 Step 5 — Deploy the Test Token

**Deploy script:** `blockchain/scripts/deployTestUSDT.js`

```js
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const signers = await ethers.getSigners();
  if (!signers.length) throw new Error("❌ No signer found! Check PRIVATE_KEY");

  const deployer = signers[0];
  console.log(`🚀 Deploying TestUSDT with: ${deployer.address}`);

  const TestUSDT = await ethers.getContractFactory("TestUSDT");
  const token = await TestUSDT.deploy();
  await token.waitForDeployment();

  console.log(`✅ TestUSDT deployed to: ${await token.getAddress()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run deployment:

```bash
npx hardhat run scripts/deployTestUSDT.js --network amoy
```

✅ Example output:

```
🚀 Deploying TestUSDT with: 0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
✅ TestUSDT deployed to: 0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
```

---

### 🪜 Step 6 — Mint Test Tokens

**Script:** `blockchain/scripts/mintTokens.js`

```js
import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const tokenAddress = process.env.TEST_USDT_ADDRESS;
  const recipient = process.env.TREASURY_WALLET_ADDRESS;
  const amount = ethers.parseUnits("200", 6);

  const token = await ethers.getContractAt("TestUSDT", tokenAddress);

  console.log(`🚀 Minting 200.0 tUSDT to ${recipient}...`);
  const tx = await token.mint(recipient, amount);
  await tx.wait();

  console.log(`✅ Successfully minted 200 tUSDT to ${recipient}`);
  console.log(`🔗 Transaction hash: ${tx.hash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Run:

```bash
npx hardhat run scripts/mintTokens.js --network amoy
```

✅ Example output:

```
✅ Successfully minted 200 tUSDT to 0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
🔗 Transaction hash: 0x753ab976dc2ea439813bd3b7ead5e3e67bf9fce39fb8257a025552effed0101d
```

---

### 🪜 Step 7 — Verify in MetaMask

#### **Add Polygon Amoy**

```
Network Name: Polygon Amoy Testnet
RPC URL: https://rpc-amoy.polygon.technology
Chain ID: 80002
Currency Symbol: MATIC
Block Explorer: https://amoy.polygonscan.com
```

#### **Import Token**

1. Click **Import Tokens → Custom Token**
2. Paste:

   - Address: `0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59`
   - Symbol: `tUSDT`
   - Decimals: `6`

3. Click **Add Custom Token → Import Tokens**

Your balance will appear instantly.

---

### 🪜 Step 8 — Verify on Block Explorer

- [Polygon Amoy Explorer](https://amoy.polygonscan.com)
- Example token contract:
  🔗 [https://amoy.polygonscan.com/address/0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59](https://amoy.polygonscan.com/address/0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59)
- Check “Token Tracker → Holders” to confirm mint transactions.

---

### 🧰 Troubleshooting Summary

| Issue                                     | Cause                        | Fix                                                        |
| ----------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `private key too long, expected 32 bytes` | Private key starts with `0x` | Remove `0x` prefix                                         |
| `No signer found`                         | Missing or invalid `.env`    | Ensure `.env` loaded & contains valid `PRIVATE_KEY`        |
| `MetaMask shows 0`                        | Token not imported manually  | Import token address in MetaMask                           |
| `SyntaxError: Cannot use import`          | Wrong module type            | Use `.cjs` for Hardhat config or import syntax for scripts |

---

### 📚 Official Links

- 🧠 **Hardhat Docs:** [https://hardhat.org/getting-started](https://hardhat.org/getting-started)
- 🧩 **Polygon Amoy Info:** [https://wiki.polygon.technology/docs/tools/amoy-testnet](https://wiki.polygon.technology/docs/tools/amoy-testnet)
- 🔍 **Polygon Amoy Explorer:** [https://amoy.polygonscan.com](https://amoy.polygonscan.com)
- 🧰 **OpenZeppelin Contracts:** [https://docs.openzeppelin.com/contracts](https://docs.openzeppelin.com/contracts)
- ⚙️ **dotenv Reference:** [https://www.npmjs.com/package/dotenv](https://www.npmjs.com/package/dotenv)
