// app/(auth)/login.tsx
import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput as RNTextInput,
  useColorScheme,
} from "react-native";
import { HelperText } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { useAuthStore, useSettingsStore } from "@/stores";
import { Link, useRouter } from "expo-router";
import { debugAuth } from "@/utils/debugAuth";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BIOMETRIC_LOGIN_KEY = "biometric_login_enabled";

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useSettingsStore();
  const insets = useSafeAreaInsets();
  const currentLang = language || "en";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showBiometricUnlock, setShowBiometricUnlock] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Face ID / Touch ID");
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, unlockWithBiometric } = useAuthStore();

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

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("auth_token");
      const bioEnabled = await SecureStore.getItemAsync(BIOMETRIC_LOGIN_KEY);
      if (!token || bioEnabled !== "true") {
        setShowBiometricUnlock(false);
        return;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setShowBiometricUnlock(false);
        return;
      }
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFace = types.includes(2);
      const hasFinger = types.includes(1);
      setBiometricLabel(
        hasFace && hasFinger ? "Face ID or Touch ID" : hasFace ? "Face ID" : "Touch ID"
      );
      setShowBiometricUnlock(true);
    })();
  }, []);

  const isDisabled = loading || !email || !password;

  const handleBiometricUnlock = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBiometricLoading(true);
    try {
      const success = await unlockWithBiometric();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response: any = await login({ email, password });
      if (response?.requires_2fa) {
        router.push({
          pathname: "/(auth)/two-factor",
          params: { temp_token: response.temp_token }
        });
        return;
      }
      await debugAuth();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient glows */}
      <LinearGradient
        colors={isDark ? ["#051811", "#080E14"] : ["#E8FDF0", "#F4F7FC"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glowOrb1, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)" }]} />

      {/* Floating Language Switcher */}
      <View style={[styles.floatingLangContainer, { top: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => setLanguage(currentLang === "en" ? "fr" : "en")}
          style={[styles.floatingLangBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <Ionicons name="language-outline" size={16} color={theme.accent} />
          <Text style={[styles.floatingLangText, { color: theme.text }]}>
            {currentLang === "en" ? "FR" : "EN"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <View style={styles.brandSection}>
            <LinearGradient
              colors={["#00B14F", "#10B981"]}
              style={styles.logoCircle}
            >
              <Ionicons name="swap-horizontal" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.welcomeText, { color: theme.text }]}>{t("auth.login.title")}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{t("auth.login.subtitle")}</Text>
          </View>

          {/* Biometrics */}
          {showBiometricUnlock && (
            <TouchableOpacity
              style={[styles.biometricButton, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.15)" : "#EAF8EF", borderColor: theme.accent + "30" }]}
              onPress={handleBiometricUnlock}
              disabled={biometricLoading || loading}
              activeOpacity={0.8}
            >
              {biometricLoading ? (
                <ActivityIndicator color={theme.accent} size="small" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={20} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.biometricButtonText, { color: theme.accent }]}>
                    {t("auth.login.unlock_biometrics", { biometricLabel })}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>{t("auth.login.email_label")}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="mail-outline" size={18} color={theme.muted} />
                </View>
                <RNTextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("auth.login.email_placeholder")}
                  placeholderTextColor={theme.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>{t("auth.login.password_label")}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.muted} />
                </View>
                <RNTextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t("auth.login.password_placeholder")}
                  placeholderTextColor={theme.placeholder}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={theme.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, isDisabled && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={isDisabled}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isDisabled ? ["#9CA3AF", "#6B7280"] : ["#00B14F", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>{t("auth.login.sign_in_btn")}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={[styles.forgotBtnText, { color: theme.accent }]}>{t("auth.login.forgot_password")}</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Bottom links */}
          <View style={styles.bottomSection}>
            <Link href="/(auth)/resend-verification" asChild>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={[styles.linkButtonText, { color: theme.muted }]}>
                  {t("auth.login.resend_verification")}
                </Text>
              </TouchableOpacity>
            </Link>

            <View style={styles.registerRow}>
              <Text style={[styles.registerText, { color: theme.muted }]}>{t("auth.login.no_account")}</Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.registerLink, { color: theme.accent }]}>{t("auth.login.register_link")}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 32,
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
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  biometricButtonText: {
    fontSize: 14,
    fontWeight: "800",
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
  eyeButton: {
    width: 44,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    marginLeft: 2,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  loginBtn: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
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
  forgotBtn: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 4,
  },
  forgotBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  bottomSection: {
    alignItems: "center",
    gap: 12,
  },
  linkButton: {
    paddingVertical: 6,
  },
  linkButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "800",
  },
  floatingLangContainer: {
    position: "absolute",
    right: 20,
    zIndex: 100,
  },
  floatingLangBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingLangText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
