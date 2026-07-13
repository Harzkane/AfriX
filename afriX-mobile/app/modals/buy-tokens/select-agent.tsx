// app/modals/buy-tokens/select-agent.tsx
import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, useColorScheme, Animated } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore, useAuthStore } from "@/stores";
import { AgentCard } from "@/components/ui/AgentCard";
import { Ionicons } from "@expo/vector-icons";

type SortOption = "rating" | "fastest" | "capacity";

export default function SelectAgentScreen() {
  const { tokenType, amount } = useLocalSearchParams<{
    tokenType: string;
    amount: string;
  }>();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuthStore();
  const { agents, loading, fetchAgents, selectAgent } = useAgentStore();
  const [sort, setSort] = useState<SortOption>("rating");

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

  const userAmount = amount ? parseFloat(amount) : undefined;
  const token = (tokenType as string) || "NT";

  useEffect(() => {
    fetchAgents(user?.country_code || "NG", sort);
  }, [sort]);

  const handleSelectAgent = (agent: any) => {
    selectAgent(agent);
    router.push({
      pathname: "/modals/buy-tokens/payment-instructions",
      params: { tokenType, amount, agentId: agent.id },
    });
  };

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.muted }]}>Finding available agents...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Fixed Header consistent with agents screen */}
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
              <Text style={[styles.title, { color: theme.text }]}>Select Agent</Text>
              <Animated.View style={{
                opacity: subtitleOpacity,
                maxHeight: subtitleMaxHeight,
                marginTop: subtitleMargin,
                overflow: "hidden"
              }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  Choose a trusted agent to buy {parseFloat(amount || "0").toLocaleString()} {tokenType || "tokens"}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerMaxHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>AGENT MATCHING</Text>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Pick the best agent for this order</Text>
          <Text style={[styles.summaryText, { color: theme.muted }]}>
            Compare agent speed, capacity, and ratings before continuing to payment instructions.
          </Text>
        </View>

        {/* Sort */}
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
                    active && { backgroundColor: theme.accent, borderColor: theme.accent }
                  ]}
                  onPress={() => setSort(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.sortBtnText,
                    { color: theme.muted },
                    active && { color: "#FFFFFF", fontWeight: "700" }
                  ]}>
                    {key === "rating" ? "Best rated" : key === "fastest" ? "Fastest" : "Highest capacity"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Agents list */}
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
                tokenType={token}
              />
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
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
  scrollContent: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
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
    fontSize: 10,
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
    flexWrap: "wrap",
  },
  sortBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
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
    paddingVertical: 60,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 24,
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
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
});
