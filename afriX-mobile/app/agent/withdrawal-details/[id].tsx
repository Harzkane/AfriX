import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatAmount, formatDate } from "@/utils/format";

export default function AgentWithdrawalDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { withdrawalRequests, fetchWithdrawalRequests, loading } =
    useAgentStore();

  const loadHistory = useCallback(() => {
    fetchWithdrawalRequests();
  }, [fetchWithdrawalRequests]);

  useEffect(() => {
    if (!withdrawalRequests.length) {
      loadHistory();
    }
  }, [loadHistory, withdrawalRequests.length]);

  const request = withdrawalRequests.find((item) => item.id === id);

  if (loading && !request) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Loading withdrawal details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Withdrawal unavailable</Text>
          <Text style={styles.errorText}>Withdrawal request not found.</Text>
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

  const statusMeta = getWithdrawalStatusMeta(request.status);

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
            <Text style={styles.headerTitle}>Withdrawal Details</Text>
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
          <Text style={styles.summaryEyebrow}>Payout Record</Text>
          <Text style={styles.summaryTitle}>Agent Withdrawal Request</Text>
          <Text style={styles.summaryText}>
            Review the amount, request status, payout timing, and any admin or
            blockchain settlement details for this withdrawal.
          </Text>

          <View style={styles.summaryTopRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusMeta.tint,
                  borderColor: statusMeta.border,
                },
              ]}
            >
              <Ionicons
                name={statusMeta.icon}
                size={16}
                color={statusMeta.color}
              />
              <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <View>
              <Text style={styles.amountLabel}>Requested Amount</Text>
              <Text style={styles.amountValue}>
                {formatAmount(request.amount_usd, "USDT")} USDT
              </Text>
            </View>
            <View style={styles.amountMeta}>
              <Text style={styles.amountMetaLabel}>Submitted</Text>
              <Text style={styles.amountMetaValue}>
                {formatDate(request.created_at, true)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <Surface style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Request Summary</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Request ID</Text>
            <Text style={styles.infoValue}>{request.id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Agent ID</Text>
            <Text style={styles.infoValue}>{request.agent_id}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{statusMeta.titleCaseLabel}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created On</Text>
            <Text style={styles.infoValue}>{formatDate(request.created_at, true)}</Text>
          </View>

          {request.paid_at ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Paid On</Text>
              <Text style={styles.infoValue}>{formatDate(request.paid_at, true)}</Text>
            </View>
          ) : null}
        </Surface>

        <Surface style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Settlement Details</Text>

          <View style={styles.infoStrip}>
            <Text style={styles.infoStripLabel}>Payout Amount</Text>
            <Text style={styles.infoStripValue}>
              {formatAmount(request.amount_usd, "USDT")} USDT
            </Text>
          </View>

          <View style={styles.infoStrip}>
            <Text style={styles.infoStripLabel}>Current Status</Text>
            <Text style={[styles.infoStripValue, { color: statusMeta.color }]}>
              {statusMeta.titleCaseLabel}
            </Text>
          </View>

          {request.paid_tx_hash ? (
            <View style={styles.noteBlock}>
              <Text style={styles.noteLabel}>Paid Transaction Hash</Text>
              <Text style={styles.hashText}>{request.paid_tx_hash}</Text>
            </View>
          ) : null}

          {request.admin_notes ? (
            <View
              style={[
                styles.messageBlock,
                request.status === "rejected" ? styles.errorBlock : styles.neutralBlock,
              ]}
            >
              <Text style={styles.noteLabel}>
                {request.status === "rejected" ? "Rejection Reason" : "Admin Notes"}
              </Text>
              <Text
                style={[
                  styles.messageText,
                  request.status === "rejected" && styles.errorMessageText,
                ]}
              >
                {request.admin_notes}
              </Text>
            </View>
          ) : null}
        </Surface>
      </ScrollView>
    </View>
  );
}

const getWithdrawalStatusMeta = (status?: string | null) => {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return {
        label: "PENDING",
        titleCaseLabel: "Pending",
        color: "#D97706",
        tint: "#FFF8ED",
        border: "#FDE7C2",
        icon: "time-outline" as const,
      };
    case "approved":
      return {
        label: "APPROVED",
        titleCaseLabel: "Approved",
        color: "#2563EB",
        tint: "#EFF6FF",
        border: "#DBEAFE",
        icon: "checkmark-done-outline" as const,
      };
    case "rejected":
      return {
        label: "REJECTED",
        titleCaseLabel: "Rejected",
        color: "#DC2626",
        tint: "#FEF2F2",
        border: "#FECACA",
        icon: "close-circle-outline" as const,
      };
    default:
      return {
        label: "PAID",
        titleCaseLabel: "Paid",
        color: "#00B14F",
        tint: "#F0FDF4",
        border: "#DDF7E5",
        icon: "cash-outline" as const,
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
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
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
  noteBlock: {
    marginTop: 4,
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
  hashText: {
    fontSize: 12,
    lineHeight: 19,
    color: "#047857",
    fontFamily: "monospace",
    fontWeight: "600",
  },
  messageBlock: {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  neutralBlock: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E4E7EC",
  },
  errorBlock: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#111827",
    fontWeight: "500",
  },
  errorMessageText: {
    color: "#B42318",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
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
