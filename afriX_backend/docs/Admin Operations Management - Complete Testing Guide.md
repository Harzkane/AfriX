# Admin Operations Management - Complete Testing Guide

## 🎯 Overview

Admin now has **full control** over critical platform operations:

- **Disputes** - Monitor, escalate, resolve user-agent conflicts
- **Escrows** - Track locked tokens, force finalize, process expired
- **Requests** - Manage mint/burn requests, cancel when needed

---

## 📊 DISPUTE MANAGEMENT

### Test 1: Get Dispute Statistics

**GET** `/api/v1/admin/operations/disputes/stats`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "total_disputes": 45,
    "open": 12,
    "resolved": 33,
    "escalated": 5,
    "resolved_with_action": 30,
    "recent_7_days": 8
  }
}
```

---

### Test 2: List All Disputes

**GET** `/api/v1/admin/operations/disputes`

**Query Parameters:**

- `status` - Filter by: open, resolved
- `escalation_level` - Filter by: level_1, level_2, level_3
- `agent_id` - Filter by specific agent
- `user_id` - Filter by specific user
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset

**Examples:**

```bash
# All open disputes
GET /api/v1/admin/operations/disputes?status=open

# Escalated disputes
GET /api/v1/admin/operations/disputes?escalation_level=level_3

# Disputes for specific agent
GET /api/v1/admin/operations/disputes?agent_id=AGENT_UUID
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "dispute-uuid",
      "escrow_id": "escrow-uuid",
      "reason": "Agent failed to send fiat within timeout",
      "details": "User waited 2 hours but no payment received",
      "status": "open",
      "escalation_level": "level_1",
      "resolution": null,
      "created_at": "2025-11-10T10:00:00.000Z",
      "escrow": {
        "id": "escrow-uuid",
        "amount": "5000.00",
        "token_type": "NT",
        "status": "disputed"
      },
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@test.com"
      },
      "agent": {
        "id": "agent-uuid",
        "tier": "standard",
        "rating": 4.5
      }
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Test 3: Get Single Dispute Details

**GET** `/api/v1/admin/operations/disputes/:id`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "dispute-uuid",
    "escrow_id": "escrow-uuid",
    "transaction_id": "tx-uuid",
    "opened_by_user_id": "user-uuid",
    "agent_id": "agent-uuid",
    "reason": "auto_expired",
    "details": "Escrow expired without agent confirmation",
    "status": "open",
    "escalation_level": "level_1",
    "resolution": null,
    "created_at": "2025-11-10T10:00:00.000Z",
    "escrow": {
      "id": "escrow-uuid",
      "amount": "5000.00",
      "token_type": "NT",
      "status": "disputed",
      "expires_at": "2025-11-10T09:00:00.000Z",
      "transaction": {
        "id": "tx-uuid",
        "reference": "TXN-20251110-ABCD",
        "type": "BURN",
        "amount": "5000.00",
        "status": "pending"
      }
    },
    "user": {
      "id": "user-uuid",
      "full_name": "John Doe",
      "email": "john@test.com",
      "phone_number": "+2348012345678"
    },
    "agent": {
      "id": "agent-uuid",
      "tier": "standard",
      "rating": 4.2,
      "deposit_usd": 1000,
      "available_capacity": 500
    }
  }
}
```

---

### Test 4: Escalate Dispute

**POST** `/api/v1/admin/operations/disputes/:id/escalate`

**Body:**

```json
{
  "escalation_level": "admin",
  "notes": "Agent unresponsive for 24 hours. Escalating to senior review."
}
```

**Valid Escalation Levels (Update This List!):**

- `auto` — Auto-escalated after timeout
- `user_requested` — User manually escalated
- `admin` — Admin escalated
- `arbitration` — Final stage (legal/external)

**Expected Response:**

```json
{
  "success": true,
  "message": "Dispute escalated successfully",
  "data": {
    "id": "dispute-uuid",
    "status": "open",
    "escalation_level": "admin",
    "resolution": {
      "escalation_notes": "Agent unresponsive for 24 hours...",
      "escalated_by": "admin-uuid",
      "escalated_at": "2025-11-11T10:00:00.000Z"
    }
  }
}
```

---

### Test 5: Resolve Dispute (existing endpoint)

**POST** `/api/v1/disputes/:id/resolve`

**Body Options:**

**Option A: Refund User**

```json
{
  "action": "refund",
  "notes": "Agent failed to provide proof of payment. User refunded."
}
```

**Option B: Penalize Agent**

```json
{
  "action": "penalize_agent",
  "penalty_amount_usd": 100,
  "notes": "Agent repeatedly failed to respond. Penalty applied."
}
```

**Option C: Split Settlement**

```json
{
  "action": "split",
  "notes": "Both parties at fault. Manual resolution applied."
}
```

---

## 🔒 ESCROW MANAGEMENT

### Test 6: Get Escrow Statistics

**GET** `/api/v1/admin/operations/escrows/stats`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "total_escrows": 234,
    "locked": 45,
    "completed": 150,
    "disputed": 12,
    "refunded": 27,
    "expired_needs_action": 8,
    "total_value_locked": "125000.50"
  }
}
```

