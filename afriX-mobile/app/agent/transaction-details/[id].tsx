import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Surface } from "react-native-paper";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatAmount, formatDate } from "@/utils/format";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { dashboardData } = useAgentStore();

  const tx = dashboardData?.recent_transactions?.find(
    (t: any) => t.id === id
  );

  if (!tx) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Transaction not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isMint = tx.type === "mint";
  const isBurn = tx.type === "burn";
  const counterparty = isMint ? tx.toUser?.full_name : tx.fromUser?.full_name;
  const tokenType = tx.token_type || "NT";
  const isCompleted = tx.status === "completed";
  // ✅ Use tx.fee if available (formal backend field), fallback to 1% for legacy completed txs
  const commissionAmount = tx.fee
    ? tx.fee.toString()
    : isCompleted
      ? (parseFloat(tx.amount) * 0.01).toString()
      : "0";
  const commission = formatAmount(commissionAmount, tokenType);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={styles.card}>
          <View style={styles.rowBetween}>
            <View
              style={[
                styles.typePill,
                { backgroundColor: isMint ? "#F0FDF4" : "#FFFBEB" },
              ]}
            >
              <Ionicons
                name={isMint ? "arrow-up" : "arrow-down"}
                size={18}
                color={isMint ? "#16A34A" : "#D97706"}
              />
              <Text style={styles.typeText}>
                {isMint ? "Mint" : isBurn ? "Burn" : tx.type}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDate(tx.created_at)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Counterparty</Text>
            <Text style={styles.value}>
              {counterparty || (isMint ? "User" : "User")}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amountText}>
              {formatAmount(tx.amount, tx.token_type)} {tx.token_type}
            </Text>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.sectionHalf}>
              <Text style={styles.label}>Commission earned</Text>
              <Text style={styles.value}>
                +{commission} {tokenType}
              </Text>
            </View>
            <View style={styles.sectionHalf}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>
                  {String(tx.status || "completed")
                    .replace("_", " ")
                    .toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {tx.reference && (
          <Surface style={styles.card}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.valueMono}>{tx.reference}</Text>
          </Surface>
        )}

        {tx.metadata && (
          <Surface style={styles.card}>
            <Text style={styles.label}>Metadata</Text>
            <Text style={styles.metadataText}>
              {JSON.stringify(tx.metadata, null, 2)}
            </Text>
          </Surface>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  dateText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  section: {
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  sectionHalf: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  amountText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  statusPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  valueMono: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#111827",
  },
  metadataText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#4B5563",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

