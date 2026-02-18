// app/(auth)/verify.tsx – Verify Your Email
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores";
import { useNavigation, useRoute } from "@react-navigation/native";

const COLORS = {
  primary: "#00B14F",
  disabled: "#E5E7EB",
  textOnPrimary: "#FFFFFF",
  textOnDisabled: "#6B7280",
};

export default function VerifyScreen() {
  const [token, setToken] = useState("");
  const { verifyEmail, loading } = useAuthStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email ?? "";

  const isSubmitting = useRef(false);
  const isDisabled = loading || token.length < 6;

  const handleVerify = async () => {
    if (isSubmitting.current || loading) return;
    isSubmitting.current = true;
    try {
      await verifyEmail(token);
      alert("Email verified! Please login.");
      navigation.navigate("login");
    } catch {
      alert("Invalid or expired token");
    } finally {
      setTimeout(() => {
        isSubmitting.current = false;
      }, 1000);
    }
  };

  return (
    <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.gradient}>
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <SafeAreaView style={styles.safe} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerSection}>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We sent a verification code to{"\n"}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            <View style={styles.card}>
              <TextInput
                label="Verification Code"
                value={token}
                onChangeText={setToken}
                keyboardType="number-pad"
                mode="outlined"
                style={styles.input}
                outlineColor="rgba(0,0,0,0.12)"
                activeOutlineColor="#00B14F"
                textColor="#111827"
                theme={{
                  colors: {
                    background: "#FFFFFF",
                    onSurfaceVariant: "#6B7280",
                  },
                }}
              />

              <Button
                mode="contained"
                onPress={handleVerify}
                loading={loading}
                disabled={isDisabled}
                buttonColor={isDisabled ? COLORS.disabled : COLORS.primary}
                textColor={isDisabled ? COLORS.textOnDisabled : COLORS.textOnPrimary}
                style={styles.verifyBtn}
                contentStyle={styles.verifyBtnContent}
              >
                Verify
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.goBack()}
                textColor="#00B14F"
                style={styles.backBtn}
              >
                Go Back
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  decorativeCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: 120,
    left: -40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    lineHeight: 22,
  },
  emailHighlight: {
    textAlign: "center",
    fontWeight: "600",
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  verifyBtn: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 0,
  },
  verifyBtnContent: {
    height: 50,
  },
  backBtn: {
    marginTop: 16,
    alignSelf: "center",
  },
});
