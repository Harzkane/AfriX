import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Modal, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions, Image, Linking } from "react-native";
import { Text, Button, ActivityIndicator, Card, Surface } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMintRequestStore, useWalletStore } from "@/stores";
import { StatusTracker } from "@/components/ui/StatusTracker";
import { TimerComponent } from "@/components/ui/TimerComponent";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatDate } from "@/utils/format";
import apiClient from "@/services/apiClient";

const { width } = Dimensions.get("window");

export default function MintStatusScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const { currentRequest, checkStatus, openDispute } = useMintRequestStore();
  const { fetchWallets } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [canRate, setCanRate] = useState(true);

  // Helper function to check if status is terminal (no more updates expected)
  const isTerminalStatus = (status: string) => {
    return ["confirmed", "cancelled", "rejected", "expired", "refunded"].includes(
      (status || "").toLowerCase()
    );
  };

  // Expired by time = don't poll; show expired state
  const isExpiredByTime = (req: { expires_at?: string } | null) => {
    if (!req?.expires_at) return false;
    return new Date(req.expires_at).getTime() <= Date.now();
  };

  useEffect(() => {
    if (!requestId) return;
    // Initial fetch once when screen opens
    checkStatus(requestId);

    // Poll every 10s only when request is not terminal and not expired by time
    const interval = setInterval(() => {
      const state = useMintRequestStore.getState();
      const req = state.currentRequest;
      if (
        req &&
        req.id === requestId &&
        !isTerminalStatus(req.status) &&
        !isExpiredByTime(req)
      ) {
        state.checkStatus(requestId);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [requestId]);

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
    router.replace({
      pathname: "/modals/buy-tokens",
      params: {
        amount: currentRequest?.amount?.toString() ?? "",
        tokenType: currentRequest?.token_type ?? "NT",
      },
    });
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

  const handleDismiss = async () => {
    if (!currentRequest) return;

    // If it's expired but still pending in DB, we use cancel to delete it
    if (currentRequest.status.toLowerCase() === "pending") {
      try {
        await useMintRequestStore.getState().cancelMintRequest(currentRequest.id);
      } catch (e) {
        // Ignore error if cancel fails (e.g. network), just clear local state below
        console.log("Failed to cancel expired request:", e);
      }
    }

    // Always clear local state and go home
    useMintRequestStore.getState().clearRequest();
    router.replace("/(tabs)");
  };

  // Decide if we should show the "Rate Experience" button.
  useEffect(() => {
    const checkCanRate = async () => {
      if (!currentRequest) return;

      const isCompleted = (currentRequest.status || "").toLowerCase() === "confirmed";

      try {
        if (!isCompleted) {
          setCanRate(false);
          return;
        }

        const { data } = await apiClient.get("/transactions/pending-review");
        const pending = data?.data?.transactions || data?.data || [];

        const match = pending.find(
          (tx: any) =>
            tx.agent_id === currentRequest.agent_id &&
            parseFloat(tx.amount) === parseFloat(currentRequest.amount) &&
            tx.token_type === currentRequest.token_type &&
            (tx.type || "").toLowerCase() === "mint"
        );

        setCanRate(!!match);
      } catch (e) {
        setCanRate(true);
      }
    };

    checkCanRate();
  }, [currentRequest]);

  if (!currentRequest) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Loading request status...</Text>
      </View>
    );
  }

  const statusLower = (currentRequest.status || "").toLowerCase();
  const isCompleted = statusLower === "confirmed";
  const isExpiredByStatus = statusLower === "expired";
  // Only treat time-based expiry as "expired" while the request is not already completed.
  // This prevents a successfully minted request from later being shown as "Request Expired"
  // just because its original expires_at time has passed.
  const isExpiredByTimeNow = !isCompleted && isExpiredByTime(currentRequest);
  const isExpired = isExpiredByStatus || isExpiredByTimeNow;
  const isCancelled = currentRequest.status === "cancelled" || currentRequest.status === "CANCELLED";
  const isRejected = currentRequest.status.toLowerCase() === "rejected";
  const isDisputed = currentRequest.status.toLowerCase() === "disputed";
  const isFailed = isExpired || isCancelled || isRejected || isDisputed;


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "#00B14F";
      case "pending":
      case "proof_submitted":
        return "#FFB800";
      case "expired":
      case "cancelled":
      case "rejected":
        return "#EF4444";
      case "disputed":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#00B14F", "#008F40"]}
          style={styles.headerGradient}
        />
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.push("/activity")}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mint Request Status</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00B14F" />
        }
      >
        <View style={styles.mainContent}>
          {/* Status Header Chip */}
          <View style={styles.statusChipContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentRequest.status) + "20" }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(currentRequest.status) }]}>
                {currentRequest.status.replace("_", " ").toUpperCase()}
              </Text>
            </View>
            <Text style={styles.refText}>Ref: {currentRequest.id.split('-')[0].toUpperCase()}</Text>
          </View>

          {/* Timer - only show if not in terminal state and not already expired by time */}
          {!isTerminalStatus(currentRequest.status) &&
            new Date(currentRequest.expires_at).getTime() > Date.now() && (
              <Surface style={styles.timerCard} elevation={0}>
                <TimerComponent
                  expiresAt={currentRequest.expires_at}
                  onExpire={() => checkStatus(requestId)}
                />
              </Surface>
            )}

          {/* Status Tracker */}
          <Surface style={styles.card} elevation={0}>
            <Text style={styles.cardTitle}>Tracking Progress</Text>
            <StatusTracker currentStatus={currentRequest.status} />
          </Surface>

          {/* Request Details */}
          <Surface style={styles.card} elevation={0}>
            <Text style={styles.cardTitle}>Transaction Details</Text>

            <View style={styles.detail}>
              <Text style={styles.detailLabel}>Amount to Buy</Text>
              <Text style={styles.detailValue}>
                {parseFloat(currentRequest.amount).toLocaleString()}{" "}
                <Text style={styles.tokenSymbol}>{currentRequest.token_type}</Text>
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detail}>
              <Text style={styles.detailLabel}>Date Created</Text>
              <Text style={styles.detailText}>
                {formatDate(currentRequest.created_at, true)}
              </Text>
            </View>
          </Surface>

          {/* Payment Proof (user-uploaded) */}
          {currentRequest.payment_proof_url && (
            <Surface style={styles.card} elevation={0}>
              <Text style={styles.cardTitle}>Payment Proof</Text>
              <Text style={styles.proofHint}>
                This is the payment proof you uploaded. The agent will verify your transfer using this image.
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(currentRequest.payment_proof_url!)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: currentRequest.payment_proof_url }}
                  style={styles.proofImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <Text style={styles.proofTapHint}>Tap image to view full size</Text>
            </Surface>
          )}

          {/* Status Specific Message Cards */}
          {currentRequest.status.toLowerCase() === "pending" && !isExpired && (
            <Surface style={[styles.messageCard, styles.pendingMessage]} elevation={0}>
              <Ionicons name="information-circle" size={20} color="#FFB800" />
              <View style={styles.messageContent}>
                <Text style={styles.messageTitle}>Needs Action</Text>
                <Text style={styles.messageText}>Please upload your payment proof so the agent can confirm your receipt.</Text>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    router.push({
                      pathname: "/modals/buy-tokens/upload-proof",
                      params: { requestId: currentRequest.id },
                    })
                  }
                >
                  <Text style={styles.actionButtonText}>Upload Proof Now</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </Surface>
          )}

          {currentRequest.status.toLowerCase() === "proof_submitted" && (
            <Surface style={[styles.messageCard, styles.warningMessage]} elevation={0}>
              <Ionicons name="search" size={20} color="#3B82F6" />
              <View style={styles.messageContent}>
                <Text style={[styles.messageTitle, { color: "#1E40AF" }]}>Pending Review</Text>
                <Text style={[styles.messageText, { color: "#1E3A8A" }]}>
                  The agent is currently verifying your payment. You will be notified once it's complete.
                </Text>
              </View>
            </Surface>
          )}

          {isCompleted && (
            <Surface style={[styles.messageCard, styles.successMessage]} elevation={0}>
              <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
              <View style={styles.messageContent}>
                <Text style={styles.successTitle}>Successfully Minted!</Text>
                <Text style={styles.successText}>
                  Your {parseFloat(currentRequest.amount).toLocaleString()} {currentRequest.token_type} tokens are now available in your wallet.
                </Text>
              </View>
            </Surface>
          )}

          {(isExpired || isCancelled || isRejected) && (
            <Surface style={[styles.messageCard, styles.errorMessage]} elevation={0}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <View style={styles.messageContent}>
                <Text style={styles.errorTitle}>
                  {isExpired ? "Request Expired" : isCancelled ? "Request Cancelled" : "Payment Rejected"}
                </Text>
                <Text style={styles.errorText}>
                  {isRejected
                    ? "Your payment proof was rejected. If you have any concerns, you can open a dispute."
                    : "This transaction was not completed within the time limit or was manually cancelled."}
                </Text>
                {isRejected && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: "#EF4444", marginTop: 12 }]}
                    onPress={handleOpenDispute}
                  >
                    <Text style={styles.actionButtonText}>Open Dispute</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Surface>
          )}

          {isDisputed && (
            <Surface style={[styles.messageCard, styles.disputeMessage]} elevation={0}>
              <Ionicons name="alert-circle" size={24} color="#F59E0B" />
              <View style={styles.messageContent}>
                <Text style={[styles.messageTitle, { color: "#92400E" }]}>Dispute Opened</Text>
                <Text style={[styles.messageText, { color: "#92400E" }]}>
                  Our support team is investigating this transaction. We will reach out to you via email soon.
                </Text>
              </View>
            </Surface>
          )}

          {/* Action Buttons */}
          <View style={styles.footerActions}>
            {isCompleted && canRate ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={async () => {
                  try {
                    const { data } = await require("@/services/apiClient").default.get("/transactions");
                    const transaction = data.data.transactions?.find((tx: any) =>
                      tx.agent_id === currentRequest.agent_id &&
                      parseFloat(tx.amount) === parseFloat(currentRequest.amount) &&
                      tx.token_type === currentRequest.token_type &&
                      tx.type === "mint"
                    );

                    router.replace({
                      pathname: "/modals/buy-tokens/rate-agent",
                      params: { transactionId: transaction?.id || currentRequest.id },
                    });
                  } catch (e) {
                    router.replace({
                      pathname: "/modals/buy-tokens/rate-agent",
                      params: { transactionId: currentRequest.id },
                    });
                  }
                }}
              >
                <Text style={styles.primaryBtnText}>Rate Experience</Text>
                <Ionicons name="star" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : isFailed ? (
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={handleDismiss}
                >
                  <Text style={styles.dismissBtnText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleCreateNew}>
                  <Text style={styles.primaryBtnText}>Try Again</Text>
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoHome}>
                <Ionicons name="home-outline" size={20} color="#6B7280" />
                <Text style={styles.secondaryBtnText}>Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Help Support Link */}
          <TouchableOpacity
            style={styles.helpLink}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={styles.helpLinkText}>Need help with this request?</Text>
            <Text style={styles.supportText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
                style={[styles.modalButton, styles.cancelBtn]}
                onPress={() => setShowDisputeModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitBtn]}
                onPress={handleSubmitDispute}
              >
                <Text style={styles.submitBtnText}>Submit Dispute</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerWrapper: {
    marginBottom: 0,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
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
  mainContent: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  statusChipContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  refText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  timerCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  detail: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  detailText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  tokenSymbol: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  proofHint: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  proofImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  proofTapHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
  },
  messageCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  pendingMessage: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FEF3C7",
  },
  warningMessage: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  successMessage: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  errorMessage: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
  },
  disputeMessage: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FEF3C7",
  },
  successTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 4,
  },
  successText: {
    fontSize: 14,
    color: "#15803D",
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#B91C1C",
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: "#00B14F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  footerActions: {
    gap: 12,
    marginTop: 10,
  },
  footerRow: {
    flexDirection: "row",
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#00B14F",
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryBtnText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
  dismissBtn: {
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  dismissBtnText: {
    color: "#1E40AF",
    fontSize: 16,
    fontWeight: "600",
  },
  helpLink: {
    alignItems: "center",
    marginTop: 30,
    gap: 4,
  },
  helpLinkText: {
    fontSize: 13,
    color: "#6B7280",
  },
  supportText: {
    fontSize: 14,
    color: "#00B14F",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  modalDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
  },
  cancelBtnText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "700",
  },
  submitBtn: {
    backgroundColor: "#EF4444",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
