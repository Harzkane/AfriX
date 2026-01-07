# 🦊 Creating Additional MetaMask Testnet Accounts

Yes! Let's create a second testnet account to simulate an agent. Here's how:

---

## 📋 Step 1: Create New MetaMask Account

### Option A: Using MetaMask UI (Recommended)

1. **Open MetaMask Extension**
2. **Click Account Icon** (top right)
3. **Click "Add account or hardware wallet"**
4. **Select "Add a new account"**
5. **Name it** (e.g., "Agent Test Account")
6. **Click "Create"**

### Option B: Import Account with Private Key

If you want to use a specific account:

1. Click **Account Icon** → **Import Account**
2. Select **"Private Key"**
3. Paste your private key
4. Click **Import**

---

## 🎯 Your Account Structure

```
📱 MetaMask Testnet Accounts:

Account 1 (Treasury/Platform)
├─ Address: 0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
├─ Role: Platform Treasury (receives agent deposits)
└─ Balance: 200 tUSDT

Account 2 (Agent Test)
├─ Address: [NEW ADDRESS FROM METAMASK]
├─ Role: Test Agent (deposits to treasury)
└─ Balance: 0 tUSDT (we'll mint to this)
```

---

## 💰 Step 2: Fund New Agent Account with Test MATIC

The new account needs MATIC for gas fees:

### Get MATIC from Faucet:

1. **Copy the new account address** from MetaMask
2. Visit: **https://faucet.polygon.technology/**
3. Select **"Amoy Testnet"**
4. Paste your new address
5. Complete verification and request tokens

**Alternative Faucets:**

- https://www.alchemy.com/faucets/polygon-amoy
- https://amoy-faucet.ac93.uk/

---

## 🪙 Step 3: Mint Test USDT to New Agent Account

Update your minting script to send to the new agent account:

