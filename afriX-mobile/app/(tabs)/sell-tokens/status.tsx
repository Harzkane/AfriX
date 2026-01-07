import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBurnStore } from "@/stores/slices/burnSlice";
import { BurnRequestStatus } from "@/stores/types/burn.types";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SellTokensStatusScreen() {
    const router = useRouter();
    const { requestId } = useLocalSearchParams<{ requestId: string }>();
    const { currentRequest, fetchCurrentBurnRequest, confirmFiatReceipt, openDispute, loading } = useBurnStore();
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");
    const [disputeDetails, setDisputeDetails] = useState("");

    useEffect(() => {
        if (requestId) {
            fetchCurrentBurnRequest(requestId);
        } else {
            fetchCurrentBurnRequest();
        }

        // Poll every 10 seconds for status updates
        const interval = setInterval(() => {
            if (requestId) {
                fetchCurrentBurnRequest(requestId);
            } else {
                fetchCurrentBurnRequest();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [requestId]);

    const handleConfirmReceipt = async () => {
        if (!currentRequest) return;

        Alert.alert(
            "Confirm Receipt",
            "Have you received the money in your bank account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, I Received It",
                    onPress: async () => {
                        try {
                            await confirmFiatReceipt(currentRequest.id);
                            Alert.alert("Success", "Transaction completed successfully!");
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to confirm receipt");
                        }
                    },
                },
            ]
        );
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
                "Dispute Opened",
                "Your dispute has been submitted. Our support team will review it shortly."
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to open dispute");
        }
    };

    if (loading && !currentRequest) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00B14F" />
            </View>
        );
    }

    if (!currentRequest) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No active sell requests.</Text>
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => router.replace("/(tabs)")}
                    >
                        <Text style={styles.homeButtonText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const getStatusColor = (status: BurnRequestStatus) => {
        switch (status) {
            case BurnRequestStatus.PENDING:
            case BurnRequestStatus.ESCROWED:
                return "#F59E0B"; // Orange
            case BurnRequestStatus.FIAT_SENT:
                return "#3B82F6"; // Blue
            case BurnRequestStatus.CONFIRMED:
                return "#00B14F"; // Green
            default:
                return "#6B7280"; // Gray
        }
    };

    const getStatusText = (status: BurnRequestStatus) => {
        switch (status) {
            case BurnRequestStatus.PENDING:
                return "Processing Request...";
            case BurnRequestStatus.ESCROWED:
                return "Waiting for Agent Payment";
            case BurnRequestStatus.FIAT_SENT:
                return "Payment Sent - Please Confirm";
            case BurnRequestStatus.CONFIRMED:
                return "Completed";
            default:
                return status.toUpperCase();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Request Status</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.statusCard}>
                    <View style={[styles.statusIcon, { backgroundColor: getStatusColor(currentRequest.status) }]}>
                        <Ionicons name="time" size={32} color="#FFFFFF" />
                    </View>
                    <Text style={styles.statusTitle}>{getStatusText(currentRequest.status)}</Text>
                    <Text style={styles.statusSub}>
                        {currentRequest.amount} {currentRequest.token_type}
                    </Text>
                </View>

                <View style={styles.timeline}>
                    {/* Step 1: Request Created */}
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineDotActive} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Request Created</Text>
                            <Text style={styles.timelineDesc}>Tokens locked in escrow</Text>
                        </View>
                    </View>

                    {/* Step 2: Agent Payment */}
                    <View style={styles.timelineItem}>
                        <View style={[
                            styles.timelineDot,
                            (currentRequest.status === BurnRequestStatus.FIAT_SENT ||
                                currentRequest.status === BurnRequestStatus.CONFIRMED) && styles.timelineDotActive
                        ]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Agent Payment</Text>
                            <Text style={styles.timelineDesc}>
                                {currentRequest.status === BurnRequestStatus.FIAT_SENT
                                    ? "Agent has marked as paid. Check your bank."
                                    : "Waiting for agent to send money..."}
                            </Text>
                        </View>
                    </View>

                    {/* Step 3: Confirmation */}
                    <View style={styles.timelineItem}>
                        <View style={[
                            styles.timelineDot,
                            currentRequest.status === BurnRequestStatus.CONFIRMED && styles.timelineDotActive
                        ]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Completion</Text>
                            <Text style={styles.timelineDesc}>Tokens released to agent</Text>
                        </View>
                    </View>
                </View>

                {/* Back to Dashboard Button */}
                <TouchableOpacity
                    style={styles.homeButton}
                    onPress={() => router.replace("/(tabs)")}
                >
                    <Text style={styles.homeButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </ScrollView>

            {currentRequest.status === BurnRequestStatus.FIAT_SENT && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.disputeButton]}
                        onPress={handleOpenDispute}
                    >
                        <Text style={styles.disputeButtonText}>I Didn't Receive It</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirmReceipt}
                    >
                        <Text style={styles.confirmText}>I Received the Money</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Dispute Modal */}
            <Modal
                visible={showDisputeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDisputeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Open Dispute</Text>
                            <TouchableOpacity onPress={() => setShowDisputeModal(false)}>
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDescription}>
                            Please explain why you didn't receive the payment. Our support team will investigate.
                        </Text>

                        <Text style={styles.inputLabel}>Reason *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., No payment received in my account"
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
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Submit Dispute</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        padding: 20,
    },
    statusCard: {
        alignItems: "center",
        marginBottom: 40,
        marginTop: 20,
    },
    statusIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    statusSub: {
        fontSize: 16,
        color: "#6B7280",
    },
    timeline: {
        paddingLeft: 16,
    },
    timelineItem: {
        flexDirection: "row",
        marginBottom: 32,
    },
    timelineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        marginRight: 16,
        marginTop: 4,
    },
    timelineDotActive: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#00B14F",
        marginRight: 16,
        marginTop: 4,
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    timelineDesc: {
        fontSize: 14,
        color: "#6B7280",
    },
    footer: {
        flexDirection: "row",
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    confirmButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    confirmText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        marginBottom: 20,
    },
    homeButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: "#F3F4F6",
        borderRadius: 8,
        alignSelf: "center",
        marginTop: 16,
    },
    homeButtonText: {
        color: "#374151",
        fontWeight: "600",
        fontSize: 16,
    },
    // Dispute Modal Styles
    actionButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginHorizontal: 6,
    },
    disputeButton: {
        backgroundColor: "#EF4444",
    },
    disputeButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#111827",
        marginBottom: 16,
        minHeight: 50,
    },
    textArea: {
        minHeight: 100,
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
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
