import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useWalletStore } from "@/stores";
import { parseAmountInput, formatAmountForInput, formatAmount } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000];

export default function BuyTokensScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getWalletByType } = useWalletStore();

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    ctGreen: "#10B981",
    ctSoft: isDark ? "rgba(16,185,129,0.12)" : "#ECFDF5",
    inputBg: isDark ? "#0D1C2E" : "#F1F5F9",
  };

  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) {
      setHeaderMaxHeight(height);
    }
  };

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const subtitleMaxHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [80, 0],
    extrapolate: "clamp",
  });

  const subtitleMargin = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [4, 0],
    extrapolate: "clamp",
  });

  const params = useLocalSearchParams<{ amount?: string; tokenType?: string; agentId?: string; agentName?: string }>();
  const initialTokenType = (params.tokenType === "CT" ? "CT" : "NT") as "NT" | "CT";
  const initialAmount = params.amount ? parseAmountInput(params.amount, initialTokenType) : "";
  const [tokenType, setTokenType] = useState<"NT" | "CT">(initialTokenType);
  const [amount, setAmount] = useState(initialAmount);

  useEffect(() => {
    if (params.amount != null && params.amount !== amount) setAmount(parseAmountInput(params.amount, tokenType));
    if (params.tokenType === "CT" && tokenType !== "CT") setTokenType("CT");
    if (params.tokenType === "NT" && tokenType !== "NT") setTokenType("NT");
  }, [params.amount, params.tokenType]);

  const preSelectedAgentId = params.agentId as string | undefined;
  const preSelectedAgentName = params.agentName as string | undefined;
  const wallet = getWalletByType(tokenType);

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) { alert("Please enter a valid amount"); return; }
    if (preSelectedAgentId && preSelectedAgentName) {
      router.push({ pathname: "/modals/buy-tokens/payment-instructions", params: { tokenType, amount, agentId: preSelectedAgentId, agentName: preSelectedAgentName } });
    } else {
      router.push({ pathname: "/modals/buy-tokens/select-agent", params: { tokenType, amount } });
    }
  };

  const isNT = tokenType === "NT";

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? -8 : 12}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        
        {/* Fixed Header */}
        <Animated.View
          onLayout={handleHeaderLayout}
          style={[
            styles.headerWrapper,
            {
              backgroundColor: theme.background,
              borderBottomColor: theme.border,
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
            },
          ]}
        >
          <SafeAreaView edges={["top"]} style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>

              <View style={styles.headerCopy}>
                <Text style={[styles.title, { color: theme.text }]}>Buy Tokens</Text>
                <Animated.View style={{
                  opacity: subtitleOpacity,
                  maxHeight: subtitleMaxHeight,
                  marginTop: subtitleMargin,
                  overflow: "hidden"
                }}>
                  <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                    Select Naira or XOF token, set amount, and select an agent to finalize trade.
                  </Text>
                </Animated.View>
              </View>
              <View style={{ width: 42 }} />
            </View>
          </SafeAreaView>
        </Animated.View>

        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { backgroundColor: theme.background, paddingTop: headerMaxHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Subtle Ambient Glow */}
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.14)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.12)", "rgba(255,255,255,0)"]}
            style={styles.heroGlow}
            pointerEvents="none"
          />

          {/* Token Toggle Segment */}
          <View style={[styles.toggleContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                isNT && { backgroundColor: theme.accentSoft }
              ]}
              onPress={() => setTokenType("NT")}
              activeOpacity={0.8}
            >
              <Ionicons name="cash" size={16} color={isNT ? theme.accent : theme.muted} />
              <Text style={[styles.toggleText, { color: isNT ? theme.text : theme.muted, fontWeight: isNT ? "800" : "600" }]}>
                Naira Token (NT)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleOption,
                !isNT && { backgroundColor: theme.ctSoft }
              ]}
              onPress={() => setTokenType("CT")}
              activeOpacity={0.8}
            >
              <Ionicons name="leaf" size={16} color={!isNT ? theme.ctGreen : theme.muted} />
              <Text style={[styles.toggleText, { color: !isNT ? theme.text : theme.muted, fontWeight: !isNT ? "800" : "600" }]}>
                XOF Token (CT)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Large Centered Amount Input Area */}
          <View style={styles.inputAreaContainer}>
            <View style={styles.inputHero}>
              <Text style={[styles.inputPrefix, { color: isNT ? theme.accent : theme.ctGreen }]}>
                {isNT ? "NT" : "CT"}
              </Text>
              <TextInput
                style={[styles.inputLarge, { color: theme.text }]}
                value={formatAmountForInput(amount, tokenType)}
                onChangeText={(t) => setAmount(parseAmountInput(t, tokenType))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.muted}
                maxLength={10}
              />
            </View>

            {/* Helper text returned */}
            <Text style={[styles.amountHelperText, { color: theme.muted }]}>
              Enter the amount of {tokenType} you want the agent to deliver.
            </Text>

            {/* Live Exchange Rate Info Pill */}
            <View style={[styles.infoPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
              <Text style={[styles.infoPillText, { color: theme.muted }]}>
                Estimated Pay: {isNT ? "₦" : "XOF "}{formatAmount(amount || "0", tokenType)}
              </Text>
            </View>
          </View>

          {/* Quick Presets Slider */}
          <View style={styles.presetsWrapper}>
            {PRESET_AMOUNTS.map((preset) => {
              const active = amount === preset.toString();
              return (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetPill,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    active && { backgroundColor: theme.accentSoft, borderColor: theme.accent }
                  ]}
                  onPress={() => setAmount(preset.toString())}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.presetPillText, { color: theme.text }, active && { color: theme.accent, fontWeight: "800" }]}>
                    +{preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Positions & Exchange Rates Summary Card */}
          <View style={[styles.summaryBlock, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={[styles.summaryLabel, { color: theme.muted }]}>WALLET BALANCE</Text>
                <Text style={[styles.summaryVal, { color: theme.text }]}>
                  {wallet ? parseFloat(wallet.balance).toLocaleString() : "0"} {tokenType}
                </Text>
                {wallet && (
                  <Text style={[styles.availableSubtext, { color: theme.accent }]}>
                    Available: {parseFloat(wallet.available_balance).toLocaleString()}
                  </Text>
                )}
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryCol}>
                <Text style={[styles.summaryLabel, { color: theme.muted }]}>EXCHANGE RATE</Text>
                <Text style={[styles.summaryVal, { color: theme.accent }]}>
                  1 {tokenType} = {isNT ? "₦1.00" : "XOF 1.00"}
                </Text>
                <Text style={[styles.availableSubtext, { color: theme.muted }]}>
                  You'll pay approx. {isNT ? "₦" : "XOF "}{formatAmount(amount || "0", tokenType)}
                </Text>
              </View>
            </View>
          </View>

          {/* Action button inside ScrollView so it is not pinned to bottom */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.continueBtn,
                { backgroundColor: theme.accent },
                (!amount || parseFloat(amount) <= 0) && styles.continueBtnDisabled
              ]}
              onPress={handleContinue}
              disabled={!amount || parseFloat(amount) <= 0}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continue to Agent Selection</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    borderBottomWidth: 1,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  heroGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    padding: 6,
    marginBottom: 36,
  },
  toggleOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleText: {
    fontSize: 13,
  },
  inputAreaContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  inputHero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inputPrefix: {
    fontSize: 34,
    fontWeight: "900",
    marginRight: 10,
    marginTop: 4,
  },
  inputLarge: {
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
    minWidth: 100,
    paddingVertical: 8,
  },
  amountHelperText: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 12,
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  presetsWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 32,
  },
  presetPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryBlock: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: "800",
  },
  availableSubtext: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 48,
  },
  actionContainer: {
    marginTop: 8,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
  },
});
