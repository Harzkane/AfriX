# Agent Routes Testing Guide

## Prerequisites

- Server running on `http://localhost:5001`
- You have a registered user with JWT token
- User ID: `b20f56f7-9471-45c6-b56a-51d6e5117217`
- User has wallets with balances (NT, CT, USDT)

## Authentication Header

All requests require authentication. Add this header to every request:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## Validation Requirements Summary

### Required Fields for Agent Registration:
✅ `country` - Must be NG, BJ, BF, CI, GW, ML, NE, SN, or TG  
✅ `currency` - Must be NGN (for NG) or XOF (for XOF countries)  
✅ `phone_number` - International format with country code  
✅ `whatsapp_number` - International format with country code  
✅ `bank_name` - Full bank name  
✅ `account_number` - Format depends on country (10 digits for NG, IBAN for XOF)  
✅ `account_name` - Must match official account holder name  

### Optional Fields:
- `tier` - Defaults to STARTER if not provided
- `referral_code` - If registering via referral

### Validation Rules:
- **Country-Currency Match**:
  - NG → NGN only
  - BJ, BF, CI, GW, ML, NE, SN, TG → XOF only
- **Phone Number**: Must include country code (e.g., +234 for NG, +221 for SN)
- **Account Number Nigeria**: Exactly 10 digits
- **Account Number XOF**: Valid IBAN format (24-28 characters)
- **WhatsApp Number**: Must be valid WhatsApp-enabled number

---

## Important Currency Information

### Nigerian Naira (NGN)
- **Symbol**: ₦
- **Code**: NGN
- **Country**: Nigeria only
- **Bank transfers**: Instant to same-day
- **Common banks**: First Bank, GTBank, Access Bank, Zenith Bank, UBA, Kuda

### West African CFA Franc (XOF)
- **Symbol**: CFA or FCFA
- **Code**: XOF
- **Countries**: 8 WAEMU member states (Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo)
- **Central Bank**: BCEAO (Banque Centrale des États de l'Afrique de l'Ouest)
- **Fixed exchange rate**: 1 EUR = 655.957 XOF (fixed parity with Euro)
- **Bank transfers**: Same-day within XOF zone, cross-border between XOF countries is seamless
- **Common banks**: Ecobank, Bank of Africa, Banque Atlantique, BCEAO member banks
- **Language**: Primarily French

### Key Differences:
- **NGN**: Floating exchange rate, higher volatility
- **XOF**: Fixed to Euro, stable exchange rate
- **XOF advantage**: Single currency across 8 countries, no exchange needed between them
- **Bank accounts**: XOF uses IBAN format, NGN uses 10-digit numbers

---

## 1. Register as Agent

**POST** `http://localhost:5001/api/v1/agents/register`

### Request Body:

```json
{
  "country": "NG",
  "currency": "NGN",
  "tier": "STARTER",
  "phone_number": "+2348012345678",
  "whatsapp_number": "+2348012345678",
  "bank_name": "First Bank of Nigeria",
  "account_number": "1234567890",
  "account_name": "John Doe",
  "referral_code": "AGENT123"
}
```

**Example for XOF Countries (Senegal):**

```json
{
  "country": "SN",
  "currency": "XOF",
  "tier": "STARTER",
  "phone_number": "+221771234567",
  "whatsapp_number": "+221771234567",
  "bank_name": "Banque Atlantique Sénégal",
  "account_number": "SN12345678901234567890123",
  "account_name": "Amadou Diallo",
  "referral_code": "AGENT456"
}
```

### Expected Response:

```json
{
  "success": true,
  "message": "Agent registered successfully",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "tier": "STARTER",
    "verification_status": "PENDING",
    "referral_code": "JD-A1B2C3"
  }
}
```

### ✅ What to Check:

- Response status: 201
- `id` is generated (UUID format)
- `tier` matches requested tier (STARTER, STANDARD, PREMIUM)
- `verification_status` is "PENDING" (awaiting admin approval)
- `referral_code` is auto-generated (format: INITIALS-RANDOM)
- Save the `agent_id` for future use

### Available Tiers:

- `STARTER` - Entry level (default)
  - Max capacity: $1,000 USD
  - Fee: 2.5%
- `STANDARD` - Mid level
  - Max capacity: $10,000 USD
  - Fee: 2.0%
- `PREMIUM` - Professional
  - Max capacity: $50,000 USD
  - Fee: 1.5%

**Note:** Capacity limits are in USD equivalent, but agents operate in their local currency (NGN or XOF).

### ❌ Error Cases:

**User Already Registered as Agent:**

```json
{
  "success": false,
  "message": "User already has an agent profile"
}
```

