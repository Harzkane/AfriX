// app/modals/buy-tokens/select-agent.tsx
import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const { user } = useAuthStore();
  const { agents, loading, fetchAgents, selectAgent } = useAgentStore();
  const [sort, setSort] = useState<SortOption>("rating");

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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Finding available agents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#00B14F", "#008F40"]}
          style={styles.headerGradient}
        />
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>Select Agent</Text>
              <Text style={styles.subtitle}>
                Choose a trusted agent to buy {parseFloat(amount || "0").toLocaleString()}{" "}
                {tokenType || "tokens"}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Sort */}
      <View style={styles.sortRow}>
        {(["rating", "fastest", "capacity"] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.sortBtn, sort === key && styles.sortBtnActive]}
            onPress={() => setSort(key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortBtnText, sort === key && styles.sortBtnTextActive]}>
              {key === "rating" ? "Best rated" : key === "fastest" ? "Fastest" : "Highest capacity"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Agents List */}
      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AgentCard
            agent={item}
            onSelect={handleSelectAgent}
            userAmount={userAmount}
            tokenType={token}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyText}>No agents available</Text>
            <Text style={styles.emptySubtext}>
              Please try again later or contact support
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  headerWrapper: {
    marginBottom: 20,
    zIndex: 5,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 12,
    marginTop: 4,
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: -10,
    justifyContent: "center",
    zIndex: 10,

  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  sortBtnActive: {
    backgroundColor: "#00B14F",
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  sortBtnTextActive: {
    color: "#FFFFFF",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
