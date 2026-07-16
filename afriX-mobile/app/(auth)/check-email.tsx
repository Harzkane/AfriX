// app/(auth)/check-email.tsx
import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, useColorScheme } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

export default function CheckEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const theme = {
    background: isDark ? "#080E14" : "#F4F7FC",
    card: isDark ? "rgba(16, 25, 36, 0.85)" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2E42" : "#E2E8F0",
    accent: "#00B14F",
  };

  const handleBackToLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(auth)/login");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background gradients */}
      <LinearGradient
        colors={isDark ? ["#051811", "#080E14"] : ["#E8FDF0", "#F4F7FC"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glowOrb1, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)" }]} />

      <View style={styles.inner}>
        {/* Brand header */}
        <View style={styles.brandSection}>
          <LinearGradient
            colors={["#00B14F", "#10B981"]}
            style={styles.logoCircle}
          >
            <Ionicons name="mail-open-outline" size={34} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.welcomeText, { color: theme.text }]}>{t("auth.check_email.title")}</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>{t("auth.check_email.subtitle")}</Text>
        </View>

        {/* Message Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.messageText, { color: theme.text }]}>
            {email
              ? t("auth.check_email.body_with_email", `We sent a password reset link to ${email}. Follow the instructions to reset your password.`, { email })
              : t("auth.check_email.body_no_email", "We sent a password reset link to your email. Follow the instructions to reset your password.")}
          </Text>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleBackToLogin}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#00B14F", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtnGradient}
            >
              <Text style={styles.loginBtnText}>{t("auth.check_email.btn_back", "Back to Login")}</Text>
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footerText, { color: theme.muted }]}>
          {t("auth.check_email.footer", "Didn't receive the email? Check your spam folder")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 28,
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
    marginBottom: 20,
  },
  messageText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: "500",
  },
  loginBtn: {
    borderRadius: 18,
    overflow: "hidden",
  },
  loginBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  footerText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
});
