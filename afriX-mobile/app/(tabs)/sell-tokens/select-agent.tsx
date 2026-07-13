import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/stores";
import { AgentCard } from "@/components/ui/AgentCard";

type SortOption = "rating" | "fastest" | "capacity";

export default function SelectAgentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; tokenType?: string }>();
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("rating");

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
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const userAmount = params.amount ? parseFloat(params.amount) : undefined;
  const tokenType = (params.tokenType as string) || "NT";

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
      setAgents(data.data || []);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgent = (agent: any) => {
    router.push({
      pathname: "/(tabs)/sell-tokens/bank-details",
      params: { ...params, agentId: agent.id, agentName: agent.full_name },
    });
  };

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
            position: "absolute",
            top: 0, left: 0, right: 0,
            zIndex: 10,
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
              <Text style={[styles.headerTitle, { color: theme.text }]}>Select Agent</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {userAmount != null && userAmount > 0
                    ? `Sell ${userAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${tokenType} — choose an agent`
                    : "Choose an agent to sell your tokens"}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {loading ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.muted }]}>Finding available agents...</Text>
          </View>
        </View>
      ) : (
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

          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>AGENT MATCHING</Text>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Pick the best agent for this order</Text>
            <Text style={[styles.summaryText, { color: theme.muted }]}>
              Compare agent speed, capacity, and ratings before continuing to payment instructions.
            </Text>
          </View>

          {/* Sort Section */}
          <View style={styles.sortSection}>
            <View style={styles.sortHeader}>
              <Text style={[styles.sortEyebrow, { color: theme.accent }]}>SORT AGENTS</Text>
              <Text style={[styles.sortHint, { color: theme.muted }]}>{agents.length} available</Text>
            </View>
            <View style={styles.sortRow}>
              {(["rating", "fastest", "capacity"] as const).map((key) => {
                const active = sort === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.sortBtn,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      active && { backgroundColor: theme.accent, borderColor: theme.accent },
                    ]}
                    onPress={() => setSort(key)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.sortBtnText,
                        { color: theme.muted },
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      {key === "rating" ? "Best rated" : key === "fastest" ? "Fastest" : "Highest capacity"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* List of Agents */}
          <View style={styles.listContainer}>
            {agents.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.cardAlt }]}>
                  <Ionicons name="people-outline" size={48} color={theme.muted} />
                </View>
                <Text style={[styles.emptyText, { color: theme.text }]}>No agents available</Text>
                <Text style={[styles.emptySubtext, { color: theme.muted }]}>
                  Please try again later or contact support
                </Text>
              </View>
            ) : (
              agents.map((item) => (
                <AgentCard
                  key={item.id}
                  agent={item}
                  onSelect={handleSelectAgent}
                  userAmount={userAmount}
                  tokenType={tokenType}
                />
              ))
            )}
          </View>
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { borderBottomWidth: 1 },
  headerContent: { paddingHorizontal: 16 },
  headerRow: {
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
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 200,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    minWidth: 220,
  },
  loadingText: { fontSize: 14, fontWeight: "600" },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 21,
  },
  sortSection: {
    marginBottom: 16,
  },
  sortHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sortEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  sortHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listContainer: {
    gap: 12,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});
