// app/modals/send-tokens/confirm.tsx
import React, { useRef, useState } from "react";
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

export default function ConfirmTransferScreen() {
  const router = useRouter();
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
    warning: "#F59E0B",
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    warningBorder: isDark ? "rgba(245,158,11,0.25)" : "#FEF3C7",
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    dangerBorder: isDark ? "rgba(239,68,68,0.25)" : "#FEE2E2",
    successSoft: isDark ? "rgba(0,177,79,0.12)" : "#F0FDF4",
    successBorder: isDark ? "rgba(0,177,79,0.25)" : "#D1FAE5",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

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
        promptMessage: "Confirm token transfer",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
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
      await executeTransfer();
      await fetchWallets();
      router.replace("/modals/send-tokens/success");
    } catch (e: any) {
      setAuthenticating(false);
      Alert.alert(
        "Transfer Failed",
        e.response?.data?.message || e.message || "Please try again",
        [{ text: "OK" }]
      );
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
              disabled={loading || authenticating}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Review Transfer</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  Double-check everything before confirming.
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

        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.introEyebrow, { color: theme.accent }]}>CONFIRMATION</Text>
          <Text style={[styles.introTitle, { color: theme.text }]}>Confirm Your Transfer</Text>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            Review details of the recipient and amounts carefully before executing this transaction.
          </Text>
        </View>

        {/* Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.08)", "rgba(14,23,38,0)"] : ["rgba(0,177,79,0.05)", "rgba(255,255,255,0)"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>Total Debit</Text>
          <View style={styles.amountContainer}>
            <Text style={[styles.summaryAmount, { color: theme.text }]}>{parseFloat(amount).toLocaleString()}</Text>
            <Text style={[styles.tokenTag, { color: theme.accent }]}>{tokenType}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Recipient Row */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="person-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>Recipient Email</Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {recipientEmail}
              </Text>
            </View>
          </View>

          {/* Token Row */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="wallet-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>Token Type</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{tokenType}</Text>
            </View>
          </View>

          {/* Subtotal Row */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="cash-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>Transfer Amount</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {formatAmount(amountNum, tokenType)} {tokenType}
              </Text>
            </View>
          </View>

          {/* Fee Row */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="swap-horizontal-outline" size={18} color={theme.accent} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>Network Fee (0.5%)</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {formatAmount(fee, tokenType)} {tokenType}
              </Text>
            </View>
          </View>

          {/* Note Row */}
          {!!note && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBg, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.accent} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>Note</Text>
                <Text style={[styles.detailValue, { color: theme.text, fontWeight: "500" }]}>{note}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Security Info Card */}
        <View style={[styles.securityBox, { backgroundColor: theme.successSoft, borderColor: theme.successBorder }]}>
          <View style={[styles.securityIconBg, { backgroundColor: theme.card }]}>
            <Ionicons name="shield-checkmark" size={24} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityTitle, { color: isDark ? "#4ADE80" : "#166534" }]}>Secure Settlement</Text>
            <Text style={[styles.securityTextContent, { color: isDark ? "#86EFAC" : "#15803D" }]}>
              This transaction is signed, encrypted, and settled instantly on-chain. It cannot be reversed once broadcasted.
            </Text>
          </View>
        </View>

        {/* Error message card */}
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderColor: theme.dangerBorder }]}>
            <Ionicons name="alert-circle" size={18} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          </View>
        )}

        {/* ACTION BUTTONS */}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: theme.accent }, (loading || authenticating) && styles.confirmBtnDisabled]}
          onPress={handleBiometricAuth}
          disabled={loading || authenticating}
          activeOpacity={0.85}
        >
          {loading || authenticating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirm Transfer</Text>
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
  detailsCard: {
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
  securityBox: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 22,
    gap: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  securityIconBg: {
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
  securityTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  securityTextContent: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  confirmBtn: {
    height: 58,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.45,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