**Invalid Country Code:**

```json
{
  "country": "GH"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Invalid country code. Must be NG, BJ, BF, CI, GW, ML, NE, SN, or TG"
}
```

**Invalid Tier:**

```json
{
  "tier": "INVALID_TIER"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Invalid tier. Must be STARTER, STANDARD, or PREMIUM"
}
```

**Missing Required Fields:**

```json
{
  "country": "NG"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "currency is required",
    "phone_number is required",
    "whatsapp_number is required",
    "bank_name is required",
    "account_number is required",
    "account_name is required"
  ]
}
```

---

## 2. Get Agent Profile

**GET** `http://localhost:5001/api/v1/agents/profile`

### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
    "country": "NG",
    "currency": "NGN",
    "tier": "STARTER",
    "status": "PENDING",
    "deposit_usd": 0,
    "available_capacity": 0,
    "total_minted": 0,
    "total_burned": 0,
    "rating": 5.0,
    "response_time_minutes": 5,
    "is_verified": false,
    "phone_number": "+2348012345678",
    "whatsapp_number": "+2348012345678",
    "bank_name": "First Bank of Nigeria",
    "account_number": "1234567890",
    "account_name": "John Doe",
    "referral_code": "JD-A1B2C3",
    "created_at": "2025-10-24T14:45:00.000Z",
    "updated_at": "2025-10-24T14:45:00.000Z"
  }
}
```

### ✅ What to Check:

- All agent details are returned
- Initial `status` is "PENDING"
- `deposit_usd` starts at 0
- `available_capacity` starts at 0 (until deposit is made)
- Default `rating` is 5.0
- Default `response_time_minutes` is 5
- `is_verified` is false until admin approves

### Agent Status Values:

- `PENDING` - Awaiting verification
- `ACTIVE` - Verified and can process transactions
- `SUSPENDED` - Temporarily suspended
- `INACTIVE` - Deactivated by agent or admin

### ❌ Error Case - No Agent Profile:

If user hasn't registered as agent:

```json
{
  "success": false,
  "message": "Agent profile not found"
}
```

---

## 3. Update Agent Profile

**PUT** `http://localhost:5001/api/v1/agents/profile`

### Request Body:

```json
{
  "phone_number": "+2348087654321",
  "whatsapp_number": "+2348087654321",
  "bank_name": "Access Bank",
  "account_number": "0987654321",
  "account_name": "John Doe",
  "tier": "STANDARD"
}
```

### Expected Response:

```json
{
  "success": true,
  "message": "Agent profile updated",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "tier": "STANDARD",
    "phone_number": "+2348087654321",
    "updated_at": "2025-10-24T15:30:00.000Z"
  }
}
```

### ✅ What to Check:

- Only specified fields are updated
- `updated_at` timestamp is current
- Tier upgrade requires admin approval
- Verify changes with GET /profile

### Updating Tier (Upgrade/Downgrade):

```json
{
  "tier": "PREMIUM"
}
```

**Requirements:**

- Agent must be ACTIVE to upgrade
- Capacity limits change based on new tier
- May require additional verification

### Fields That Can Be Updated:

- `phone_number`
- `whatsapp_number`
- `bank_name`
- `account_number`
- `account_name`
- `tier` (with approval)

### Fields That CANNOT Be Updated:

- `user_id`
- `country`
- `currency`
- `status` (admin only)
- `deposit_usd` (system managed)
- `available_capacity` (system managed)
- `is_verified` (admin only)

### ❌ Error Cases:

**Agent Not Verified:**

```json
{
  "tier": "PREMIUM"
}
```

If agent status is not ACTIVE:

```json
{
  "success": false,
  "message": "Agent must be verified to upgrade tier"
}
```

**Invalid Bank Details:**

```json
{
  "account_number": "123"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Account number must be 10 digits"
}
```

---

## 4. Get Agent Transactions

**GET** `http://localhost:5001/api/v1/agents/transactions`

### Query Parameters:

- `type` (optional): Filter by type (MINT, BURN, COLLECTION)
- `status` (optional): Filter by status (pending, completed, failed)
- `currency` (optional): Filter by currency (NT, CT, USDT)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `start_date` (optional): Filter from date (ISO format)
- `end_date` (optional): Filter to date (ISO format)

### Example Requests:

**Get All Transactions:**

```
GET http://localhost:5001/api/v1/agents/transactions
```

**Filter by Type:**

```
GET http://localhost:5001/api/v1/agents/transactions?type=BURN
```

**Filter by Status:**

```
GET http://localhost:5001/api/v1/agents/transactions?status=completed
```

