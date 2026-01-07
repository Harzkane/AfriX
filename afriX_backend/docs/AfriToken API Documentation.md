# AfriToken API Documentation

## Overview

**Base URL**: `https://api.afritoken.com`  
**Current Version**: `v1`  
**Protocol**: HTTPS only  
**Format**: JSON  
**Authentication**: JWT Bearer tokens

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Rate Limiting](#rate-limiting)
4. [Pagination](#pagination)
5. [Authentication Endpoints](#authentication-endpoints)
6. [User Endpoints](#user-endpoints)
7. [Wallet Endpoints](#wallet-endpoints)
8. [Transaction Endpoints](#transaction-endpoints)
9. [Token Endpoints](#token-endpoints)
10. [Agent Endpoints](#agent-endpoints)
11. [Merchant Endpoints](#merchant-endpoints)
12. [Notification Endpoints](#notification-endpoints)
13. [Admin Endpoints](#admin-endpoints)
14. [WebSocket Events](#websocket-events)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token**: 24-hour expiry
- **Refresh Token**: 30-day expiry
- **Rotation**: Use refresh token to get new access token

### Authentication Flow

1. User logs in → receives access token + refresh token
2. Use access token for API calls
3. When access token expires (401 response) → use refresh token
4. Refresh endpoint returns new access token + refresh token
5. Update stored tokens and retry request

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient token balance for this transfer",
    "details": {
      "required": 1005,
      "available": 1000,
      "token": "NT"
    }
  },
  "timestamp": "2025-10-22T14:30:00Z",
  "path": "/api/v1/transactions/transfer"
}
```

### HTTP Status Codes

| Code | Meaning               | Usage                                          |
| ---- | --------------------- | ---------------------------------------------- |
| 200  | OK                    | Successful GET, PUT, PATCH                     |
| 201  | Created               | Successful POST creating resource              |
| 204  | No Content            | Successful DELETE                              |
| 400  | Bad Request           | Invalid input, validation error                |
| 401  | Unauthorized          | Missing/invalid/expired token                  |
| 403  | Forbidden             | Valid token but insufficient permissions       |
| 404  | Not Found             | Resource doesn't exist                         |
| 409  | Conflict              | Resource state conflict (e.g., already exists) |
| 422  | Unprocessable Entity  | Valid format but business logic error          |
| 429  | Too Many Requests     | Rate limit exceeded                            |
| 500  | Internal Server Error | Unexpected server error                        |
| 503  | Service Unavailable   | Server maintenance/overload                    |

### Common Error Codes

```javascript
// Authentication Errors
AUTH_INVALID_CREDENTIALS;
AUTH_TOKEN_EXPIRED;
AUTH_TOKEN_INVALID;
AUTH_EMAIL_NOT_VERIFIED;
AUTH_ACCOUNT_SUSPENDED;

// Validation Errors
VALIDATION_REQUIRED_FIELD;
VALIDATION_INVALID_FORMAT;
VALIDATION_OUT_OF_RANGE;

// Transaction Errors
INSUFFICIENT_BALANCE;
DAILY_LIMIT_EXCEEDED;
RECIPIENT_NOT_FOUND;
TRANSACTION_FAILED;
AMOUNT_BELOW_MINIMUM;

// Agent Errors
AGENT_INSUFFICIENT_CAPACITY;
AGENT_NOT_AVAILABLE;
AGENT_NOT_FOUND;

// General Errors
RESOURCE_NOT_FOUND;
OPERATION_NOT_ALLOWED;
RATE_LIMIT_EXCEEDED;
SERVER_ERROR;
```

---

## Rate Limiting

### Limits by Endpoint Type

| Endpoint Type               | Limit        | Window     |
| --------------------------- | ------------ | ---------- |
| Authentication              | 10 requests  | 15 minutes |
| Read operations (GET)       | 100 requests | 1 minute   |
| Write operations (POST/PUT) | 50 requests  | 1 minute   |
| Transaction creation        | 20 requests  | 1 minute   |
| File uploads                | 10 requests  | 1 minute   |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1698156000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later",
    "retryAfter": 45
  }
}
```

---

## Pagination

### Query Parameters

```http
GET /api/v1/transactions/history?page=2&limit=20
```

| Parameter | Type    | Default | Description              |
| --------- | ------- | ------- | ------------------------ |
| page      | integer | 1       | Page number (1-indexed)  |
| limit     | integer | 20      | Items per page (max 100) |

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 157,
    "pages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## Authentication Endpoints

### POST /api/v1/auth/register

Register a new user account.

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "country": "Nigeria"
}
```

**Validation Rules**:

- `email`: Valid email format, unique
- `password`: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
- `name`: 2-100 characters
- `country`: Must be "Nigeria" or valid XOF country

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "userId": "usr_1a2b3c4d",
    "email": "john@example.com",
    "name": "John Doe",
    "country": "Nigeria",
    "isVerified": false
  },
  "message": "Registration successful. Please verify your email."
}
```

**Errors**:

- `409`: Email already exists
- `400`: Validation error (weak password, invalid email, etc.)

---

### POST /api/v1/auth/verify-email

Verify email address with code sent via email.

**Request Body**:

```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_1a2b3c4d",
      "email": "john@example.com",
      "name": "John Doe",
      "country": "Nigeria",
      "isVerified": true,
      "wallets": {
        "NT": "0x1234...abcd",
        "CT": "0x5678...efgh",
        "USDT": "0x9012...ijkl"
      }
    }
  }
}
```

**Errors**:

- `400`: Invalid or expired code
- `404`: Email not found
- `409`: Email already verified

---

### POST /api/v1/auth/resend-verification

Resend verification email.

**Request Body**:

```json
{
  "email": "john@example.com"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

---

### POST /api/v1/auth/login

Authenticate user and receive tokens.

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_1a2b3c4d",
      "email": "john@example.com",
      "name": "John Doe",
      "country": "Nigeria",
      "isVerified": true,
      "role": "user",
      "language": "en"
    }
  }
}
```

**Errors**:

- `401`: Invalid credentials
- `403`: Account suspended
- `422`: Email not verified

---

### POST /api/v1/auth/refresh

Get new access token using refresh token.

**Request Body**:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**:

- `401`: Invalid or expired refresh token

---

### POST /api/v1/auth/forgot-password

Request password reset.

**Request Body**:

```json
{
  "email": "john@example.com"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Password reset instructions sent to your email"
}
```

---

### POST /api/v1/auth/reset-password

Reset password with token from email.

**Request Body**:

```json
{
  "token": "reset_abc123...",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Password reset successful. Please log in with your new password"
}
```

**Errors**:

- `400`: Invalid or expired token
- `400`: Password doesn't meet requirements

---

### POST /api/v1/auth/logout

Invalidate current session tokens.

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Endpoints

### GET /api/v1/users/me

Get current user profile.

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "usr_1a2b3c4d",
    "email": "john@example.com",
    "name": "John Doe",
    "country": "Nigeria",
    "language": "en",
    "phoneNumber": "+2348012345678",
    "isVerified": true,
    "verificationTier": "basic",
    "createdAt": "2025-10-01T10:00:00Z",
    "limits": {
      "daily": 100000,
      "perTransaction": 50000
    }
  }
}
```

---

### PUT /api/v1/users/me

Update user profile.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body** (all fields optional):

```json
{
  "name": "John Doe Jr.",
  "phoneNumber": "+2348012345678",
  "language": "en"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "usr_1a2b3c4d",
    "email": "john@example.com",
    "name": "John Doe Jr.",
    "phoneNumber": "+2348012345678",
    "language": "en"
  }
}
```

---

### GET /api/v1/users/me/activity

Get user activity log.

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `type` (optional): `login`, `transaction`, `profile_update`

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "act_xyz789",
      "type": "transaction",
      "action": "P2P_TRANSFER_SENT",
      "details": {
        "amount": 1000,
        "token": "NT",
        "recipient": "Jane Doe"
      },
      "timestamp": "2025-10-22T14:30:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### POST /api/v1/users/me/change-password

Change user password.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors**:

- `401`: Current password incorrect
- `400`: New password doesn't meet requirements

---

## Wallet Endpoints

### GET /api/v1/wallets

Get all user wallets and balances.

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "wallets": [
      {
        "id": "wlt_nt_123",
        "type": "NT",
        "balance": "8995.00",
        "address": "0x1234...abcd",
        "lastUpdated": "2025-10-22T14:30:00Z"
      },
      {
        "id": "wlt_ct_456",
        "type": "CT",
        "balance": "10835",
        "address": "0x5678...efgh",
        "lastUpdated": "2025-10-22T14:25:00Z"
      },
      {
        "id": "wlt_usdt_789",
        "type": "USDT",
        "balance": "50.00",
        "address": "0x9012...ijkl",
        "lastUpdated": "2025-10-22T14:20:00Z"
      }
    ],
    "totalValueUSD": "25.50"
  }
}
```

---

### GET /api/v1/wallets/balance

Get balances for all tokens.

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "NT": "8995.00",
    "CT": "10835",
    "USDT": "50.00"
  }
}
```

---

### GET /api/v1/wallets/address/:tokenType

Get wallet address for specific token.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `tokenType`: `NT`, `CT`, or `USDT`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "tokenType": "NT",
    "address": "0x1234...abcd",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  }
}
```

**Errors**:

- `400`: Invalid token type

---

## Transaction Endpoints

### POST /api/v1/transactions/transfer

Transfer tokens to another user (P2P).

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "recipient": "jane@example.com",
  "tokenType": "NT",
  "amount": "1000.00",
  "note": "Lunch money"
}
```

**Validation**:

- `recipient`: Valid email or wallet address
- `tokenType`: NT, CT, or USDT
- `amount`: Greater than 100, less than daily limit
- `note`: Optional, max 200 characters

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "txn_abc123",
    "type": "P2P_TRANSFER",
    "sender": {
      "id": "usr_1a2b3c4d",
      "name": "John Doe"
    },
    "recipient": {
      "id": "usr_5e6f7g8h",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "tokenType": "NT",
    "amount": "1000.00",
    "fee": "5.00",
    "total": "1005.00",
    "note": "Lunch money",
    "status": "completed",
    "txHash": "0xabc123...def456",
    "timestamp": "2025-10-22T14:30:00Z"
  }
}
```

**Errors**:

- `400`: Insufficient balance
- `404`: Recipient not found
- `422`: Daily limit exceeded
- `422`: Amount below minimum

---

### POST /api/v1/transactions/request

Request tokens from another user.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "from": "john@example.com",
  "tokenType": "NT",
  "amount": "2000.00",
  "note": "Reimbursement for groceries"
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "req_xyz789",
    "type": "TOKEN_REQUEST",
    "requester": {
      "id": "usr_5e6f7g8h",
      "name": "Jane Doe"
    },
    "requestedFrom": {
      "id": "usr_1a2b3c4d",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "tokenType": "NT",
    "amount": "2000.00",
    "note": "Reimbursement for groceries",
    "status": "pending",
    "expiresAt": "2025-10-29T14:30:00Z",
    "createdAt": "2025-10-22T14:30:00Z"
  }
}
```

---

### POST /api/v1/transactions/request/:id/fulfill

Fulfill a token request by sending tokens.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Request ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "requestId": "req_xyz789",
    "transferId": "txn_abc123",
    "status": "fulfilled",
    "fulfilledAt": "2025-10-22T14:35:00Z"
  }
}
```

**Errors**:

- `404`: Request not found
- `409`: Request already fulfilled/rejected/expired
- `400`: Insufficient balance

---

### POST /api/v1/transactions/request/:id/reject

Reject a token request.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Request ID

**Request Body** (optional):

```json
{
  "note": "Sorry, I'm short on tokens right now"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "requestId": "req_xyz789",
    "status": "rejected",
    "rejectedAt": "2025-10-22T14:35:00Z",
    "note": "Sorry, I'm short on tokens right now"
  }
}
```

---

### POST /api/v1/transactions/request/:id/cancel

Cancel a token request (requester only).

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Request ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "requestId": "req_xyz789",
    "status": "cancelled",
    "cancelledAt": "2025-10-22T14:35:00Z"
  }
}
```

---

### GET /api/v1/transactions/history

Get transaction history.

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `type` (optional): `sent`, `received`, `swap`, `mint`, `burn`, `all`
- `tokenType` (optional): `NT`, `CT`, `USDT`
- `status` (optional): `completed`, `pending`, `failed`
- `startDate` (optional): ISO 8601 date
- `endDate` (optional): ISO 8601 date

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "txn_abc123",
      "type": "sent",
      "tokenType": "NT",
      "amount": "1000.00",
      "fee": "5.00",
      "counterparty": {
        "id": "usr_5e6f7g8h",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "note": "Lunch money",
      "status": "completed",
      "txHash": "0xabc123...def456",
      "timestamp": "2025-10-22T14:30:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### GET /api/v1/transactions/:id

Get detailed transaction information.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Transaction ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "txn_abc123",
    "type": "P2P_TRANSFER",
    "sender": {
      "id": "usr_1a2b3c4d",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "recipient": {
      "id": "usr_5e6f7g8h",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "tokenType": "NT",
    "amount": "1000.00",
    "fee": "5.00",
    "note": "Lunch money",
    "status": "completed",
    "txHash": "0xabc123...def456",
    "blockNumber": 12345678,
    "confirmations": 12,
    "createdAt": "2025-10-22T14:30:00Z",
    "completedAt": "2025-10-22T14:30:15Z"
  }
}
```

