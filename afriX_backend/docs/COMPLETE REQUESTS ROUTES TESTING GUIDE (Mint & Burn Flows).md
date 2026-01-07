# **COMPLETE REQUESTS ROUTES TESTING GUIDE (Mint & Burn Flows)**

**November 01, 2025** — **R2 Storage is LIVE**  
**All routes are ready** → `http://localhost:5001/api/v1/requests`

---

## **Prerequisites**

| Item                           | Status                          |
| ------------------------------ | ------------------------------- |
| Server running                 | `pm2 start ecosystem.config.js` |
| R2 bucket: `afritoken-uploads` | Done                            |
| R2 keys in `.env`              | Done                            |
| Test user JWT                  | `USER_JWT=eyJ...`               |
| Test agent JWT                 | `AGENT_JWT=eyJ...`              |
| Test image: `proof.jpg`        | 500×500 screenshot              |
| Postman/Insomnia               | Ready                           |

---

## **Authentication Header (ALL REQUESTS)**

```http
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data  (for file uploads)
```

---

## **MINT FLOW: User Buys 500 NT**

### **1. Find Available Agents**

```http
GET http://localhost:5001/api/v1/users/find-agents?country=NG&limit=1
```

**Expected:**

```json
{
  "success": true,
  "data": [
    {
      "id": "3ff9c854-7c44-478b-adfe-99a573037eec",
      "name": "Test Agent",
      "available_capacity": 1000,
      "currency": "NGN"
    }
  ]
}
```

**Save:** `AGENT_ID=3ff9c854-7c44-478b-adfe-99a573037eec`

---

### **2. Create Mint Request**

```http
POST http://localhost:5001/api/v1/requests/mint
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "agent_id": "{{AGENT_ID}}",
  "amount": "500",
  "token_type": "NT"
}
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "id": "mint-req-abc123",
    "status": "pending",
    "expires_at": "2025-11-01T02:15:00.000Z"
  }
}
```

**Save:** `MINT_ID=mint-req-abc123`

---

### **3. Upload Payment Proof**

```http
POST http://localhost:5001/api/v1/requests/mint/{{MINT_ID}}/proof
Authorization: Bearer {{USER_JWT}}
Content-Type: multipart/form-data

proof: [Select proof.jpg]
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "id": "mint-req-abc123",
    "status": "proof_submitted",
    "payment_proof_url": "https://pub-xxxx.r2.dev/mint-proofs/123e4567-e89b-12d3-a456-426614174000.jpg"
  }
}
```

**Agent receives push:** `"New Mint Request: User uploaded payment proof for 500 NT"`

---

### **4. Agent Confirms & Mints**

```http
POST http://localhost:5001/api/v1/requests/mint/confirm
Authorization: Bearer {{AGENT_JWT}}
Content-Type: application/json

{
  "request_id": "{{MINT_ID}}",
  "bank_reference": "TRF123456789"
}
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "id": "tx-123456",
    "type": "mint",
    "amount": "500.00000000",
    "currency": "NT",
    "status": "completed"
  }
}
```

---

### **5. Verify Results**

#### **User Balance**

```http
GET http://localhost:5001/api/v1/wallets
Authorization: Bearer {{USER_JWT}}
```

**Expected:** `NT balance: +500`

#### **Agent Capacity**

```sql
SELECT available_capacity FROM agents WHERE id = '{{AGENT_ID}}';
```

**Expected:** `500` (1000 - 500)

---

## **BURN FLOW: User Sells 500 NT**

### **1. Create Burn Request**

```http
POST http://localhost:5001/api/v1/requests/burn
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "agent_id": "{{AGENT_ID}}",
  "amount": "500",
  "token_type": "NT",
  "bank_account": {
    "bank": "GTBank",
    "account": "1234567890",
    "name": "Alice Johnson"
  }
}
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "id": "burn-req-def456",
    "status": "escrowed",
    "escrow_id": "escrow-789",
    "expires_at": "2025-11-01T02:45:00.000Z"
  }
}
```

**Save:** `BURN_ID=burn-req-def456`  
**Agent receives push:** `"New Burn Request: User wants to sell 500 NT"`

---

### **2. Agent Uploads Fiat Proof**

```http
POST http://localhost:5001/api/v1/requests/burn/{{BURN_ID}}/fiat-proof
Authorization: Bearer {{AGENT_JWT}}
Content-Type: multipart/form-data

proof: [Select fiat-proof.jpg]
bank_reference: TRF987654321
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "id": "burn-req-def456",
    "status": "fiat_sent",
    "fiat_proof_url": "https://pub-xxxx.r2.dev/burn-proofs/987e6543-d21c-98f7-g654-321098765432.jpg"
  }
}
```

**User receives push:** `"Fiat Sent! Confirm receipt within 30 mins."`

---

### **3. User Confirms Burn**

