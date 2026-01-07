# Admin Financial Management - Complete Testing Guide

## 🎯 Overview

Admin now has **complete financial oversight** with:

- **Transaction monitoring** - View all platform transactions
- **Wallet management** - Monitor balances, freeze suspicious wallets
- **Payment analytics** - Track merchant payment volumes
- **Refund control** - Manually refund failed transactions
- **Fraud detection** - Flag suspicious activity

---

## 💳 TRANSACTION MANAGEMENT

### Test 1: Get Transaction Statistics

**GET** `/api/v1/admin/financial/transactions/stats`

**Headers:**

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "total_transactions": 1250,
    "by_status": {
      "completed": 1100,
      "pending": 50,
      "failed": 75,
      "refunded": 25
    },
    "by_type": {
      "TRANSFER": {
        "count": 600,
        "total_amount": "350000.00"
      },
      "MINT": {
        "count": 300,
        "total_amount": "150000.00"
      },
      "BURN": {
        "count": 200,
        "total_amount": "100000.00"
      },
      "COLLECTION": {
        "count": 150,
        "total_amount": "75000.00"
      }
    },
    "recent_24h": 45,
    "total_fees_collected": "3500.50"
  }
}
```

**Use Case:** Dashboard overview of platform financial health

---

### Test 2: List All Transactions

**GET** `/api/v1/admin/financial/transactions`

**Query Parameters:**

- `type` - Filter by: TRANSFER, MINT, BURN, COLLECTION, SWAP
- `status` - Filter by: completed, pending, failed, refunded
- `user_id` - Show transactions for specific user
- `merchant_id` - Show merchant payments
- `agent_id` - Show agent transactions
- `token_type` - Filter by: NT, CT, USDT
- `start_date` - From date (ISO format)
- `end_date` - To date (ISO format)
- `limit`, `offset` - Pagination

**Examples:**

```bash
# All completed transactions
GET /api/v1/admin/financial/transactions?status=completed

# Failed transactions (investigation needed)
GET /api/v1/admin/financial/transactions?status=failed

# Large transactions (>10000)
GET /api/v1/admin/financial/transactions?min_amount=10000

# User's transaction history
GET /api/v1/admin/financial/transactions?user_id=USER_UUID

# Date range
GET /api/v1/admin/financial/transactions?start_date=2025-11-01&end_date=2025-11-10
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "tx-uuid",
      "reference": "TXN-20251111-ABCD",
      "type": "TRANSFER",
      "status": "completed",
      "amount": "5000.00",
      "fee": "25.00",
      "token_type": "NT",
      "description": "Transfer to john@test.com",
      "created_at": "2025-11-11T10:00:00.000Z",
      "fromUser": {
        "id": "user-uuid-1",
        "full_name": "Alice Smith",
        "email": "alice@test.com"
      },
      "toUser": {
        "id": "user-uuid-2",
        "full_name": "John Doe",
        "email": "john@test.com"
      },
      "merchant": null,
      "agent": null
    }
  ],
  "pagination": {
    "total": 1250,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

### Test 3: Get Transaction Details

**GET** `/api/v1/admin/financial/transactions/:id`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "tx-uuid",
    "reference": "TXN-20251111-ABCD",
    "type": "COLLECTION",
    "status": "completed",
    "amount": "10000.00",
    "fee": "200.00",
    "token_type": "NT",
    "description": "Payment to AfriShop",
    "metadata": {
      "payment_method": "wallet",
      "device": "mobile"
    },
    "created_at": "2025-11-11T10:00:00.000Z",
    "fromUser": {
      "id": "user-uuid",
      "full_name": "John Doe",
      "email": "john@test.com",
      "phone_number": "+2348012345678"
    },
    "toUser": {
      "id": "merchant-user-uuid",
      "full_name": "AfriShop Owner",
      "email": "shop@afri.com"
    },
    "fromWallet": {
      "id": "wallet-uuid-1",
      "token_type": "NT",
      "balance": "15000.00"
    },
    "toWallet": {
      "id": "wallet-uuid-2",
      "token_type": "NT",
      "balance": "50000.00"
    },
    "merchant": {
      "id": "merchant-uuid",
      "business_name": "AfriShop",
      "display_name": "AfriShop NG"
    }
  }
}
```

---

### Test 4: Refund Transaction

**POST** `/api/v1/admin/financial/transactions/:id/refund`

**Use Case:** Failed payment, double charge, or dispute resolution

**Body:**

```json
{
  "reason": "Transaction failed to complete. Customer funds returned."
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Transaction refunded successfully",
  "data": {
    "transaction_id": "tx-uuid",
    "reference": "TXN-20251111-ABCD",
    "status": "refunded",
    "refund_reason": "Transaction failed to complete..."
  }
}
```

**Note:** This automatically reverses wallet balances!

---

### Test 5: Flag Suspicious Transaction

**POST** `/api/v1/admin/financial/transactions/:id/flag`

**Use Case:** Fraud detection, unusual patterns, suspicious amounts

**Body:**

```json
{
  "reason": "Multiple large transactions from new account in short time period",
  "severity": "high"
}
```

**Severity Levels:** `low`, `medium`, `high`, `critical`

**Expected Response:**

```json
{
  "success": true,
  "message": "Transaction flagged successfully",
  "data": {
    "transaction_id": "tx-uuid",
    "flagged": true,
    "reason": "Multiple large transactions...",
    "severity": "high"
  }
}
```

---

## 💰 WALLET MANAGEMENT

### Test 6: Get Wallet Statistics

**GET** `/api/v1/admin/financial/wallets/stats`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "total_wallets": 450,
    "active": 440,
    "frozen": 10,
    "balances_by_token": {
      "NT": {
        "total_balance": "5500000.00",
        "wallet_count": 150
      },
      "CT": {
        "total_balance": "3200000.00",
        "wallet_count": 150
      },
      "USDT": {
        "total_balance": "250000.00",
        "wallet_count": 150
      }
    },
    "top_wallets": [
      {
        "id": "wallet-uuid",
        "user_id": "user-uuid",
        "token_type": "NT",
        "balance": "250000.00",
        "transaction_count": 150,
        "user": {
          "id": "user-uuid",
          "full_name": "Top Holder",
          "email": "holder@test.com"
        }
      }
    ]
  }
}
```