**Errors**:

- `404`: Transaction not found
- `403`: Not authorized to view this transaction

---

## Token Endpoints

### GET /api/v1/tokens/rates

Get current exchange rates.

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "rates": [
      {
        "from": "NT",
        "to": "CT",
        "rate": "2.2",
        "updatedAt": "2025-10-22T14:00:00Z"
      },
      {
        "from": "NT",
        "to": "USDT",
        "rate": "0.00065",
        "updatedAt": "2025-10-22T14:00:00Z"
      },
      {
        "from": "CT",
        "to": "USDT",
        "rate": "0.000295",
        "updatedAt": "2025-10-22T14:00:00Z"
      }
    ],
    "lastUpdate": "2025-10-22T14:00:00Z"
  }
}
```

---

### POST /api/v1/tokens/swap

Swap between token types.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "fromToken": "NT",
  "toToken": "CT",
  "amount": "5000.00"
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "swp_xyz789",
    "fromToken": "NT",
    "toToken": "CT",
    "fromAmount": "5000.00",
    "toAmount": "10835",
    "rate": "2.2",
    "fee": "165",
    "status": "completed",
    "txHash": "0xdef456...ghi789",
    "timestamp": "2025-10-22T14:30:00Z"
  }
}
```

**Errors**:

- `400`: Insufficient balance
- `422`: Slippage exceeded (rate changed too much)
- `503`: Swap contract paused

