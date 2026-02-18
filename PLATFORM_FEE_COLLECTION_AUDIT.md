# Platform Fee Collection Audit Report

**Date:** February 17, 2026  
**Status:** ❌ **CRITICAL GAPS IDENTIFIED**

---

## Executive Summary

The platform **calculates fees** but **does NOT collect them into platform wallets**. Fees are deducted from users but never transferred to a platform treasury. This is a critical revenue gap that needs immediate implementation.

---

## Current State Analysis

### ✅ What EXISTS

1. **Fee Calculation Logic**
   - ✅ Transfer fees: 0.5% (0.005) - calculated in `walletService.js`
   - ✅ Merchant payment fees: 2% (configurable) - calculated in `transactionService.js` and `paymentController.js`
   - ✅ Agent commission fees: Tracked in transactions (goes to agents, not platform)
   - ✅ Platform fee constants defined in `constants.js`:
     ```javascript
     PLATFORM_FEES = {
       P2P_TRANSFER: 0.5,      // 0.5%
       TOKEN_SWAP: 1.5,         // 1.5%
       MERCHANT_COLLECTION: 2.0, // 2%
       AGENT_FACILITATION: 1.0   // 1%
     }
     ```

2. **Treasury Infrastructure (Partial)**
   - ✅ USDT treasury address exists (`TREASURY_ADDRESS` in `treasury.js`)
   - ✅ Used for agent USDT deposits only
   - ❌ **NOT used for fee collection**

3. **Transaction Fee Tracking**
   - ✅ `Transaction.fee` field stores fee amounts
   - ❌ **Fees are recorded but never collected**

---

## ❌ Critical Missing Components

### 1. **No Platform/System User Account**
- **Issue:** There's no dedicated platform/system user to own platform wallets
- **Impact:** Cannot create platform wallets without a user_id
- **Solution Needed:** Create a system/platform user account (or use a special admin account)

### 2. **No Platform Wallets for NT and CT**
- **Issue:** Only USDT treasury address exists (for agent deposits)
- **Missing:**
  - ❌ Platform NT wallet
  - ❌ Platform CT wallet  
  - ❌ Platform USDT wallet (for fees, not just agent deposits)
- **Impact:** Fees cannot be collected into platform wallets

### 3. **Fee Collection Logic Missing**
Fees are calculated but **never transferred to platform wallets**:

#### a) Transfer Fees (P2P)
**Location:** `afriX_backend/src/services/walletService.js` (line 167-238)
- ✅ Fee calculated: `fee = transferAmount * 0.005`
- ✅ Fee deducted from sender: `totalDebit = transferAmount + fee`
- ❌ **Fee NOT sent to platform wallet** - it's just deducted and lost!

**Current Code:**
```javascript
const fee = transferAmount * FEE_RATE;
const totalDebit = transferAmount + fee;
// ... sender debited totalDebit
// ... receiver credited transferAmount
// ❌ FEE IS LOST - NOT COLLECTED!
```

#### b) Merchant Payment Fees
**Location:** `afriX_backend/src/services/transactionService.js` (line 133-135)
- ✅ Fee calculated: `fee = (amount * feePercent) / 100`
- ✅ Fee deducted from payment: `netAmount = amount - fee`
- ❌ **Fee NOT sent to platform wallet** - merchant gets netAmount, fee disappears!

**Current Code:**
```javascript
const fee = (parseFloat(amount) * feePercent) / 100;
const netAmount = parseFloat(amount) - fee;
// ... customer debited full amount
// ... merchant credited netAmount
// ❌ FEE IS LOST - NOT COLLECTED!
```

#### c) Swap Fees
**Location:** `afriX_backend/src/services/walletService.js` (line 241-318)
- ❌ **NO FEE IMPLEMENTED AT ALL**
- ❌ Fee constant exists (`PLATFORM_FEES.TOKEN_SWAP = 1.5%`) but not used
- ❌ Swaps happen with zero platform fee collection

**Current Code:**
```javascript
// No fee calculation or collection!
const receiveAmount = swapAmount * exchangeRate;
// ... tokens swapped directly
// ❌ NO FEE COLLECTED!
```

