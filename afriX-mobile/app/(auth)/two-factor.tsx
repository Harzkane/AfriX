// app/(auth)/two-factor.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/services/apiClient";
import { useAuthStore } from "@/stores";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

const OTP_LENGTH = 6;

// Defined OUTSIDE component to prevent re-render focus-loss issues
const OTPBoxInput = React.forwardRef<
  TextInput,
  {
    value: string;
    onKeyPress: (e: any) => void;
    onChangeText: (v: string) => void;
    isFocused: boolean;
    theme: any;
  }
>(({ value, onKeyPress, onChangeText, isFocused, theme }, ref) => (
  <TextInput
    ref={ref}
    style={[
      styles.otpBox,
      {
        backgroundColor: theme.inputBg,
        borderColor: isFocused ? theme.accent : value ? theme.accentMuted : theme.border,
        color: theme.text,
      },
    ]}
    value={value}
    onChangeText={onChangeText}
    onKeyPress={onKeyPress}
    keyboardType="number-pad"
    maxLength={1}
    textAlign="center"
    selectTextOnFocus
  />
));

OTPBoxInput.displayName = "OTPBoxInput";

export default function TwoFactorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setToken, setUser } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const theme = {
    background: isDark ? "#080E14" : "#F4F7FC",
    card: isDark ? "rgba(16, 25, 36, 0.85)" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2E42" : "#E2E8F0",
    inputBg: isDark ? "#162232" : "#F8FAFC",
    accent: "#00B14F",
    accentMuted: isDark ? "rgba(0, 177, 79, 0.4)" : "rgba(0, 177, 79, 0.3)",
    placeholder: isDark ? "#475569" : "#9CA3AF",
  };

  useEffect(() => {
    if (params.temp_token) {
      setTempToken(params.temp_token as string);
    } else {
      Alert.alert(t("auth.two_factor.error_title", "Error"), t("auth.two_factor.session_error", "Invalid session. Please login again."));
      router.replace("/(auth)/login");
    }
  }, [params]);

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH;

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleVerify = async () => {
    if (!isComplete) {
      Alert.alert(t("auth.two_factor.error_title", "Error"), t("auth.two_factor.complete_code_error", "Please enter the complete 6-digit code"));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setLoading(true);
      const response = await apiClient.post("/auth/2fa/validate", {
        temp_token: tempToken,
        token: otp,
      });

      if (response.data.success) {
        const { user, tokens } = response.data.data;
        await setToken(tokens.access_token);
        setUser(user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/");
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error.response?.data?.message || "Verification failed";
      Alert.alert(t("auth.two_factor.error_title", "Error"), message);
      // Clear and refocus
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      setFocusedIndex(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark ? ["#051811", "#080E14"] : ["#E8FDF0", "#F4F7FC"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.glowOrb1, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)" }]} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.inner}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>

            {/* Brand header */}
            <View style={styles.brandSection}>
              <LinearGradient colors={["#00B14F", "#10B981"]} style={styles.logoCircle}>
                <Ionicons name="shield-checkmark-outline" size={32} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.welcomeText, { color: theme.text }]}>{t("auth.two_factor.title")}</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                {t("auth.two_factor.subtitle")}
              </Text>
            </View>

            {/* OTP Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.otpLabel, { color: theme.muted }]}>{t("auth.two_factor.code_label")}</Text>

              <View style={styles.otpRow}>
                {digits.map((digit, index) => (
                  <OTPBoxInput
                    key={index}
                    ref={(el) => void (inputRefs.current[index] = el)}
                    value={digit}
                    isFocused={focusedIndex === index}
                    onChangeText={(v) => handleChange(v, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    theme={theme}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.verifyBtn, (!isComplete || loading) && { opacity: 0.6 }]}
                onPress={handleVerify}
                disabled={!isComplete || loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={!isComplete ? ["#9CA3AF", "#6B7280"] : ["#00B14F", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.verifyBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.verifyBtnText}>{t("auth.two_factor.btn_submit")}</Text>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={[styles.footerText, { color: theme.muted }]}>
              {t("auth.two_factor.footer_hint", "Open your authenticator app to find the code")}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
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
    paddingHorizontal: 12,
  },
  card: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 16,
    textAlign: "center",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  verifyBtn: {
    borderRadius: 18,
    overflow: "hidden",
  },
  verifyBtnGradient: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  verifyBtnText: {
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
