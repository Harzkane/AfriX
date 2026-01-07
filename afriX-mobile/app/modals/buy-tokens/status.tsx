import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Text, Button, ActivityIndicator, Card } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMintRequestStore, useWalletStore } from "@/stores";
import { StatusTracker } from "@/components/ui/StatusTracker";
import { TimerComponent } from "@/components/ui/TimerComponent";
import { Ionicons } from "@expo/vector-icons";

export default function MintStatusScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const { currentRequest, checkStatus, openDispute } = useMintRequestStore();
  const { fetchWallets } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");

  // Helper function to check if status is terminal (no more updates expected)
  const isTerminalStatus = (status: string) => {
    return ["confirmed", "cancelled", "rejected", "expired", "refunded"].includes(
      status.toLowerCase()
    );
  };

  useEffect(() => {
    // Initial check
    checkStatus(requestId);

    // Poll status every 10 seconds only if not in terminal state
    const interval = setInterval(() => {
      if (currentRequest && !isTerminalStatus(currentRequest.status)) {
        checkStatus(requestId);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [requestId, currentRequest?.status]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkStatus(requestId);
    setRefreshing(false);
  };

  const handleGoHome = async () => {
    await fetchWallets(); // Refresh balances
    router.replace("/(tabs)");
  };

  const handleCreateNew = () => {
    router.replace("/modals/buy-tokens");
  };

  const handleOpenDispute = () => {
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async () => {
    if (!currentRequest || !disputeReason.trim()) {
      Alert.alert("Error", "Please provide a reason for the dispute");
      return;
    }

    try {
      await openDispute(currentRequest.id, disputeReason, disputeDetails);
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeDetails("");
      Alert.alert(
        "Dispute Submitted",
        "Your dispute has been submitted. Our support team will review it shortly."
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to open dispute");
    }
  };

  if (!currentRequest) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Loading request status...</Text>
      </View>
    );
  }

  const isCompleted = currentRequest.status === "CONFIRMED".toLocaleLowerCase();
  const isExpired = currentRequest.status === "EXPIRED".toLocaleLowerCase();
  const isCancelled = currentRequest.status === "CANCELLED".toLocaleLowerCase();
  const isRejected = currentRequest.status.toLowerCase() === "rejected";
  const isDisputed = currentRequest.status.toLowerCase() === "disputed";
  const isFailed = isExpired || isCancelled || isRejected || isDisputed;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Request Status</Text>
      <Text style={styles.subtitle}>
        Transaction Reference: {currentRequest.id.slice(0, 8)}...
      </Text>

      {/* Timer - only show if not in terminal state */}
      {!isTerminalStatus(currentRequest.status) && (
        <TimerComponent
          expiresAt={currentRequest.expires_at}
          onExpire={() => checkStatus(requestId)}
        />
      )}

      {/* Status Tracker */}
      <Card style={styles.card}>
        <Card.Content>
          <StatusTracker currentStatus={currentRequest.status} />
        </Card.Content>
      </Card>

      {/* Request Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Request Details</Text>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>
              {parseFloat(currentRequest.amount).toLocaleString()}{" "}
              {currentRequest.token_type}
            </Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text
              style={[
                styles.detailValue,
                styles[
                `status_${currentRequest.status.toUpperCase()} ` as keyof typeof styles
                ],
              ]}
            >
              {currentRequest.status.replace("_", " ").toUpperCase()}
            </Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(currentRequest.created_at).toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Status Messages */}
      {currentRequest.status === "PENDING" && (
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoText}>
              ⏳ Waiting for payment proof upload...
            </Text>
            <Button
              mode="contained"
              onPress={() =>
                router.push({
                  pathname: "/modals/buy-tokens/upload-proof",
                  params: { requestId: currentRequest.id },
                })
              }
              style={{ marginTop: 12, borderRadius: 8 }}
              buttonColor="#00B14F"
            >
              Upload Proof
            </Button>
          </Card.Content>
        </Card>
      )}

      {currentRequest.status === "PROOF_SUBMITTED" && (
        <Card style={[styles.infoCard, styles.warningCard]}>
          <Card.Content>
            <Text style={styles.infoText}>
              🔍 Agent is reviewing your payment proof. This usually takes 5-15
              minutes.
            </Text>
          </Card.Content>
        </Card>
      )}

      {isCompleted && (
        <Card style={[styles.infoCard, styles.successCard]}>
          <Card.Content>
            <Text style={styles.successTitle}>✅ Tokens Minted!</Text>
            <Text style={styles.successText}>
              Your {currentRequest.amount} {currentRequest.token_type} tokens
              have been successfully minted and added to your wallet.
            </Text>
          </Card.Content>
        </Card>
      )}

      {isExpired && (
        <Card style={[styles.infoCard, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorTitle}>⏰ Request Expired</Text>
            <Text style={styles.errorText}>
              This request has expired. Please create a new request to buy
              tokens.
            </Text>
          </Card.Content>
        </Card>
      )}

      {isCancelled && (
        <Card style={[styles.infoCard, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorTitle}>🚫 Request Cancelled</Text>
            <Text style={styles.errorText}>
              This request has been cancelled. You can create a new request if
              you&apos;d like to try again.
            </Text>
          </Card.Content>
        </Card>
      )}

      {isRejected && (
        <Card style={[styles.infoCard, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorTitle}>❌ Request Rejected</Text>
            <Text style={styles.errorText}>
              Your payment proof was rejected by the agent. If you believe this is a mistake, you can open a dispute.
            </Text>
            <Button
              mode="outlined"
              onPress={handleOpenDispute}
              style={{ marginTop: 12, borderRadius: 8, borderColor: "#DC2626" }}
              textColor="#DC2626"
            >
              Open Dispute
            </Button>
          </Card.Content>
        </Card>
      )}

      {isDisputed && (
        <Card style={[styles.infoCard, styles.warningCard]}>
          <Card.Content>
            <Text style={[styles.errorTitle, { color: "#F59E0B" }]}>⚠️ Dispute in Progress</Text>
            <Text style={styles.infoText}>
              This request is currently under dispute. Our support team is reviewing the case. You will be notified once a decision is made.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      {isCompleted ? (
        <Button
          mode="contained"
          onPress={async () => {
            // Need to fetch the transaction ID for this mint request
            // The transaction data is not included in the mint request response
            try {
              // Fetch user's transactions and find the one matching this mint request
              const { data } = await require("@/services/apiClient").default.get(
                "/transactions"
              );

              // Find the transaction that matches this mint request
              const transaction = data.data.transactions?.find(
                (tx: any) =>
                  tx.agent_id === currentRequest.agent_id &&
                  parseFloat(tx.amount) === parseFloat(currentRequest.amount) &&
                  tx.token_type === currentRequest.token_type &&
                  tx.type === "mint" &&
                  tx.status === "completed"
              );

              if (transaction) {
                router.replace({
                  pathname: "/modals/buy-tokens/rate-agent",
                  params: { transactionId: transaction.id },
                });
              } else {
                // Fallback: use request ID if transaction not found
                console.warn("Transaction not found, using request ID");
                router.replace({
                  pathname: "/modals/buy-tokens/rate-agent",
                  params: { transactionId: currentRequest.id },
                });
              }
            } catch (error) {
              console.error("Error fetching transaction:", error);
              // Fallback to request ID
              router.push({
                pathname: "/modals/buy-tokens/rate-agent",
                params: { transactionId: currentRequest.id },
              });
            }
          }}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Rate Agent
        </Button>
      ) : isFailed ? (
        <Button
          mode="contained"
          onPress={handleCreateNew}
          style={styles.btn}
          contentStyle={styles.btnContent}
        >
          Create New Request
        </Button>
      ) : (
        <>
          <Button
            mode="outlined"
            onPress={handleGoHome}
            icon="home"
            style={[styles.btn, { marginBottom: 0 }]}
            contentStyle={styles.btnContent}
          >
            Back to Dashboard
          </Button>
          <Button
            mode="outlined"
            onPress={onRefresh}
            icon="refresh"
            style={styles.btn}
            contentStyle={styles.btnContent}
          >
            Refresh Status
          </Button>
        </>
      )}

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>Need Help?</Text>
        <Text style={styles.helpText}>
          If your request is taking longer than expected, please contact support
          or try again.
        </Text>
        <Button mode="text" onPress={() => router.push("/(tabs)/profile")}>
          Contact Support
        </Button>
      </View>

      {/* Dispute Modal */}
      <Modal
        visible={showDisputeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Open Dispute</Text>
              <TouchableOpacity onPress={() => setShowDisputeModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Please explain why you believe your payment proof was wrongly rejected. Our support team will investigate.
            </Text>

            <Text style={styles.inputLabel}>Reason *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., I have valid payment proof"
              value={disputeReason}
              onChangeText={setDisputeReason}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide any additional information..."
              value={disputeDetails}
              onChangeText={setDisputeDetails}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDisputeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitDispute}
              >
                <Text style={styles.submitButtonText}>Submit Dispute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 24,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 24,
    fontFamily: "monospace",
  },
  card: {
    color: "#00C851",
    marginVertical: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 16,
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00C851",
  },
  status_pending: {
    color: "#FFB800",
  },
  status_proof_submitted: {
    color: "#33B5E5",
  },
  status_confirmed: {
    color: "#00C851",
  },
  status_expired: {
    color: "#FF4444",
  },
  status_cancelled: {
    color: "#FF4444",
  },
  status_rejected: {
    color: "#FF4444",
  },
  status_disputed: {
    color: "#F59E0B",
  },
  infoCard: {
    marginVertical: 12,
    backgroundColor: "#E8F9F0",
  },
  warningCard: {
    backgroundColor: "#FFF9E6",
  },
  successCard: {
    backgroundColor: "#E8F9F0",
  },
  errorCard: {
    backgroundColor: "#FFE6E6",
  },
  infoText: {
    fontSize: 14,
    color: "#1A1A1A",
    lineHeight: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00B14F",
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: "#1A1A1A",
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF4444",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#1A1A1A",
    lineHeight: 20,
  },
  btn: {
    marginVertical: 12,
    borderRadius: 8,
  },
  btnContent: {
    height: 50,
  },
  helpSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  modalDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#DC2626",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