---

### POST /api/v1/tokens/mint/initiate

Initiate token minting (buy from agent).

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "agentId": "agt_abc123",
  "tokenType": "NT",
  "amount": "10000.00"
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "mnt_xyz789",
    "agent": {
      "id": "agt_abc123",
      "name": "Chidi's Exchange",
      "rating": 4.8,
      "paymentMethods": {
        "bank": {
          "bank": "GTBank",
          "accountNumber": "0123456789",
          "accountName": "Chidi Okafor"
        },
        "mobileMoney": {
          "provider": "Opay",
          "number": "08012345678",
          "name": "Chidi Okafor"
        }
      }
    },
    "tokenType": "NT",
    "amount": "10000.00",
    "fiatAmount": "10000.00",
    "fiatCurrency": "NGN",
    "status": "payment_submitted",
    "expiresAt": "2025-10-22T15:00:00Z",
    "instructions": "Send ₦10,000 to the agent's account above, then upload payment proof"
  }
}
```

---

### POST /api/v1/tokens/mint/:id/upload-proof

Upload payment proof for minting transaction.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Minting transaction ID

**Request Body** (multipart/form-data):

```
paymentProof: <file> (image, max 5MB)
reference: "TRF202510220001"
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "mnt_xyz789",
    "status": "agent_reviewing",
    "proofUrl": "https://s3.../proof.jpg",
    "reference": "TRF202510220001",
    "submittedAt": "2025-10-22T14:35:00Z"
  }
}
```

---

### POST /api/v1/tokens/burn/initiate

Initiate token burning (sell to agent).

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "agentId": "agt_def456",
  "tokenType": "NT",
  "amount": "10000.00"
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "brn_xyz789",
    "agent": {
      "id": "agt_def456",
      "name": "Ada's Exchange",
      "rating": 4.9
    },
    "tokenType": "NT",
    "amount": "10000.00",
    "fiatAmount": "10000.00",
    "fiatCurrency": "NGN",
    "status": "escrow_locked",
    "escrowId": "0x456def...789ghi",
    "expiresAt": "2025-10-22T15:00:00Z",
    "userPaymentDetails": {
      "bank": "GTBank",
      "accountNumber": "0987654321",
      "accountName": "John Doe"
    }
  }
}
```

