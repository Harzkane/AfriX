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
    RefreshControl,
    Image,
    Linking,
    KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBurnStore } from "@/stores/slices/burnSlice";
import { BurnRequestStatus } from "@/stores/types/burn.types";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";
import { formatDate } from "@/utils/format";
import apiClient from "@/services/apiClient";

export default function SellTokensStatusScreen() {
    const router = useRouter();
    const { requestId } = useLocalSearchParams<{ requestId: string }>();
    const { currentRequest, fetchCurrentBurnRequest, confirmFiatReceipt, openDispute, loading } = useBurnStore();
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");
    const [disputeDetails, setDisputeDetails] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [canRate, setCanRate] = useState(true);

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
    }, [fetchCurrentBurnRequest, requestId]);

    // Determine if this completed burn transaction is still eligible for rating.
    // We use /transactions/pending-review, which only returns completed mint/burn
    // transactions that do NOT yet have a review from this user.
    useEffect(() => {
        const checkCanRate = async () => {
            try {
                if (!currentRequest || currentRequest.status !== BurnRequestStatus.CONFIRMED) {
                    setCanRate(false);
                    return;
                }

                const { data } = await apiClient.get("/transactions/pending-review");
                const pending = data?.data?.transactions || data?.data || [];

                const requestIdMatch = pending.find((tx: any) => tx.id === currentRequest.id);
                const relatedRequestIdMatch = pending.find(
                    (tx: any) => tx.request_id === currentRequest.id
                );
                const match = requestIdMatch || relatedRequestIdMatch;

                setCanRate(!!match);
            } catch {
                // If the check fails, fall back to allowing rating.
                setCanRate(true);
            }
        };

        checkCanRate();
    }, [currentRequest]);

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
            case BurnRequestStatus.EXPIRED:
            case BurnRequestStatus.REJECTED:
                return "#EF4444"; // Red
            case BurnRequestStatus.DISPUTED:
                return "#F59E0B"; // Orange
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
            case BurnRequestStatus.EXPIRED:
                return "Request Expired";
            case BurnRequestStatus.REJECTED:
                return "Request Rejected";
            case BurnRequestStatus.DISPUTED:
                return "Under Dispute";
            default:
                return (status as string).toUpperCase();
        }
    };

    const isExpiredByTime = (req: { expires_at?: string } | null) => {
        if (!req?.expires_at) return false;
        return new Date(req.expires_at).getTime() <= Date.now();
    };

    const isCompleted = currentRequest.status === BurnRequestStatus.CONFIRMED;
    const isExpired = currentRequest.status === BurnRequestStatus.EXPIRED || (!isCompleted && isExpiredByTime(currentRequest));
    const isRejected = currentRequest.status === BurnRequestStatus.REJECTED;
    const isDisputed = currentRequest.status === BurnRequestStatus.DISPUTED;
    const isFailed = isExpired || isRejected || isDisputed;
    const isFiatSent = currentRequest.status === BurnRequestStatus.FIAT_SENT;

    const handleDismiss = () => {
        useBurnStore.getState().resetCurrentRequest();
        router.replace("/(tabs)");
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
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.push("/activity")}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.headerText}>
                            <Text style={styles.headerTitle}>Sell Request Status</Text>
                            <Text style={styles.headerSubtitle}>
                                Track your payout progress and confirm once the bank transfer lands.
                            </Text>
                        </View>
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
                <LinearGradient
                    colors={["#F7FFF9", "#FFFFFF"]}
                    style={styles.summaryCard}
                >
                    <Text style={styles.summaryEyebrow}>Live Status</Text>
                    <Text style={styles.summaryTitle}>Stay on top of this sell request</Text>
                    <Text style={styles.summaryText}>
                        Follow escrow, payout, and confirmation steps so you can act quickly whenever the request needs your attention.
                    </Text>
                </LinearGradient>

                <View style={styles.statusChipContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentRequest.status) + "20" }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(currentRequest.status) }]}>
                            {currentRequest.status.replace("_", " ").toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.refText}>Ref: {currentRequest.id.split("-")[0].toUpperCase()}</Text>
                </View>

                <Surface style={styles.card} elevation={0}>
                    <Text style={styles.cardTitle}>Transaction Details</Text>

                    <View style={styles.detail}>
                        <Text style={styles.detailLabel}>Amount to Sell</Text>
                        <Text style={styles.detailValue}>
                            {parseFloat(currentRequest.amount).toLocaleString()}{" "}
                            <Text style={styles.tokenSymbol}>{currentRequest.token_type}</Text>
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detail}>
                        <Text style={styles.detailLabel}>Current Status</Text>
                        <Text style={[styles.detailText, { color: getStatusColor(currentRequest.status) }]}>
                            {getStatusText(currentRequest.status)}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detail}>
                        <Text style={styles.detailLabel}>Date Created</Text>
                        <Text style={styles.detailText}>{formatDate(currentRequest.created_at, true)}</Text>
                    </View>
                </Surface>

                {/* Expiry / Error Banner */}
                {isFailed && (
                    <Surface style={[styles.messageCard, styles.errorMessage, {
                        backgroundColor: isDisputed ? "#FFFBEB" : "#FEF2F2",
                        borderColor: isDisputed ? "#FEF3C7" : "#FEE2E2"
                    }]} elevation={0}>
                        <Ionicons
                            name={isDisputed ? "alert-circle" : "close-circle"}
                            size={24}
                            color={isDisputed ? "#F59E0B" : "#EF4444"}
                        />
                        <View style={styles.messageContent}>
                            <Text style={[styles.messageTitle, { color: isDisputed ? "#92400E" : "#991B1B" }]}>
                                {isExpired ? "Request Expired" : isRejected ? "Request Rejected" : "Dispute Opened"}
                            </Text>
                            <Text style={[styles.messageText, { color: isDisputed ? "#92400E" : "#B91C1C" }]}>
                                {isDisputed
                                    ? "This request expired after the agent claimed to have paid. A dispute has been automatically opened for admin review."
                                    : isExpired
                                        ? "This request was not completed within the time limit. Your tokens have been (or will be shortly) automatically refunded to your wallet."
                                        : "The agent rejected this request. Your tokens have been refunded."}
                            </Text>
                        </View>
                    </Surface>
                )}

                {/* Timeline Section */}
                <Surface style={styles.card} elevation={0}>
                    <Text style={styles.cardTitle}>Tracking Progress</Text>
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

                {/* Payment proof image (agent-uploaded) */}
                {(currentRequest.status === BurnRequestStatus.FIAT_SENT ||
                    currentRequest.status === BurnRequestStatus.CONFIRMED) &&
                    currentRequest.fiat_proof_url && (
                        <Surface style={styles.card} elevation={0}>
                            <Text style={styles.cardTitle}>Payment Proof</Text>
                            <Text style={styles.proofHint}>
                                The agent uploaded this as proof of payment. Verify it matches your receipt.
                            </Text>
                            <TouchableOpacity
                                onPress={() => Linking.openURL(currentRequest.fiat_proof_url!)}
                                activeOpacity={0.9}
                            >
                                <Image
                                    source={{ uri: currentRequest.fiat_proof_url }}
                                    style={styles.proofImage}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                            <Text style={styles.proofTapHint}>Tap image to view full size</Text>
                        </Surface>
                    )}

                {/* Info Card for status instructions */}
                {isFiatSent && (
                    <Surface style={[styles.messageCard, styles.warningMessage]} elevation={0}>
                        <Ionicons name="information-circle" size={24} color="#3B82F6" />
                        <View style={styles.messageContent}>
                            <Text style={[styles.messageTitle, { color: "#1E40AF" }]}>Payment Confirmation</Text>
                            <Text style={[styles.messageText, { color: "#1E3A8A" }]}>
                                The agent claims the payment has been sent. Please verify the amount in your bank account before confirming.
                            </Text>
                        </View>
                    </Surface>
                )}

                {isCompleted && (
                    <Surface style={[styles.messageCard, styles.successMessage]} elevation={0}>
                        <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                        <View style={styles.messageContent}>
                            <Text style={styles.successTitle}>Sell Request Completed</Text>
                            <Text style={styles.successText}>
                                Your {parseFloat(currentRequest.amount).toLocaleString()} {currentRequest.token_type} request has been completed and escrow has been released.
                            </Text>
                        </View>
                    </Surface>
                )}

                {/* Rate Experience (only for completed, unreviewed burn transactions) */}
                {currentRequest.status === BurnRequestStatus.CONFIRMED && canRate && (
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={async () => {
                            try {
                                const { data } = await apiClient.get("/transactions");
                                const transactions = data?.data?.transactions || data?.data || [];
                                const match = transactions.find(
                                    (tx: any) =>
                                        tx.agent_id === currentRequest.agent_id &&
                                        parseFloat(tx.amount) === parseFloat(currentRequest.amount) &&
                                        tx.token_type === currentRequest.token_type &&
                                        (tx.type || "").toLowerCase() === "burn"
                                );

                                router.replace({
                                    pathname: "/modals/buy-tokens/rate-agent",
                                    params: { transactionId: match?.id || currentRequest.id },
                                });
                            } catch {
                                router.replace({
                                    pathname: "/modals/buy-tokens/rate-agent",
                                    params: { transactionId: currentRequest.id },
                                });
                            }
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryBtnText}>Rate Experience</Text>
                        <Ionicons name="star" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {/* Back to Dashboard / Dismiss Button */}
                {isFailed ? (
                    <View style={styles.footerRow}>
                        <TouchableOpacity
                            style={styles.dismissBtn}
                            onPress={handleDismiss}
                        >
                            <Text style={styles.dismissBtnText}>Dismiss</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.primaryBtn, { flex: 1 }]}
                            onPress={() => router.replace("/(tabs)/sell-tokens")}
                        >
                            <Text style={styles.primaryBtnText}>Try Again</Text>
                            <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    !canRate && (
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={() => router.replace("/(tabs)")}
                        >
                            <Ionicons name="home-outline" size={20} color="#6B7280" />
                            <Text style={styles.secondaryBtnText}>Dashboard</Text>
                        </TouchableOpacity>
                    )
                )}

                <TouchableOpacity
                    style={styles.helpLink}
                    onPress={() => router.push("/(tabs)/profile")}
                >
                    <Text style={styles.helpLinkText}>Need help with this request?</Text>
                    <Text style={styles.supportText}>Contact Support</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Sticky Footer for current action */}
            {currentRequest.status === BurnRequestStatus.FIAT_SENT && (
                <View style={styles.stickyFooter}>
                    <TouchableOpacity
                        style={styles.disputeActionBtn}
                        onPress={handleOpenDispute}
                    >
                        <Text style={styles.disputeActionText}>I Didn&apos;t Receive It</Text>
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
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHandle} />
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleWrap}>
                                <View style={styles.modalIconWrap}>
                                    <Ionicons name="shield-outline" size={18} color="#F59E0B" />
                                </View>
                                <Text style={styles.modalTitle}>Open Dispute</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowDisputeModal(false)}>
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalDescription}>
                            Please explain why you didn&apos;t receive the payment. Our support team will investigate.
                        </Text>

                        <Text style={styles.inputLabel}>Reason *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., No payment received in my account"
                            placeholderTextColor="#98A2B3"
                            value={disputeReason}
                            onChangeText={setDisputeReason}
                            multiline
                            numberOfLines={2}
                        />

                        <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Provide any additional information..."
                            placeholderTextColor="#98A2B3"
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
    headerWrapper: {
        marginBottom: 8,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 125,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 10,
        paddingBottom: 0,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: "rgba(255, 255, 255, 0.9)",
        fontWeight: "500",
        lineHeight: 18,
    },
    backButton: {
        marginRight: 12,
        marginTop: 4,
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
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    summaryCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E6F4EA",
    },
    summaryEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        letterSpacing: -0.4,
    },
    summaryText: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 21,
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
        fontWeight: "700",
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    detail: {
        gap: 6,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    detailValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
    },
    tokenSymbol: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    detailText: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "600",
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginVertical: 16,
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
    messageCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
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
        fontSize: 13,
        lineHeight: 18,
    },
    warningMessage: {
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#DBEAFE",
    },
    successMessage: {
        backgroundColor: "#F0FDF4",
        borderWidth: 1,
        borderColor: "#D1FAE5",
    },
    errorMessage: {
        borderWidth: 1,
    },
    successTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#166534",
        marginBottom: 4,
    },
    successText: {
        fontSize: 13,
        color: "#166534",
        lineHeight: 18,
    },
    proofHint: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 12,
        lineHeight: 18,
    },
    proofImage: {
        width: "100%",
        height: 220,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
    },
    proofTapHint: {
        fontSize: 12,
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 8,
    },
    secondaryBtn: {
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
    secondaryBtnText: {
        color: "#4B5563",
        fontWeight: "700",
        fontSize: 15,
    },
    primaryBtn: {
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: "#00B14F",
        borderRadius: 999,
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 15,
    },
    footerRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 4,
        marginBottom: 8,
    },
    dismissBtn: {
        paddingHorizontal: 18,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    dismissBtnText: {
        color: "#4B5563",
        fontWeight: "700",
        fontSize: 15,
    },
    helpLink: {
        alignItems: "center",
        paddingVertical: 18,
    },
    helpLinkText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
        marginBottom: 2,
    },
    supportText: {
        fontSize: 14,
        color: "#00B14F",
        fontWeight: "700",
    },
    stickyFooter: {
        flexDirection: "row",
        padding: 20,
        paddingBottom: 24,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        gap: 12,
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
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
        marginBottom: 16,
    },
    modalTitleWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    modalIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFF7E8",
    },
    modalTitle: {
        fontSize: 20,
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
        backgroundColor: "#FBFCFD",
        borderWidth: 1,
        borderColor: "#E4E7EC",
        borderRadius: 16,
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
        height: 56,
        borderRadius: 16,
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
