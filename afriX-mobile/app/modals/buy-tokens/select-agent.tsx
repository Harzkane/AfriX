// app/modals/buy-tokens/select-agent.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore, useAuthStore } from "@/stores";
import { AgentCard, Agent } from "@/components/ui/AgentCard";
import { Ionicons } from "@expo/vector-icons";
import { formatAmount } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

type SortOption = "capacity" | "rating" | "fastest";

export default function SelectAgentScreen() {
  const { tokenType, amount } = useLocalSearchParams<{
    tokenType: string;
    amount: string;
  }>();

  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuthStore();
  const { agents, loading, fetchAgents, selectAgent } = useAgentStore();
  const [sort, setSort] = useState<SortOption>("capacity");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

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
    blueBorder: isDark ? "rgba(59,130,246,0.3)" : "#BFDBFE",
  };

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

  const userAmount = amount ? parseFloat(amount) : 10000;
  const token = (tokenType as string) || "NT";
  const fiatCurrency = token === "CT" ? "XOF" : token === "USDT" ? "USD" : "NGN";

  useEffect(() => {
    fetchAgents(user?.country_code || "NG", sort);
  }, [sort]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents]);

  const handleSelectAgent = (agent: Agent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAgentId(agent.id);
  };

  const handleContinue = () => {
    const agent = agents.find((a) => a.id === selectedAgentId) || agents[0];
    if (!agent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectAgent(agent);
    router.push({
      pathname: "/modals/buy-tokens/payment-instructions",
      params: { tokenType, amount, agentId: agent.id },
    });
  };

  const selectedAgentObj = agents.find((a) => a.id === selectedAgentId);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[
          styles.headerWrapper,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
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
                {t("buy_tokens.select_agent.title", "Select Agent")}
              </Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("buy_tokens.select_agent.subtitle", "Choose a trusted agent to complete your purchase.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 12 }]}
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

        {/* Order Summary Top Banner Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>You will pay (Cash)</Text>
              <Text style={[styles.summaryAmountText, { color: theme.text }]}>
                {formatAmount(userAmount, token)}{" "}
                <Text style={{ color: theme.accent, fontSize: 13 }}>{fiatCurrency}</Text>
              </Text>
            </View>

            <View style={[styles.swapIconCircle, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
              <Ionicons name="swap-horizontal" size={18} color={theme.accent} />
            </View>

            <View style={[styles.summaryCol, { alignItems: "flex-end" }]}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>You will receive</Text>
              <Text style={[styles.summaryAmountText, { color: theme.text }]}>
                {formatAmount(userAmount, token)}{" "}
                <Text style={{ color: theme.accent, fontSize: 13 }}>{token}</Text>
              </Text>
            </View>
          </View>

          {/* Sub-notice banner inside summary card */}
          <View style={[styles.subNoticeBox, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
            <Ionicons name="information-circle-outline" size={15} color={theme.blue} />
            <Text style={[styles.subNoticeText, { color: theme.muted }]}>
              Tokens are released automatically from escrow once payment is confirmed.
            </Text>
          </View>
        </View>

        {/* FILTER & SORT Section */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>FILTER & SORT</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: theme.card, borderColor: theme.border },
              sort === "capacity" && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
            ]}
            onPress={() => setSort("capacity")}
            activeOpacity={0.8}
          >
            <Ionicons name="trending-up" size={14} color={sort === "capacity" ? theme.accent : theme.muted} />
            <Text style={[styles.filterPillText, { color: sort === "capacity" ? theme.accent : theme.text }]}>
              Highest Capacity
            </Text>
            <Ionicons name="chevron-down" size={12} color={sort === "capacity" ? theme.accent : theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              { backgroundColor: theme.card, borderColor: theme.border },
              sort === "fastest" && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
            ]}
            onPress={() => setSort("fastest")}
            activeOpacity={0.8}
          >
            <Ionicons name="flash-outline" size={14} color={sort === "fastest" ? theme.accent : theme.muted} />
            <Text style={[styles.filterPillText, { color: sort === "fastest" ? theme.accent : theme.text }]}>
              Fastest
            </Text>
            <Ionicons name="chevron-down" size={12} color={sort === "fastest" ? theme.accent : theme.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterIconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Table Column Headers Row */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCol1, { color: theme.muted }]}>Agent</Text>
          <Text style={[styles.tableHeaderCol2, { color: theme.muted }]}>Capacity</Text>
          <Text style={[styles.tableHeaderCol3, { color: theme.muted }]}>Est. time</Text>
        </View>

        {/* Agent Cards List */}
        {loading ? (
          <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.muted }]}>
              {t("buy_tokens.select_agent.loading_agents", "Finding available agents...")}
            </Text>
          </View>
        ) : agents.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="people-outline" size={44} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {t("buy_tokens.select_agent.no_agents", "No agents available")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
              {t("buy_tokens.select_agent.try_again", "Please try again later or select another currency.")}
            </Text>
          </View>
        ) : (
          agents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onSelect={handleSelectAgent}
              userAmount={userAmount}
              tokenType={token}
              isSelected={agent.id === selectedAgentId}
              isRecommended={index === 0}
            />
          ))
        )}

        {/* Security Footer Notice Banner */}
        <View style={[styles.securityCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              Only verified agents are shown. Your transaction is protected by smart contract escrow.
            </Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            onPress={() => router.push("/help-support/faq")}
            activeOpacity={0.8}
          >
            <Text style={[styles.learnMoreText, { color: theme.blue }]}>Learn more</Text>
            <Ionicons name="chevron-forward" size={12} color={theme.blue} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Sticky Bottom Action CTA Button */}
      <SafeAreaView edges={["bottom"]} style={[styles.bottomBarWrapper, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: theme.accent }, !selectedAgentObj && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedAgentObj}
          activeOpacity={0.85}
        >
          <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />
          <Text style={styles.continueBtnText}>
            Continue with {selectedAgentObj ? selectedAgentObj.full_name : "Selected Agent"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
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

  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryCol: { flex: 1 },
  summaryLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  summaryAmountText: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  swapIconCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    marginHorizontal: 8,
  },

  subNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  subNoticeText: { fontSize: 11, fontWeight: "500", flex: 1 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  filterPillText: { fontSize: 12, fontWeight: "700" },
  filterIconBtn: {
    width: 38, height: 38, borderRadius: 14, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginLeft: "auto",
  },

  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  tableHeaderCol1: { flex: 2.8, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  tableHeaderCol2: { flex: 2.2, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  tableHeaderCol3: { flex: 1.8, fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "right" },

  loadingCard: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, fontWeight: "600" },

  emptyCard: {
    padding: 30,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptySubtitle: { fontSize: 12, fontWeight: "500", textAlign: "center" },

  securityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
  },
  infoIconBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  securityText: { fontSize: 11, lineHeight: 16, fontWeight: "500" },
  learnMoreText: { fontSize: 11, fontWeight: "700" },

  bottomBarWrapper: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
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
});
