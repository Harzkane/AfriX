# Escrow Routes Testing Guide

## Prerequisites

- Server running on `http://localhost:5001`
- You have a registered user with JWT token
- User ID: `b20f56f7-9471-45c6-b56a-51d6e5117217`
- User has wallets with token balances (NT, CT, USDT)
- At least one registered and verified agent in the system
- Agent ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

## Authentication Header

All requests require authentication. Add this header to every request:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## What is Escrow?

Escrow is a security mechanism that:

1. **Locks tokens** from seller's wallet
2. **Holds tokens safely** during transaction
3. **Releases tokens** only when conditions are met
4. **Protects both parties** from fraud

### Escrow Use Cases:

- **Token Burning**: User wants to sell tokens for fiat
- **P2P Trading**: User-to-user token transfers
- **Agent Transactions**: Agent-facilitated exchanges

---

## Escrow Lifecycle

```
1. LOCKED → Tokens held in escrow
   ↓
2. FINALIZED → Transaction completed, tokens released/burned
   ↓ OR
3. REFUNDED → Transaction cancelled, tokens returned
   ↓ OR
4. DISPUTED → Problem occurred, under review
```

---

## 1. Lock Tokens for Burn (Create Escrow)

**POST** `http://localhost:5001/api/v1/escrows/lock`

This endpoint locks user's tokens in escrow while waiting for agent to send fiat.

### Request Body:

```json
{
  "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "token_type": "NT",
  "amount": 5000,
  "metadata": {
    "reason": "Sell tokens for fiat",
    "bank_name": "First Bank",
    "account_number": "1234567890",
    "account_name": "John Doe"
  }
}
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "tx-1234-5678-90ab-cdef",
      "sender_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
      "receiver_id": null,
      "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "amount": "5000.00000000",
      "currency": "NT",
      "transaction_type": "BURN",
      "status": "pending",
      "description": "Token burn via escrow",
      "reference": "ESCROW-2025-001",
      "created_at": "2025-10-24T15:30:00.000Z"
    },
    "escrow": {
      "id": "escrow-123-456-789",
      "transaction_id": "tx-1234-5678-90ab-cdef",
      "from_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
      "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "token_type": "NT",
      "amount": "5000.00000000",
      "status": "LOCKED",
      "expires_at": "2025-10-24T18:30:00.000Z",
      "metadata": {
        "reason": "Sell tokens for fiat",
        "bank_name": "First Bank",
        "account_number": "1234567890",
        "account_name": "John Doe"
      },
      "created_at": "2025-10-24T15:30:00.000Z"
    }
  }
}
```

### ✅ What to Check:

- Response status: 201
- Both `transaction` and `escrow` objects returned
- Tokens are deducted from user's wallet
- Escrow `status` is "LOCKED"
- Transaction `status` is "pending"
- `expires_at` is 3 hours from now (configurable)
- Transaction has unique reference number

### Workflow After Lock:

```
1. Tokens locked in escrow ✓
2. User contacts agent
3. Agent verifies bank details
4. Agent sends fiat to user's bank
5. Agent calls finalize endpoint
6. Tokens burned, escrow closed
```

### ❌ Error Cases:

**Insufficient Balance:**

```json
{
  "token_type": "NT",
  "amount": 1000000
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Insufficient balance. Available: 10000 NT"
}
```

**Invalid Token Type:**

```json
{
  "token_type": "INVALID"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "token_type and amount required"
}
```

**Agent Not Found:**

```json
{
  "agent_id": "non-existent-id",
  "token_type": "NT",
  "amount": 100
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Agent not found or not active"
}
```

**Missing Required Fields:**

```json
{
  "token_type": "NT"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "token_type and amount required"
}
```

**No Agent Specified (Optional):**

```json
{
  "token_type": "NT",
  "amount": 5000
}
```

This is valid - escrow will be created without agent assignment. System can auto-assign agent later.

---

## 2. Finalize Escrow (Complete Transaction)

**POST** `http://localhost:5001/api/v1/escrows/:id/finalize`

Agent calls this endpoint after sending fiat to user. This burns the tokens and completes the transaction.

### Request Body:

```json
{
  "evidence": {
    "payment_receipt": "https://cdn.example.com/receipt-123.pdf",
    "transaction_ref": "FBN-2025-12345",
    "notes": "Fiat sent to user's account via bank transfer"
  }
}
```

