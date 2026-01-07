# AfriToken: Complete Transaction Flows

## Purpose of This Document

This document provides detailed step-by-step flows for every transaction type in AfriToken, including happy paths, error scenarios, edge cases, and system state transitions. Use this as a reference for development, QA testing, and troubleshooting.

---

## Table of Contents

1. [User Registration & Onboarding](#1-user-registration--onboarding)
2. [Token Minting (User Buys from Agent)](#2-token-minting-user-buys-from-agent)
3. [Token Burning (User Sells to Agent)](#3-token-burning-user-sells-to-agent)
4. [Peer-to-Peer Token Transfer](#4-peer-to-peer-token-transfer)
5. [Token Swap (NT ↔ CT ↔ USDT)](#5-token-swap-nt--ct--usdt)
6. [Token Request (User Requests from Another User)](#6-token-request-user-requests-from-another-user)
7. [Agent Onboarding](#7-agent-onboarding)
8. [Agent Deposit Management](#8-agent-deposit-management)
9. [Dispute Resolution](#9-dispute-resolution)
10. [Merchant Payment Collection](#10-merchant-payment-collection)
11. [System State Transitions](#11-system-state-transitions)
12. [Notification Triggers](#12-notification-triggers)
13. [Error Scenarios & Recovery](#13-error-scenarios--recovery)

---

## 1. User Registration & Onboarding

### 1.1 Happy Path

**Step 1: User Arrives at App**

- User opens AfriToken app for the first time
- System displays welcome screen with language selector
- Options: English (Nigeria) or Français (XOF countries)

**Step 2: Language Selection**

- User selects preferred language
- System stores language preference locally
- System updates all UI text to selected language

**Step 3: Registration Form**

- User taps "Get Started" or "Create Profile"
- System displays registration form:
  - Email address (required)
  - Password (required, minimum 8 characters, mixed case, numbers, symbols)
  - Confirm password (required)
  - Full name (required)
  - Country (dropdown: Nigeria or XOF countries)
- User fills form and taps "Register"

**Step 4: Backend Processing**

- System validates all inputs
- System checks if email already exists
- System hashes password with bcrypt
- System generates verification token (6-digit code)
- System creates user record in database:
  ```
  Status: UNVERIFIED
  Verification token: 123456
  Token expiry: 15 minutes from now
  ```
- System sends verification email with 6-digit code
- System returns success response with user ID

**Step 5: Email Verification**

- User receives email (check inbox and spam)
- App displays verification screen
- User enters 6-digit code
- System validates code against database
- If valid:
  - System updates user status to VERIFIED
  - System generates JWT access token (24h expiry)
  - System generates refresh token (30-day expiry)
  - System logs user in

**Step 6: Wallet Generation**

- System automatically creates blockchain wallets:
  - NT wallet (Polygon network)
  - CT wallet (Polygon network)
  - USDT wallet (Polygon network)
- System stores wallet addresses in database
- Initial balances: 0 for all wallets

**Step 7: Onboarding Tutorial**

- System displays welcome modal
- Tutorial overlays explain:
  - Dashboard overview
  - How to acquire tokens (Buy button)
  - How to send tokens (Send button)
  - How to receive tokens (Receive button)
  - How to swap tokens (Swap button)
  - How to sell tokens (Sell button)
- User can skip or complete tutorial

**Step 8: Dashboard Display**

- User sees main dashboard:
  - Profile greeting: "Hello, [Name]"
  - Balance cards: NT: 0, CT: 0, USDT: 0
  - Action buttons: Buy, Send, Receive, Swap, Sell
  - Transaction history: Empty state with prompt

### 1.2 Error Scenarios

**Email Already Exists**:

- System returns error: "This email is already registered"
- User can try different email or tap "Login instead"

**Weak Password**:

- System validates password in real-time
- Display requirements: "Password must have 8+ characters, uppercase, lowercase, number, symbol"
- User cannot submit until password meets requirements

**Verification Code Expired**:

- User enters code after 15 minutes
- System returns error: "Code expired. Request a new one"
- User taps "Resend code"
- System generates new code, sends new email

**Verification Code Invalid**:

- User enters wrong code
- System tracks attempts (max 5 attempts)
- After 5 failed attempts: "Too many attempts. Request a new code"

**Network Error During Registration**:

- System displays: "Network error. Please check your connection"
- User taps "Retry"
- System retries registration

**Wallet Generation Failure**:

- System logs error
- System notifies admin
- User sees: "Account created but wallet setup pending"
- Background job retries wallet generation
- User receives notification when wallets are ready

### 1.3 State Transitions

```
START → Language Selected → Registration Form → Form Submitted
  → Email Sent → Code Entered → Verified → Wallets Created
  → Tutorial → Dashboard (REGISTERED & VERIFIED)
```

### 1.4 Database Records Created

- **Users table**: New user record
- **Wallets table**: 3 wallet records (NT, CT, USDT)
- **User Activity Log**: Registration event

### 1.5 Notifications Sent

- Email: Verification code
- Push: "Welcome to AfriToken! Start exchanging tokens now"

---

## 2. Token Minting (User Buys from Agent)

### 2.1 Happy Path

**Step 1: User Initiates Purchase**

- User taps "Buy Tokens" from dashboard
- System displays token selection:
  - NT (Naira Token) with green card
  - CT (CFA Token) with blue/yellow card
- User selects token type (e.g., NT)

**Step 2: Amount Entry**

- System displays amount input screen
- User enters desired amount (e.g., 10,000 NT)
- System shows helpful presets: 1,000 | 5,000 | 10,000 | 50,000
- System validates amount (minimum: 100, maximum based on verification tier)
- User taps "Continue"

**Step 3: Agent Matching**

- System queries available agents:
  ```
  Criteria:
  - Token type: NT
  - User location: Lagos, Nigeria
  - Required capacity: 10,000
  - Agent status: ACTIVE
  - Agent availability: Currently active
  ```
- System ranks agents by:
  1. Sufficient capacity (≥10,000)
  2. Geographic proximity
  3. Rating (highest first)
  4. Response time (fastest first)
- System displays top 3-5 agents:
  ```
  Agent Card:
  - Name: "Chidi's Exchange"
  - Rating: ⭐ 4.8 (245 reviews)
  - Response time: "Usually responds in 5 min"
  - Max amount: "₦50,000"
  - Badges: "Verified" "Fast Response" "High Liquidity"
  ```

**Step 4: Agent Selection**

- User reviews agents and selects one
- User taps "Select This Agent"
- System confirms selection

**Step 5: Payment Instructions**

- System displays agent's payment details:

  ```
  Send ₦10,000 to:

  Bank Transfer:
  Bank: GTBank
  Account: 0123456789
  Name: Chidi Okafor

  OR

  Mobile Money:
  Provider: Opay
  Number: 08012345678
  Name: Chidi Okafor
  ```

- User sees timer: "Complete payment in 30 minutes"
- User copies details and switches to banking app

**Step 6: User Sends Fiat**

- User sends ₦10,000 via bank transfer or mobile money
- User receives bank/mobile money confirmation
- User returns to AfriToken app

**Step 7: Payment Proof Upload**

- User taps "I've Sent the Money"
- System displays upload screen
- User uploads screenshot of transfer confirmation
- User enters transaction reference number
- User taps "Submit Proof"

**Step 8: Backend Processing**

- System creates minting transaction record:
  ```
  Status: PAYMENT_SUBMITTED
  User ID: [user-id]
  Agent ID: [agent-id]
  Amount: 10,000 NT
  Payment proof: [S3 URL]
  Reference: [ref-number]
  Submitted at: [timestamp]
  ```
- System uploads proof to S3
- System starts 15-minute confirmation timer
- System deducts amount from agent's available capacity (optimistically)

**Step 9: Agent Notification**

- System sends push notification to agent:
  ```
  "New token request: 10,000 NT
  User: John Doe
  Reference: [ref-number]
  Review payment proof now"
  ```
- System sends SMS backup after 5 minutes if no response
- Agent receives notification

**Step 10: Agent Reviews Payment**

- Agent opens app, sees pending request
- Agent checks their bank/mobile money account
- Agent confirms ₦10,000 received
- Agent taps "Confirm Payment Received"

**Step 11: Token Minting**

- System verifies agent confirmation
- System calls blockchain service:
  ```
  mintTokens({
    agentAddress: [agent-wallet],
    userAddress: [user-wallet],
    tokenType: 'NT',
    amount: 10000
  })
  ```
- Smart contract executes:
  - Verifies agent is whitelisted
  - Verifies agent has sufficient capacity
  - Mints 10,000 NT to user's wallet
  - Returns transaction hash
- System updates transaction record:
  ```
  Status: TOKENS_MINTED
  Tx hash: 0x123abc...
  Minted at: [timestamp]
  ```
- System updates agent capacity:
  ```
  Previous: 50,000
  Minted: 10,000
  New available: 40,000
  ```

**Step 12: User Notification**

- User receives push notification:
  ```
  "🎉 10,000 NT tokens received!
  Your balance: 10,000 NT
  Transaction ID: #TXN123456"
  ```
- App displays success animation (confetti)
- Balance card updates immediately via WebSocket

**Step 13: Transaction Complete**

- User sees updated balance
- Transaction appears in history
- User prompted to rate agent:
  ```
  "How was your experience with Chidi's Exchange?"
  ⭐⭐⭐⭐⭐
  Optional comment
  ```

### 2.2 Error Scenarios

**Agent Doesn't Respond (15-Minute Timeout)**:

```
Timeline:
00:00 - User submits proof
15:00 - Timer expires, no agent response

System Actions:
- Updates transaction status: AGENT_NO_RESPONSE
- Refunds agent's capacity (add back 10,000)
- Notifies user: "Agent didn't respond. Please try another agent"
- Notifies admin: Agent performance issue
- Flags agent for review (too many timeouts = suspension)
- User can select different agent or request refund
```

**Agent Denies Payment**:

```
Agent Actions:
- Reviews proof
- Doesn't see payment in their account
- Taps "Payment Not Received" and provides reason

System Actions:
- Creates dispute record
- Freezes agent's account temporarily
- Notifies admin for manual review
- Admin reviews:
  - Screenshot quality
  - Bank/mobile money statements
  - Transaction reference validity
- Admin decision:
  - User at fault (fake proof): Warn user, release agent
  - Agent at fault: Slash deposit, mint tokens to user, suspend agent
```

**Insufficient Agent Capacity**:

```
Scenario: Agent accepts but capacity drops below required amount

System Actions:
- Validates capacity before minting
- If insufficient: "Agent capacity no longer available"
- Refunds user's request
- User can try another agent
```

**Blockchain Transaction Fails**:

```
Minting call fails (network issue, gas problem, etc.)

System Actions:
- Logs error with full details
- Updates transaction: MINT_FAILED
- Queues retry (3 attempts with exponential backoff)
- If all retries fail:
  - Notifies admin
  - Manual intervention required
  - User sees: "Tokens pending. Support team notified"
```

**User Submits Invalid Proof**:

```
Agent reviews proof and finds:
- Screenshot doesn't match amount
- Reference number incorrect
- Payment to wrong account

Agent Actions:
- Taps "Invalid Proof" with reason

System Actions:
- Notifies user: "Please resubmit correct payment proof"
- User can reupload within 1 hour
- After 1 hour: Transaction cancelled, user must start over
```

**User Cancels During Wait**:

```
User taps "Cancel" before agent confirms

System Actions:
- Only allowed if status is PAYMENT_SUBMITTED
- Cannot cancel after agent confirms
- Refunds agent capacity
- Updates transaction: CANCELLED
- User warned: "Ensure you didn't actually send payment"
```

### 2.3 State Transitions

```
INITIATED → PAYMENT_SUBMITTED → AGENT_REVIEWING
  → AGENT_CONFIRMED → TOKENS_MINTED (SUCCESS)

Alternative paths:
→ AGENT_NO_RESPONSE (timeout)
→ AGENT_DENIED → DISPUTED
→ MINT_FAILED → RETRYING → TOKENS_MINTED or FAILED
→ CANCELLED (user cancels early)
```

### 2.4 Database Records

**Created**:

- `minting_transactions` record
- `agent_capacity_log` entry (capacity decrease)
- `user_activity_log` entry

**Updated**:

- `wallets.balance` (user's NT balance +10,000)
- `agents.available_minting_capacity` (agent's capacity -10,000)

### 2.5 Notifications

1. **Agent**: Push + SMS (new request)
2. **User**: Push (tokens received)
3. **Admin**: Email (if timeout or dispute)

---

## 3. Token Burning (User Sells to Agent)

### 3.1 Happy Path

**Step 1: User Initiates Sale**

- User taps "Sell Tokens" from dashboard
- System displays token selection (NT, CT only - USDT must be swapped first)
- User selects token type (e.g., 10,000 NT)

**Step 2: Amount Entry**

- User enters amount to sell
- System validates:
  - User has sufficient balance
  - Amount meets minimum (100)
  - Amount doesn't exceed daily limit
- User taps "Continue"

**Step 3: Agent Matching**

- System queries agents with liquidity:
  ```
  Criteria:
  - Can burn NT tokens
  - Has fiat liquidity (confirmed bank/mobile money balance)
  - Active and available
  - In user's geographic region
  ```
- System displays agents:
  ```
  Agent Card:
  - Name: "Ada's Exchange"
  - Rating: ⭐ 4.9
  - Max sale: "₦100,000"
  - Payment method: "Bank transfer or Opay"
  - Estimated time: "Usually pays in 10 min"
  ```

**Step 4: Agent Selection & Confirmation**

- User selects agent
- System displays confirmation:

  ```
  You're selling: 10,000 NT
  You'll receive: ₦10,000
  Payment to: Your registered account
  Fee: ₦0 (no fee for burning)

  [Confirm Sale]
  ```

- User taps "Confirm Sale"

**Step 5: Escrow Lock**

- System calls smart contract:
  ```
  initiateBurn({
    userAddress: [user-wallet],
    agentAddress: [agent-wallet],
    amount: 10000,
    tokenType: 'NT'
  })
  ```
- Smart contract executes:
  - Transfers 10,000 NT from user to escrow contract
  - Creates escrow record with 30-minute expiration
  - Emits BurnInitiated event
  - Returns escrow request ID
- System updates user's displayed balance: -10,000 NT (locked)
- System creates burning transaction:
  ```
  Status: ESCROW_LOCKED
  Escrow ID: 0x456def...
  User ID: [user-id]
  Agent ID: [agent-id]
  Amount: 10,000 NT
  Expires at: [30 min from now]
  ```

**Step 6: Agent Notification**

- Agent receives notification:
  ```
  "🔥 Burn request: 10,000 NT
  User: John Doe
  You'll receive tokens after sending ₦10,000
  Respond within 30 minutes"
  ```
- Notification includes user's payment details

**Step 7: Agent Sends Fiat**

- Agent opens banking app or mobile money
- Agent sends ₦10,000 to user's registered account
- Agent receives bank confirmation
- Agent returns to AfriToken app
- Agent taps "I've Sent the Money"
- Agent uploads payment proof
- Agent taps "Submit"

**Step 8: Smart Contract Burns Tokens**

- System calls smart contract:
  ```
  confirmFiatSent({
    escrowId: [escrow-id]
  })
  ```
- Smart contract executes:
  - Verifies caller is the assigned agent
  - Burns 10,000 NT from escrow (sends to 0xdead)
  - Increases agent's minting capacity by 10,000
  - Updates escrow status: AGENT_SENT_FIAT
  - Emits FiatSent event
- System updates transaction:
  ```
  Status: AGENT_SENT_FIAT
  Agent sent at: [timestamp]
  Proof URL: [S3 URL]
  Burn tx hash: 0x789ghi...
  ```
- System logs agent capacity increase:
  ```
  Previous: 40,000
  Burned: 10,000
  New available: 50,000
  ```

**Step 9: User Confirmation Prompt**

- User receives notification:
  ```
  "💰 Agent sent ₦10,000!
  Please check your account and confirm receipt.
  Time remaining: 30 minutes"
  ```
- App displays confirmation screen:

  ```
  Waiting for your confirmation

  Ada's Exchange sent ₦10,000 to your account

  [View Payment Proof]

  Did you receive the money?

  [Yes, I Received It]  [No, I Didn't Receive It]

  Timer: 29:45
  ```

**Step 10: User Confirms Receipt**

- User checks bank/mobile money account
- User sees ₦10,000 received
- User returns to app
- User taps "Yes, I Received It"

**Step 11: Transaction Complete**

- System calls smart contract:
  ```
  confirmFiatReceived({
    escrowId: [escrow-id]
  })
  ```
- Smart contract marks escrow complete
- System updates transaction:
  ```
  Status: USER_CONFIRMED
  Confirmed at: [timestamp]
  ```
- System removes escrow lock (tokens already burned)
- Agent's capacity permanently increased

**Step 12: Success Notifications**

- User sees success screen:

  ```
  "✅ Sale Complete!
  You sold: 10,000 NT
  You received: ₦10,000

  Rate this agent"
  ```

- Agent receives confirmation:
  ```
  "✅ Transaction confirmed
  Capacity increased: +10,000"
  ```

### 3.2 Error Scenarios

**User Disputes (Didn't Receive Fiat)**:

```
Scenario: Agent claims sent but user didn't receive

User Actions:
- Taps "No, I Didn't Receive It"
- Provides reason: "No payment in my account"
- Can upload screenshot of bank statement

System Actions:
- Calls smart contract disputeBurn()
- Smart contract:
  - Re-mints 10,000 NT to user (refund from burned tokens)
  - Slashes agent deposit by 12,000 (120% penalty)
  - Decreases agent capacity back down
- Updates transaction: DISPUTED
- Creates dispute record
- Notifies admin for review
- Suspends agent temporarily

Admin Review:
- Reviews both parties' evidence
- Checks blockchain timestamps
- Decision:
  - Agent at fault: Keep penalty, permanent record
  - User fraud: Restore agent, penalize user, blacklist
  - Unclear: Partial refund to both parties
```

**Auto-Dispute (30-Minute Timeout)**:

```
Scenario: Agent sent fiat but user doesn't respond

Timeline:
00:00 - Agent sends fiat, tokens burned
30:00 - User didn't confirm or dispute

System Actions:
- Background job detects expired confirmation
- Auto-escalates to dispute
- Creates dispute: "User did not confirm receipt within time limit"
- Notifies admin with urgency flag
- Freezes both user and agent actions on this transaction

Admin Actions:
- Contacts user directly (email, SMS, call)
- Reviews payment proof
- Makes final decision
- Usually sided with agent if proof is valid
```

**Agent Doesn't Send Fiat (30-Minute Expiration)**:

```
Scenario: Tokens locked in escrow but agent never acts

Timeline:
00:00 - Escrow created
30:00 - Agent didn't send fiat

System Actions:
- Smart contract's handleExpiredRequest() callable by anyone
- Refunds 10,000 NT from escrow to user
- Updates transaction: EXPIRED
- Flags agent: "Failed to fulfill burn request"
- User notified: "Agent didn't respond. Tokens refunded"

Agent Penalty:
- Performance score decreased
- After 3 expirations: Automatic suspension
```

**Agent Sends Wrong Amount**:

```
Scenario: Agent sends ₦8,000 instead of ₦10,000

User Actions:
- User checks account, sees ₦8,000
- User taps "I Didn't Receive It"
- Provides details: "Only received ₦8,000, expected ₦10,000"

System Actions:
- Dispute created
- Admin reviews payment proof
- Admin sees proof shows ₦8,000
- Decision: Partial fulfillment
  - Agent penalized for incorrect amount
  - User refunded difference from agent's deposit
  - Transaction marked RESOLVED_PARTIAL
```

**User Cancels Before Agent Acts**:

```
User taps "Cancel" while status is ESCROW_LOCKED

System Actions:
- Calls smart contract cancelBurnRequest()
- Smart contract refunds 10,000 NT from escrow to user
- Updates transaction: CANCELLED
- Notifies agent: "User cancelled the request"
- No penalty to either party
```

**Blockchain Errors**:

```
Burning transaction fails (network congestion, gas issues)

System Actions:
- Queues retry with higher gas
- Max 3 retries
- If all fail:
  - Escrow expires, user auto-refunded
  - Agent notified: "Transaction failed, do not send fiat"
  - Admin alerted
```

### 3.3 State Transitions

```
INITIATED → ESCROW_LOCKED → AGENT_SENT_FIAT
  → USER_CONFIRMED (SUCCESS)

Alternative paths:
→ USER_DISPUTED → ADMIN_REVIEW → RESOLVED
→ EXPIRED (agent timeout, auto-refund)
→ CANCELLED (user cancels early)
→ AUTO_DISPUTED (user timeout) → ADMIN_REVIEW
```

### 3.4 Database Records

**Created**:

- `burning_transactions` record
- `escrow` record (smart contract)
- `agent_capacity_log` entry (capacity increase)
- `dispute` record (if disputed)

**Updated**:

- `wallets.balance` (user's NT balance -10,000)
- `agents.available_minting_capacity` (agent's capacity +10,000 after burn)

### 3.5 Notifications

1. **Agent**: Push (burn request received, user confirmed)
2. **User**: Push (agent sent fiat, transaction complete)
3. **Admin**: Email (if disputed or auto-disputed)

---

## 4. Peer-to-Peer Token Transfer

### 4.1 Happy Path (QR Code Scan)

**Step 1: Recipient Generates QR**

- Recipient (Jane) opens app
- Jane taps "Receive"
- System displays QR code screen:
  ```
  Shows: Jane's NT wallet address as QR code
  Toggle: NT | CT | USDT (switch between tokens)
  Buttons: [Share Address] [Request Amount]
  ```

**Step 2: Sender Scans QR**

- Sender (John) opens app
- John taps "Send"
- System opens QR scanner with camera permission
- John points camera at Jane's QR code
- System decodes QR: Extracts wallet address and token type

**Step 3: Amount Entry**

- System displays send screen:

  ```
  Sending to: Jane Doe (jane@example.com)
  Token: NT
  Your balance: 10,000 NT

  Amount: [input field]
  Note (optional): [text field]

  Platform fee: 0.5% (calculated on next screen)
  ```

- John enters: 1,000 NT
- John adds note: "Lunch money"
- John taps "Continue"

**Step 4: Confirmation Screen**

- System displays summary:

  ```
  Review Transfer

  To: Jane Doe
  Amount: 1,000 NT
  Fee: 5 NT (0.5%)
  Total: 1,005 NT

  You'll have: 8,995 NT remaining

  [Confirm Transfer]
  ```

- John reviews and taps "Confirm Transfer"
- System may prompt for PIN or biometric

**Step 5: Blockchain Transaction**

- System calls blockchain service:
  ```
  transferTokens({
    from: [john-wallet],
    to: [jane-wallet],
    tokenType: 'NT',
    amount: 1000,
    fee: 5
  })
  ```
- Smart contract executes:
  - Verifies John has 1,005 NT
  - Transfers 1,000 NT to Jane
  - Transfers 5 NT to platform fee wallet
  - Emits Transfer event
  - Returns transaction hash
- System creates transaction record:
  ```
  Type: P2P_TRANSFER
  Sender: John
  Receiver: Jane
  Amount: 1,000 NT
  Fee: 5 NT
  Status: COMPLETED
  Tx hash: 0xabc123...
  Note: "Lunch money"
  ```

**Step 6: Balance Updates**

- System updates balances:
  - John: 10,000 - 1,005 = 8,995 NT
  - Jane: 0 + 1,000 = 1,000 NT
- WebSocket broadcasts to both users:
  ```
  { type: 'BALANCE_UPDATE', token: 'NT', newBalance: ... }
  ```
- UI updates immediately without refresh

**Step 7: Notifications**

- John sees success animation (checkmark, confetti)
- Jane receives push notification:
  ```
  "💰 You received 1,000 NT from John Doe
  Note: Lunch money
  Tap to view"
  ```
- Both see transaction in history

### 4.2 Happy Path (Email/Username Entry)

**Steps 1-2: Manual Entry**

- John taps "Send"
- John taps "Enter Email or Username"
- John types: "jane@example.com"
- System searches database for user
- System displays confirmation:

  ```
  Send to:
  👤 Jane Doe
  📧 jane@example.com

  Is this correct?
  [Yes, Continue] [No, Go Back]
  ```

- John confirms

**Steps 3-7: Same as QR path**

### 4.3 Error Scenarios

**Insufficient Balance**:

```
John tries to send 10,000 NT but only has 9,000 NT

System Actions:
- Validates balance before showing confirmation
- Displays error: "Insufficient balance. You have 9,000 NT"
- Suggests: "Buy more tokens" button
- Cannot proceed until balance sufficient
```

**Recipient Not Found**:

```
John enters "jane@wrong.com" that doesn't exist

System Actions:
- Searches database, finds no match
- Displays: "No user found with this email"
- Suggests: "Double-check the email or use QR code"
- Option to invite jane@wrong.com to join platform
```

**Transaction Fails**:

```
Blockchain transaction fails (network issue)

System Actions:
- Creates transaction: PENDING
- Queues retry (3 attempts)
- User sees: "Transaction pending. This may take a moment"
- If retry succeeds: Status → COMPLETED, notify both parties
- If all retries fail:
  - Status → FAILED
  - Refund tokens to sender
  - Notify user: "Transaction failed. Tokens refunded"
```

**User Tries to Send to Self**:

```
John tries to send to his own wallet

System Actions:
- Validates recipient != sender
- Displays error: "You cannot send tokens to yourself"
- Prevents transaction
```

**Amount Below Minimum**:

```
John tries to send 10 NT (below 100 minimum)

System Actions:
- Validates amount >= 100
- Displays: "Minimum transfer: 100 NT"
- User must increase amount
```

**Daily Limit Exceeded**:

```
John already sent 5,000 NT today, tries to send 6,000 more
Daily limit for his verification tier: 10,000 NT

System Actions:
- Calculates today's total: 5,000 sent
- Remaining: 5,000
- John tries: 6,000
- Displays: "Daily limit exceeded. Remaining today: 5,000 NT"
- Suggests: "Verify your ID to increase limits"
```

### 4.4 State Transitions

```
INITIATED → RECIPIENT_CONFIRMED → AMOUNT_ENTERED
  → USER_CONFIRMED → PENDING → COMPLETED (SUCCESS)

Alternative paths:
→ FAILED (blockchain error, retries exhausted)
→ CANCELLED (user cancels before confirming)
```

### 4.5 Database Records

**Created**:

- `transactions` record (P2P_TRANSFER type)
- `user_activity_log` entries for both users

**Updated**:

- `wallets.balance` (sender -1,005, receiver +1,000)
- Platform fee wallet +5 NT

### 4.6 Notifications

1. **Sender**: UI success animation
2. **Receiver**: Push notification + WebSocket update
3. **Both**: Transaction appears in history immediately

---

## 5. Token Swap (NT ↔ CT ↔ USDT)

### 5.1 Happy Path (NT → CT)

**Step 1: User Initiates Swap**

- User taps "Swap" from dashboard
- System displays swap interface:

  ```
  From: [NT ▼]  Balance: 8,995 NT
  Amount: [input field]

  ⇅ (swap icon)

  To: [CT ▼]  Balance: 0 CT
  You'll receive: [calculated]

  Current rate: 1 NT = 2.2 CT
  Fee: 1.5% (134.93 CT)

  [Swap Now]
  ```

**Step 2: Amount Entry**

- User enters: 5,000 NT
- System calculates in real-time:

  ```
  5,000 NT × 2.2 = 11,000 CT
  Fee (1.5%): 165 CT
  You'll receive: 10,835 CT

  Updated balances:
  NT: 3,995 (8,995 - 5,000)
  CT: 10,835 (0 + 10,835)
  ```

- User taps "Swap Now"

**Step 3: Confirmation**

- System displays confirmation modal:

  ```
  Confirm Swap

  From: 5,000 NT
  To: 10,835 CT
  Rate: 1 NT = 2.2 CT
  Fee: 165 CT (1.5%)

  This swap is instant and final.

  [Cancel] [Confirm Swap]
  ```

- User taps "Confirm Swap"

**Step 4: Blockchain Execution**

- System calls swap contract:
  ```
  executeSwap({
    user: [user-wallet],
    fromToken: 'NT',
    toToken: 'CT',
    fromAmount: 5000,
    minToAmount: 10,618 (10,835 - 2% slippage protection)
  })
  ```
- Smart contract executes atomically:
  1. Verifies user has 5,000 NT
  2. Burns 5,000 NT from user
  3. Mints 10,835 CT to user
  4. Transfers 165 CT fee to platform
  5. Emits Swap event
  6. Returns transaction hash
- System creates swap record:
  ```
  User: [user-id]
  From: 5,000 NT
  To: 10,835 CT
  Rate: 2.2
  Fee: 165 CT
  Status: COMPLETED
  Tx hash: 0xdef456...
  Timestamp: [now]
  ```

**Step 5: Balance Updates**

- System updates wallets:
  - NT: 8,995 - 5,000 = 3,995
  - CT: 0 + 10,835 = 10,835
- WebSocket broadcasts update
- UI updates immediately

**Step 6: Success**

- User sees success animation
- Confetti if first swap
- Updated balances displayed
- Transaction in history

### 5.2 Other Swap Pairs

**CT → NT**: Same flow, reverse direction
**NT → USDT**: Same flow, different rate (e.g., 1 NT = 0.00065 USDT)
**CT → USDT**: Same flow
**USDT → NT**: Same flow (user acquiring NT with crypto)
**USDT → CT**: Same flow (user acquiring CT with crypto)

### 5.3 Error Scenarios

**Insufficient Balance**:

```
User tries to swap 6,000 NT but only has 3,995 NT

System Actions:
- Real-time validation during amount entry
- "Insufficient balance" displayed immediately
- "Swap Now" button disabled
- Shows: "You need 2,005 more NT"
```

**Rate Changed (Slippage Exceeded)**:

```
Rate was 2.2, user confirms, but rate changes to 2.15 before execution

Smart Contract:
- Checks minToAmount: Expected 10,835, actual would be 10,575
- Difference: 260 CT (2.4% slippage)
- Exceeds max 2% slippage protection
- Reverts transaction

System Actions:
- Catches revert
- Displays: "Rate changed. Please try again with updated rate"
- Shows new rate: 2.15
- User can retry or cancel
```

**Swap Contract Paused**:

```
Admin paused swaps due to emergency

System Actions:
- Smart contract reverts with "Contract paused"
- System displays: "Swaps temporarily unavailable. Please try again later"
- Notifies admins to resolve issue
```

**Transaction Fails**:

```
Blockchain transaction fails (gas, network)

System Actions:
- Creates swap record: PENDING
- Retries 3 times
- If succeeds: Status → COMPLETED
- If fails: Status → FAILED, tokens not moved
- Notify user: "Swap failed. Please try again"
```

### 5.4 State Transitions

```
INITIATED → AMOUNT_ENTERED → RATE_LOCKED
  → CONFIRMED → EXECUTING → COMPLETED (SUCCESS)

Alternative paths:
→ FAILED (slippage exceeded, transaction error)
→ CANCELLED (user cancels before confirming)
```

### 5.5 Database Records

**Created**:

- `swaps` table record
- `transactions` entry (for history)

**Updated**:

- `wallets.balance` for both token types
- `exchange_rates` (no update, just read for calculation)

### 5.6 Notifications

- UI: Success animation
- Push: "✅ Swap complete: 5,000 NT → 10,835 CT"
- No agent involved, instant completion

---

## 6. Token Request (User Requests from Another User)

### 6.1 Happy Path

**Step 1: Request Creation**

- Jane opens app, taps "Request"
- System displays request form:

  ```
  Request tokens from someone

  From: [Email or scan QR]
  Token: [NT ▼]
  Amount: [input field]
  Note: [text field]

  [Send Request]
  ```

- Jane enters:
  - From: john@example.com
  - Token: NT
  - Amount: 2,000
  - Note: "Reimbursement for groceries"
- Jane taps "Send Request"

**Step 2: Request Sent**

- System creates transaction:
  ```
  Type: TOKEN_REQUEST
  From: Jane (requester)
  To: John (requested from)
  Amount: 2,000 NT
  Status: PENDING
  Note: "Reimbursement for groceries"
  Expires: 7 days from now
  ```
- System notifies John:
  ```
  Push: "Jane Doe requested 2,000 NT from you
  Note: Reimbursement for groceries
  [Reject] [Send Tokens]"
  ```
- Jane sees: "Request sent to John Doe. Waiting for response"

**Step 3: John Reviews Request**

- John opens notification or app
- John sees request in "Requests" tab:

  ```
  📨 Token Request

  From: Jane Doe
  Amount: 2,000 NT
  Note: "Reimbursement for groceries"
  Requested: 2 hours ago

  Your balance: 3,995 NT

  [Reject Request] [Send 2,000 NT]
  ```

**Step 4: John Approves & Sends**

- John taps "Send 2,000 NT"
- System displays confirmation (same as P2P transfer):

  ```
  Sending to: Jane Doe
  Amount: 2,000 NT
  Fee: 10 NT (0.5%)
  Total: 2,010 NT

  This fulfills Jane's request for groceries reimbursement.

  [Confirm]
  ```

- John taps "Confirm"

**Step 5: Transfer Execution**

- Same as P2P transfer flow (Step 5-7 from section 4.1)
- Smart contract transfers 2,000 NT to Jane
- System updates request:
  ```
  Status: FULFILLED
  Fulfilled by: John
  Fulfilled at: [timestamp]
  Transaction ID: [tx-id]
  ```

**Step 6: Notifications**

- Jane receives:
  ```
  "✅ John Doe sent you 2,000 NT
  Your request was fulfilled!"
  ```
- John sees: "Request fulfilled"
- Both see transaction in history, linked to original request

### 6.2 Request Rejection

**John Rejects**:

- John taps "Reject Request"
- System shows rejection confirmation:

  ```
  Reject Jane's request for 2,000 NT?
  Optional: Add a note
  [text field]

  [Cancel] [Reject]
  ```

- John optionally adds note: "Sorry, I'm short on tokens right now"
- John taps "Reject"

**System Actions**:

- Updates request:
  ```
  Status: REJECTED
  Rejected by: John
  Rejected at: [timestamp]
  Rejection note: "Sorry, I'm short on tokens right now"
  ```
- Notifies Jane:
  ```
  "John Doe rejected your request for 2,000 NT
  Note: Sorry, I'm short on tokens right now"
  ```
- Jane can create new request or send to someone else

### 6.3 Request Cancellation

**Jane Cancels**:

- Before John responds, Jane changes her mind
- Jane opens request, taps "Cancel Request"
- System confirms: "Cancel this request to John?"
- Jane confirms

**System Actions**:

- Updates request: Status → CANCELLED
- Notifies John: "Jane cancelled the token request"
- Jane sees: "Request cancelled"

### 6.4 Request Expiration

**7 Days Pass Without Response**:

- Background job checks expired requests daily
- Finds requests where created_at > 7 days and status = PENDING
- Updates status: EXPIRED
- Notifies requester:
  ```
  "Your request to John Doe expired
  You can create a new request if needed"
  ```
- No notification to John (avoids spam)

### 6.5 Error Scenarios

**Requested User Not Found**:

```
Jane enters: "john@nonexistent.com"

System Actions:
- Searches database, no match
- Displays: "No user found with this email"
- Suggests: "Check the email or invite them to join AfriToken"
```

**Insufficient Balance When Fulfilling**:

```
John has 1,500 NT, tries to fulfill Jane's 2,000 NT request

System Actions:
- Validates balance: 1,500 < 2,010 (amount + fee)
- Displays: "Insufficient balance. You have 1,500 NT but need 2,010 NT"
- Options: "Buy Tokens" or "Reject Request"
```

**User Tries to Request from Self**:

```
Jane enters her own email

System Actions:
- Validates requester != requested
- Displays: "You cannot request tokens from yourself"
```

**Amount Below Minimum**:

```
Jane requests 50 NT (below 100 minimum)

System Actions:
- Validates amount >= 100
- Displays: "Minimum request: 100 NT"
```

### 6.6 State Transitions

```
CREATED → PENDING → FULFILLED (John sends)
                  → REJECTED (John rejects)
                  → CANCELLED (Jane cancels)
                  → EXPIRED (7 days timeout)
```

### 6.7 Database Records

**Created**:

- `transactions` record with type: TOKEN_REQUEST
- Status: PENDING initially

**Updated**:

- Status changes to FULFILLED/REJECTED/CANCELLED/EXPIRED
- If fulfilled: Links to actual transfer transaction

### 6.8 Notifications

1. **Requester (Jane)**: Status updates on her request
2. **Requested (John)**: New request received, reminder after 24 hours
3. **Both**: If fulfilled, normal P2P transfer notifications

---

## 7. Agent Onboarding

### 7.1 Happy Path

**Step 1: Agent Application**

- User (Chidi) is already registered with verified profile
- Chidi navigates to Settings → "Become an Agent"
- System displays agent information page:

  ```
  Become an Agent

  Requirements:
  ✓ Verified email and profile
  ✓ Security deposit: Minimum $5,000 USDT
  ✓ Business documentation
  ✓ Active bank/mobile money account

  Benefits:
  • Earn fees on every transaction
  • Build your customer base
  • Flexible working hours

  [Apply Now]
  ```

- Chidi taps "Apply Now"

**Step 2: Application Form**

- System displays multi-step form:

  ```
  Step 1/4: Business Information
  - Business name: [text field]
  - Business description: [text area]
  - Country: [dropdown - Nigeria/XOF]
  - Service area: [text - e.g., "Lagos, Abuja"]

  Step 2/4: Contact Information
  - Phone number: [input with verification]
  - WhatsApp: [checkbox + number]
  - Telegram: [optional]

  Step 3/4: Payment Methods
  - Bank transfer: [checkbox]
    - Bank: [dropdown]
    - Account number: [input]
    - Account name: [input]
  - Mobile money: [checkbox]
    - Provider: [dropdown - Opay, PalmPay, etc.]
    - Number: [input]

  Step 4/4: Documentation
  - Government ID: [file upload - front/back]
  - Proof of address: [file upload]
  - Business registration (optional): [file upload]
  - Selfie with ID: [camera capture]
  ```

- Chidi fills all fields and uploads documents
- Chidi taps "Submit Application"

**Step 3: Application Submission**

- System validates all fields
- System uploads documents to S3:
  ```
  s3://afritoken-kyc/agents/[agent-id]/
    - id_front.jpg
    - id_back.jpg
    - proof_address.pdf
    - business_reg.pdf
    - selfie.jpg
  ```
- System creates agent application:
  ```
  User ID: [chidi-user-id]
  Status: PENDING_REVIEW
  Business name: "Chidi's Exchange"
  Documents: [S3 URLs]
  Submitted at: [timestamp]
  ```
- System notifies admin:
  ```
  Email: "New agent application from Chidi Okafor
  Business: Chidi's Exchange
  Location: Lagos, Nigeria
  Review in admin dashboard"
  ```
- Chidi sees confirmation:

  ```
  "✅ Application Submitted!

  We'll review your application within 24-48 hours.
  You'll receive an email with the decision.

  Next step: If approved, deposit $5,000 USDT
  to activate your agent account."
  ```

**Step 4: Admin Review**

- Admin logs into admin dashboard
- Admin sees pending applications queue
- Admin opens Chidi's application
- Admin reviews:
  - ID verification (name matches, valid ID)
  - Address proof (recent utility bill or bank statement)
  - Business documentation (if provided)
  - Selfie matches ID photo
  - Background check (if available)
- Admin conducts video verification call:
  - Verifies identity via video
  - Explains agent responsibilities
  - Answers questions
  - Confirms understanding of terms
- Admin makes decision:
  - Approve: Chidi receives approval email
  - Reject: Email with reasons and reapplication option

**Step 5: Approval Notification**

- Chidi receives email:

  ```
  Subject: Your AfriToken Agent Application Approved! 🎉

  Congratulations Chidi!

  Your agent application has been approved.

  Next Steps:
  1. Deposit minimum $5,000 USDT to your agent wallet
  2. Complete agent training module
  3. Activate your agent profile

  Once activated, you can start facilitating token exchanges
  and earning fees.

  Login to get started: [App Link]

  Welcome to the AfriToken agent network!
  ```

- Push notification: "Agent application approved!"

**Step 6: Security Deposit**

- Chidi logs into app
- Chidi navigates to Agent Dashboard (now visible)
- System displays deposit prompt:

  ```
  Agent Activation

  Status: ⏳ Pending Deposit

  Deposit USDT to activate your agent account:

  Minimum: $5,000 USDT
  Recommended: $10,000 USDT (more capacity)

  Your USDT Deposit Address:
  [QR Code]
  0x789abc... [Copy]

  Send USDT (ERC-20 on Polygon) to this address.

  [I've Sent USDT]
  ```

- Chidi sends $10,000 USDT from his exchange wallet
- Chidi taps "I've Sent USDT"

**Step 7: Deposit Confirmation**

- Background job monitors deposit address
- After 6 blockchain confirmations:
  ```
  Deposit detected:
  Amount: $10,000 USDT
  Tx hash: 0xabc123...
  Confirmations: 6/6 ✓
  ```
- System updates agent record:
  ```
  Deposit amount: $10,000
  Available minting capacity: $10,000
  Status: DEPOSIT_CONFIRMED
  ```
- System creates capacity log:
  ```
  Type: INITIAL_DEPOSIT
  Amount: +$10,000
  Capacity after: $10,000
  ```
- Chidi receives notification:

  ```
  "✅ Deposit Confirmed!
  $10,000 USDT received
  Minting capacity: $10,000

  Complete training to activate your account"
  ```

**Step 8: Agent Training**

- System displays training module:

  ```
  Agent Training (15 minutes)

  Modules:
  1. ✓ How minting works
  2. ✓ How burning works
  3. ✓ Escrow protection system
  4. ✓ Response time expectations
  5. ✓ Handling disputes
  6. ✓ Best practices
  7. □ Quiz (8/10 to pass)

  [Start Training]
  ```

- Chidi completes training modules
- Chidi takes quiz and scores 9/10
- System updates: Training completed ✓

**Step 9: Agent Activation**

- System activates agent profile:
  ```
  Status: ACTIVE
  Available for matching: Yes
  Service hours: 24/7 (can be customized)
  ```
- Chidi sees agent dashboard:

  ```
  Agent Dashboard - Chidi's Exchange

  Status: 🟢 Active
  Minting Capacity: $10,000 / $10,000
  Rating: New Agent ⭐
  Total Transactions: 0
  Today's Earnings: $0

  [Toggle Offline/Online]

  Pending Requests: 0

  Quick Stats:
  - Response time: N/A
  - Completion rate: N/A
  - User satisfaction: N/A
  ```

- System broadcasts to all users in Lagos: New agent available
- Chidi is now visible in agent matching for users

### 7.2 Application Rejection

**Admin Rejects**:

- Admin reviews application
- Admin finds issues:
  - ID document unclear
  - Address proof expired
  - Suspicious background check
- Admin taps "Reject Application"
- Admin provides reason:

  ```
  Reason for rejection:
  - ID document image is unclear, please resubmit a clearer photo
  - Proof of address is from 2022, we need recent (within 3 months)

  You can reapply after addressing these issues.
  ```

**System Actions**:

- Updates application: Status → REJECTED
- Sends email to Chidi with rejection reasons
- Chidi can reapply after fixing issues

### 7.3 Error Scenarios

**Insufficient Deposit**:

```
Chidi sends $3,000 USDT (below $5,000 minimum)

System Actions:
- Detects deposit: $3,000
- Does NOT activate agent
- Notifies Chidi:
  "Deposit received: $3,000
  Minimum required: $5,000
  Please send additional $2,000 to activate"
- Deposit held, waiting for top-up
```

**Wrong Token Sent**:

```
Chidi sends $10,000 worth of ETH instead of USDT

System Actions:
- Doesn't detect USDT deposit
- After 1 hour, Chidi contacts support
- Support manually checks wallet
- Sees ETH instead of USDT
- Support: "Please send USDT (ERC-20). We received ETH by mistake"
- If recoverable: Admin manually converts to USDT
- If not: Chidi must send correct token
```

**Training Failed**:

```
Chidi scores 5/10 on quiz (below 8/10 requirement)

System Actions:
- Displays: "You scored 5/10. Minimum passing: 8/10"
- Allows retake: "Retake Quiz" button
- Unlimited attempts
- Must pass to activate
```

**Deposit Confirmed But Training Not Completed**:

```
Chidi deposits USDT but doesn't complete training for 7 days

System Actions:
- Status: DEPOSIT_CONFIRMED (not ACTIVE)
- Not visible to users for matching
- Reminder emails at day 3, 5, 7
- If 14 days: "Complete training or request deposit refund"
```

### 7.4 State Transitions

```
APPLICATION_SUBMITTED → PENDING_REVIEW → APPROVED → DEPOSIT_CONFIRMED
  → TRAINING_COMPLETED → ACTIVE

Alternative paths:
→ REJECTED (can reapply)
→ DEPOSIT_PENDING (approved but no deposit)
→ TRAINING_PENDING (deposit confirmed, training incomplete)
```

### 7.5 Database Records

**Created**:

- `agents` table record
- `agent_capacity_log` entry (initial deposit)
- KYC documents in S3

**Updated**:

- `users.role` includes 'agent'

### 7.6 Notifications

1. **Applicant**: Application status updates
2. **Admin**: New application for review
3. **Applicant**: Deposit confirmation, training reminders
4. **Users**: New agent available in their area

---

## 8. Agent Deposit Management

### 8.1 Adding to Deposit (Increasing Capacity)

**Step 1: Agent Initiates Increase**

- Agent (Chidi) wants to increase capacity
- Chidi opens Agent Dashboard
- Chidi taps "Increase Capacity"
- System displays:

  ```
  Current Deposit: $10,000
  Available Capacity: $8,000 (minted $2,000)

  Add to your deposit to increase minting capacity:

  Amount to add: [input field] USDT

  New total deposit: $10,000 + [amount]
  New capacity: $8,000 + [amount]

  Deposit Address:
  [QR Code]
  0x789abc... [Copy]

  [I've Sent USDT]
  ```

- Chidi sends $5,000 USDT
- Chidi taps "I've Sent USDT"

**Step 2: Deposit Confirmation**

- Background job detects new deposit:
  ```
  Previous balance: $10,000
  New transaction: +$5,000
  New balance: $15,000
  ```
- After 6 confirmations, system updates:
  ```
  agents.deposit_amount: $10,000 → $15,000
  agents.available_minting_capacity: $8,000 → $13,000
  ```
- System logs:
  ```
  Type: DEPOSIT_INCREASE
  Amount: +$5,000
  Capacity after: $13,000
  ```
- Chidi notified:
  ```
  "✅ Deposit increased!
  New deposit: $15,000
  New capacity: $13,000"
  ```

### 8.2 Withdrawal Request (Exiting Agent Role)

**Step 1: Agent Requests Withdrawal**

- Chidi decides to stop being an agent
- Chidi taps "Withdraw Deposit"
- System displays warnings:

  ```
  Withdraw Deposit

  ⚠️ Important:
  - 30-day notice required
  - No pending transactions allowed
  - Agent profile will be deactivated
  - You can reapply later

  Current deposit: $15,000
  Available capacity: $13,000
  Currently minted: $2,000

  You can withdraw: $13,000 now
  (Cannot withdraw $2,000 until tokens burned)

  [Cancel] [Request Withdrawal]
  ```

- Chidi taps "Request Withdrawal"

**Step 2: Withdrawal Validation**

- System checks:
  - No pending minting transactions
  - No pending burning transactions
  - No unresolved disputes
- If all clear, creates withdrawal request:
  ```
  Agent: Chidi
  Requested amount: $13,000 USDT
  Locked amount: $2,000 (minted, not yet burned)
  Status: PENDING
  Notice period ends: [30 days from now]
  ```
- Updates agent status: WITHDRAWAL_PENDING
- Hides agent from user matching (no new requests)

**Step 3: 30-Day Notice Period**

- Agent can still complete existing transactions
- Agent cannot accept new minting requests
- Users with Chidi's tokens can still burn them
- System reminds Chidi:
  - Day 15: "15 days remaining in notice period"
  - Day 25: "5 days remaining"
  - Day 29: "Withdrawal processes tomorrow"

**Step 4: Withdrawal Execution**

- After 30 days, background job processes:

  ```
  Check:
  - All pending transactions complete? Yes
  - All minted tokens burned? Not yet ($2,000 still outstanding)

  Action:
  - Can withdraw: $13,000
  - Cannot withdraw: $2,000 (still locked)
  ```

- System transfers $13,000 USDT to Chidi's personal wallet
- Updates agent:
  ```
  Deposit: $2,000 (locked until tokens burned)
  Status: WITHDRAWAL_PARTIAL
  ```
- Notifies Chidi:

  ```
  "💰 Withdrawal processed: $13,000 USDT sent

  Remaining: $2,000 locked (users still hold tokens)
  You'll receive the rest when all tokens are burned"
  ```

**Step 5: Final Withdrawal (When All Tokens Burned)**

- User burns the last 2,000 NT minted by Chidi
- System detects: Chidi's minted amount = 0
- System automatically processes final withdrawal:
  ```
  Transfer: $2,000 USDT to Chidi
  Deposit: $0
  Status: WITHDRAWN
  ```
- Notifies Chidi:

  ```
  "✅ Final withdrawal complete!
  $2,000 USDT sent to your wallet

  Thanks for being an AfriToken agent!
  You can reapply anytime."
  ```

### 8.3 Forced Withdrawal (Admin Action)

**Admin Terminates Agent**:

- Admin detects fraud or policy violations
- Admin taps "Terminate Agent" in dashboard
- Admin confirms termination reason
- System:
  - Immediately sets status: TERMINATED
  - Removes from matching
  - Cancels all pending transactions
  - Refunds users from agent's deposit
  - Calculates penalties for violations
  - Transfers remaining deposit (minus penalties) to agent
  - Blacklists agent from reapplying

### 8.4 Error Scenarios

**Withdrawal with Pending Transactions**:

```
Chidi requests withdrawal but has 3 pending minting requests

System Actions:
- Validates: Pending transactions exist
- Displays: "Cannot withdraw with pending transactions
  Complete or cancel 3 pending requests first"
- Shows list of pending transactions
- Chidi must resolve all before withdrawal
```

**Withdrawal with Open Disputes**:

```
Chidi has 1 unresolved dispute

System Actions:
- Displays: "Cannot withdraw with open disputes
  Dispute ID: #DIS123 must be resolved first"
- Links to dispute details
- Withdrawal blocked until resolution
```

**Insufficient Balance for Withdrawal**:

```
Chidi minted $15,000 worth of tokens, deposit is $15,000
Available to withdraw: $0

System Actions:
- Displays: "No available balance to withdraw
  Current deposit: $15,000
  Currently minted: $15,000
  Available: $0

  Users must burn tokens before you can withdraw"
```

### 8.5 State Transitions

```
ACTIVE → WITHDRAWAL_PENDING (30-day notice) → WITHDRAWAL_PARTIAL
  → WITHDRAWN (when all tokens burned)

Alternative paths:
→ TERMINATED (admin action)
→ ACTIVE (withdrawal cancelled during notice period)
```

### 8.6 Database Records

**Updated**:

- `agents.deposit_amount`
- `agents.available_minting_capacity`
- `agents.status`

**Created**:

- `agent_capacity_log` entries
- `withdrawals` table records

### 8.7 Notifications

- Agent: Deposit increase/withdrawal confirmations
- Admin: Withdrawal requests for monitoring
- Users: If agent deactivates mid-transaction

---

## 9. Dispute Resolution

### 9.1 Happy Path (User Wins Dispute)

**Step 1: Dispute Initiation** (from burning flow)

- User (John) sold 10,000 NT to agent (Ada)
- Agent claims sent ₦10,000
- John checks account: No money received
- John taps "No, I Didn't Receive It"
- System displays dispute form:

  ```
  Create Dispute

  Transaction: #TXN789
  Amount: 10,000 NT (₦10,000)
  Agent: Ada's Exchange

  Reason:
  [text area - required]

  Evidence (optional):
  - Screenshot of bank statement [upload]
  - Screenshot of account balance [upload]

  [Submit Dispute]
  ```

- John enters: "Checked my bank account multiple times. No ₦10,000 received"
- John uploads bank statement screenshot
- John taps "Submit Dispute"

**Step 2: Dispute Creation**

- System creates dispute record:
  ```
  ID: DIS001
  Transaction: #TXN789
  Initiated by: User (John)
  Against: Agent (Ada)
  Amount: 10,000 NT
  User reason: "Checked my bank account multiple times..."
  User evidence: [S3 URL to bank statement]
  Status: PENDING_REVIEW
  Created at: [timestamp]
  ```
- System calls smart contract disputeBurn():
  - Re-mints 10,000 NT to John (refund)
  - Slashes Ada's deposit by 12,000 (120%)
  - Emits BurnDisputed event
- System updates burning transaction:
  ```
  Status: DISPUTED
  Disputed at: [timestamp]
  ```
- System suspends Ada temporarily:
  ```
  agents.status: ACTIVE → SUSPENDED
  Reason: "Dispute #DIS001 under review"
  ```

**Step 3: Notifications**

- John receives:
  ```
  "Dispute submitted
  Your 10,000 NT tokens have been refunded
  Our team will review within 24 hours
  Dispute ID: #DIS001"
  ```
- Ada receives:

  ```
  "⚠️ Dispute filed against you
  Transaction: #TXN789
  User claims: No payment received

  Your account is temporarily suspended.
  Submit your evidence within 24 hours.

  Dispute ID: #DIS001"
  ```

- Admin receives:
  ```
  Email: "New dispute #DIS001 requires review
  User: John Doe
  Agent: Ada's Exchange
  Amount: ₦10,000
  Claim: Payment not received"
  ```

**Step 4: Agent Response**

- Ada opens app, sees dispute notification
- Ada taps "View Dispute #DIS001"
- System displays:

  ```
  Dispute Details

  User claim: "Checked my bank account multiple times. No ₦10,000 received"
  User evidence: [bank statement image]

  Your response:
  [text area - required]

  Your evidence:
  - Payment confirmation [upload]
  - Bank transfer receipt [upload]

  Deadline: 23 hours remaining

  [Submit Response]
  ```

- Ada uploads her payment confirmation
- Ada writes: "Payment sent via GTBank. Reference: TRF202510210001"
- Ada taps "Submit Response"

**Step 5: Admin Review**

- Admin logs into dashboard
- Admin opens Dispute #DIS001
- Admin sees both sides:

  ```
  User (John):
  - Claim: No payment received
  - Evidence: Bank statement showing no ₦10,000 credit

  Agent (Ada):
  - Claim: Payment sent
  - Evidence: Bank transfer receipt
  ```

- Admin examines evidence:
  - Ada's receipt shows: ₦10,000 to account 0123456789
  - John's bank statement shows account: 0987654321
  - **Mismatch**: Ada sent to wrong account!
- Admin makes decision: **User wins**

**Step 6: Resolution**

- Admin taps "Resolve: User Wins"
- Admin adds notes:

  ```
  "Agent sent payment to wrong account number.
  Agent's receipt shows 0123456789, but user's account is 0987654321.

  Resolution:
  - User keeps refunded tokens
  - Agent's deposit slash upheld
  - Agent warned about verifying payment details"
  ```

- System updates dispute:
  ```
  Status: RESOLVED_USER
  Resolved by: Admin
  Resolution: [admin notes]
  Resolved at: [timestamp]
  ```
- System actions:
  - John keeps 10,000 NT (already refunded)
  - Ada's deposit slash stands: -$12,000
  - Ada's new deposit: $15,000 - $12,000 = $3,000
  - Ada remains suspended (needs review for reactivation)
  - Permanent mark on Ada's record

**Step 7: Final Notifications**

- John receives:

  ```
  "✅ Dispute resolved in your favor

  You keep: 10,000 NT tokens

  Admin notes: [summary of resolution]

  Thank you for your patience."
  ```

- Ada receives:

  ```
  "❌ Dispute resolved against you

  Issue: Payment sent to incorrect account
  Penalty: $12,000 USDT deducted from deposit

  New deposit: $3,000
  Status: Under review

  Please contact support to discuss reactivation."
  ```

### 9.2 Agent Wins Dispute

**Scenario**: Agent actually sent payment, user lying

**Admin Review Finds**:

- Agent's receipt shows correct account number
- Receipt timestamp matches transaction window
- Bank reference number is valid
- User's bank statement shows ₦10,000 credited at same time
- **User attempted fraud**

**Resolution**:

- Admin taps "Resolve: Agent Wins"
- System:
  - Burns John's refunded 10,000 NT (takes back refund)
  - Restores Ada's slashed deposit
  - Marks John's account: FRAUD_ATTEMPTED
  - Restricts John's account (lower limits, more scrutiny)
  - Ada's status: SUSPENDED → ACTIVE
  - Ada's deposit restored: $3,000 → $15,000

**Notifications**:

- John:
  ```
  "Dispute resolved against you
  Evidence shows payment was received.
  Your account has been flagged for fraudulent dispute.
  Further violations may result in permanent ban."
  ```
- Ada:
  ```
  "✅ Dispute resolved in your favor
  Your deposit has been restored.
  Account reactivated.
  Thank you for your patience."
  ```

### 9.3 Partial Resolution

**Scenario**: Agent sent ₦8,000 instead of ₦10,000

**Admin Review Finds**:

- Agent's receipt shows ₦8,000
- User expected ₦10,000
- Both parties honest, agent made mistake

**Resolution**:

- Admin taps "Resolve: Partial"
- Admin enters:

  ```
  Agent sent: ₦8,000
  User expected: ₦10,000
  Difference: ₦2,000

  Resolution:
  - Refund user: 2,000 NT (proportional)
  - Agent penalty: $2,400 (120% of difference)
  - Remaining amount stands as completed
  ```

- System:
  - Refunds 2,000 NT to John (from Ada's deposit)
  - Slashes Ada's deposit by $2,400
  - Marks transaction: PARTIAL_COMPLETION
  - Warns Ada about accuracy

### 9.4 Auto-Dispute (No User Response)

**Timeline**:

- Agent sent fiat, tokens burned
- 30 minutes pass, user doesn't confirm or dispute
- Background job auto-creates dispute:
  ```
  Type: AUTO_ESCALATION
  Reason: "User did not respond within 30 minutes"
  Status: PENDING_ADMIN_REVIEW
  ```

**Admin Review**:

- Admin sees auto-escalated dispute
- Admin tries to contact user (email, SMS, push)
- If user responds: Process normally
- If user doesn't respond after 48 hours:
  - **Default: Favor agent** (proof provided, user unresponsive)
  - Transaction marked complete
  - User's tokens stay burned
  - Agent keeps capacity increase

### 9.5 Error Scenarios

**Dispute After Confirmation**:

```
John confirmed receipt, then tries to dispute later

System Actions:
- Validates: Transaction status = USER_CONFIRMED
- Displays: "Cannot dispute a confirmed transaction
  You confirmed receipt on [timestamp]"
- Dispute not created
- If genuine issue: User contacts support directly
```

**Agent Doesn't Respond to Dispute**:

```
Ada has 24 hours to respond, doesn't submit evidence

System Actions:
- After 24 hours: Auto-decision favor user
- Reasoning: "Agent failed to provide evidence within deadline"
- Resolution: User keeps refund, agent penalty upheld
- Additional penalty for non-response
```

**Admin Cannot Reach Decision**:

```
Evidence is conflicting and unclear

Admin Actions:
- Requests additional evidence from both parties
- Extends review period
- May request external verification (bank confirmation)
- If still unclear after all efforts:
  - Split decision: Partial refund to both
  - Case documented for pattern analysis
```

### 9.6 State Transitions

```
DISPUTE_CREATED → PENDING_REVIEW → AGENT_RESPONDED
  → ADMIN_REVIEWING → RESOLVED_USER
                    → RESOLVED_AGENT
                    → RESOLVED_PARTIAL

Alternative paths:
→ AUTO_RESOLVED (agent non-response after 24h)
→ WITHDRAWN (user withdraws dispute)
```

### 9.7 Database Records

**Created**:

- `disputes` table record
- `dispute_evidence` table (files, notes)
- `agent_penalties` table

**Updated**:

- `transactions.status` → DISPUTED
- `agents.deposit_amount` (slashed or restored)
- `agents.status` (suspended or reactivated)
- `users.fraud_flags` (if applicable)

### 9.8 Notifications

1. **User**: Dispute status updates
2. **Agent**: Dispute filed, resolution
3. **Admin**: New disputes for review
4. **Both**: Final resolution and actions taken

---

## 10. Merchant Payment Collection

### 10.1 Creating Payment Link

**Step 1: Merchant Creates Link**

- Merchant (Bola's Boutique) wants to collect 5,000 NT for a dress
- Bola taps "Merchant" tab → "Create Payment Link"
- System displays form:

  ```
  Create Payment Link

  Item/Service: [text field]
  Description: [text area - optional]
  Amount: [input] NT

  Options:
  □ Fixed amount (customer cannot change)
  □ Allow customer to enter amount

  Token type: [NT ▼] [CT] [USDT]

  Link expiration:
  [Dropdown: Never, 24 hours, 7 days, 30 days]

  [Create Link]
  ```

- Bola enters:
  - Item: "Ankara Dress - Blue Pattern"
  - Description: "Custom-made Ankara dress, size M"
  - Amount: 5,000 NT
  - Fixed amount: ✓
  - Token: NT
  - Expiration: 7 days
- Bola taps "Create Link"

**Step 2: Link Generation**

- System creates payment link:
  ```
  ID: PL123456
  Merchant: Bola's Boutique
  Item: "Ankara Dress - Blue Pattern"
  Amount: 5,000 NT
  Fixed: Yes
  Status: ACTIVE
  Expires: [7 days from now]
  Link code: BOLA-DRESS-5K
  URL: https://afritoken.com/pay/BOLA-DRESS-5K
  ```
- System displays link details:

  ```
  ✅ Payment Link Created!

  Ankara Dress - Blue Pattern
  Amount: 5,000 NT

  Share with your customer:

  Link: afritoken.com/pay/BOLA-DRESS-5K
  [Copy Link]

  QR Code: [QR displayed]
  [Download QR]

  Share via:
  [WhatsApp] [SMS] [Email] [More...]
  ```

**Step 3: Customer Receives Link**

- Customer (Tolu) receives link via WhatsApp
- Tolu taps link or scans QR code
- If Tolu has app installed: Opens in app
- If not: Opens web view with "Get App" prompt

**Step 4: Payment Screen**

- System displays payment details:

  ```
  Pay Bola's Boutique

  🛍️ Ankara Dress - Blue Pattern
  Custom-made Ankara dress, size M

  Amount: 5,000 NT
  Merchant fee: 100 NT (2%)
  Total: 5,100 NT

  Your balance: 8,995 NT ✓

  [Pay with NT]

  Powered by AfriToken
  ```

- Tolu reviews and taps "Pay with NT"

**Step 5: Payment Confirmation**

- System shows confirmation:

  ```
  Confirm Payment

  To: Bola's Boutique
  For: Ankara Dress - Blue Pattern
  Amount: 5,000 NT
  Fee: 100 NT
  Total: 5,100 NT

  [Confirm]
  ```

- Tolu confirms with PIN/biometric

**Step 6: Transfer Execution**

- System executes transfer (same as P2P):
  - Transfers 5,000 NT to Bola's wallet
  - Transfers 100 NT to platform (merchant fee)
  - Creates transaction record
- System marks payment link:
  ```
  Status: PAID
  Paid by: Tolu
  Paid at: [timestamp]
  Transaction ID: #TXN890
  ```

**Step 7: Notifications**

- Bola receives:

  ```
  "💰 Payment received: 5,000 NT
  From: Tolu Adeyemi
  For: Ankara Dress - Blue Pattern

  View in Merchant Dashboard"
  ```

- Tolu receives:

  ```
  "✅ Payment successful!
  To: Bola's Boutique
  Amount: 5,000 NT

  Receipt saved in transaction history"
  ```

- Both see transaction in history

### 10.2 QR Code Payment (In-Person)

**Scenario**: Customer shopping in physical store

**Step 1: Merchant Displays QR**

- Bola has printed QR code at checkout
- OR Bola shows QR on her phone/tablet
- QR encodes: Merchant ID, dynamic amount capability

**Step 2: Customer Scans**

- Tolu opens AfriToken app
- Tolu taps "Send" → Scans QR
- System recognizes merchant QR
- System displays:

  ```
  Pay Bola's Boutique

  Enter amount: [input] NT
  Note: [optional]

  [Pay Now]
  ```

**Step 3: Amount Entry**

- Bola tells Tolu: "That's 3,500 NT"
- Tolu enters 3,500 NT
- Tolu taps "Pay Now"
- Rest of flow same as payment link

### 10.3 Merchant Dashboard

**What Bola Sees**:

```
Merchant Dashboard - Bola's Boutique

Today's Summary:
- Payments: 12
- Total received: 45,000 NT
- Fees paid: 900 NT (2%)
- Net: 44,100 NT

This Week: 67,500 NT
This Month: 280,000 NT

Recent Payments:
1. Tolu Adeyemi - 5,000 NT - Ankara Dress
2. John Doe - 2,500 NT - Headwrap
3. Jane Smith - 8,000 NT - Complete outfit
...

Payment Links (5 active):
1. Ankara Dress - 5,000 NT [Paid]
2. Casual Shirt - 3,000 NT [Active] [Share]
3. Traditional Cap - 1,500 NT [Active] [Share]
...

[Create New Link] [View All Transactions] [Settings]
```

### 10.4 Error Scenarios

**Insufficient Customer Balance**:

```
Tolu tries to pay 5,000 NT but only has 4,000 NT

System Actions:
- Validates balance before confirmation
- Displays: "Insufficient balance. You have 4,000 NT"
- Options: "Buy Tokens" or "Cancel Payment"
- Notifies merchant: Payment attempt failed (optional)
```

**Payment Link Expired**:

```
Link was created 8 days ago with 7-day expiration

Customer Actions:
- Clicks expired link

System Actions:
- Displays: "This payment link has expired
  Please contact Bola's Boutique for a new link"
- Merchant can create new link with same details
```

**Payment Link Already Paid**:

```
Link was single-use, already paid by another customer

System Actions:
- Displays: "This payment link has already been used
  Contact merchant if you need to make another payment"
- Prevents double payment
```

**Customer Not Registered**:

```
Link clicked by someone without AfriToken account

System Actions:
- Web view displays: "Get AfriToken to complete payment"
- Shows merchant details and amount
- [Download App] button
- After registration: Can resume payment
```

### 10.5 State Transitions

```
LINK_CREATED → ACTIVE → PAID (one-time links)
                      → EXPIRED (if timeout)
                      → CANCELLED (merchant cancels)

Recurring/reusable links:
LINK_CREATED → ACTIVE → PAID → ACTIVE (resets after each payment)
```

### 10.6 Database Records

**Created**:

- `payment_links` record
- `transactions` record (when paid)
- `merchant_earnings` log

**Updated**:

- `payment_links.status` (when paid/expired)
- `wallets.balance` (customer and merchant)
- Merchant dashboard statistics

### 10.7 Notifications

1. **Merchant**: Payment received, daily summary
2. **Customer**: Payment confirmation, receipt
3. **Platform**: Merchant fee collected

---

## 11. System State Transitions

### Transaction States Overview

```
MINTING TRANSACTION:
initiated → payment_submitted → agent_reviewing → agent_confirmed
  → tokens_minted (SUCCESS)
  → agent_no_response (TIMEOUT)
  → disputed (DISPUTE)
  → cancelled (USER_CANCEL)

BURNING TRANSACTION:
initiated → escrow_locked → agent_sent_fiat → user_confirmed (SUCCESS)
  → user_disputed (DISPUTE)
  → expired (AGENT_TIMEOUT)
  → cancelled (USER_CANCEL)

P2P TRANSFER:
initiated → recipient_confirmed → amount_entered → pending
  → completed (SUCCESS)
  → failed (ERROR)

TOKEN SWAP:
initiated → amount_entered → rate_locked → executing → completed (SUCCESS)
  → failed (SLIPPAGE/ERROR)

TOKEN REQUEST:
created → pending → fulfilled (SENT)
                 → rejected (DECLINED)
                 → cancelled (REQUESTER_CANCEL)
                 → expired (TIMEOUT)

PAYMENT LINK:
created → active → paid (SUCCESS)
                → expired (TIMEOUT)
                → cancelled (MERCHANT_CANCEL)

AGENT APPLICATION:
submitted → pending_review → approved → deposit_confirmed
  → training_completed → active (SUCCESS)
  → rejected (FAILED)

DISPUTE:
created → pending_review → agent_responded → admin_reviewing
  → resolved_user (USER_WINS)
  → resolved_agent (AGENT_WINS)
  → resolved_partial (SPLIT)
```

### User States

```
NEW → unverified → verified → active
                            → suspended (violations)
                            → banned (fraud)
                            → inactive (voluntary)
```

### Agent States

```
APPLICANT → pending_review → approved → deposit_pending
  → deposit_confirmed → training_pending → active
  → withdrawal_pending → withdrawn
  → suspended (disputes/violations)
  → terminated (fraud/policy)
```

---

## 12. Notification Triggers

### Push Notifications

**User Notifications**:

1. **Registration**: Welcome, verification reminder
2. **Tokens Received**: From agent, from user, from merchant
3. **Tokens Sent**: Confirmation
4. **Request Received**: Someone requesting tokens
5. **Request Fulfilled**: Someone sent tokens you requested
6. **Agent Status**: Agent confirmed/delayed/issue
7. **Dispute**: Status updates
8. **Security**: Login from new device, password change
9. **Promotional**: New features, bonuses, milestones

**Agent Notifications**:

1. **New Request**: Mint or burn request from user
2. **Request Urgent**: User waiting >10 minutes
3. **Payment Confirmed**: User uploaded proof
4. **Transaction Complete**: User confirmed receipt
5. **Dispute Filed**: Dispute against agent
6. **Deposit Confirmed**: Additional deposit received
7. **Performance Alert**: Low rating, slow response
8. **Status Change**: Suspended, reactivated

**Merchant Notifications**:

1. **Payment Received**: Customer paid
2. **Daily Summary**: End of day total
3. **Weekly Report**: Week's performance
4. **Link Expired**: Payment link expired
5. **Failed Payment**: Customer insufficient balance

### Email Notifications

**User Emails**:

1. **Verification**: Email verification code
2. **Password Reset**: Reset link
3. **Receipt**: Transaction receipt (optional)
4. **Dispute**: Dispute status updates
5. **Security**: Important account changes
6. **Marketing**: Newsletter (opt-in)

**Agent Emails**:

1. **Application**: Status updates
2. **Approval**: Welcome and next steps
3. **Training**: Training materials
4. **Dispute**: Dispute details and deadline
5. **Performance**: Monthly report

**Admin Emails**:

1. **New Application**: Agent application for review
2. **Dispute**: New dispute requires attention
3. **System Alert**: Critical errors, fraud detection
4. **Reports**: Daily/weekly platform metrics

### SMS Notifications (Critical Only)

**User SMS**:

1. **Verification**: 6-digit code (if email fails)
2. **Security**: Suspicious login attempt
3. **Large Transaction**: Confirmation for >$1000

**Agent SMS**:

1. **Urgent Request**: User waiting >15 min
2. **Dispute**: Dispute filed (backup to push)
3. **Suspension**: Account suspended alert

### In-App Notifications

**Notification Center**:

- All push notifications stored here
- Unread count badge
- Swipe to delete or mark read
- Tap to navigate to relevant screen

**Toast Notifications**:

- Balance updated
- Transaction confirmed
- Error occurred
- Feature announcement

---

## 13. Error Scenarios & Recovery

### Network Errors

**User Loses Connection Mid-Transaction**:

```
User initiates transfer, network drops before completion

System Actions:
- Backend receives request but can't respond to user
- Transaction proceeds on backend
- Stores transaction in database: PENDING
- When user reconnects:
  - App checks for pending transactions
  - Updates UI with transaction status
  - If completed: Show success
  - If failed: Show error and refund
```

**Blockchain Network Congestion**:

```
Transaction pending on blockchain for >5 minutes

System Actions:
- Monitor transaction status
- After 5 min: Bump gas price, retry
- After 10 min: Display to user "Transaction delayed due to network. Please wait"
- After 30 min: Escalate to admin
- User option: "Cancel and Retry" (submits new transaction)
```

### Blockchain Errors

**Smart Contract Reverts**:

```
Transaction fails: "Insufficient capacity"

System Actions:
- Catches revert reason from blockchain
- Translates to user-friendly message
- "Agent capacity insufficient. Please select another agent"
- Automatically refunds user
- Updates agent availability in database
```

**Gas Estimation Failure**:

```
Cannot estimate gas for transaction

System Actions:
- Uses default gas limit (buffer above average)
- If transaction still fails: Queue for manual retry
- Admin notified to investigate
```

**Wrong Network**:

```
User's wallet connected to Ethereum mainnet instead of Polygon

System Actions:
- Detects network mismatch
- Displays: "Please switch to Polygon network"
- Provides instructions
- Prevents transaction until correct network
```

### Payment Errors

**Payment Proof Upload Fails**:

```
User uploads 15MB screenshot (too large)

System Actions:
- Validates file size before upload
- Displays: "File too large. Maximum 5MB"
- Suggests: "Try compressing the image"
- Provides option to take new photo
```

**Agent Bank Details Invalid**:

```
User sends to agent's bank account but number wrong

System Actions:
- Cannot detect this from platform
- User realizes mistake, contacts support
- Support creates manual intervention
- If recoverable: Agent returns funds, retry
- If not: User absorbs loss, agent not penalized
```

### Data Errors

**Database Connection Lost**:

```
Backend loses connection to PostgreSQL

System Actions:
- Connection pool retries automatically
- If extended outage:
  - API returns 503 Service Unavailable
  - Frontend shows maintenance message
  - Queues requests for retry
- Monitoring alerts admin immediately
```

**Data Sync Conflict**:

```
User's offline balance shows 5,000 NT
Backend shows 3,000 NT (user spent 2,000 while offline)

System Actions:
- On reconnect: Backend balance wins (source of truth)
- Updates local database
- Displays notification: "Your balance was updated"
- Syncs transaction history
```

### User Errors

**User Enters Wrong Amount**:

```
User meant to send 1,000 NT but entered 10,000 NT

Prevention:
- Confirmation screen shows amount clearly
- "You'll have X remaining" displayed
- Requires explicit confirmation

Recovery:
- If sent: Cannot undo blockchain transaction
- User must request refund from recipient
- Platform cannot reverse completed transactions
```

**User Scans Wrong QR Code**:

```
User scans QR that's not AfriToken format

System Actions:
- Validates QR data format
- If invalid: "This QR code is not recognized. Please scan an AfriToken QR"
- Does not proceed with transaction
```

### Agent Errors

**Agent Confirms Wrong Transaction**:

```
Agent sees multiple pending requests, confirms wrong one

System Actions:
- Agent's confirmation linked to specific transaction ID
- Cannot confirm transaction not assigned to them
- If agent confused: Must contact support
- Support can cancel/reassign transactions
```

**Agent Goes Offline Mid-Transaction**:

```
Agent accepts request but then goes offline (phone died, network lost)

System Actions:
- 15-minute timeout still running
- If agent doesn't return: Auto-escalation
- User offered: "Try another agent"
- Agent penalized for incomplete transactions
```

### Recovery Strategies

**Transaction Stuck**:

```
1. Automatic retry (3 attempts with exponential backoff)
2. If still stuck: Move to admin queue
3. Admin manual intervention
4. Always ensure user not charged for failed transactions
```

**Lost Data**:

```
1. Database backups run daily
2. Point-in-time recovery available
3. Blockchain provides immutable audit trail
4. Can reconstruct balances from blockchain
```

**Platform Downtime**:

```
1. Display maintenance page with ETA
2. Queue critical notifications for delivery when back
3. WebSocket auto-reconnects when available
4. Offline mode allows viewing cached data
```

---

## 14. Edge Cases

### Timing Edge Cases

**User and Agent Act Simultaneously**:

```
Scenario: User cancels while agent confirms payment

System Actions:
- Database uses transaction isolation
- First action wins (likely agent confirmation)
- If agent wins: User cancel rejected
- If user wins: Agent confirmation rejected, notified
```

**Rate Changes During Swap**:

```
Scenario: Rate changes between user seeing it and confirming

System Actions:
- Rate locked when user taps "Swap Now"
- Valid for 30 seconds
- If executed after 30 sec: Must reconfirm new rate
- Slippage protection: Max 2% deviation allowed
```

**Multiple Users Select Same Agent**:

```
Scenario: Agent has capacity for 10,000 NT
Two users simultaneously request 8,000 NT each

System Actions:
- Database uses pessimistic locking on agent capacity
- First request locks capacity, executes
- Second request sees insufficient capacity
- Second user offered: "Agent capacity insufficient, try another"
```

### Amount Edge Cases

**Very Small Amounts**:

```
User tries to send 1 NT (below minimum)

System Actions:
- Validates minimum: 100 NT
- Displays: "Minimum transfer: 100 NT"
- Prevents transaction
```

**Very Large Amounts**:

```
User tries to send 1,000,000 NT

System Actions:
- Checks user verification tier:
  - Basic: Max 100,000/day
  - ID Verified: Max 500,000/day
  - Premium: Max 2,000,000/day
- If exceeded: "Daily limit reached. Upgrade verification or try tomorrow"
- Prevents transaction
```

**Decimal Precision**:

```
NT has 2 decimals (like Naira kobo)
User enters: 1,000.567 NT

System Actions:
- Rounds to: 1,000.57 NT
- Displays rounded amount before confirmation
- User must confirm rounded amount
```

### Blockchain Edge Cases

**Transaction Confirmed But Not Detected**:

```
Blockchain transaction succeeds but webhook missed

System Actions:
- Background job polls blockchain every minute
- Finds missing transactions by wallet address
- Updates database retroactively
- Notifies user of delayed confirmation
```

**Chain Reorganization**:

```
Transaction confirmed in block, then block orphaned

System Actions:
- Wait for 6 confirmations before considering final
- If reorg detected: Transaction status → PENDING
- Monitor for re-inclusion in blockchain
- If not re-included after 1 hour: Retry
```

**Wallet Compromise**:

```
User's private key stolen, unauthorized transfers

System Actions:
- Cannot prevent blockchain transactions
- User must report immediately
- Platform can freeze account (prevent new transactions)
- Cannot reverse blockchain transactions
- User loses tokens (like losing cash)
- Prevention: Educate users on key security
```

### Multi-Currency Edge Cases

**User Has Mixed Balances**:

```
User has: 5,000 NT, 10,000 CT, 50 USDT
Agent only accepts NT

System Actions:
- Only show NT in agent transaction
- Suggest swapping CT → NT if needed
- Display: "Need more NT? Swap CT to NT"
```

**Agent Mints Wrong Token**:

```
User requested NT, agent accidentally mints CT

System Actions:
- Transaction recorded with correct token type requested
- Mismatch detected: User received CT but paid for NT
- Automatic dispute creation
- Admin reviews: Agent must swap CT → NT for user
- Agent penalized for error
```

---

## Summary: Key Principles

**1. User Trust**: Always protect users with escrow and refunds  
**2. Agent Accountability**: Deposits and penalties ensure compliance  
**3. Transparency**: Every step visible to relevant parties  
**4. Automation**: Reduce manual intervention where possible  
**5. Recovery**: Every error has a recovery path  
**6. Documentation**: Immutable blockchain + database audit trail  
**7. Communication**: Notify all parties at every state change  
**8. Validation**: Validate early and often to prevent errors  
**9. Timeouts**: Every waiting state has a timeout and fallback  
**10. Admin Oversight**: Human review for complex disputes

---

**Document Version**: 1.0  
**Last Updated**: October 22, 2025  
**Next Review**: Weekly during development, monthly post-launch

This transaction flows document should be referenced continuously during development and updated as edge cases are discovered in testing and production.
