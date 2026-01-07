# Admin User Management - Complete Testing Guide

## 🎯 Overview

This admin panel gives you complete control over:

- **User accounts** (suspend, verify, reset passwords)
- **Wallets** (credit, debit, freeze, unfreeze)
- **Statistics** (dashboard analytics)

---

## ✅ Prerequisites

1. **Admin account** with JWT token
2. **Test user** to manage
3. **Postman** or similar API client

---

## 📊 Test 1: Get User Statistics

**GET** `http://localhost:5001/api/v1/admin/users/stats`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "user_counts": {
      "total": 150,
      "by_role": {
        "regular": 120,
        "agents": 20,
        "merchants": 8,
        "admins": 2
      },
      "recent_registrations_30d": 45
    },
    "verification_stats": {
      "email_verified": 100,
      "phone_verified": 75,
      "identity_verified": 30
    },
    "account_status": {
      "active": 145,
      "suspended": 3,
      "locked": 2
    },
    "wallet_stats": {
      "total_wallets": 450,
      "active": 440,
      "frozen": 10
    }
  }
}
```

---

## 📋 Test 2: List All Users

**GET** `http://localhost:5001/api/v1/admin/users`

**Optional Query Parameters:**

- `role` - Filter by role (user, agent, merchant, admin)
- `email_verified` - true/false
- `is_active` - true/false
- `is_suspended` - true/false
- `search` - Search by name or email
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Examples:**

```bash
# All active users
GET /api/v1/admin/users?is_active=true

# Search by name
GET /api/v1/admin/users?search=john

# Agents only
GET /api/v1/admin/users?role=agent

# Suspended users
GET /api/v1/admin/users?is_suspended=true
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@test.com",
      "phone_number": "+2348012345678",
      "country_code": "NG",
      "role": "user",
      "email_verified": true,
      "phone_verified": false,
      "identity_verified": false,
      "verification_level": 1,
      "is_active": true,
      "is_suspended": false,
      "last_login_at": "2025-11-10T10:00:00.000Z",
      "created_at": "2025-10-15T08:00:00.000Z",
      "wallets": [
        {
          "id": "wallet-uuid",
          "token_type": "NT",
          "balance": "5000.00",
          "is_frozen": false
        }
      ]
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

## 👤 Test 3: Get Single User Details

**GET** `http://localhost:5001/api/v1/admin/users/:user_id`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@test.com",
    "phone_number": "+2348012345678",
    "country_code": "NG",
    "role": "user",
    "email_verified": true,
    "is_active": true,
    "is_suspended": false,
    "created_at": "2025-10-15T08:00:00.000Z",
    "wallets": [
      {
        "id": "wallet-uuid",
        "token_type": "NT",
        "balance": "5000.00",
        "pending_balance": "0.00",
        "total_received": "10000.00",
        "total_sent": "5000.00",
        "transaction_count": 25,
        "is_frozen": false,
        "frozen_reason": null
      }
    ],
    "agent": null,
    "merchant": null,
    "transaction_summary": {
      "total_transactions": 25,
      "total_sent": 5000,
      "total_received": 10000
    }
  }
}
```

---

## 🚫 Test 4: Suspend User

**POST** `http://localhost:5001/api/v1/admin/users/:user_id/suspend`

**Body:**

```json
{
  "reason": "Suspicious activity detected. Account under review.",
  "duration_days": 7
}
```

**Note:** `duration_days` is optional. Without it, suspension is indefinite.

**Expected Response:**

```json
{
  "success": true,
  "message": "User suspended successfully",
  "data": {
    "user_id": "uuid",
    "is_suspended": true,
    "suspension_reason": "Suspicious activity detected...",
    "suspended_until": "2025-11-17T10:00:00.000Z"
  }
}
```

---

## ✅ Test 5: Unsuspend User

**POST** `http://localhost:5001/api/v1/admin/users/:user_id/unsuspend`

**No body required**

**Expected Response:**

```json
{
  "success": true,
  "message": "User unsuspended successfully",
  "data": {
    "user_id": "uuid",
    "is_suspended": false
  }
}
```

---

## 📧 Test 6: Verify Email Manually

**POST** `http://localhost:5001/api/v1/admin/users/:user_id/verify-email`

