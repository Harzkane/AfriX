// app/(auth)/verify-email.tsx
import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import { useNavigation, useRoute } from "@react-navigation/native";

const COLORS = {
  primary: "#16A34A",
  disabled: "#9CA3AF",
  textOnPrimary: "#fff",
};

export default function VerifyScreen() {
  const [token, setToken] = useState("");
  const { verifyEmail, loading } = useAuthStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email;

  const isSubmitting = useRef(false);

  const isDisabled = loading || token.length < 6;

  const handleVerify = async () => {
    if (isSubmitting.current || loading) return;

    isSubmitting.current = true;
    console.log("🔒 Verifying email...");

    try {
      await verifyEmail(token);
      alert("Email verified! Please login.");
      navigation.navigate("login");
    } catch (error) {
      console.log("❌ Verification failed:", error);
      alert("Invalid or expired token");
    } finally {
      // Don't unlock immediately if successful to prevent extra clicks during navigation
      setTimeout(() => {
        isSubmitting.current = false;
      }, 1000);
    }
  };

  return (
    <LinearGradient
      colors={["#00B14F", "#008F40"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a 64-character code to{"\n"}
            <Text style={{ fontWeight: "600" }}>{email}</Text>
          </Text>

          <TextInput
            label="Verification Code"
            value={token}
            onChangeText={setToken}
            keyboardType="number-pad"
            mode="outlined"
            style={styles.input}
            outlineColor="rgba(0,0,0,0.1)"
            activeOutlineColor="#00B14F"
            textColor="#111827"
            theme={{ colors: { background: '#FFFFFF', onSurfaceVariant: '#6B7280' } }}
          />

          <Button
            mode="contained"
            onPress={handleVerify}
            loading={loading}
            disabled={isDisabled}
            buttonColor={isDisabled ? COLORS.disabled : COLORS.primary}
            textColor={COLORS.textOnPrimary}
            style={styles.btn}
          >
            Verify
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 8 }}
          >
            Go Back
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 32,
    lineHeight: 22,
  },
  input: { marginBottom: 24 },
  btn: { marginTop: 8 },
});
