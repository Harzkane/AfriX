// File: src/utils/debugAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import apiClient from "../services/apiClient";

// ============================================
// DEBUG HELPER (Add to dashboard temporarily)
// ============================================
export const debugAuth = async () => {
  console.log("\n=== AUTH DEBUG ===");

  const secureToken = await SecureStore.getItemAsync("auth_token");
  console.log(
    "SecureStore token:",
    secureToken ? secureToken.slice(0, 30) + "..." : "NONE"
  );

  const asyncData = await AsyncStorage.getItem("auth-storage");
  console.log("AsyncStorage:", asyncData ? "Has data" : "EMPTY");

  if (asyncData) {
    try {
      const parsed = JSON.parse(asyncData);
      console.log(
        "Zustand token:",
        parsed.state?.token ? parsed.state.token.slice(0, 30) + "..." : "NONE"
      );
      console.log("Zustand user:", parsed.state?.user?.email || "NONE");
    } catch (e) {
      console.log("Failed to parse AsyncStorage");
    }
  }

  console.log(
    "apiClient auth header:",
    apiClient.defaults.headers.Authorization || "NONE"
  );
  console.log("===================\n");
};
