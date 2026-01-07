# **COMPLETE REQUESTS & REVIEWS TESTING GUIDE**

**November 08, 2025** — **R2 Storage + Agent Reviews System**  
**Base URL:** `http://localhost:5001/api/v1`

---

## **📋 Prerequisites Checklist**

| Item            | Command/Value                                    | Status |
| --------------- | ------------------------------------------------ | ------ |
| Server running  | `pm2 start ecosystem.config.js`                  | ☐      |
| Database table  | `node src/scripts/create-agent-reviews-table.js` | ☐      |
| R2 bucket setup | `afritoken-uploads`                              | ☐      |
| Test user JWT   | Copy from login response                         | ☐      |
| Test agent JWT  | Copy from agent login                            | ☐      |
| Test images     | `proof.jpg`, `fiat-proof.jpg`                    | ☐      |

---

## **🔧 Setup Instructions**

### **1. Run Database Migration**

```bash
cd afriX_backend
node src/scripts/create-agent-reviews-table.js
```

**Expected Output:**

```
Creating agent_reviews table...
✅ Database connected
📝 Creating table...
✅ Table 'agent_reviews' created!
📝 Creating indexes...
✅ Index: idx_agent_reviews_agent
✅ Index: idx_agent_reviews_user
✅ Index: idx_agent_reviews_transaction
✅ Index: idx_agent_reviews_rating
✅ Index: idx_agent_reviews_created

🎉 Migration completed successfully!
```

### **2. Start Server**

```bash
pm2 start ecosystem.config.js
pm2 logs
```

### **3. Get Test JWTs**

**Login as User:**

```http
POST http://localhost:5001/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@test.com",
  "password": "password123"
}
```

**Login as Agent:**

```http
POST http://localhost:5001/api/v1/auth/login
Content-Type: application/json

{
  "email": "agent@test.com",
  "password": "password123"
}
```

**Save tokens:** `USER_JWT` and `AGENT_JWT`

---

## **🎯 PART 1: MINT FLOW (User Buys Tokens)**

### **Step 1.1: Find Available Agents**

```http
GET http://localhost:5001/api/v1/users/find-agents?country=NG&limit=5
Authorization: Bearer {{USER_JWT}}
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "3ff9c854-7c44-478b-adfe-99a573037eec",
      "country": "NG",
      "currency": "NGN",
      "tier": "STANDARD",
      "rating": 4.85,
      "available_capacity": 1000,
      "user": {
        "id": "agent-user-id",
        "full_name": "John Agent",
        "phone_number": "+2348012345678"
      }
    }
  ]
}
```

**✏️ Save:** `AGENT_ID = 3ff9c854-7c44-478b-adfe-99a573037eec`

---

### **Step 1.2: Create Mint Request**

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

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "mint-req-abc123",
    "user_id": "user-uuid",
    "agent_id": "3ff9c854-7c44-478b-adfe-99a573037eec",
    "amount": "500",
    "token_type": "NT",
    "status": "pending",
    "expires_at": "2025-11-08T02:15:00.000Z",
    "created_at": "2025-11-08T01:45:00.000Z"
  }
}
```

**✏️ Save:** `MINT_REQUEST_ID = mint-req-abc123`

---

### **Step 1.3: Upload Payment Proof**

```http
POST http://localhost:5001/api/v1/requests/mint/{{MINT_REQUEST_ID}}/proof
Authorization: Bearer {{USER_JWT}}
Content-Type: multipart/form-data

Form Data:
  proof: [Select proof.jpg file]
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "mint-req-abc123",
    "status": "proof_submitted",
    "payment_proof_url": "https://pub-xxxx.r2.dev/mint-proofs/123e4567.jpg"
  }
}
```

**📱 Agent Push Notification:**

```
New Mint Request
User uploaded payment proof for 500 NT
```

---

### **Step 1.4: Agent Confirms Mint**

```http
POST http://localhost:5001/api/v1/requests/mint/confirm
Authorization: Bearer {{AGENT_JWT}}
Content-Type: application/json