---

### POST /api/v1/tokens/burn/:id/confirm

Confirm fiat received (user confirms agent sent money).

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Burning transaction ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "brn_xyz789",
    "status": "user_confirmed",
    "confirmedAt": "2025-10-22T14:45:00Z"
  }
}
```

---

### POST /api/v1/tokens/burn/:id/dispute

Dispute burning transaction (user didn't receive fiat).

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Burning transaction ID

**Request Body**:

```json
{
  "reason": "No payment received in my account",
  "evidence": "<file upload optional>"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "disputeId": "dis_abc123",
    "transactionId": "brn_xyz789",
    "status": "disputed",
    "reason": "No payment received in my account",
    "createdAt": "2025-10-22T14:45:00Z",
    "message": "Your tokens have been refunded. Admin will review within 24 hours"
  }
}
```

---

## Agent Endpoints

### GET /api/v1/agents

Get list of available agents.

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `tokenType` (required): `NT` or `CT`
- `transactionType` (required): `mint` or `burn`
- `amount` (required): Amount user wants to exchange
- `location` (optional): User's location for proximity matching

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "agt_abc123",
      "name": "Chidi's Exchange",
      "rating": 4.8,
      "reviewCount": 245,
      "responseTime": "Usually responds in 5 min",
      "maxAmount": "50000.00",
      "availableCapacity": "40000.00",
      "paymentMethods": ["bank



// ===============================================================
    //   ===============================================================


    "paymentMethods": ["bank_transfer", "mobile_money"],
      "verified": true,
      "badges": ["verified", "fast_response", "high_liquidity"]
    },
    {
      "id": "agt_def456",
      "name": "Ada's Exchange",
      "rating": 4.9,
      "reviewCount": 312,
      "responseTime": "Usually responds in 3 min",
      "maxAmount": "100000.00",
      "availableCapacity": "85000.00",
      "paymentMethods": ["bank_transfer", "mobile_money"],
      "verified": true,
      "badges": ["verified", "fast_response", "platinum"]
    }
  ]
}
```

---

### GET /api/v1/agents/:id

Get agent details.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Agent ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "agt_abc123",
    "name": "Chidi's Exchange",
    "businessDescription": "Fast and reliable token exchange service in Lagos",
    "country": "Nigeria",
    "serviceArea": "Lagos, Abuja",
    "rating": 4.8,
    "reviewCount": 245,
    "completionRate": 98.5,
    "averageResponseTime": 5,
    "totalTransactions": 267,
    "availableCapacity": "40000.00",
    "verified": true,
    "status": "active",
    "createdAt": "2025-08-15T10:00:00Z",
    "recentReviews": [
      {
        "userId": "usr_xxx",
        "userName": "John D.",
        "rating": 5,
        "comment": "Very fast service!",
        "timestamp": "2025-10-21T12:00:00Z"
      }
    ]
  }
}
```

---

### POST /api/v1/agents/apply

Apply to become an agent.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body** (multipart/form-data):

```
businessName: "Chidi's Exchange"
businessDescription: "Fast and reliable..."
country: "Nigeria"
serviceArea: "Lagos, Abuja"
phoneNumber: "+2348012345678"
paymentMethods: ["bank_transfer", "mobile_money"]
bankName: "GTBank"
bankAccountNumber: "0123456789"
bankAccountName: "Chidi Okafor"
mobileMoneyProvider: "Opay"
mobileMoneyNumber: "08012345678"
idFront: <file>
idBack: <file>
proofOfAddress: <file>
selfieWithId: <file>
businessRegistration: <file> (optional)
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "applicationId": "app_xyz789",
    "status": "pending_review",
    "submittedAt": "2025-10-22T14:30:00Z",
    "message": "Application submitted successfully. We'll review within 24-48 hours."
  }
}
```

---

### GET /api/v1/agents/dashboard

Get agent dashboard (for logged-in agents).

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "agentId": "agt_abc123",
    "status": "active",
    "deposit": "10000.00",
    "availableCapacity": "8000.00",
    "rating": 4.8,
    "reviewCount": 245,
    "completionRate": 98.5,
    "averageResponseTime": 5,
    "earnings": {
      "today": "150.00",
      "thisWeek": "680.00",
      "thisMonth": "2450.00",
      "allTime": "8920.00"
    },
    "transactions": {
      "pending": 2,
      "completedToday": 12,
      "completedThisWeek": 58,
      "completedThisMonth": 245
    },
    "performanceTier": "gold"
  }
}
```

