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
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSwapStore, useWalletStore } from "@/stores";
import { parseAmountInput, formatAmountForInput, clampAmountToMax, formatAmount } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import TokenSelectModal, { TokenType, TOKEN_CONFIG } from "@/components/ui/TokenSelectModal";

export default function SwapTokensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);

  // Modal state
  const [tokenModalTarget, setTokenModalTarget] = useState<"from" | "to" | null>(null);

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
    coral: "#EF4444",
    coralSoft: isDark ? "rgba(239,68,68,0.14)" : "#FEF2F2",
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
  const destinationBalance = toWallet ? parseFloat(toWallet.available_balance) : 0;

  useEffect(() => { fetchExchangeRate(); }, []);

  useEffect(() => {
    const num = parseFloat(amount) || 0;
    if (amount && num > availableBalance) {
      setAmount(clampAmountToMax(amount, availableBalance, fromToken));
    }
  }, [fromToken]);

  const amountNum = parseFloat(amount) || 0;
  const hasInsufficientBalance = amountNum > availableBalance;

  // Rate Breakdown calculations
  const grossReceiveNum = amountNum * exchangeRate;
  const feeAmountNum = grossReceiveNum * 0.015; // 1.5% AfriX Fee
  const netReceiveNum = Math.max(0, grossReceiveNum - feeAmountNum);

  const getDynamicFontSize = (text: string, baseSize = 28, minSize = 16) => {
    const len = text ? text.length : 1;
    if (len <= 7) return baseSize;
    if (len <= 10) return baseSize - 3;
    if (len <= 13) return baseSize - 6;
    if (len <= 16) return baseSize - 9;
    return minSize;
  };

  const handleContinue = () => {
    if (!amount || amountNum <= 0 || hasInsufficientBalance) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/modals/swap-tokens/confirm");
  };

  const handleSetMax = () => {
    if (fromWallet) {
      const raw = availableBalance.toFixed(2);
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

  const handleShowLearnMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      t("swap_tokens.index.learn_more_title", "Best Rate Guaranteed"),
      t("swap_tokens.index.learn_more_desc", "AfriExchange dynamically quotes the best market rate across liquidity pools with zero hidden markups. A standard 1.5% platform fee applies transparently."),
      [{ text: t("common.ok", "OK") }]
    );
  };

  const handleShowFeeInfo = () => {
    Alert.alert(
      t("swap_tokens.index.fee_info_title", "AfriX Fee (1.5%)"),
      t("swap_tokens.index.fee_info_desc", "A small transparent 1.5% platform fee ensures instant settlement, bank-grade security, and guaranteed liquidity."),
      [{ text: t("common.ok", "OK") }]
    );
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const fromConfig = TOKEN_CONFIG[fromToken];
  const toConfig = TOKEN_CONFIG[toToken];

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
            {/* Secure & Instant Badge */}
            <View style={[styles.secureBadge, { borderColor: theme.accentBorder, backgroundColor: theme.accentSoft }]}>
              <Ionicons name="lock-closed-outline" size={12} color={theme.accent} />
              <Text style={[styles.secureBadgeText, { color: theme.accent }]}>
                {t("swap_tokens.index.badge_secure", "Secure & Instant")}
              </Text>
            </View>
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

          {/* Best Rate Guaranteed Banner */}
          <View style={[styles.bannerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.bannerIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="shield-checkmark" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: theme.accent }]}>
                {t("swap_tokens.index.banner_title", "Best Rate Guaranteed")}
              </Text>
              <Text style={[styles.bannerSubtitle, { color: theme.muted }]}>
                {t("swap_tokens.index.banner_desc", "You get the best live rate. No hidden fees.")}
              </Text>
            </View>
            <TouchableOpacity onPress={handleShowLearnMore} activeOpacity={0.7} style={styles.learnMoreBtn}>
              <Text style={[styles.learnMoreText, { color: theme.accent }]}>
                {t("swap_tokens.index.learn_more", "Learn more")}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {/* Swap Section Stack (FROM & TO Cards with Integrated Swap Arrow) */}
          <View style={styles.swapStackContainer}>
            {/* FROM Card */}
            <View style={[styles.swapCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionEyebrow, { color: theme.muted }]}>
                {t("swap_tokens.index.label_from", "FROM")}
              </Text>
              <View style={styles.swapCardRow}>
                {/* Left Dropdown Button */}
                <TouchableOpacity
                  style={[styles.tokenDropdownBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  onPress={() => setTokenModalTarget("from")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.tokenDropdownIcon, { backgroundColor: fromConfig.bg }]}>
                    <Text style={[styles.tokenDropdownIconText, { color: fromConfig.color }]}>{fromToken}</Text>
                  </View>
                  <View style={styles.tokenDropdownTextCol}>
                    <Text style={[styles.tokenDropdownSymbol, { color: theme.text }]}>{fromToken}</Text>
                    <Text style={[styles.tokenDropdownSub, { color: theme.muted }]}>{fromConfig.name}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color={theme.muted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {/* Right Amount Input */}
                <View style={styles.amountInputCol}>
                  <Text style={[styles.inputFieldLabel, { color: theme.muted }]}>
                    {t("swap_tokens.index.amount_to_swap_label", "Amount to swap")}
                  </Text>
                  <View style={styles.inputFieldRow}>
                    <TextInput
                      style={[
                        styles.bigInput,
                        {
                          color: theme.text,
                          fontSize: getDynamicFontSize(formatAmountForInput(amount, fromToken), 28, 16),
                        },
                      ]}
                      value={formatAmountForInput(amount, fromToken)}
                      onChangeText={handleAmountChange}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.placeholder}
                      numberOfLines={1}
                    />
                    <TouchableOpacity
                      style={[styles.maxButton, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}
                      onPress={handleSetMax}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.maxButtonText, { color: theme.blue }]}>
                        {t("swap_tokens.index.btn_max", "MAX")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.balanceHintText, { color: theme.muted }]}>
                    {t("swap_tokens.index.available_balance", "Available: {{balance}} {{token}}", {
                      balance: formatAmount(availableBalance, fromToken),
                      token: fromToken
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Integrated Swap Control Button */}
            <View style={styles.integratedSwapRow}>
              <View style={[styles.integratedSwapLine, { backgroundColor: theme.border }]} />
              <TouchableOpacity
                style={[styles.integratedSwapBtn, { backgroundColor: theme.card, borderColor: theme.accent }]}
                onPress={handleSwapDirection}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-vertical" size={18} color={theme.accent} />
              </TouchableOpacity>
              <View style={[styles.integratedSwapLine, { backgroundColor: theme.border }]} />
            </View>

            {/* TO Card */}
            <View style={[styles.swapCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionEyebrow, { color: theme.muted }]}>
                {t("swap_tokens.index.label_to", "TO")}
              </Text>
              <View style={styles.swapCardRow}>
                {/* Left Dropdown Button */}
                <TouchableOpacity
                  style={[styles.tokenDropdownBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                  onPress={() => setTokenModalTarget("to")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.tokenDropdownIcon, { backgroundColor: toConfig.bg }]}>
                    <Text style={[styles.tokenDropdownIconText, { color: toConfig.color }]}>{toToken}</Text>
                  </View>
                  <View style={styles.tokenDropdownTextCol}>
                    <Text style={[styles.tokenDropdownSymbol, { color: theme.text }]}>{toToken}</Text>
                    <Text style={[styles.tokenDropdownSub, { color: theme.muted }]}>{toConfig.name}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color={theme.muted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {/* Right Output Display */}
                <View style={styles.amountInputCol}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={[styles.inputFieldLabel, { color: theme.muted }]}>
                      {t("swap_tokens.index.you_will_receive", "You will receive (estimate)")}
                    </Text>
                    <Ionicons name="information-circle-outline" size={13} color={theme.muted} />
                  </View>
                  <View style={styles.receiveValueRow}>
                    {fetchingRate ? (
                      <ActivityIndicator size="small" color={theme.accent} style={{ paddingVertical: 6 }} />
                    ) : (
                      <Text
                        style={[
                          styles.receiveValueText,
                          {
                            color: theme.accent,
                            fontSize: getDynamicFontSize(`${formatAmount(estimatedReceive, toToken)} ${toToken}`, 26, 15),
                          },
                        ]}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        {formatAmount(estimatedReceive, toToken)} {toToken}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.balanceHintText, { color: theme.muted }]}>
                    {t("swap_tokens.index.current_balance", "Current balance: {{balance}} {{token}}", {
                      balance: formatAmount(destinationBalance, toToken),
                      token: toToken
                    })}
                  </Text>
                </View>
              </View>
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

          {/* Live Exchange Rate Card */}
          <View style={[styles.rateCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.rateIconBox, { backgroundColor: theme.blue + "22" }]}>
              <Ionicons name="trending-up" size={18} color={theme.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rateLabel, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
                {t("swap_tokens.index.live_rate_label", "Live Exchange Rate")}
              </Text>
              {fetchingRate ? (
                <ActivityIndicator size="small" color={theme.blue} style={{ marginTop: 4, alignSelf: "flex-start" }} />
              ) : (
                <Text style={[styles.rateValue, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
                  1 {fromToken} = {exchangeRate.toFixed(4)} {toToken}
                </Text>
              )}
            </View>
            {/* Market movement tag */}
            <View style={[styles.marketChangeBadge, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="arrow-up" size={10} color={theme.accent} />
              <Text style={[styles.marketChangeText, { color: theme.accent }]}>0.45% vs yesterday</Text>
            </View>
          </View>

          {/* Instant Swap Benefit Banner */}
          <View style={[styles.infoCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <View style={[styles.infoIconBox, { backgroundColor: theme.accent + "25" }]}>
              <Ionicons name="flash" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: isDark ? "#6EE7B7" : "#065F46" }]}>
                {t("swap_tokens.index.info_title", "Instant Swap")}
              </Text>
              <Text style={[styles.infoDesc, { color: isDark ? "#A7F3D0" : "#047857" }]}>
                {t("swap_tokens.index.info_desc", "Your swap is processed instantly at the current market rate. No delays or hidden fees.")}
              </Text>
            </View>
          </View>

          {/* RATE BREAKDOWN Card */}
          <View style={[styles.breakdownCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.breakdownTitle, { color: theme.muted }]}>
              {t("swap_tokens.index.rate_breakdown_title", "RATE BREAKDOWN")}
            </Text>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.muted }]}>
                Market Rate (1 {fromToken})
              </Text>
              <Text style={[styles.breakdownValue, { color: theme.text }]}>
                {exchangeRate.toFixed(4)} {toToken}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.muted }]}>Amount</Text>
              <Text style={[styles.breakdownValue, { color: theme.text }]}>
                {amountNum > 0 ? amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} {fromToken}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: theme.muted }]}>Gross Amount</Text>
              <Text style={[styles.breakdownValue, { color: theme.text }]}>
                {grossReceiveNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toToken}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <TouchableOpacity onPress={handleShowFeeInfo} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[styles.breakdownLabel, { color: theme.muted }]}>AfriX Fee (1.5%)</Text>
                <Ionicons name="information-circle-outline" size={13} color={theme.muted} />
              </TouchableOpacity>
              <Text style={[styles.breakdownValue, { color: theme.coral }]}>
                -{feeAmountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toToken}
              </Text>
            </View>

            <View style={[styles.breakdownDivider, { backgroundColor: theme.border }]} />

            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownTotalLabel, { color: theme.text }]}>You Will Receive</Text>
              <Text style={[styles.breakdownTotalValue, { color: theme.accent }]}>
                {netReceiveNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toToken}
              </Text>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: theme.muted }]}>
                {t("swap_tokens.index.btn_cancel", "Cancel")}
              </Text>
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
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Trust Footer Indicators */}
          <View style={styles.trustFooterRow}>
            <View style={styles.trustFooterItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color={theme.accent} />
              <Text style={[styles.trustFooterText, { color: theme.muted }]}>Bank-Grade Security</Text>
            </View>
            <View style={styles.trustFooterItem}>
              <Ionicons name="flash-outline" size={16} color={theme.amber} />
              <Text style={[styles.trustFooterText, { color: theme.muted }]}>Instant Settlement</Text>
            </View>
            <View style={styles.trustFooterItem}>
              <Ionicons name="people-outline" size={16} color={theme.blue} />
              <Text style={[styles.trustFooterText, { color: theme.muted }]}>Trusted by Thousands</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Token Picker Modal */}
      <TokenSelectModal
        visible={tokenModalTarget !== null}
        onClose={() => setTokenModalTarget(null)}
        selectedToken={tokenModalTarget === "from" ? fromToken : toToken}
        onSelectToken={(token: TokenType) => {
          if (tokenModalTarget === "from") {
            setFromToken(token);
          } else if (tokenModalTarget === "to") {
            setToToken(token);
          }
        }}
        title={tokenModalTarget === "from" ? "Select Source Token" : "Select Target Token"}
      />
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
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 200,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  bannerIconBox: {
    width: 38, height: 38,
    borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  bannerTitle: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  bannerSubtitle: { fontSize: 12, fontWeight: "500" },
  learnMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  learnMoreText: { fontSize: 12, fontWeight: "700" },

  swapStackContainer: {
    position: "relative",
    marginBottom: 16,
  },
  swapCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  swapCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  tokenDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 6,
    flexShrink: 0,
  },
  tokenDropdownIcon: {
    width: 34, height: 34,
    borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  tokenDropdownIconText: {
    fontSize: 12,
    fontWeight: "900",
  },
  tokenDropdownTextCol: {
    justifyContent: "center",
  },
  tokenDropdownSymbol: {
    fontSize: 15,
    fontWeight: "800",
  },
  tokenDropdownSub: {
    fontSize: 10,
    fontWeight: "500",
  },

  amountInputCol: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    overflow: "hidden",
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  inputFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    gap: 6,
  },
  bigInput: {
    flex: 1,
    fontWeight: "800",
    textAlign: "right",
    padding: 0,
  },
  maxButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  maxButtonText: {
    fontSize: 11,
    fontWeight: "800",
  },
  receiveValueRow: {
    paddingVertical: 2,
    width: "100%",
    alignItems: "flex-end",
  },
  receiveValueText: {
    fontWeight: "800",
    textAlign: "right",
  },
  balanceHintText: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },

  integratedSwapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: -14,
    zIndex: 5,
    paddingHorizontal: 16,
  },
  integratedSwapLine: {
    flex: 1,
    height: 1,
  },
  integratedSwapBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  rateCard: {
    flexDirection: "row", gap: 12, alignItems: "center",
    padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 12,
  },
  rateIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  rateLabel: { fontSize: 12, fontWeight: "800", marginBottom: 2 },
  rateValue: { fontSize: 13, fontWeight: "700" },
  marketChangeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  marketChangeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  warnCard: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 12,
  },
  warnText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" },

  infoCard: {
    flexDirection: "row", gap: 12,
    padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 16,
  },
  infoIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 19, fontWeight: "500" },

  breakdownCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    gap: 10,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  breakdownDivider: {
    height: 1,
    marginVertical: 4,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: "900",
  },

  btnRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  cancelBtn: {
    flex: 1, height: 56, borderRadius: 18, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  cancelBtnText: { fontSize: 16, fontWeight: "700" },
  continueBtn: {
    flex: 2, height: 56, borderRadius: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  trustFooterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
  },
  trustFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustFooterText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
