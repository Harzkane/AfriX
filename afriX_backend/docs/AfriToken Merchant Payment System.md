# AfriToken Merchant Payment System

## Overview

The AfriToken Merchant Payment System enables businesses to accept token payments through the AfriToken platform. This system provides a seamless way for merchants to receive payments in NT (Naira Token) and CT (CFA Token) currencies, with automatic settlement to their wallets.

## Features

- **Merchant Registration**: Businesses can register as merchants on the platform
- **Payment Collection**: Accept payments from AfriToken users
- **QR Code Generation**: Generate QR codes for in-person payments
- **Transaction History**: View and manage payment history
- **API Integration**: Connect your business systems via API
- **Webhook Notifications**: Receive real-time payment updates

## Merchant Registration Process

1. **Sign Up**: Create a standard AfriToken user account
2. **Register as Merchant**: Complete the merchant registration form with business details
3. **Verification**: Submit required documentation for business verification
4. **Approval**: AfriToken team reviews and approves merchant account
5. **Setup**: Configure settlement wallet and payment settings

## Payment Flow

### Customer-Initiated Payment

1. Customer selects "Pay" in their AfriToken app
2. Customer scans merchant QR code or enters merchant ID
3. Customer enters payment amount and confirms
4. Merchant receives notification of payment
5. Transaction is recorded and funds are settled to merchant wallet

### Merchant-Initiated Payment

1. Merchant generates payment request with amount and description
2. System creates QR code or payment link
3. Customer scans QR code or opens link
4. Customer confirms payment in their app
5. Merchant receives confirmation and funds are settled

## Integration Options

### Web Integration

Merchants can integrate AfriToken payments into their websites using:

1. **Payment Button**: Simple HTML/JavaScript button
2. **Payment Page**: Redirect customers to AfriToken payment page
3. **API Integration**: Direct API calls for custom integration

### Mobile Integration

For mobile apps, merchants can use:

1. **Deep Linking**: Direct customers to AfriToken app
2. **SDK Integration**: Embed payment functionality in merchant app
3. **QR Code Scanning**: Generate and scan QR codes

## API Reference

The Merchant API provides endpoints for:

- Merchant registration and profile management
- Payment request generation
- Transaction verification
- Payment history retrieval

### Base URL

```
https://api.afritoken.com/v1
```

### Authentication

All API requests require authentication using JWT Bearer tokens:

```
Authorization: Bearer {your_token}
```

### Key Endpoints

#### Merchant Registration

```
POST /merchants/register
```

#### Create Payment Request

```
POST /merchants/payment-request
```

#### Process Payment

```
POST /payments/process
```

#### Verify Payment

```
GET /payments/{id}/verify
```

## Postman Testing Guide

This section provides a step-by-step guide for testing the Merchant Payment System endpoints using Postman.

### Setting Up Postman

1. Download the AfriToken Postman Collection from the repository or import using this link: `https://api.afritoken.com/postman/merchant-collection.json`
2. Set up environment variables:
   - `base_url`: Your API base URL (e.g., `http://localhost:3000/api/v1` for local testing)
   - `auth_token`: Your JWT authentication token

### Testing Merchant Registration

**Request:**
- Method: `POST`
- URL: `{{base_url}}/merchants/register`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{auth_token}}`
- Body:
```json
{
  "business_name": "Test Merchant",
  "display_name": "Test Shop",
  "business_type": "retail",
  "description": "A test merchant account",
  "business_email": "merchant@example.com",
  "business_phone": "+2348012345678",
  "country": "Nigeria",
  "city": "Lagos",
  "address": "123 Test Street",
  "settlement_wallet_id": "{{wallet_id}}",
  "default_currency": "NT"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Merchant registered successfully",
  "data": {
    "id": "uuid-value",
    "business_name": "Test Merchant",
    "api_key": "generated-api-key",
    "verification_status": "pending"
  }
}
```

### Testing Merchant Profile Retrieval

**Request:**
- Method: `GET`
- URL: `{{base_url}}/merchants/profile`
- Headers:
  - `Authorization`: `Bearer {{auth_token}}`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-value",
    "business_name": "Test Merchant",
    "display_name": "Test Shop",
    "business_type": "retail",
    "description": "A test merchant account",
    "logo_url": null,
    "business_email": "merchant@example.com",
    "business_phone": "+2348012345678",
    "country": "Nigeria",
    "city": "Lagos",
    "address": "123 Test Street",
    "verification_status": "pending",
    "settlement_wallet": {
      "id": "wallet-uuid",
      "balance": "1000.00",
      "currency": "NT"
    }
  }
}
```

