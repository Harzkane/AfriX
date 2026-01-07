# Dispute Routes Testing Guide

## Prerequisites

- Server running on `http://localhost:5001`
- You have a registered user with JWT token
- User ID: `b20f56f7-9471-45c6-b56a-51d6e5117217`
- Admin user with JWT token for admin operations
- At least one escrow transaction (LOCKED or FINALIZED)
- Escrow ID: `escrow-123-456-789`
- Transaction ID: `tx-1234-5678-90ab-cdef`

## Authentication Header

All requests require authentication. Add this header to every request:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**For Admin Operations:**

```
Authorization: Bearer YOUR_ADMIN_JWT_TOKEN_HERE
```

---

## What is a Dispute?

A dispute is a formal complaint raised when:

- **Agent doesn't send fiat** after escrow finalized
- **Wrong amount received** by user
- **Payment not received** within reasonable time
- **Fraudulent activity** suspected
- **Technical issues** preventing completion

### Dispute Resolution Process:

```
1. User opens dispute → OPEN
   ↓
2. Agent responds with evidence
   ↓
3. Admin reviews both sides
   ↓
4. Admin resolves: RESOLVED or ESCALATED
   ↓
5. Actions taken: refund, penalty, or close
```

---

## Dispute Lifecycle

```
OPEN → Under investigation
  ↓
RESOLVED → Issue fixed, case closed
  ↓ OR
ESCALATED → Serious issue, higher review
  ↓ OR
CLOSED → No action needed
```

---

## 1. Open a Dispute

**POST** `http://localhost:5001/api/v1/disputes`

User opens a dispute when there's a problem with an escrow transaction.

### Request Body:

```json
{
  "escrowId": "escrow-123-456-789",
  "transactionId": "tx-1234-5678-90ab-cdef",
  "agentId": "agent-abc-123",
  "reason": "Payment not received",
  "details": "Agent marked escrow as finalized but I have not received the ₦5,000 fiat payment to my bank account. Transaction was finalized 2 hours ago. My bank account: First Bank 1234567890."
}
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "dispute-xyz-789",
    "escrow_id": "escrow-123-456-789",
    "transaction_id": "tx-1234-5678-90ab-cdef",
    "opened_by_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
    "agent_id": "agent-abc-123",
    "reason": "Payment not received",
    "details": "Agent marked escrow as finalized but I have not received the ₦5,000 fiat payment to my bank account. Transaction was finalized 2 hours ago. My bank account: First Bank 1234567890.",
    "status": "OPEN",
    "escalation_level": "LEVEL_1",
    "resolution": null,
    "created_at": "2025-10-24T17:30:00.000Z",
    "updated_at": "2025-10-24T17:30:00.000Z"
  }
}
```

### ✅ What to Check:

- Response status: 201
- Dispute `id` is generated
- `status` is "OPEN"
- `escalation_level` starts at "LEVEL_1"
- `resolution` is null (not yet resolved)
- All provided details are saved
- User and agent IDs are correctly linked

### Common Dispute Reasons:

- `Payment not received`
- `Wrong amount received`
- `Delayed payment`
- `Agent unresponsive`
- `Suspected fraud`
- `Technical error`
- `Other`

### ❌ Error Cases:

**Escrow Not Found:**

```json
{
  "escrowId": "non-existent-escrow",
  "reason": "Payment not received"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Escrow not found"
}
```

**Missing Required Fields:**

```json
{
  "escrowId": "escrow-123-456-789"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "escrowId and reason are required"
}
```

**Duplicate Dispute:**

If dispute already exists for this escrow:

```json
{
  "success": false,
  "message": "Dispute already exists for this escrow"
}
```

**Cannot Dispute Pending Escrow:**

If escrow status is still LOCKED:

```json
{
  "success": false,
  "message": "Cannot open dispute for pending escrow. Wait for finalization or cancellation."
}
```

---

## 2. List All Disputes (Admin Only)

**GET** `http://localhost:5001/api/v1/disputes`

Admin endpoint to view all disputes in the system.

