import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatAmount, formatDate } from "@/utils/format";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { dashboardData } = useAgentStore();

  const tx = dashboardData?.recent_transactions?.find((t: any) => t.id === id);

  if (!tx) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Transaction unavailable</Text>
          <Text style={styles.errorText}>Transaction not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.primaryButton}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const normalizedType = String(tx.type || "").toLowerCase();
  const isMint = normalizedType === "mint";
  const isBurn = normalizedType === "burn";
  const counterparty = isMint ? tx.toUser?.full_name : tx.fromUser?.full_name;
  const tokenType = tx.token_type || "NT";
  const commissionSource = tx.agent_commission ?? tx.fee_amount ?? tx.fee;
  const commissionAmount =
    commissionSource != null && commissionSource !== ""
      ? String(commissionSource)
      : tx.status === "completed"
        ? (parseFloat(String(tx.amount || 0)) * 0.01).toString()
        : "0";
  const commissionLabel =
    tx.fee_kind === "agent_commission"
      ? tx.fee_label || "Agent Commission"
      : "Commission earned";
  const commission = formatAmount(commissionAmount, tokenType);
  const amountDisplay = formatAmount(tx.amount, tokenType);
  const statusColor = getStatusColor(tx.status);
  const typeConfig = getTypeConfig(normalizedType);

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
            <Text style={styles.headerTitle}>Transaction Details</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#F7FFF9", "#FFFFFF"]}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryEyebrow}>Agent Activity</Text>
          <Text style={styles.summaryTitle}>{typeConfig.label} Transaction</Text>
          <Text style={styles.summaryText}>
            Review the customer, settlement amount, earned commission, and
            status for this agent-side transaction.
          </Text>

          <View style={styles.summaryTopRow}>
            <View
              style={[
                styles.typePill,
                {
                  backgroundColor: typeConfig.bg,
                  borderColor: typeConfig.border,
                },
              ]}
            >
              <Ionicons
                name={typeConfig.icon}
                size={18}
                color={typeConfig.color}
              />
              <Text
                style={[styles.typePillText, { color: typeConfig.color }]}
              >
                {typeConfig.label}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                { backgroundColor: `${statusColor}16` },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {String(tx.status || "completed")
                  .replace(/_/g, " ")
                  .toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <View>
              <Text style={styles.amountLabel}>Transaction Amount</Text>
              <Text style={styles.amountValue}>
                {amountDisplay} {tokenType}
              </Text>
            </View>
            <View style={styles.amountMeta}>
              <Text style={styles.amountMetaLabel}>Created</Text>
              <Text style={styles.amountMetaValue}>
                {formatDate(tx.created_at, true)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <Surface style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Transaction Summary</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Flow</Text>
            <Text style={styles.infoValue}>
              {isMint ? "Mint to customer" : isBurn ? "Burn from customer" : tx.type}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Counterparty</Text>
            <Text style={styles.infoValue}>{counterparty || "User"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Token</Text>
            <Text style={styles.infoValue}>{tokenType}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reference</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {tx.reference || "—"}
            </Text>
          </View>
        </Surface>

        <Surface style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Settlement Details</Text>

          <View style={styles.infoStrip}>
            <Text style={styles.infoStripLabel}>{commissionLabel}</Text>
            <Text style={[styles.infoStripValue, styles.successValue]}>
              +{commission} {tokenType}
            </Text>
          </View>

          <View style={styles.infoStrip}>
            <Text style={styles.infoStripLabel}>Status</Text>
            <Text style={styles.infoStripValue}>
              {String(tx.status || "completed")
                .replace(/_/g, " ")
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoStrip}>
            <Text style={styles.infoStripLabel}>Recorded On</Text>
            <Text style={styles.infoStripValue}>
              {formatDate(tx.created_at, true)}
            </Text>
          </View>
        </Surface>

        {tx.metadata ? (
          <Surface style={styles.card}>
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>Additional Data</Text>
            <View style={styles.noteBlock}>
              <Text style={styles.noteLabel}>Metadata</Text>
              <Text style={styles.metadataText}>
                {JSON.stringify(tx.metadata, null, 2)}
              </Text>
            </View>
          </Surface>
        ) : null}
      </ScrollView>
    </View>
  );
}

const getTypeConfig = (type: string) => {
  if (type === "mint") {
    return {
      label: "Mint",
      icon: "arrow-up-circle" as const,
      bg: "#F0FDF4",
      color: "#00B14F",
      border: "#DDF7E5",
    };
  }

  if (type === "burn") {
    return {
      label: "Burn",
      icon: "arrow-down-circle" as const,
      bg: "#FFF8ED",
      color: "#D97706",
      border: "#FDE7C2",
    };
  }

  return {
    label: type || "Transaction",
    icon: "cash" as const,
    bg: "#F3F4F6",
    color: "#6B7280",
    border: "#E5E7EB",
  };
};

const getStatusColor = (status: string) => {
  switch (String(status || "").toLowerCase()) {
    case "completed":
      return "#00B14F";
    case "pending":
      return "#F59E0B";
    case "failed":
      return "#EF4444";
    default:
      return "#6B7280";
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
  scrollContent: {
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
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FBFCFD",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    gap: 12,
  },
  amountLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  amountMeta: {
    alignItems: "flex-end",
    flexShrink: 1,
  },
  amountMetaLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  amountMetaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textAlign: "right",
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
    backgroundColor: "#00B14F",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    marginTop: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textAlign: "right",
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
  successValue: {
    color: "#00B14F",
  },
  noteBlock: {
    backgroundColor: "#FBFCFD",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  noteLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  metadataText: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
    color: "#4B5563",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: "#00B14F",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
