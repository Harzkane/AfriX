import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatAmount, formatDate } from "@/utils/format";

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const {
    pendingRequests,
    history,
    confirmMintRequest,
    confirmBurnPayment,
    rejectRequest,
    loading,
  } = useAgentStore();

  const request = [...pendingRequests, ...history].find((item) => item.id === id);
  const [uploading, setUploading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const isMint =
    request?.type === "mint" || (!request?.type && !request?.bank_account);
  const isBurn = !isMint;

  const isExpiredByTime = (req: any) => {
    if (!req?.expires_at) return false;
    return new Date(req.expires_at).getTime() < Date.now();
  };

  const isExpired =
    request?.status === "expired" || (request ? isExpiredByTime(request) : false);
  const canConfirmMint =
    !!request &&
    isMint &&
    request.status === "proof_submitted" &&
    !isExpired;
  const canReject =
    !!request &&
    (request.status === "pending" || request.status === "proof_submitted");

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Request unavailable</Text>
          <Text style={styles.errorText}>Request not found.</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.primaryAction}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeConfig = getTypeConfig(isMint ? "mint" : "burn");
  const statusColor = getStatusColor(request.status);

  const handleConfirmMint = async () => {
    Alert.alert(
      "Confirm Mint",
      "Are you sure you have received the payment? This will mint tokens to the user.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await confirmMintRequest(request.id);
              Alert.alert("Success", "Mint request confirmed!");
              router.back();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleUploadProof = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        await confirmBurnPayment(request.id, result.assets[0]);
        setUploading(false);
        Alert.alert("Success", "Payment proof uploaded!");
        router.back();
      }
    } catch (error: any) {
      setUploading(false);
      Alert.alert("Error", error.message);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }

    try {
      await rejectRequest(request.id, rejectReason, isMint ? "mint" : "burn");
      setRejectModalVisible(false);
      Alert.alert("Success", "Request rejected");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
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
            <Text style={styles.headerTitle}>Request Details</Text>
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
          <Text style={styles.summaryEyebrow}>Agent Workflow</Text>
          <Text style={styles.summaryTitle}>
            {isMint ? "Mint Request" : "Burn Request"}
          </Text>
          <Text style={styles.summaryText}>
            Review the customer, amount, request status, and any payment details
            before you confirm, upload proof, or reject this request.
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
              <Text style={[styles.typePillText, { color: typeConfig.color }]}>
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
                {String(request.status || "").replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <View>
              <Text style={styles.amountLabel}>Request Amount</Text>
              <Text style={styles.amountValue}>
                {formatAmount(request.amount, request.token_type)}{" "}
                {request.token_type}
              </Text>
            </View>
            <View style={styles.amountMeta}>
              <Text style={styles.amountMetaLabel}>Created</Text>
              <Text style={styles.amountMetaValue}>
                {formatDate(request.created_at, true)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {isExpired && request.status !== "disputed" ? (
          <Surface style={[styles.messageCard, styles.expiredCard]}>
            <Ionicons name="alert-circle" size={22} color="#B42318" />
            <View style={styles.messageContent}>
              <Text style={[styles.messageTitle, styles.expiredTitle]}>
                Request Expired
              </Text>
              <Text style={[styles.messageText, styles.expiredText]}>
                This request expired before completion and has been automatically
                refunded to the user.
              </Text>
            </View>
          </Surface>
        ) : null}

        {request.status === "disputed" ? (
          <Surface style={[styles.messageCard, styles.disputedCard]}>
            <Ionicons name="warning" size={22} color="#D97706" />
            <View style={styles.messageContent}>
              <Text style={[styles.messageTitle, styles.disputedTitle]}>
                Dispute Opened
              </Text>
              <Text style={[styles.messageText, styles.disputedText]}>
                This request expired while in Fiat Sent status, so an automatic
                dispute has been opened for admin review.
              </Text>
            </View>
          </Surface>
        ) : null}

        <Surface style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>User Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{request.user?.full_name || "—"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{request.user?.email || "—"}</Text>
          </View>
        </Surface>

        <Surface style={styles.card}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Request Summary</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{typeConfig.label}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>
              {formatAmount(request.amount, request.token_type)}{" "}
              {request.token_type}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>
              {String(request.status || "").replace(/_/g, " ")}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created On</Text>
            <Text style={styles.infoValue}>{formatDate(request.created_at, true)}</Text>
          </View>
        </Surface>

        {isMint && request.payment_proof_url ? (
          <Surface style={styles.card}>
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>Payment Proof</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(request.payment_proof_url!)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: request.payment_proof_url }}
                style={styles.proofImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.hint}>Tap the image to view it full size.</Text>
          </Surface>
        ) : null}

        {isBurn && request.fiat_proof_url ? (
          <Surface style={styles.card}>
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>Fiat Payment Proof</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(request.fiat_proof_url!)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: request.fiat_proof_url }}
                style={styles.proofImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.hint}>Tap the image to view it full size.</Text>
          </Surface>
        ) : null}

        {isBurn && request.bank_account ? (
          <Surface style={styles.card}>
            <View style={styles.cardAccent} />
            <Text style={styles.cardTitle}>
              {(request.bank_account as any).type === "mobile_money" ||
              (!(request.bank_account as any).bank_name &&
                ((request.bank_account as any).provider ||
                  (request.bank_account as any).phone_number))
                ? "Mobile Money Details"
                : "Bank Details"}
            </Text>

            <View style={styles.detailBlock}>
              {(() => {
                const details = request.bank_account as {
                  type?: string;
                  bank_name?: string;
                  account_number?: string;
                  account_name?: string;
                  provider?: string;
                  phone_number?: string;
                };

                const isMobileMoney =
                  details.type === "mobile_money" ||
                  (!details.bank_name &&
                    (details.provider || details.phone_number));

                if (isMobileMoney) {
                  return (
                    <>
                      <View style={styles.infoStrip}>
                        <Text style={styles.infoStripLabel}>Provider</Text>
                        <Text style={styles.infoStripValue}>
                          {details.provider ?? "—"}
                        </Text>
                      </View>
                      <View style={styles.infoStrip}>
                        <Text style={styles.infoStripLabel}>Phone Number</Text>
                        <Text style={styles.infoStripValue}>
                          {details.phone_number ?? "—"}
                        </Text>
                      </View>
                      <View style={styles.infoStripLast}>
                        <Text style={styles.infoStripLabel}>Wallet Holder</Text>
                        <Text style={styles.infoStripValue}>
                          {details.account_name ?? "—"}
                        </Text>
                      </View>
                    </>
                  );
                }

                return (
                  <>
                    <View style={styles.infoStrip}>
                      <Text style={styles.infoStripLabel}>Bank Name</Text>
                      <Text style={styles.infoStripValue}>
                        {details.bank_name ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.infoStrip}>
                      <Text style={styles.infoStripLabel}>Account Number</Text>
                      <Text style={styles.infoStripValue}>
                        {details.account_number ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.infoStripLast}>
                      <Text style={styles.infoStripLabel}>Account Name</Text>
                      <Text style={styles.infoStripValue}>
                        {details.account_name ?? "—"}
                      </Text>
                    </View>
                  </>
                );
              })()}
            </View>
          </Surface>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {isMint ? (
          canConfirmMint ? (
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={handleConfirmMint}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryActionText}>
                    Confirm Payment Received
                  </Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          ) : null
        ) : (
          <TouchableOpacity
            style={[
              styles.primaryAction,
              (uploading || isExpired) && styles.primaryActionDisabled,
            ]}
            onPress={handleUploadProof}
            disabled={uploading || isExpired}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryActionText}>Upload Payment Proof</Text>
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        )}

        {canReject ? (
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => setRejectModalVisible(true)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionText}>Reject Request</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Request</Text>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Please explain why you are rejecting this request. The user will be
              notified immediately.
            </Text>

            <Text style={styles.inputLabel}>Reason</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g. Payment proof is invalid or unreadable"
              placeholderTextColor="#98A2B3"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRejectModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleReject}
                activeOpacity={0.85}
              >
                <Text style={styles.submitButtonText}>Reject Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getTypeConfig = (type: "mint" | "burn") => {
  if (type === "mint") {
    return {
      label: "Mint",
      icon: "arrow-up-circle" as const,
      bg: "#F0FDF4",
      color: "#00B14F",
      border: "#DDF7E5",
    };
  }

  return {
    label: "Burn",
    icon: "arrow-down-circle" as const,
    bg: "#FFF8ED",
    color: "#D97706",
    border: "#FDE7C2",
  };
};