**Filter by Date Range:**

```
GET http://localhost:5001/api/v1/agents/transactions?start_date=2025-10-01&end_date=2025-10-24
```

**Multiple Filters:**

```
GET http://localhost:5001/api/v1/agents/transactions?type=MINT&currency=NT&status=completed
```

**Pagination:**

```
GET http://localhost:5001/api/v1/agents/transactions?page=1&limit=10
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx-1234-5678-90ab-cdef",
        "sender_id": "user-id-1",
        "receiver_id": null,
        "agent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "amount": "5000.00000000",
        "currency": "NT",
        "transaction_type": "BURN",
        "status": "completed",
        "description": "Burn NT tokens for NGN fiat",
        "reference": "BURN-2025-001",
        "fee": "125.00000000",
        "escrow_id": "escrow-123",
        "metadata": {
          "bank_name": "First Bank",
          "account_number": "1234567890",
          "fiat_amount": 5000,
          "fiat_currency": "NGN"
        },
        "created_at": "2025-10-24T15:30:00.000Z",
        "updated_at": "2025-10-24T15:35:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "pages": 1
    },
    "summary": {
      "total_minted": "10000.00000000",
      "total_burned": "5000.00000000",
      "total_fees_earned": "275.00000000",
      "transaction_count": 1
    }
  }
}
```

### ✅ What to Check:

- Only agent-related transactions are returned
- Transactions are ordered by `created_at` DESC (newest first)
- Pagination info is accurate
- Summary includes totals for minted, burned, and fees
- Metadata contains relevant transaction details

### Transaction Types for Agents:

- `MINT` - Agent creates new tokens (user buys crypto with fiat)
- `BURN` - Agent destroys tokens (user sells crypto for fiat)
- `COLLECTION` - Agent collects payment from user

### ❌ Error Cases:

**Invalid Date Format:**

```
GET /agents/transactions?start_date=invalid-date
```

Expected Error:

```json
{
  "success": false,
  "message": "Invalid date format. Use ISO 8601 (YYYY-MM-DD)"
}
```

**Invalid Type Filter:**

```
GET /agents/transactions?type=INVALID
```

Expected Error:

```json
{
  "success": false,
  "message": "Invalid transaction type. Must be MINT, BURN, or COLLECTION"
}
```

---

## Testing Sequence Summary

Run tests in this order:

### Setup Phase:

1. ✅ **Register user** - POST /auth/register
2. ✅ **Login** - POST /auth/login (get JWT token)
3. ✅ **Verify wallets exist** - GET /wallets

### Agent Registration:

4. ✅ **POST /agents/register** - Register agent account
5. ✅ **GET /agents/profile** - Verify agent created
6. ✅ Save `agent_id` and `referral_code`

### Profile Management:

7. ✅ **PUT /agents/profile** - Update bank details
8. ✅ **PUT /agents/profile** - Request tier upgrade
9. ✅ **GET /agents/profile** - Verify updates

### Transaction Testing:

10. ✅ Create some test transactions (via escrow flow)
11. ✅ **GET /agents/transactions** - View all transactions
12. ✅ **GET /agents/transactions?type=BURN** - Filter by type
13. ✅ **GET /agents/transactions?status=completed** - Filter by status
14. ✅ **GET /agents/transactions?page=1&limit=5** - Test pagination

---

## Expected Final State

After all operations:

- **Agent Status**: PENDING (awaiting admin verification)
- **Tier**: STARTER (or upgraded if approved)
- **Verification**: Not verified (`is_verified: false`)
- **Capacity**: 0 (until deposit is made and verified)
- **Rating**: 5.0 (default)
- **Transactions**: Varies based on testing

---

## Agent Lifecycle Flow

### 1. Registration → Pending

```
User registers as agent
↓
Status: PENDING
↓
Admin reviews application
```

### 2. Verification → Active

```
Admin approves agent
↓
Status: ACTIVE
is_verified: true
↓
Agent can process transactions
```

### 3. Deposit → Capacity

```
Agent makes deposit (via admin)
↓
deposit_usd: 1000
available_capacity: 1000
↓
Agent can mint/burn up to capacity
```

### 4. Processing Transactions

```
User requests burn (5000 NT)
↓
Escrow created (locks tokens)
↓
Agent sends fiat to user
↓
Escrow finalized (burns tokens)
↓
Agent's available_capacity reduced
total_burned increased
```

---

## Agent Capacity Management

### How Capacity Works:

1. **Initial State**:
   - `deposit_usd: 0`
   - `available_capacity: 0`