#### d) Agent Commission Fees
**Location:** `afriX_backend/src/services/transactionService.js` (line 264-273, 339-348)
- ✅ Commission calculated and tracked
- ✅ Commission goes to agent (correct)
- ❌ **Platform facilitation fee NOT collected** (should be separate from agent commission)

---

## Required Implementation

### Phase 1: Platform Infrastructure Setup

#### 1.1 Create Platform System User
**File:** `afriX_backend/src/services/platformService.js` (NEW)

```javascript
/**
 * Get or create platform system user
 * This user owns all platform fee wallets
 */
async function getPlatformUser() {
  // Check if platform user exists
  let platformUser = await User.findOne({
    where: { email: 'platform@afritoken.com' } // or use a flag
  });
  
  if (!platformUser) {
    // Create platform user
    platformUser = await User.create({
      email: 'platform@afritoken.com',
      password_hash: bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 10),
      full_name: 'AfriToken Platform',
      country_code: 'NG',
      role: 'admin', // or create 'platform' role
      email_verified: true,
      // Mark as system user (add flag to User model)
    });
  }
  
  return platformUser;
}
```

#### 1.2 Create Platform Wallets
**File:** `afriX_backend/src/services/platformService.js`

```javascript
/**
 * Get or create platform wallets for NT, CT, USDT
 */
async function getPlatformWallets() {
  const platformUser = await getPlatformUser();
  
  const wallets = {};
  for (const tokenType of ['NT', 'CT', 'USDT']) {
    wallets[tokenType] = await walletService.getOrCreateWallet(
      platformUser.id,
      tokenType
    );
  }
  
  return wallets;
}
```

#### 1.3 Add Platform Wallet Constants
**File:** `afriX_backend/src/config/constants.js`

```javascript
// Add to constants
const PLATFORM_CONFIG = {
  SYSTEM_USER_EMAIL: 'platform@afritoken.com',
  FEE_COLLECTION_ENABLED: true,
};
```

---

### Phase 2: Implement Fee Collection

#### 2.1 Update Transfer Service
**File:** `afriX_backend/src/services/walletService.js`

**Current (BROKEN):**
```javascript
const fee = transferAmount * FEE_RATE;
const totalDebit = transferAmount + fee;
// Fee deducted but never collected!
```

**Fixed:**
```javascript
const fee = transferAmount * FEE_RATE;
const totalDebit = transferAmount + fee;

// Get platform wallet for this token type
const platformWallets = await getPlatformWallets();
const platformWallet = platformWallets[token_type];

// Collect fee to platform wallet
platformWallet.balance = parseFloat(platformWallet.balance) + fee;
await platformWallet.save({ transaction: t });

// Update transaction to include platform wallet
tx.fee_wallet_id = platformWallet.id; // Add this field to Transaction model
```

#### 2.2 Update Merchant Payment Service
**File:** `afriX_backend/src/services/transactionService.js`

**Current (BROKEN):**
```javascript
const fee = (parseFloat(amount) * feePercent) / 100;
const netAmount = parseFloat(amount) - fee;
// Fee deducted but never collected!
```

**Fixed:**
```javascript
const fee = (parseFloat(amount) * feePercent) / 100;
const netAmount = parseFloat(amount) - fee;

// Get platform wallet
const platformWallets = await getPlatformWallets();
const platformWallet = platformWallets[token_type];

// Collect fee to platform wallet
platformWallet.balance = parseFloat(platformWallet.balance) + fee;
await platformWallet.save({ transaction: t });

tx.fee_wallet_id = platformWallet.id;
```

#### 2.3 Implement Swap Fees
**File:** `afriX_backend/src/services/walletService.js`

**Current (NO FEES):**
```javascript
const receiveAmount = swapAmount * exchangeRate;
// No fee!
```

**Fixed:**
```javascript
const { PLATFORM_FEES } = require("../config/constants");
const swapFeePercent = PLATFORM_FEES.TOKEN_SWAP / 100; // 1.5%
const swapFee = swapAmount * swapFeePercent;
const netSwapAmount = swapAmount - swapFee;
const receiveAmount = netSwapAmount * exchangeRate;

// Get platform wallet for FROM token (fee collected in source token)
const platformWallets = await getPlatformWallets();
const platformWallet = platformWallets[fromToken];

// Collect fee
platformWallet.balance = parseFloat(platformWallet.balance) + swapFee;
await platformWallet.save({ transaction: t });

tx.fee = swapFee;
tx.fee_wallet_id = platformWallet.id;
```

