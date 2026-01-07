The transaction shows that the agent successfully transferred **150 tUSDT** to the treasury wallet, reducing their balance from **1000 → 850 tUSDT** and increasing the treasury’s from **1200 → 1350 tUSDT** (based on previous supply). Everything is behaving exactly as designed.

Let’s document this now as a **reusable reference section** (similar to your minting guide).

---

# 🧾 Guide: Agent Deposit Simulation (Agent → Treasury)

This script simulates an **agent depositing tUSDT tokens** into the **treasury wallet** on the **Polygon Amoy Testnet**.
It verifies balances before and after transfer, records the transaction hash, and provides a PolygonScan link for on-chain confirmation.

---

## ⚙️ 1. Script Location

```
afriX_backend/src/blockchain/scripts/agentDeposit.js
```

---

## 🧱 2. Purpose

To simulate a **USDT transfer from an Agent wallet to the Treasury**, representing a **deposit event** in the AfriX system.

---

## 🔐 3. Required Environment Variables

Ensure these are present in your `.env` file:

```bash
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
TEST_USDT_ADDRESS=0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
TREASURY_WALLET_ADDRESS=0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
AGENT_PRIVATE_KEY=your_agent_private_key_here
```

> ⚠️ Use a **test key only** for `AGENT_PRIVATE_KEY`. Never expose mainnet or production keys.

---

## 💼 4. Run the Deposit Simulation

Execute:

```bash
npx hardhat run scripts/agentDeposit.js --network amoy
```

---

## ✅ 5. Example Output

```
💼 Agent Deposit Simulation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Agent: 0x5d0d0e728e6656A279707262e403Ca2f2C2AA746
💰 Current Balance: 1000.0 tUSDT

📤 Depositing: 150.0 tUSDT
📍 To Treasury: 0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⏳ Waiting for confirmation...

✅ Deposit successful!
🔗 Transaction Hash: 0xed6fa71b0d36ba6647c73d8e9983cebd1d4ecaafa8fa444bbe4628efd1f62e07
🔍 PolygonScan: https://amoy.polygonscan.com/tx/0xed6fa71b0d36ba6647c73d8e9983cebd1d4ecaafa8fa444bbe4628efd1f62e07

📋 COPY THIS HASH FOR API VERIFICATION! 📋
   0xed6fa71b0d36ba6647c73d8e9983cebd1d4ecaafa8fa444bbe4628efd1f62e07

💰 Final Balances:
   Agent: 850.0 tUSDT
   Treasury: 1350.0 tUSDT
```

---

## 🧮 6. What the Script Does

1. Loads `.env` configuration and connects via **Polygon Amoy RPC**.
2. Uses the **Agent’s private key** to sign and send a token transfer.
3. Validates that the agent has sufficient balance.
4. Executes the `transfer()` function of the **TestUSDT** contract.
5. Waits for on-chain confirmation.
6. Logs transaction details and final balances.

---

## 🧠 7. Notes & Best Practices

- Always **check balances** before performing transfers.
- The **transaction hash** is essential for any API or database record linking deposits.
- The deposit simulation helps validate:

  - Wallet communication
  - ERC-20 compliance
  - Token movement between agent and treasury

- Keep **Amoy testnet MATIC** in both wallets for gas.

---

## 🚀 8. Quick Command Reference

| Action                     | Command                                                     |
| -------------------------- | ----------------------------------------------------------- |
| Check blockchain & wallets | `npx hardhat run scripts/checkConnection.js --network amoy` |
| Mint tUSDT to agent        | `npx hardhat run scripts/mintToAgent.js --network amoy`     |
| Simulate agent deposit     | `npx hardhat run scripts/agentDeposit.js --network amoy`    |