### Query Parameters:

- `status` (optional): Filter by status (OPEN, RESOLVED, ESCALATED, CLOSED)
- `escalation_level` (optional): Filter by level (LEVEL_1, LEVEL_2, LEVEL_3)
- `agent_id` (optional): Filter by agent
- `user_id` (optional): Filter by user
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 100)

### Example Requests:

**Get All Disputes:**

```
GET http://localhost:5001/api/v1/disputes
```

**Filter by Status:**

```
GET http://localhost:5001/api/v1/disputes?status=OPEN
```

**Filter by Escalation Level:**

```
GET http://localhost:5001/api/v1/disputes?escalation_level=LEVEL_2
```

**Filter by Agent:**

```
GET http://localhost:5001/api/v1/disputes?agent_id=agent-abc-123
```

### Expected Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "dispute-xyz-789",
      "escrow_id": "escrow-123-456-789",
      "transaction_id": "tx-1234-5678-90ab-cdef",
      "opened_by_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
      "agent_id": "agent-abc-123",
      "reason": "Payment not received",
      "details": "Agent marked escrow as finalized but I have not received payment...",
      "status": "OPEN",
      "escalation_level": "LEVEL_1",
      "resolution": null,
      "created_at": "2025-10-24T17:30:00.000Z",
      "updated_at": "2025-10-24T17:30:00.000Z"
    },
    {
      "id": "dispute-abc-456",
      "escrow_id": "escrow-789-012-345",
      "transaction_id": "tx-9876-5432-10ab-cdef",
      "opened_by_user_id": "user-def-456",
      "agent_id": "agent-xyz-789",
      "reason": "Wrong amount received",
      "details": "Expected ₦5,000 but only received ₦4,500...",
      "status": "RESOLVED",
      "escalation_level": "LEVEL_1",
      "resolution": {
        "action": "partial_refund",
        "penalty_amount_usd": 50,
        "notes": "Agent penalized. User refunded 500 NT.",
        "resolved_by": "admin-123",
        "resolved_at": "2025-10-24T18:00:00.000Z"
      },
      "created_at": "2025-10-24T16:00:00.000Z",
      "updated_at": "2025-10-24T18:00:00.000Z"
    }
  ]
}
```

### ✅ What to Check:

- All disputes are returned (respecting filters)
- Ordered by `created_at` DESC (newest first)
- Limit is enforced (default 100)
- Resolution details shown if resolved
- Escalation levels are accurate

### ❌ Error Case:

**Unauthorized (Not Admin):**

```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

## 3. Get Single Dispute

**GET** `http://localhost:5001/api/v1/disputes/:id`

Retrieve detailed information about a specific dispute.

### URL Parameter:

```
:id = dispute-xyz-789
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "dispute-xyz-789",
    "escrow_id": "escrow-123-456-789",
    "transaction_id": "tx-1234-5678-90ab-cdef",
    "opened_by_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
    "agent_id": "agent-abc-123",
    "reason": "Payment not received",
    "details": "Agent marked escrow as finalized but I have not received the ₦5,000 fiat payment to my bank account. Transaction was finalized 2 hours ago. My bank account: First Bank 1234567890.",
    "status": "OPEN",
    "escalation_level": "LEVEL_1",
    "resolution": null,
    "created_at": "2025-10-24T17:30:00.000Z",
    "updated_at": "2025-10-24T17:30:00.000Z"
  }
}
```

### ✅ What to Check:

- All dispute details are returned
- Linked escrow and transaction IDs provided
- Current status and escalation level shown
- Resolution details if resolved
- User and agent information included

### ❌ Error Cases:

**Dispute Not Found:**

```
GET /disputes/non-existent-id
```

Expected Error:

```json
{
  "success": false,
  "message": "Dispute not found"
}
```

**Unauthorized Access:**

If user tries to view another user's dispute:

```json
{
  "success": false,
  "message": "You don't have permission to view this dispute"
}
```

---

## 4. Resolve Dispute (Admin Only)

