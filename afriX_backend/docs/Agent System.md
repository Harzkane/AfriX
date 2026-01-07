# AfriToken Agent System

This document describes the backend Agent System: data model, migrations, services, and API endpoints, including examples and business rules.

## Overview
Agents are independent facilitators who help users exchange tokens for fiat (mint/burn), provide onboarding, and support local markets. The system includes registration, profile management, transaction views, commission helpers, and referral codes.

## Data Model
Model: `src/models/Agent.js`
- `id` (UUID)
- `user_id` (UUID, unique)
- `business_name` (string)
- `tier` (enum: `starter`, `standard`, `premium`, `platinum`)
- `description` (text)
- `business_email` (string, email)
- `business_phone` (string)
- `country` (ISO 2-letter, string)
- `city` (string)
- `address` (text)
- `deposit_amount` (decimal)
- `commission_rate` (decimal percent)
- `max_transaction_limit` (decimal)
- `daily_transaction_limit` (decimal)
- `supported_payment_methods` (JSON)
- `total_transactions` (int)
- `transaction_volume` (decimal)
- `verification_status` (enum: `pending`, `approved`, `active`, `inactive`, `suspended`, `banned`)
- `verification_documents` (JSON)
- `is_online` (boolean)
- `referral_code` (string, unique)
- `referred_users_count` (int)
- `created_at`, `updated_at`

Associations:
- Belongs to `User` via `user_id`
- Has many `Transaction` via `agent_id`
- Many-to-many `Wallet` via junction table `agent_wallets`

## Migrations
Directory: `migrations/`
- `004-create-agents.js`: Creates `agents` table with indexes on `user_id`, `verification_status`, `country/city`, `tier`.
- `008-create-agent-wallets.js`: Junction table between `agents` and `wallets` with composite PK (`agent_id`, `wallet_id`).

Run your migration script (e.g., `npm run migrate`) to apply these tables.

## Constants
Source: `src/config/constants.js`
- `AGENT_STATUS`, `AGENT_TIERS`, `AGENT_CONFIG`, `PLATFORM_FEES`, `TRANSACTION_TYPES`
- Note: New code imports constants from `../config/constants`.

## Services
Location: `src/services/`

`agentService.js`
- `register(userId, payload)`: Validates, derives tier using `AGENT_CONFIG`, creates agent, generates `referral_code`.
- `getProfile(userId)`: Fetches agent by `user_id`.
- `updateProfile(userId, updates)`: Updates allowed fields only.
- `listTransactions(userId, query)`: Lists `mint`/`burn` transactions involving the user using `Op.or` and `Op.in`.

`commissionService.js`
- `calculateAgentCommission({ amount, commission_rate, tier })`: Percent × tier multiplier.
- `calculatePlatformFee(amount)`: Uses `PLATFORM_FEES.AGENT_FACILITATION`.

`referralService.js`
- `generateReferralCode(agentId)`: Creates a short uppercase code.
- `recordReferral(agentId, userId)`: Increments `referred_users_count` (placeholder logic).

## Controller & Routes
Controller: `src/controllers/agentController.js`
- Delegates to `agentService` for all operations.
- Returns `referral_code` on registration.

Routes: `src/routes/agents.js`
- Base: `/api/{API_VERSION}/agents`
- `POST /register` (auth required): register as agent.
- `GET /profile` (auth required): get agent profile.
- `PUT /profile` (auth required): update agent profile.
- `GET /transactions` (auth required): list related transactions; supports `status`, `page`, `limit`.

Mounted in `src/app.js`:
```js
app.use(`/api/${API_VERSION}/agents`, agentRoutes);
```

## Business Rules
- Tier derivation by `deposit_amount` using `AGENT_CONFIG` thresholds.
- Commission uses agent `commission_rate` and tier multiplier; platform fee applied separately.
- Registration requires: `business_name`, `business_email`, `business_phone`, `country`, `city`, `deposit_amount`.
- Updates limited to whitelisted fields.
- Transactions endpoint filters by `type` in [`mint`, `burn`] and the current user as sender or receiver.

## Request/Response Examples
Registration:
```
POST /api/v1/agents/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "business_name": "Local Exchange NG",
  "description": "Community agent in Lagos",
  "business_email": "agent@example.com",
  "business_phone": "+2348000000000",
  "country": "NG",
  "city": "Lagos",
  "address": "12 Ajose St",
  "deposit_amount": 1200,
  "commission_rate": 1.25,
  "supported_payment_methods": { "bank_transfer": ["GTBank", "Kuda"] }
}
```
Response `201`:
```
{
  "success": true,
  "message": "Agent registered successfully",
  "data": {
    "id": "...",
    "tier": "standard",
    "verification_status": "pending",
    "referral_code": "ABC123DEF"
  }
}
```

