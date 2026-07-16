// app/modals/send-tokens/index.tsx
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useColorScheme,
  Animated,
  TextInput,
  Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTransferStore, useWalletStore } from "@/stores";
import { useTranslation } from "react-i18next";

const TOKENS = ["NT", "CT", "USDT"] as const;
const TOKEN_LABELS: Record<string, string> = { NT: "Naira Token", CT: "CFA Token", USDT: "Tether" };
const TOKEN_SUBTITLES: Record<string, string> = { NT: "Domestic", CT: "Regional", USDT: "Reserve" };

export default function SendTokensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const { tokenType, setTokenType, setRecipient, reset } = useTransferStore();
  const { getWalletByType } = useWalletStore();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
    placeholder: isDark ? "#475569" : "#9CA3AF",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
    dangerSoft: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const wallet = getWalletByType(tokenType);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = () => {
    if (!email.trim()) {
      setEmailError(t("send_tokens.index.err_enter_email", "Please enter recipient's email"));
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(t("send_tokens.index.err_invalid_email", "Please enter a valid email address"));
      return;
    }
    setRecipient(email);
    router.push("/modals/send-tokens/amount");
  };

  const handleCancel = () => {
    reset();
    router.back();
  };

  const isFormValid = email.trim() && validateEmail(email) && !emailError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 72}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Collapsible Header */}
        <Animated.View
          onLayout={handleHeaderLayout}
          style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
        >
          <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={handleCancel}
                style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t("send_tokens.index.header_title", "Send Tokens")}</Text>
                <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                  <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                    {t("send_tokens.index.header_subtitle", "Transfer tokens instantly to any AfriToken user.")}
                  </Text>
                </Animated.View>
              </View>
              <View style={{ width: 42 }} />
            </View>
          </SafeAreaView>
        </Animated.View>

        <Animated.ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Ambient glow */}
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
            style={styles.glow}
            pointerEvents="none"
          />

          {/* INTRO CARD */}
          <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("send_tokens.index.intro_eyebrow", "WALLET TRANSFER")}</Text>
            <Text style={[styles.introTitle, { color: theme.text }]}>{t("send_tokens.index.intro_title", "Instant settlement")}</Text>
            <Text style={[styles.introSubtitle, { color: theme.muted }]}>
              {t("send_tokens.index.intro_desc", "Select the token type to transfer, specify the recipient's registered email address or scan their QR code.")}
            </Text>
          </View>

          {/* TOKEN SELECTION */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("send_tokens.index.select_token", "Select Token Type")}</Text>
          <View style={styles.tokenGrid}>
            {TOKENS.map((token) => {
              const isSelected = tokenType === token;
              return (
                <TouchableOpacity
                  key={token}
                  style={[
                    styles.tokenCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                  ]}
                  onPress={() => setTokenType(token)}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={[styles.tokenCheck, { backgroundColor: theme.accent }]}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                  <Text style={[styles.tokenCardSub, { color: isSelected ? theme.accent : theme.muted }]}>
                    {token === "NT"
                      ? t("send_tokens.index.token_subtitle_nt", "Domestic")
                      : token === "CT"
                      ? t("send_tokens.index.token_subtitle_ct", "Regional")
                      : t("send_tokens.index.token_subtitle_usdt", "Reserve")}
                  </Text>
                  <Text style={[styles.tokenCardLabel, { color: isSelected ? theme.accent : theme.text }]}>
                    {token}
                  </Text>
                  <Text style={[styles.tokenCardName, { color: isSelected ? theme.accent + "AA" : theme.muted }]}>
                    {token === "NT"
                      ? t("send_tokens.index.token_label_nt", "Naira Token")
                      : token === "CT"
                      ? t("send_tokens.index.token_label_ct", "CFA Token")
                      : t("send_tokens.index.token_label_usdt", "Tether")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* WALLET BALANCE INFO */}
          {wallet && (
            <View style={[styles.balanceCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.balanceHeader}>
                <Ionicons name="wallet-outline" size={14} color={theme.muted} />
                <Text style={[styles.balanceLabel, { color: theme.muted }]}>{t("send_tokens.index.available_balance", "Available Balance")}</Text>
              </View>
              <Text style={[styles.balanceAmount, { color: theme.text }]}>
                {parseFloat(wallet.available_balance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <Text style={{ fontSize: 18, color: theme.accent }}>{tokenType}</Text>
              </Text>
            </View>
          )}

          {/* RECIPIENT INPUT */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("send_tokens.index.recipient_details", "Recipient Details")}</Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>{t("send_tokens.index.recipient_email_label", "Recipient's Email Address")}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }, !!emailError && { borderColor: "#EF4444" }]}>
              <Ionicons name="mail-outline" size={20} color={theme.placeholder} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder={t("send_tokens.index.recipient_email_placeholder", "user@example.com")}
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
            <Text style={[styles.inputHint, { color: theme.muted }]}>
              {t("send_tokens.index.input_hint", "Type the recipient's AfriToken account email address.")}
            </Text>

            {/* OR DIVIDER */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.placeholder }]}>{t("send_tokens.index.or_divider", "OR")}</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>

            {/* SCAN QR */}
            <TouchableOpacity
              style={[styles.scanQrBtn, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}
              onPress={() => router.push("/modals/send-tokens/scan-qr")}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code-outline" size={20} color={theme.accent} />
              <Text style={[styles.scanQrText, { color: theme.accent }]}>{t("send_tokens.index.btn_scan_qr", "Scan QR Code")}</Text>
            </TouchableOpacity>
          </View>

          {/* TIP CARD */}
          <View style={[styles.tipCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.tipIconBox, { backgroundColor: theme.blue + "25" }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
            </View>
            <Text style={[styles.tipText, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
              {t("send_tokens.index.tip_desc", "Double check the recipient's email address. Transfers are processed instantly and cannot be reversed.")}
            </Text>
          </View>

          {/* ACTIONS */}
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: theme.accent }, !isFormValid && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!isFormValid}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>{t("send_tokens.index.btn_continue", "Continue")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
  },
  headerSafeArea: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 42, height: 42,
    borderRadius: 21, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 200,
  },
  introCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  introEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  introSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  tokenGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  tokenCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    position: "relative",
  },
  tokenCheck: {
    position: "absolute",
    top: 8, right: 8,
    width: 18, height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenCardSub: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  tokenCardLabel: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 },
  tokenCardName: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  balanceCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  balanceHeader: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  balanceLabel: { fontSize: 13, fontWeight: "600" },
  balanceAmount: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  formCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    fontWeight: "600",
  },
  inputHint: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "800",
    marginHorizontal: 12,
  },
  scanQrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  scanQrText: {
    fontSize: 15,
    fontWeight: "800",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  tipIconBox: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  tipText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 58,
    borderRadius: 20,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
