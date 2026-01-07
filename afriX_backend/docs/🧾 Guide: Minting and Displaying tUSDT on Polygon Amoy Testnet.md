Perfect ✅ — here’s a clean **step-by-step technical write-up** you can keep as a reference or documentation for your project team.

---

# 🧾 Guide: Minting and Displaying tUSDT on Polygon Amoy Testnet

This guide documents the process of **minting tUSDT (Test USDT)** tokens on the **Polygon Amoy testnet**, verifying the contract connection, and making the tokens visible in MetaMask.

---

## 🧱 1. Prerequisites

Before running the scripts, ensure you have:

* **Hardhat** installed and configured for Polygon Amoy.
* **Alchemy (or Infura)** API key for RPC connection.
* `.env` file with the following variables:

  ```bash
  ALCHEMY_AMOY_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
  PRIVATE_KEY=your_treasury_wallet_private_key
  TEST_USDT_ADDRESS=0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
  ```
* **Sufficient test MATIC** in your treasury wallet for gas fees.

---

## ⚙️ 2. Run Connection Check

Before minting, confirm the blockchain and contract connection.

```bash
npx hardhat run scripts/checkConnection.js --network amoy
```

✅ **Expected Output Example:**

```
✅ Connected to: amoy
🔗 Chain ID: 80002
🏦 Treasury Wallet: 0.00004 MATIC
👤 Agent Wallet: 0.1 MATIC
🪙 USDT Contract: 0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
Total Supply: 1700.0 tUSDT
✅ All connections successful!
```

---

## 🪙 3. Mint tUSDT Tokens

Run the mint script to send tokens to an agent or wallet.

```bash
npx hardhat run scripts/mintToAgent.js --network amoy
```

✅ **Expected Output Example:**

```
👤 Minting to Agent Test Account
💰 Amount: 500.0 tUSDT
📍 Agent: 0x5d0d0e728e6656A279707262e403Ca2f2C2AA746
✅ Successfully minted to agent!
🔗 Transaction: https://amoy.polygonscan.com/tx/0x478ab35e59b1cbf6f8a248e5281f0839cd9aee73366b8868295f80b51e29864b
💰 Agent Balance: 1000.0 tUSDT
```

If you encounter:

* `ProviderError: INTERNAL_ERROR: insufficient funds` → your **treasury wallet** lacks enough MATIC.
* `ConnectTimeoutError` → retry later or check **RPC network stability**.

---

## 🦊 4. Add Polygon Amoy Network to MetaMask

If not already added:

1. Open **MetaMask → Network dropdown → Add network manually**.
2. Fill in:

   ```
   Network Name: Polygon Amoy
   New RPC URL: https://rpc-amoy.polygon.technology/
   Chain ID: 80002
   Currency Symbol: MATIC
   Block Explorer URL: https://amoy.polygonscan.com
   ```
3. Save & switch to **Polygon Amoy**.

---

## 💎 5. Import tUSDT Token into MetaMask

To display your minted tokens:

1. In MetaMask, go to **Assets → Import Tokens → Custom Token.**
2. Paste your tUSDT contract address:

   ```
   0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
   ```
3. MetaMask auto-fills:

   ```
   Token Symbol: tUSDT
   Decimals: 18
   ```
4. Click **Next → Import Tokens**.

✅ You’ll now see:

```
tUSDT — 1000.0
```

---

## 🧠 6. Optional: Verify Token on PolygonScan

Visit:
👉 [https://amoy.polygonscan.com/token/0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59](https://amoy.polygonscan.com/token/0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59)

* Confirm token details.
* Review recent mint transactions.
* Track balances for treasury and agent addresses.

---

## 🚀 7. Quick Summary

| Step | Action                       | Command                                                     |
| ---- | ---------------------------- | ----------------------------------------------------------- |
| 1    | Check blockchain connection  | `npx hardhat run scripts/checkConnection.js --network amoy` |
| 2    | Mint tUSDT to agent          | `npx hardhat run scripts/mintToAgent.js --network amoy`     |
| 3    | Add Amoy testnet to MetaMask | Configure manually                                          |
| 4    | Import tUSDT token           | Use contract address in MetaMask                            |