**POST** `http://localhost:5001/api/v1/disputes/:id/resolve`

Admin resolves a dispute by taking action.

### URL Parameter:

```
:id = dispute-xyz-789
```

### Request Body (Refund to User):

```json
{
  "action": "refund",
  "penalty_amount_usd": 100,
  "notes": "Investigation confirmed agent did not send fiat payment. User will be refunded. Agent penalized $100 from deposit."
}
```

### Request Body (Close Without Action):

```json
{
  "action": "close",
  "notes": "User confirmed payment was received after delay. No penalty needed."
}
```

### Request Body (Escalate):

```json
{
  "action": "escalate",
  "notes": "Complex case requiring senior review. Escalating to Level 2."
}
```

### Request Body (Partial Refund):

```json
{
  "action": "partial_refund",
  "penalty_amount_usd": 50,
  "notes": "Wrong amount sent. Agent penalized $50. User refunded 500 NT difference."
}
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "dispute": {
      "id": "dispute-xyz-789",
      "status": "RESOLVED",
      "resolution": {
        "action": "refund",
        "penalty_amount_usd": 100,
        "notes": "Investigation confirmed agent did not send fiat payment. User will be refunded. Agent penalized $100 from deposit.",
        "resolved_by": "admin-123-456",
        "resolved_at": "2025-10-24T18:30:00.000Z"
      },
      "updated_at": "2025-10-24T18:30:00.000Z"
    },
    "actions_taken": {
      "user_refunded": true,
      "refund_amount": "5000.00000000",
      "agent_penalized": true,
      "penalty_usd": 100,
      "escrow_status": "REFUNDED"
    }
  }
}
```

### ✅ What to Check:

- Dispute `status` changed to "RESOLVED" or "ESCALATED"
- Resolution details recorded (action, penalty, notes)
- Admin ID recorded in resolution
- Timestamp of resolution recorded
- Appropriate actions taken (refund, penalty, etc.)
- Escrow status updated if needed

### Available Actions:

#### `refund`

- Refund user's tokens
- Penalize agent (optional)
- Mark escrow as REFUNDED

#### `partial_refund`

- Refund partial amount
- Penalize agent for difference
- Adjust escrow accordingly

#### `close`

- Close dispute without action
- No refund or penalty
- Mark as resolved

#### `escalate`

- Escalate to higher level
- Change escalation_level
- Status changes to ESCALATED
- Requires senior admin review

#### `penalize_agent`

- Penalize agent only
- No user refund
- Deduct from agent deposit
- Warning issued to agent

### ❌ Error Cases:

**Unauthorized (Not Admin):**

```json
{
  "success": false,
  "message": "Admin access required"
}
```

**Dispute Already Resolved:**

```json
{
  "success": false,
  "message": "Dispute already resolved"
}
```

**Invalid Action:**

```json
{
  "action": "invalid_action"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Invalid action. Must be: refund, partial_refund, close, escalate, or penalize_agent"
}
```

**Missing Required Fields:**

```json
{
  "action": "refund"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Notes are required when resolving disputes"
}
```

---

## Testing Sequence Summary

Run tests in this order:

### Setup Phase:

1. ✅ **Register user** - POST /auth/register
2. ✅ **Register admin** - POST /auth/register (with admin role)
3. ✅ **Login as user** - POST /auth/login (save user token)
4. ✅ **Login as admin** - POST /auth/login (save admin token)
5. ✅ **Create escrow** - POST /escrows/lock
6. ✅ **Finalize escrow** - POST /escrows/:id/finalize (as agent)

### Basic Dispute Flow:

7. ✅ **POST /disputes** - User opens dispute
   - Save `dispute_id`
8. ✅ **GET /disputes/:id** - View dispute details
9. ✅ **GET /disputes** - Admin lists all disputes
10. ✅ **POST /disputes/:id/resolve** - Admin resolves with refund
11. ✅ **GET /disputes/:id** - Verify resolution details

### Different Resolution Actions:

