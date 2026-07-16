// app/modals/swap-tokens/index.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  useColorScheme,
  Animated,
  Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSwapStore, useWalletStore } from "@/stores";
import { parseAmountInput, formatAmountForInput, clampAmountToMax } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

const TOKENS = ["NT", "CT", "USDT"] as const;
type TokenType = "NT" | "CT" | "USDT";

const TOKEN_INFO: Record<TokenType, { name: string; icon: string; subtitle: string }> = {
  NT: { name: "Naira Token", icon: "cash-outline", subtitle: "Domestic" },
  CT: { name: "CFA Token", icon: "leaf-outline", subtitle: "Regional" },
  USDT: { name: "Tether", icon: "logo-usd", subtitle: "Reserve" },
};

export default function SwapTokensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);

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
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.14)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
    placeholder: isDark ? "#475569" : "#9CA3AF",
  };

  const {
    fromToken, toToken, amount, estimatedReceive, exchangeRate, fetchingRate,
    setFromToken, setToToken, setAmount, swapTokens, fetchExchangeRate, reset,
  } = useSwapStore();

  const { getWalletByType } = useWalletStore();
  const fromWallet = getWalletByType(fromToken);
  const toWallet = getWalletByType(toToken);
  const availableBalance = fromWallet ? parseFloat(fromWallet.available_balance) : 0;

  useEffect(() => { fetchExchangeRate(); }, []);

  useEffect(() => {
    const num = parseFloat(amount) || 0;
    if (amount && num > availableBalance) {
      setAmount(clampAmountToMax(amount, availableBalance, fromToken));
    }
  }, [fromToken]);

  const amountNum = parseFloat(amount) || 0;
  const hasInsufficientBalance = amountNum > availableBalance;

  const handleContinue = () => {
    if (!amount || amountNum <= 0 || hasInsufficientBalance) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/modals/swap-tokens/confirm");
  };

  const handleSetMax = () => {
    if (fromWallet) {
      const raw = fromToken === "USDT"
        ? availableBalance.toFixed(2)
        : Math.floor(availableBalance).toString();
      setAmount(raw);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAmountChange = (text: string) => {
    const parsed = parseAmountInput(text, fromToken);
    const clamped = clampAmountToMax(parsed, availableBalance, fromToken);
    setAmount(clamped);
  };

  const handleCancel = () => { reset(); router.back(); };

  const handleSwapDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swapTokens();
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const TokenSelector = ({ label, selected, onSelect }: { label: string; selected: TokenType; onSelect: (t: TokenType) => void }) => {
    const { t } = useTranslation();
    return (
      <View style={styles.selectorBlock}>
        <Text style={[styles.selectorEyebrow, { color: theme.accent }]}>{label}</Text>
        <View style={styles.tokenRow}>
          {TOKENS.map((token) => {
            const isSelected = selected === token;
            return (
              <TouchableOpacity
                key={token}
                style={[
                  styles.tokenCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                ]}
                onPress={() => onSelect(token)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.tokenCheck, { backgroundColor: theme.accent }]}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
                <Text style={[styles.tokenCardSub, { color: isSelected ? theme.accent : theme.muted }]}>
                  {token === "NT"
                    ? t("swap_tokens.index.token_subtitle_nt", "Domestic")
                    : token === "CT"
                    ? t("swap_tokens.index.token_subtitle_ct", "Regional")
                    : t("swap_tokens.index.token_subtitle_usdt", "Reserve")}
                </Text>
                <Text style={[styles.tokenCardLabel, { color: isSelected ? theme.accent : theme.text }]}>
                  {token}
                </Text>
                <Text style={[styles.tokenCardName, { color: isSelected ? theme.accent + "AA" : theme.muted }]}>
                  {token === "NT"
                    ? t("swap_tokens.index.token_label_nt", "Naira Token")
                    : token === "CT"
                    ? t("swap_tokens.index.token_label_ct", "CFA Token")
                    : t("swap_tokens.index.token_label_usdt", "Tether")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > headerMaxHeight) setHeaderMaxHeight(h);
        }}
        style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("swap_tokens.index.header_title", "Swap Tokens")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("swap_tokens.index.header_subtitle", "Instant conversion between your token types.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? -8 : 12}
      >
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Glow */}
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
            style={styles.glow}
            pointerEvents="none"
          />

          {/* Intro card */}
          <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("swap_tokens.index.intro_eyebrow", "INSTANT CONVERSION")}</Text>
            <Text style={[styles.introTitle, { color: theme.text }]}>{t("swap_tokens.index.intro_title", "Swap tokens in one step")}</Text>
            <Text style={[styles.introSubtitle, { color: theme.muted }]}>
              {t("swap_tokens.index.intro_desc", "Select the token to send and one to receive, enter the amount, review the live rate and confirm your swap.")}
            </Text>
          </View>

          {/* From card */}
          <View style={[styles.swapSectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TokenSelector label={t("swap_tokens.index.selector_label_from", "FROM")} selected={fromToken} onSelect={setFromToken} />

            {/* Amount Input */}
            <View style={styles.inputBlock}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>{t("swap_tokens.index.amount_to_swap_label", "Amount to swap")}</Text>
              <View style={[styles.inputRow, { backgroundColor: theme.inputBg, borderColor: hasInsufficientBalance ? theme.amber : theme.border }]}>
                <TextInput
                  style={[styles.amountInput, { color: theme.text }]}
                  value={formatAmountForInput(amount, fromToken)}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder={fromToken === "USDT" ? t("swap_tokens.index.placeholder_amount_usdt", "0.00") : t("swap_tokens.index.placeholder_amount", "0")}
                  placeholderTextColor={theme.placeholder}
                />
                <TouchableOpacity
                  style={[styles.maxTag, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}
                  onPress={handleSetMax}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.maxTagText, { color: theme.blue }]}>{t("swap_tokens.index.btn_max", "MAX")}</Text>
                </TouchableOpacity>
              </View>
              {fromWallet && (
                <Text style={[styles.balanceHint, { color: theme.muted }]}>
                  {t("swap_tokens.index.available_balance", "Available: {{balance}} {{token}}", {
                    balance: availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    token: fromToken
                  })}
                </Text>
              )}
            </View>
          </View>

          {/* Swap direction button */}
          <View style={styles.swapArrowRow}>
            <View style={[styles.swapArrowLine, { backgroundColor: theme.border }]} />
            <TouchableOpacity
              style={[styles.swapArrowBtn, { backgroundColor: theme.card, borderColor: theme.accent }]}
              onPress={handleSwapDirection}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-vertical" size={24} color={theme.accent} />
            </TouchableOpacity>
            <View style={[styles.swapArrowLine, { backgroundColor: theme.border }]} />
          </View>

          {/* To card */}
          <View style={[styles.swapSectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TokenSelector label={t("swap_tokens.index.selector_label_to", "TO")} selected={toToken} onSelect={setToToken} />

            {/* Estimated receive */}
            <View style={styles.inputBlock}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>{t("swap_tokens.index.you_will_receive", "You will receive (estimate)")}</Text>
              <View style={[styles.receiveBox, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
                {fetchingRate ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <Text style={[styles.receiveValue, { color: theme.accent }]}>
                    {parseFloat(estimatedReceive).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {toToken}
                  </Text>
                )}
              </View>
              {toWallet && (
                <Text style={[styles.balanceHint, { color: theme.muted }]}>
                  {t("swap_tokens.index.current_balance", "Current balance: {{balance}} {{token}}", {
                    balance: parseFloat(toWallet.available_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    token: toToken
                  })}
                </Text>
              )}
            </View>
          </View>

          {/* Exchange Rate card */}
          <View style={[styles.rateCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.rateIconBox, { backgroundColor: theme.blue + "22" }]}>
              <Ionicons name="trending-up" size={18} color={theme.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rateLabel, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>{t("swap_tokens.index.live_rate_label", "Live Exchange Rate")}</Text>
              {fetchingRate ? (
                <ActivityIndicator size="small" color={theme.blue} style={{ marginTop: 4, alignSelf: "flex-start" }} />
              ) : (
                <Text style={[styles.rateValue, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
                  {t("swap_tokens.index.live_rate_value", "1 {{fromToken}} = {{rate}} {{toToken}}", {
                    fromToken,
                    rate: exchangeRate.toFixed(4),
                    toToken
                  })}
                </Text>
              )}
            </View>
          </View>

          {/* Insufficient balance warning */}
          {hasInsufficientBalance && amountNum > 0 && (
            <View style={[styles.warnCard, { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder }]}>
              <Ionicons name="warning-outline" size={18} color={theme.amber} />
              <Text style={[styles.warnText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
                {t("swap_tokens.index.err_insufficient_funds", "Insufficient balance. You need {{additional}} {{fromToken}} more.", {
                  additional: (amountNum - availableBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                  fromToken
                })}
              </Text>
            </View>
          )}

          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <View style={[styles.infoIconBox, { backgroundColor: theme.accent + "25" }]}>
              <Ionicons name="flash" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: isDark ? "#6EE7B7" : "#065F46" }]}>{t("swap_tokens.index.info_title", "Instant Swap")}</Text>
              <Text style={[styles.infoDesc, { color: isDark ? "#A7F3D0" : "#047857" }]}>
                {t("swap_tokens.index.info_desc", "Your swap is processed instantly at the current market rate. No delays or hidden fees.")}
              </Text>
            </View>
          </View>

          {/* Buttons inside scroll */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: theme.muted }]}>{t("swap_tokens.index.btn_cancel", "Cancel")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueBtn,
                { backgroundColor: theme.accent },
                (!amount || amountNum <= 0 || hasInsufficientBalance) && styles.continueBtnDisabled,
              ]}
              onPress={handleContinue}
              disabled={!amount || amountNum <= 0 || hasInsufficientBalance}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>{t("swap_tokens.index.btn_review", "Review Swap")}</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
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
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 200,
  },
  introCard: {
    borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1,
  },
  introEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8 },
  introTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, letterSpacing: -0.4 },
  introSubtitle: { fontSize: 14, lineHeight: 21 },
  swapSectionCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 4,
  },
  selectorBlock: { marginBottom: 16 },
  selectorEyebrow: {
    fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10,
  },
  tokenRow: { flexDirection: "row", gap: 10 },
  tokenCard: {
    flex: 1, borderRadius: 20, borderWidth: 1.5, padding: 14,
    alignItems: "center", position: "relative",
  },
  tokenCheck: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  tokenCardSub: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  tokenCardLabel: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 },
  tokenCardName: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  inputBlock: { marginTop: 4 },
  inputLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  amountInput: {
    flex: 1, fontSize: 28, fontWeight: "800",
    paddingVertical: 14,
  },
  maxTag: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  maxTagText: { fontSize: 12, fontWeight: "800" },
  balanceHint: { fontSize: 12, marginTop: 8, fontWeight: "500" },
  receiveBox: {
    borderWidth: 1.5, borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 18,
    minHeight: 60, justifyContent: "center",
  },
  receiveValue: { fontSize: 28, fontWeight: "800" },
  swapArrowRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  swapArrowLine: { flex: 1, height: 1 },
  swapArrowBtn: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rateCard: {
    flexDirection: "row", gap: 12,
    padding: 14, borderRadius: 20, borderWidth: 1, marginTop: 12, marginBottom: 12,
  },
  rateIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  rateLabel: { fontSize: 12, fontWeight: "800", marginBottom: 4 },
  rateValue: { fontSize: 14, fontWeight: "700" },
  warnCard: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 12,
  },
  warnText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  infoCard: {
    flexDirection: "row", gap: 12,
    padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 20,
  },
  infoIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, height: 58, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  cancelBtnText: { fontSize: 16, fontWeight: "700" },
  continueBtn: {
    flex: 2, height: 58, borderRadius: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
