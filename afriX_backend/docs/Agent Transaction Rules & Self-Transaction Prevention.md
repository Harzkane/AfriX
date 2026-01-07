# Agent Transaction Rules & Self-Transaction Prevention

## Document Purpose

This document explains the business rules and technical implementation for preventing agent self-transactions in the AfriToken platform, including the rationale, implementation details, and user experience considerations.

---

## Table of Contents

1. [Business Context](#business-context)
2. [Transaction Rules](#transaction-rules)
3. [Why Prevent Self-Transactions](#why-prevent-self-transactions)
4. [Why Allow Agent-to-Agent Transactions](#why-allow-agent-to-agent-transactions)
5. [Why Allow Token Swaps (Including for Agents)](#why-allow-token-swaps-including-for-agents)
6. [Why Allow P2P Transfers (Send/Receive) for Agents](#why-allow-p2p-transfers-sendreceive-for-agents)
7. [Dispute System & Transaction Types](#dispute-system--transaction-types)
8. [Technical Implementation](#technical-implementation)
9. [User Experience](#user-experience)
10. [Testing Scenarios](#testing-scenarios)

---

## Business Context

### Agent Role in AfriToken

Agents are **independent contractors** who facilitate the exchange between digital tokens (NT/CT) and fiat currency (Naira/XOF). They serve as the bridge between the blockchain-based token system and traditional banking/mobile money systems.

**Core Agent Functions:**
- **Minting**: Users send fiat → Agent mints tokens to user's wallet
- **Burning**: Users send tokens to escrow → Agent sends fiat → Tokens burned

**Agent Capacity System:**
- Agents deposit USDT as collateral
- Minting capacity = Deposit amount
- Capacity decreases when minting tokens
- Capacity increases when burning tokens

---

## Transaction Rules

### ✅ Allowed Transactions

| Transaction Type | Allowed? | Reason |
|-----------------|----------|---------|
| User → Agent (Mint) | ✅ Yes | Core business function |
| User → Agent (Burn) | ✅ Yes | Core business function |
| Agent A → Agent B (Mint) | ✅ Yes | Legitimate liquidity management |
| Agent A → Agent B (Burn) | ✅ Yes | Legitimate liquidity management |
| User → Self (Swap) | ✅ Yes | Self-service portfolio management |
| Agent → Self (Swap) | ✅ Yes | Agent portfolio management |
| User → User (P2P Transfer) | ✅ Yes | Peer-to-peer token sharing |
| Agent → User (P2P Transfer) | ✅ Yes | Legitimate payments |
| User → Agent (P2P Transfer) | ✅ Yes | Legitimate payments |
| Agent → Agent (P2P Transfer) | ✅ Yes | Inter-agent payments |

### ❌ Prohibited Transactions

| Transaction Type | Allowed? | Reason |
|-----------------|----------|---------|
| Agent → Self (Mint) | ❌ No | Gaming prevention (see below) |
| Agent → Self (Burn) | ❌ No | Gaming prevention (see below) |
| User → Self (P2P Transfer) | ❌ No | Already blocked by system |
| Agent → Self (P2P Transfer) | ❌ No | Already blocked by system |

### 📝 Transaction Type Definitions

**Mint/Burn Transactions**:
- Involve two parties: User and Agent
- Require fiat exchange (bank/mobile money)
- Subject to escrow and dispute system
- Affect agent capacity

**Swap Transactions**:
- Single party: User swaps their own tokens
- No fiat exchange (token-to-token)
- Instant execution at platform rate
- No agent involvement
- No capacity impact

**P2P Transfer Transactions**:
- Two parties: Sender and Recipient
- No fiat exchange (token-to-token)
- 0.5% fee charged to sender
- Instant execution
- No agent involvement (unless sender/recipient is an agent)
- No capacity impact
- Self-transfers already blocked by system

---

## Why Prevent Self-Transactions

### 1. Conflict of Interest

**Problem**: An agent acting as both buyer and seller creates an inherent conflict of interest.

**Example Scenario**:
```
Agent Alice creates a mint request to herself:
- Alice (as user) "sends" ₦10,000 to Alice (as agent)
- Alice (as agent) confirms receiving payment
- Alice (as user) receives 10,000 NT tokens
```

**Issue**: There's no actual exchange of value. Alice is both parties in the transaction.

### 2. Gaming the System

#### 2.1 Artificial Transaction Volume

**Problem**: Agents could inflate their transaction statistics.

**Attack Vector**:
```
Agent Bob wants to appear as a high-volume agent:
1. Creates 100 mint requests to himself
2. Confirms all requests instantly
3. Transaction count: 100 (fake)
4. Appears as "top agent" in rankings
```

**Impact**:
- Misleading user trust indicators
- Unfair competitive advantage
- Corrupted performance metrics

#### 2.2 Capacity Manipulation

**Problem**: Agents could manipulate their capacity metrics without real transactions.

**Mint Gaming**:
```
Agent Carol has $10,000 capacity:
1. Mints 10,000 NT to herself
2. Capacity drops to $0
3. Burns 10,000 NT from herself
4. Capacity returns to $10,000
5. Repeat indefinitely
```

**Impact**:
- Artificial capacity cycling
- Misleading availability metrics
- Potential fee farming (if fees apply)

#### 2.3 Escrow System Bypass

**Problem**: The escrow and dispute system becomes meaningless.

**Burn Gaming**:
```
Agent Dave creates burn request to himself:
1. Locks 5,000 NT in escrow (as user)
2. "Sends" fiat to himself (as agent)
3. Confirms receipt (as user)
4. Tokens burned, capacity increased
```

**Issue**: No real risk or accountability since Dave controls both sides.

#### 2.4 Dispute System Undermined

**Problem**: Self-transactions make disputes impossible to resolve fairly.

**Scenario 1: Agent Creates Fake Dispute**:
```
Agent Eve (as user) creates burn request to Agent Eve (as agent):
1. Locks 10,000 NT in escrow
2. Eve (as agent) marks "fiat sent" but doesn't actually send
3. Eve (as user) can either:
   a) Confirm receipt → Gets capacity increase
   b) Dispute → Gets tokens refunded + slashes own deposit
4. Eve chooses whichever benefits her more
```

**Impact**:
- Can manipulate dispute outcomes
- Can test system vulnerabilities without risk
- Can claim deposit slashing as "business expense"
- Undermines trust in dispute resolution

**Scenario 2: Impossible to Verify Truth**:
```
Admin reviews dispute between Agent Frank (user) vs Agent Frank (agent):
- Frank (user): "I didn't receive payment"
- Frank (agent): "I sent payment"
- Evidence: Frank's bank statements show transfer to... Frank
- Admin: Cannot determine if this was legitimate or gaming
```

**Why This Matters**:
- Dispute system relies on **two independent parties** with conflicting interests
- Self-transactions eliminate this fundamental requirement
- Admins cannot fairly adjudicate disputes where both parties are the same person
- System integrity depends on genuine conflicts, not manufactured ones

**Real-World Example**:
```
Normal Dispute (User vs Agent):
User: "Agent didn't send my ₦10,000"
Agent: "I sent it, here's proof"
Admin: Reviews both parties' evidence, makes decision
Result: Fair resolution based on evidence

Self-Transaction "Dispute" (Agent vs Self):
Agent (as user): "I didn't receive ₦10,000"
Agent (as agent): "I sent it to myself"
Admin: ??? Both parties controlled by same person
Result: Cannot determine intent, system compromised
```

### 3. Regulatory Concerns

**Problem**: Self-transactions could be viewed as:
- Money laundering (moving funds in circles)
- Market manipulation
- Fraudulent activity reporting

**Risk**: Regulatory scrutiny and potential legal issues.

### 4. Data Integrity

**Problem**: Analytics and reporting become unreliable.

**Corrupted Metrics**:
- Total transaction volume (inflated)
- Agent performance ratings (artificial)
- User satisfaction scores (self-rated)
- Platform growth metrics (misleading)

---

## Why Allow Agent-to-Agent Transactions

### 1. Legitimate Business Need

**Liquidity Management**:
```
Scenario: Agent Emma has high token inventory but low fiat
Solution: Sells tokens to Agent Frank who has fiat but needs tokens
Result: Both agents can better serve their user base
```

### 2. Market Efficiency

**Benefits**:
- Agents can rebalance inventory
- Reduces service interruptions for users
- Creates a secondary market for liquidity
- Enables geographic arbitrage (if rates differ)

### 3. Real-World Parallel

**Traditional Money Exchange**:
- Currency dealers trade with each other
- Wholesale vs retail markets exist
- Inter-dealer transactions are normal

**AfriToken Equivalent**:
- Agents trading with agents = wholesale market
- Agents serving users = retail market

### 4. Technical Safety

**Escrow Protection Still Works**:
```
Agent Grace buys from Agent Henry:
1. Grace's tokens locked in escrow
2. Grace sends fiat to Henry
3. Henry confirms receipt
4. If dispute: Escrow system resolves it
```

**No Special Risk**: The same protections apply as user transactions.

### 5. No Gaming Advantage

**Why Agent-to-Agent Doesn't Enable Gaming**:
- Requires two different agents (can't game alone)
- Real fiat exchange must occur
- Escrow system enforces accountability
- Both agents risk their deposits

---

## Why Allow Token Swaps (Including for Agents)

### 1. Fundamental Difference from Mint/Burn

**Swaps Are Self-Service**:
```
Token Swap Flow:
User → Swaps own tokens (NT ↔ CT ↔ USDT)
- No agent involvement
- No fiat exchange
- Instant execution
- Platform-controlled rate
```

**Mint/Burn Requires Two Parties**:
```
Mint/Burn Flow:
User ↔ Agent (two different parties required)
- Agent facilitates fiat exchange
- Escrow protection needed
- Dispute system applies
```

### 2. No Gaming Risk

**Why Swaps Can't Be Gamed**:

**No Capacity Manipulation**:
```
Agent swaps 10,000 NT → 10,000 CT:
- Minting capacity: UNCHANGED
- No tokens created or destroyed
- Just portfolio rebalancing
```

**No Transaction Volume Inflation**:
- Swaps are clearly labeled as "SWAP" type
- Separate from mint/burn metrics
- Can't inflate agent performance ratings
- No impact on agent rankings

**No Escrow Bypass**:
- No escrow involved in swaps
- No dispute system needed
- Instant execution (no waiting period)

### 3. Legitimate Business Need for Agents

**Portfolio Management**:
```
Scenario: Agent has 50,000 NT but needs CT for XOF region users
Solution: Swap NT → CT at platform rate
Result: Agent can serve both Nigerian and XOF users
```

**Benefits**:
- Agents can rebalance token holdings
- Serve users in different regions
- Manage inventory efficiently
- No need to mint/burn through another agent

### 4. Technical Implementation

**How Swaps Work**:

**Location**: `/src/controllers/walletController.js` and `/src/services/walletService.js`

```javascript
async swap({ userId, fromToken, toToken, amount }) {
  // Validation
  if (fromToken === toToken) {
    throw new ApiError("Cannot swap same token type", 400);
  }
  
  // Get exchange rate from platform
  const exchangeRate = getExchangeRate(fromToken, toToken);
  const receiveAmount = amount * exchangeRate;
  
  return sequelize.transaction(async (t) => {
    // Debit from wallet
    fromWallet.balance -= amount;
    
    // Credit to wallet
    toWallet.balance += receiveAmount;
    
    // Create transaction record
    await Transaction.create({
      type: TRANSACTION_TYPES.SWAP,
      from_user_id: userId,
      to_user_id: userId,  // Same user!
      metadata: {
        from_token: fromToken,
        to_token: toToken,
        exchange_rate: exchangeRate,
      }
    });
  });
}
```

**Key Points**:
- `from_user_id` === `to_user_id` (self-transaction by design)
- No agent_id involved
- No capacity checks
- Instant execution

### 5. No Validation Needed

**Why We Don't Block Agent Swaps**:

1. **No Conflict**: User swapping their own tokens (no second party)
2. **No Gaming**: Can't manipulate metrics or capacity
3. **Legitimate Use**: Agents need portfolio flexibility
4. **Platform Controlled**: Exchange rates set by platform, not negotiable
5. **Transparent**: All swaps logged and auditable

### 6. Comparison Table

| Feature | Mint/Burn | Swap |
|---------|-----------|------|
| Parties Involved | 2 (User + Agent) | 1 (User only) |
| Fiat Exchange | ✅ Yes | ❌ No |
| Agent Involvement | ✅ Required | ❌ None |
| Escrow | ✅ Yes | ❌ No |
| Capacity Impact | ✅ Yes | ❌ No |
| Gaming Risk | ⚠️ High (if self) | ✅ None |
| Validation Needed | ✅ Yes | ❌ No |
| Agent Can Do to Self | ❌ Blocked | ✅ Allowed |

---

## Why Allow P2P Transfers (Send/Receive) for Agents

### 1. What Are P2P Transfers?

**Peer-to-Peer Token Transfers**:
```
Transfer Flow:
User A → Sends tokens → User B (by email)
- No agent involvement
- No fiat exchange
- 0.5% fee charged to sender
- Instant execution
```

**Use Cases**:
- Sending tokens to friends/family
- Paying for goods/services
- Splitting bills
- Gifting tokens

### 2. Self-Transfer Already Blocked

**System Protection**:

**Location**: `/src/services/walletService.js`

```javascript
async transfer({ fromUserId, toUserEmail, amount, token_type }) {
  const recipient = await User.findOne({ where: { email: toUserEmail } });
  
  if (!recipient) {
    throw new ApiError("Recipient not found", 404);
  }
  
  // ✅ Self-transfer prevention already built-in
  if (recipient.id === fromUserId) {
    throw new ApiError("Cannot send to self", 400);
  }
  
  // ... rest of transfer logic
}
```

**Key Point**: The system already prevents **anyone** (including agents) from sending tokens to themselves.

### 3. Why Allow Agents to Send/Receive

**Legitimate Agent Use Cases**:

**Agent Sending Tokens**:
```
Scenario 1: Agent pays another agent for services
Agent Alice → Transfers 1,000 NT → Agent Bob
Reason: Bob helped Alice with customer support

Scenario 2: Agent sends to personal account
Agent Carol (business) → Transfers 5,000 NT → Carol (personal)
Reason: Withdrawing earnings to personal wallet
```

**Agent Receiving Tokens**:
```
Scenario 3: User tips agent for good service
User Dave → Transfers 100 NT → Agent Emma
Reason: Appreciation for fast service

Scenario 4: Agent receives payment from another agent
Agent Frank → Transfers 2,000 NT → Agent Grace
Reason: Payment for liquidity provision
```

### 4. No Gaming Risk

**Why P2P Transfers Can't Be Gamed**:

**No Capacity Manipulation**:
```
Agent sends/receives 10,000 NT:
- Minting capacity: UNCHANGED
- No tokens created or destroyed
- Just moving existing tokens
```

**Fee Prevents Abuse**:
```
Agent tries to cycle tokens:
- Send 10,000 NT → Pay 50 NT fee (0.5%)
- Receive 10,000 NT back → Sender pays 50 NT fee
- Net loss: 100 NT per cycle
- Makes gaming unprofitable
```

**No Transaction Volume Inflation**:
- P2P transfers labeled as "TRANSFER" type
- Separate from mint/burn metrics
- Can't inflate agent performance ratings

### 5. Technical Implementation

**How P2P Transfers Work**:

**Location**: `/src/controllers/walletController.js` and `/src/services/walletService.js`

```javascript
async transfer({ fromUserId, toUserEmail, amount, token_type }) {
  // Find recipient
  const recipient = await User.findOne({ where: { email: toUserEmail } });
  
  // Prevent self-transfer
  if (recipient.id === fromUserId) {
    throw new ApiError("Cannot send to self", 400);
  }
  
  // Calculate fee (0.5%)
  const FEE_RATE = 0.005;
  const fee = amount * FEE_RATE;
  const totalDebit = amount + fee;
  
  return sequelize.transaction(async (t) => {
    // Debit sender (amount + fee)
    senderWallet.balance -= totalDebit;
    
    // Credit recipient (amount only)
    receiverWallet.balance += amount;
    
    // Create transaction record
    await Transaction.create({
      type: TRANSACTION_TYPES.TRANSFER,
      from_user_id: fromUserId,
      to_user_id: recipient.id,
      amount: amount,
      fee: fee,
    });
  });
}
```

**Key Points**:
- Self-transfer check happens before any processing
- Fee discourages frivolous transfers
- Both parties can be agents (no restriction)
- No capacity impact

### 6. Comparison Table

| Feature | Mint/Burn | Swap | P2P Transfer |
|---------|-----------|------|--------------|
| Parties Involved | 2 (User + Agent) | 1 (User only) | 2 (Any users) |
| Fiat Exchange | ✅ Yes | ❌ No | ❌ No |
| Agent Involvement | ✅ Required | ❌ None | ⚠️ Optional |
| Escrow | ✅ Yes | ❌ No | ❌ No |
| Capacity Impact | ✅ Yes | ❌ No | ❌ No |
| Fee | Varies | None | 0.5% |
| Gaming Risk | ⚠️ High (if self) | ✅ None | ✅ None (fee + self-block) |
| Self-Transaction | ❌ Blocked (our code) | ✅ Allowed | ❌ Blocked (system) |
| Agent Can Do | ❌ Not to self | ✅ Yes | ✅ Yes (not to self) |

### 7. Why No Additional Validation Needed

**System Already Protects Against**:
1. ✅ Self-transfers (built-in check)
2. ✅ Insufficient balance
3. ✅ Frozen wallets
4. ✅ Invalid recipients

**No Gaming Possible Because**:
1. ✅ Fee makes cycling unprofitable
2. ✅ No capacity impact
3. ✅ Separate transaction type (doesn't inflate agent metrics)
4. ✅ Can't send to self

**Conclusion**: P2P transfers are safe for agents without additional restrictions.

---

## Dispute System & Transaction Types

### 1. Which Transactions Support Disputes?

**Dispute-Enabled Transactions**:

| Transaction Type | Disputes Supported? | Why? |
|-----------------|---------------------|------|
| **Mint** | ✅ Yes | Involves fiat payment verification |
| **Burn** | ✅ Yes | Involves fiat payment verification |
| **Swap** | ❌ No | Instant, platform-controlled, no fiat |
| **P2P Transfer** | ❌ No | Instant, irreversible, no fiat |

### 2. How Disputes Work (Mint/Burn Only)

**Mint Dispute Flow**:
```
1. User uploads payment proof
2. Agent reviews proof
3. Agent can:
   a) Confirm → Tokens minted
   b) Deny → Dispute created
4. Admin reviews evidence from both parties
5. Admin makes final decision
```

**Burn Dispute Flow**:
```
1. User locks tokens in escrow
2. Agent sends fiat, marks "sent"
3. User has 30 minutes to:
   a) Confirm receipt → Tokens burned
   b) Dispute → Claims no payment received
   c) No response → Auto-escalates to admin
4. Admin reviews evidence
5. Admin decides:
   - Agent at fault → Deposit slashed, user refunded
   - User at fault → Agent cleared, user penalized
```

### 3. Why Self-Transactions Break Disputes

**The Fundamental Problem**:

Disputes require **two independent parties** with **conflicting interests**:
- User wants tokens/money
- Agent wants to protect reputation and deposit
- Admin mediates based on evidence from both sides

**Self-Transaction Scenario**:
```
Agent Alice (as user) vs Agent Alice (as agent):
- No conflicting interests (same person)
- Can fabricate evidence on both sides
- Can choose outcome that benefits her most
- Admin cannot determine genuine intent
```

**Example: Burn Dispute**:
```
Normal Dispute:
User Bob: "Agent didn't send ₦10,000"
Agent Carol: "I sent it, here's my bank statement"
Admin: Checks both bank statements, makes decision
✅ Fair resolution possible

Self-Transaction "Dispute":
Alice (user): "I didn't receive ₦10,000"
Alice (agent): "I sent it to myself"
Admin: Both bank statements show Alice → Alice transfer
❌ Cannot determine if legitimate or gaming
```

### 4. How Self-Transaction Prevention Protects Disputes

**By Blocking Agent Self-Transactions**:

1. ✅ **Ensures Two Parties**: Every mint/burn has genuinely different parties
2. ✅ **Enables Fair Mediation**: Admin can trust evidence from independent sources
3. ✅ **Prevents Gaming**: Can't manipulate dispute outcomes
4. ✅ **Maintains Trust**: Users trust dispute system will protect them
5. ✅ **Protects Deposits**: Agent deposits only slashed for genuine violations

**What We Prevent**:
```
❌ Agent testing dispute system without risk
❌ Agent claiming deposit slashing as tax write-off
❌ Agent manipulating performance metrics via disputes
❌ Admin time wasted on fake disputes
❌ System reputation damage from dispute gaming
```

### 5. Dispute System for Agent-to-Agent Transactions

**Agent-to-Agent Disputes Are Valid**:

```
Agent Alice buys from Agent Bob:
- Alice sends ₦10,000 to Bob
- Bob doesn't mint tokens
- Alice disputes
- Admin reviews:
  - Alice's bank statement (sent ₦10,000)
  - Bob's bank statement (received ₦10,000)
  - Blockchain (no tokens minted)
- Decision: Bob at fault, deposit slashed
✅ Fair resolution possible (two independent parties)
```

**Why This Works**:
- Alice and Bob have conflicting interests
- Evidence comes from independent sources
- Admin can determine truth
- Escrow protects both parties

### 6. Why Swaps & P2P Transfers Don't Need Disputes

**Swaps**:
- Instant execution (no waiting period)
- Platform-controlled rates (no negotiation)
- Same user on both sides (by design)
- No fiat involved (can't claim non-payment)
- Irreversible (like any blockchain transaction)

**P2P Transfers**:
- Instant execution
- Sender explicitly approves amount and recipient
- Irreversible (like sending cash)
- Fee already deducted (no refund needed)
- Self-transfers already blocked

**If User Makes Mistake**:
```
User sends 10,000 NT to wrong person:
- No dispute system (instant transfer)
- Must contact recipient directly
- Recipient can voluntarily return (new transfer)
- Platform cannot reverse (blockchain immutability)
```

### 7. Dispute Statistics & Monitoring

**What We Track**:
- Total disputes filed
- Dispute resolution time
- Agent fault rate
- User fault rate
- Dispute outcomes (agent wins, user wins, partial)

**Red Flags for Self-Transaction Attempts**:
- Agent with high dispute rate on both sides (as user and agent)
- Disputes with same bank account on both sides
- Patterns of disputes followed by immediate resolution
- Agent disputing own transactions (caught by our validation)

### 8. Admin Dispute Resolution Tools

**Evidence Required**:

**For Mint Disputes**:
- User's payment proof (screenshot)
- User's bank statement
- Agent's bank statement
- Transaction reference numbers
- Timestamps

**For Burn Disputes**:
- Agent's payment proof
- Agent's bank statement
- User's bank statement
- Escrow transaction hash
- Confirmation timestamps

**Decision Matrix**:

| Evidence | User Claim | Agent Claim | Decision |
|----------|------------|-------------|----------|
| Clear payment proof | "Paid" | "Not received" | User wins |
| No payment proof | "Paid" | "Not received" | Agent wins |
| Payment to wrong account | "Paid" | "Not received" | User at fault |
| Payment short amount | "Paid full" | "Received less" | Partial resolution |
| Conflicting timestamps | "Paid on time" | "Received late" | Review blockchain |

**Self-Transaction Would Break This**:
- Same bank account on both sides
- Can't determine genuine intent
- Evidence doesn't prove independent transaction
- Admin cannot make fair decision

---

## Technical Implementation

### Backend Validation

**Location**: `/src/controllers/requestController.js`

#### Mint Request Validation

```javascript
async createMintRequest(req, res, next) {
  try {
    const { agent_id, amount, token_type } = req.body;
    const userId = req.user.id;

    // ENFORCE EDUCATION
    await educationService.enforceEducation(userId, "mint");

    // Check if user is trying to mint to themselves (if they are an agent)
    const agent = await Agent.findByPk(agent_id);
    if (!agent) {
      throw new ApiError("Agent not found", 404);
    }
    
    if (agent.user_id === userId) {
      throw new ApiError(
        "Agents cannot create mint requests to themselves. Please select a different agent.",
        400
      );
    }

    // ... rest of the code
  }
}
```

**Logic**:
1. Fetch the selected agent from database
2. Compare agent's `user_id` with requesting user's ID
3. If they match → Reject with 400 error
4. If different → Allow transaction to proceed

#### Burn Request Validation

```javascript
async createBurnRequest(req, res, next) {
  try {
    const { agent_id, amount, token_type, bank_account } = req.body;
    const userId = req.user.id;

    // ENFORCE EDUCATION
    await educationService.enforceEducation(userId, "burn");

    // Check if user is trying to burn to themselves (if they are an agent)
    const agent = await Agent.findByPk(agent_id);
    if (!agent) {
      throw new ApiError("Agent not found", 404);
    }
    
    if (agent.user_id === userId) {
      throw new ApiError(
        "Agents cannot create burn requests to themselves. Please select a different agent.",
        400
      );
    }

    // ... rest of the code
  }
}
```

**Same Logic**: Prevents agents from burning tokens to themselves.

### Frontend User Experience

**Location**: 
- `/app/modals/buy-tokens/payment-instructions.tsx` (Mint)
- `/app/(tabs)/sell-tokens/confirm.tsx` (Burn)

#### Friendly Warning Modal

```typescript
catch (error: any) {
  const errorMessage = error.message || "";
  if (errorMessage.includes("cannot create mint requests to themselves")) {
    Alert.alert(
      "⚠️ Cannot Select Yourself",
      "As an agent, you cannot buy tokens from yourself. Please select a different agent to complete this transaction.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  } else {
    Alert.alert("Error", "Failed to create request. Please try again.");
  }
}
```

**User Experience**:
- Clear, non-technical warning
- Explains why the action is blocked
- Guides user to select a different agent
- No error jargon or stack traces

#### Error Log Suppression

**Location**: `/src/services/apiClient.ts`

```typescript
else if (
  error.response?.status === 400 &&
  error.response?.data?.message?.includes("cannot create") &&
  error.response?.data?.message?.includes("to themselves")
) {
  // Suppress self-transaction validation errors (handled by friendly modal)
  console.log("ℹ️  Self-transaction prevented (handled by UI modal)");
}
```

**Purpose**: Prevents duplicate error displays in console logs.

### Store Error Handling

**Location**: 
- `/src/stores/slices/mintRequestSlice.ts`
- `/src/stores/slices/burnSlice.ts`

```typescript
catch (err: any) {
  const message = err.response?.data?.message || "Failed to create request";
  
  // For self-transaction errors, don't set global error state
  // Let the component handle it with a friendly modal
  if (!message.includes("cannot create mint requests to themselves")) {
    set({ error: message, loading: false });
  } else {
    set({ loading: false });
  }
  
  throw new Error(message);
}
```

**Purpose**: Prevents global error state from showing duplicate errors.

---

## User Experience

### For Regular Users

**No Impact**: Regular users never see this validation since they are not agents.

### For Agents Attempting Self-Transaction

**Step-by-Step Flow**:

1. **Agent selects themselves** from agent list
2. **Agent proceeds** to payment/confirmation screen
3. **Agent confirms** the transaction
4. **System validates** → Detects self-transaction
5. **Friendly modal appears**:
   ```
   ⚠️ Cannot Select Yourself
   
   As an agent, you cannot buy tokens from yourself.
   Please select a different agent to complete this transaction.
   
   [OK]
   ```
6. **Agent taps OK** → Returns to agent selection screen
7. **Agent selects different agent** → Transaction proceeds normally

**Key Points**:
- ✅ Clear explanation
- ✅ No technical jargon
- ✅ Actionable guidance
- ✅ Clean console (no error spam)

### For Agents Transacting with Other Agents

**No Restrictions**: Agent-to-agent transactions work exactly like user-to-agent transactions.

**Example**:
```
Agent Alice (user_id: 123) buys from Agent Bob (user_id: 456)
✅ Allowed - Different agents
✅ Escrow protection applies
✅ Normal transaction flow
```

---

## Testing Scenarios

### Test Case 1: Agent Self-Mint (Should Fail)

**Setup**:
- User is an agent (has agent record)
- User tries to create mint request to themselves

**Expected Result**:
- ❌ Request rejected with 400 error
- ✅ Friendly modal appears
- ✅ No error logs in console
- ✅ User returned to agent selection

**Backend Log**:
```
ℹ️  Self-transaction prevented (handled by UI modal)
```

### Test Case 2: Agent Self-Burn (Should Fail)

**Setup**:
- User is an agent
- User tries to create burn request to themselves

**Expected Result**:
- ❌ Request rejected with 400 error
- ✅ Friendly modal appears
- ✅ No error logs in console
- ✅ User returned to agent selection

### Test Case 3: Agent-to-Agent Mint (Should Succeed)

**Setup**:
- Agent A (user_id: 111) creates mint request
- Selects Agent B (user_id: 222)

**Expected Result**:
- ✅ Request created successfully
- ✅ Normal transaction flow
- ✅ Escrow protection applies

### Test Case 4: Agent-to-Agent Burn (Should Succeed)

**Setup**:
- Agent A (user_id: 111) creates burn request
- Selects Agent B (user_id: 222)

**Expected Result**:
- ✅ Request created successfully
- ✅ Tokens locked in escrow
- ✅ Normal transaction flow

### Test Case 5: Regular User to Agent (Should Succeed)

**Setup**:
- Regular user (not an agent) creates mint/burn request
- Selects any agent

**Expected Result**:
- ✅ Request created successfully
- ✅ No validation triggered
- ✅ Normal transaction flow

---

## Database Schema Reference

### Agent Table

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- Links agent to user account
  tier VARCHAR(50),
  rating DECIMAL(3,2),
  deposit_usd DECIMAL(20,8),
  available_minting_capacity DECIMAL(20,8),
  -- ... other fields
);
```

**Key Field**: `user_id` - This is what we compare to prevent self-transactions.

### Validation Query

```sql
-- Check if user is trying to transact with themselves
SELECT a.user_id 
FROM agents a 
WHERE a.id = :agent_id 
  AND a.user_id = :requesting_user_id;

-- If this returns a row → Self-transaction → REJECT
-- If this returns empty → Different parties → ALLOW
```

---

## Edge Cases & Considerations

### Edge Case 1: User Becomes Agent Mid-Transaction

**Scenario**:
1. User creates mint request to Agent A
2. User becomes an agent (approved)
3. User tries to create another request to themselves

**Handling**: ✅ Validation still works (checks at request creation time)

### Edge Case 2: Agent Loses Agent Status

**Scenario**:
1. Agent A tries to transact with themselves
2. Agent A is suspended/deactivated
3. Agent record still exists but inactive

**Handling**: ✅ Validation still works (checks agent record existence, not status)

### Edge Case 3: Deleted Agent Records

**Scenario**:
1. User tries to select an agent
2. Agent record was deleted

**Handling**: ✅ Returns 404 "Agent not found" before self-transaction check

---

## Future Considerations

### Potential Enhancements

1. **Admin Override**: Allow admins to create test transactions for agents
2. **Audit Logging**: Log all self-transaction attempts for monitoring
3. **Rate Limiting**: Track repeated self-transaction attempts (potential abuse indicator)
4. **Analytics Dashboard**: Show self-transaction attempt metrics

### Monitoring Metrics

**Recommended Tracking**:
- Number of self-transaction attempts per day
- Agents with multiple self-transaction attempts
- Geographic patterns (if any region has more attempts)
- Time-based patterns (peak attempt times)

**Alert Thresholds**:
- Single agent: >5 attempts per day (possible confusion or testing)
- Platform-wide: >50 attempts per day (possible systemic issue)

---

## Related Documentation

- [AfriToken Agent Handbook](./AfriToken%20Agent%20Handbook.md) - Agent role and responsibilities
- [AfriToken: Complete Transaction Flows](./AfriToken:%20Complete%20Transaction%20Flows.md) - Detailed transaction flows
- [Agent System](./Agent%20System.md) - Agent system architecture

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-09 | 1.0 | Initial documentation of self-transaction prevention | System |

---

## Summary

**Key Takeaways**:

1. ✅ **Agent-to-self mint/burn transactions are BLOCKED** to prevent gaming and conflicts of interest
2. ✅ **Agent-to-agent mint/burn transactions are ALLOWED** for legitimate liquidity management
3. ✅ **Token swaps are ALLOWED for everyone** (including agents) - no gaming risk, legitimate portfolio management
4. ✅ **P2P transfers are ALLOWED for everyone** (including agents) - self-transfers already blocked by system
5. ✅ **Dispute system integrity is protected** by preventing self-transactions that would make fair resolution impossible
6. ✅ **User experience is friendly** with clear warnings instead of technical errors
7. ✅ **Implementation is robust** with backend validation and frontend UX handling
8. ✅ **System integrity is maintained** through proper validation and escrow protection

**Transaction Summary**:

| Transaction | Agent to Self | Agent to Agent | Agent to User | User to Agent | User to User |
|-------------|---------------|----------------|---------------|---------------|--------------|
| **Mint** | ❌ Blocked | ✅ Allowed | N/A | ✅ Allowed | N/A |
| **Burn** | ❌ Blocked | ✅ Allowed | N/A | ✅ Allowed | N/A |
| **Swap** | ✅ Allowed | N/A | N/A | N/A | ✅ Allowed |
| **P2P Transfer** | ❌ Blocked (system) | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |

**Dispute Support**:

| Transaction | Disputes Enabled? | Reason |
|-------------|-------------------|--------|
| **Mint** | ✅ Yes | Fiat payment verification needed |
| **Burn** | ✅ Yes | Fiat payment verification needed |
| **Swap** | ❌ No | Instant, platform-controlled |
| **P2P Transfer** | ❌ No | Instant, irreversible |

**Business Impact**:
- Prevents platform gaming through mint/burn self-transactions
- Maintains data integrity for agent metrics
- Protects regulatory compliance
- Enables legitimate agent operations (agent-to-agent, swaps, P2P transfers)
- **Preserves dispute system integrity** by ensuring two independent parties
- Provides clear user guidance
- Allows portfolio flexibility through swaps
- Supports inter-agent payments and user tipping via P2P transfers
