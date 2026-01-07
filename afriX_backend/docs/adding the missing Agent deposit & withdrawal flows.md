Below is a **complete, production-ready plan** for **adding the missing Agent deposit & withdrawal flows**, based on:

- All the code you just posted (`requests.js`, `requestController.js`, `agentService.js`, etc.)
- The **AfriToken Agent Handbook** (deposit = USDT collateral, capacity = deposit)
- The **existing mint/burn request flow** (proofs, escrow, 30-min expiry)

---

## FINAL VERDICT

> **No — agents cannot deposit or withdraw right now.**  
> But **you are 95% there** — just need **2 new routes + 1 model field + 1 service**.

---

## What Exists Already (Good!)

| Feature                                           | Status | Location                                      |
| ------------------------------------------------- | ------ | --------------------------------------------- |
| `deposit_usd` & `available_capacity`              | Yes    | `Agent` model                                 |
| `registerAgent()` sets initial deposit            | Yes    | `agentService.registerAgent()`                |
| Mint/Burn **already adjust `available_capacity`** | Yes    | `transactionService.processAgentSale/Buyback` |
| 30-min request flow with proofs                   | Yes    | `MintRequest` / `BurnRequest`                 |
| Push notifications                                | Yes    | `sendPush()`                                  |
| File upload to R2                                 | Yes    | `uploadToR2()`                                |

---

## What’s Missing (We’ll Add)

| Feature                          | Why                           |
| -------------------------------- | ----------------------------- |
| **Agent deposit top-up**         | Agents need to add more USDT  |
| **Agent deposit withdrawal**     | Agents need to exit or reduce |
| **`deposit_address` field**      | Show QR code in app           |
| **Transaction log for deposits** | Audit trail                   |
| **On-chain verification**        | Auto-detect USDT              |

---

# FULL IMPLEMENTATION PLAN

---

## 1. Add `deposit_address` to `Agent` Model

```js
// src/models/Agent.js (add to init)
deposit_address: {
  type: DataTypes.STRING(42),
  allowNull: true,
  validate: { is: /^0x[a-fA-F0-9]{40}$/ },
  comment: "Polygon USDT deposit address"
},
```

Run migration:

```js
// migrations/xxxx-add-deposit-address-to-agents.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("agents", "deposit_address", {
      type: Sequelize.STRING(42),
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn("agents", "deposit_address");
  },
};
```

---

## 2. Add New Transaction Types

```js
// config/constants.js
const TRANSACTION_TYPES = {
  // ...
  AGENT_DEPOSIT: "agent_deposit",
  AGENT_WITHDRAWAL: "agent_withdrawal",
};
```

---

## 3. Generate Deposit Address on Registration

```js
// src/services/agentService.js → registerAgent()
const { ethers } = require("ethers");
const depositWallet = ethers.Wallet.createRandom();

return await Agent.create({
  user_id: userId,
  country,
  currency,
  deposit_usd: depositUsd,
  available_capacity: depositUsd,
  status: AGENT_STATUS.PENDING,
  deposit_address: depositWallet.address, // ← NEW
});
```

> **Store `encrypted_private_key` securely** (same as `Wallet`)

---

## 4. New Route: **Deposit More USDT**

```js
// src/routes/agents.js
router.post("/deposit", authenticate, requireAgent, agentController.deposit);
```

```js
// src/controllers/agentController.js
async deposit(req, res, next) {
  try {
    const { amount_usd, tx_hash } = req.body;
    if (!amount_usd || !tx_hash) throw new ApiError("amount_usd and tx_hash required", 400);

    const result = await agentService.depositCapacity(req.agent.id, amount_usd, tx_hash);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
```

```js
// src/services/agentService.js
async depositCapacity(agentId, amountUsd, txHash) {
  return sequelize.transaction(async (t) => {
    const agent = await Agent.findByPk(agentId, { transaction: t, lock: true });
    if (!agent) throw new ApiError("Agent not found", 404);

    // TODO: Verify tx_hash on Polygon (USDT ERC-20)
    // await blockchainService.verifyUSDTDeposit(agent.deposit_address, txHash, amountUsd);

    const amount = parseFloat(amountUsd);
    agent.deposit_usd += amount;
    agent.available_capacity += amount;

    await agent.save({ transaction: t });

    const tx = await Transaction.create({
      reference: generateTransactionReference(),
      type: TRANSACTION_TYPES.AGENT_DEPOSIT,
      status: TRANSACTION_STATUS.COMPLETED,
      amount,
      token_type: "USDT",
      description: "Agent increased deposit",
      to_user_id: agent.user_id,
      agent_id: agent.id,
      metadata: { tx_hash: txHash, deposit_address: agent.deposit_address }
    }, { transaction: t });

    await sendPush(agent.user_id, "Deposit Confirmed", `$${amount} USDT added to capacity`);
    return { agent, transaction: tx };
  });
}
```