### URL Parameter:

```
:id = escrow-123-456-789 (from lock response)
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "escrow-123-456-789",
      "status": "FINALIZED",
      "updated_at": "2025-10-24T15:45:00.000Z"
    },
    "transaction": {
      "id": "tx-1234-5678-90ab-cdef",
      "status": "completed",
      "completed_at": "2025-10-24T15:45:00.000Z"
    },
    "tokens_burned": "5000.00000000",
    "agent_fee": "125.00000000"
  }
}
```

### ✅ What to Check:

- Escrow `status` changed to "FINALIZED"
- Transaction `status` changed to "completed"
- Tokens are burned (removed from circulation)
- Agent receives fee (based on tier)
- User's wallet balance reflects burn
- Agent's `total_burned` is updated
- Agent's `available_capacity` is restored

### Who Can Finalize:

- **Agent assigned to escrow** (primary)
- **System admin** (override/assistance)

### ❌ Error Cases:

**Escrow Not Found:**

```
POST /escrows/invalid-id/finalize
```

Expected Error:

```json
{
  "success": false,
  "message": "Escrow not found"
}
```

**Escrow Already Finalized:**

```
POST /escrows/already-finalized-id/finalize
```

Expected Error:

```json
{
  "success": false,
  "message": "Escrow already finalized or refunded"
}
```

**Escrow Expired:**

If escrow is older than 3 hours (configurable):

```json
{
  "success": false,
  "message": "Escrow has expired. Cannot finalize."
}
```

**Unauthorized (Not Agent/Admin):**

```json
{
  "success": false,
  "message": "Only assigned agent or admin can finalize escrow"
}
```

---

## 3. Refund Escrow (Cancel Transaction)

**POST** `http://localhost:5001/api/v1/escrows/:id/refund`

**Admin only** - Returns locked tokens to user if transaction cannot be completed.

### Request Body:

```json
{
  "reason": "Agent unable to send fiat",
  "notes": "User requested cancellation after 2 hours waiting"
}
```

### URL Parameter:

```
:id = escrow-123-456-789
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "escrow": {
      "id": "escrow-123-456-789",
      "status": "REFUNDED",
      "updated_at": "2025-10-24T16:00:00.000Z"
    },
    "transaction": {
      "id": "tx-1234-5678-90ab-cdef",
      "status": "failed",
      "updated_at": "2025-10-24T16:00:00.000Z"
    },
    "tokens_refunded": "5000.00000000",
    "refunded_to": "b20f56f7-9471-45c6-b56a-51d6e5117217"
  }
}
```

### ✅ What to Check:

- Escrow `status` changed to "REFUNDED"
- Transaction `status` changed to "failed"
- Tokens returned to user's wallet
- User's wallet balance restored
- Refund reason recorded in metadata
- No fees charged to user

### When to Refund:

- **Agent unavailable** - Agent doesn't respond
- **Transaction error** - Technical issues
- **User cancellation** - User changes mind (within window)
- **Expired escrow** - Past timeout period
- **Dispute resolution** - Admin decides to refund

### ❌ Error Cases:

**Unauthorized (Not Admin):**

```json
{
  "success": false,
  "message": "Only admins can refund escrows"
}
```

**Escrow Already Finalized:**

```json
{
  "success": false,
  "message": "Cannot refund escrow that has been finalized"
}
```

**Escrow Already Refunded:**

```json
{
  "success": false,
  "message": "Escrow already refunded"
}
```

---

## 4. Get Escrow Details

**GET** `http://localhost:5001/api/v1/escrows/:id`

Retrieve full details of a specific escrow.

### URL Parameter:

```
:id = escrow-123-456-789
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "escrow-123-456-789",
    "transaction_id": "tx-1234-5678-90ab-cdef",
    "from_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
    "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "token_type": "NT",
    "amount": "5000.00000000",
    "status": "LOCKED",
    "expires_at": "2025-10-24T18:30:00.000Z",
    "metadata": {
      "reason": "Sell tokens for fiat",
      "bank_name": "First Bank",
      "account_number": "1234567890",
      "account_name": "John Doe"
    },
    "created_at": "2025-10-24T15:30:00.000Z",
    "updated_at": "2025-10-24T15:30:00.000Z"
  }
}
```