{
  "request_id": "{{MINT_REQUEST_ID}}",
  "bank_reference": "TRF123456789"
}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "tx-mint-uuid",
    "reference": "AFRI-MINT-20251108-ABC123",
    "type": "mint",
    "amount": "500.00000000",
    "currency": "NT",
    "status": "completed",
    "from_user_id": "agent-user-id",
    "to_user_id": "user-id",
    "agent_id": "3ff9c854-7c44-478b-adfe-99a573037eec",
    "created_at": "2025-11-08T01:50:00.000Z"
  }
}
```

**✏️ Save:** `MINT_TX_ID = tx-mint-uuid`

**📱 User Push Notification:**

```
Mint Confirmed!
Agent confirmed your payment. 500 NT minted.
```

---

### **Step 1.5: Verify User Balance**

```http
GET http://localhost:5001/api/v1/wallets
Authorization: Bearer {{USER_JWT}}
```

**Expected:** NT balance increased by 500

---

## **⭐ PART 2: SUBMIT REVIEW AFTER MINT**

### **Step 2.1: Submit 5-Star Review**

```http
POST http://localhost:5001/api/v1/agents/review
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "transaction_id": "{{MINT_TX_ID}}",
  "rating": 5,
  "review_text": "Super fast agent! Got my tokens in under 5 minutes. Highly recommended! 🚀"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "review-uuid-1",
    "user_id": "user-id",
    "agent_id": "3ff9c854-7c44-478b-adfe-99a573037eec",
    "transaction_id": "tx-mint-uuid",
    "rating": 5,
    "review_text": "Super fast agent! Got my tokens in under 5 minutes...",
    "transaction_type": "MINT",
    "is_flagged": false,
    "agent_response": null,
    "created_at": "2025-11-08T01:52:00.000Z"
  }
}
```

**✏️ Save:** `REVIEW_ID = review-uuid-1`

**📱 Agent Push Notification:**

```
New Review Received! ⭐
You received a 5-star review. Keep up the great work!
```

---

### **Step 2.2: Try Duplicate Review (Should Fail)**

```http
POST http://localhost:5001/api/v1/agents/review
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "transaction_id": "{{MINT_TX_ID}}",
  "rating": 4,
  "review_text": "Second review attempt"
}
```

**Expected Error:**

```json
{
  "success": false,
  "error": "You have already reviewed this transaction",
  "statusCode": 400
}
```

✅ **Test Passed:** Duplicate prevention working!

---

### **Step 2.3: Get Agent Reviews**

```http
GET http://localhost:5001/api/v1/agents/{{AGENT_ID}}/reviews?limit=10&offset=0
Authorization: Bearer {{USER_JWT}}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "agent_summary": {
      "agent_id": "3ff9c854-7c44-478b-adfe-99a573037eec",
      "average_rating": 4.87,
      "total_reviews": 23,
      "rating_distribution": {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 5,
        "5": 15
      }
    },
    "reviews": [
      {
        "id": "review-uuid-1",
        "rating": 5,
        "review_text": "Super fast agent!...",
        "transaction_type": "MINT",
        "is_flagged": false,
        "agent_response": null,
        "created_at": "2025-11-08T01:52:00.000Z",
        "user": {
          "id": "user-id",
          "full_name": "Alice Johnson"
        },
        "transaction": {
          "id": "tx-mint-uuid",
          "type": "mint",
          "amount": "500",
          "currency": "NT",
          "created_at": "2025-11-08T01:50:00.000Z"
        }
      }
    ],
    "pagination": {
      "total": 23,
      "limit": 10,
      "offset": 0,
      "has_more": true
    }
  }
}
```

---

### **Step 2.4: Agent Responds to Review**

```http
POST http://localhost:5001/api/v1/agents/review/{{REVIEW_ID}}/respond
Authorization: Bearer {{AGENT_JWT}}
Content-Type: application/json

