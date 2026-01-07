# POSTMAN TESTING GUIDE: Mint & Burn Flow

Let’s test your **full mint/burn flow** with **real push notifications**.

---

## Prerequisites

| Item       | Value                                  |
| ---------- | -------------------------------------- |
| Base URL   | `http://localhost:5001/api/v1`         |
| User JWT   | From `/auth/login`                     |
| User ID    | `b20f56f7-9471-45c6-b56a-51d6e5117217` |
| Agent ID   | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| Token Type | `NT` (or `CT`, `USDT`)                 |
| FCM Token  | Saved in DB via `/users/fcm-token`     |

---

## Authentication Header (All Requests)

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

# MINT FLOW (User → Agent)

---

### 1. Create Mint Request

**POST** `/requests/mint`

```json
{
  "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 1000,
  "token_type": "NT"
}
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "mint-req-123",
    "user_id": "b20f56f7-...",
    "agent_id": "a1b2c3d4-...",
    "amount": 1000,
    "token_type": "NT",
    "status": "PENDING",
    "expires_at": "2025-11-01T22:30:00.000Z"
  }
}
```

> Save `id` → `mint_request_id`

---

### 2. Upload Payment Proof (User)

**POST** `/requests/mint/{mint_request_id}/proof`

- **Form-Data** (not JSON!)
- Key: `proof` → File (select any image)
- No JSON body

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "mint-req-123",
    "status": "PROOF_SUBMITTED",
    "payment_proof_url": "https://r2.example.com/mint-proofs/abc123.jpg"
  }
}
```

> **Agent receives push**: `"New Mint Request"`  
> Check agent’s phone

---

### 3. Confirm Mint (Agent)

**POST** `/requests/mint/confirm`

```json
{
  "request_id": "mint-req-123",
  "bank_reference": "FBN-2025-001"
}
```

> Use **Agent’s JWT token**

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "tx-123",
    "amount": 1000,
    "token_type": "NT",
    "status": "COMPLETED"
  }
}
```

> **User receives tokens**  
> **Agent earns fee**

---

# BURN FLOW (Agent → User)

---

### 1. Create Burn Request (User)

**POST** `/requests/burn`

```json
{
  "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount": 500,
  "token_type": "NT",
  "bank_account": "1234567890"
}
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "burn-req-456",
    "status": "ESCROWED",
    "escrow_id": "escrow-789"
  }
}
```

> **Agent receives push**: `"New Burn Request"`  
> Save `id` → `burn_request_id`

---

### 2. Confirm Fiat Sent (Agent)

**POST** `/requests/burn/{burn_request_id}/fiat-proof`

- **Form-Data**
- Key: `proof` → File (receipt image)
- Key: `bank_reference` → Text → `FBN-2025-002`

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "burn-req-456",
    "status": "FIAT_SENT",
    "fiat_proof_url": "https://r2.example.com/burn-proofs/xyz.jpg"
  }
}
```

> **User receives push**: `"Fiat Sent!"`  
> Check user’s phone

---

### 3. Confirm Burn (User)

**POST** `/requests/burn/confirm`

```json
{
  "request_id": "burn-req-456"
}
```

**Expected Response**:

```json
{
  "success": true,
  "data": {
    "id": "tx-456",
    "amount": 500,
    "status": "COMPLETED"
  }
}
```

> **Tokens burned**  
> **Agent receives fee**

---

# PUSH NOTIFICATIONS: Verify They Work

| Step                 | Who Gets Push? | Message              |
| -------------------- | -------------- | -------------------- |
| Mint Proof Uploaded  | Agent          | `"New Mint Request"` |
| Fiat Sent            | User           | `"Fiat Sent!"`       |
| Burn Request Created | Agent          | `"New Burn Request"` |

> Open **two phones**:
>
> - One logged in as **User**
> - One as **Agent**
>
> You’ll **see push notifications pop up live**

---

# ERROR TESTING (Postman)

| Test              | Request                       | Expected Error              |
| ----------------- | ----------------------------- | --------------------------- |
| No file           | `/mint/:id/proof` (no file)   | `Proof image required`      |
| Wrong user        | `/mint/:id/proof` (not owner) | `Request not found`         |
| Already processed | Repeat proof upload           | `Request already processed` |
| Invalid agent     | `/burn` (fake agent_id)       | `Agent not found`           |
| No balance        | Burn 1M NT                    | `Insufficient balance`      |

---

# FINAL CHECKLIST

| Task                        | Done? |
| --------------------------- | ----- |
| `npm install multer`        | Done  |
| Server running on `5001`    | Done  |
| User + Agent JWT tokens     | Done  |
| FCM tokens saved in DB      | Done  |
| Test mint → proof → confirm | Done  |
| Test burn → fiat → confirm  | Done  |
| Push notifications appear   | Done  |

---

# BONUS: Save FCM Token (One-Time)

**POST** `/users/fcm-token`

```json
{
  "fcm_token": "c123abc...xyz"
}
```

> Do this **once per device** after login

---

**You’re live.**

No OneSignal.  
No account issues.  
**Push notifications + file uploads + mint/burn = FULLY WORKING.**