### ✅ What to Check:

- All escrow details are returned
- Current `status` is accurate
- `expires_at` shows timeout deadline
- Metadata contains transaction context
- Timestamps show creation and last update

### ❌ Error Case:

**Escrow Not Found:**

```
GET /escrows/non-existent-id
```

Expected Error:

```json
{
  "success": false,
  "message": "Escrow not found"
}
```

---

## Testing Sequence Summary

Run tests in this order:

### Setup Phase:

1. ✅ **Register user** - POST /auth/register
2. ✅ **Login** - POST /auth/login (get JWT token)
3. ✅ **Verify wallet balance** - GET /wallets (ensure sufficient balance)
4. ✅ **Register agent** - POST /agents/register
5. ✅ **Admin verifies agent** (manual step or admin endpoint)

### Basic Escrow Flow:

6. ✅ **POST /escrows/lock** - Lock 5000 NT tokens
   - Save `escrow_id` and `transaction_id`
7. ✅ **GET /escrows/:id** - Verify escrow created (LOCKED)
8. ✅ **Simulate agent sending fiat** (external process)
9. ✅ **POST /escrows/:id/finalize** - Complete transaction
10. ✅ **GET /escrows/:id** - Verify escrow finalized
11. ✅ **GET /wallets** - Verify tokens burned

### Refund Flow:

12. ✅ **POST /escrows/lock** - Lock 1000 NT tokens
13. ✅ **POST /escrows/:id/refund** - Admin refunds escrow
14. ✅ **GET /wallets** - Verify tokens returned

### Error Testing:

15. ✅ Try locking with insufficient balance
16. ✅ Try finalizing non-existent escrow
17. ✅ Try refunding already finalized escrow
18. ✅ Try refund without admin privileges

---

## Complete Escrow Flow Example

### Step-by-Step: User Burns 5000 NT for NGN Fiat

#### 1. Initial State

**User Wallet:**

- Balance: 10,000 NT

**Agent Status:**

- Status: ACTIVE
- Available Capacity: $5,000
- Total Burned: 0 NT

#### 2. User Locks Tokens

```bash
POST /escrows/lock
{
  "agent_id": "agent-123",
  "token_type": "NT",
  "amount": 5000,
  "metadata": {
    "bank_name": "First Bank",
    "account_number": "1234567890",
    "account_name": "John Doe"
  }
}
```

**Result:**

- User Balance: 5,000 NT (5,000 locked in escrow)
- Escrow Created: LOCKED
- Transaction Created: pending
- Expires: 3 hours from now

#### 3. Agent Reviews Request

Agent sees:

- User wants 5,000 NT burned
- User's bank details provided
- Must send ₦5,000 to user's account

#### 4. Agent Sends Fiat

Agent transfers ₦5,000 to user's bank account:

- Transfer Reference: FBN-2025-12345
- Payment Receipt: receipt-123.pdf

#### 5. Agent Finalizes Escrow

```bash
POST /escrows/escrow-123/finalize
{
  "evidence": {
    "payment_receipt": "https://cdn.example.com/receipt-123.pdf",
    "transaction_ref": "FBN-2025-12345",
    "notes": "Fiat sent successfully"
  }
}
```

**Result:**

- Tokens Burned: 5,000 NT (removed from circulation)
- User Balance: 5,000 NT (unchanged - already deducted)
- Agent Fee: 125 NT (2.5% of 5,000)
- Agent Total Burned: 5,000 NT
- Agent Available Capacity: $5,000 (restored)
- Transaction Status: completed
- Escrow Status: FINALIZED

#### 6. Final State

**User Wallet:**

- Balance: 5,000 NT (5,000 burned)
- Fiat Received: ₦5,000

**Agent Status:**

- Fee Earned: 125 NT
- Total Burned: 5,000 NT
- Available Capacity: $5,000
- Transaction Count: +1

---

## Escrow Status Reference

### LOCKED

- **Description**: Tokens are held in escrow
- **User Action**: Wait for agent to send fiat
- **Agent Action**: Send fiat and finalize
- **Can Expire**: Yes (after timeout period)

### FINALIZED

- **Description**: Transaction completed successfully
- **Tokens**: Burned or transferred
- **Fee**: Charged to agent
- **Reversible**: No