---

### Test 7: List All Escrows

**GET** `/api/v1/admin/operations/escrows`

**Query Parameters:**

- `status` - Filter by: locked, completed, disputed, refunded
- `expired` - Show only expired: true/false
- `agent_id` - Filter by specific agent
- `user_id` - Filter by specific user
- `limit`, `offset` - Pagination

**Examples:**

```bash
# Active locked escrows
GET /api/v1/admin/operations/escrows?status=locked

# Expired escrows needing attention
GET /api/v1/admin/operations/escrows?expired=true

# Disputed escrows
GET /api/v1/admin/operations/escrows?status=disputed
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "escrow-uuid",
      "transaction_id": "tx-uuid",
      "from_user_id": "user-uuid",
      "agent_id": "agent-uuid",
      "token_type": "NT",
      "amount": "5000.00",
      "status": "locked",
      "expires_at": "2025-11-11T12:00:00.000Z",
      "created_at": "2025-11-11T11:30:00.000Z",
      "transaction": {
        "id": "tx-uuid",
        "reference": "TXN-20251111-EFGH",
        "type": "BURN",
        "amount": "5000.00",
        "status": "pending"
      },
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@test.com"
      },
      "agent": {
        "id": "agent-uuid",
        "tier": "standard",
        "rating": 4.5
      }
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Test 8: Force Finalize Escrow

**POST** `/api/v1/admin/operations/escrows/:id/force-finalize`

**Use Case:** Agent confirmed fiat payment offline, but system stuck.

**Body:**

```json
{
  "notes": "Agent provided bank transfer confirmation #ABC123. Manually finalizing."
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Escrow finalized by admin",
  "data": {
    "tx": {
      "id": "tx-uuid",
      "status": "completed",
      "metadata": {
        "admin_override": true,
        "admin_id": "admin-uuid",
        "notes": "Agent provided bank transfer confirmation..."
      }
    },
    "escrow": {
      "id": "escrow-uuid",
      "status": "completed"
    }
  }
}
```

---

### Test 9: Process All Expired Escrows

**POST** `/api/v1/admin/operations/escrows/process-expired`

**Use Case:** Batch cleanup of expired escrows (cron job or manual trigger).

**Body:**

```json
{
  "limit": 50
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Processed 8 expired escrows",
  "data": [
    {
      "escrow": {
        "id": "escrow-uuid-1",
        "status": "disputed"
      },
      "action": "dispute_opened",
      "disputeId": "dispute-uuid-1"
    },
    {
      "escrow": {
        "id": "escrow-uuid-2",
        "status": "refunded"
      },
      "action": "refunded"
    }
  ]
}
```

---

## 📝 REQUEST MANAGEMENT

### Test 10: Get Request Statistics

**GET** `/api/v1/admin/operations/requests/stats`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "mint_requests": {
      "total": 450,
      "pending": 23,
      "confirmed": 400,
      "expired": 5
    },
    "burn_requests": {
      "total": 320,
      "pending": 15,
      "confirmed": 290,
      "expired": 3
    }
  }
}
```

---

### Test 11: List Mint Requests

**GET** `/api/v1/admin/operations/requests/mint`

**Query Parameters:**

- `status` - pending, proof_submitted, confirmed, cancelled
- `agent_id`, `user_id` - Filter by participant
- `expired` - Show expired: true/false
- `limit`, `offset` - Pagination

**Examples:**

