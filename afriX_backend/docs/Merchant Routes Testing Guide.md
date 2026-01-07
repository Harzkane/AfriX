# Merchant Routes Testing Guide

## Prerequisites

- Server running on `http://localhost:5001`
- You have a registered user with JWT token
- User ID: `b20f56f7-9471-45c6-b56a-51d6e5117217`
- User has an NT wallet with balance

## Authentication Header

All requests require authentication. Add this header to every request:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

## 1. Register Merchant Account

**POST** `http://localhost:5001/api/v1/merchants/register`

### Request Body:

```json
{
  "business_name": "Tech Solutions Ltd",
  "display_name": "TechSol",
  "business_type": "retail",
  "description": "Leading technology solutions provider in West Africa",
  "business_email": "contact@techsol.com",
  "business_phone": "+2348012345678",
  "country": "NG",
  "city": "Lagos",
  "address": "123 Victoria Island, Lagos, Nigeria",
  "default_token_type": "NT"
}
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "merchant_id": "3f8e9c2b-4d5a-6e7f-8901-234567890abc",
    "api_key": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "verification_status": "pending"
  },
  "message": "Merchant account created successfully"
}
```

### ✅ What to Check:

- Response status: 201
- `merchant_id` is returned
- `api_key` is generated (64 characters)
- `verification_status` is "pending"
- Save the `api_key` for future use

### ❌ Error Cases:

**User Already Has Merchant Account:**

```json
{
  "success": false,
  "message": "User already has a merchant account"
}
```

**No Wallet for Selected Currency:**

```json
{
  "default_token_type": "USDT"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "User does not have a wallet for the selected currency"
}
```

**Missing Required Fields:**

```json
{
  "business_name": "Test Business"
}
```

Expected Error:

```json
{
    "success": false,
    "message": "Validation error",
    "errors": [...]
}
```

---

## 2. Get Merchant Profile

**GET** `http://localhost:5001/api/v1/merchants/profile`

### Expected Response:

```json
{
  "success": true,
  "data": {
    "id": "3f8e9c2b-4d5a-6e7f-8901-234567890abc",
    "user_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
    "business_name": "Tech Solutions Ltd",
    "display_name": "TechSol",
    "business_type": "retail",
    "description": "Leading technology solutions provider in West Africa",
    "business_email": "contact@techsol.com",
    "business_phone": "+2348012345678",
    "country": "NG",
    "city": "Lagos",
    "address": "123 Victoria Island, Lagos, Nigeria",
    "settlement_wallet_id": "db65ddb5-2704-435d-8d12-edc365aa51f8",
    "default_token_type": "NT",
    "payment_fee_percent": "2.00",
    "verification_status": "pending",
    "webhook_url": null,
    "created_at": "2025-10-24T14:45:00.000Z",
    "updated_at": "2025-10-24T14:45:00.000Z"
  }
}
```

### ✅ What to Check:

- All merchant details are returned
- `api_key` is NOT included in response (security)
- `settlement_wallet_id` matches user's NT wallet
- `payment_fee_percent` defaults to 2.00

### ❌ Error Case - No Merchant Profile:

If user hasn't registered as merchant:

```json
{
  "success": false,
  "error": {
    "message": "Merchant profile not found"
  }
}
```

---

## 3. Update Merchant Profile

**PUT** `http://localhost:5001/api/v1/merchants/profile`

### Request Body:

```json
{
  "display_name": "TechSolutions",
  "description": "Your trusted technology partner in Africa",
  "business_email": "support@techsol.com",
  "business_phone": "+2348087654321",
  "city": "Abuja",
  "address": "456 Central Business District, Abuja, Nigeria",
  "webhook_url": "https://techsol.com/api/webhooks/payments"
}
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "merchant_id": "3f8e9c2b-4d5a-6e7f-8901-234567890abc",
    "updated_at": "2025-10-24T15:30:00.000Z"
  },
  "message": "Merchant profile updated successfully"
}
```

