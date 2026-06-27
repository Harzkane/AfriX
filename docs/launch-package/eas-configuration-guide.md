# EAS Build & Submission Guide (Expo Application Services)

This guide provides step-by-step instructions to compile your production binaries (`.aab` for Google Play Store, `.ipa` for Apple App Store) using Expo Application Services (EAS) and submit them for review.

---

## 🛠️ Step 1 — Prerequisites

Make sure you have:
1.  An **Expo Account** (register at [https://expo.dev](https://expo.dev) if you don't have one).
2.  A **Google Play Developer Account** (which you have completed!).
3.  An **Apple Developer Account** (if submitting to Apple iOS App Store).
4.  Installed the **EAS CLI** globally on your Mac terminal:
    ```bash
    npm install -g eas-cli
    ```

---

## 🔑 Step 2 — Login and Link Project

Open your terminal and navigate to the mobile app folder:
```bash
cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX-mobile
```

1.  **Log in to your Expo account:**
    ```bash
    eas login
    ```
    *Enter your Expo credentials when prompted.*

2.  **Configure and link the project to your Expo dashboard:**
    ```bash
    eas project:init
    ```
    *Select your Expo username. It will automatically detect the app name "AfriX" and configure the project ID in your `app.json`.*

---

## 📦 Step 3 — Build for Google Play Store (Android)

To submit to the Google Play Store, you need to generate an **Android App Bundle (.aab)** file.

Run the build command:
```bash
eas build --platform android --profile production
```

### What happens during the build:
1.  **Credentials Setup:** EAS will ask if you want to generate a new Keystore. Select **Yes (Generate a new keystore)**. Expo will securely store your signing credentials on their servers, so you don't lose them.
2.  **Compilation:** The build will run in the Expo cloud. You can monitor the progress via the link printed in the terminal or close the terminal and check the Expo web dashboard.
3.  **Download:** Once the build succeeds, EAS will provide a download link for the `.aab` file. Download this file to your computer.

---

## 🍎 Step 4 — Build for Apple App Store (iOS)

To submit to the Apple App Store, you need to build a signed **iOS App Store package (.ipa)**.

Run the build command:
```bash
eas build --platform ios --profile production
```

### What happens during the build:
1.  **Apple ID Authentication:** EAS will ask you to log in with your paid Apple Developer ID.
2.  **Provisioning Profiles:** EAS will automatically handle creating your App ID, distribution certificate, and provisioning profiles inside your Apple Developer account.
3.  **Compilation:** The iOS bundle is compiled in the cloud.
4.  **Download:** Download the signed `.ipa` file once complete.

---

## 🚀 Step 5 — Submission to Stores

You have two options for submitting your builds:

### Option A: Automatic Submission (Recommended)
You can submit directly from the terminal. EAS will upload the build artifact directly to Google Play Console and App Store Connect:

*   **For Android (Google Play Console - Internal/Production):**
    ```bash
    eas submit --platform android
    ```
    *EAS will guide you through authenticating with your Google Service Account key.*

*   **For iOS (App Store Connect - TestFlight/Production):**
    ```bash
    eas submit --platform ios
    ```
    *EAS will request an Apple App-Specific Password to upload the `.ipa` directly to TestFlight.*

### Option B: Manual Upload
*   **Google Play Store:**
    1. Log in to [Google Play Console](https://play.google.com/console/).
    2. Select your app **AfriX – Digital Commerce**.
    3. Navigate to **Testing** -> **Internal testing** (or Production) in the sidebar.
    4. Click **Create new release**, and upload the `.aab` file you downloaded in Step 3.
*   **Apple App Store:**
    1. Download and open the **Transporter** app from the Mac App Store.
    2. Log in with your Apple ID.
    3. Drag and drop the `.ipa` file from Step 4 into Transporter and click **Deliver**. It will appear in App Store Connect under TestFlight within a few minutes.