---

### PUT /api/v1/agents/status

Update agent availability status.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "status": "active" // or "inactive"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "agentId": "agt_abc123",
    "status": "active",
    "updatedAt": "2025-10-22T14:30:00Z"
  }
}
```

---

### GET /api/v1/agents/transactions

Get agent transaction history.

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 20)
- `type` (optional): `mint` or `burn`
- `status` (optional): `pending`, `completed`, `disputed`

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "mnt_xyz789",
      "type": "mint",
      "user": {
        "id": "usr_1a2b3c4d",
        "name": "John Doe"
      },
      "tokenType": "NT",
      "amount": "10000.00",
      "status": "completed",
      "createdAt": "2025-10-22T14:00:00Z",
      "completedAt": "2025-10-22T14:15:00Z",
      "responseTime": 15
    }
  ],
  "pagination": {...}
}
```

---

### POST /api/v1/agents/transactions/:id/confirm-payment

Agent confirms payment received (for minting).

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Minting transaction ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "mnt_xyz789",
    "status": "agent_confirmed",
    "confirmedAt": "2025-10-22T14:15:00Z",
    "message": "Tokens will be minted to user's wallet"
  }
}
```

---

### POST /api/v1/agents/transactions/:id/send-fiat

Agent confirms fiat sent (for burning).

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Burning transaction ID

**Request Body** (multipart/form-data):

```
paymentProof: <file>
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "brn_xyz789",
    "status": "agent_sent_fiat",
    "sentAt": "2025-10-22T14:15:00Z",
    "message": "Waiting for user confirmation"
  }
}
```

---

### POST /api/v1/agents/deposit

Add to agent security deposit.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "amount": "5000.00"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "depositAddress": "0x789abc...def123",
    "amount": "5000.00",
    "qrCode": "data:image/png;base64,...",
    "message": "Send USDT to this address. Capacity will update after 6 confirmations."
  }
}
```

---

## Merchant Endpoints

### POST /api/v1/merchants/register

Register as a merchant.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "businessName": "Bola's Boutique",
  "businessDescription": "Fashion and accessories",
  "businessCategory": "retail",
  "address": "123 Market Street, Lagos"
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "merchantId": "mrc_abc123",
    "businessName": "Bola's Boutique",
    "status": "active",
    "createdAt": "2025-10-22T14:30:00Z"
  }
}
```

---

### GET /api/v1/merchants/profile

Get merchant profile.

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "mrc_abc123",
    "userId": "usr_1a2b3c4d",
    "businessName": "Bola's Boutique",
    "businessDescription": "Fashion and accessories",
    "businessCategory": "retail",
    "address": "123 Market Street, Lagos",
    "status": "active",
    "createdAt": "2025-10-22T14:30:00Z",
    "stats": {
      "totalTransactions": 156,
      "totalRevenue": "280000.00",
      "averageTransaction": "1794.87"
    }
  }
}
```

---

### PUT /api/v1/merchants/profile

Update merchant profile.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "businessDescription": "Updated description",
  "address": "New address"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "mrc_abc123",
    "businessName": "Bola's Boutique",
    "businessDescription": "Updated description",
    "address": "New address"
  }
}
```

---

### POST /api/v1/merchants/payment-links

Create payment link.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "title": "Ankara Dress - Blue Pattern",
  "description": "Custom-made Ankara dress, size M",
  "amount": "5000.00",
  "tokenType": "NT",
  "isFixedAmount": true,
  "expiresIn": 7,
  "expiresUnit": "days"
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "pyl_xyz789",
    "title": "Ankara Dress - Blue Pattern",
    "amount": "5000.00",
    "tokenType": "NT",
    "linkCode": "BOLA-DRESS-5K",
    "url": "https://afritoken.com/pay/BOLA-DRESS-5K",
    "qrCode": "data:image/png;base64,...",
    "status": "active",
    "expiresAt": "2025-10-29T14:30:00Z",
    "createdAt": "2025-10-22T14:30:00Z"
  }
}
```

---

### GET /api/v1/merchants/payment-links

Get merchant's payment links.

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional): `active`, `paid`, `expired`

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "pyl_xyz789",
      "title": "Ankara Dress - Blue Pattern",
      "amount": "5000.00",
      "tokenType": "NT",
      "linkCode": "BOLA-DRESS-5K",
      "status": "paid",
      "paidBy": "Tolu Adeyemi",
      "paidAt": "2025-10-22T15:00:00Z",
      "createdAt": "2025-10-22T14:30:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### GET /api/v1/merchants/payment-links/:id

