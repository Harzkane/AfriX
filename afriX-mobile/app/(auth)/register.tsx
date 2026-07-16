// app/(auth)/register.tsx
import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput as RNTextInput,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore, useSettingsStore } from "@/stores";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { language, setLanguage } = useSettingsStore();
  const insets = useSafeAreaInsets();
  const currentLang = language || "en";

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    country_code: "NG",
  });
  const [showPassword, setShowPassword] = useState(false);

  const { register, loading, error } = useAuthStore();

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

  const isDisabled = loading || !form.full_name || !form.email || !form.password;

  const handleRegister = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await register(form);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate("verify", { email: form.email });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Registration Failed", error || "Failed to create account. Please check your credentials.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background gradients */}
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
              <Ionicons name="person-add-outline" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.welcomeText, { color: theme.text }]}>{t("auth.register.title")}</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>{t("auth.register.subtitle")}</Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>{t("auth.register.fullname_label")}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="person-outline" size={18} color={theme.muted} />
                </View>
                <RNTextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={form.full_name}
                  onChangeText={(v) => setForm({ ...form, full_name: v })}
                  placeholder={t("auth.register.fullname_placeholder")}
                  placeholderTextColor={theme.placeholder}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>{t("auth.register.email_label")}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="mail-outline" size={18} color={theme.muted} />
                </View>
                <RNTextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={form.email}
                  onChangeText={(v) => setForm({ ...form, email: v })}
                  placeholder={t("auth.register.email_placeholder")}
                  placeholderTextColor={theme.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>{t("auth.register.password_label")}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="lock-closed-outline" size={18} color={theme.muted} />
                </View>
                <RNTextInput
                  style={[styles.textInput, { color: theme.text }]}
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                  placeholder={t("auth.register.password_placeholder")}
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

            {/* Register button */}
            <TouchableOpacity
              style={[styles.registerBtn, isDisabled && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={isDisabled}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isDisabled ? ["#9CA3AF", "#6B7280"] : ["#00B14F", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.registerBtnText}>{t("auth.register.create_btn")}</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Bottom link */}
          <View style={styles.bottomSection}>
            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: theme.muted }]}>{t("auth.register.has_account")}</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.loginLink, { color: theme.accent }]}>{t("auth.register.login_link")}</Text>
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
  registerBtn: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
  },
  registerBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  registerBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  bottomSection: {
    alignItems: "center",
  },
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginLink: {
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
