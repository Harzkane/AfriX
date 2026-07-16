// app/modals/swap-tokens/success.tsx
import React, { useEffect } from "react";
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
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
  };

  const { fromToken, toToken, amount, estimatedReceive, swapFee, lastFee, lastReceivedAmount, reset } = useSwapStore();

  const amountNum = parseFloat(amount) || 0;
  const receivedNum = lastReceivedAmount ?? (parseFloat(estimatedReceive) || 0);
  const feeNum = lastFee ?? (swapFee ?? 0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = () => { reset(); router.replace("/(tabs)"); };
  const handleSwapAgain = () => { reset(); router.replace("/modals/swap-tokens"); };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient Glow */}
      <LinearGradient
        colors={isDark ? ["rgba(0,177,79,0.14)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.10)", "rgba(245,247,251,0)"]}
        style={styles.glow}
        pointerEvents="none"
      />

      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.outerRing, { backgroundColor: theme.accentSoft }]}>
            <View style={[styles.innerRing, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Heading */}
        <Text style={[styles.title, { color: theme.text }]}>{t("swap_tokens.success.title", "Swap Successful!")}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {t("swap_tokens.success.subtitle", "Your tokens have been converted and your wallet is updated.")}
        </Text>

        {/* Summary banner card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>{t("swap_tokens.success.banner_eyebrow", "COMPLETED")}</Text>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>{t("swap_tokens.success.banner_title", "Balances are updated")}</Text>
          <Text style={[styles.summarySubtitle, { color: theme.muted }]}>
            {t("swap_tokens.success.banner_subtitle", "The received amount is now reflected in your wallet.")}
          </Text>
        </View>

        {/* Swap flow visual */}
        <View style={styles.flowRow}>
          <View style={[styles.flowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.flowDirection, { color: theme.muted }]}>{t("swap_tokens.success.direction_swapped", "Swapped")}</Text>
            <Text style={[styles.flowToken, { color: theme.text }]}>{fromToken}</Text>
            <Text style={[styles.flowAmount, { color: theme.text }]}>
              {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.flowArrow, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Ionicons name="arrow-forward" size={20} color={theme.accent} />
          </View>

          <View style={[styles.flowCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Text style={[styles.flowDirection, { color: theme.accent }]}>{t("swap_tokens.success.direction_received", "Received")}</Text>
            <Text style={[styles.flowToken, { color: theme.accent }]}>{toToken}</Text>
            <Text style={[styles.flowAmount, { color: theme.accent }]}>
              {receivedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Fee row */}
        {feeNum > 0 && (
          <View style={[styles.feeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.feeRow}>
              <Ionicons name="receipt-outline" size={16} color={theme.muted} />
              <Text style={[styles.feeLabel, { color: theme.muted }]}>{t("swap_tokens.success.fee_label", "Platform Fee")}</Text>
            </View>
            <Text style={[styles.feeValue, { color: theme.text }]}>
              {t("swap_tokens.success.fee_value", "{{fee}} {{fromToken}}", { fee: feeNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), fromToken })}
            </Text>
          </View>
        )}

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
            <Ionicons name="wallet-outline" size={16} color={theme.blue} />
          </View>
          <Text style={[styles.infoText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
            {t("swap_tokens.success.info_desc", "Your wallet balances have been updated to reflect this swap.")}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.btnCol}>
          <TouchableOpacity
            style={[styles.swapAgainBtn, { borderColor: theme.accent, backgroundColor: theme.accentSoft }]}
            onPress={handleSwapAgain}
            activeOpacity={0.8}
          >
            <Ionicons name="swap-horizontal" size={20} color={theme.accent} />
            <Text style={[styles.swapAgainText, { color: theme.accent }]}>{t("swap_tokens.success.btn_swap_again", "Swap Again")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.accent }]}
            onPress={handleDone}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>{t("swap_tokens.success.btn_done", "Done")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0, height: 300,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  iconContainer: { marginBottom: 24 },
  outerRing: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: "center", justifyContent: "center",
  },
  innerRing: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28, fontWeight: "900", letterSpacing: -0.5,
    textAlign: "center", marginBottom: 8,
  },
  subtitle: {
    fontSize: 14, fontWeight: "500", textAlign: "center",
    lineHeight: 20, marginBottom: 28,
  },
  summaryCard: {
    width: "100%", borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 16,
  },
  summaryEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8 },
  summaryTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, letterSpacing: -0.4 },
  summarySubtitle: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  flowRow: {
    width: "100%", flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14,
  },
  flowCard: {
    flex: 1, borderRadius: 22, borderWidth: 1.5, padding: 16, alignItems: "center",
  },
  flowDirection: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  flowToken: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 },
  flowAmount: { fontSize: 16, fontWeight: "700" },
  flowArrow: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, flexShrink: 0,
  },
  feeCard: {
    width: "100%", borderRadius: 18, borderWidth: 1, padding: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14,
  },
  feeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  feeLabel: { fontSize: 13, fontWeight: "600" },
  feeValue: { fontSize: 13, fontWeight: "700" },
  infoCard: {
    width: "100%", flexDirection: "row", gap: 12,
    padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 28,
    alignItems: "center",
  },
  infoIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 19 },
  btnCol: { width: "100%", gap: 12 },
  swapAgainBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 58, borderRadius: 20, borderWidth: 2,
  },
  swapAgainText: { fontSize: 16, fontWeight: "800" },
  doneBtn: {
    height: 58, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  doneBtnText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
});