{
  "response": "Thank you so much for the kind words! We're always here to serve you quickly. 🙏"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Response posted successfully",
  "data": {
    "id": "review-uuid-1",
    "rating": 5,
    "review_text": "Super fast agent!...",
    "agent_response": "Thank you so much for the kind words!...",
    "agent_response_at": "2025-11-08T02:00:00.000Z"
  }
}
```

---

## **🔥 PART 3: BURN FLOW (User Sells Tokens)**

### **Step 3.1: Create Burn Request**

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

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "burn-req-def456",
    "status": "escrowed",
    "escrow_id": "escrow-789",
    "expires_at": "2025-11-08T02:45:00.000Z"
  }
}
```

**✏️ Save:** `BURN_REQUEST_ID = burn-req-def456`

**📱 Agent Push Notification:**

```
New Burn Request
User wants to sell 500 NT
```

---

### **Step 3.2: Agent Uploads Fiat Proof**

```http
POST http://localhost:5001/api/v1/requests/burn/{{BURN_REQUEST_ID}}/fiat-proof
Authorization: Bearer {{AGENT_JWT}}
Content-Type: multipart/form-data

Form Data:
  proof: [Select fiat-proof.jpg file]
  bank_reference: TRF987654321
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "burn-req-def456",
    "status": "fiat_sent",
    "fiat_proof_url": "https://pub-xxxx.r2.dev/burn-proofs/987e6543.jpg",
    "agent_bank_reference": "TRF987654321"
  }
}
```

**📱 User Push Notification:**

```
Fiat Sent!
Agent sent fiat. Confirm receipt within 30 mins.
```

---

### **Step 3.3: User Confirms Burn**

```http
POST http://localhost:5001/api/v1/requests/burn/confirm
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "request_id": "{{BURN_REQUEST_ID}}"
}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "id": "tx-burn-uuid",
    "reference": "AFRI-BURN-20251108-DEF456",
    "type": "burn",
    "amount": "500.00000000",
    "status": "completed"
  }
}
```

**✏️ Save:** `BURN_TX_ID = tx-burn-uuid`

**📱 Agent Push Notification:**

```
Burn Confirmed!
User confirmed fiat receipt. Tokens burned.
```

---

## **⭐ PART 4: SUBMIT REVIEW AFTER BURN**

### **Step 4.1: Submit Review for Burn Transaction**

```http
POST http://localhost:5001/api/v1/agents/review
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "transaction_id": "{{BURN_TX_ID}}",
  "rating": 5,
  "review_text": "Instant cash payout! Very professional agent. Will definitely use again! 💯"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "id": "review-uuid-2",
    "rating": 5,
    "transaction_type": "BURN",
    "created_at": "2025-11-08T02:20:00.000Z"
  }
}
```

---

### **Step 4.2: Verify Agent Rating Updated**

```http
GET http://localhost:5001/api/v1/agents/{{AGENT_ID}}/reviews?limit=5
Authorization: Bearer {{USER_JWT}}
```

**Check:**

- `agent_summary.average_rating` should reflect the new 5-star review
- `agent_summary.total_reviews` should increase by 1

---

## **❌ PART 5: ERROR CASE TESTING**

### **Test 5.1: Review Non-Existent Transaction**

```http
POST http://localhost:5001/api/v1/agents/review
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "transaction_id": "00000000-0000-0000-0000-000000000000",
  "rating": 5
}
```

**Expected:** `404 Transaction not found`

---

### **Test 5.2: Invalid Rating (Out of Range)**

```http
POST http://localhost:5001/api/v1/agents/review
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "transaction_id": "{{MINT_TX_ID}}",
  "rating": 6
}
```

**Expected:** `400 Rating must be between 1 and 5`

---

### **Test 5.3: Review Pending Transaction**

Create a mint request but don't confirm it, then try to review:

```http
POST http://localhost:5001/api/v1/agents/review
Authorization: Bearer {{USER_JWT}}
Content-Type: application/json

{
  "transaction_id": "pending-tx-id",
  "rating": 5
}
```