2. **After Deposit** (e.g., $1,000):
   - `deposit_usd: 1000`
   - `available_capacity: 1000`

3. **After Minting** (e.g., 500 NT):
   - `available_capacity: 500` (reduced)
   - `total_minted: 500` (increased)

4. **After Burning** (e.g., 200 NT):
   - `available_capacity: 700` (restored)
   - `total_burned: 200` (increased)

### Capacity Formula:

```
available_capacity = deposit_usd - (total_minted - total_burned)
```

---

## Agent Fee Structure

Fees are based on agent tier:

### Fee Calculation:

```javascript
// STARTER tier (2.5% fee)
transaction_amount = 5000 NT
fee = 5000 * 0.025 = 125 NT
agent_receives = 125 NT

// STANDARD tier (2.0% fee)
transaction_amount = 5000 NT
fee = 5000 * 0.020 = 100 NT
agent_receives = 100 NT

// PREMIUM tier (1.5% fee)
transaction_amount = 5000 NT
fee = 5000 * 0.015 = 75 NT
agent_receives = 75 NT
```

---

## Agent Rating System

Agents are rated by users after transactions:

- **Initial Rating**: 5.0
- **Rating Range**: 1.0 - 5.0
- **Updates**: After each completed transaction
- **Impact**: Higher ratings = more visibility

### Rating Calculation:

```
new_rating = (current_rating * total_transactions + new_review) / (total_transactions + 1)
```

---

## Response Time

Agents are expected to respond within their `response_time_minutes`:

- **Default**: 5 minutes
- **Tracked**: System monitors actual response times
- **Impact**: Affects agent ranking and visibility

---

## Testing Checklist

- [ ] Register agent with all required fields
- [ ] Verify agent profile is created correctly
- [ ] Update agent bank details
- [ ] Request tier upgrade
- [ ] Verify tier upgrade requires approval
- [ ] Create test transactions (via escrow)
- [ ] List all agent transactions
- [ ] Filter transactions by type (MINT, BURN)
- [ ] Filter transactions by status
- [ ] Filter transactions by date range
- [ ] Test pagination (multiple pages)
- [ ] Verify transaction summary totals
- [ ] Test all error cases
- [ ] Verify capacity calculations
- [ ] Check fee calculations per tier

---

## Common Issues to Watch For

### 1. Missing Authorization Header

```json
{
  "success": false,
  "message": "Authorization header required"
}
```

**Solution:** Add `Authorization: Bearer {token}` header

### 2. Not Registered as Agent

```json
{
  "success": false,
  "message": "Agent profile not found"
}
```

**Solution:** Register as agent first

### 3. Duplicate Agent Registration

```json
{
  "success": false,
  "message": "User already has an agent profile"
}
```

**Solution:** Each user can only have one agent account

### 4. Tier Upgrade Without Verification

```json
{
  "success": false,
  "message": "Agent must be verified to upgrade tier"
}
```

**Solution:** Wait for admin verification

### 5. Invalid Transaction Type Filter

```json
{
  "success": false,
  "message": "Invalid transaction type"
}
```

**Solution:** Use MINT, BURN, or COLLECTION

---

## Country and Currency Mapping

### Nigeria 🇳🇬
- **Country Code**: `NG`
- **Currency**: `NGN` (Nigerian Naira)
- **Phone Code**: +234
- **Account Format**: 10 digits
- **Example Account**: 1234567890
- **Popular Banks**: First Bank, GTBank, Access Bank, Zenith Bank, UBA
- **Digital Banks**: Kuda, Opay, Palmpay

### Benin 🇧🇯
- **Country Code**: `BJ`
- **Currency**: `XOF` (West African CFA Franc)
- **Phone Code**: +229
- **Account Format**: IBAN (BJ + 26 characters)
- **Example Account**: BJ66 BJ01 2345 6789 0123 4567 8901 23
- **Popular Banks**: Ecobank Benin, Bank of Africa Benin, BCEAO

### Burkina Faso 🇧🇫
- **Country Code**: `BF`
- **Currency**: `XOF`
- **Phone Code**: +226
- **Account Format**: IBAN (BF + 26 characters)
- **Example Account**: BF42 BF01 2345 6789 0123 4567 8901 23
- **Popular Banks**: Ecobank Burkina Faso, Coris Bank, BCEAO

### Côte d'Ivoire 🇨🇮
- **Country Code**: `CI`
- **Currency**: `XOF`
- **Phone Code**: +225
- **Account Format**: IBAN (CI + 26 characters)
- **Example Account**: CI93 CI01 2345 6789 0123 4567 8901 23
- **Popular Banks**: Société Générale CI, Ecobank CI, Bank of Africa CI, BCEAO
- **Economic Hub**: Abidjan (largest XOF economy)