```bash
# Pending mint requests
GET /api/v1/admin/operations/requests/mint?status=pending

# Expired mint requests
GET /api/v1/admin/operations/requests/mint?expired=true

# Mint requests for specific agent
GET /api/v1/admin/operations/requests/mint?agent_id=AGENT_UUID
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "request-uuid",
      "user_id": "user-uuid",
      "agent_id": "agent-uuid",
      "amount": "10000.00",
      "token_type": "NT",
      "status": "proof_submitted",
      "payment_proof_url": "https://cdn.example.com/proof.jpg",
      "user_bank_reference": null,
      "expires_at": "2025-11-11T12:00:00.000Z",
      "created_at": "2025-11-11T11:30:00.000Z",
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@test.com"
      },
      "agent": {
        "id": "agent-uuid",
        "tier": "standard",
        "rating": 4.8
      }
    }
  ],
  "pagination": {
    "total": 23,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Test 12: List Burn Requests

**GET** `/api/v1/admin/operations/requests/burn`

**Query Parameters:** Same as mint requests

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "request-uuid",
      "user_id": "user-uuid",
      "agent_id": "agent-uuid",
      "amount": "5000.00",
      "token_type": "NT",
      "status": "escrowed",
      "fiat_proof_url": null,
      "agent_bank_reference": null,
      "user_bank_account": {
        "bank_name": "GTBank",
        "account_number": "0123456789",
        "account_name": "John Doe"
      },
      "escrow_id": "escrow-uuid",
      "expires_at": "2025-11-11T12:00:00.000Z",
      "created_at": "2025-11-11T11:30:00.000Z",
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@test.com"
      },
      "agent": {
        "id": "agent-uuid",
        "tier": "premium",
        "rating": 4.9
      },
      "escrow": {
        "id": "escrow-uuid",
        "status": "locked",
        "amount": "5000.00"
      }
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Test 13: Cancel Mint Request

**POST** `/api/v1/admin/operations/requests/mint/:id/cancel`

**Use Case:** Fraudulent request detected or user requested cancellation.

**Body:**

```json
{
  "reason": "Suspected fraudulent activity. Payment proof is forged."
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Mint request cancelled successfully",
  "data": {
    "request_id": "request-uuid",
    "reason": "Suspected fraudulent activity..."
  }
}
```

---

### Test 14: Cancel Burn Request

**POST** `/api/v1/admin/operations/requests/burn/:id/cancel`

**Use Case:** Agent disappeared or user changed mind (before confirmation).

**Body:**

```json
{
  "reason": "Agent became unresponsive. Refunding user tokens from escrow."
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Burn request cancelled and escrow refunded",
  "data": {
    "request_id": "request-uuid",
    "reason": "Agent became unresponsive..."
  }
}
```

**Note:** This automatically refunds the escrow if it exists!

---

## 🔥 Complete Admin Routes Summary

### **Withdrawals** (4 routes)

- List pending, approve, mark paid, list all

### **Merchants** (4 routes)

- List, get details, approve KYC, reject KYC

### **Agents** (7 routes)

- Stats, list, get details, approve/reject KYC, suspend, activate

### **Users** (11 routes)

- Stats, list, get details, suspend/unsuspend, verify email, reset password
- Credit/debit wallet, freeze/unfreeze wallet

### **Operations** (14 routes) ⭐ NEW

**Disputes:**

- Stats, list, get details, escalate

**Escrows:**

- Stats, list, force finalize, process expired

**Requests:**

- Stats, list mint/burn, cancel mint/burn

---

**Total: 40 admin endpoints!** 🎉

---

## 🧪 Testing Workflow

```bash
# 1. Monitor platform health
GET /admin/operations/disputes/stats
GET /admin/operations/escrows/stats
GET /admin/operations/requests/stats

# 2. Check for issues
GET /admin/operations/escrows?expired=true
GET /admin/operations/disputes?status=open

# 3. Handle specific cases
POST /admin/operations/disputes/:id/escalate
POST /admin/operations/escrows/:id/force-finalize
POST /admin/operations/requests/burn/:id/cancel

# 4. Batch cleanup (daily cron)
POST /admin/operations/escrows/process-expired
```

---

## 🛡️ Admin Powers Summary

| Area          | Admin Can...                                       |
| ------------- | -------------------------------------------------- |
| **Disputes**  | View all, escalate, resolve with refund/penalty    |
| **Escrows**   | Monitor all, force finalize, process expired batch |
| **Requests**  | View all mint/burn, cancel with refund             |
| **Users**     | Manage accounts, wallets, verification             |
| **Agents**    | Approve KYC, suspend, manage capacity              |
| **Merchants** | Approve/reject KYC, manage status                  |

Your admin panel is now **enterprise-ready**! 🚀