**Use Case:** Platform TVL (Total Value Locked) monitoring

---

### Test 7: List All Wallets

**GET** `/api/v1/admin/financial/wallets`

**Query Parameters:**

- `token_type` - Filter by: NT, CT, USDT
- `is_frozen` - Show frozen wallets: true/false
- `user_id` - Wallets for specific user
- `min_balance` - Minimum balance filter
- `max_balance` - Maximum balance filter
- `limit`, `offset` - Pagination

**Examples:**

```bash
# Frozen wallets
GET /api/v1/admin/financial/wallets?is_frozen=true

# Large NT holders
GET /api/v1/admin/financial/wallets?token_type=NT&min_balance=100000

# Small balance wallets (dormant accounts)
GET /api/v1/admin/financial/wallets?max_balance=10
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "wallet-uuid",
      "user_id": "user-uuid",
      "token_type": "NT",
      "blockchain_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      "balance": "50000.00",
      "pending_balance": "0.00",
      "total_received": "100000.00",
      "total_sent": "50000.00",
      "transaction_count": 45,
      "is_frozen": false,
      "frozen_reason": null,
      "created_at": "2025-10-15T10:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@test.com"
      }
    }
  ],
  "pagination": {
    "total": 450,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

### Test 8: Get Wallet Details

**GET** `/api/v1/admin/financial/wallets/:id`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "wallet-uuid",
      "user_id": "user-uuid",
      "token_type": "NT",
      "balance": "50000.00",
      "pending_balance": "500.00",
      "available_balance": 49500,
      "total_received": "100000.00",
      "total_sent": "50000.00",
      "transaction_count": 45,
      "is_frozen": false,
      "user": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@test.com",
        "phone_number": "+2348012345678",
        "is_suspended": false
      }
    },
    "recent_transactions": [
      {
        "id": "tx-uuid",
        "type": "TRANSFER",
        "amount": "5000.00",
        "status": "completed",
        "created_at": "2025-11-11T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 💵 PAYMENT MANAGEMENT

### Test 9: Get Payment Statistics

**GET** `/api/v1/admin/financial/payments/stats`

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "total_payments": 450,
    "completed": 420,
    "pending": 25,
    "total_volume": "2500000.00",
    "top_merchants": [
      {
        "merchant_id": "merchant-uuid",
        "merchant_name": "AfriShop",
        "payment_count": 150,
        "total_volume": "500000.00"
      },
      {
        "merchant_id": "merchant-uuid-2",
        "merchant_name": "TechStore",
        "payment_count": 120,
        "total_volume": "350000.00"
      }
    ]
  }
}
```

