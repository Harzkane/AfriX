Perfect 👍 Let’s verify your **tUSDT mint transaction** and **agent wallet balance** directly on Polygon Amoy.

---

### 🧾 **1️⃣ Verify the Transaction on PolygonScan**

Your mint transaction hash is:

```
0x478ab35e59b1cbf6f8a248e5281f0839cd9aee73366b8868295f80b51e29864b
```

👉 **Open this link:**
[https://amoy.polygonscan.com/tx/0x478ab35e59b1cbf6f8a248e5281f0839cd9aee73366b8868295f80b51e29864b](https://amoy.polygonscan.com/tx/0x478ab35e59b1cbf6f8a248e5281f0839cd9aee73366b8868295f80b51e29864b)

There, you’ll see:

- **From:** your deployer/treasury wallet
- **To:** `0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59` (the tUSDT contract)
- **Method:** `mint` or `transfer` (depending on your code)
- **Tokens Transferred:** `500 tUSDT`
- **To Address:** `0x5d0d0e728e6656A279707262e403Ca2f2C2AA746` (your agent wallet)

✅ This confirms that your mint was successful and recorded on-chain.

---

### 👤 **2️⃣ Check Your Agent Wallet Token Balance**

Your agent address is:

```
0x5d0d0e728e6656A279707262e403Ca2f2C2AA746
```

👉 Open this link:
[https://amoy.polygonscan.com/address/0x5d0d0e728e6656A279707262e403Ca2f2C2AA746](https://amoy.polygonscan.com/address/0x5d0d0e728e6656A279707262e403Ca2f2C2AA746)

Once on that page:

- Click the **“Token Holdings”** tab.
- You should see a token named **tUSDT** with a **balance of 1000.0 tUSDT** (500 previously + 500 just minted).

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
Address: 0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59
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