**Expected:** `400 Only completed transactions can be reviewed`

---

### **Test 5.4: User Reviews Another User's Transaction**

```http
POST http://localhost:5001/api/v1/agents/review
Authorization: Bearer {{ANOTHER_USER_JWT}}
Content-Type: application/json

{
  "transaction_id": "{{MINT_TX_ID}}",
  "rating": 5
}
```

**Expected:** `403 You can only review transactions you participated in`

---

### **Test 5.5: Agent Responds to Wrong Review**

```http
POST http://localhost:5001/api/v1/agents/review/{{REVIEW_ID}}/respond
Authorization: Bearer {{ANOTHER_AGENT_JWT}}
Content-Type: application/json

{
  "response": "Thank you!"
}
```

**Expected:** `403 You can only respond to your own reviews`

---

## **✅ TESTING CHECKLIST**

| Test                           | Status |
| ------------------------------ | ------ |
| Database table created         | ☐      |
| Find agents                    | ☐      |
| Create mint request            | ☐      |
| Upload payment proof           | ☐      |
| Agent confirms mint            | ☐      |
| User balance updated           | ☐      |
| **Submit mint review**         | ☐      |
| **Check agent rating updated** | ☐      |
| **Duplicate review blocked**   | ☐      |
| **Agent responds to review**   | ☐      |
| Create burn request            | ☐      |
| Tokens escrowed                | ☐      |
| Agent uploads fiat proof       | ☐      |
| User confirms burn             | ☐      |
| **Submit burn review**         | ☐      |
| **View all agent reviews**     | ☐      |
| Invalid rating blocked         | ☐      |
| Review non-existent TX blocked | ☐      |
| Review pending TX blocked      | ☐      |
| Wrong user review blocked      | ☐      |
| Wrong agent response blocked   | ☐      |

---

## **🎯 Quick Test Commands**

```bash
# 1. Run migration
node src/scripts/create-agent-reviews-table.js

# 2. Start server
pm2 start ecosystem.config.js

# 3. Import Postman collection below
# 4. Run tests in order

# 5. Verify in database:
psql -d afritoken -c "SELECT agent_id, AVG(rating), COUNT(*) FROM agent_reviews GROUP BY agent_id;"
```

---

## **📦 POSTMAN COLLECTION**

Save this as `afritoken-reviews.json`:

