## What the **Backfill Script** Does — In Plain English

> **It gives every _existing_ agent a **USDT deposit address** (and encrypted private key) — even if they signed up _before_ you added the `deposit_address` column.**

---

### Imagine This Timeline

| Time          | What Happened                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Yesterday** | You had 50 agents. None had `deposit_address` in the DB (because the column didn’t exist).            |
| **Today**     | You ran `add-deposit-address-to-agents.js` → column now exists, but **old agents still have `null`**. |
| **Tomorrow**  | You want agents to **deposit more USDT** → but they can’t, because their address is `null`.           |

---

## The Backfill Script Fixes That

```js
// src/scripts/backfill-deposit-address.js
```

### Step-by-Step What It Does

| Step | Action                                                                       |
| ---- | ---------------------------------------------------------------------------- |
| 1    | Connects to your database                                                    |
| 2    | Finds **all agents where `deposit_address IS NULL`**                         |
| 3    | For **each** of them:                                                        |
|      | → Generates a **brand new Ethereum wallet** (`ethers.Wallet.createRandom()`) |
|      | → Saves the **public address** → `deposit_address`                           |
|      | → **Encrypts** the private key ( with your `ENCRYPTION_KEY`)                 |
|      | → Saves encrypted key → `deposit_private_key_encrypted`                      |
| 4    | Updates the agent in the DB                                                  |
| 5    | Prints progress                                                              |

---

### Example Output

```bash
$ node src/scripts/backfill-deposit-address.js
Backfilling 47 agents...
Updated agent 8f1a2b3c: 0x742d35Cc6634C0532925a3b844Bc859689d9f...
Updated agent 9d2e3f4a: 0x8f14e45fceea167a5a36dedd4bea2543c...
...
Backfill complete!
```

Now **all 47 old agents** have:

```js
deposit_address: "0x742d35Cc6634C0532925a3b844Bc859689d9f...";
deposit_private_key_encrypted: "a1b2c3...:encryptedhex";
```

---

## Why This Is **Critical**

| Without Backfill                           | With Backfill                        |
| ------------------------------------------ | ------------------------------------ |
| Old agents see **"No deposit address"**    | All agents see **QR code + address** |
| Can't increase capacity                    | Can deposit anytime                  |
| App crashes on `req.agent.deposit_address` | Works everywhere                     |
| Users confused                             | Smooth experience                    |

---

## Is It Safe?

**YES — 100% safe**

- Only touches agents with `deposit_address = null`
- Uses **same encryption** as your `Wallet` model
- **Idempotent**: Run it 10 times → same result
- No downtime
- No data loss

---

## When Should You Run It?

| Stage          | Run Backfill?                           |
| -------------- | --------------------------------------- |
| **Local Dev**  | Yes (test with fake data)               |
| **Staging**    | Yes (verify)                            |
| **Production** | **YES — ONCE** (after column migration) |

---

## One-Time Only

> **Run it once. Delete it after.**

```bash
# 1. Add column
node src/scripts/add-deposit-address-to-agents.js

# 2. Backfill old agents
node src/scripts/backfill-deposit-address.js

# 3. Done! Delete both scripts (or keep for audit)
```

---

## Bonus: What Happens to **New Agents**?

→ **No backfill needed**  
Because `registerAgent()` now **automatically** generates:

```js
const wallet = ethers.Wallet.createRandom();
agent.deposit_address = wallet.address;
agent.deposit_private_key_encrypted = await encrypt(wallet.privateKey);
```

So **new agents are covered**.

---

## TL;DR

| Question                   | Answer                                                          |
| -------------------------- | --------------------------------------------------------------- |
| **What does backfill do?** | Gives **old agents** a **USDT deposit address + encrypted key** |
| **Why do I need it?**      | So **existing agents** can deposit more USDT                    |
| **Is it safe?**            | Yes — idempotent, encrypted, no downtime                        |
| **Do I run it forever?**   | No — **once**, after column migration                           |

---

### Next Steps

1. Run column script → `add-deposit-address-to-agents.js`
2. Run backfill → `backfill-deposit-address.js`
3. Restart server
4. Test: Old agent opens app → sees **QR code**