```javascript
// afriX_backend/src/blockchain/scripts/mintToAgent.js
import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const tokenAddress =
    process.env.TEST_USDT_ADDRESS ||
    "0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59";

  // 🆕 NEW AGENT WALLET ADDRESS (paste from MetaMask Account 2)
  const agentWallet = "0xYourNewAgentAddressHere";

  // Give agent 300 USDT to test with
  const mintAmount = ethers.parseUnits("300", 6);

  console.log(`\n🪙 Minting Test USDT for Agent Testing`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Token Contract: ${tokenAddress}`);
  console.log(`👤 Agent Wallet: ${agentWallet}`);
  console.log(`💵 Amount: ${ethers.formatUnits(mintAmount, 6)} tUSDT`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const token = await ethers.getContractAt("TestUSDT", tokenAddress);
  const tx = await token.mint(agentWallet, mintAmount);

  console.log(`⏳ Waiting for confirmation...`);
  await tx.wait();

  console.log(`\n✅ Successfully minted 300 tUSDT to agent!`);
  console.log(`🔗 Transaction: ${tx.hash}`);
  console.log(
    `🔍 View on PolygonScan: https://amoy.polygonscan.com/tx/${tx.hash}`
  );

  // Check balance
  const balance = await token.balanceOf(agentWallet);
  console.log(`\n💰 Agent Balance: ${ethers.formatUnits(balance, 6)} tUSDT\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
```

**Run it:**

```bash
npx hardhat run scripts/mintToAgent.js --network amoy
```

---

## 🧪 Step 4: Create Agent Deposit Script

Now create a script that simulates the agent sending USDT to treasury:

```javascript
// afriX_backend/src/blockchain/scripts/agentDeposit.js
import "dotenv/config";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const tokenAddress = process.env.TEST_USDT_ADDRESS;
  const treasuryAddress = process.env.TREASURY_WALLET_ADDRESS;

  console.log(`\n💼 Agent Deposit Simulation`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // You need to configure Hardhat to use the agent's private key
  // Add this to hardhat.config.js networks.amoy.accounts array
  const [agentSigner] = await ethers.getSigners();
  console.log(`👤 Agent Address: ${agentSigner.address}`);

  const token = await ethers.getContractAt("TestUSDT", tokenAddress);

  // Check agent's balance
  const balance = await token.balanceOf(agentSigner.address);
  console.log(`💰 Current Balance: ${ethers.formatUnits(balance, 6)} tUSDT`);

  // Agent deposits 150 USDT to platform
  const depositAmount = ethers.parseUnits("150", 6);
  console.log(`\n📤 Depositing: ${ethers.formatUnits(depositAmount, 6)} tUSDT`);
  console.log(`📍 To Treasury: ${treasuryAddress}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const tx = await token.transfer(treasuryAddress, depositAmount);
  console.log(`⏳ Waiting for confirmation...`);
  await tx.wait();

  console.log(`\n✅ Deposit successful!`);
  console.log(`🔗 Transaction Hash: ${tx.hash}`);
  console.log(`🔍 View: https://amoy.polygonscan.com/tx/${tx.hash}`);
  console.log(`\n📋 COPY THIS HASH FOR API TESTING! 📋\n`);

  // Check new balances
  const newAgentBalance = await token.balanceOf(agentSigner.address);
  const treasuryBalance = await token.balanceOf(treasuryAddress);

  console.log(`\n💰 Final Balances:`);
  console.log(`   Agent: ${ethers.formatUnits(newAgentBalance, 6)} tUSDT`);
  console.log(`   Treasury: ${ethers.formatUnits(treasuryBalance, 6)} tUSDT\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
```

---

## ⚙️ Step 5: Update Hardhat Config for Multiple Accounts

Update `hardhat.config.js` to use multiple accounts:

```javascript
// hardhat.config.js
import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY = process.env.PRIVATE_KEY; // Treasury account
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY; // Agent account

export default {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: process.env.POLYGON_RPC || "https://rpc-amoy.polygon.technology",
      accounts: [
        PRIVATE_KEY, // Account 0: Treasury
        AGENT_PRIVATE_KEY, // Account 1: Agent
      ],
      chainId: 80002,
    },
  },
};
```

---

## 🔐 Step 6: Add Agent Private Key to .env

**⚠️ Get the private key from MetaMask:**

1. Open MetaMask
2. Select **Account 2 (Agent)**
3. Click **⋮** (three dots)
4. Select **"Account Details"**
5. Click **"Show Private Key"**
6. Enter password
7. **Copy the private key**

**Add to `.env`:**

```env
# Treasury Account (Account 1)
PRIVATE_KEY=your_treasury_private_key_here
TREASURY_WALLET_ADDRESS=0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e

# Agent Test Account (Account 2)
AGENT_PRIVATE_KEY=your_agent_private_key_here
AGENT_WALLET_ADDRESS=0xYourNewAgentAddressHere

# Contract addresses
TEST_USDT_ADDRESS=0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
POLYGON_RPC=https://rpc-amoy.polygon.technology
```

---

## 🎬 Complete Testing Flow

### **1. Fund Agent Account**

```bash
# Visit faucet to get MATIC
# Then mint USDT to agent
npx hardhat run scripts/mintToAgent.js --network amoy
```

### **2. Register Agent via API**

```http
POST http://localhost:5000/api/agents/register
Authorization: Bearer {{user_token}}

{
  "country": "Nigeria",
  "currency": "NGN",
  "withdrawal_address": "0xYourNewAgentAddress"
}
```

### **3. Agent Deposits USDT**

```bash
# Use Account Index 1 (agent)
npx hardhat run scripts/agentDeposit.js --network amoy
```

### **4. Verify Deposit via API**

```http
POST http://localhost:5000/api/agents/deposit

{
  "amount_usd": 150,
  "tx_hash": "0x..." // From step 3 output
}
```

---

## 📊 Account Summary

| Account       | Address         | Role              | Initial Balance |
| ------------- | --------------- | ----------------- | --------------- |
| **Account 1** | `0x7c26...a16e` | Platform Treasury | 200 tUSDT       |
| **Account 2** | `0x????...????` | Test Agent        | 300 tUSDT       |

---

## 🔄 Alternative: Use Hardhat Script to Switch Accounts

```javascript
// scripts/useAccount.js
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const signers = await ethers.getSigners();

  console.log("\n📱 Available Accounts:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  for (let i = 0; i < signers.length; i++) {
    const balance = await ethers.provider.getBalance(signers[i].address);
    console.log(`Account ${i}:`);
    console.log(`  Address: ${signers[i].address}`);
    console.log(`  MATIC: ${ethers.formatEther(balance)}`);
    console.log();
  }
}

main().catch(console.error);
```

---

## ✅ Verification Checklist

- [ ] Created Account 2 in MetaMask
- [ ] Got test MATIC from faucet
- [ ] Added agent private key to `.env`
- [ ] Minted 300 tUSDT to agent account
- [ ] Can see balances in MetaMask
- [ ] Updated hardhat.config.js with both accounts

**Ready to test the full agent flow?** 🚀

Would you like me to create a single master script that automates all the blockchain testing steps?

<!-- -------------------------------Error Mint due to MATIC Gas---------------------------- -->

error:

❯ npx hardhat run scripts/checkConnection.js --network amoy

[dotenv@17.2.3] injecting env (8) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️ write to custom object with { processEnv: myObject }

🔌 Testing Blockchain Connection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 RPC URL: https://polygon-amoy.g.alchemy.com/v2/ZbJEvuT_OzIeNEhFsm0UmZvQwh8rmx9Z
⏳ Connecting to network...

✅ Connected to: amoy
🔗 Chain ID: 80002

📦 Current Block: 28663942

🏦 Treasury Wallet:
Address: 0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
Balance: 0.190046754755644817 MATIC

👤 Agent Wallet:
Address: 0x5d0d0e728e6656A279707262e403Ca2f2C2AA746
Balance: 0.009080949248673535 MATIC

🪙 USDT Contract:
Address: 0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59 // metamask amoy testnet address
Status: ✅ Deployed

Total Supply: 1700.0 tUSDT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ All connections successful!

❯ npx hardhat run scripts/mintToAgent.js --network amoy
[dotenv@17.2.3] injecting env (8) from .env -- tip: 🛠️ run anywhere with `dotenvx run -- yourcommand`
[dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️ write to custom object with { processEnv: myObject }

👤 Minting to Agent Test Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Amount: 500.0 tUSDT
📍 Agent: 0x5d0d0e728e6656A279707262e403Ca2f2C2AA746
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ Waiting for confirmation...

✅ Successfully minted to agent!
🔗 Transaction: 0x478ab35e59b1cbf6f8a248e5281f0839cd9aee73366b8868295f80b51e29864b
🔍 PolygonScan: https://amoy.polygonscan.com/tx/0x478ab35e59b1cbf6f8a248e5281f0839cd9aee73366b8868295f80b51e29864b

💰 Agent Balance: 1000.0 tUSDT

Perfect — your setup and logs make this super clear 👇

---

### ⚙️ What’s Happening

Your **connection test is fine**, so RPC and network access are working perfectly.
The key part of the error:

```
❌ Error: ProviderError: INTERNAL_ERROR: insufficient funds
```

is **NOT** a network error — it’s coming **from the Polygon node** because **the wallet sending the transaction has too little MATIC** to pay gas fees.

---

### 🧩 Let’s break it down

| Wallet       | Address                                      | Role                                 | Balance              | Status     |
| ------------ | -------------------------------------------- | ------------------------------------ | -------------------- | ---------- |
| **Treasury** | `0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e` | Contract owner (signer doing `mint`) | **0.00004675 MATIC** | ❌ Too low |
| **Agent**    | `0x5d0d0e728e6656A279707262e403Ca2f2C2AA746` | Recipient of tokens                  | **0.2 MATIC**        | ✅ Fine    |

So even though the **agent** has enough MATIC, the **transaction signer** is your **treasury wallet**, which only has **0.00004 MATIC** — not enough to cover the gas.

The “insufficient funds” message is referring to **gas**, not to the ERC-20 mint amount.

---

### 💡 Why this matters

Your minting function:

```js
const token = await ethers.getContractAt("TestUSDT", tokenAddress);
const tx = await token.mint(agentWallet, mintAmount);
```

By default, Hardhat uses the **first account** in the network config (in this case, `PRIVATE_KEY` = Treasury) as the **signer**.
That account must pay the gas fee for executing `mint`.

---

### ✅ Fix

1. **Send test MATIC** to the treasury wallet
   → Go to [https://faucet.polygon.technology/](https://faucet.polygon.technology/)
   → Choose **Amoy**, paste this address:

   ```
   0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
   ```

   → Request ~0.2 MATIC

2. **Re-run the mint script** after the faucet transaction confirms.

   ```bash
   npx hardhat run scripts/mintToAgent.js --network amoy
   ```

3. You should then see output like:

   ```
   ✅ Successfully minted to agent!
   🔗 Transaction: 0x....
   ```

---

### ✅ Summary

| Problem                                             | Meaning                                                      | Fix                                     |
| --------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| `ProviderError: INTERNAL_ERROR: insufficient funds` | The **Treasury wallet** doesn’t have enough MATIC to pay gas | Send ~0.2 MATIC to treasury from faucet |
| Network connection                                  | ✅ Fine                                                      | No change needed                        |
| Agent wallet MATIC                                  | ✅ Fine                                                      | No change needed                        |

---

Would you like me to show you how to modify your script so that it **automatically checks if the treasury wallet has enough MATIC** before trying to mint (to prevent this kind of failure)?



<!-- -------------------------------🪙 How to Add tUSDT (Test USDT) Token Manually to MetaMask---------------------------- -->

Great — let’s walk you through **exactly how to manually import your tUSDT token into MetaMask** so it shows up properly. 🔥

---

## 🪙 How to Add tUSDT (Test USDT) Token Manually to MetaMask

### 🧩 Step 1: Make sure you’re on the **Polygon Amoy testnet**

If you haven’t added it yet:

1. Open **MetaMask** → click your **network dropdown** (top center).
2. Select **“Add network” → “Add a network manually”**.
3. Fill in the following details:

   ```
   Network Name: Polygon Amoy
   New RPC URL: https://rpc-amoy.polygon.technology/
   Chain ID: 80002
   Currency Symbol: MATIC
   Block Explorer URL: https://amoy.polygonscan.com
   ```
4. Click **Save** and make sure you’re now connected to **Polygon Amoy**.

---

### 💎 Step 2: Get the Token Contract Address

From your deployment logs:

```
tUSDT Contract Address: 0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
```

That’s your test token contract on the Amoy network.

---

### 🪙 Step 3: Import the Token into MetaMask

1. Open MetaMask.
2. Scroll down in the **Assets** tab and click **“Import tokens.”**
3. Choose the **Custom token** tab.
4. Paste your contract address:

   ```
   0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
   ```
5. MetaMask will auto-fill:

   * **Token Symbol:** `tUSDT`
   * **Decimals:** `18`
6. Click **Next → Import Tokens.**

---

### ✅ Step 4: Confirm the Token Appears

Now in your wallet, under “Assets,” you’ll see:

```
tUSDT — 1000.0
```

If you mint more later or transfer tokens, this balance will update automatically.

