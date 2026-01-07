# Agent Deposit & Withdrawal Flow Documentation

## 🔄 Complete Agent Flow

### Overview

This system allows agents to deposit USDT as collateral on Polygon (Amoy testnet), which determines their token minting capacity. Withdrawals are managed through an approval process to ensure sufficient collateral remains for outstanding tokens.

---

## 📥 Deposit Flow

### Step 1: Agent Registration

**Endpoint:** `POST /api/v1/agents/register`

```json
{
  "country": "NG",
  "currency": "NGN",
  "withdrawal_address": "0x5d0d0e728e6656A279707262e403Ca2f2C2AA746"
}
```

**Response:**

```json
{
  "status": "pending",
  "tier": "starter",
  "deposit_instructions": {
    "send_usdt_to": "0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e",
    "network": "Polygon",
    "minimum_deposit": 100
  }
}
```

### Step 2: Get Deposit Address

**Endpoint:** `GET /api/v1/agents/deposit-address`

Returns treasury address with QR code and detailed instructions.

### Step 3: Agent Sends USDT (Off-Platform)

Using the agent's wallet (via MetaMask, Trust Wallet, etc.):

- Network: Polygon (Amoy testnet)
- To: Treasury Address (`0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e`)
- Token: USDT (6 decimals)
- Amount: Minimum 100 USDT

**Blockchain Script:**

```bash
npx hardhat run src/blockchain/scripts/agentDeposit.js --network amoy
```

### Step 4: Submit Transaction Hash

**Endpoint:** `POST /api/v1/agents/deposit`

```json
{
  "amount_usd": 150,
  "tx_hash": "0xed6fa71b0d36ba6647c73d8e9983cebd1d4ecaafa8fa444bbe4628efd1f62e07"
}
```

**Backend Verification Process:**

1. Fetch transaction receipt from blockchain
2. Verify transaction status (must be successful)
3. Parse Transfer event logs
4. Confirm recipient is treasury address
5. Validate amount (allows 0.1% variance)
6. Update agent capacity in database
7. Create transaction record

**Success Response:**

```json
{
  "agent": {
    "status": "active",
    "deposit_usd": 150,
    "available_capacity": 150
  },
  "transaction": {
    "type": "agent_deposit",
    "status": "completed",
    "metadata": {
      "tx_hash": "0x...",
      "from_address": "0x...",
      "block_number": 28665286
    }
  }
}
```

---

## 📤 Withdrawal Flow

### Step 1: Agent Requests Withdrawal

**Endpoint:** `POST /api/v1/agents/withdraw-request`

```json
{
  "amount_usd": 50
}
```

**Validation:**

- Agent must have no outstanding minted tokens
- Amount must not exceed `deposit_usd - total_minted + total_burned`
- Agent status must be active

**Response:**

```json
{
  "request": {
    "id": "16393387-1aff-4823-a62a-a37a782d6aef",
    "status": "pending",
    "amount_usd": "50.00"
  },
  "max_withdrawable": 150,
  "outstanding_tokens": 0
}
```

### Step 2: Admin Reviews Request

**Endpoint:** `GET /api/v1/admin/withdrawals/pending`

Returns all pending withdrawal requests with safety checks:

```json
{
  "request": {
    "id": "...",
    "amount_usd": "50.00",
    "agent": {
      "withdrawal_address": "0x5d0d0e728e6656a279707262e403ca2f2c2aa746"
    }
  },
  "outstanding_tokens": 0,
  "max_withdrawable": 150,
  "is_safe": true // Can withdraw without risk
}
```

### Step 3: Admin Approves

**Endpoint:** `POST /api/v1/admin/withdrawals/approve`

```json
{
  "request_id": "16393387-1aff-4823-a62a-a37a782d6aef"
}
```

**Backend Process:**

- Verify request exists and is pending
- Update status to "approved"
- Return payment instructions

**Response:**

```json
{
  "status": "approved",
  "payment_info": {
    "send_to": "0x5d0d0e728e6656a279707262e403Ca2f2c2AA746",
    "amount_usd": "50.00",
    "network": "Polygon",
    "token": "USDT"
  }
}
```