```http
POST http://localhost:5001/api/v1/requests/burn/confirm
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "request_id": "{{BURN_ID}}"
}
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "id": "tx-987654",
    "type": "burn",
    "amount": "500.00000000",
    "status": "completed"
  }
}
```

---

### **4. Verify Results**

- **User Balance:** `-500 NT`
- **Agent Capacity:** `+500` → back to `1000`
- **Escrow Status:** `completed`

---

## **AUTO-DISPUTE TEST (30-Min Expiry)**

1. Create burn request
2. Agent uploads proof
3. **Wait 31 minutes**
4. Run cron job:
   ```bash
   node jobs/expireRequests.js
   ```
5. Check DB:
   ```sql
   SELECT * FROM burn_requests WHERE id = 'burn-req-def456';
   -- status = "expired"
   SELECT * FROM disputes WHERE escrow_id = 'escrow-789';
   -- dispute opened
   ```

---

## **ERROR CASES**

| Test            | Request                             | Expected Error             |
| --------------- | ----------------------------------- | -------------------------- |
| Invalid ID      | `POST /mint/invalid-id/proof`       | `404 Request not found`    |
| Wrong user      | User A uploads for User B's request | `403 Unauthorized`         |
| No file         | `POST /mint/abc123/proof` (no file) | `400 Proof image required` |
| Expired request | Confirm after 30 mins               | `400 Request expired`      |

---

## **POSTMAN COLLECTION (Copy-Paste)**

```json
{
  "info": { "name": "AfriToken Requests Flow" },
  "item": [
    {
      "name": "MINT FLOW",
      "item": [
        {
          "name": "1. Find Agents",
          "request": {
            "method": "GET",
            "url": "http://localhost:5001/api/v1/users/find-agents?country=NG"
          }
        },
        {
          "name": "2. Create Mint Request",
          "request": {
            "method": "POST",
            "url": "http://localhost:5001/api/v1/requests/mint",
            "body": {
              "mode": "raw",
              "raw": "{\"agent_id\":\"{{AGENT_ID}}\",\"amount\":\"500\",\"token_type\":\"NT\"}"
            }
          }
        },
        {
          "name": "3. Upload Proof",
          "request": {
            "method": "POST",
            "url": "http://localhost:5001/api/v1/requests/mint/{{MINT_ID}}/proof",
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "proof", "type": "file", "src": "proof.jpg" }
              ]
            }
          }
        },
        {
          "name": "4. Agent Confirm",
          "request": {
            "method": "POST",
            "url": "http://localhost:5001/api/v1/requests/mint/confirm",
            "body": {
              "mode": "raw",
              "raw": "{\"request_id\":\"{{MINT_ID}}\",\"bank_reference\":\"TRF123\"}"
            }
          }
        }
      ]
    },
    {
      "name": "BURN FLOW",
      "item": [
        {
          "name": "1. Create Burn Request",
          "request": {
            "method": "POST",
            "url": "http://localhost:5001/api/v1/requests/burn",
            "body": {
              "mode": "raw",
              "raw": "{\"agent_id\":\"{{AGENT_ID}}\",\"amount\":\"500\",\"token_type\":\"NT\",\"bank_account\":{\"bank\":\"GTBank\",\"account\":\"1234567890\",\"name\":\"Alice\"}}"
            }
          }
        },
        {
          "name": "2. Agent Upload Fiat Proof",
          "request": {
            "method": "POST",
            "url": "http://localhost:5001/api/v1/requests/burn/{{BURN_ID}}/fiat-proof",
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "proof", "type": "file", "src": "fiat-proof.jpg" },
                { "key": "bank_reference", "value": "TRF987" }
              ]
            }
          }
        },
        {
          "name": "3. User Confirm Burn",
          "request": {
            "method": "POST",
            "url": "http://localhost:5001/api/v1/requests/burn/confirm",
            "body": { "mode": "raw", "raw": "{\"request_id\":\"{{BURN_ID}}\"}" }
          }
        }
      ]
    }
  ]
}
```

---

## **TESTING CHECKLIST**

| Test                      | Status |
| ------------------------- | ------ |
| Mint request created      | ☐      |
| Proof uploaded to R2      | ☐      |
| Agent push received       | ☐      |
| Tokens minted             | ☐      |
| Capacity decreased        | ☐      |
| Burn request escrowed     | ☐      |
| Fiat proof uploaded       | ☐      |
| User push received        | ☐      |
| Tokens burned             | ☐      |
| Capacity restored         | ☐      |
| Auto-dispute after 30 min | ☐      |
| All error cases           | ☐      |

---

## **RUN TESTS NOW**

1. **Open Postman**
2. **Import collection**
3. **Set variables:**
   - `USER_JWT`
   - `AGENT_JWT`
   - `AGENT_ID`
4. **Run in order**

---
