import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  useColorScheme,
  Animated,
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBurnStore } from "@/stores/slices/burnSlice";
import type { BankAccount } from "@/stores/types/burn.types";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function ConfirmSellScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createBurnRequest, loading } = useBurnStore();
  const { t } = useTranslation();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    warning: "#F59E0B",
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    warningBorder: isDark ? "rgba(245,158,11,0.3)" : "#FEF3C7",
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    dangerBorder: isDark ? "rgba(239,68,68,0.3)" : "#FEE2E2",
    successSoft: isDark ? "rgba(0,177,79,0.12)" : "#F0FDF4",
    successBorder: isDark ? "rgba(0,177,79,0.25)" : "#D1FAE5",
  };

  const {
    amount,
    tokenType,
    agentId,
    agentName,
    paymentType,
    bankName,
    accountNumber,
    accountName,
    mobileProvider,
    mobileNumber,
  } = params;

  const isBank = paymentType !== "mobile_money";

  const handleConfirm = async () => {
    if (!tokenType || !amount || !agentId) {
      Alert.alert(t("profile.error_title", "Error"), t("sell_tokens.missing_info_error", "Missing required information. Please start over."));
      return;
    }

    const bank_account: BankAccount = isBank
      ? {
          type: "bank",
          bank_name: (bankName as string) || "",
          account_number: (accountNumber as string) || "",
          account_name: (accountName as string) || "",
        }
      : {
          type: "mobile_money",
          provider: (mobileProvider as string) || "",
          phone_number: (mobileNumber as string) || "",
          account_name: (accountName as string) || "",
        };

    try {
      await createBurnRequest({
        agent_id: agentId as string,
        amount: amount as string,
        token_type: tokenType as string,
        bank_account,
      });

      Alert.alert(t("profile.save_success_title", "Success"), t("sell_tokens.request_success_desc", "Sell request created successfully!"), [
        { text: t("profile.ok_btn", "OK"), onPress: () => router.replace("/(tabs)/sell-tokens/status") },
      ]);
    } catch (error: any) {
      const errorMessage = error.message || "";
      if (errorMessage.includes("cannot create burn requests to themselves")) {
        Alert.alert(
          t("sell_tokens.self_select_warning", "⚠️ Cannot Select Yourself"),
          t("sell_tokens.self_select_desc", "As an agent, you cannot sell tokens to yourself. Please select a different agent to complete this transaction."),
          [{ text: t("profile.ok_btn", "OK"), onPress: () => router.back() }]
        );
      } else {
        Alert.alert(t("profile.error_title", "Error"), error.message || t("sell_tokens.failed_create_request", "Failed to create request"));
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Collapsible Header */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("sell_tokens.review_request_title", "Review Request")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("sell_tokens.review_request_desc", "Review your transaction details before selling.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
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
        {/* Ambient glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("sell_tokens.confirmation_label", "CONFIRMATION")}</Text>
          <Text style={[styles.introTitle, { color: theme.text }]}>{t("sell_tokens.confirm_tx_title", "Confirm Your Transaction")}</Text>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            {t("sell_tokens.confirm_tx_desc", "Please review the details below before processing your sell request.")}
          </Text>
        </View>

        {/* Amount Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.08)", "rgba(14,23,38,0)"] : ["rgba(0,177,79,0.05)", "rgba(255,255,255,0)"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>{t("sell_tokens.total_sell_label", "Total to Sell")}</Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.summaryAmount, { color: theme.text }]}>{parseFloat(amount as string || "0").toLocaleString()}</Text>
            <Text style={[styles.tokenTag, { color: theme.accent }]}>{tokenType}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Details Rows */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="person-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("sell_tokens.recipient_agent_label", "Recipient Agent")}</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{agentName}</Text>
            </View>
          </View>

          {isBank ? (
            <>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="business-outline" size={18} color={theme.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("sell_tokens.payout_bank_label", "Payout Bank")}</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{bankName}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="card-outline" size={18} color={theme.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("sell_tokens.account_details_label", "Account Details")}</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{accountNumber}</Text>
                  <Text style={[styles.accountSubValue, { color: theme.muted }]}>{accountName}</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="phone-portrait-outline" size={18} color={theme.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("sell_tokens.payout_momo_label", "Payout: Mobile Money")}</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{mobileProvider}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="call-outline" size={18} color={theme.accent} />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("agents.phone_number_label", "Phone Number")}</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{mobileNumber}</Text>
                  <Text style={[styles.accountSubValue, { color: theme.muted }]}>{accountName}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Security Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.successSoft, borderColor: theme.successBorder }]}>
          <View style={[styles.infoIconBg, { backgroundColor: theme.card }]}>
            <Ionicons name="shield-checkmark" size={24} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: isDark ? "#4ADE80" : "#166534" }]}>{t("sell_tokens.secure_escrow_title", "Secure Escrow")}</Text>
            <Text style={[styles.infoText, { color: isDark ? "#86EFAC" : "#15803D" }]}>
              {isBank
                ? t("sell_tokens.secure_escrow_desc_bank", "Your tokens will be held securely in escrow. They will only be released to the agent after you confirm receipt of payment in your bank account.")
                : t("sell_tokens.secure_escrow_desc_momo", "Your tokens will be held securely in escrow. They will only be released to the agent after you confirm receipt of payment in your mobile money wallet.")}
            </Text>
          </View>
        </View>

        {/* BUTTON INSIDE SCROLL VIEW */}
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: theme.accent }, loading && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmText}>{t("sell_tokens.btn_confirm_sell", "Confirm & Sell Now")}</Text>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

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
  summaryCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 20,
    gap: 6,
  },
  summaryAmount: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
  },
  tokenTag: {
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  detailIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  accountSubValue: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 22,
    gap: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  confirmButton: {
    height: 58,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.45,
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
