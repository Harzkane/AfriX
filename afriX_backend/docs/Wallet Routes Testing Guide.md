# Wallet Routes Testing Guide

## Prerequisites

- Server running on `http://localhost:5001`
- You have an admin user token
- User ID: `b20f56f7-9471-45c6-b56a-51d6e5117217`
- Wallet already credited with 1000 NT

## Authentication Header

All requests require authentication. Add this header to every request:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 1. List All User Wallets

**GET** `http://localhost:5001/api/v1/wallets`

### Expected Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "db65ddb5-2704-435d-8d12-edc365aa51f8",
      "user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
      "token_type": "NT",
      "blockchain_address": "0x8B791A4FF74B3F976157f6B70Eb2d81082f53Ec7",
      "balance": "1000.00000000",
      "pending_balance": "0.00000000",
      "available_balance": 1000,
      "is_active": true,
      "is_frozen": false,
      "total_received": "1000.00000000",
      "total_sent": "0.00000000",
      "transaction_count": 1
    }
  ]
}
```

### ✅ What to Check:

- Balance shows 1000 NT
- `available_balance` = 1000
- `transaction_count` = 1

---

## 2. Get Specific Wallet by ID

**GET** `http://localhost:5001/api/v1/wallets/db65ddb5-2704-435d-8d12-edc365aa51f8`

### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "db65ddb5-2704-435d-8d12-edc365aa51f8",
    "user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
    "token_type": "NT",
    "balance": "1000.00000000",
    "available_balance": 1000
  }
}
```

### ✅ What to Check:

- Returns single wallet object
- Balance is correct

### ❌ Error Case - Wrong Wallet ID:

**GET** `http://localhost:5001/api/v1/wallets/wrong-id-123`

```json
{
  "success": false,
  "message": "Wallet not found"
}
```

---

## 3. Debit Wallet (Admin Only)

**POST** `http://localhost:5001/api/v1/wallets/debit`

### Request Body:

```json
{
  "user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
  "amount": 100,
  "token_type": "NT",
  "description": "Test debit operation"
}
```

### Expected Response:

```json
{
  "success": true,
  "message": "Wallet debited successfully",
  "data": {
    "id": "...",
    "reference": "TRX-20251024-...",
    "type": "debit",
    "status": "completed",
    "amount": "100.00000000",
    "token_type": "NT",
    "from_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
    "description": "Test debit operation"
  }
}
```

### ✅ What to Check:

- Response status: 201
- Transaction type is "debit"
- Check wallet balance is now 900 NT (GET /wallets)

### ❌ Error Cases:

**Insufficient Balance:**

```json
{
  "user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
  "amount": 2000,
  "token_type": "NT",
  "description": "Too much"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Insufficient balance"
}
```

**Non-Admin User:**
If not admin, should get:

```json
{
  "success": false,
  "message": "Only admin can debit wallets"
}
```

---

## 4. Transfer Tokens (P2P)

First, create a second user for testing transfers.

### Step 1: Register Second User

**POST** `http://localhost:5001/api/v1/auth/register`

```json
{
  "email": "recipient@example.com",
  "password": "Test123456",
  "first_name": "Recipient",
  "last_name": "User",
  "country": "NG"
}
```

### Step 2: Transfer Tokens

**POST** `http://localhost:5001/api/v1/wallets/transfer`

### Request Body:

```json
{
  "to_email": "recipient@example.com",
  "amount": 50,
  "token_type": "NT",
  "description": "Test P2P transfer"
}
```

### Expected Response:

```json
{
  "success": true,
  "message": "Transfer completed successfully",
  "data": {
    "id": "...",
    "reference": "TRX-20251024-...",
    "type": "transfer",
    "status": "completed",
    "amount": "50.00000000",
    "fee": "0.25000000",
    "token_type": "NT",
    "from_user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
    "to_user_id": "...",
    "description": "Test P2P transfer"
  }
}
```

### ✅ What to Check:

- Fee is calculated (0.5% = 0.25 NT on 50 NT)
- Total deducted = 50.25 NT
- Sender balance decreases by 50.25
- Recipient receives 50 NT (no fee deducted from them)

### ❌ Error Cases:

**Transfer to Self:**

```json
{
  "to_email": "your_own_email@example.com",
  "amount": 50,
  "token_type": "NT"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Cannot send to self"
}
```

**Recipient Not Found:**

```json
{
  "to_email": "nonexistent@example.com",
  "amount": 50,
  "token_type": "NT"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Recipient not found"
}
```

**Insufficient Balance:**

```json
{
  "to_email": "recipient@example.com",
  "amount": 10000,
  "token_type": "NT"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Insufficient funds"
}
```

---

## 5. Credit Wallet Again (Admin Only)

**POST** `http://localhost:5001/api/v1/wallets/credit`

### Request Body:

```json
{
  "user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
  "amount": 500,
  "token_type": "NT",
  "description": "Bonus credit"
}
```

### Expected Response:

```json
{
  "success": true,
  "message": "Wallet credited successfully",
  "data": {
    "type": "credit",
    "status": "completed",
    "amount": "500.00000000"
  }
}
```

---

## Testing Sequence Summary

Run tests in this order:

1. ✅ **GET /wallets** - List wallets (should show 1000 NT)
2. ✅ **GET /wallets/:id** - Get specific wallet
3. ✅ **POST /wallets/debit** - Debit 100 NT (balance = 900)
4. ✅ **GET /wallets** - Verify balance is 900 NT
5. ✅ **POST /auth/register** - Create second user
6. ✅ **POST /wallets/transfer** - Transfer 50 NT (balance = ~849.75)
7. ✅ **GET /wallets** - Verify sender balance decreased
8. ✅ **POST /wallets/credit** - Credit 500 NT (balance = ~1349.75)
9. ✅ **GET /wallets** - Final balance check

---

## Expected Final State

After all operations:

- **Sender wallet**: ~1349.75 NT
  - Started: 1000
  - Debited: -100
  - Transferred: -50.25 (including fee)
  - Credited: +500
- **Recipient wallet**: 50 NT
- **Total transactions**: 4 (credit, debit, transfer, credit)

---

## Common Issues to Watch For

### 1. Missing Authorization Header

```json
{
  "success": false,
  "message": "Authorization header required"
}
```

### 2. Invalid Token

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 3. Non-Admin User

Only admin can use `/credit` and `/debit` endpoints

```json
{
  "success": false,
  "message": "Only admin can credit wallets"
}
```

### 4. Wallet Frozen

If wallet is frozen:

```json
{
  "success": false,
  "message": "Wallet is frozen"
}
```
