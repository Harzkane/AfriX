import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  useColorScheme,
  Animated,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useTransferStore, useWalletStore } from "@/stores";
import { LinearGradient } from "expo-linear-gradient";
import { formatAmount } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { fetchPaymentRequest } from "@/services/paymentRequestService";

export default function ConfirmTransferScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [authenticating, setAuthenticating] = useState(false);

  const {
    recipientEmail,
    tokenType,
    amount,
    note,
    fee,
    loading,
    error,
    executeTransfer,
    requestId,
  } = useTransferStore();

  const { fetchWallets } = useWalletStore();

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
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#BFDBFE",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  useEffect(() => {
    if (!requestId) return;
    const checkRequestStatus = async () => {
      try {
        const res = await fetchPaymentRequest(requestId);
        if (res.data?.data?.status === "completed") {
          Alert.alert(
            t("send_tokens.scan_qr.request_paid_title", "Request Already Paid"),
            t("send_tokens.scan_qr.request_paid_desc", "This payment request ({{reqId}}) has already been paid and fulfilled by a previous transfer.", { reqId: requestId }),
            [{ text: t("common.ok", "OK"), onPress: () => router.back() }]
          );
        } else if (res.data?.data?.status !== "pending") {
          Alert.alert(
            t("send_tokens.scan_qr.request_unavailable_title", "Request Unavailable"),
            t("send_tokens.scan_qr.request_unavailable_desc", "This payment request is no longer available for payment.", { reqId: requestId }),
            [{ text: t("common.ok", "OK"), onPress: () => router.back() }]
          );
        }
      } catch (e) {
        Alert.alert(
          t("send_tokens.scan_qr.request_unavailable_title", "Request Unavailable"),
          t("send_tokens.scan_qr.request_unavailable_desc", "We could not verify this payment request. Please ask the sender to share a fresh QR code or try again later."),
          [{ text: t("common.ok", "OK"), onPress: () => router.back() }]
        );
      }
    };
    checkRequestStatus();
  }, [requestId]);

  const amountNum = parseFloat(amount) || 0;
  const total = amountNum + fee;

  const handleBiometricAuth = async () => {
    try {
      setAuthenticating(true);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        handleConfirm();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("send_tokens.confirm.prompt_biometric", "Confirm token transfer"),
        fallbackLabel: t("send_tokens.confirm.btn_fallback_passcode", "Use Passcode"),
        cancelLabel: t("send_tokens.confirm.btn_cancel", "Cancel"),
        disableDeviceFallback: false,
      });

      if (result.success) {
        handleConfirm();
      } else {
        setAuthenticating(false);
      }
    } catch (e) {
      console.error("Biometric auth error:", e);
      setAuthenticating(false);
      handleConfirm();
    }
  };

  const handleConfirm = async () => {
    try {
      if (requestId) {
        const res = await fetchPaymentRequest(requestId);
        if (res.data?.data?.status === "completed") {
          Alert.alert(
            t("send_tokens.scan_qr.request_paid_title", "Request Already Paid"),
            t("send_tokens.scan_qr.request_paid_desc", "This payment request ({{reqId}}) has already been paid and fulfilled by a previous transfer.", { reqId: requestId })
          );
          setAuthenticating(false);
          return;
        }
        if (res.data?.data?.status !== "pending") {
          Alert.alert(
            t("send_tokens.scan_qr.request_unavailable_title", "Request Unavailable"),
            t("send_tokens.scan_qr.request_unavailable_desc", "This payment request is no longer available for payment.", { reqId: requestId })
          );
          setAuthenticating(false);
          return;
        }
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await executeTransfer();
      await fetchWallets();
      router.replace("/modals/send-tokens/success");
    } catch (e: any) {
      setAuthenticating(false);
      const serverMsg = e.response?.data?.message || e.message || t("send_tokens.confirm.err_failed_fallback", "Please try again");
      const isLimitErr = serverMsg.toLowerCase().includes("limit");

      if (isLimitErr) {
        Alert.alert(
          t("send_tokens.confirm.err_limit_title", "Transaction Limit Reached"),
          serverMsg,
          [
            { text: t("common.cancel", "Cancel"), style: "cancel" },
            {
              text: t("send_tokens.confirm.btn_upgrade_verification", "Upgrade Verification"),
              onPress: () => router.push("/(tabs)/profile"),
            },
          ]
        );
      } else {
        Alert.alert(
          t("send_tokens.confirm.err_failed_title", "Transfer Failed"),
          serverMsg,
          [{ text: t("common.ok", "OK") }]
        );
      }
    }
  };

  const handleFeeInfoAlert = () => {
    Alert.alert(
      t("send_tokens.confirm.fee_info_title", "Network Fee (0.5%)"),
      t("send_tokens.confirm.fee_info_desc", "A standard 0.5% fee is charged to cover blockchain transaction processing and validator execution."),
      [{ text: t("common.ok", "OK") }]
    );
  };

  const isProcessing = loading || authenticating;

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
              disabled={isProcessing}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t("send_tokens.confirm.header_title", "Review Transfer")}
              </Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("send_tokens.confirm.header_subtitle", "Double-check everything before confirming.")}
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
        {/* Ambient Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* CONFIRMATION Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: theme.card, borderColor: theme.accentBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerEyebrow, { color: theme.accent }]}>
              {t("send_tokens.confirm.intro_eyebrow", "CONFIRMATION")}
            </Text>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>
              {t("send_tokens.confirm.intro_title", "Confirm Your Transfer")}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: theme.muted }]}>
              {t("send_tokens.confirm.intro_desc", "Review the details below to ensure everything is correct before you confirm.")}
            </Text>
          </View>

          {/* Shield Badge */}
          <View style={[styles.graphicBox, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={28} color={theme.accent} />
          </View>
        </View>

        {/* TOTAL DEBIT Hero Card */}
        <View style={[styles.totalDebitCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.debitEyebrow, { color: theme.muted }]}>
            {t("send_tokens.confirm.label_total_debit", "TOTAL DEBIT")}
          </Text>

          <Text style={[styles.debitHeroAmount, { color: theme.text }]} numberOfLines={1}>
            {formatAmount(amountNum, tokenType)} <Text style={{ color: theme.accent }}>{tokenType}</Text>
          </Text>

          {/* Charge Sub-badge */}
          <View style={[styles.chargePill, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="lock-closed" size={12} color={theme.accent} />
            <Text style={[styles.chargePillText, { color: theme.muted }]}>
              You will be charged <Text style={{ color: theme.accent, fontWeight: "800" }}>{formatAmount(total, tokenType)} {tokenType}</Text>
            </Text>
          </View>
        </View>

        {/* Itemized Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Payment Request Reference (if fulfilling a Payment Request) */}
          {!!requestId && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: isDark ? "rgba(245,158,11,0.2)" : "#FEF3C7" }]}>
                <Ionicons name="receipt-outline" size={16} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailLabel, { color: "#D97706", fontWeight: "700" }]}>PAYMENT REQUEST REF</Text>
                <Text style={[styles.detailValueText, { color: theme.text, fontWeight: "700" }]} numberOfLines={1}>
                  {requestId}
                </Text>
              </View>
            </View>
          )}

          {/* Recipient Email */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="person" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>RECIPIENT EMAIL</Text>
              <Text style={[styles.detailValueText, { color: theme.text }]} numberOfLines={1}>
                {recipientEmail || "user1_ng@gmail.com"}
              </Text>
            </View>
          </View>

          {/* Token Type */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="wallet" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>TOKEN TYPE</Text>
              <Text style={[styles.detailValueText, { color: theme.text }]}>
                {tokenType}
              </Text>
            </View>
          </View>

          {/* Transfer Amount */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="cash-outline" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>TRANSFER AMOUNT</Text>
              <Text style={[styles.detailValueText, { color: theme.text }]}>
                {formatAmount(amountNum, tokenType)} {tokenType}
              </Text>
            </View>
          </View>

          {/* Network Fee (0.5%) */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="swap-horizontal" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={handleFeeInfoAlert} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>NETWORK FEE (0.5%)</Text>
                <Ionicons name="information-circle-outline" size={13} color={theme.muted} />
              </TouchableOpacity>
              <Text style={[styles.detailValueText, { color: theme.text }]}>
                {formatAmount(fee, tokenType)} {tokenType}
              </Text>
            </View>
          </View>

          {/* Optional Note / Message if provided */}
          {!!note && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: theme.blueSoft }]}>
                <Ionicons name="chatbubble-outline" size={16} color={theme.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>MESSAGE</Text>
                <Text style={[styles.detailValueText, { color: theme.text }]}>
                  {note}
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* TOTAL DEBIT */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalRowLabel, { color: theme.muted }]}>TOTAL DEBIT</Text>
            <Text style={[styles.totalRowValue, { color: theme.accent }]}>
              {formatAmount(total, tokenType)} {tokenType}
            </Text>
          </View>
        </View>

        {/* Secure Settlement Banner */}
        <View style={[styles.securityCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
          <View style={[styles.securityIconBox, { backgroundColor: theme.accent }]}>
            <Ionicons name="shield-checkmark" size={18} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: isDark ? "#4ADE80" : "#15803D" }]}>
              {t("send_tokens.confirm.security_title", "Secure Settlement")}
            </Text>
            <Text style={[styles.securityDesc, { color: isDark ? "#BBF7D0" : "#166534" }]}>
              {t("send_tokens.confirm.security_desc", "This transaction is signed, encrypted, and settled instantly on-chain. It cannot be reversed once broadcasted.")}
            </Text>
          </View>
        </View>

        {/* Primary CTA Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: theme.accent }]}
          onPress={handleBiometricAuth}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color="#FFF" />
              <Text style={styles.confirmBtnText}>
                {t("send_tokens.confirm.btn_confirm", "Confirm Transfer")}
              </Text>
              <Ionicons name="flash" size={16} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        {/* Footer Note */}
        <View style={styles.footerNoteRow}>
          <Ionicons name="information-circle-outline" size={14} color={theme.muted} />
          <Text style={[styles.footerNoteText, { color: theme.muted }]}>
            {t("send_tokens.confirm.footer_note", "Transfers are instant and cannot be reversed.")}
          </Text>
        </View>

        <View style={{ height: 30 }} />
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

  totalDebitCard: {
    borderRadius: 24, borderWidth: 1, padding: 20, alignItems: "center", marginBottom: 16, gap: 10,
  },
  debitEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  debitHeroAmount: { fontSize: 32, fontWeight: "900", letterSpacing: -0.8 },
  chargePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  chargePillText: { fontSize: 12, fontWeight: "600" },

  detailsCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 16, gap: 14,
  },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  detailIconBox: {
    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  detailLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, marginBottom: 2 },
  detailValueText: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1, marginVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalRowLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  totalRowValue: { fontSize: 18, fontWeight: "900" },

  securityCard: {
    flexDirection: "row", gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 20,
    alignItems: "center",
  },
  securityIconBox: {
    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  securityTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  securityDesc: { fontSize: 12, lineHeight: 17, fontWeight: "500" },

  confirmBtn: {
    flexDirection: "row", height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 8,
  },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  footerNoteRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14,
  },
  footerNoteText: { fontSize: 12, fontWeight: "500" },
});
