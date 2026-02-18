// src/services/pushNotifications.ts
// Registers device push token with backend for OS-level notifications (APNs/FCM).

import * as Notifications from "expo-notifications";
import apiClient from "@/services/apiClient";

// Show alert, sound, and badge when a notification is received (foreground or background)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldAnimate: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permission, get device push token (FCM/APNs),
 * and send it to the backend so firebase-admin can send OS-level pushes.
 * Call this after login (and optionally on app start when already authenticated).
 */
export async function registerPushTokenIfNeeded(): Promise<void> {
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

  const token = await Notifications.getDevicePushTokenAsync();
  if (!token?.data) {
    console.log("📱 No device push token (simulator or Expo Go may not support push)");
    return;
  }

  try {
    await apiClient.post("/users/fcm-token", {
      fcm_token: token.data,
    });
    console.log("✅ Push token registered on backend");
  } catch (error) {
    console.error("Failed to register push token:", error);
  }
}