Get payment link details.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Payment link ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "pyl_xyz789",
    "merchantId": "mrc_abc123",
    "title": "Ankara Dress - Blue Pattern",
    "description": "Custom-made Ankara dress, size M",
    "amount": "5000.00",
    "tokenType": "NT",
    "isFixedAmount": true,
    "linkCode": "BOLA-DRESS-5K",
    "url": "https://afritoken.com/pay/BOLA-DRESS-5K",
    "qrCode": "data:image/png;base64,...",
    "status": "paid",
    "paidBy": {
      "id": "usr_xxx",
      "name": "Tolu Adeyemi"
    },
    "transactionId": "txn_abc123",
    "paidAt": "2025-10-22T15:00:00Z",
    "expiresAt": "2025-10-29T14:30:00Z",
    "createdAt": "2025-10-22T14:30:00Z"
  }
}
```

---

### DELETE /api/v1/merchants/payment-links/:id

Delete/deactivate payment link.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Payment link ID

**Response (200)**:

```json
{
  "success": true,
  "message": "Payment link deleted successfully"
}
```

---

### GET /api/v1/merchants/transactions

Get merchant transaction history.

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 20)
- `startDate` (optional)
- `endDate` (optional)

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "txn_abc123",
      "customer": {
        "name": "Tolu Adeyemi"
      },
      "amount": "5000.00",
      "tokenType": "NT",
      "fee": "100.00",
      "netAmount": "4900.00",
      "paymentLinkId": "pyl_xyz789",
      "paymentLinkTitle": "Ankara Dress - Blue Pattern",
      "timestamp": "2025-10-22T15:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### GET /api/v1/merchants/dashboard

Get merchant dashboard metrics.

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "merchantId": "mrc_abc123",
    "summary": {
      "today": {
        "transactions": 12,
        "revenue": "45000.00",
        "fees": "900.00",
        "net": "44100.00"
      },
      "thisWeek": {
        "transactions": 67,
        "revenue": "187500.00",
        "fees": "3750.00",
        "net": "183750.00"
      },
      "thisMonth": {
        "transactions": 289,
        "revenue": "846000.00",
        "fees": "16920.00",
        "net": "829080.00"
      }
    },
    "topProducts": [
      {
        "title": "Ankara Dress - Blue Pattern",
        "sales": 15,
        "revenue": "75000.00"
      }
    ]
  }
}
```

---

## Notification Endpoints

### GET /api/v1/notifications

Get user notifications.

**Headers**: `Authorization: Bearer <access_token>`

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 20)
- `unreadOnly` (optional): `true` or `false`

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "ntf_abc123",
      "type": "TOKENS_RECEIVED",
      "title": "Tokens Received",
      "message": "You received 1,000 NT from Jane Doe",
      "data": {
        "transactionId": "txn_abc123",
        "amount": "1000.00",
        "tokenType": "NT",
        "from": "Jane Doe"
      },
      "isRead": false,
      "createdAt": "2025-10-22T14:30:00Z"
    }
  ],
  "unreadCount": 5,
  "pagination": {...}
}
```

---

### POST /api/v1/notifications/:id/read

Mark notification as read.

**Headers**: `Authorization: Bearer <access_token>`

**Path Parameters**:

- `id`: Notification ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "ntf_abc123",
    "isRead": true,
    "readAt": "2025-10-22T14:35:00Z"
  }
}
```

---

### POST /api/v1/notifications/read-all

Mark all notifications as read.

**Headers**: `Authorization: Bearer <access_token>`

**Response (200)**:

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "markedCount": 5
}
```

---

### PUT /api/v1/notifications/settings

Update notification preferences.

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:

```json
{
  "push": {
    "tokensReceived": true,
    "tokensSent": true,
    "requestReceived": true,
    "agentUpdates": true,
    "marketingMessages": false
  },
  "email": {
    "transactionReceipts": true,
    "weeklyReport": true,
    "marketingMessages": false
  },
  "sms": {
    "securityAlerts": true,
    "largeTransactions": true
  }
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "push": {...},
    "email": {...},
    "sms": {...}
  }
}
```

---

## Admin Endpoints

_Note: These require admin role. Access restricted._

### GET /api/v1/admin/users

Get all users (admin only).

**Headers**: `Authorization: Bearer <admin_token>`

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 50)
- `status` (optional): `active`, `suspended`, `banned`
- `search` (optional): Search by name or email

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "usr_1a2b3c4d",
      "email": "john@example.com",
      "name": "John Doe",
      "country": "Nigeria",
      "status": "active",
      "verificationTier": "basic",
      "totalTransactions": 45,
      "totalVolume": "125000.00",
      "createdAt": "2025-10-01T10:00:00Z",
      "lastActive": "2025-10-22T14:30:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### GET /api/v1/admin/agents/applications

Get pending agent applications.

**Headers**: `Authorization: Bearer <admin_token>`

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "app_xyz789",
      "userId": "usr_1a2b3c4d",
      "userName": "Chidi Okafor",
      "businessName": "Chidi's Exchange",
      "country": "Nigeria",
      "status": "pending_review",
      "documents": {
        "idFront": "s3://...",
        "idBack": "s3://...",
        "proofOfAddress": "s3://...",
        "selfieWithId": "s3://..."
      },
      "submittedAt": "2025-10-22T10:00:00Z"
    }
  ]
}
```