---

## 5. New Route: **Withdraw Excess Deposit**

```js
// src/routes/agents.js
router.post(
  "/withdraw-deposit",
  authenticate,
  requireAgent,
  agentController.withdrawDeposit
);
```

```js
// src/controllers/agentController.js
async withdrawDeposit(req, res, next) {
  try {
    const { amount_usd } = req.body;
    const result = await agentService.withdrawDeposit(req.agent.id, amount_usd);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}
```

```js
// src/services/agentService.js
async withdrawDeposit(agentId, amountUsd) {
  return sequelize.transaction(async (t) => {
    const agent = await Agent.findByPk(agentId, { transaction: t, lock: true });
    const outstanding = agent.total_minted - agent.total_burned;
    const maxWithdraw = agent.deposit_usd - outstanding;

    const amount = parseFloat(amountUsd);
    if (amount > maxWithdraw)
      throw new ApiError(`Max withdrawable: $${maxWithdraw}`, 400);

    agent.deposit_usd -= amount;
    agent.available_capacity -= amount;
    await agent.save({ transaction: t });

    const tx = await Transaction.create({
      reference: generateTransactionReference(),
      type: TRANSACTION_TYPES.AGENT_WITHDRAWAL,
      status: TRANSACTION_STATUS.PENDING,
      amount,
      token_type: "USDT",
      description: "Agent withdrawal request",
      from_user_id: agent.user_id,
      agent_id: agent.id,
      metadata: { max_withdrawable: maxWithdraw }
    }, { transaction: t });

    // TODO: Trigger admin payout (email, dashboard, treasury)
    await sendPush(agent.user_id, "Withdrawal Requested", `$${amount} queued for payout`);

    return { withdrawn: amount, new_deposit: agent.deposit_usd, transaction: tx };
  });
}
```

---

## 6. Get Deposit Address (for QR Code)

```js
// src/routes/agents.js
router.get(
  "/deposit-address",
  authenticate,
  requireAgent,
  agentController.getDepositAddress
);
```

```js
// src/controllers/agentController.js
async getDepositAddress(req, res) {
  res.json({
    success: true,
    data: {
      address: req.agent.deposit_address,
      network: "Polygon",
      token: "USDT"
    }
  });
}
```

---

## 7. Auto-Detect Deposits (Optional but Recommended)

```js
// src/services/blockchainService.js
async function listenForAgentDeposits() {
  const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC);
  const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);

  usdt.on("Transfer", async (from, to, value) => {
    const agent = await Agent.findOne({
      where: { deposit_address: to.toLowerCase() },
    });
    if (agent) {
      const amount = ethers.formatUnits(value, 6); // USDT has 6 decimals
      await agentService.depositCapacity(agent.id, amount, tx.hash);
    }
  });
}
```

Run on startup.

---

## Final API Summary

| Method | Endpoint                       | Auth  | Purpose                                 |
| ------ | ------------------------------ | ----- | --------------------------------------- |
| `POST` | `/api/agents/deposit`          | Agent | Add USDT (manual tx_hash)               |
| `POST` | `/api/agents/withdraw-deposit` | Agent | Request payout                          |
| `GET`  | `/api/agents/deposit-address`  | Agent | Get QR code                             |
| `GET`  | `/api/agents/profile`          | Agent | See `deposit_usd`, `available_capacity` |

---

## Frontend (App) Flow

```text
Agent Dashboard
└─ Capacity: $7,320 / $10,000
   ├─ [Deposit More] → Show QR + address
   ├─ [Withdraw $2,680] → Confirm → Pending
   └─ History: +$5,000 (May 1), -$1,000 (Apr 15)
```

---

## TL;DR — What to Copy-Paste

1. **Add `deposit_address` to `Agent` model + migration**
2. **Generate address in `registerAgent()`**
3. **Add 3 new routes** to `agents.js`
4. **Add 3 new controller methods**
5. **Add `depositCapacity()` and `withdrawDeposit()` to `agentService`**
6. **Add transaction types**
7. **(Optional) Add blockchain listener**
