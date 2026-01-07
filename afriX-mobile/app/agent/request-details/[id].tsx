import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAgentStore } from "@/stores/slices/agentSlice";
import * as ImagePicker from "expo-image-picker";
import { formatAmount, formatDate } from "@/utils/format";

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { pendingRequests, confirmMintRequest, confirmBurnPayment, rejectRequest, loading } = useAgentStore();

  const request = pendingRequests.find((r) => r.id === id);
  const [uploading, setUploading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Request not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isMint = request.type === "mint" || (!request.type && !request.bank_account);
  const isBurn = !isMint;

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{request.user?.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{request.user?.email}</Text>
          </View>
        </View>

        {/* Transaction Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Type</Text>
            <View style={[styles.badge, isMint ? styles.mintBadge : styles.burnBadge]}>
              <Text style={[styles.badgeText, isMint ? styles.mintText : styles.burnText]}>
                {isMint ? "MINT" : "BURN"}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amountValue}>
              {formatAmount(request.amount, request.token_type)} {request.token_type}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {formatDate(request.created_at)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{request.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Mint Specific: Payment Proof */}
        {isMint && request.payment_proof_url && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Proof</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(request.payment_proof_url!)}
            >
              <Image
                source={{ uri: request.payment_proof_url }}
                style={styles.proofImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            <Text style={styles.hint}>Tap image to view full size</Text>
          </View>
        )}

        {/* Burn Specific: Bank Details */}
        {isBurn && request.bank_account && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bank Details (For Payment)</Text>
            <View style={styles.bankContainer}>
              <Text style={styles.bankLabel}>Bank Name</Text>
              <Text style={styles.bankValue}>{request.bank_account.bank_name}</Text>

              <Text style={styles.bankLabel}>Account Number</Text>
              <Text style={styles.bankValue}>{request.bank_account.account_number}</Text>

              <Text style={styles.bankLabel}>Account Name</Text>
              <Text style={styles.bankValue}>{request.bank_account.account_name}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isMint ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleConfirmMint}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Confirm Payment Received</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleUploadProof}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Upload Payment Proof</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => setRejectModalVisible(true)}
          disabled={loading}
        >
          <Text style={[styles.actionButtonText, styles.rejectButtonText]}>Reject Request</Text>
        </TouchableOpacity>
      </View>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Request</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Please explain why you are rejecting this request. The user will be notified.
            </Text>

            <Text style={styles.inputLabel}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Payment proof is invalid or unreadable"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleReject}
              >
                <Text style={styles.submitButtonText}>Reject Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView >
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
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mintBadge: {
    backgroundColor: "#ECFDF5",
  },
  burnBadge: {
    backgroundColor: "#FFFBEB",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  mintText: {
    color: "#00B14F",
  },
  burnText: {
    color: "#F59E0B",
  },
  proofImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F3F4F6",
  },
  hint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  bankContainer: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
  },
  bankLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  bankValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  backButtonText: {
    color: "#374151",
    fontWeight: "600",
  },
  rejectButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#EF4444",
    marginTop: 12,
  },
  rejectButtonText: {
    color: "#EF4444",
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
    backgroundColor: "#EF4444",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
