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
import { useTranslation } from "react-i18next";

const TOKENS = ["NT", "CT", "USDT"];
const TOKEN_LABELS: Record<string, string> = { NT: "Naira Token", CT: "CFA Token", USDT: "Tether" };
const TOKEN_SUBTITLES: Record<string, string> = { NT: "Domestic", CT: "Regional", USDT: "Reserve" };
const PRESET_AMOUNTS = [1000, 5000, 10000, 20000, 50000];

export default function SellTokensScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { wallets } = useWalletStore();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("NT");
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
  const tokenTypeForFormat = selectedToken as "NT" | "CT" | "USDT";
  const amountNum = parseFloat(amount) || 0;
  const hasInsufficientBalance = amountNum > availableBalance;

  useEffect(() => {
    if (amount && amountNum > availableBalance) {
      setAmount(clampAmountToMax(amount, availableBalance, tokenTypeForFormat));
    }
  }, [selectedToken]);

  const handleAmountChange = (text: string) => {
    const parsed = parseAmountInput(text, tokenTypeForFormat);
    const clamped = clampAmountToMax(parsed, availableBalance, tokenTypeForFormat);
    setAmount(clamped);
  };

  const handleSetPreset = (preset: number) => {
    const clamped = Math.min(preset, availableBalance);
    const raw = tokenTypeForFormat === "USDT" ? clamped.toFixed(2) : Math.floor(clamped).toString();
    setAmount(raw);
  };

  const handleSetMax = () => {
    const raw = tokenTypeForFormat === "USDT" ? availableBalance.toFixed(2) : Math.floor(availableBalance).toString();
    setAmount(raw);
  };

  const handleContinue = () => {
    if (!amount || amountNum <= 0 || hasInsufficientBalance) return;
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 72}>
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t("activity.btn_sell", "Sell Tokens")}</Text>
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

          {/* TOKEN SELECTOR */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("sell_tokens.select_token_label", "Select Token to Sell")}</Text>
          <View style={styles.tokenGrid}>
            {TOKENS.map((token) => {
              const isSelected = selectedToken === token;
              return (
                <TouchableOpacity
                  key={token}
                  style={[
                    styles.tokenCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                  ]}
                  onPress={() => setSelectedToken(token)}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={[styles.tokenCheck, { backgroundColor: theme.accent }]}>
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    </View>
                  )}
                  <Text style={[styles.tokenCardSub, { color: isSelected ? theme.accent : theme.muted }]}>
                    {t("tokens." + token.toLowerCase() + "_subtitle", TOKEN_SUBTITLES[token])}
                  </Text>
                  <Text style={[styles.tokenCardLabel, { color: isSelected ? theme.accent : theme.text }]}>
                    {token}
                  </Text>
                  <Text style={[styles.tokenCardName, { color: isSelected ? theme.accent + "AA" : theme.muted }]}>
                    {t("tokens." + token.toLowerCase() + "_label", TOKEN_LABELS[token])}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AMOUNT INPUT */}
          <View style={[styles.amountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LinearGradient
              colors={isDark ? ["rgba(0,177,79,0.06)", "rgba(14,23,38,0)"] : ["rgba(0,177,79,0.04)", "rgba(255,255,255,0)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                placeholder={selectedToken === "USDT" ? "0.00" : "0"}
                placeholderTextColor={theme.placeholder}
                keyboardType="numeric"
                value={formatAmountForInput(amount, tokenTypeForFormat)}
                onChangeText={handleAmountChange}
              />
              <Text style={[styles.amountSuffix, { color: theme.muted }]}>{selectedToken}</Text>
            </View>

            <View style={[styles.amountDivider, { backgroundColor: theme.border }]} />

            <View style={styles.balanceRow}>
              <View style={styles.balanceLeft}>
                <Ionicons name="wallet-outline" size={14} color={theme.muted} />
                <Text style={[styles.balanceLabel, { color: theme.muted }]}>{t("sell_tokens.available_label", "Available")}</Text>
              </View>
              <Text style={[styles.balanceValue, { color: amountNum > 0 && !hasInsufficientBalance ? theme.accent : theme.muted }]}>
                {formatAmount(availableBalance, selectedToken)} {selectedToken}
              </Text>
            </View>

            {hasInsufficientBalance && amountNum > 0 && (
              <View style={[styles.insufficientBadge, { backgroundColor: "rgba(239,68,68,0.10)", borderColor: "rgba(239,68,68,0.25)" }]}>
                <Ionicons name="warning-outline" size={13} color="#EF4444" />
                <Text style={styles.insufficientText}>{t("sell_tokens.error_exceeds_balance", "Exceeds available balance")}</Text>
              </View>
            )}
          </View>

          {/* INFO BOX */}
          <View style={[styles.infoBox, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "25" }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.blue} />
            </View>
            <Text style={[styles.infoText, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
              {t("sell_tokens.escrow_hint", "Tokens are held in escrow until the agent confirms payment to your account.")}
            </Text>
          </View>

          {/* QUICK AMOUNTS */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("sell_tokens.quick_amounts_label", "Quick Amounts")}</Text>
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
              <Text style={[styles.presetChipText, { color: theme.blue, fontWeight: "800" }]}>{t("sell_tokens.btn_max", "MAX")}</Text>
            </TouchableOpacity>
          </View>

          {/* CONTINUE INSIDE SCROLL */}
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: theme.accent }, !isValid && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {preSelectedAgentId ? t("sell_tokens.btn_continue_payment", "Continue to Payment Details") : t("sell_tokens.btn_continue_agent", "Continue to Agent Selection")}
            </Text>
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
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
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
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoIconBox: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  infoText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  presetChipText: { fontSize: 13, fontWeight: "700" },
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
