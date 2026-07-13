// app/modals/send-tokens/amount.tsx
import React, { useEffect, useRef, useState } from "react";
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
import { useTransferStore, useWalletStore } from "@/stores";
import { LinearGradient } from "expo-linear-gradient";
import { parseAmountInput, formatAmountForInput, clampAmountToMax, formatAmount } from "@/utils/format";

const PRESET_AMOUNTS = [1000, 5000, 10000, 20000];

export default function SendAmountScreen() {
  const router = useRouter();
  const {
    tokenType,
    amount,
    setAmount,
    note,
    setNote,
    fee,
    calculateFee,
    recipientEmail,
  } = useTransferStore();

  const { getWalletByType } = useWalletStore();
  const wallet = getWalletByType(tokenType);

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
    placeholder: isDark ? "#475569" : "#9CA3AF",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#BFDBFE",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  useEffect(() => {
    calculateFee();
  }, [amount]);

  const availableBalance = wallet ? parseFloat(wallet.available_balance) : 0;
  const amountNum = parseFloat(amount) || 0;
  const total = amountNum + fee;
  const hasInsufficientBalance = total > availableBalance;

  const handleContinue = () => {
    if (!amount || amountNum <= 0 || hasInsufficientBalance) return;
    router.push("/modals/send-tokens/confirm");
  };

  const maxByToken = tokenType === "USDT" ? availableBalance : Math.floor(availableBalance);

  const handleSetPreset = (preset: number) => {
    const clamped = Math.min(preset, maxByToken);
    const raw = tokenType === "USDT" ? clamped.toFixed(2) : Math.floor(clamped).toString();
    setAmount(raw);
  };

  const handleSetMax = () => {
    if (wallet) {
      const maxAmount = Math.max(0, availableBalance - (availableBalance * 0.005));
      const raw = tokenType === "USDT" ? maxAmount.toFixed(2) : Math.floor(maxAmount).toString();
      setAmount(raw);
    }
  };

  const handleAmountChange = (text: string) => {
    const parsed = parseAmountInput(text, tokenType);
    const clamped = clampAmountToMax(parsed, availableBalance, tokenType);
    setAmount(clamped);
  };

  const isValid = amount && amountNum > 0 && !hasInsufficientBalance;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? -8 : 12}
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
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Enter Amount</Text>
                <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                  <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                    Specify how many tokens you want to send.
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

          {/* RECIPIENT MINI CARD */}
          <View style={[styles.recipientCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.recipientIconRing, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="person" size={18} color={theme.accent} />
            </View>
            <View style={styles.recipientMeta}>
              <Text style={[styles.recipientLabel, { color: theme.muted }]}>SENDING TO</Text>
              <Text style={[styles.recipientEmail, { color: theme.text }]} numberOfLines={1}>
                {recipientEmail}
              </Text>
            </View>
          </View>

          {/* AMOUNT INPUT CARD */}
          <View style={[styles.amountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LinearGradient
              colors={isDark ? ["rgba(0,177,79,0.06)", "rgba(14,23,38,0)"] : ["rgba(0,177,79,0.04)", "rgba(255,255,255,0)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                placeholder={tokenType === "USDT" ? "0.00" : "0"}
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={formatAmountForInput(amount, tokenType)}
                onChangeText={handleAmountChange}
              />
              <Text style={[styles.amountSuffix, { color: theme.muted }]}>{tokenType}</Text>
            </View>

            <View style={[styles.amountDivider, { backgroundColor: theme.border }]} />

            <View style={styles.balanceRow}>
              <View style={styles.balanceLeft}>
                <Ionicons name="wallet-outline" size={14} color={theme.muted} />
                <Text style={[styles.balanceLabel, { color: theme.muted }]}>Available</Text>
              </View>
              <Text style={[styles.balanceValue, { color: amountNum > 0 && !hasInsufficientBalance ? theme.accent : theme.muted }]}>
                {formatAmount(availableBalance, tokenType)} {tokenType}
              </Text>
            </View>
          </View>

          {/* QUICK PRESETS */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>Quick Amounts</Text>
          <View style={styles.presetsRow}>
            {PRESET_AMOUNTS.map((preset) => {
              const isActive = amountNum === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isActive && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                  ]}
                  onPress={() => handleSetPreset(preset)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetChipText, { color: isActive ? theme.accent : theme.muted }]}>
                    {preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}
              onPress={handleSetMax}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetChipText, { color: theme.blue, fontWeight: "800" }]}>MAX</Text>
            </TouchableOpacity>
          </View>

          {/* FEES SUMMARY CARD */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Transaction Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Amount</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {formatAmount(amountNum, tokenType)} {tokenType}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Network Fee (0.5%)</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {formatAmount(fee, tokenType)} {tokenType}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryTotalRow}>
              <Text style={[styles.summaryTotalLabel, { color: theme.text }]}>Total Debit</Text>
              <Text style={[styles.summaryTotalValue, { color: theme.accent }]}>
                {formatAmount(total, tokenType)} {tokenType}
              </Text>
            </View>
          </View>

          {/* INSUFFICIENT BALANCE WARNING */}
          {hasInsufficientBalance && amountNum > 0 && (
            <View style={[styles.warningBox, { backgroundColor: theme.warningSoft, borderColor: theme.warningBorder }]}>
              <Ionicons name="alert-circle" size={18} color={theme.warning} style={{ marginTop: 1 }} />
              <Text style={[styles.warningText, { color: isDark ? "#FDE68A" : "#92400E" }]}>
                Insufficient funds. You need an additional {formatAmount(total - availableBalance, tokenType)} {tokenType} to complete this.
              </Text>
            </View>
          )}

          {/* OPTIONAL NOTE */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>Additional Message</Text>
          <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[styles.noteInput, { color: theme.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a message for the recipient... (Optional)"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
            <Text style={[styles.noteLimit, { color: theme.muted }]}>{note.length}/500</Text>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: theme.accent }, !isValid && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Review Transfer</Text>
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
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  recipientIconRing: {
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  recipientMeta: { flex: 1, gap: 2 },
  recipientLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  recipientEmail: { fontSize: 15, fontWeight: "700" },
  amountCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    overflow: "hidden",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1,
  },
  amountSuffix: { fontSize: 22, fontWeight: "700", marginLeft: 8 },
  amountDivider: { height: 1, marginBottom: 12 },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  balanceLabel: { fontSize: 13, fontWeight: "600" },
  balanceValue: { fontSize: 13, fontWeight: "800" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  presetChipText: { fontSize: 13, fontWeight: "700" },
  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 13, fontWeight: "600" },
  summaryValue: { fontSize: 13, fontWeight: "700" },
  summaryDivider: { height: 1, marginVertical: 12 },
  summaryTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryTotalLabel: { fontSize: 15, fontWeight: "800" },
  summaryTotalValue: { fontSize: 18, fontWeight: "900" },
  warningBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  noteCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    position: "relative",
  },
  noteInput: {
    fontSize: 14,
    fontWeight: "500",
    textAlignVertical: "top",
    minHeight: 80,
    paddingBottom: 16,
  },
  noteLimit: {
    position: "absolute",
    bottom: 10, right: 12,
    fontSize: 11,
    fontWeight: "600",
  },
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