### Guinea-Bissau 🇬🇼
- **Country Code**: `GW`
- **Currency**: `XOF`
- **Phone Code**: +245
- **Account Format**: IBAN (GW + 23 characters)
- **Example Account**: GW04 GW01 2345 6789 0123 4567 890
- **Popular Banks**: Ecobank Guinea-Bissau, BCEAO
- **Note**: Only Portuguese-speaking XOF country

### Mali 🇲🇱
- **Country Code**: `ML`
- **Currency**: `XOF`
- **Phone Code**: +223
- **Account Format**: IBAN (ML + 26 characters)
- **Example Account**: ML13 ML01 2345 6789 0123 4567 8901 23
- **Popular Banks**: Bank of Africa Mali, Ecobank Mali, BCEAO

### Niger 🇳🇪
- **Country Code**: `NE`
- **Currency**: `XOF`
- **Phone Code**: +227
- **Account Format**: IBAN (NE + 26 characters)
- **Example Account**: NE58 NE01 2345 6789 0123 4567 8901 23
- **Popular Banks**: Bank of Africa Niger, Ecobank Niger, BCEAO

### Senegal 🇸🇳
- **Country Code**: `SN`
- **Currency**: `XOF`
- **Phone Code**: +221
- **Account Format**: IBAN (SN + 26 characters)
- **Example Account**: SN12 SN01 2345 6789 0123 4567 8901 23
- **Popular Banks**: Banque Atlantique Sénégal, Ecobank Sénégal, Bank of Africa Sénégal
- **BCEAO Headquarters**: Dakar (central bank hub)

### Togo 🇹🇬
- **Country Code**: `TG`
- **Currency**: `XOF`
- **Phone Code**: +228
- **Account Format**: IBAN (TG + 26 characters)
- **Example Account**: TG53 TG01 2345 6789 0123 4567 8901 23
- **Popular Banks**: Ecobank Togo, Bank of Africa Togo, BCEAO

---

## Additional Notes

### Bank Account Validation:

**Nigeria (NGN):**
- Account number format: 10 digits
- Example: 1234567890
- Major banks: First Bank, GTBank, Access Bank, Zenith Bank, UBA

**XOF Countries:**
- Account number format: IBAN (varies by country, typically 24-28 characters)
- Example Senegal: SN12 K001 0152 0100 0012 3456 7890
- Example Côte d'Ivoire: CI93 CI01 2345 6789 0123 4567 8901 23
- Example Mali: ML13 A001 0123 4567 8901 2345 6789 01
- Major banks: Ecobank, Bank of Africa, Banque Atlantique, BCEAO member banks

**Important Notes:**
- Nigeria uses 10-digit account numbers
- XOF countries use IBAN format (start with country code)
- Always include spaces in IBAN for readability
- Validate format based on country code

### WhatsApp Integration:

- Used for transaction notifications
- Must be a valid WhatsApp number
- Format: International format (+234...)

### Referral System:

- Each agent gets unique referral code
- Format: INITIALS-RANDOM (e.g., JD-A1B2C3)
- Used to track agent referrals
- May offer incentives for referrals

### Admin Verification Process:

1. Agent submits registration
2. Admin reviews documents
3. Admin verifies bank account
4. Admin approves/rejects agent
5. Agent status changes to ACTIVE
6. Agent can start processing transactions

### Security Considerations:

- Never share agent credentials
- Verify user identity before processing
- Keep transaction evidence
- Report suspicious activity
- Follow KYC/AML guidelines

### XOF Zone Advantages for Agents:

**Multi-Country Operations:**
- Agent in Senegal can serve users in all 8 XOF countries
- No currency conversion needed between XOF countries
- Same bank account can receive from any XOF country
- Reduces exchange rate risk

**Example Scenario:**
```
Agent registered in: Senegal (SN)
Agent's bank: Ecobank Sénégal (XOF account)
Can serve users from:
- ✅ Benin
- ✅ Burkina Faso
- ✅ Côte d'Ivoire
- ✅ Guinea-Bissau
- ✅ Mali
- ✅ Niger
- ✅ Senegal
- ✅ Togo

All transactions in XOF - no conversion needed!
```

**Benefits:**
- Larger market (8 countries, 130+ million people)
- Stable currency (pegged to Euro)
- Single monetary policy (BCEAO)
- Lower transaction costs (no forex fees within zone)

**Nigerian Agents:**
- Serve only Nigeria market
- NGN currency (more volatile than XOF)
- Larger single-country market (200+ million people)
- More digital banking options