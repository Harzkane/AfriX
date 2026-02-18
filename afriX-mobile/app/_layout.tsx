// afriX-mobile/app/_layout.tsx
import { Slot } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore } from "@/stores";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIncomingTransferListener } from "@/hooks/useIncomingTransferListener";

const BIOMETRIC_LOGIN_KEY = "biometric_login_enabled";

export default function RootLayout() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [appLocked, setAppLocked] = useState(false);
  const hasRedirected = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Global incoming transfer listener
  useIncomingTransferListener();

  // Step 1: Load auth
  useEffect(() => {
    initAuth().then(() => {
      setIsReady(true);
    });
  }, [initAuth]);

  // Step 2: Safe redirect ONCE
  useEffect(() => {
    if (!isReady || hasRedirected.current) return;

    if (isAuthenticated) {
      hasRedirected.current = true;
      router.replace("/");
    } else {
      hasRedirected.current = true;
      router.replace("/(auth)/welcome");
    }
  }, [isReady, isAuthenticated, router]);

  // Step 3: Require biometric when returning from background (app lock)
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = AppState.addEventListener("change", async (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      // Only prompt when coming back from background to active
      if (prevState === "background" && nextState === "active") {
        const biometricEnabled = await SecureStore.getItemAsync(BIOMETRIC_LOGIN_KEY);
        if (biometricEnabled !== "true") return;

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return;

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock AfriX",
          cancelLabel: "Cancel",
          fallbackLabel: "Use password",
          disableDeviceFallback: true,
        });

        if (!result.success) {
          setAppLocked(true);
        }
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  const handleUnlockWithBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock AfriX",
      cancelLabel: "Cancel",
      fallbackLabel: "Use password",
      disableDeviceFallback: true,
    });
    if (result.success) {
      setAppLocked(false);
    }
  };

  // Don't render anything until ready
  if (!isReady) {
    return null;
  }

  return (
    <PaperProvider>
      <Slot />
      {appLocked && isAuthenticated && (
        <View style={styles.lockOverlay}>
          <View style={styles.lockCard}>
            <Ionicons name="lock-closed" size={48} color="#00B14F" style={styles.lockIcon} />
            <Text style={styles.lockTitle}>AfriX is locked</Text>
            <Text style={styles.lockSubtitle}>Use Face ID to unlock and continue</Text>
            <TouchableOpacity style={styles.unlockButton} onPress={handleUnlockWithBiometric} activeOpacity={0.8}>
              <Ionicons name="finger-print" size={24} color="#FFFFFF" style={styles.unlockIcon} />
              <Text style={styles.unlockButtonText}>Unlock with Face ID</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 9999,
  },
  lockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    marginHorizontal: 24,
    maxWidth: 340,
  },
  lockIcon: {
    marginBottom: 16,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  unlockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00B14F",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    minWidth: 220,
  },
  unlockIcon: {
    marginRight: 10,
  },
  unlockButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