---

### Test 10: List Merchant Payments

**GET** `/api/v1/admin/financial/payments`

**Query Parameters:**

- `merchant_id` - Filter by specific merchant
- `status` - Filter by: completed, pending, failed
- `start_date`, `end_date` - Date range
- `limit`, `offset` - Pagination

**Examples:**

```bash
# All merchant payments
GET /api/v1/admin/financial/payments

# Specific merchant's payments
GET /api/v1/admin/financial/payments?merchant_id=MERCHANT_UUID

# Failed payments
GET /api/v1/admin/financial/payments?status=failed

# Today's payments
GET /api/v1/admin/financial/payments?start_date=2025-11-11T00:00:00Z
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "tx-uuid",
      "reference": "TXN-20251111-ABCD",
      "type": "COLLECTION",
      "status": "completed",
      "amount": "10000.00",
      "fee": "200.00",
      "token_type": "NT",
      "created_at": "2025-11-11T10:00:00.000Z",
      "fromUser": {
        "id": "user-uuid",
        "full_name": "John Doe",
        "email": "john@test.com"
      },
      "merchant": {
        "id": "merchant-uuid",
        "business_name": "AfriShop",
        "display_name": "AfriShop NG"
      }
    }
  ],
  "pagination": {
    "total": 450,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

## 🛡️ Use Cases

### Fraud Investigation Workflow:

```bash
# 1. Check flagged transactions
GET /admin/financial/transactions?metadata[flagged]=true

# 2. Get transaction details
GET /admin/financial/transactions/:id

# 3. Check user's wallet activity
GET /admin/financial/wallets/:wallet_id

# 4. Freeze suspicious wallet
POST /admin/users/:user_id/freeze-wallet

# 5. Refund if needed
POST /admin/financial/transactions/:id/refund
```

### Financial Health Check:

```bash
# 1. Overall stats
GET /admin/financial/transactions/stats
GET /admin/financial/wallets/stats
GET /admin/financial/payments/stats

# 2. Check failed transactions
GET /admin/financial/transactions?status=failed

# 3. Monitor large transactions
GET /admin/financial/transactions?min_amount=50000

# 4. Review frozen wallets
GET /admin/financial/wallets?is_frozen=true
```

### 🚀 Key Features:

1. **Complete Transaction Visibility** - Monitor all platform transactions in real-time
2. **Fraud Detection** - Flag suspicious transactions with severity levels
3. **Financial Analytics** - Dashboard stats for business intelligence
4. **Manual Refunds** - Admin can refund failed/disputed transactions
5. **Wallet Monitoring** - Track TVL, top holders, frozen wallets
6. **Payment Oversight** - Monitor merchant payment volumes
7. **Advanced Filtering** - Search by user, merchant, agent, date, amount, type, status

### 🧪 Priority Use Cases:

```bash
# Daily Financial Health Check
GET /admin/financial/transactions/stats
GET /admin/financial/wallets/stats
GET /admin/financial/payments/stats

# Fraud Investigation
GET /admin/financial/transactions?status=failed
POST /admin/financial/transactions/:id/flag
POST /admin/users/:id/freeze-wallet

# Customer Support
GET /admin/financial/transactions?user_id=USER_UUID
POST /admin/financial/transactions/:id/refund

# Business Intelligence
GET /admin/financial/payments?start_date=2025-11-01&end_date=2025-11-30
GET /admin/financial/wallets?min_balance=100000
```

---

## 🔥 Complete Admin Panel Summary

| Module        | Endpoints | Status                  |
| ------------- | --------- | ----------------------- |
| Withdrawals   | 4         | ✅ Complete             |
| Merchants     | 4         | ✅ Complete             |
| Agents        | 7         | ✅ Complete             |
| Users         | 11        | ✅ Complete             |
| Operations    | 14        | ✅ Complete             |
| **Financial** | **13**    | ✅ **NEW**              |
| **TOTAL**     | **53**    | 🎉 **Enterprise Ready** |

### Financial Module Breakdown:

- **Transactions:** 5 endpoints (stats, list, details, refund, flag)
- **Wallets:** 3 endpoints (stats, list, details)
- **Payments:** 2 endpoints (stats, list)
- **Plus:** User wallet credit/debit (already in user management)

Your **AfriToken admin panel** is now a **complete financial control center**! 🚀💰