### ✅ What to Check:

- Only specified fields are updated
- `updated_at` timestamp is current
- Verify changes with GET /profile

### Updating Default Currency:

```json
{
  "default_token_type": "CT"
}
```

**Requirements:**

- User must have a wallet for the new currency
- `settlement_wallet_id` will be automatically updated

### ❌ Error Case - Invalid Currency Change:

```json
{
  "default_token_type": "USDT"
}
```

If user has no USDT wallet:

```json
{
  "success": false,
  "message": "User does not have a wallet for the selected currency"
}
```

---

## 4. Create Payment Request

**POST** `http://localhost:5001/api/v1/merchants/payment-request`

### Request Body:

```json
{
  "amount": 5000,
  "currency": "NT",
  "description": "Payment for Software License",
  "customer_email": "customer@example.com",
  "reference": "INV-2024-001"
}
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "transaction_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    "payment_url": "https://afritoken.com/pay/7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "amount": 5000,
    "currency": "NT",
    "expires_at": "2025-10-24T16:00:00.000Z"
  },
  "message": "Payment request created successfully"
}
```

### ✅ What to Check:

- Response status: 201
- `transaction_id` is generated
- `payment_url` is provided
- `qr_code` is generated (base64 encoded image)
- Payment expires in 30 minutes
- Amount and currency match request

### Optional Fields:

**Minimal Request (using defaults):**

```json
{
  "amount": 1000
}
```

- `currency` will default to merchant's `default_token_type`
- `reference` will be auto-generated: `MER-{timestamp}`
- `description` will use merchant's display name

### ❌ Error Cases:

**Invalid Amount:**

```json
{
  "amount": 0,
  "currency": "NT"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Valid amount is required"
}
```

**Negative Amount:**

```json
{
  "amount": -100,
  "currency": "NT"
}
```

Expected Error:

```json
{
  "success": false,
  "message": "Valid amount is required"
}
```

**No Merchant Profile:**
If not registered as merchant:

```json
{
  "success": false,
  "error": {
    "message": "Merchant profile not found"
  }
}
```

---

## 5. Get Merchant Transactions

**GET** `http://localhost:5001/api/v1/merchants/transactions`

### Query Parameters:

- `status` (optional): Filter by status (pending, completed, failed)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

### Example Requests:

**Get All Transactions:**

```
GET http://localhost:5001/api/v1/merchants/transactions
```

**Filter by Status:**

```
GET http://localhost:5001/api/v1/merchants/transactions?status=completed
```

**Pagination:**

```
GET http://localhost:5001/api/v1/merchants/transactions?page=1&limit=10
```

### Expected Response:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
        "sender_id": null,
        "receiver_id": "b20f56f7-9471-45c6-b56a-51d6e5117217",
        "merchant_id": "3f8e9c2b-4d5a-6e7f-8901-234567890abc",
        "amount": "5000.00000000",
        "currency": "NT",
        "transaction_type": "COLLECTION",
        "status": "pending",
        "description": "Payment for Software License",
        "reference": "INV-2024-001",
        "metadata": {
          "customer_email": "customer@example.com",
          "merchant_name": "TechSol",
          "business_name": "Tech Solutions Ltd"
        },
        "created_at": "2025-10-24T15:30:00.000Z",
        "updated_at": "2025-10-24T15:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### ✅ What to Check:

- Only `COLLECTION` type transactions are returned
- Transactions are ordered by `created_at` DESC (newest first)
- Pagination info is accurate
- `sender_id` is null for pending payments
- Metadata contains customer and merchant info

### Status Filter Values:

- `pending` - Payment awaiting completion
- `completed` - Successfully paid
- `failed` - Payment failed
- `cancelled` - Payment cancelled

---

## 6. Regenerate API Key

**POST** `http://localhost:5001/api/v1/merchants/regenerate-api-key`

### Request Body:

```json
{}
```

(No body required)

### Expected Response:

