import React, { useEffect } from "react";
import { useRouter } from "expo-router";

/**
 * Settings tab is hidden from the tab bar. All account/settings entry points
 * live under Profile (Security, Notifications, etc.). This route redirects
 * to Profile so deep links to /settings still work.
 */
export default function SettingsScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(tabs)/profile");
  }, [router]);

  return null;
}