### REFUNDED

- **Description**: Tokens returned to user
- **Reason**: Cancellation or failure
- **Fee**: No fee charged
- **Reversible**: No

### DISPUTED

- **Description**: Problem occurred, under review
- **Action**: Admin investigates
- **Outcome**: Either finalize or refund
- **Timeline**: Varies by case

---

## Escrow Timeout Configuration

Default timeout is 3 hours, but can be configured:

```javascript
// In constants.js
ESCROW_CONFIG: {
  TIMEOUT_HOURS: 3,
  AUTO_REFUND_EXPIRED: true,
  WARNING_BEFORE_EXPIRY_MINUTES: 30
}
```

### Timeout Behavior:

**Before Expiry:**

- Escrow status: LOCKED
- Can be finalized: Yes
- Can be refunded: Yes

**After Expiry:**

- Auto-refund triggered (if enabled)
- Manual finalize: Requires admin override
- User notified of refund

---

## Escrow Security Features

### 1. Atomic Operations

- Lock and deduct in single transaction
- Prevents double-spending
- Database transaction rollback on error

### 2. Status Validation

- Can't finalize twice
- Can't refund after finalization
- State machine enforced

### 3. Authorization Checks

- Only escrow participants can view
- Only agent/admin can finalize
- Only admin can refund

### 4. Expiry Protection

- Auto-refund after timeout
- Prevents indefinite locks
- User funds always recoverable

### 5. Evidence Trail

- All actions logged
- Metadata preserved
- Audit trail maintained

---

## Testing Checklist

### Basic Operations:

- [ ] Lock tokens successfully
- [ ] Verify escrow created with LOCKED status
- [ ] Verify tokens deducted from wallet
- [ ] Get escrow details
- [ ] Finalize escrow successfully
- [ ] Verify tokens burned
- [ ] Verify agent fee calculated
- [ ] Refund escrow successfully
- [ ] Verify tokens returned to wallet

### Error Handling:

- [ ] Lock with insufficient balance
- [ ] Lock with invalid token type
- [ ] Lock with non-existent agent
- [ ] Finalize non-existent escrow
- [ ] Finalize already finalized escrow
- [ ] Finalize without authorization
- [ ] Refund without admin privileges
- [ ] Refund already finalized escrow

### Edge Cases:

- [ ] Lock without agent (system assigns)
- [ ] Lock with zero amount
- [ ] Lock with negative amount
- [ ] Finalize expired escrow
- [ ] Multiple locks by same user
- [ ] Concurrent lock attempts

### Security:

- [ ] User can't finalize own escrow
- [ ] Non-admin can't refund
- [ ] Invalid agent_id rejected
- [ ] Insufficient balance rejected
- [ ] Status transitions enforced

---

## Common Issues & Solutions

### Issue 1: "Insufficient Balance"

**Cause:** User doesn't have enough tokens

**Solution:**

```bash
# Check wallet balance first
GET /wallets

# Then lock amount within balance
POST /escrows/lock
{
  "amount": 1000  # Less than available balance
}
```

### Issue 2: "Escrow Not Found"

**Cause:** Invalid escrow ID or unauthorized access

**Solution:**

```bash
# Use exact ID from lock response
# Ensure you're the escrow creator or admin
GET /escrows/{correct-escrow-id}
```

### Issue 3: "Cannot Finalize Escrow"

**Cause:** Not authorized or wrong status

**Solution:**

```bash
# Only agent or admin can finalize
# Check escrow status first
GET /escrows/:id

# Must be LOCKED status
POST /escrows/:id/finalize
```

### Issue 4: "Escrow Expired"

**Cause:** More than 3 hours passed

**Solution:**

```bash
# Admin can override or refund
POST /escrows/:id/refund (admin only)
```

### Issue 5: "Agent Not Active"

**Cause:** Agent not verified or suspended

**Solution:**

```bash
# Verify agent status
GET /agents/profile

# Wait for admin verification
# Or use different agent
```

---

## Monitoring Escrows

### As User:

```bash
# Check all your transactions (including escrows)
GET /transactions?type=BURN&status=pending
```

### As Agent:

```bash
# Check escrows assigned to you
GET /agents/transactions?type=BURN&status=pending
```

### As Admin:

```bash
# Check all escrows
GET /admin/escrows?status=LOCKED

# Check expired escrows
GET /admin/escrows?status=LOCKED&expired=true
```

---

## Best Practices

### For Users:

1. **Verify Agent Before Locking**

   - Check agent rating
   - Check agent response time
   - Read reviews

2. **Provide Accurate Bank Details**

   - Double-check account number
   - Use correct account name
   - Verify bank name

3. **Monitor Escrow Status**

   - Check regularly
   - Contact agent if delayed
   - Report issues promptly

4. **Keep Evidence**
   - Save transaction reference
   - Keep bank transfer receipt
   - Screenshot confirmations

### For Agents:

1. **Verify User Details**

   - Confirm bank account validity
   - Match account name with user
   - Verify amount requested

2. **Send Fiat Promptly**

   - Within response time commitment
   - Use traceable payment method
   - Keep payment receipts

3. **Finalize Immediately**

   - After fiat sent
   - Include evidence
   - Add notes for clarity

4. **Handle Disputes Professionally**
   - Respond quickly
   - Provide evidence
   - Cooperate with admin

### For Admins:

1. **Monitor Expired Escrows**

   - Auto-refund or investigate
   - Contact parties involved
   - Document decisions

2. **Handle Refunds Carefully**

   - Verify refund necessity
   - Check both parties' claims
   - Record reason clearly

3. **Review Evidence**
   - Check payment receipts
   - Verify transaction references
   - Look for patterns

---

## Escrow Metrics

Track these metrics for monitoring:

### Performance Metrics:

- Average lock-to-finalize time
- Escrow success rate
- Refund rate
- Expiry rate

### Volume Metrics:

- Total escrows created
- Total value locked
- Total tokens burned
- Total fees generated

### Agent Metrics:

- Escrows per agent
- Average finalization time
- Success rate per agent
- Dispute rate per agent

---

## Integration Notes

### Frontend Integration:

```javascript
// Lock tokens in escrow
async function lockTokensForBurn(agentId, amount, bankDetails) {
  const response = await fetch("/api/v1/escrows/lock", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: agentId,
      token_type: "NT",
      amount: amount,
      metadata: bankDetails,
    }),
  });

  const data = await response.json();
  return data.data.escrow.id; // Save this ID
}

// Poll escrow status
async function checkEscrowStatus(escrowId) {
  const response = await fetch(`/api/v1/escrows/${escrowId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.data.status; // LOCKED, FINALIZED, REFUNDED, DISPUTED
}
```

### Backend Integration:

```javascript
// After receiving payment confirmation
async function completeEscrowTransaction(escrowId, evidence) {
  const response = await fetch(`/api/v1/escrows/${escrowId}/finalize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${agentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ evidence }),
  });

  return response.json();
}
```

---

## Webhook Events (If Implemented)

Escrow status changes can trigger webhooks:

### Event: `escrow.locked`

```json
{
  "event": "escrow.locked",
  "escrow_id": "escrow-123",
  "user_id": "user-456",
  "agent_id": "agent-789",
  "amount": "5000.00",
  "token_type": "NT",
  "expires_at": "2025-10-24T18:30:00Z"
}
```

### Event: `escrow.finalized`

```json
{
  "event": "escrow.finalized",
  "escrow_id": "escrow-123",
  "tokens_burned": "5000.00",
  "agent_fee": "125.00",
  "completed_at": "2025-10-24T15:45:00Z"
}
```

### Event: `escrow.refunded`

```json
{
  "event": "escrow.refunded",
  "escrow_id": "escrow-123",
  "tokens_refunded": "5000.00",
  "reason": "Transaction cancelled",
  "refunded_at": "2025-10-24T16:00:00Z"
}
```

### Event: `escrow.expired`

```json
{
  "event": "escrow.expired",
  "escrow_id": "escrow-123",
  "auto_refunded": true,
  "expired_at": "2025-10-24T18:30:00Z"
}
```

---

## Additional Resources

- **Escrow Model**: `/src/models/Escrow.js`
- **Escrow Service**: `/src/services/escrowService.js`
- **Escrow Controller**: `/src/controllers/escrowController.js`
- **Constants**: `/src/config/constants.js` (ESCROW_STATUS, ESCROW_CONFIG)
