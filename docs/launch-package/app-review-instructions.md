# App Store Reviewer Guide (Instructions)

Copy and paste the appropriate sections of this guide into the **"App Review Notes"** (Apple App Store Connect) or **"App Access / Testing Instructions"** (Google Play Console) during submission.

---

## 📝 General App Review Note

AfriX – Digital Commerce is a closed-loop digital wallet, escrow, and merchant payment platform designed for individuals and businesses in African markets. The application enables users to store token balances (NT, CT, USDT), perform instant peer-to-peer (P2P) transfers by email, pay registered merchants, and learn through a built-in educational hub.

**Critical Notes for Reviewers:**
1.  **No Speculative Trading:** AfriX is **not** a public cryptocurrency exchange. It is a utility-focused wallet for digital commerce and merchant transactions. Users cannot buy or sell volatile crypto assets for financial investment on this platform.
2.  **No Real Financial Transaction Required:** All payment and agent flows demonstrated below can be fully evaluated in our sandbox environment using the provided test accounts. No real bank accounts, credit cards, or actual fiat currencies are required.
3.  **Local Biometrics:** The application requests biometric permissions (Face ID / Touch ID) to provide local device locking when the app transitions to the background. This can be enabled or disabled in the Settings -> Security tab.

---

## 🔑 Reviewer Test Credentials

To fully test the application, we have provided two test accounts. This allows you to evaluate the peer-to-peer transfer functionality.

### Account A (Primary Tester)
*   **Email:** `reviewer@nexgentech.dev`
*   **Password:** `Reviewer123!`
*   **Biometrics Option:** Toggle "App Lock" on in Settings to test Face ID resume.
*   **Pre-loaded Balances:** Pre-configured with test balances of NT, CT, and USDT to allow instant testing of Transfers, Swaps, and Merchant Payments.

### Account B (Secondary Tester - For P2P Transfer testing)
*   **Email:** `tester2@nexgentech.dev`
*   **Password:** `Reviewer123!`
*   **Purpose:** Use this email as the recipient when testing the "Send Tokens" transfer flow from Account A.

---

## 🕹️ Step-by-Step Test Guide

### 1. Account Dashboard & Wallets
*   Log in using **Account A** credentials.
*   The Home Dashboard displays three wallet cards: **NT Wallet**, **CT Wallet**, and **USDT Wallet**.
*   Verify that your pre-loaded balances are displayed.

### 2. Peer-to-Peer Transfer (Send & Receive)
*   On the Home screen, tap **Send**.
*   Select **USDT Wallet** (or any wallet with a balance).
*   Enter the recipient email: `tester2@nexgentech.dev`.
*   Enter an amount (e.g., `10`).
*   Tap **Continue** and then **Confirm Transfer**.
*   The tokens will instantly transfer to Account B, and the transaction will appear in your **Activity** log.

### 3. Token Swaps
*   On the Home screen, tap **Swap**.
*   Select **From** (e.g., NT) and **To** (e.g., USDT).
*   Enter an amount to swap.
*   The app displays the real-time exchange rate.
*   Tap **Swap Now** to execute the exchange instantly and view updated balances.

### 4. P2P Marketplace (Mint / Burn Escrow Flow)
*   On the Home screen, tap **Buy**.
*   Select a token (e.g., USDT) and enter an amount.
*   Select an available agent from the list (e.g., "Demo Test Agent").
*   The app will display the agent's payment instructions. Since this is a test sandbox, you can enter any dummy reference number and upload any screenshot from your photo library as "proof of payment."
*   Tap **Submit Proof**. The request will enter the pending review queue.

### 5. Educational Hub
*   Tap on **Education** in the bottom navigation (or settings).
*   Select a module (e.g., *What are Tokens?* or *Safety & Security*).
*   Review the instructional slides and take the short interactive quiz.
*   This demonstrates how we onboard users on safe digital wallet practices.

### 6. Local Biometrics Lock
*   Go to **Profile** (bottom tab) -> **Settings** -> **Security**.
*   Toggle **Biometric App Lock** to `ON`.
*   Press the device home button to send the app to the background, then open the app again.
*   The app will prompt you for Face ID/Touch ID to unlock, demonstrating local security.