12. ✅ Create another escrow and dispute
13. ✅ **POST /disputes/:id/resolve** - Resolve with close (no action)
14. ✅ Create another escrow and dispute
15. ✅ **POST /disputes/:id/resolve** - Resolve with partial refund
16. ✅ Create another escrow and dispute
17. ✅ **POST /disputes/:id/resolve** - Escalate to Level 2

### Error Testing:

18. ✅ Try opening dispute without escrow
19. ✅ Try opening duplicate dispute
20. ✅ Try resolving as non-admin user
21. ✅ Try resolving already resolved dispute
22. ✅ Try viewing another user's dispute

---

## Complete Dispute Flow Example

### Scenario: User Opens Dispute for Non-Payment

#### 1. Initial State

**Escrow Status:**

- Status: FINALIZED
- Amount: 5000 NT
- Agent: agent-abc-123
- User: b20f56f7-9471-45c6-b56a-51d6e5117217

**Problem:**

- Agent finalized escrow (burned tokens)
- User claims fiat payment not received
- 2 hours have passed since finalization

#### 2. User Opens Dispute

```bash
POST /disputes
{
  "escrowId": "escrow-123-456-789",
  "transactionId": "tx-1234-5678-90ab-cdef",
  "agentId": "agent-abc-123",
  "reason": "Payment not received",
  "details": "Agent marked escrow as finalized but I have not received the ₦5,000 fiat payment to my bank account. Transaction was finalized 2 hours ago at 3:30 PM. My bank: First Bank 1234567890. I've tried contacting agent on WhatsApp but no response."
}
```

**Result:**

- Dispute ID: dispute-xyz-789
- Status: OPEN
- Escalation Level: LEVEL_1
- System notifies agent and admin

#### 3. Admin Investigates

Admin reviews:

- User's bank account details
- Agent's evidence in escrow finalization
- Transaction timestamp
- Agent's response time history
- Previous disputes against agent

**Admin Checks:**

```bash
GET /disputes/dispute-xyz-789
GET /escrows/escrow-123-456-789
GET /agents/agent-abc-123/profile
```

#### 4. Admin Contacts Both Parties

- Request proof of payment from agent
- Verify bank details with user
- Check for payment delays

#### 5. Agent Responds

Agent provides:

- Bank transfer screenshot showing payment
- Transaction reference: FBN-2025-12345
- States payment was sent on time

#### 6. User Confirms

User checks bank again and finds:

- Payment actually received
- Was delayed by bank processing
- Now visible in account

#### 7. Admin Resolves - Close Without Action

```bash
POST /disputes/dispute-xyz-789/resolve
{
  "action": "close",
  "notes": "User confirmed payment was received after bank processing delay. No fault found with agent. Dispute closed with no penalty."
}
```

**Result:**

- Dispute Status: RESOLVED
- No refund issued
- No agent penalty
- Escrow remains FINALIZED
- Case closed successfully

#### 8. Alternative Scenario - Agent Failed to Pay

If agent actually didn't send payment:

```bash
POST /disputes/dispute-xyz-789/resolve
{
  "action": "refund",
  "penalty_amount_usd": 150,
  "notes": "Agent failed to provide proof of payment. User confirmed no payment received. Refunding 5000 NT to user. Agent penalized $150 for breach of service."
}
```

**Result:**

- Dispute Status: RESOLVED
- User refunded: 5000 NT
- Agent penalized: $150 from deposit
- Agent rating reduced
- Escrow status: REFUNDED
- Agent may be suspended if repeated violations

---

## Dispute Escalation Levels

### LEVEL_1 (Standard)

- **Handler**: Support agent or junior admin
- **Timeline**: 24-48 hours
- **Authority**: Can close or partial refund up to $500
- **Escalate if**: Cannot determine fault, high amount involved

### LEVEL_2 (Senior)

- **Handler**: Senior admin
- **Timeline**: 48-72 hours
- **Authority**: Full refunds, agent suspension, penalties up to $5,000
- **Escalate if**: Suspected fraud, legal concerns, repeated violations

### LEVEL_3 (Executive)