---

### Phase 3: Database Schema Updates

#### 3.1 Add `fee_wallet_id` to Transaction Model
**File:** `afriX_backend/src/models/Transaction.js`

```javascript
fee_wallet_id: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: "wallets",
    key: "id",
  },
  comment: "Platform wallet that received the fee",
},
```

#### 3.2 Migration Script
**File:** `afriX_backend/migrations/XXX-add-fee-wallet-to-transactions.js`

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transactions', 'fee_wallet_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'wallets',
        key: 'id',
      },
    });
  },
  
  down: async (queryInterface) => {
    await queryInterface.removeColumn('transactions', 'fee_wallet_id');
  },
};
```

---

### Phase 4: Admin Dashboard Integration

#### 4.1 Platform Fee Analytics
**File:** `afriX_backend/src/controllers/adminFinancialController.js`

Add endpoints to:
- View platform fee balances (NT, CT, USDT)
- View fee collection history
- Export fee reports
- View fee collection by transaction type

---

## Implementation Checklist

### Infrastructure
- [ ] Create `platformService.js` with `getPlatformUser()` and `getPlatformWallets()`
- [ ] Create platform system user account (one-time setup script)
- [ ] Create platform wallets for NT, CT, USDT
- [ ] Add `PLATFORM_CONFIG` to constants

### Fee Collection Logic
- [ ] Update `walletService.transfer()` to collect transfer fees
- [ ] Update `transactionService.processMerchantPayment()` to collect merchant fees
- [ ] Implement swap fees in `walletService.swap()`
- [ ] Add platform facilitation fee for agent transactions (optional)

### Database
- [ ] Add `fee_wallet_id` field to Transaction model
- [ ] Create migration for `fee_wallet_id`
- [ ] Update transaction queries to include fee wallet info

### Testing
- [ ] Test transfer fee collection
- [ ] Test merchant payment fee collection
- [ ] Test swap fee collection
- [ ] Verify platform wallet balances increase correctly
- [ ] Test fee collection across all token types (NT, CT, USDT)

### Admin Features
- [ ] Add platform fee balance endpoint
- [ ] Add fee collection report endpoint
- [ ] Add fee analytics to admin dashboard
- [ ] Add fee export functionality

---

## Revenue Impact

### Current State: **$0 Revenue from Fees**
- All fees calculated but **lost/not collected**
- Platform generates no revenue from transactions

### After Implementation: **Full Fee Revenue**
- Transfer fees: 0.5% of all P2P transfers
- Swap fees: 1.5% of all token swaps
- Merchant fees: 2% of all merchant payments
- Platform facilitation fees: 1% of agent transactions (if implemented)

---

## Priority: **CRITICAL** 🔴

This is a **revenue-critical** gap. The platform cannot generate income without fee collection. Implementation should be prioritized immediately.

---

## Next Steps

1. **Immediate:** Create platform service and wallets
2. **Week 1:** Implement fee collection in all transaction types
3. **Week 2:** Add database migrations and admin features
4. **Week 3:** Testing and validation
5. **Week 4:** Deploy to production

---

## Questions to Resolve

1. **Platform User Approach:**
   - Option A: Create dedicated system user (`platform@afritoken.com`)
   - Option B: Use special admin account
   - Option C: Add `is_platform` flag to User model
   - **Recommendation:** Option A (cleanest separation)

2. **Fee Wallet Addresses:**
   - Should platform wallets have separate blockchain addresses?
   - Or use existing treasury address?
   - **Recommendation:** Separate addresses for clarity and auditability

3. **Fee Collection Timing:**
   - Collect immediately on transaction?
   - Or batch collection?
   - **Recommendation:** Immediate collection (simpler, more transparent)

4. **Agent Commission vs Platform Fee:**
   - Should platform take a cut from agent transactions?
   - Or only from direct user transactions?
   - **Recommendation:** Platform fee separate from agent commission (both can exist)

---

**Report Generated:** February 17, 2026  
**Status:** Ready for Implementation
