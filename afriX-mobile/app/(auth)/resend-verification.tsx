// app/(auth)/resend-verification.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput as RNTextInput,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores";
import * as Haptics from "expo-haptics";

export default function ResendVerificationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const { resendVerification, loading } = useAuthStore();

  const theme = {
    background: isDark ? "#080E14" : "#F4F7FC",
    card: isDark ? "rgba(16, 25, 36, 0.85)" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2E42" : "#E2E8F0",
    inputBg: isDark ? "#162232" : "#F8FAFC",
    accent: "#00B14F",
    placeholder: isDark ? "#475569" : "#9CA3AF",
  };

  const isDisabled = !email.trim() || loading;

  const handleResend = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await resendVerification(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={isDark ? ["#051811", "#080E14"] : ["#E8FDF0", "#F4F7FC"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.glowOrb1, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)" }]} />

        <View style={styles.inner}>
          <View style={styles.brandSection}>
            <LinearGradient colors={["#00B14F", "#10B981"]} style={styles.logoCircle}>
              <Ionicons name="checkmark-circle-outline" size={34} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.welcomeText, { color: theme.text }]}>Email Sent!</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              A new verification email has been sent to {email}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.successBanner, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.12)" : "#EAF8EF" }]}>
              <Ionicons name="mail-open-outline" size={22} color={theme.accent} />
              <Text style={[styles.successBannerText, { color: theme.accent }]}>
                Check your inbox and click the verification link to activate your account.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => router.replace("/(auth)/login")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#00B14F", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                <Text style={styles.submitBtnText}>Back to Login</Text>
                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark ? ["#051811", "#080E14"] : ["#E8FDF0", "#F4F7FC"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glowOrb1, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)" }]} />

      <View style={styles.inner}>
        {/* Brand header */}
        <View style={styles.brandSection}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <LinearGradient colors={["#00B14F", "#10B981"]} style={styles.logoCircle}>
            <Ionicons name="refresh-circle-outline" size={34} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.welcomeText, { color: theme.text }]}>Resend Verification</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>Enter your email and we'll resend your verification link</Text>
        </View>

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>Email Address</Text>
            <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <View style={styles.inputIconBox}>
                <Ionicons name="mail-outline" size={18} color={theme.muted} />
              </View>
              <RNTextInput
                style={[styles.textInput, { color: theme.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={theme.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, isDisabled && { opacity: 0.6 }]}
            onPress={handleResend}
            disabled={isDisabled}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isDisabled ? ["#9CA3AF", "#6B7280"] : ["#00B14F", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Resend Email</Text>
                  <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glowOrb1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -50,
    right: -50,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 28,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 4,
    top: -20,
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  successBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    overflow: "hidden",
  },
  inputIconBox: {
    width: 44,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 15,
    fontWeight: "600",
  },
  submitBtn: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
  },
  submitBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
