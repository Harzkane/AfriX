# Google Play Store Listing Specification

This document contains the metadata, description copy, and settings required to configure the AfriX listing on the Google Play Console. Use this copy exactly as-is to ensure a quick approval process and avoid crypto-speculation flags.

---

## 📋 General Details

| Listing Field | Specification / Value | Character Limit |
| :--- | :--- | :--- |
| **App Name (Title)** | `AfriX – Digital Commerce` | Max 30 characters *(Currently 25)* |
| **Short Description** | `Secure digital wallet, escrow protection, peer-to-peer exchange & merchant pay.` | Max 80 characters *(Currently 79)* |
| **App Category** | `Finance` | N/A |
| **App Type** | `App` (Not Game) | N/A |
| **Content Rating** | Target `Everyone` (or `Teen` if P2P exchange requires higher age limit by country) | N/A |

---

## 📝 Full Description (Max 4,000 Characters)

Copy and paste the following content into the **Full Description** box in Google Play Console:

```text
AfriX is a secure, multi-token digital commerce and settlement platform designed to help individuals, businesses, and communities move value across Africa. 

Whether you're sending digital value to friends, paying merchants, managing multiple token balances, or participating in trusted peer-to-peer exchanges, AfriX provides a secure and user-friendly experience built for African markets.

Key Features:

• Multi-Token Wallet Support: Manage your digital balances in NT, CT, and USDT securely from a single, unified interface.
• P2P Marketplace with Escrow: Conduct digital exchanges with confidence. AfriX's built-in escrow system locks value until both parties verify that the payment terms have been met.
• Instant Transfers: Send and receive digital value instantly across the network using only an email address.
• Merchant Payment Portal: Pay for goods and services at participating merchants seamlessly using digital tokens.
• Transaction Ledger: Access complete, real-time transaction receipts and histories for transparent wallet auditing.
• Secure Authentication: Protect your funds with biometric log-in (Face ID/Touch ID) and Two-Factor Authentication (2FA).
• Real-Time Exchange Rates: Monitor live currency and token swap rates within the app.
• Educational Hub: Built-in learning modules to help users understand digital wallets, escrow systems, and security best practices.

Built for Trust:
AfriX is built by NexGen Tech Innovations to provide an enterprise-grade security layer for digital commerce. Advanced account verification (KYC), secure transaction proofs, and auto-dispute systems ensure that your value transfers are always protected.

Move value with confidence.
Move commerce forward.
Move with AfriX.
```

---

## 🔍 Tags & Keywords (For Console Search Optimization)

Add the following tags in the Play Console to improve organic search visibility:
1. `Finance`
2. `Digital Wallet`
3. `Payments`
4. `Peer-to-Peer`
5. `Escrow`
6. `Merchant Payments`
7. `Settlement`
8. `Financial Technology`

---

## 🛡️ Privacy Labels (Data Safety Section)

You must declare that the app collects the following user data. Play Store requires clear justifications for each:

*   **Personal Info**:
    *   *Name / Email Address / Phone Number*: Collected for account creation, communication, and security verification.
*   **Financial Info**:
    *   *User Payment Info / Transaction History*: Collected to facilitate P2P transfers, merchant payments, and ledger displays.
*   **Photos and Videos**:
    *   *Photos (Optional)*: Collected only when users upload payment proof screenshots or KYC identification documents.
*   **Location**:
    *   *Approximate Location*: Used to detect country-specific currency settings and comply with regional financial regulations.
*   **App Info and Performance**:
    *   *Crash logs / Diagnostics*: Used to improve app stability and fix bugs.
*   **Device or Other IDs**:
    *   *Device ID*: Collected for push notification delivery and multi-device security verification.

---

## 🔒 App Permissions

AfriX requests minimal permissions. In the Play Console declaration, confirm these are required:
1.  **Photos/Media Library (`expo-image-picker`)**: Used exclusively to select and upload payment receipts (proof of transfer) and KYC identification files.
2.  **Biometric hardware (`expo-local-authentication`)**: Used to unlock the application securely.