---

### POST /api/v1/admin/agents/applications/:id/approve

Approve agent application.

**Headers**: `Authorization: Bearer <admin_token>`

**Path Parameters**:

- `id`: Application ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "applicationId": "app_xyz789",
    "status": "approved",
    "approvedAt": "2025-10-22T14:30:00Z"
  }
}
```

---

### POST /api/v1/admin/agents/applications/:id/reject

Reject agent application.

**Headers**: `Authorization: Bearer <admin_token>`

**Path Parameters**:

- `id`: Application ID

**Request Body**:

```json
{
  "reason": "ID document is unclear, please resubmit a clearer photo"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "applicationId": "app_xyz789",
    "status": "rejected",
    "reason": "ID document is unclear...",
    "rejectedAt": "2025-10-22T14:30:00Z"
  }
}
```

---

### GET /api/v1/admin/disputes

Get all disputes.

**Headers**: `Authorization: Bearer <admin_token>`

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 20)
- `status` (optional): `pending`, `resolved`

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "dis_abc123",
      "transactionId": "brn_xyz789",
      "transactionType": "burn",
      "user": {
        "id": "usr_1a2b3c4d",
        "name": "John Doe"
      },
      "agent": {
        "id": "agt_def456",
        "name": "Ada's Exchange"
      },
      "amount": "10000.00",
      "tokenType": "NT",
      "reason": "No payment received",
      "status": "pending_review",
      "createdAt": "2025-10-22T14:30:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### GET /api/v1/admin/disputes/:id

Get dispute details.

**Headers**: `Authorization: Bearer <admin_token>`

**Path Parameters**:

- `id`: Dispute ID

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "dis_abc123",
    "transactionId": "brn_xyz789",
    "user": {
      "id": "usr_1a2b3c4d",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "agent": {
      "id": "agt_def456",
      "name": "Ada's Exchange"
    },
    "amount": "10000.00",
    "tokenType": "NT",
    "userClaim": "No payment received in my account",
    "userEvidence": ["s3://..."],
    "agentResponse": "Payment sent via GTBank. Reference: TRF202510210001",
    "agentEvidence": ["s3://..."],
    "status": "pending_review",
    "createdAt": "2025-10-22T14:30:00Z"
  }
}
```

---

### POST /api/v1/admin/disputes/:id/resolve

Resolve dispute.

**Headers**: `Authorization: Bearer <admin_token>`

**Path Parameters**:

- `id`: Dispute ID

**Request Body**:

```json
{
  "resolution": "user_wins", // or "agent_wins" or "partial"
  "notes": "Agent sent to wrong account number",
  "refundAmount": "10000.00",
  "penaltyAmount": "12000.00"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "disputeId": "dis_abc123",
    "resolution": "user_wins",
    "notes": "Agent sent to wrong account number",
    "resolvedAt": "2025-10-22T15:00:00Z"
  }
}
```

---

### GET /api/v1/admin/analytics

Get platform analytics.

**Headers**: `Authorization: Bearer <admin_token>`

**Query Parameters**:

- `period` (optional): `today`, `week`, `month`, `year`, `all`

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 10534,
      "active": 4287,
      "new": 156
    },
    "transactions": {
      "total": 45678,
      "volume": "15678900.00",
      "fees": "234567.00"
    },
    "agents": {
      "total": 25,
      "active": 22,
      "pending": 3
    },
    "merchants": {
      "total": 89,
      "active": 78
    },
    "tokens": {
      "NT": {
        "totalSupply": "8750000.00",
        "activeWallets": 8234
      },
      "CT": {
        "totalSupply": "19250000",
        "activeWallets": 2156
      }
    }
  }
}
```

---

## WebSocket Events

### Connection

**URL**: `wss://api.afritoken.com/ws`

**Authentication**: Send access token on connection:

```javascript
const socket = io("wss://api.afritoken.com", {
  auth: {
    token: "Bearer <access_token>",
  },
});
```

### Client → Server Events

**join_room**

```javascript
socket.emit("join_room", {
  roomId: "user:usr_1a2b3c4d",
});
```

**leave_room**

```javascript
socket.emit("leave_room", {
  roomId: "user:usr_1a2b3c4d",
});
```

### Server → Client Events

**balance_update**

```javascript
socket.on("balance_update", (data) => {
  // data: { tokenType: 'NT', newBalance: '8995.00' }
});
```

**transaction_status**

```javascript
socket.on("transaction_status", (data) => {
  // data: { transactionId: 'txn_abc123', status: 'completed' }
});
```

**agent_notification**

```javascript
socket.on("agent_notification", (data) => {
  // data: { type: 'NEW_REQUEST', transactionId: 'mnt_xyz789' }
});
```

**rate_update**

```javascript
socket.on("rate_update", (data) => {
  // data: { from: 'NT', to: 'CT', rate: '2.2' }
});
```