```json
{
  "success": true,
  "data": {
    "api_key": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4"
  },
  "message": "API key regenerated successfully"
}
```

### ✅ What to Check:

- New `api_key` is returned (64 characters)
- Old API key is now invalid
- Save the new API key immediately

### ⚠️ Important Notes:

- **Old API key will stop working immediately**
- Update your integration with the new key
- This action cannot be undone
- Keep the new API key secure

### ❌ Error Case:

If not a registered merchant:

```json
{
  "success": false,
  "error": {
    "message": "Merchant profile not found"
  }
}
```

---

## Testing Sequence Summary

Run tests in this order:

### Setup Phase:

1. ✅ **Register user** - POST /auth/register
2. ✅ **Login** - POST /auth/login (get JWT token)
3. ✅ **Verify wallet exists** - GET /wallets

### Merchant Registration:

4. ✅ **POST /merchants/register** - Register merchant account
5. ✅ **GET /merchants/profile** - Verify merchant created
6. ✅ Save `merchant_id` and `api_key`

### Profile Management:

7. ✅ **PUT /merchants/profile** - Update profile details
8. ✅ **GET /merchants/profile** - Verify updates

### Payment Processing:

9. ✅ **POST /merchants/payment-request** - Create payment (5000 NT)
10. ✅ **POST /merchants/payment-request** - Create another payment (1000 NT)
11. ✅ **GET /merchants/transactions** - View all payments
12. ✅ **GET /merchants/transactions?status=pending** - Filter pending

### API Key Management:

13. ✅ **POST /merchants/regenerate-api-key** - Get new API key
14. ✅ **GET /merchants/profile** - Verify still works with new token

---

## Expected Final State

After all operations:

- **Merchant Status**: PENDING (awaiting admin verification)
- **Payment Requests Created**: 2
  - Payment 1: 5000 NT (status: pending)
  - Payment 2: 1000 NT (status: pending)
- **Total Transactions**: 2
- **API Key**: Regenerated (new key active)

---

## Validation Fix Required

⚠️ **IMPORTANT:** Before testing, you need to add the merchant registration validator to your validation.js file:

```javascript
/**
 * Validate merchant registration input
 */
const validateMerchantRegistration = (req, res, next) => {
  const schema = Joi.object({
    business_name: Joi.string().min(2).max(255).required().messages({
      "string.min": "Business name must be at least 2 characters",
      "string.max": "Business name cannot exceed 255 characters",
      "any.required": "Business name is required",
    }),
    display_name: Joi.string().min(2).max(100).required().messages({
      "string.min": "Display name must be at least 2 characters",
      "string.max": "Display name cannot exceed 100 characters",
      "any.required": "Display name is required",
    }),
    business_type: Joi.string()
      .valid(
        "RETAIL",
        "SERVICE",
        "ECOMMERCE",
        "RESTAURANT",
        "ENTERTAINMENT",
        "EDUCATION",
        "HEALTHCARE",
        "OTHER"
      )
      .required()
      .messages({
        "any.only": "Invalid business type",
        "any.required": "Business type is required",
      }),
    description: Joi.string().max(1000).optional(),
    business_email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid business email",
      "any.required": "Business email is required",
    }),
    business_phone: Joi.string().min(10).max(20).required().messages({
      "string.min": "Business phone must be at least 10 characters",
      "string.max": "Business phone cannot exceed 20 characters",
      "any.required": "Business phone is required",
    }),
    country: Joi.string().length(2).uppercase().required().messages({
      "string.length": "Country code must be 2 characters",
      "any.required": "Country is required",
    }),
    city: Joi.string().min(2).max(100).required().messages({
      "string.min": "City must be at least 2 characters",
      "string.max": "City cannot exceed 100 characters",
      "any.required": "City is required",
    }),
    address: Joi.string().min(10).required().messages({
      "string.min": "Address must be at least 10 characters",
      "any.required": "Address is required",
    }),
    default_token_type: Joi.string()
      .valid("NT", "CT", "USDT")
      .optional()
      .default("NT"),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
      field: error.details[0].path[0],
    });
  }

  next();
};
```

