// app/(auth)/verify.tsx – Verify Your Email
import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
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

export default function VerifyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email ?? "";
  const { t } = useTranslation();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);

  const { verifyEmail, loading } = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const isSubmitting = useRef(false);

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

  const token = digits.join("");
  const isComplete = token.length === OTP_LENGTH;
  const isDisabled = loading || !isComplete;

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
    if (isSubmitting.current || loading) return;
    isSubmitting.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await verifyEmail(token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t("auth.verify.success_title", "Email Verified!"),
        t("auth.verify.success_desc", "Your email has been verified. Please login."),
        [{ text: t("auth.register.login_link", "Login"), onPress: () => navigation.navigate("login") }]
      );
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        t("auth.verify.error_title", "Verification Failed"),
        t("auth.verify.error_desc", "Invalid or expired token. Please try again.")
      );
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      setFocusedIndex(0);
    } finally {
      setTimeout(() => {
        isSubmitting.current = false;
      }, 1000);
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
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.inner}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>

            {/* Brand header */}
            <View style={styles.brandSection}>
              <LinearGradient colors={["#00B14F", "#10B981"]} style={styles.logoCircle}>
                <Ionicons name="mail-open-outline" size={32} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.welcomeText, { color: theme.text }]}>{t("auth.verify.title")}</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                {t("auth.verify.subtitle", { email })}
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
                style={[styles.verifyBtn, isDisabled && { opacity: 0.6 }]}
                onPress={handleVerify}
                disabled={isDisabled}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isDisabled ? ["#9CA3AF", "#6B7280"] : ["#00B14F", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.verifyBtnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.verifyBtnText}>{t("auth.verify.btn_verify")}</Text>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendRow} onPress={() => navigation.goBack()}>
                <Text style={[styles.resendText, { color: theme.muted }]}>{t("auth.verify.no_code")}</Text>
                <Text style={[styles.resendLink, { color: theme.accent }]}>{t("auth.verify.resend")}</Text>
              </TouchableOpacity>
            </View>
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
    lineHeight: 22,
    paddingHorizontal: 8,
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
    marginBottom: 16,
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
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    fontWeight: "500",
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "800",
  },
});