**notification**

```javascript
socket.on("notification", (data) => {
  // data: { id: 'ntf_abc123', type: 'TOKENS_RECEIVED', message: '...' }
});
```

**dispute_update**

```javascript
socket.on("dispute_update", (data) => {
  // data: { disputeId: 'dis_abc123', status: 'resolved' }
});
```

---

## Best Practices

### 1. Authentication

- Store tokens securely (iOS Keychain, Android Keystore)
- Implement token refresh before expiration
- Handle 401 errors globally (redirect to login)
- Clear tokens on logout

### 2. Error Handling

- Always check `success` field in response
- Display user-friendly error messages
- Log errors for debugging
- Implement retry logic for network failures

### 3. Rate Limiting

- Check rate limit headers
- Implement exponential backoff on 429 errors
- Cache frequently accessed data
- Use WebSocket for real-time updates instead of polling

### 4. Pagination

- Always use pagination for lists
- Implement infinite scroll or load more
- Cache paginated results
- Handle empty states

### 5. WebSocket

- Implement reconnection logic
- Handle connection drops gracefully
- Subscribe to relevant rooms only
- Unsubscribe when leaving screens

### 6. Performance

- Use appropriate page limits (20-50 items)
- Implement image lazy loading
- Cache static data (rates, agent lists)
- Debounce search inputs

### 7. Security

- Never log sensitive data (tokens, passwords)
- Validate all user inputs
- Use HTTPS for all requests
- Implement certificate pinning (optional, for extra security)

---

## SDK Examples

### JavaScript/React Native

```javascript
import axios from "axios";

const API_BASE_URL = "https://api.afritoken.com/v1";

class AfriTokenAPI {
  constructor(accessToken) {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // Interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Refresh token logic here
          return this.retryRequest(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  // Get user wallets
  async getWallets() {
    const response = await this.client.get("/wallets");
    return response.data;
  }

  // Transfer tokens
  async transferTokens(recipient, tokenType, amount, note) {
    const response = await this.client.post("/transactions/transfer", {
      recipient,
      tokenType,
      amount,
      note,
    });
    return response.data;
  }

  // Swap tokens
  async swapTokens(fromToken, toToken, amount) {
    const response = await this.client.post("/tokens/swap", {
      fromToken,
      toToken,
      amount,
    });
    return response.data;
  }
}

export default AfriTokenAPI;
```

### Usage Example

```javascript
const api = new AfriTokenAPI(userAccessToken);

// Get wallets
try {
  const wallets = await api.getWallets();
  console.log("NT Balance:", wallets.data.wallets[0].balance);
} catch (error) {
  console.error("Error:", error.response?.data?.error?.message);
}

// Transfer tokens
try {
  const transfer = await api.transferTokens(
    "jane@example.com",
    "NT",
    "1000.00",
    "Lunch money"
  );
  console.log("Transfer successful:", transfer.data.id);
} catch (error) {
  if (error.response?.data?.error?.code === "INSUFFICIENT_BALANCE") {
    alert("You don't have enough tokens");
  }
}
```

---

## Testing

### Test Users

**Staging Environment**: `https://api-staging.afritoken.com`

Test accounts (staging only):

```
User Account:
Email: test.user@afritoken.com
Password: TestPass123!

Agent Account:
Email: test.agent@afritoken.com
Password: TestPass123!

Merchant Account:
Email: test.merchant@afritoken.com
Password: TestPass123!
```

### Postman Collection

Import our Postman collection for easy testing:

```
https://api.afritoken.com/docs/postman-collection.json
```

### cURL Examples

**Register User**:

```bash
curl -X POST https://api.afritoken.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "country": "Nigeria"
  }'
```

**Login**:

```bash
curl -X POST https://api.afritoken.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Get Wallets**:

```bash
curl -X GET https://api.afritoken.com/v1/wallets \
  -H "Authorization: Bearer <access_token>"
```

**Transfer Tokens**:

```bash
curl -X POST https://api.afritoken.com/v1/transactions/transfer \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "jane@example.com",
    "tokenType": "NT",
    "amount": "1000.00",
    "note": "Lunch money"
  }'
```

---

## Changelog

### v1.0.0 (2025-10-22)

- Initial API release
- Authentication endpoints
- User management
- Wallet operations
- Transaction flows (P2P, mint, burn, swap)
- Agent system
- Merchant features
- WebSocket real-time updates

### Future Versions

**v1.1.0 (Planned)**

- Recurring payments
- Group savings pools
- Advanced analytics
- Bulk operations

**v2.0.0 (Planned)**

- Additional token support
- DeFi integrations
- Third-party API access
- Webhook notifications

---

## Support

### Documentation

- Full API docs: https://docs.afritoken.com
- Developer portal: https://developers.afritoken.com
- Status page: https://status.afritoken.com

### Contact

- Technical support: dev@afritoken.com
- Bug reports: GitHub Issues
- Feature requests: GitHub Discussions
- Security issues: security@afritoken.com

### Response Times

- Critical issues: 1 hour
- High priority: 4 hours
- Medium priority: 24 hours
- Low priority: 72 hours

---

**Last Updated**: October 22, 2025  
**Version**: 1.0.0  
**Maintained by**: AfriToken Development Team
