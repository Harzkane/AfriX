import React, { useCallback, useEffect } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { DepositTransaction } from "@/stores/types/agent.types";
import { formatAmount, formatDate } from "@/utils/format";

export default function DepositHistory() {
  const router = useRouter();
  const { depositHistory, fetchDepositHistory, loading } = useAgentStore();

  const loadHistory = useCallback(() => {
    fetchDepositHistory();
  }, [fetchDepositHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const totalDeposits = depositHistory.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  const renderItem = ({ item }: { item: DepositTransaction }) => {
    const statusMeta = getDepositStatusMeta(item.status);

    return (
      <Surface style={styles.card}>
        <View
          style={[
            styles.cardAccent,
            { backgroundColor: statusMeta.color },
          ]}
        />

        <View style={styles.cardHeader}>
          <View style={styles.cardIdentity}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: statusMeta.tint, borderColor: statusMeta.border },
              ]}
            >
              <Ionicons
                name={statusMeta.icon}
                size={18}
                color={statusMeta.color}
              />
            </View>

            <View>
              <Text style={styles.eyebrow}>USDT Deposit</Text>
              <Text style={styles.amount}>
                +{formatAmount(item.amount, "USDT")} USDT
              </Text>
              <Text style={styles.date}>{formatDate(item.created_at, true)}</Text>
            </View>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: statusMeta.tint, borderColor: statusMeta.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.infoStrip}>
          <Text style={styles.infoStripLabel}>Deposit Reference</Text>
          <Text style={styles.infoStripValue}>#{item.id.slice(0, 8).toUpperCase()}</Text>
        </View>

        <View style={styles.infoStrip}>
          <Text style={styles.infoStripLabel}>Recorded Date</Text>
          <Text style={styles.infoStripValue}>{formatDate(item.created_at)}</Text>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#00B14F", "#008F40"]}
          style={styles.headerGradient}
        />
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Deposit History</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </View>

      <FlatList
        data={depositHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <LinearGradient
            colors={["#F7FFF9", "#FFFFFF"]}
            style={styles.summaryCard}
          >
            <Text style={styles.summaryEyebrow}>Funding History</Text>
            <Text style={styles.summaryTitle}>Track your verified deposits</Text>
            <Text style={styles.summaryText}>
              Review every balance top-up sent to your agent wallet and keep an
              eye on the latest confirmations.
            </Text>

            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Total Deposits</Text>
                <Text style={styles.summaryStatValue}>{depositHistory.length}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Volume</Text>
                <Text style={styles.summaryStatValue}>
                  {formatAmount(totalDeposits, "USDT")} USDT
                </Text>
              </View>
            </View>
          </LinearGradient>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadHistory}
            tintColor="#00B14F"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wallet-outline" size={28} color="#00B14F" />
            </View>
            <Text style={styles.emptyTitle}>No deposit history yet</Text>
            <Text style={styles.emptyText}>
              Your completed agent deposits will appear here once your first top-up
              is recorded.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const getDepositStatusMeta = (status?: string | null) => {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return {
        label: "PENDING",
        color: "#D97706",
        tint: "#FFF8ED",
        border: "#FDE7C2",
        icon: "time-outline" as const,
      };
    case "failed":
      return {
        label: "FAILED",
        color: "#DC2626",
        tint: "#FEF2F2",
        border: "#FECACA",
        icon: "close-circle-outline" as const,
      };
    default:
      return {
        label: "VERIFIED",
        color: "#00B14F",
        tint: "#F0FDF4",
        border: "#DDF7E5",
        icon: "checkmark-circle-outline" as const,
      };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerWrapper: {
    zIndex: 10,
    elevation: 8,
    backgroundColor: "#00B14F",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
    marginTop: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: -34,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6F4EA",
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00B14F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 6,
    marginBottom: 16,
  },
  summaryStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryStat: {
    flex: 1,
    backgroundColor: "#FBFCFD",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  summaryStatLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAF0F5",
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  cardIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  infoStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    gap: 12,
  },
  infoStripLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoStripValue: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 280,
  },
});