const getStatusColor = (status: string) => {
  switch (String(status || "").toLowerCase()) {
    case "confirmed":
    case "completed":
      return "#00B14F";
    case "proof_submitted":
    case "escrowed":
    case "pending":
      return "#F59E0B";
    case "rejected":
    case "expired":
      return "#EF4444";
    case "disputed":
      return "#D97706";
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
    paddingBottom: 140,
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
  messageCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  expiredCard: {
    backgroundColor: "#FEF3F2",
    borderColor: "#FECDCA",
  },
  expiredTitle: {
    color: "#B42318",
  },
  expiredText: {
    color: "#B42318",
  },
  disputedCard: {
    backgroundColor: "#FFFAEB",
    borderColor: "#FEDF89",
  },
  disputedTitle: {
    color: "#B54708",
  },
  disputedText: {
    color: "#B54708",
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
  proofImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    color: "#98A2B3",
    textAlign: "center",
  },
  detailBlock: {
    backgroundColor: "#FBFCFD",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    padding: 14,
  },
  infoStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
    gap: 12,
  },
  infoStripLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EAF0F5",
    gap: 12,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00B14F",
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryActionDisabled: {
    backgroundColor: "#A7F3D0",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F04438",
    backgroundColor: "#FFFFFF",
  },
  secondaryActionText: {
    color: "#F04438",
    fontSize: 16,
    fontWeight: "700",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
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
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    height: 112,
    textAlignVertical: "top",
    marginBottom: 18,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
  submitButton: {
    backgroundColor: "#F04438",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