### Testing Payment Request Generation

**Request:**
- Method: `POST`
- URL: `{{base_url}}/merchants/payment-request`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{auth_token}}`
- Body:
```json
{
  "amount": "100.00",
  "currency": "NT",
  "description": "Payment for order #12345"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "merchant_id": "merchant-uuid",
    "business_name": "Test Merchant",
    "amount": "100.00",
    "currency": "NT",
    "description": "Payment for order #12345",
    "timestamp": "2023-06-22T12:34:56.789Z",
    "qr_code": "data:image/png;base64,..."
  }
}
```

### Testing Payment Processing

**Request:**
- Method: `POST`
- URL: `{{base_url}}/payments/process`
- Headers:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{auth_token}}`
- Body:
```json
{
  "merchant_id": "{{merchant_id}}",
  "amount": "50.00",
  "currency": "NT",
  "description": "Test payment"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "data": {
    "transaction_id": "transaction-uuid",
    "reference": "TRX12345678",
    "amount": "50.00",
    "fee": "0.75",
    "net_amount": "49.25",
    "currency": "NT",
    "status": "completed",
    "timestamp": "2023-06-22T12:34:56.789Z"
  }
}
```

### Testing Payment Verification

**Request:**
- Method: `GET`
- URL: `{{base_url}}/payments/{{transaction_id}}/verify`
- Headers:
  - `Authorization`: `Bearer {{auth_token}}`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "reference": "TRX12345678",
    "status": "completed",
    "verified": true
  }
}
```

### Testing Payment Details Retrieval

**Request:**
- Method: `GET`
- URL: `{{base_url}}/payments/{{transaction_id}}`
- Headers:
  - `Authorization`: `Bearer {{auth_token}}`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "reference": "TRX12345678",
    "amount": "50.00",
    "fee": "0.75",
    "currency": "NT",
    "description": "Test payment",
    "status": "completed",
    "created_at": "2023-06-22T12:34:56.789Z",
    "customer": {
      "id": "customer-uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "merchant": {
      "id": "merchant-uuid",
      "business_name": "Test Merchant",
      "display_name": "Test Shop",
      "logo_url": null
    }
  }
}
```

### Testing Payment Cancellation

**Request:**
- Method: `POST`
- URL: `{{base_url}}/payments/{{transaction_id}}/cancel`
- Headers:
  - `Authorization`: `Bearer {{auth_token}}`

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment cancelled successfully",
  "data": {
    "id": "transaction-uuid",
    "reference": "TRX12345678",
    "status": "cancelled",
    "cancelled_at": "2023-06-22T13:45:56.789Z"
  }
}
```

### Testing API Key Regeneration

**Request:**
- Method: `POST`
- URL: `{{base_url}}/merchants/regenerate-api-key`
- Headers:
  - `Authorization`: `Bearer {{auth_token}}`

**Expected Response:**
```json
{
  "success": true,
  "message": "API key regenerated successfully",
  "data": {
    "id": "merchant-uuid",
    "api_key": "new-api-key-value"
  }
}
```

## Fee Structure

- Standard fee: 1.5% per transaction
- Premium merchants: Custom fee structure based on volume
- Settlement: Real-time or scheduled (daily, weekly)

## Security

- All API requests are encrypted using TLS
- API keys are required for server-to-server communication
- Webhook notifications are signed for verification
- Two-factor authentication for merchant dashboard

## Support

For merchant support:
- Email: merchants@afritoken.com
- Phone: +234-XXX-XXX-XXXX
- Documentation: https://docs.afritoken.com/merchants

## Getting Started

To get started as a merchant:
1. Complete the merchant registration process
2. Set up your settlement wallet
3. Generate your API keys
4. Integrate payment collection into your business
5. Start accepting AfriToken payments