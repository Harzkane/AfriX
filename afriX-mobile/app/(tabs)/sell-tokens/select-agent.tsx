// app/(tabs)/sell-tokens/select-agent.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/stores";
import { AgentCard, Agent } from "@/components/ui/AgentCard";
import { formatAmount } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

type SortOption = "capacity" | "rating" | "fastest";

export default function SelectAgentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; tokenType?: string }>();
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("capacity");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const { t } = useTranslation();

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
    blueBorder: isDark ? "rgba(59,130,246,0.3)" : "#BFDBFE",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const userAmount = params.amount ? parseFloat(params.amount) : 10000;
  const tokenType = (params.tokenType as string) || "NT";
  const fiatCurrency = tokenType === "CT" ? "XOF" : tokenType === "USDT" ? "USD" : "NGN";

  useEffect(() => {
    fetchAgents();
  }, [sort]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const countryCode = user?.country_code || "NG";
      let url = `${API_ENDPOINTS.AGENTS.LIST}?country=${countryCode}`;
      if (sort && sort !== "rating") url += `&sort=${sort}`;
      const { data } = await apiClient.get(url);
      const fetchedAgents = data.data || [];
      setAgents(fetchedAgents);
      if (fetchedAgents.length > 0 && !selectedAgentId) {
        setSelectedAgentId(fetchedAgents[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agent: Agent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAgentId(agent.id);
  };

  const handleContinue = () => {
    const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];
    if (!selectedAgent) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/(tabs)/sell-tokens/bank-details",
      params: { ...params, agentId: selectedAgent.id, agentName: selectedAgent.full_name },
    });
  };

  const selectedAgentObj = agents.find((a) => a.id === selectedAgentId);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Collapsible Header */}
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
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
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
                {t("sell_tokens.select_agent_title", "Select Agent")}
              </Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("sell_tokens.select_agent_subtitle_default", "Choose a trusted agent to complete your cash payout.")}
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
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>You are selling</Text>
              <Text style={[styles.summaryAmountText, { color: theme.text }]}>
                {formatAmount(userAmount, tokenType)}{" "}
                <Text style={{ color: theme.accent, fontSize: 13 }}>{tokenType}</Text>
              </Text>
            </View>

            <View style={[styles.swapIconCircle, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
              <Ionicons name="swap-horizontal" size={18} color={theme.accent} />
            </View>

            <View style={[styles.summaryCol, { alignItems: "flex-end" }]}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>You will receive (Cash)</Text>
              <Text style={[styles.summaryAmountText, { color: theme.text }]}>
                {formatAmount(userAmount, tokenType)}{" "}
                <Text style={{ color: theme.accent, fontSize: 13 }}>{fiatCurrency}</Text>
              </Text>
            </View>
          </View>

          {/* Sub-notice banner inside summary card */}
          <View style={[styles.subNoticeBox, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
            <Ionicons name="information-circle-outline" size={15} color={theme.blue} />
            <Text style={[styles.subNoticeText, { color: theme.muted }]}>
              Tokens are held in escrow until the agent confirms payment.
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
              sort === "rating" && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
            ]}
            onPress={() => setSort("rating")}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillIconText, { color: sort === "rating" ? theme.accent : theme.muted }]}>%</Text>
            <Text style={[styles.filterPillText, { color: sort === "rating" ? theme.accent : theme.text }]}>
              Best Rate
            </Text>
            <Ionicons name="chevron-down" size={12} color={sort === "rating" ? theme.accent : theme.muted} />
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
          <Text style={[styles.tableHeaderCol3, { color: theme.muted }]}>Rate</Text>
          <Text style={[styles.tableHeaderCol4, { color: theme.muted }]}>Est. time</Text>
        </View>

        {/* Agent Cards List */}
        {loading ? (
          <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.muted }]}>
              {t("sell_tokens.finding_agents", "Finding available agents...")}
            </Text>
          </View>
        ) : agents.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="people-outline" size={44} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {t("sell_tokens.no_agents_available", "No agents available")}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
              {t("sell_tokens.try_again_later", "Please try again later or contact support.")}
            </Text>
          </View>
        ) : (
          agents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onSelect={handleSelectAgent}
              userAmount={userAmount}
              tokenType={tokenType}
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
              Only verified agents are shown. Your tokens are secure until cash payment is confirmed.
            </Text>
          </View>
          <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
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
  headerContent: { paddingHorizontal: 16 },
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
  filterPillIconText: { fontSize: 12, fontWeight: "900" },
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
  tableHeaderCol1: { flex: 2.2, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  tableHeaderCol2: { flex: 2, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  tableHeaderCol3: { flex: 1.8, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  tableHeaderCol4: { flex: 1.5, fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "right" },

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