Profile:
```
GET /api/v1/agents/profile
Authorization: Bearer <token>
```

Update:
```
PUT /api/v1/agents/profile
Authorization: Bearer <token>
{
  "description": "Updated bio",
  "is_online": true
}
```

Transactions:
```
GET /api/v1/agents/transactions?status=completed&page=1&limit=20
Authorization: Bearer <token>
```

## Testing Notes
- Ensure auth middleware sets `req.user.id`.
- Apply migrations so `agents` and `agent_wallets` exist.
- Confirm constants path is `src/config/constants.js`.

## Postman Testing Guide

This section provides a step-by-step guide for testing the Agent System endpoints using Postman.

### Setting Up Postman

1. Download the AfriToken Postman Collection from the repository or import using this link: `https://api.afritoken.com/postman/agent-collection.json`
2. Set up environment variables:
   - `base_url`: Your API base URL (e.g., `http://localhost:5000/api/v1` for local testing)
   - `auth_token`: Your JWT authentication token

### Testing Agent Registration

**Request:**
- Method: `POST`
- URL: `{{base_url}}/agents/register`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{auth_token}}`
- Body:
```json
{
  "business_name": "Lagos Exchange Hub",
  "tier": "bronze",
  "description": "Reliable agent for currency exchange in Lagos",
  "phone": "+2348012345678",
  "country": "Nigeria",
  "state": "Lagos",
  "city": "Lagos",
  "address": "123 Victoria Island, Lagos",
  "latitude": 6.4281,
  "longitude": 3.4219,
  "operating_hours": "9:00 AM - 6:00 PM",
  "languages": ["English", "Yoruba"],
  "services": ["mint", "burn", "exchange"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Agent registered successfully",
  "data": {
    "id": "uuid-value",
    "business_name": "Lagos Exchange Hub",
    "tier": "bronze",
    "referral_code": "AGT123456",
    "verification_status": "pending"
  }
}
```

### Testing Agent Profile Retrieval

**Request:**
- Method: `GET`
- URL: `{{base_url}}/agents/profile`
- Headers:
  - `Authorization`: `Bearer {{auth_token}}`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-value",
    "business_name": "Lagos Exchange Hub",
    "tier": "bronze",
    "description": "Reliable agent for currency exchange in Lagos",
    "phone": "+2348012345678",
    "country": "Nigeria",
    "state": "Lagos",
    "city": "Lagos",
    "address": "123 Victoria Island, Lagos",
    "verification_status": "pending",
    "is_online": false,
    "commission_rate": 1.0,
    "referral_code": "AGT123456",
    "referred_users_count": 0
  }
}
```

### Testing Agent Profile Update

**Request:**
- Method: `PUT`
- URL: `{{base_url}}/agents/profile`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{auth_token}}`
- Body:
```json
{
  "description": "Updated: Premier exchange services in Lagos",
  "is_online": true,
  "operating_hours": "8:00 AM - 8:00 PM"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Agent profile updated successfully",
  "data": {
    "id": "uuid-value",
    "description": "Updated: Premier exchange services in Lagos",
    "is_online": true,
    "operating_hours": "8:00 AM - 8:00 PM"
  }
}
```

### Testing Agent Transactions

**Request:**
- Method: `GET`
- URL: `{{base_url}}/agents/transactions?status=completed&page=1&limit=20`
- Headers:
  - `Authorization`: `Bearer {{auth_token}}`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn-uuid",
        "type": "mint",
        "status": "completed",
        "amount": "1000.00",
        "currency": "NT",
        "description": "Token mint transaction",
        "created_at": "2023-06-22T12:34:56.789Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Postman Test Scripts

Add these test scripts to validate responses:

**For Registration (201 Created):**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has referral_code", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('referral_code');
});
```

**For Profile/Update (200 OK):**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success property", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
});
```

### Pre-request Script (Optional)

Add this to automatically include the Authorization header:
```javascript
// Adds Authorization header from environment
if (pm.environment.get('auth_token')) {
    pm.request.headers.add({
        key: 'Authorization', 
        value: `Bearer ${pm.environment.get('auth_token')}`
    });
}
```

## Future Enhancements
- Escrow integration for mint/burn flows.
- Education gating via `EDUCATION_CONFIG` modules.
- Detailed referral records table with analytics.
- Admin approval lifecycle for agents.