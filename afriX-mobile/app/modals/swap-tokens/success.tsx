// app/modals/swap-tokens/success.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSwapStore } from "@/stores";
import { TOKEN_CONFIG, TokenType } from "@/components/ui/TokenSelectModal";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

export default function SwapSuccessScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

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
  };

  const {
    fromToken, toToken, amount, estimatedReceive, exchangeRate, swapFee, lastFee, lastReceivedAmount, reset
  } = useSwapStore();

  const amountNum = parseFloat(amount) || 0;
  const receivedNum = lastReceivedAmount ?? (parseFloat(estimatedReceive) || 0);
  const feeNum = lastFee ?? (swapFee ?? (amountNum * 0.015));

  const fromConfig = TOKEN_CONFIG[fromToken as TokenType] || TOKEN_CONFIG["CT"];
  const toConfig = TOKEN_CONFIG[toToken as TokenType] || TOKEN_CONFIG["NT"];

  const [completedAtText, setCompletedAtText] = useState("");

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setCompletedAtText(`${dateStr} • ${timeStr}`);
  }, []);

  const handleDone = () => { reset(); router.replace("/(tabs)"); };
  const handleSwapAgain = () => { reset(); router.replace("/modals/swap-tokens"); };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient Glow */}
      <LinearGradient
        colors={isDark ? ["rgba(0,177,79,0.16)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.10)", "rgba(245,247,251,0)"]}
        style={styles.glow}
        pointerEvents="none"
      />

      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animated Hero Badge */}
        <View style={styles.heroContainer}>
          <View style={[styles.outerGlowRing, { backgroundColor: theme.accentSoft }]}>
            <View style={[styles.innerCheckCircle, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={44} color="#FFFFFF" />
            </View>
          </View>
          {/* Sparkles */}
          <View style={[styles.sparkle, styles.sparkleTopLeft]}>
            <Ionicons name="sparkles" size={14} color={theme.accent} />
          </View>
          <View style={[styles.sparkle, styles.sparkleTopRight]}>
            <Ionicons name="sparkles" size={16} color={theme.accent} />
          </View>
        </View>

        {/* Heading */}
        <Text style={[styles.title, { color: theme.text }]}>
          {t("swap_tokens.success.title", "Swap Successful!")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {t("swap_tokens.success.subtitle", "Your tokens have been converted and your wallet is updated.")}
        </Text>

        {/* Balances are updated Banner Card */}
        <View style={[styles.completedBanner, { backgroundColor: theme.card, borderColor: theme.accentBorder }]}>
          <View style={[styles.completedIconBox, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.completedEyebrow, { color: theme.accent }]}>
              {t("swap_tokens.success.banner_eyebrow", "COMPLETED")}
            </Text>
            <Text style={[styles.completedTitle, { color: theme.text }]}>
              {t("swap_tokens.success.banner_title", "Balances are updated")}
            </Text>
            <Text style={[styles.completedDesc, { color: theme.muted }]}>
              {t("swap_tokens.success.banner_subtitle", "The received amount is now reflected in your wallet.")}
            </Text>
          </View>
          <View style={[styles.walletBadge, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="wallet" size={20} color={theme.accent} />
            <View style={[styles.walletCheckBadge, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={8} color="#FFF" />
            </View>
          </View>
        </View>

        {/* Conversion & Details Combined Card */}
        <View style={[styles.mainCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Conversion Flow Row */}
          <View style={styles.conversionRow}>
            {/* Left: SWAPPED */}
            <View style={styles.conversionCol}>
              <Text style={[styles.conversionEyebrow, { color: theme.muted }]}>
                {t("swap_tokens.success.direction_swapped", "SWAPPED")}
              </Text>
              <View style={[styles.tokenIconBadge, { backgroundColor: fromConfig.bg }]}>
                <Text style={[styles.tokenIconText, { color: fromConfig.color }]}>{fromToken}</Text>
              </View>
              <Text style={[styles.amountValue, { color: theme.text }]} adjustsFontSizeToFit numberOfLines={1}>
                {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.tickerSub, { color: theme.muted }]}>{fromToken}</Text>
            </View>

            {/* Center Arrow */}
            <View style={[styles.arrowCircle, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
              <Ionicons name="arrow-forward" size={18} color={theme.accent} />
            </View>

            {/* Right: RECEIVED */}
            <View style={styles.conversionCol}>
              <Text style={[styles.conversionEyebrow, { color: theme.accent }]}>
                {t("swap_tokens.success.direction_received", "RECEIVED")}
              </Text>
              <View style={[styles.tokenIconBadge, { backgroundColor: toConfig.bg }]}>
                <Text style={[styles.tokenIconText, { color: toConfig.color }]}>{toToken}</Text>
              </View>
              <Text style={[styles.amountValue, { color: theme.accent }]} adjustsFontSizeToFit numberOfLines={1}>
                {receivedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <Text style={[styles.tickerSub, { color: theme.accent }]}>{toToken}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Itemized Details */}
          <View style={styles.detailsList}>
            {/* Exchange Rate */}
            <View style={styles.detailRow}>
              <View style={styles.detailRowLeft}>
                <View style={[styles.miniIconBox, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="swap-horizontal" size={13} color={theme.accent} />
                </View>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>
                  {t("swap_tokens.confirm.detail_rate_label", "Exchange Rate")}
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                1 {fromToken} = {exchangeRate.toFixed(4)} {toToken}
              </Text>
            </View>

            {/* Platform Fee */}
            <View style={styles.detailRow}>
              <View style={styles.detailRowLeft}>
                <View style={[styles.miniIconBox, { backgroundColor: theme.blueSoft }]}>
                  <Ionicons name="pricetag-outline" size={13} color={theme.blue} />
                </View>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>
                  {t("swap_tokens.success.fee_label", "Platform Fee (1.5%)")}
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {feeNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromToken}
              </Text>
            </View>

            {/* Completed At */}
            <View style={styles.detailRow}>
              <View style={styles.detailRowLeft}>
                <View style={[styles.miniIconBox, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="calendar-outline" size={13} color={theme.accent} />
                </View>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>Completed At</Text>
              </View>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {completedAtText || "Just now"}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Balances Updated Sync Card */}
        <View style={[styles.walletSyncCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.syncIconBox, { backgroundColor: theme.blue + "22" }]}>
            <Ionicons name="wallet-outline" size={18} color={theme.blue} />
          </View>
          <Text style={[styles.syncText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
            {t("swap_tokens.success.info_desc", "Your wallet balances have been updated to reflect this swap.")}
          </Text>
          <View style={[styles.syncCheck, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={12} color="#FFF" />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.swapAgainBtn, { borderColor: theme.accent, backgroundColor: theme.card }]}
            onPress={handleSwapAgain}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={18} color={theme.accent} />
            <Text style={[styles.swapAgainText, { color: theme.accent }]}>
              {t("swap_tokens.success.btn_swap_again", "Swap Again")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.accent }]}
            onPress={handleDone}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>{t("swap_tokens.success.btn_done", "Done")}</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Footer */}
        <View style={styles.trustFooterRow}>
          <View style={styles.trustFooterItem}>
            <Ionicons name="shield-checkmark-outline" size={15} color={theme.accent} />
            <View>
              <Text style={[styles.trustTitle, { color: theme.text }]}>Secure Transaction</Text>
              <Text style={[styles.trustSub, { color: theme.muted }]}>Bank-grade security</Text>
            </View>
          </View>
          <View style={styles.trustFooterItem}>
            <Ionicons name="flash-outline" size={15} color={theme.amber} />
            <View>
              <Text style={[styles.trustTitle, { color: theme.text }]}>Instant Settlement</Text>
              <Text style={[styles.trustSub, { color: theme.muted }]}>Processed instantly</Text>
            </View>
          </View>
          <View style={styles.trustFooterItem}>
            <Ionicons name="people-outline" size={15} color={theme.blue} />
            <View>
              <Text style={[styles.trustTitle, { color: theme.text }]}>Trusted by Thousands</Text>
              <Text style={[styles.trustSub, { color: theme.muted }]}>Across West Africa</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0, height: 320,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  heroContainer: {
    position: "relative",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  outerGlowRing: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
  },
  innerCheckCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  sparkle: { position: "absolute" },
  sparkleTopLeft: { top: -4, left: -8 },
  sparkleTopRight: { top: 4, right: -10 },

  title: {
    fontSize: 26, fontWeight: "900", letterSpacing: -0.5,
    textAlign: "center", marginBottom: 6,
  },
  subtitle: {
    fontSize: 13, fontWeight: "500", textAlign: "center",
    lineHeight: 18, marginBottom: 20, paddingHorizontal: 20,
  },

  completedBanner: {
    width: "100%", borderRadius: 22, borderWidth: 1, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16,
  },
  completedIconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  completedEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 2 },
  completedTitle: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
  completedDesc: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  walletBadge: {
    width: 42, height: 42, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  walletCheckBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },

  mainCard: {
    width: "100%", borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 16,
  },
  conversionRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingBottom: 16,
  },
  conversionCol: {
    flex: 1, alignItems: "center", gap: 4,
  },
  conversionEyebrow: {
    fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 2,
  },
  tokenIconBadge: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", marginVertical: 2,
  },
  tokenIconText: { fontSize: 13, fontWeight: "900" },
  amountValue: { fontSize: 20, fontWeight: "900", textAlign: "center" },
  tickerSub: { fontSize: 11, fontWeight: "700" },
  arrowCircle: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginHorizontal: 8,
  },

  divider: { height: 1, marginVertical: 12 },

  detailsList: { gap: 10 },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  detailRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniIconBox: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  detailLabel: { fontSize: 12, fontWeight: "600" },
  detailValue: { fontSize: 12, fontWeight: "700" },

  walletSyncCard: {
    width: "100%", flexDirection: "row", gap: 10, alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 20,
  },
  syncIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  syncText: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 17 },
  syncCheck: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  btnRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  swapAgainBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  swapAgainText: { fontSize: 15, fontWeight: "800" },
  doneBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { fontSize: 15, fontWeight: "800", color: "#FFF" },

  trustFooterRow: {
    width: "100%", flexDirection: "row", justifyContent: "space-around",
    alignItems: "center", paddingVertical: 10,
  },
  trustFooterItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  trustTitle: { fontSize: 10, fontWeight: "700" },
  trustSub: { fontSize: 9, fontWeight: "500" },
});
