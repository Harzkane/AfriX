// app/modals/send-tokens/index.tsx
import React, { useRef, useState, useEffect } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTransferStore, useWalletStore } from "@/stores";
import { parseAmountInput, formatAmountForInput, clampAmountToMax, formatAmount } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { TOKEN_CONFIG, TokenType } from "@/components/ui/TokenSelectModal";

const TOKENS: TokenType[] = ["NT", "CT", "USDT"];

export default function SendTokensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView | null>(null);

  const {
    tokenType, setTokenType, recipientEmail, setRecipient, amount, setAmount, fee, calculateFee, reset
  } = useTransferStore();
  const { getWalletByType } = useWalletStore();

  const [inputRecipient, setInputRecipient] = useState(recipientEmail || "");
  const [recipientError, setRecipientError] = useState("");

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
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
    placeholder: isDark ? "#475569" : "#9CA3AF",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.14)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const wallet = getWalletByType(tokenType);
  const availableBalance = wallet ? parseFloat(wallet.available_balance) : 0;
  const amountNum = parseFloat(amount) || 0;
  const hasInsufficientBalance = amountNum > availableBalance;

  useEffect(() => {
    calculateFee();
  }, [amount, tokenType]);

  const validateRecipient = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return emailRegex.test(trimmed) || ethAddressRegex.test(trimmed);
  };

  const handleAmountChange = (text: string) => {
    const parsed = parseAmountInput(text, tokenType);
    const clamped = clampAmountToMax(parsed, availableBalance, tokenType);
    setAmount(clamped);
  };

  const handleSetMax = () => {
    if (wallet) {
      const raw = availableBalance.toFixed(2);
      setAmount(raw);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRecipientChange = (text: string) => {
    setInputRecipient(text);
    if (recipientError) setRecipientError("");
  };

  const handleScanQR = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/modals/send-tokens/scan-qr");
  };

  const handleContinue = () => {
    const trimmedRecipient = inputRecipient.trim();
    if (!trimmedRecipient) {
      setRecipientError(t("send_tokens.index.err_enter_email", "Please enter recipient's email or wallet address"));
      return;
    }
    if (!validateRecipient(trimmedRecipient)) {
      setRecipientError(t("send_tokens.index.err_invalid_email", "Please enter a valid email or 0x wallet address"));
      return;
    }
    if (!amount || amountNum <= 0) {
      Alert.alert(
        t("send_tokens.index.err_amount_title", "Enter Amount"),
        t("send_tokens.index.err_amount_desc", "Please enter a valid amount to send")
      );
      return;
    }
    if (hasInsufficientBalance) {
      Alert.alert(
        t("send_tokens.index.err_balance_title", "Insufficient Balance"),
        t("send_tokens.index.err_balance_desc", "You do not have enough {{token}} to complete this transfer", { token: tokenType })
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecipient(trimmedRecipient);
    router.push("/modals/send-tokens/amount");
  };

  const handleCancel = () => {
    reset();
    router.back();
  };

  const isFormValid = inputRecipient.trim() && validateRecipient(inputRecipient) && amount && amountNum > 0 && !hasInsufficientBalance;

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {t("send_tokens.index.header_title", "Send Tokens")}
                </Text>
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
          {/* Ambient Glow */}
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
            style={styles.glow}
            pointerEvents="none"
          />

          {/* WALLET TRANSFER Banner Card */}
          <View style={[styles.bannerCard, { backgroundColor: theme.card, borderColor: theme.accentBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerEyebrow, { color: theme.accent }]}>
                {t("send_tokens.index.intro_eyebrow", "WALLET TRANSFER")}
              </Text>
              <Text style={[styles.bannerTitle, { color: theme.text }]}>
                {t("send_tokens.index.intro_title", "Send tokens instantly")}
              </Text>
              <Text style={[styles.bannerSubtitle, { color: theme.muted }]}>
                {t("send_tokens.index.intro_desc", "Select a token, enter an amount, and specify the recipient's email address or scan their QR code.")}
              </Text>
            </View>
            <View style={[styles.graphicBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="paper-plane-outline" size={26} color={theme.accent} />
            </View>
          </View>

          {/* SELECT TOKEN TYPE Grid */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("send_tokens.index.select_token", "SELECT TOKEN TYPE")}
          </Text>
          <View style={styles.tokenGrid}>
            {TOKENS.map((token) => {
              const isSelected = tokenType === token;
              const config = TOKEN_CONFIG[token];
              return (
                <TouchableOpacity
                  key={token}
                  style={[
                    styles.tokenCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTokenType(token);
                  }}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={[styles.tokenCheckBadge, { backgroundColor: theme.accent }]}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                  <Text style={[styles.tokenCardSub, { color: isSelected ? theme.accent : theme.muted }]}>
                    {config.subtitle.toUpperCase()}
                  </Text>
                  <Text style={[styles.tokenCardLabel, { color: isSelected ? theme.accent : theme.text }]}>
                    {token}
                  </Text>
                  <Text style={[styles.tokenCardName, { color: isSelected ? theme.accent + "CC" : theme.muted }]}>
                    {config.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AMOUNT TO SEND Section */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("send_tokens.index.amount_label", "AMOUNT TO SEND")}
          </Text>
          <View style={[styles.amountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                value={formatAmountForInput(amount, tokenType)}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.placeholder}
                numberOfLines={1}
              />
              <Text style={[styles.amountTicker, { color: theme.accent }]}>{tokenType}</Text>
              <TouchableOpacity
                style={[styles.maxTag, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}
                onPress={handleSetMax}
                activeOpacity={0.8}
              >
                <Text style={[styles.maxTagText, { color: theme.blue }]}>
                  {t("send_tokens.index.btn_max", "MAX")}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.balanceHint, { color: theme.muted }]}>
              {t("send_tokens.index.available_balance", "Available: {{balance}} {{token}}", {
                balance: formatAmount(availableBalance, tokenType),
                token: tokenType,
              })}
            </Text>
          </View>

          {/* RECIPIENT Section */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("send_tokens.index.recipient_label", "RECIPIENT")}
          </Text>
          <View style={[styles.recipientCard, { backgroundColor: theme.card, borderColor: recipientError ? theme.amber : theme.border }]}>
            <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <Ionicons name="person-outline" size={18} color={theme.muted} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.recipientInput, { color: theme.text }]}
                placeholder={t("send_tokens.index.placeholder_email", "user@example.com or 0x...")}
                placeholderTextColor={theme.placeholder}
                value={inputRecipient}
                onChangeText={handleRecipientChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
            {!!recipientError && (
              <Text style={[styles.errorHint, { color: theme.amber }]}>{recipientError}</Text>
            )}
            <Text style={[styles.recipientSubtext, { color: theme.muted }]}>
              {t("send_tokens.index.recipient_hint", "Enter recipient's registered email or wallet address.")}
            </Text>
          </View>

          {/* OR Scanner Divider Button */}
          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.orText, { color: theme.muted }]}>OR</Text>
            <View style={[styles.orLine, { backgroundColor: theme.border }]} />
          </View>

          <TouchableOpacity
            style={[styles.scanQrBtn, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}
            onPress={handleScanQR}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code-outline" size={20} color={theme.accent} />
            <Text style={[styles.scanQrText, { color: theme.accent }]}>
              {t("send_tokens.index.btn_scan_qr", "Scan QR Code")}
            </Text>
          </TouchableOpacity>

          {/* TRANSFER SUMMARY Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryEyebrow, { color: theme.muted }]}>
              {t("send_tokens.index.summary_header", "TRANSFER SUMMARY")}
            </Text>

            <View style={styles.summaryFlowRow}>
              {/* You are sending */}
              <View style={styles.summaryCol}>
                <View style={styles.summaryMetaRow}>
                  <View style={[styles.metaIconBox, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name="paper-plane" size={12} color={theme.accent} />
                  </View>
                  <Text style={[styles.metaLabel, { color: theme.muted }]}>You are sending</Text>
                </View>
                <Text style={[styles.metaValue, { color: theme.accent }]} numberOfLines={1}>
                  {formatAmount(amountNum, tokenType)} {tokenType}
                </Text>
              </View>

              {/* To */}
              <View style={styles.summaryCol}>
                <View style={styles.summaryMetaRow}>
                  <View style={[styles.metaIconBox, { backgroundColor: theme.blueSoft }]}>
                    <Ionicons name="person" size={12} color={theme.blue} />
                  </View>
                  <Text style={[styles.metaLabel, { color: theme.muted }]}>To</Text>
                </View>
                <Text style={[styles.metaValueText, { color: theme.text }]} numberOfLines={1}>
                  {inputRecipient || "user@example.com"}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.summaryDetailRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[styles.summaryLabel, { color: theme.muted }]}>Network fee</Text>
                <Ionicons name="information-circle-outline" size={13} color={theme.muted} />
              </View>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {formatAmount(fee, tokenType)} {tokenType}
              </Text>
            </View>

            <View style={styles.summaryDetailRow}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Amount received</Text>
              <Text style={[styles.summaryTotalValue, { color: theme.accent }]}>
                {formatAmount(amountNum, tokenType)} {tokenType}
              </Text>
            </View>
          </View>

          {/* Info Banner */}
          <View style={[styles.infoCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
            </View>
            <Text style={[styles.infoDesc, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              {t("send_tokens.index.tip_desc", "Double-check the recipient's email or wallet address. Transfers are processed instantly and cannot be reversed.")}
            </Text>
          </View>

          {/* Primary CTA Button */}
          <TouchableOpacity
            style={[
              styles.continueBtn,
              { backgroundColor: theme.accent },
              !isFormValid && styles.continueBtnDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isFormValid}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {t("send_tokens.index.btn_continue", "Continue")}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          <View style={{ height: 30 }} />
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

  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  bannerEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 2 },
  bannerTitle: { fontSize: 18, fontWeight: "800", marginBottom: 4, letterSpacing: -0.4 },
  bannerSubtitle: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  graphicBox: {
    width: 52, height: 52, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },

  sectionLabel: {
    fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 10, marginTop: 4,
  },
  tokenGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  tokenCard: {
    flex: 1, borderRadius: 20, borderWidth: 1.5, padding: 14,
    alignItems: "center", position: "relative",
  },
  tokenCheckBadge: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  tokenCardSub: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  tokenCardLabel: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 },
  tokenCardName: { fontSize: 10, fontWeight: "600", textAlign: "center" },

  amountCard: {
    borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 16,
  },
  amountRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  amountInput: {
    flex: 1, fontSize: 26, fontWeight: "800", padding: 0,
  },
  amountTicker: { fontSize: 16, fontWeight: "800" },
  maxTag: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  maxTagText: { fontSize: 11, fontWeight: "800" },
  divider: { height: 1, marginVertical: 12 },
  balanceHint: { fontSize: 12, fontWeight: "500" },

  recipientCard: {
    borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  recipientInput: { flex: 1, fontSize: 14, fontWeight: "600" },
  recipientSubtext: { fontSize: 11, fontWeight: "500", marginTop: 8 },
  errorHint: { fontSize: 12, fontWeight: "600", marginTop: 6 },

  orRow: {
    flexDirection: "row", alignItems: "center", marginVertical: 8, paddingHorizontal: 10,
  },
  orLine: { flex: 1, height: 1 },
  orText: { fontSize: 11, fontWeight: "800", marginHorizontal: 12 },

  scanQrBtn: {
    flexDirection: "row", height: 52, borderRadius: 18, borderWidth: 1.5,
    borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20,
  },
  scanQrText: { fontSize: 15, fontWeight: "800" },

  summaryCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 16, gap: 10,
  },
  summaryEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 4 },
  summaryFlowRow: {
    flexDirection: "row", justifyContent: "space-between", gap: 12, paddingBottom: 6,
  },
  summaryCol: { flex: 1, gap: 4 },
  summaryMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaIconBox: {
    width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center",
  },
  metaLabel: { fontSize: 11, fontWeight: "600" },
  metaValue: { fontSize: 15, fontWeight: "800" },
  metaValueText: { fontSize: 13, fontWeight: "700" },
  summaryDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, fontWeight: "500" },
  summaryValue: { fontSize: 13, fontWeight: "700" },
  summaryTotalValue: { fontSize: 15, fontWeight: "900" },

  infoCard: {
    flexDirection: "row", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 20,
    alignItems: "center",
  },
  infoIconBox: {
    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoDesc: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "500" },

  continueBtn: {
    flexDirection: "row", height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 8,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
