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
    Platform,
    Dimensions,
    RefreshControl
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBurnStore } from "@/stores/slices/burnSlice";
import { BurnRequestStatus } from "@/stores/types/burn.types";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";
import { formatDate } from "@/utils/format";

const { width } = Dimensions.get("window");

export default function SellTokensStatusScreen() {
    const router = useRouter();
    const { requestId } = useLocalSearchParams<{ requestId: string }>();
    const { currentRequest, fetchCurrentBurnRequest, confirmFiatReceipt, openDispute, loading } = useBurnStore();
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");
    const [disputeDetails, setDisputeDetails] = useState("");
    const [refreshing, setRefreshing] = useState(false);

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

    const onRefresh = async () => {
        setRefreshing(true);
        if (requestId) {
            await fetchCurrentBurnRequest(requestId);
        } else {
            await fetchCurrentBurnRequest();
        }
        setRefreshing(false);
    };

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
                <Text style={styles.loadingText}>Loading status...</Text>
            </View>
        );
    }

    if (!currentRequest) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No active sell requests found.</Text>
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
                return "Processing Request";
            case BurnRequestStatus.ESCROWED:
                return "Waiting for Agent Payment";
            case BurnRequestStatus.FIAT_SENT:
                return "Payment Sent - Reviewing";
            case BurnRequestStatus.CONFIRMED:
                return "Transaction Completed";
            default:
                return status.toUpperCase();
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
                            onPress={() => router.navigate("/(tabs)/activity")}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Sell Request Status</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00B14F" />
                }
            >
                {/* Main Status Card */}
                <Surface style={styles.statusCard} elevation={0}>
                    <View style={[styles.statusIconBg, { backgroundColor: getStatusColor(currentRequest.status) + "20" }]}>
                        <Ionicons
                            name={currentRequest.status === BurnRequestStatus.CONFIRMED ? "checkmark-circle" : "time"}
                            size={40}
                            color={getStatusColor(currentRequest.status)}
                        />
                    </View>
                    <Text style={[styles.statusTitle, { color: getStatusColor(currentRequest.status) }]}>
                        {getStatusText(currentRequest.status)}
                    </Text>
                    <Text style={styles.amountText}>
                        {parseFloat(currentRequest.amount).toLocaleString()} <Text style={styles.tokenSymbol}>{currentRequest.token_type}</Text>
                    </Text>
                    <View style={styles.refContainer}>
                        <Text style={styles.refLabel}>Ref:</Text>
                        <Text style={styles.refValue}>{currentRequest.id.split('-')[0].toUpperCase()}</Text>
                    </View>

                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                        <Text style={styles.dateText}>{formatDate(currentRequest.created_at, true)}</Text>
                    </View>
                </Surface>

                {/* Timeline Section */}
                <Surface style={styles.card} elevation={0}>
                    <Text style={styles.cardTitle}>Activity Progress</Text>
                    <View style={styles.timeline}>
                        {/* Step 1: Request Created */}
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineMarker}>
                                <View style={styles.timelineDotActive} />
                                <View style={styles.timelineLineActive} />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Request Created</Text>
                                <Text style={styles.timelineDesc}>Tokens are safely locked in escrow</Text>
                            </View>
                        </View>

                        {/* Step 2: Agent Payment */}
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineMarker}>
                                <View style={[
                                    styles.timelineDot,
                                    (currentRequest.status === BurnRequestStatus.FIAT_SENT ||
                                        currentRequest.status === BurnRequestStatus.CONFIRMED) && styles.timelineDotActive
                                ]} />
                                <View style={[
                                    styles.timelineLine,
                                    currentRequest.status === BurnRequestStatus.CONFIRMED && styles.timelineLineActive
                                ]} />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={[
                                    styles.timelineTitle,
                                    (currentRequest.status === BurnRequestStatus.FIAT_SENT ||
                                        currentRequest.status === BurnRequestStatus.CONFIRMED) && { color: "#111827" }
                                ]}>Agent Payment</Text>
                                <Text style={styles.timelineDesc}>
                                    {currentRequest.status === BurnRequestStatus.FIAT_SENT
                                        ? "Agent has marked as paid. Please check your bank account."
                                        : currentRequest.status === BurnRequestStatus.CONFIRMED
                                            ? "Payment verified by you"
                                            : "Waiting for agent to send funds..."}
                                </Text>
                            </View>
                        </View>

                        {/* Step 3: Confirmation */}
                        <View style={[styles.timelineItem, { marginBottom: 0 }]}>
                            <View style={styles.timelineMarker}>
                                <View style={[
                                    styles.timelineDot,
                                    currentRequest.status === BurnRequestStatus.CONFIRMED && styles.timelineDotActive
                                ]} />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={[
                                    styles.timelineTitle,
                                    currentRequest.status === BurnRequestStatus.CONFIRMED && { color: "#111827" }
                                ]}>Completion</Text>
                                <Text style={styles.timelineDesc}>
                                    {currentRequest.status === BurnRequestStatus.CONFIRMED
                                        ? "Transaction complete. Tokens released."
                                        : "Funds will be released once confirmed"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Surface>

                {/* Info Card for status instructions */}
                {currentRequest.status === BurnRequestStatus.FIAT_SENT && (
                    <Surface style={styles.instructionCard} elevation={0}>
                        <Ionicons name="information-circle" size={24} color="#3B82F6" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.instructionTitle}>Payment Confirmation</Text>
                            <Text style={styles.instructionText}>
                                The agent claims the payment has been sent. Please verify the amount in your bank account before confirming.
                            </Text>
                        </View>
                    </Surface>
                )}

                {/* Back to Dashboard Button */}
                <TouchableOpacity
                    style={styles.dashboardButton}
                    onPress={() => router.replace("/(tabs)")}
                >
                    <Ionicons name="home-outline" size={20} color="#6B7280" />
                    <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Sticky Footer for current action */}
            {currentRequest.status === BurnRequestStatus.FIAT_SENT && (
                <View style={styles.stickyFooter}>
                    <TouchableOpacity
                        style={styles.disputeActionBtn}
                        onPress={handleOpenDispute}
                    >
                        <Text style={styles.disputeActionText}>I Didn't Receive It</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.confirmActionBtn}
                        onPress={handleConfirmReceipt}
                    >
                        <Text style={styles.confirmActionText}>Yes, I Received It</Text>
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
                                style={[styles.modalButton, styles.cancelBtn]}
                                onPress={() => setShowDisputeModal(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.submitBtn]}
                                onPress={handleSubmitDispute}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Submit Dispute</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
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
    headerWrapper: {
        marginBottom: 0,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 140,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
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
        fontSize: 18,
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
    loadingContainer: {
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
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    statusCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        marginBottom: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    statusIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 8,
        textAlign: "center",
    },
    amountText: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 12,
    },
    tokenSymbol: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    refContainer: {
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    refLabel: {
        fontSize: 12,
        color: "#9CA3AF",
        fontWeight: "600",
    },
    refValue: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "700",
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    dateContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
    },
    dateText: {
        fontSize: 13,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 20,
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: "row",
        marginBottom: 4,
    },
    timelineMarker: {
        alignItems: "center",
        marginRight: 16,
        width: 20,
    },
    timelineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        zIndex: 1,
    },
    timelineDotActive: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#00B14F",
        zIndex: 1,
        borderWidth: 3,
        borderColor: "#D1FAE5",
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 4,
    },
    timelineLineActive: {
        width: 2,
        flex: 1,
        backgroundColor: "#00B14F",
        marginVertical: 4,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 24,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#9CA3AF",
        marginBottom: 4,
    },
    timelineDesc: {
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 18,
    },
    instructionCard: {
        backgroundColor: "#EFF6FF",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        gap: 12,
        borderWidth: 1,
        borderColor: "#DBEAFE",
        marginBottom: 20,
    },
    instructionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1E40AF",
        marginBottom: 4,
    },
    instructionText: {
        fontSize: 13,
        color: "#1E3A8A",
        lineHeight: 18,
    },
    dashboardButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    dashboardButtonText: {
        color: "#4B5563",
        fontWeight: "700",
        fontSize: 15,
    },
    stickyFooter: {
        flexDirection: "row",
        padding: 20,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        gap: 12,
        paddingBottom: Platform.OS === 'ios' ? 90 : 80, // Lift above floating tab bar
    },
    confirmActionBtn: {
        flex: 2,
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmActionText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    disputeActionBtn: {
        flex: 1,
        backgroundColor: "#FEF2F2",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#FEE2E2",
    },
    disputeActionText: {
        color: "#EF4444",
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        marginTop: 16,
        marginBottom: 24,
        textAlign: "center",
    },
    homeButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        backgroundColor: "#00B14F",
        borderRadius: 12,
    },
    homeButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16,
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