- **Handler**: Platform management
- **Timeline**: Up to 7 days
- **Authority**: Account termination, legal action, any amount
- **Use cases**: Major fraud, criminal activity, systemic issues

---

## Dispute Resolution Actions Reference

### 1. REFUND

**When to use:**

- Agent didn't send fiat
- Agent sent to wrong account
- Agent unresponsive
- Clear agent fault

**Actions taken:**

- Return tokens to user
- Penalize agent (deduct from deposit)
- Update agent rating
- Flag for review if repeated

**Example:**

```json
{
  "action": "refund",
  "penalty_amount_usd": 100,
  "notes": "Agent failed to send payment within 24 hours. User refunded."
}
```

### 2. PARTIAL_REFUND

**When to use:**

- Wrong amount sent
- Partial payment received
- Fees dispute
- Both parties partly at fault

**Actions taken:**

- Return difference to user
- Partial penalty to agent
- Update records
- Issue warning

**Example:**

```json
{
  "action": "partial_refund",
  "penalty_amount_usd": 50,
  "notes": "Agent sent ₦4,500 instead of ₦5,000. User refunded 500 NT difference."
}
```

### 3. CLOSE

**When to use:**

- Misunderstanding resolved
- Payment delay (not agent's fault)
- User error
- No action needed

**Actions taken:**

- Mark dispute resolved
- No financial impact
- Close case
- Update status

**Example:**

```json
{
  "action": "close",
  "notes": "Payment was delayed by bank, not agent. User confirmed receipt."
}
```

### 4. ESCALATE

**When to use:**

- Complex case
- High amount involved
- Conflicting evidence
- Requires senior review

**Actions taken:**

- Increase escalation level
- Assign to senior admin
- Extend investigation
- Request more evidence

**Example:**

```json
{
  "action": "escalate",
  "notes": "Agent claims payment sent but user denies. Requires forensic review of bank records."
}
```

### 5. PENALIZE_AGENT

**When to use:**

- Agent behavior issue
- Policy violation
- No user refund needed
- Warning or fine

**Actions taken:**

- Deduct from agent deposit
- Update agent record
- Issue warning
- May suspend if serious

**Example:**

```json
{
  "action": "penalize_agent",
  "penalty_amount_usd": 25,
  "notes": "Agent took 6 hours to respond (exceeds 5-minute commitment). Warning issued."
}
```

---

## Dispute Status Reference

### OPEN

- **Description**: Newly opened, under review
- **Actions allowed**: Add evidence, comment
- **Next step**: Investigation
- **Timeline**: 24-48 hours

### RESOLVED

- **Description**: Issue fixed, case closed
- **Actions allowed**: View only
- **Outcome**: Refund, penalty, or close
- **Reversible**: No (create new dispute if needed)

### ESCALATED

- **Description**: Requires higher authority
- **Actions allowed**: Senior admin actions
- **Next step**: Level 2 or 3 review
- **Timeline**: Extended (48-72 hours)

### CLOSED

- **Description**: No action taken, case closed
- **Actions allowed**: View only
- **Reason**: Resolved externally or no merit
- **Reversible**: No

---

## Testing Checklist

### Basic Operations:

- [ ] Open dispute successfully
- [ ] View dispute details
- [ ] List all disputes (admin)
- [ ] Filter disputes by status
- [ ] Filter disputes by agent
- [ ] Resolve dispute with refund
- [ ] Resolve dispute with close
- [ ] Resolve dispute with partial refund
- [ ] Escalate dispute

### Error Handling:

- [ ] Open dispute without escrow
- [ ] Open duplicate dispute
- [ ] Open dispute on pending escrow
- [ ] Missing required fields
- [ ] Resolve without admin privileges
- [ ] Resolve already resolved dispute
- [ ] View another user's dispute
- [ ] Invalid resolution action

### Edge Cases:

- [ ] Multiple disputes from same user
- [ ] Multiple disputes against same agent
- [ ] Dispute after escrow expiry
- [ ] Escalate from Level 1 to 2 to 3
- [ ] Resolve with zero penalty
- [ ] Resolve with very high penalty

### Security:

- [ ] Non-admin can't list all disputes
- [ ] Non-admin can't resolve disputes
- [ ] User can only view own disputes
- [ ] Admin can view all disputes
- [ ] Resolution requires admin token

---

## Common Issues & Solutions

### Issue 1: "Escrow not found"

**Cause:** Invalid escrow ID

**Solution:**

```bash
# Get correct escrow ID from lock response
POST /escrows/lock
# Save the escrow ID from response
# Then use it in dispute
POST /disputes
{
  "escrowId": "{correct-escrow-id}"
}
```

### Issue 2: "Cannot open dispute for pending escrow"

**Cause:** Escrow not finalized yet

**Solution:**

```bash
# Wait for escrow to be finalized first
GET /escrows/:id
# Status should be FINALIZED or REFUNDED before opening dispute
```

### Issue 3: "Admin access required"

**Cause:** Using user token for admin operations

**Solution:**

```bash
# Use admin token for these endpoints:
# - GET /disputes (list all)
# - POST /disputes/:id/resolve

# Get admin token
POST /auth/login
{
  "email": "admin@example.com",
  "password": "admin_password"
}
```

### Issue 4: "Dispute already resolved"

**Cause:** Trying to resolve twice

**Solution:**

```bash
# Check dispute status first
GET /disputes/:id
# If already RESOLVED, create new dispute if issue persists
```

### Issue 5: "Dispute already exists for this escrow"

**Cause:** Opening duplicate dispute

**Solution:**

```bash
# Check existing disputes first
GET /disputes?escrow_id={escrow_id}
# Or continue with existing dispute
GET /disputes/{existing_dispute_id}
```

---

## Dispute Metrics & Analytics

Track these metrics for platform health:

### Volume Metrics:

- Total disputes opened
- Disputes per 100 transactions
- Average time to resolution
- Escalation rate

### Resolution Metrics:

- Refund rate
- Closure rate (no action)
- Escalation rate
- Average penalty amount

### Agent Metrics:

- Disputes per agent
- Agent fault percentage
- Average penalty per agent
- Repeat offenders

### User Metrics:

- Disputes per user
- Frivolous dispute rate
- User satisfaction after resolution

---

## Best Practices

### For Users:

1. **Provide Complete Information**

   - Include all relevant details
   - Attach evidence if possible
   - Be specific about the issue
   - Include timestamps

2. **Wait Reasonable Time**

   - Don't dispute immediately
   - Allow for payment delays
   - Try contacting agent first
   - Check your bank account

3. **Be Honest**

   - Don't make false claims
   - Update if situation changes
   - Confirm when payment received
   - Cooperate with investigation

4. **Keep Evidence**
   - Bank statements
   - Screenshots
   - Chat messages with agent
   - Transaction references

### For Agents:

1. **Respond Quickly**

   - Reply within commitment time
   - Provide evidence promptly
   - Be professional
   - Explain situation clearly

2. **Keep Records**

   - Save payment receipts
   - Screenshot confirmations
   - Keep transaction logs
   - Document communications

3. **Communicate Clearly**

   - Update users on status
   - Explain any delays
   - Provide tracking info
   - Be transparent

4. **Learn from Disputes**
   - Review what went wrong
   - Improve processes
   - Avoid repeat issues
   - Maintain high standards

### For Admins:

1. **Investigate Thoroughly**

   - Review all evidence
   - Contact both parties
   - Check bank records
   - Look for patterns

2. **Be Fair and Impartial**

   - Don't favor users or agents
   - Base on facts only
   - Apply rules consistently
   - Document reasoning

3. **Resolve Promptly**

   - Within timeline commitments
   - Communicate progress
   - Explain decisions clearly
   - Follow up if needed

4. **Track Patterns**
   - Identify problem agents
   - Notice repeat users
   - Spot systemic issues
   - Improve policies

---

## Dispute Prevention Tips

### For Platform:

1. **Clear Communication**

   - Set expectations clearly
   - Show timelines prominently
   - Provide status updates
   - Send notifications

2. **Better Verification**

   - Verify bank accounts
   - Confirm payment methods
   - Validate agent credentials
   - Check user identity

3. **Escrow Protection**

   - Reasonable timeouts
   - Evidence requirements
   - Automated checks
   - Smart contracts

4. **Agent Quality**
   - Thorough vetting
   - Performance monitoring
   - Rating system
   - Remove bad actors

---

## Integration Examples

### Frontend Integration:

```javascript
// Open a dispute
async function openDispute(escrowId, reason, details) {
  const response = await fetch("/api/v1/disputes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      escrowId,
      reason,
      details,
    }),
  });

  return response.json();
}

// Check dispute status
async function checkDisputeStatus(disputeId) {
  const response = await fetch(`/api/v1/disputes/${disputeId}`, {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  return response.json();
}

// Admin: List open disputes
async function getOpenDisputes() {
  const response = await fetch("/api/v1/disputes?status=OPEN", {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });

  return response.json();
}

// Admin: Resolve dispute
async function resolveDispute(disputeId, action, penalty, notes) {
  const response = await fetch(`/api/v1/disputes/${disputeId}/resolve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
      penalty_amount_usd: penalty,
      notes,
    }),
  });

  return response.json();
}
```

### Webhook Events (If Implemented):

#### Event: `dispute.opened`

```json
{
  "event": "dispute.opened",
  "dispute_id": "dispute-xyz-789",
  "escrow_id": "escrow-123",
  "user_id": "user-456",
  "agent_id": "agent-789",
  "reason": "Payment not received",
  "escalation_level": "LEVEL_1",
  "opened_at": "2025-10-24T17:30:00Z"
}
```

#### Event: `dispute.resolved`

```json
{
  "event": "dispute.resolved",
  "dispute_id": "dispute-xyz-789",
  "resolution": {
    "action": "refund",
    "penalty_usd": 100,
    "resolved_by": "admin-123",
    "resolved_at": "2025-10-24T18:30:00Z"
  }
}
```

#### Event: `dispute.escalated`

```json
{
  "event": "dispute.escalated",
  "dispute_id": "dispute-xyz-789",
  "from_level": "LEVEL_1",
  "to_level": "LEVEL_2",
  "reason": "Requires senior review",
  "escalated_at": "2025-10-24T19:00:00Z"
}
```

---

## Admin Dashboard Views

### Disputes Overview:

```
┌─────────────────────────────────────┐
│ Dispute Statistics                  │
├─────────────────────────────────────┤
│ Open: 15                            │
│ Resolved Today: 8                   │
│ Escalated: 3                        │
│ Avg Resolution Time: 18.5 hours     │
│ Refund Rate: 35%                    │
└─────────────────────────────────────┘
```

### Urgent Disputes:

```
┌──────────────────────────────────────────────┐
│ Dispute ID       │ Opened    │ Age   │ Level │
├──────────────────────────────────────────────┤
│ dispute-xyz-789  │ 2h ago    │ ⚠️    │ L1    │
│ dispute-abc-456  │ 5h ago    │ ⚠️    │ L1    │
│ dispute-def-123  │ 1d ago    │ 🔴    │ L2    │
└──────────────────────────────────────────────┘
```

---

## Additional Resources

- **Dispute Model**: `/src/models/Dispute.js`
- **Dispute Service**: `/src/services/disputeService.js`
- **Dispute Controller**: `/src/controllers/disputeController.js`
- **Constants**: `/src/config/constants.js` (DISPUTE_STATUS, DISPUTE_ESCALATION_LEVELS)

---

## Summary

The Dispute system provides:

✅ **Protection** - Users protected from agent fraud  
✅ **Fairness** - Impartial resolution process  
✅ **Transparency** - All actions documented  
✅ **Accountability** - Agents penalized for violations  
✅ **Efficiency** - Quick resolution timelines

This completes the comprehensive testing guide for Agent, Escrow, and Dispute routes!