Then update your routes file to use the correct validator:

```javascript
// Change this line in merchants.js
router.post(
  "/register",
  authenticate,
  validateMerchantRegistration, // ← Change from validateRegistration
  merchantController.register
);
```

And export it from validation.js:

```javascript
module.exports = {
  validateRegistration,
  validateMerchantRegistration, // ← Add this
  validateLogin,
  validateTokenTransfer,
  // ... rest of exports
};
```

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

### 2. Invalid Token

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Solution:** Login again to get fresh token

### 3. Duplicate Merchant Registration

```json
{
  "success": false,
  "message": "User already has a merchant account"
}
```

**Solution:** Each user can only have one merchant account

### 4. No Wallet for Currency

```json
{
  "success": false,
  "message": "User does not have a wallet for the selected currency"
}
```

**Solution:** Ensure wallet exists before registering merchant or changing currency

### 5. Merchant Not Found

```json
{
  "success": false,
  "error": {
    "message": "Merchant profile not found"
  }
}
```

**Solution:** Register merchant first using POST /merchants/register

---

## Business Type Values

When registering, use one of these `business_type` values (**lowercase**):

- `retail` - Retail stores
- `service` - Service providers
- `ecommerce` - Online stores
- `food` - Food & beverage (restaurants)
- `travel` - Travel and hospitality
- `education` - Educational institutions
- `entertainment` - Entertainment venues
- `other` - Other business types

⚠️ **Important:** Business types must be **lowercase** to match database enum values!

---

## Merchant Verification Status

Merchants can have these verification statuses:

- `PENDING` - Awaiting verification (initial state)
- `VERIFIED` - Fully verified (can accept payments)
- `REJECTED` - Verification rejected
- `SUSPENDED` - Account suspended

**Note:** Only `VERIFIED` merchants should be able to receive actual payments in production.

---

## Payment Flow Example

### Merchant Creates Payment:

```
POST /merchants/payment-request
→ Returns payment_url and qr_code
```

### Customer Pays (outside this API):

```
1. Customer scans QR code or visits payment_url
2. Customer completes payment from their wallet
3. Transaction status changes to "completed"
4. Merchant receives webhook notification (if configured)
```

### Merchant Checks Status:

```
GET /merchants/transactions
→ See transaction status updated to "completed"
→ Funds settled to merchant's settlement wallet
```

---

## Testing Checklist

- [ ] Register merchant with all required fields
- [ ] Verify merchant profile is created correctly
- [ ] Update merchant profile (multiple fields)
- [ ] Change default currency (if user has multiple wallets)
- [ ] Create payment request with all fields
- [ ] Create payment request with minimal fields
- [ ] List all transactions
- [ ] Filter transactions by status
- [ ] Test pagination (page 1, page 2)
- [ ] Regenerate API key
- [ ] Verify old API key doesn't work (if API key auth implemented)
- [ ] Test all error cases (duplicate registration, invalid amounts, etc.)

---

## Additional Notes

### API Key Usage:

The generated API key is intended for server-to-server integration. In a production system, you would:

- Use the API key to authenticate merchant API requests
- Store it securely (never expose in frontend code)
- Include it in a custom header: `X-API-Key: {api_key}`

### Webhook Integration:

When a payment is completed:

1. System makes POST request to merchant's `webhook_url`
2. Payload includes transaction details
3. Merchant can update their system automatically

### Payment Fees:

- Default merchant fee: 2.00%
- Applied when payment is completed
- Deducted from merchant's settlement amount
- Example: Customer pays 1000 NT → Merchant receives 980 NT

### QR Code:

- Generated as base64-encoded PNG image
- Contains payment metadata (transaction_id, merchant_id, amount, currency)
- Customer can scan to initiate payment
- Expires after 30 minutes
