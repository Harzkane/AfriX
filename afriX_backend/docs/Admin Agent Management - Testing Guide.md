# Admin Agent Management - Testing Guide

## Prerequisites

1. **Admin User**: Use the admin account you created earlier
2. **Test Agent**: Create a test agent user to manage
3. **Admin Token**: Login as admin and copy the JWT token

---

## Setup Steps

### 1. Create a Test Agent User

**POST** `http://localhost:5001/api/v1/auth/register`

```json
{
  "email": "agent@test.com",
  "password": "Agent@123456",
  "first_name": "Test",
  "last_name": "Agent",
  "phone": "+2348012345678"
}
```

### 2. Login as Agent and Register Agent Profile

**POST** `http://localhost:5001/api/v1/auth/login`

```json
{
  "email": "agent@test.com",
  "password": "Agent@123456"
}
```

Then register as agent:

**POST** `http://localhost:5001/api/v1/agents/register`

**Headers:** `Authorization: Bearer AGENT_TOKEN`

```json
{
  "country": "NG",
  "currency": "NGN",
  "withdrawal_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
}
```

### 3. Login as Admin

**POST** `http://localhost:5001/api/v1/auth/login`

```json
{
  "email": "admin@afritoken.com",
  "password": "Admin@123456"
}
```

**Copy the admin token** for all subsequent requests.

---

## Test Cases

### Test 1: Get Agent Statistics

**GET** `http://localhost:5001/api/v1/admin/agents/stats`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "agent_counts": {
      "total": 5,
      "active": 2,
      "pending": 2,
      "suspended": 1
    },
    "kyc_stats": {
      "verified": 2,
      "pending_review": 3
    },
    "financial_summary": {
      "total_deposits_usd": "5000.00",
      "total_tokens_minted": "3500.00",
      "total_tokens_burned": "1200.00",
      "outstanding_tokens": "2300.00"
    }
  }
}
```

---

### Test 2: List All Agents

**GET** `http://localhost:5001/api/v1/admin/agents`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "user_id": "uuid-here",
      "country": "NG",
      "tier": "starter",
      "status": "pending",
      "deposit_usd": 0,
      "available_capacity": 0,
      "total_minted": 0,
      "total_burned": 0,
      "rating": 5.0,
      "is_verified": false,
      "user": {
        "id": "uuid-here",
        "full_name": "Test Agent",
        "email": "agent@test.com"
      },
      "kyc": null,
      "financial_summary": {
        "outstanding_tokens": 0,
        "max_withdrawable": 0,
        "utilization_percentage": "0"
      }
    }
  ],
  "count": 1
}
```

---

### Test 3: Filter Agents by Status

**GET** `http://localhost:5001/api/v1/admin/agents?status=pending`

**GET** `http://localhost:5001/api/v1/admin/agents?status=active`

**GET** `http://localhost:5001/api/v1/admin/agents?verified=true`

---

### Test 4: Get Single Agent Details

**GET** `http://localhost:5001/api/v1/admin/agents/:agent_id`

Replace `:agent_id` with actual agent ID from list.

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "agent-uuid",
    "status": "active",
    "tier": "starter",
    "deposit_usd": 500,
    "available_capacity": 300,
    "total_minted": 200,
    "total_burned": 0,
    "rating": 4.8,
    "is_verified": true,
    "withdrawal_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    "user": {
      "full_name": "Test Agent",
      "email": "agent@test.com"
    },
    "kyc": {
      "status": "approved",
      "full_legal_name": "Test Agent",
      "reviewed_at": "2025-11-10T12:00:00.000Z"
    },
    "financial_summary": {
      "outstanding_tokens": 200,
      "max_withdrawable": 300,
      "utilization_percentage": "40.00",
      "total_revenue": 200
    }
  }
}
```

---

### Test 5: Approve Agent KYC

**Prerequisites:** Agent must have submitted KYC documents first.

**POST** `http://localhost:5001/api/v1/admin/agents/:agent_id/approve-kyc`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Agent KYC approved successfully",
  "data": {
    "agent_id": "uuid",
    "is_verified": true,
    "kyc_status": "approved"
  }
}
```

---

### Test 6: Reject Agent KYC

**POST** `http://localhost:5001/api/v1/admin/agents/:agent_id/reject-kyc`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json
```

**Body:**

```json
{
  "reason": "Uploaded documents are unclear. Please provide high-resolution images of your ID and proof of address."
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Agent KYC rejected successfully",
  "data": {
    "agent_id": "uuid",
    "is_verified": false,
    "kyc_status": "rejected",
    "rejection_reason": "Uploaded documents are unclear..."
  }
}
```

---

### Test 7: Suspend Agent

**POST** `http://localhost:5001/api/v1/admin/agents/:agent_id/suspend`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json
```

**Body:**

```json
{
  "reason": "Multiple user complaints about delayed transactions. Suspended pending investigation."
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Agent suspended successfully",
  "data": {
    "agent_id": "uuid",
    "previous_status": "active",
    "current_status": "suspended",
    "reason": "Multiple user complaints..."
  }
}
```

---

### Test 8: Activate Agent

**POST** `http://localhost:5001/api/v1/admin/agents/:agent_id/activate`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Agent activated successfully",
  "data": {
    "agent_id": "uuid",
    "previous_status": "suspended",
    "current_status": "active"
  }
}
```

**Error if insufficient deposit:**

```json
{
  "success": false,
  "error": "Agent must have at least $100 deposit to activate"
}
```

---

## Common Error Responses

### 1. Not Authorized (401)

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 2. Not Admin (403)

```json
{
  "success": false,
  "message": "Unauthorized - Admin access required"
}
```

### 3. Agent Not Found (404)

```json
{
  "success": false,
  "error": "Agent not found"
}
```

### 4. Missing KYC (400)

```json
{
  "success": false,
  "error": "Agent has not submitted KYC"
}
```

### 5. Already Approved (400)

```json
{
  "success": false,
  "error": "KYC already approved"
}
```

---

## Testing Workflow

1. ✅ Get agent statistics (dashboard overview)
2. ✅ List all agents
3. ✅ Filter by status (pending, active)
4. ✅ Get single agent details
5. ✅ Approve KYC (if agent submitted documents)
6. ✅ Reject KYC with reason
7. ✅ Suspend agent
8. ✅ Reactivate agent

---

## Notes

- All routes require admin authentication
- Agent must have deposit ≥ $100 to activate
- KYC approval sets `is_verified = true`
- Suspended agents cannot perform any transactions
- Financial summary includes real-time calculations