```json
{
  "info": {
    "name": "AfriToken - Mint, Burn & Reviews",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "BASE_URL", "value": "http://localhost:5001/api/v1" },
    { "key": "USER_JWT", "value": "" },
    { "key": "AGENT_JWT", "value": "" },
    { "key": "AGENT_ID", "value": "" },
    { "key": "MINT_REQUEST_ID", "value": "" },
    { "key": "MINT_TX_ID", "value": "" },
    { "key": "BURN_REQUEST_ID", "value": "" },
    { "key": "BURN_TX_ID", "value": "" },
    { "key": "REVIEW_ID", "value": "" }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login User",
          "request": {
            "method": "POST",
            "url": "{{BASE_URL}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"user@test.com\",\"password\":\"password123\"}",
              "options": { "raw": { "language": "json" } }
            }
          }
        },
        {
          "name": "Login Agent",
          "request": {
            "method": "POST",
            "url": "{{BASE_URL}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"agent@test.com\",\"password\":\"password123\"}",
              "options": { "raw": { "language": "json" } }
            }
          }
        }
      ]
    },
    {
      "name": "1. MINT FLOW",
      "item": [
        {
          "name": "1.1 Find Agents",
          "request": {
            "method": "GET",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" }
            ],
            "url": "{{BASE_URL}}/users/find-agents?country=NG&limit=5"
          }
        },
        {
          "name": "1.2 Create Mint Request",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"agent_id\":\"{{AGENT_ID}}\",\"amount\":\"500\",\"token_type\":\"NT\"}",
              "options": { "raw": { "language": "json" } }
            },
            "url": "{{BASE_URL}}/requests/mint"
          }
        },
        {
          "name": "1.3 Upload Proof",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "proof", "type": "file", "src": "proof.jpg" }
              ]
            },
            "url": "{{BASE_URL}}/requests/mint/{{MINT_REQUEST_ID}}/proof"
          }
        },
        {
          "name": "1.4 Agent Confirm",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{AGENT_JWT}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"request_id\":\"{{MINT_REQUEST_ID}}\",\"bank_reference\":\"TRF123\"}",
              "options": { "raw": { "language": "json" } }
            },
            "url": "{{BASE_URL}}/requests/mint/confirm"
          }
        }
      ]
    },
    {
      "name": "2. REVIEW AGENT",
      "item": [
        {
          "name": "2.1 Submit Review",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"transaction_id\":\"{{MINT_TX_ID}}\",\"rating\":5,\"review_text\":\"Super fast agent! 🚀\"}",
              "options": { "raw": { "language": "json" } }
            },
            "url": "{{BASE_URL}}/agents/review"
          }
        },
        {
          "name": "2.2 Get Agent Reviews",
          "request": {
            "method": "GET",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" }
            ],
            "url": "{{BASE_URL}}/agents/{{AGENT_ID}}/reviews?limit=10"
          }
        },
        {
          "name": "2.3 Agent Respond",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{AGENT_JWT}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"response\":\"Thank you for the kind words! 🙏\"}",
              "options": { "raw": { "language": "json" } }
            },
            "url": "{{BASE_URL}}/agents/review/{{REVIEW_ID}}/respond"
          }
        },
        {
          "name": "2.4 Try Duplicate Review (Should Fail)",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"transaction_id\":\"{{MINT_TX_ID}}\",\"rating\":4}",
              "options": { "raw": { "language": "json" } }
            },
            "url": "{{BASE_URL}}/agents/review"
          }
        }
      ]
    },
    {
      "name": "3. BURN FLOW",
      "item": [
        {
          "name": "3.1 Create Burn Request",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"agent_id\":\"{{AGENT_ID}}\",\"amount\":\"500\",\"token_type\":\"NT\",\"bank_account\":{\"bank\":\"GTBank\",\"account\":\"1234567890\",\"name\":\"Alice\"}}",
              "options": { "raw": { "language": "json" } }
            },
            "url": "{{BASE_URL}}/requests/burn"
          }
        },
        {
          "name": "3.2 Agent Fiat Proof",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{AGENT_JWT}}" }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                { "key": "proof", "type": "file", "src": "fiat-proof.jpg" },
                { "key": "bank_reference", "value": "TRF987" }
              ]
            },
            "url": "{{BASE_URL}}/requests/burn/{{BURN_REQUEST_ID}}/fiat-proof"
          }
        },
        {
          "name": "3.3 User Confirm Burn",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"request_id\":\"{{BURN_REQUEST_ID}}\"}",
              "options": { "raw": { "language": "json" } }
            },
            "url": "{{BASE_URL}}/requests/burn/confirm"
          }
        }
      ]
    },
    {
      "name": "4. REVIEW BURN TX",
      "item": [
        {
          "name": "4.1 Submit Burn Review",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{USER_JWT}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"transaction_id\":\"{{BURN_TX_ID}}\",\"rating\":5,\"review_text\":\"Instant payout! 💯\"}",
              "options": { "raw": { "language": "json" } }
            },
            "url": "{{BASE_URL}}/agents/review"
          }
        }
      ]
    }
  ]
}
```

---

## **🚀 Ready to Test!**

1. ✅ Run migration script
2. ✅ Start server
3. ✅ Import Postman collection
4. ✅ Set USER_JWT and AGENT_JWT variables
5. ✅ Run requests in order
6. ✅ Verify all responses match expected outputs

**Questions?** Check server logs: `pm2 logs`

---

**Status:** ✅ Ready for Testing  
**Last Updated:** November 08, 2025
