// app/modals/buy-tokens/payment-instructions.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMintRequestStore, useAgentStore } from "@/stores";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/services/apiClient";

export default function PaymentInstructionsScreen() {
  const { tokenType, amount, agentId, agentName } = useLocalSearchParams<{
    tokenType: string;
    amount: string;
    agentId: string;
    agentName?: string;
  }>();

  const router = useRouter();
  const { selectedAgent, selectAgent } = useAgentStore();
  const { createMintRequest, loading } = useMintRequestStore();
  const [fetchingAgent, setFetchingAgent] = useState(false);

  // Fetch agent details if coming from agent profile (agentId provided but no selectedAgent or different agent)
  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (agentId && (!selectedAgent || selectedAgent.id !== agentId)) {
        try {
          setFetchingAgent(true);
          const { data } = await apiClient.get(`/agents/${agentId}`);
          selectAgent(data.data);
        } catch (error) {
          console.error("Failed to fetch agent details:", error);
          Alert.alert("Error", "Failed to load agent details");
        } finally {
          setFetchingAgent(false);
        }
      }
    };

    fetchAgentDetails();
  }, [agentId, selectedAgent]);

  const handleCopyAccount = async () => {
    if (selectedAgent?.phone_number) {
      await Clipboard.setStringAsync(selectedAgent.phone_number);
      Alert.alert("Copied", "Agent contact copied to clipboard");
    }
  };

  const handleProceed = async () => {
    try {
      const request = await createMintRequest(
        agentId,
        parseFloat(amount),
        tokenType
      );

      router.push({
        pathname: "/modals/buy-tokens/upload-proof",
        params: { requestId: request.id },
      });
    } catch (error: any) {
      // Check if this is a self-transaction error
      const errorMessage = error.message || "";
      if (errorMessage.includes("cannot create mint requests to themselves")) {
        Alert.alert(
          "⚠️ Cannot Select Yourself",
          "As an agent, you cannot buy tokens from yourself. Please select a different agent to complete this transaction.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Error", "Failed to create request. Please try again.");
      }
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSpacer} />
      <View style={styles.header}>
        <Text style={styles.title}>Payment Instructions</Text>
        <Text style={styles.subtitle}>
          Send payment to agent and upload proof
        </Text>
      </View>

      {fetchingAgent ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading agent details...</Text>
        </View>
      ) : !selectedAgent ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Agent information not available</Text>
        </View>
      ) : (
        <>
          {/* Agent Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-circle-outline" size={24} color="#00B14F" />
              <Text style={styles.cardTitle}>Agent Details</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Tier</Text>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>
                    {selectedAgent?.tier.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Rating</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={styles.rowValue}>
                    {selectedAgent?.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              {selectedAgent?.phone_number && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Phone</Text>
                  <TouchableOpacity
                    style={styles.phoneRow}
                    onPress={handleCopyAccount}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.phoneNumber}>
                      {selectedAgent.phone_number}
                    </Text>
                    <Ionicons name="copy-outline" size={16} color="#00B14F" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Bank Details Section */}
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Bank Name</Text>
                <Text style={styles.rowValue}>{selectedAgent?.bank_name || "N/A"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Account Name</Text>
                <Text style={styles.rowValue}>{selectedAgent?.account_name || "N/A"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Account Number</Text>
                <TouchableOpacity
                  style={styles.phoneRow}
                  onPress={async () => {
                    if (selectedAgent?.account_number) {
                      await Clipboard.setStringAsync(selectedAgent.account_number);
                      Alert.alert("Copied", "Account number copied to clipboard");
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.phoneNumber}>
                    {selectedAgent?.account_number || "N/A"}
                  </Text>
                  <Ionicons name="copy-outline" size={16} color="#00B14F" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Payment Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="wallet-outline" size={24} color="#00B14F" />
              <Text style={styles.cardTitle}>Payment Details</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Amount</Text>
                <Text style={styles.amount}>
                  {tokenType === "NT" ? "₦" : "XOF "}
                  {parseFloat(amount).toLocaleString()}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Token Type</Text>
                <View style={styles.tokenBadge}>
                  <Text style={styles.tokenBadgeText}>{tokenType}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Instructions Card */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={24} color="#00B14F" />
              <Text style={styles.instructionsTitle}>How to Pay</Text>
            </View>
            <View style={styles.steps}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>Transfer exact amount to agent</Text>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>Save payment receipt/screenshot</Text>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>Upload proof in next step</Text>
              </View>

              <View style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepText}>
                  Wait for confirmation (~5-15 min)
                </Text>
              </View>
            </View>
          </View>

          {/* Warning */}
          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Only proceed after payment. Do not upload fake proof.
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopyAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="copy-outline" size={20} color="#00B14F" />
            <Text style={styles.copyBtnText}>Copy Agent Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.proceedBtn, loading && styles.proceedBtnDisabled]}
            onPress={handleProceed}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.proceedBtnText}>
              {loading ? "Creating Request..." : "I've Made Payment - Upload Proof"}
            </Text>
            {!loading && (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerSpacer: {
    height: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  cardContent: {
    padding: 16,
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  tierBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  tierText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00B14F",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  phoneNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00B14F",
  },
  tokenBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  tokenBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00B14F",
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    padding: 16,
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  steps: {
    gap: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00B14F",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    lineHeight: 24,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#00B14F",
    backgroundColor: "#FFFFFF",
  },
  copyBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#00B14F",
  },
  proceedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#00B14F",
  },
  proceedBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  proceedBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
  },
});
