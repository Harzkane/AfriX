// app/modals/buy-tokens/select-agent.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAgentStore, useAuthStore } from "@/stores";
import { AgentCard } from "@/components/ui/AgentCard";
import { Ionicons } from "@expo/vector-icons";

export default function SelectAgentScreen() {
  const { tokenType, amount } = useLocalSearchParams<{
    tokenType: string;
    amount: string;
  }>();

  const router = useRouter();
  const { user } = useAuthStore();
  const { agents, loading, fetchAgents, selectAgent } = useAgentStore();

  useEffect(() => {
    fetchAgents(user?.country_code || "NG");
  }, []);

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
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.title}>Select Agent</Text>
        <Text style={styles.subtitle}>
          Choose a trusted agent to buy {parseFloat(amount).toLocaleString()}{" "}
          {tokenType}
        </Text>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AgentCard agent={item} onSelect={handleSelectAgent} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
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
    backgroundColor: "#FFFFFF",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  headerSpacer: {
    height: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
