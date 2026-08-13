// app/modals/swap-tokens/confirm.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Animated,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSwapStore, useWalletStore } from "@/stores";
import { TOKEN_CONFIG, TokenType } from "@/components/ui/TokenSelectModal";
import { formatAmount } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

export default function ConfirmSwapScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);

  // 5 minute rate lock timer
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    redBorder: isDark ? "rgba(239,68,68,0.25)" : "#FEE2E2",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.14)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
  };

  const {
    fromToken, toToken, amount, estimatedReceive, exchangeRate, swapFee, loading, error, executeSwap, fetchExchangeRate
  } = useSwapStore();
  const { fetchWallets } = useWalletStore();

  const amountNum = parseFloat(amount) || 0;
  const estimatedNum = parseFloat(estimatedReceive) || 0;
  const feeNum = swapFee || (amountNum * 0.015);
  const totalDeductedNum = amountNum + feeNum;

  const fromConfig = TOKEN_CONFIG[fromToken as TokenType] || TOKEN_CONFIG["NT"];
  const toConfig = TOKEN_CONFIG[toToken as TokenType] || TOKEN_CONFIG["CT"];

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const handleConfirm = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await executeSwap();
      await fetchWallets();
      router.replace("/modals/swap-tokens/success");
    } catch (e: any) {
      Alert.alert(
        t("swap_tokens.confirm.err_failed_title", "Swap Failed"),
        e.response?.data?.message || e.message || t("swap_tokens.confirm.err_failed_fallback", "Please try again"),
        [{ text: t("common.ok", "OK") }]
      );
    }
  };

  const handleRefreshRate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchExchangeRate();
    setTimeLeft(300);
  };

  const handleShowFeeInfo = () => {
    Alert.alert(
      t("swap_tokens.confirm.fee_info_title", "Platform Fee (1.5%)"),
      t("swap_tokens.confirm.fee_info_desc", "A standard 1.5% platform fee is deducted from the source amount to cover network settlement and liquidity fees."),
      [{ text: t("common.ok", "OK") }]
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
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t("swap_tokens.confirm.header_title", "Confirm Swap")}
              </Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("swap_tokens.confirm.header_subtitle", "Review your conversion before submitting.")}
                </Text>
              </Animated.View>
            </View>
            {/* Top Right Secure & Instant Badge */}
            <View style={[styles.secureBadge, { borderColor: theme.accentBorder, backgroundColor: theme.accentSoft }]}>
              <Ionicons name="lock-closed-outline" size={12} color={theme.accent} />
              <Text style={[styles.secureBadgeText, { color: theme.accent }]}>
                {t("swap_tokens.confirm.badge_secure", "Secure & Instant")}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* Final Review Intro Card */}
        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.introHeaderRow}>
            <View style={[styles.introIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="shield-checkmark" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.introEyebrow, { color: theme.accent }]}>
                {t("swap_tokens.confirm.intro_eyebrow", "FINAL REVIEW")}
              </Text>
              <Text style={[styles.introTitle, { color: theme.text }]}>
                {t("swap_tokens.confirm.intro_title", "Everything looks ready")}
              </Text>
            </View>
          </View>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            {t("swap_tokens.confirm.intro_desc", "Verify the tokens, amounts, and exchange rate below before submitting this instant conversion.")}
          </Text>
        </View>

        {/* Swap Flow Visual (YOU SEND -> YOU RECEIVE) */}
        <View style={styles.flowRow}>
          {/* YOU SEND Card */}
          <View style={[styles.flowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.flowDirection, { color: theme.muted }]}>
              {t("swap_tokens.confirm.direction_send", "YOU SEND")}
            </Text>
            <View style={styles.tokenMetaRow}>
              <View style={[styles.tokenIconCircle, { backgroundColor: fromConfig.bg }]}>
                <Text style={[styles.tokenIconText, { color: fromConfig.color }]}>{fromToken}</Text>
              </View>
              <Text style={[styles.tokenSubName, { color: theme.muted }]}>{fromConfig.name}</Text>
            </View>
            <Text style={[styles.flowAmount, { color: theme.text }]} adjustsFontSizeToFit numberOfLines={1}>
              {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromToken}
            </Text>
          </View>

          {/* Center Green Arrow */}
          <View style={[styles.flowArrow, { backgroundColor: theme.card, borderColor: theme.accent }]}>
            <Ionicons name="arrow-forward" size={18} color={theme.accent} />
          </View>

          {/* YOU RECEIVE Card */}
          <View style={[styles.flowCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Text style={[styles.flowDirection, { color: theme.accent }]}>
              {t("swap_tokens.confirm.direction_receive", "YOU RECEIVE")}
            </Text>
            <View style={styles.tokenMetaRow}>
              <View style={[styles.tokenIconCircle, { backgroundColor: toConfig.bg }]}>
                <Text style={[styles.tokenIconText, { color: toConfig.color }]}>{toToken}</Text>
              </View>
              <Text style={[styles.tokenSubName, { color: theme.accent + "AA" }]}>{toConfig.name}</Text>
            </View>
            <Text style={[styles.flowAmount, { color: theme.accent }]} adjustsFontSizeToFit numberOfLines={1}>
              {estimatedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toToken}
            </Text>
          </View>
        </View>

        {/* Detailed Breakdown Card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Row 1: Exchange Rate */}
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
              </View>
              <Text style={[styles.detailLabel, { color: theme.text }]}>
                {t("swap_tokens.confirm.detail_rate_label", "Exchange Rate")}
              </Text>
            </View>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              1 {fromToken} = {exchangeRate.toFixed(4)} {toToken}
            </Text>
          </View>

          <View style={[styles.dottedLine, { borderColor: theme.border }]} />

          {/* Row 2: Platform Fee */}
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: theme.blueSoft }]}>
                <Ionicons name="pricetag-outline" size={14} color={theme.blue} />
              </View>
              <TouchableOpacity onPress={handleShowFeeInfo} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[styles.detailLabel, { color: theme.text }]}>
                  {t("swap_tokens.confirm.detail_fee_label", "Platform Fee (1.5%)")}
                </Text>
                <Ionicons name="information-circle-outline" size={13} color={theme.muted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {feeNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromToken}
            </Text>
          </View>

          <View style={[styles.dottedLine, { borderColor: theme.border }]} />

          {/* Row 3: Amount Sent */}
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: theme.blueSoft }]}>
                <Ionicons name="arrow-up" size={14} color={theme.blue} />
              </View>
              <Text style={[styles.detailLabel, { color: theme.text }]}>
                {t("swap_tokens.confirm.detail_amount_sent_label", "Amount Sent")}
              </Text>
            </View>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromToken}
            </Text>
          </View>

          <View style={[styles.dottedLine, { borderColor: theme.border }]} />

          {/* Row 4: Total Deducted */}
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: theme.amberSoft }]}>
                <Ionicons name="remove-circle-outline" size={14} color={theme.amber} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: theme.text }]}>
                  {t("swap_tokens.confirm.detail_total_deducted", "Total Deducted")}
                </Text>
                <Text style={[styles.rowSubtext, { color: theme.muted }]}>Amount sent + platform fee</Text>
              </View>
            </View>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {totalDeductedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromToken}
            </Text>
          </View>

          <View style={[styles.dottedLine, { borderColor: theme.border }]} />

          {/* Row 5: Estimated Received */}
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="arrow-down" size={14} color={theme.accent} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: theme.text }]}>
                  {t("swap_tokens.confirm.detail_estimated_received_label", "Estimated Received")}
                </Text>
                <Text style={[styles.rowSubtext, { color: theme.muted }]}>This is the amount you will receive</Text>
              </View>
            </View>
            <Text style={[styles.detailTotalValue, { color: theme.accent }]}>
              {estimatedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {toToken}
            </Text>
          </View>
        </View>

        {/* Rate Locked Banner with Countdown Timer */}
        <View style={[styles.rateLockCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
            <Ionicons name="flash" size={16} color={theme.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
              {t("swap_tokens.confirm.rate_lock_title", "Rate locked for this session")}
            </Text>
            <Text style={[styles.infoDesc, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              {t("swap_tokens.confirm.rate_lock_desc", "The exchange rate shown is locked for this transaction and won't change once confirmed.")}
            </Text>
          </View>

          {/* Countdown Timer Box */}
          <TouchableOpacity
            style={[styles.timerBox, { backgroundColor: theme.card, borderColor: theme.blueBorder }]}
            onPress={timeLeft === 0 ? handleRefreshRate : undefined}
            activeOpacity={timeLeft === 0 ? 0.7 : 1}
          >
            <Text style={[styles.timerEyebrow, { color: theme.muted }]}>
              {timeLeft === 0 ? "EXPIRED" : "EXPIRES IN"}
            </Text>
            <Text style={[styles.timerText, { color: timeLeft === 0 ? theme.red : theme.blue }]}>
              {timeLeft === 0 ? "Refresh" : formatTimer(timeLeft)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Card */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: theme.redSoft, borderColor: theme.redBorder }]}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.red} />
            <Text style={[styles.errorText, { color: theme.red }]}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.back()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={theme.muted} />
            <Text style={[styles.backBtnText, { color: theme.muted }]}>
              {t("swap_tokens.confirm.btn_back", "Back")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.confirmBtnText}>{t("swap_tokens.confirm.btn_confirm", "Confirm Swap")}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </>
            )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10, borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 10, paddingBottom: 16,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  secureBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  secureBadgeText: { fontSize: 11, fontWeight: "700" },

  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },

  introCard: {
    borderRadius: 24, padding: 18, marginBottom: 16, borderWidth: 1, gap: 10,
  },
  introHeaderRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  introIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  introEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 2 },
  introTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  introSubtitle: { fontSize: 13, lineHeight: 19 },

  flowRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, position: "relative",
  },
  flowCard: {
    flex: 1, borderRadius: 22, borderWidth: 1.5,
    padding: 14, gap: 6,
  },
  flowDirection: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8 },
  tokenMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tokenIconCircle: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  tokenIconText: { fontSize: 10, fontWeight: "900" },
  tokenSubName: { fontSize: 11, fontWeight: "600" },
  flowAmount: { fontSize: 17, fontWeight: "900", marginTop: 2 },
  flowArrow: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, flexShrink: 0,
    marginHorizontal: -4, zIndex: 2,
  },

  detailsCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 16, gap: 10,
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4,
  },
  detailRowLeft: {
    flexDirection: "row", alignItems: "center", gap: 10, flex: 1,
  },
  rowIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  detailLabel: { fontSize: 13, fontWeight: "600" },
  rowSubtext: { fontSize: 10, fontWeight: "500", marginTop: 1 },
  detailValue: { fontSize: 13, fontWeight: "700" },
  detailTotalValue: { fontSize: 15, fontWeight: "900" },
  dottedLine: {
    borderStyle: "dashed", borderWidth: 0.5, marginVertical: 4, opacity: 0.4,
  },

  rateLockCard: {
    flexDirection: "row", gap: 12, alignItems: "center",
    padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 16,
  },
  infoIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  infoDesc: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  timerBox: {
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8,
    alignItems: "center", justifyContent: "center", minWidth: 70,
  },
  timerEyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 0.5, marginBottom: 2 },
  timerText: { fontSize: 13, fontWeight: "900" },

  errorCard: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },

  btnRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  backBtn: {
    flex: 1, height: 56, borderRadius: 18, borderWidth: 1,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  backBtnText: { fontSize: 16, fontWeight: "700" },
  confirmBtn: {
    flex: 2, height: 56, borderRadius: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  trustFooterRow: {
    flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 12,
  },
  trustFooterItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  trustFooterText: { fontSize: 11, fontWeight: "600" },
});