**No body required**

**Expected Response:**

```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user_id": "uuid",
    "email_verified": true,
    "verification_level": 1
  }
}
```

---

## 🔑 Test 7: Reset User Password

**POST** `http://localhost:5001/api/v1/admin/users/:user_id/reset-password`

**Body:**

```json
{
  "new_password": "NewSecure@123"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user_id": "uuid",
    "email": "john@test.com"
  }
}
```

---

## 💰 Test 8: Credit User Wallet

**POST** `http://localhost:5001/api/v1/admin/users/:user_id/credit-wallet`

**Body:**

```json
{
  "amount": 1000,
  "token_type": "NT",
  "description": "Promotional bonus for early adopter"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Wallet credited successfully",
  "data": {
    "transaction": {
      "id": "tx-uuid",
      "reference": "TXN-20251110-ABCD",
      "type": "CREDIT",
      "amount": "1000.00",
      "token_type": "NT",
      "status": "completed",
      "description": "Promotional bonus for early adopter"
    },
    "new_balance": "6000.00"
  }
}
```

---

## 💸 Test 9: Debit User Wallet

**POST** `http://localhost:5001/api/v1/admin/users/:user_id/debit-wallet`

**Body:**

```json
{
  "amount": 500,
  "token_type": "NT",
  "description": "Adjustment for system error"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Wallet debited successfully",
  "data": {
    "transaction": {
      "id": "tx-uuid",
      "reference": "TXN-20251110-EFGH",
      "type": "DEBIT",
      "amount": "500.00",
      "token_type": "NT",
      "status": "completed"
    },
    "new_balance": "5500.00"
  }
}
```

---

## ❄️ Test 10: Freeze Wallet

**POST** `http://localhost:5001/api/v1/admin/users/:user_id/freeze-wallet`

**Body:**

```json
{
  "token_type": "NT",
  "reason": "Security investigation - unauthorized access suspected"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Wallet frozen successfully",
  "data": {
    "wallet_id": "wallet-uuid",
    "token_type": "NT",
    "is_frozen": true,
    "frozen_reason": "Security investigation..."
  }
}
```

**Effect:** User cannot send/receive tokens from frozen wallet.

---

## 🔓 Test 11: Unfreeze Wallet

**POST** `http://localhost:5001/api/v1/admin/users/:user_id/unfreeze-wallet`

**Body:**

```json
{
  "token_type": "NT"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Wallet unfrozen successfully",
  "data": {
    "wallet_id": "wallet-uuid",
    "token_type": "NT",
    "is_frozen": false
  }
}
```

---

## 🛡️ Security Notes

1. **Cannot suspend admins** - System prevents suspending admin accounts
2. **Audit trail** - All admin actions include `admin_id` in metadata
3. **Balance checks** - System prevents overdrawing wallets
4. **Frozen wallets** - Automatically block all transactions

---

## 🧪 Testing Workflow

```bash
# 1. Get statistics overview
GET /admin/users/stats

# 2. List all users
GET /admin/users

# 3. Get specific user details
GET /admin/users/:id

# 4. Credit wallet (test transaction)
POST /admin/users/:id/credit-wallet
{ "amount": 1000, "token_type": "NT" }

# 5. Freeze wallet (test security)
POST /admin/users/:id/freeze-wallet
{ "token_type": "NT", "reason": "Test freeze" }

# 6. Unfreeze wallet
POST /admin/users/:id/unfreeze-wallet
{ "token_type": "NT" }

# 7. Suspend user (test account control)
POST /admin/users/:id/suspend
{ "reason": "Test suspension", "duration_days": 1 }

# 8. Unsuspend user
POST /admin/users/:id/unsuspend
```

---

## ✅ Complete Admin Routes Summary

### **Withdrawals** (4 routes)

- List pending, approve, mark paid, list all

### **Merchants** (4 routes)

- List, get details, approve KYC, reject KYC

### **Agents** (7 routes)

- Stats, list, get details, approve/reject KYC, suspend, activate

### **Users** (11 routes) ⭐ NEW

- Stats, list, get details, suspend/unsuspend, verify email, reset password
- Credit/debit wallet, freeze/unfreeze wallet

**Total: 26 admin endpoints** 🎉
