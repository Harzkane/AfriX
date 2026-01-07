# ADMIN WITHDRAWAL ENDPOINTS TESTING GUIDE (Postman) – **v1**

> **Base URL:** `http://localhost:5001/api/v1/admin/withdrawals`

---

## Prerequisites

| Item                      | Value                                           |
| ------------------------- | ----------------------------------------------- |
| **Admin JWT**             | `admin@afrix.com` → login → copy `access_token` |
| **Agent JWT**             | From agent registration                         |
| **Agent ID**              | `{{AGENT_ID}}`                                  |
| **Withdrawal Request ID** | `{{REQUEST_ID}}`                                |

---

## Authentication Header (Admin)

```http
Authorization: Bearer {{ADMIN_JWT}}
Content-Type: application/json
```

---

# ADMIN TEST FLOW

---

### TEST 1: Admin Login

#### POST `/api/v1/auth/login`

```json
{
  "email": "admin@afrix.com",
  "password": "Admin123"
}
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

**Save:**

- `ADMIN_JWT=eyJhbGciOiJIUzI1NiIs...`

---

### TEST 2: Admin – List Pending Withdrawals

#### GET `/api/v1/admin/withdrawals/pending`

**Headers:** `Authorization: Bearer {{ADMIN_JWT}}`

**Expected (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "7f674ee7-2023-465f-a2e0-936599102931",
      "agent_id": "3ff9c854-7c44-478b-adfe-99a573037eec",
      "amount_usd": "150.00",
      "status": "pending",
      "created_at": "2025-11-03T23:41:08.792Z",
      "agent": {
        "id": "3ff9c854-...",
        "deposit_address": "0x313a7fe52dfa5374979a1b8a70913466469fd19b",
        "user_id": "8f054d49-..."
      }
    }
  ]
}
```

**Save:**

- `REQUEST_ID=7f674ee7-2023-465f-a2e0-936599102931`

---

### TEST 3: Admin – Approve Withdrawal

#### POST `/api/v1/admin/withdrawals/approve`

```json
{
  "request_id": "{{REQUEST_ID}}"
}
```

**Expected (200):**

```json
{
  "success": true,
  "data": {
    "id": "7f674ee7-...",
    "status": "approved",
    "agent": { ... }
  }
}
```

> **Push sent to agent:** `"Withdrawal Approved: $150 approved for payout."`

---

### TEST 4: Admin – Mark as Paid (DEDUCTS MONEY)

#### POST `/api/v1/admin/withdrawals/paid`

```json
{
  "request_id": "{{REQUEST_ID}}",
  "tx_hash": "0xdef456abc1237890..."
}
```

**Expected (200):**

```json
{
  "success": true,
  "data": {
    "id": "7f674ee7-...",
    "status": "paid",
    "paid_tx_hash": "0xdef456abc1237890...",
    "paid_at": "2025-11-04T...",
    "agent": { ... }
  }
}
```

> **Agent's `deposit_usd` and `available_capacity` reduced by $150**

---

### TEST 5: Admin – Verify No Pending

#### GET `/api/v1/admin/withdrawals/pending`

**Expected (200):**

```json
{
  "success": true,
  "data": []
}
```

---

# ERROR CASES

| Test                   | Request                        | Expected                   |
| ---------------------- | ------------------------------ | -------------------------- |
| **Invalid request_id** | `{ "request_id": "fake-123" }` | `400 Invalid request`      |
| **Already approved**   | Approve again                  | `400 Invalid request`      |
| **Pay not approved**   | Mark paid before approve       | `400 Request not approved` |
| **Non-admin**          | Use agent JWT                  | `403 Admin access only`    |

---

# POSTMAN COLLECTION (Admin Flow)

```json
{
  "info": { "name": "AfriX Admin Withdrawal Flow v1" },
  "item": [
    {
      "name": "1. Admin Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:5001/api/v1/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"admin@afrix.com\",\"password\":\"Admin123\"}"
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "const res = pm.response.json();",
              "if (res.success) {",
              "  pm.collectionVariables.set('ADMIN_JWT', res.data.tokens.access_token);",
              "  console.log('Admin JWT saved');",
              "}"
            ]
          }
        }
      ]
    },
    {
      "name": "2. List Pending Withdrawals",
      "request": {
        "method": "GET",
        "url": "http://localhost:5001/api/v1/admin/withdrawals/pending",
        "header": [{ "key": "Authorization", "value": "Bearer {{ADMIN_JWT}}" }]
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "const res = pm.response.json();",
              "if (res.data && res.data.length > 0) {",
              "  pm.collectionVariables.set('REQUEST_ID', res.data[0].id);",
              "  console.log('REQUEST_ID saved:', res.data[0].id);",
              "}"
            ]
          }
        }
      ]
    },
    {
      "name": "3. Approve Withdrawal",
      "request": {
        "method": "POST",
        "url": "http://localhost:5001/api/v1/admin/withdrawals/approve",
        "header": [
          { "key": "Authorization", "value": "Bearer {{ADMIN_JWT}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"request_id\":\"{{REQUEST_ID}}\"}"
        }
      }
    },
    {
      "name": "4. Mark as Paid",
      "request": {
        "method": "POST",
        "url": "http://localhost:5001/api/v1/admin/withdrawals/paid",
        "header": [
          { "key": "Authorization", "value": "Bearer {{ADMIN_JWT}}" },
          { "key": "Content-Type", "value": "application/json" }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"request_id\":\"{{REQUEST_ID}}\",\"tx_hash\":\"0xdef456abc1237890...\"}"
        }
      }
    },
    {
      "name": "5. Verify No Pending",
      "request": {
        "method": "GET",
        "url": "http://localhost:5001/api/v1/admin/withdrawals/pending",
        "header": [{ "key": "Authorization", "value": "Bearer {{ADMIN_JWT}}" }]
      }
    }
  ],
  "variable": [
    { "key": "ADMIN_JWT", "value": "" },
    { "key": "REQUEST_ID", "value": "" }
  ]
}
```

---

# DATABASE VERIFICATION

```sql
-- Before payout
SELECT deposit_usd, available_capacity FROM agents WHERE id = '{{AGENT_ID}}';
-- → 300

-- After paid
-- → 150

-- Withdrawal request
SELECT status, paid_tx_hash, paid_at
FROM withdrawal_requests
WHERE id = '{{REQUEST_ID}}';
-- → status: paid, tx_hash: 0xdef..., paid_at: now
```

---

# TESTING CHECKLIST

| Test         | Status |
| ------------ | ------ |
| Admin login  | Done   |
| List pending | Done   |
| Approve      | Done   |
| Mark paid    | Done   |
| Deduction    | Done   |
| No pending   | Done   |
| Error cases  | Done   |

---

# FINAL FLOW

```mermaid
graph TD
    A[Agent Requests $150] --> B[Admin Sees Pending]
    B --> C[Admin Approves]
    C --> D[Admin Pays USDT]
    D --> E[Admin Marks Paid]
    E --> F[Agent Capacity -$150]
    F --> G[Push: "Paid!"]
```

---

**You now have:**

- **Full admin control**
- **Zero trust in agent**
- **Audit trail**
- **Secure payouts**
- **Production-ready Postman**
