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
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTransferStore, useWalletStore } from "@/stores";
import { parseAmountInput, formatAmountForInput, clampAmountToMax, formatAmount, formatUsdEquivalent } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import TokenSelectModal, { TokenType, TOKEN_CONFIG } from "@/components/ui/TokenSelectModal";

const PRESET_AMOUNTS = [1000, 5000, 10000, 20000];

export default function SendAmountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    tokenType,
    setTokenType,
    amount,
    setAmount,
    note,
    setNote,
    fee,
    calculateFee,
    recipientEmail,
    requestId,
  } = useTransferStore();

  const { getWalletByType, exchangeRates } = useWalletStore();
  const wallet = getWalletByType(tokenType);

  const [tokenModalVisible, setTokenModalVisible] = useState(false);

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
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.14)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
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
  }, [amount, tokenType]);

  const availableBalance = wallet ? parseFloat(wallet.available_balance) : 0;
  const amountNum = parseFloat(amount) || 0;
  const total = amountNum + fee;
  const hasInsufficientBalance = total > availableBalance;

  // Percentage of available balance used
  const balancePercentage = availableBalance > 0 ? Math.min(100, Math.round((amountNum / availableBalance) * 100)) : 0;

  const handleContinue = () => {
    if (!amount || amountNum <= 0 || hasInsufficientBalance) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/modals/send-tokens/confirm");
  };

  const handleEditRecipient = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSetPreset = (preset: number) => {
    const clamped = Math.min(preset, availableBalance);
    const raw = clamped.toFixed(2);
    setAmount(raw);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetMax = () => {
    if (wallet) {
      const maxAmount = Math.max(0, availableBalance - (availableBalance * 0.005));
      const raw = maxAmount.toFixed(2);
      setAmount(raw);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAmountChange = (text: string) => {
    const parsed = parseAmountInput(text, tokenType);
    const clamped = clampAmountToMax(parsed, availableBalance, tokenType);
    setAmount(clamped);
  };

  const handleShowFeeInfo = () => {
    Alert.alert(
      t("send_tokens.amount.fee_info_title", "Network Fee (0.5%)"),
      t("send_tokens.amount.fee_info_desc", "A minimal 0.5% fee goes to network validators who process transactions instantly on the blockchain."),
      [{ text: t("common.ok", "OK") }]
    );
  };

  const isValid = amount && amountNum > 0 && !hasInsufficientBalance;
  const tokenConfig = TOKEN_CONFIG[tokenType];

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {t("send_tokens.amount.header_title", "Enter Amount")}
                </Text>
                <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                  <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                    {t("send_tokens.amount.header_subtitle", "Specify how many tokens you want to send.")}
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

          {/* PAYMENT REQUEST ATTACHED Banner (if fulfilling a Payment Request) */}
          {!!requestId && (
            <View style={[styles.sendingToCard, { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder, marginBottom: 12 }]}>
              <View style={[styles.userIconCircle, { backgroundColor: isDark ? "rgba(245,158,11,0.2)" : "#FEF3C7" }]}>
                <Ionicons name="receipt-outline" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sendingToEyebrow, { color: "#D97706", fontWeight: "700" }]}>
                  {t("send_tokens.amount.req_attached_eyebrow", "PAYMENT REQUEST ATTACHED")}
                </Text>
                <Text style={[styles.sendingToEmail, { color: theme.text, fontWeight: "700" }]} numberOfLines={1}>
                  {requestId}
                </Text>
              </View>
            </View>
          )}

          {/* SENDING TO Banner Card */}
          <View style={[styles.sendingToCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.userIconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="person" size={18} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sendingToEyebrow, { color: theme.muted }]}>
                {t("send_tokens.amount.sending_to", "SENDING TO")}
              </Text>
              <Text style={[styles.sendingToEmail, { color: theme.text }]} numberOfLines={1}>
                {recipientEmail || "user1_ng@gmail.com"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleEditRecipient} style={[styles.editBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} activeOpacity={0.7}>
              <Ionicons name="pencil" size={16} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {/* AMOUNT TO SEND Card */}
          <View style={[styles.amountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.amountHeaderRow}>
              <Text style={[styles.amountEyebrow, { color: theme.muted }]}>
                {t("send_tokens.amount.amount_eyebrow", "AMOUNT TO SEND")}
              </Text>

              {/* Token Selector Pill */}
              <TouchableOpacity
                style={[styles.tokenPill, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                onPress={() => setTokenModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tokenPillText, { color: theme.text }]}>{tokenType}</Text>
                <Ionicons name="chevron-down" size={14} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputRow}>
              <View style={styles.inputLeftCol}>
                <TextInput
                  style={[styles.bigInput, { color: theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="numeric"
                  value={formatAmountForInput(amount, tokenType)}
                  onChangeText={handleAmountChange}
                  numberOfLines={1}
                />
                <Text style={[styles.usdEstimateText, { color: theme.muted }]}>
                  {formatUsdEquivalent(amountNum, tokenType, exchangeRates)}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.maxTagBtn, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}
                onPress={handleSetMax}
                activeOpacity={0.8}
              >
                <Text style={[styles.maxTagText, { color: theme.blue }]}>
                  {t("send_tokens.amount.btn_max", "MAX")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Available Balance Progress Bar */}
            <View style={styles.balanceContainer}>
              <View style={styles.balanceHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="wallet-outline" size={14} color={theme.muted} />
                  <Text style={[styles.balanceLabel, { color: theme.muted }]}>Available Balance</Text>
                </View>
                <Text style={[styles.balanceValueText, { color: theme.accent }]}>
                  {formatAmount(availableBalance, tokenType)} {tokenType}
                </Text>
              </View>
              {/* Progress Track */}
              <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
                <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${balancePercentage}%` }]} />
              </View>
              <Text style={[styles.progressSubtext, { color: theme.muted }]}>
                {balancePercentage}% of balance
              </Text>
            </View>
          </View>

          {/* Insufficient balance warning */}
          {hasInsufficientBalance && amountNum > 0 && (
            <View style={[styles.warnCard, { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder }]}>
              <Ionicons name="warning-outline" size={18} color={theme.amber} />
              <Text style={[styles.warnText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
                {t("send_tokens.amount.err_insufficient", "Insufficient balance to cover transfer amount + fee.")}
              </Text>
            </View>
          )}

          {/* QUICK AMOUNTS Section */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("send_tokens.amount.quick_amounts", "QUICK AMOUNTS")}
          </Text>
          <View style={styles.presetsRow}>
            {PRESET_AMOUNTS.map((preset) => {
              const isSelected = amountNum === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetChip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                  ]}
                  onPress={() => handleSetPreset(preset)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetChipText, { color: isSelected ? theme.accent : theme.text }]}>
                    {preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {/* MAX Chip */}
            <TouchableOpacity
              style={[
                styles.presetChip,
                { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder },
              ]}
              onPress={handleSetMax}
              activeOpacity={0.8}
            >
              <Text style={[styles.presetChipText, { color: theme.blue }]}>MAX</Text>
            </TouchableOpacity>
          </View>

          {/* TRANSACTION SUMMARY Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryTitleRow}>
              <Ionicons name="receipt-outline" size={16} color={theme.accent} />
              <Text style={[styles.summaryTitle, { color: theme.muted }]}>
                {t("send_tokens.amount.summary_title", "TRANSACTION SUMMARY")}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Amount</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {formatAmount(amountNum, tokenType)} {tokenType}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <TouchableOpacity onPress={handleShowFeeInfo} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[styles.summaryLabel, { color: theme.muted }]}>Network Fee (0.5%)</Text>
                <Ionicons name="information-circle-outline" size={13} color={theme.muted} />
              </TouchableOpacity>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                {formatAmount(fee, tokenType)} {tokenType}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>Total Debit</Text>
              <Text style={[styles.totalValue, { color: theme.accent }]}>
                {formatAmount(total, tokenType)} {tokenType}
              </Text>
            </View>
          </View>

          {/* ADDITIONAL MESSAGE (OPTIONAL) */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("send_tokens.amount.note_label", "ADDITIONAL MESSAGE (OPTIONAL)")}
          </Text>
          <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.noteInputRow}>
              <Ionicons name="chatbubble-outline" size={18} color={theme.muted} style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.noteInput, { color: theme.text }]}
                placeholder={t("send_tokens.amount.note_placeholder", "Add a message for the recipient...")}
                placeholderTextColor={theme.placeholder}
                value={note}
                onChangeText={setNote}
                maxLength={500}
                multiline
                numberOfLines={3}
              />
            </View>
            <Text style={[styles.counterText, { color: theme.muted }]}>
              {note.length}/500
            </Text>
          </View>

          {/* Info Banner */}
          <View style={[styles.infoCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
            </View>
            <Text style={[styles.infoDesc, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              {t("send_tokens.amount.fee_notice", "Network fees go to validators who process transactions on the blockchain.")}
            </Text>
          </View>

          {/* Primary CTA Button */}
          <TouchableOpacity
            style={[
              styles.continueBtn,
              { backgroundColor: theme.accent },
              !isValid && styles.continueBtnDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {t("send_tokens.amount.btn_review", "Review Transfer")}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </Animated.ScrollView>

        {/* Token Picker Modal */}
        <TokenSelectModal
          visible={tokenModalVisible}
          onClose={() => setTokenModalVisible(false)}
          selectedToken={tokenType}
          onSelectToken={(token: TokenType) => setTokenType(token)}
          title="Select Send Token"
        />
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

  sendingToCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  userIconCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  sendingToEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 2 },
  sendingToEmail: { fontSize: 14, fontWeight: "800" },
  editBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  amountCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 16,
  },
  amountHeaderRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  amountEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  tokenPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1,
  },
  tokenPillText: { fontSize: 13, fontWeight: "800" },
  amountInputRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12,
  },
  inputLeftCol: { flex: 1, marginRight: 10 },
  bigInput: { fontSize: 28, fontWeight: "800", padding: 0 },
  usdEstimateText: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  maxTagBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginTop: 4,
  },
  maxTagText: { fontSize: 12, fontWeight: "800" },
  divider: { height: 1, marginVertical: 12 },

  balanceContainer: { gap: 6 },
  balanceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { fontSize: 12, fontWeight: "600" },
  balanceValueText: { fontSize: 12, fontWeight: "800" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginVertical: 4 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressSubtext: { fontSize: 11, fontWeight: "500" },

  warnCard: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 16,
  },
  warnText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "600" },

  sectionLabel: {
    fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.8,
    marginBottom: 10, marginTop: 4,
  },
  presetsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  presetChip: {
    flex: 1, height: 42, borderRadius: 14, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  presetChipText: { fontSize: 13, fontWeight: "800" },

  summaryCard: {
    borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 16, gap: 10,
  },
  summaryTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  summaryTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 13, fontWeight: "500" },
  summaryValue: { fontSize: 13, fontWeight: "700" },
  totalLabel: { fontSize: 14, fontWeight: "800" },
  totalValue: { fontSize: 16, fontWeight: "900" },

  noteCard: {
    borderRadius: 20, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  noteInputRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  noteInput: { flex: 1, fontSize: 13, fontWeight: "500", minHeight: 60, textAlignVertical: "top" },
  counterText: { fontSize: 11, fontWeight: "600", textAlign: "right", marginTop: 4 },

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
