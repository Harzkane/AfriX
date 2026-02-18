# AfriX Mobile – Push Notifications Setup (OS-level Alerts)

This guide summarizes what **you** need to do to get **real phone notifications** (lock-screen / banner alerts) working for AfriX, on top of the in-app notification system we already implemented.

The backend is already wired with **Firebase Admin** and `fcm_token` on `User`, and the mobile app has an in-app inbox + badges. These steps are about enabling **OS-level push** on iOS/Android.

---

## 1. Overview

Flow for OS-level alerts:

1. Mobile app asks the user for **notification permission**.
2. Mobile app gets a **device push token** (APNs/FCM) using `expo-notifications`.
3. Mobile app sends that token to the backend (to `/users/fcm-token`).
4. Backend uses **firebase-admin** to send push notifications to that token when events occur (mint, burn, withdrawal, etc.).

Backend pieces you already have:

- `User.fcm_token` column
- `POST /api/v1/users/fcm-token` → `userController.updateFcmToken`
otificationService.sendPush(userIds, title, message, data)` using **Firebase Admin**
- `notificationService.deliver()` that creates inbox notifications and (optionally) calls `sendPush`.

So most of the heavy lifting is done on the backend.

You still need to:

- Configure **Apple Push Notification (APNs)** + FCM for iOS.
- (Optionally) confirm **FCM** is correctly set for Android.
- Add **`expo-notifications`** client logic to the mobile app to register and upload device tokens.

---

## 2. Apple Developer & Firebase setup (one-time)

> **Requires paid Apple Developer Program ($99/year).** Free/personal Apple IDs cannot access Certificates, Identifiers & Profiles or use the Push Notifications capability. Do all of section 2 when you have an enrolled account.

### 2.1 Apple Developer – enable push for the app ID

1. Go to **Apple Developer → Certificates, Identifiers & Profiles**.
2. Under **Identifiers**, find `com.codewithharz.afriX`.
3. Open it and **enable** the capability **Push Notifications**.
4. Save/continue.

### 2.2 Create APNs Auth Key (.p8)
In the same Apple Developer account, go to **Keys**.
2. Click **+** to create a new key.
3. Name it e.g. `AfriX Push Key` and enable **Apple Push Notifications service (APNs)**.
4. Download the `.p8` file.
5. Note down:
   - **Key ID** (e.g. `ABCD1234`)
   - **Team ID** (from your Apple Developer account)

### 2.3 Configure APNs in Firebase (for iOS)

1. Go to your **Firebase** project used by `firebase-admin` in the backend.
2. In **Project Settings → Cloud Messaging**:
   - Under **Apple app configuration**, select your iOS app.
   - Upload the **APNs auth key (.p8)**.
   - Enter **Key ID** and **Team ID**.
   - Ensure the **bundle ID** is `com.codewithharz.afriX`.
3. Save.

Once this is done, FCM can send push notifications to iOS devices using APNs.

---

## 3. Mobile app changes (Expo / React Native)

> **Important:** These are code changes you should do in the repo + one dependency install.

### 3.1 Install `expo-notifications`

From `afriX-mobile/`:

```bash
npx expo install expo-notifications
```
xpo will add the right version and configure native bits for dev builds. You’ll rebuild dev clients or run in Expo Go depending on your workflow.

### 3.2 Update `app.json` for iOS push

Your current `app.json` (simplified):

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.codewithharz.afriX"
}
```

Add minimal push-related config:

```json
"ios": {
  "supportsTablet": true,
  "bundleIdentifier": "com.codewithharz.afriX",
  "config": {
    "usesNonExemptEncryption": false
  }
}
```

Nothing else needed here yet; APNs is mostly configured in Apple/Firebase.

### 3.3 Create a push helper: `src/services/pushNotifications.ts`

Create this file (or similar) in the mobile app:

```ts
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import apiClient from "@/services/apiClient";

// Global handler so notifications show alerts by default
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shoullaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushTokenIfNeeded() {
  // 1. Ask user for permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("🔕 Push notifications permission not granted");
    return;
  }

  // 2. Get device push token (FCM/APNs)
  const token = await Notifications.getDevicePushTokenAsync();
  if (!token?.data) {
    console.log("No device push token");
    return;
  }

  console.log("📱 Device push token:", token);

  // 3. Send to backend so firebase-admin can use it
  try {
    await apiClient.post("/users/fcm-token", {
      fcm_token: token.data,
    });
    console.log("✅ Push token registered on backend");
  } catch (error) {
    console.error("Failed to register push token:", er  }
}
```

### 3.4 Call `registerPushTokenIfNeeded` after login

The best time to register is **after a user logs in** (and maybe again when the app starts with an existing session).

In `src/stores/slices/authSlice.ts`, after a successful login (where you set `user`, `token`, `isAuthenticated: true`), add:

```ts
import { registerPushTokenIfNeeded } from "@/services/pushNotifications";

// inside the login success block, after setting user/token:
await registerPushTokenIfNeeded();
```

You can optionally also call it once on app startup (e.g. in the root layout) if `isAuthenticated` is already true, to re-sync tokens.

> Until you run `npx expo install expo-notifications`, importing this helper will fail – so do the install first.

---

## 4. Android notes

For Android:

- FCM is usually already configured if `firebase-admin` is working with your Firebase project.
- No extra Google config is needed on the client beyond `expo-notifications`; Expo’s Android build will embed the FCM config automatically wyou use EAS / dev builds (as long as you’ve linked the app in Firebase if required).

Once the device token is registered via `/users/fcm-token`, your existing backend `notificationService.sendPush(...)` calls will start delivering **system-level notifications** on Android too.

---

## 5. End-to-end test checklist

Once you’ve done the above:

1. **Rebuild / restart dev client** (depending on your workflow):
   - If using **Expo Go**: just `npx expo start -c` and reload.
   - If using a **development build** (`expo run:ios` / EAS dev build): rebuild after adding `expo-notifications`.
2. Log in on a **real device** (simulator/dev build/Expo Go).
3. Confirm in your backend DB that `users.fcm_token` is **non-null** for that user.
4. Trigger an event that calls `notificationService.deliver` with push allowed (e.g. mint confirmed, burn confirmed, withdrawal approved).
5. You should see a **system notification** even if the app is backgrounded.

If you don’t see anything:

- Check backend logs for **FCM Erlogs from `firebase-admin`.
- Verify APNs/FCM configuration in Firebase (for iOS).
- Confirm `fcm_token` stored for that user matches what `expo-notifications` printed.

---

## 6. What we have vs. what this adds

Already implemented:

- Backend notification models, routes, and `deliver()` pipeline.
- In-app inbox (`Notification center`), badges on Profile tab + row.
- Agent/user event hooks calling `deliver()`.

This document shows **what you need to do** to:

- Configure Apple & Firebase for push.
- Install and wire `expo-notifications` in the app to send `fcm_token` to the backend.

Once that’s done, your existing notification events will also produce **OS-level alerts** on both iOS and Android.