### Step 4: Admin Sends USDT (Off-Platform)

Admin manually sends USDT from treasury to agent's withdrawal address.

### Step 5: Admin Confirms Payment

**Endpoint:** `POST /api/v1/admin/withdrawals/paid`

```json
{
  "request_id": "16393387-1aff-4823-a62a-a37a782d6aef",
  "tx_hash": "0xd6feaa4fd521221bb5c8ded17dda5a35aaaf202c8202780bd657dab3d8aa55af"
}
```

**Backend Process:**

1. Update withdrawal request to "paid"
2. Record transaction hash
3. Reduce agent's `deposit_usd` by withdrawal amount
4. Update `available_capacity`
5. Create transaction record

---

## 💾 Database State Changes

### On Deposit:

```sql
-- agents table
deposit_usd += amount
available_capacity += amount
status = 'active'

-- transactions table
INSERT (type='agent_deposit', status='completed', ...)
```

### On Withdrawal:

```sql
-- withdrawal_requests table
status: 'pending' → 'approved' → 'paid'

-- agents table (on "paid")
deposit_usd -= amount
available_capacity -= amount

-- transactions table
INSERT (type='agent_withdrawal', status='completed', ...)
```

---

## 🔐 Security Features

### Blockchain Verification

- Transaction must exist and be confirmed
- Must contain Transfer event to treasury
- Amount must match within 0.1% tolerance
- Prevents replay attacks (tx_hash must be unique)

### Withdrawal Safety

- Cannot withdraw if `outstanding_tokens > 0`
- Maximum withdrawal = `deposit_usd - total_minted + total_burned`
- Admin approval required
- Two-step confirmation (approve → paid)

---

## 📊 Agent Dashboard View

**Endpoint:** `GET /api/v1/agents/dashboard`

```json
{
  "financials": {
    "total_deposit": 150,
    "available_capacity": 100, // After $50 withdrawal
    "total_minted": 0,
    "total_burned": 0,
    "outstanding_tokens": 0,
    "max_withdrawable": 100,
    "utilization_rate": "0.00%"
  }
}
```

---

## 🛠️ Blockchain Scripts

### Check Connection

```bash
npx hardhat run scripts/checkConnection.js --network amoy
```

### Deploy Test USDT

```bash
npx hardhat run scripts/deployTestUSDT.js --network amoy
```

### Mint to Agent

```bash
npx hardhat run scripts/mintToAgent.js --network amoy
```

### Agent Deposit Simulation

```bash
npx hardhat run scripts/agentDeposit.js --network amoy
```

### Check Balances

```bash
npx hardhat run scripts/checkBalances.js --network amoy
```

---

## 🔍 Key Addresses (Amoy Testnet)

- **Treasury:** `0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e`
- **Test USDT Contract:** `0xb5d4f122a9B353054A8EeF9E16C16BE1E8765d59`
- **Agent Wallet (Example):** `0x5d0d0e728e6656A279707262e403Ca2f2C2AA746`

---

## ⚠️ Important Notes

1. **USDT Decimals:** Uses 6 decimals (not 18 like many ERC20s)
2. **Network:** Polygon (Amoy testnet for development)
3. **Gas Token:** MATIC required for transactions
4. **Minimum Deposit:** 100 USDT
5. **Withdrawal Lock:** Cannot withdraw while tokens are outstanding

---

## 🧪 Testing Checklist

- [x] Agent registration
- [x] Deposit address retrieval
- [x] Blockchain deposit verification
- [x] Agent activation on deposit
- [x] Dashboard capacity updates
- [x] Withdrawal request creation
- [x] Admin withdrawal listing
- [x] Admin approval process
- [x] Payment confirmation
- [x] Capacity reduction on withdrawal

---

## 🚀 Next Steps

1. **Mainnet Deployment**

   - Switch to Polygon mainnet
   - Use real USDT contract
   - Update RPC URLs

2. **Automation Opportunities**

   - Auto-detect deposits via event listeners
   - Automated withdrawal execution
   - Real-time balance monitoring

3. **Enhanced Features**
   - Multi-signature wallet for treasury
   - Automated compliance checks
   - Transaction history export
