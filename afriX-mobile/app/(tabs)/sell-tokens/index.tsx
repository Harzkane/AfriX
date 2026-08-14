// app/(tabs)/sell-tokens/index.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useWalletStore } from "@/stores";
import {
  parseAmountInput,
  formatAmountForInput,
  clampAmountToMax,
  formatAmount,
} from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import TokenSelectModal, { TokenType, TOKEN_CONFIG } from "@/components/ui/TokenSelectModal";

const TOKENS: TokenType[] = ["NT", "CT", "USDT"];
const PRESET_AMOUNTS = [1000, 5000, 10000, 20000, 50000];

export default function SellTokensScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { wallets } = useWalletStore();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenType>("NT");
  const [tokenModalVisible, setTokenModalVisible] = useState(false);
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
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    warning: "#F59E0B",
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    warningBorder: isDark ? "rgba(245,158,11,0.3)" : "#FEF3C7",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.3)" : "#BFDBFE",
    placeholder: isDark ? "#475569" : "#9CA3AF",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
  };

  const preSelectedAgentId = params.agentId as string | undefined;
  const preSelectedAgentName = params.agentName as string | undefined;

  const getAvailableBalance = (token: string) => {
    const wallet = wallets.find((w) => w.token_type === token);
    return wallet ? parseFloat(wallet.available_balance) : 0;
  };

  const availableBalance = getAvailableBalance(selectedToken);
  const amountNum = parseFloat(amount) || 0;
  const hasInsufficientBalance = amountNum > availableBalance;

  // Balance usage percentage
  const balancePercentage = availableBalance > 0 ? Math.min(100, Math.round((amountNum / availableBalance) * 100)) : 0;

  useEffect(() => {
    if (amount && amountNum > availableBalance) {
      setAmount(clampAmountToMax(amount, availableBalance, selectedToken));
    }
  }, [selectedToken]);

  const handleAmountChange = (text: string) => {
    const parsed = parseAmountInput(text, selectedToken);
    const clamped = clampAmountToMax(parsed, availableBalance, selectedToken);
    setAmount(clamped);
  };

  const handleSetPreset = (preset: number) => {
    const clamped = Math.min(preset, availableBalance);
    const raw = clamped.toFixed(2);
    setAmount(raw);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSetMax = () => {
    const raw = availableBalance.toFixed(2);
    setAmount(raw);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleContinue = () => {
    if (!amount || amountNum <= 0 || hasInsufficientBalance) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (preSelectedAgentId && preSelectedAgentName) {
      router.push({
        pathname: "/(tabs)/sell-tokens/bank-details",
        params: { amount, tokenType: selectedToken, agentId: preSelectedAgentId, agentName: preSelectedAgentName },
      });
    } else {
      router.push({ pathname: "/(tabs)/sell-tokens/select-agent", params: { amount, tokenType: selectedToken } });
    }
  };

  const isValid = !!(amount && amountNum > 0 && !hasInsufficientBalance);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 72}>
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
                  {t("activity.btn_sell", "Sell Tokens")}
                </Text>
                <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                  <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                    {t("sell_tokens.index_subtitle", "Redeem your tokens via an agent for cash payout.")}
                  </Text>
                </Animated.View>
              </View>
              <View style={{ width: 42 }} />
            </View>
          </SafeAreaView>
        </Animated.View>

        <Animated.ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
          keyboardShouldPersistTaps="handled"
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

          {/* SELECT TOKEN TO SELL Section */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("sell_tokens.select_token_label", "SELECT TOKEN TO SELL")}
          </Text>
          <View style={styles.tokenGrid}>
            {TOKENS.map((token) => {
              const isSelected = selectedToken === token;
              const config = TOKEN_CONFIG[token];
              return (
                <TouchableOpacity
                  key={token}
                  style={[
                    styles.tokenCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedToken(token);
                  }}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={[styles.tokenCheck, { backgroundColor: theme.accent }]}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                  <Text style={[styles.tokenCardSub, { color: isSelected ? theme.accent : theme.muted }]}>
                    {config.subtitle.toUpperCase()}
                  </Text>
                  <Text style={[styles.tokenCardLabel, { color: isSelected ? theme.accent : theme.text }]}>
                    {token}
                  </Text>
                  <Text style={[styles.tokenCardName, { color: isSelected ? theme.accent + "CC" : theme.muted }]}>
                    {config.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AMOUNT TO SELL Card */}
          <View style={[styles.amountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.amountHeaderRow}>
              <Text style={[styles.amountEyebrow, { color: theme.muted }]}>
                {t("sell_tokens.amount_eyebrow", "AMOUNT TO SELL")}
              </Text>

              {/* Token Selector Pill */}
              <TouchableOpacity
                style={[styles.tokenPill, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                onPress={() => setTokenModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tokenPillText, { color: theme.text }]}>{selectedToken}</Text>
                <Ionicons name="chevron-down" size={14} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputRow}>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={formatAmountForInput(amount, selectedToken)}
                onChangeText={handleAmountChange}
                numberOfLines={1}
              />
            </View>

            <View style={[styles.amountDivider, { backgroundColor: theme.border }]} />

            {/* Available Balance Progress Track */}
            <View style={styles.balanceContainer}>
              <View style={styles.balanceHeaderRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="wallet-outline" size={14} color={theme.muted} />
                  <Text style={[styles.balanceLabel, { color: theme.muted }]}>{t("sell_tokens.available_label", "Available Balance")}</Text>
                </View>
                <Text style={[styles.balanceValueText, { color: theme.accent }]}>
                  {formatAmount(availableBalance, selectedToken)} {selectedToken}
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

            {hasInsufficientBalance && amountNum > 0 && (
              <View style={[styles.insufficientBadge, { backgroundColor: "rgba(239,68,68,0.10)", borderColor: "rgba(239,68,68,0.25)" }]}>
                <Ionicons name="warning-outline" size={13} color="#EF4444" />
                <Text style={styles.insufficientText}>{t("sell_tokens.error_exceeds_balance", "Exceeds available balance")}</Text>
              </View>
            )}
          </View>

          {/* Escrow Notice Box */}
          <View style={[styles.escrowCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.blue} />
            </View>
            <Text style={[styles.escrowText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              {t("sell_tokens.escrow_hint", "Tokens are held in escrow until the agent confirms payment to your account.")}
            </Text>
          </View>

          {/* QUICK AMOUNTS Section */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("sell_tokens.quick_amounts_label", "QUICK AMOUNTS")}
          </Text>
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
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetChipText, { color: isActive ? theme.accent : theme.text }]}>
                    {preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}
              onPress={handleSetMax}
              activeOpacity={0.8}
            >
              <Text style={[styles.presetChipText, { color: theme.blue, fontWeight: "800" }]}>{t("sell_tokens.btn_max", "MAX")}</Text>
            </TouchableOpacity>
          </View>

          {/* How it works Card Container */}
          <View style={[styles.howItWorksCard, { backgroundColor: theme.card, borderColor: theme.accentBorder }]}>
            <View style={[styles.graphicBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="person" size={20} color={theme.accent} />
              <View style={[styles.storeBadge, { backgroundColor: theme.accent }]}>
                <Ionicons name="storefront" size={10} color="#FFF" />
              </View>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.howTitle, { color: theme.accent }]}>
                {t("sell_tokens.how_it_works_title", "How it works")}
              </Text>
              <View style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
                <Text style={[styles.bulletText, { color: theme.muted }]}>
                  {t("sell_tokens.how_step_1", "Select the token and amount to sell.")}
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
                <Text style={[styles.bulletText, { color: theme.muted }]}>
                  {t("sell_tokens.how_step_2", "Choose an agent to complete the transaction.")}
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
                <Text style={[styles.bulletText, { color: theme.muted }]}>
                  {t("sell_tokens.how_step_3", "Receive your cash once payment is confirmed.")}
                </Text>
              </View>
            </View>
          </View>

          {/* CONTINUE BUTTON */}
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: theme.accent }, !isValid && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {preSelectedAgentId
                ? t("sell_tokens.btn_continue_payment", "Continue to Payment Details")
                : t("sell_tokens.btn_continue_agent", "Continue to Agent Selection")}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>

          {/* Trust Footer */}
          <View style={styles.trustFooter}>
            <Ionicons name="lock-closed-outline" size={12} color={theme.muted} />
            <Text style={[styles.trustText, { color: theme.muted }]}>Secure • Fast • Trusted</Text>
          </View>

          <View style={{ height: 30 }} />
        </Animated.ScrollView>

        {/* Token Selection Modal */}
        <TokenSelectModal
          visible={tokenModalVisible}
          onClose={() => setTokenModalVisible(false)}
          selectedToken={selectedToken}
          onSelectToken={(token: TokenType) => setSelectedToken(token)}
          title="Select Token to Sell"
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

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  tokenGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  tokenCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    position: "relative",
  },
  tokenCheck: {
    position: "absolute",
    top: 8, right: 8,
    width: 18, height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenCardSub: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  tokenCardLabel: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 },
  tokenCardName: { fontSize: 10, fontWeight: "600", textAlign: "center" },

  amountCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  amountHeaderRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
  },
  amountEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  tokenPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1,
  },
  tokenPillText: { fontSize: 13, fontWeight: "800" },

  amountInputRow: {
    marginBottom: 12,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    padding: 0,
  },
  amountDivider: { height: 1, marginBottom: 12 },

  balanceContainer: { gap: 6 },
  balanceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { fontSize: 12, fontWeight: "600" },
  balanceValueText: { fontSize: 12, fontWeight: "800" },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginVertical: 4 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressSubtext: { fontSize: 11, fontWeight: "500" },

  insufficientBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  insufficientText: { fontSize: 12, fontWeight: "700", color: "#EF4444" },

  escrowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoIconBox: {
    width: 36, height: 36,
    borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  escrowText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "500" },

  presetsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  presetChipText: { fontSize: 13, fontWeight: "800" },

  howItWorksCard: {
    flexDirection: "row",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    gap: 14,
    alignItems: "center",
  },
  graphicBox: {
    width: 48, height: 48, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  storeBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#07111A",
  },
  howTitle: { fontSize: 14, fontWeight: "800" },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bulletText: { fontSize: 12, fontWeight: "500", flex: 1 },

  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 18,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  trustFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14,
  },
  trustText: { fontSize: 12, fontWeight: "500" },
});
