import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { AgentReview } from "@/stores/types/agent.types";
import { formatDate } from "@/utils/format";
import { useAuthStore } from "@/stores/slices/authSlice";

export default function Reviews() {
    const router = useRouter();
    const { reviews, fetchReviews, respondToReview, loading } = useAgentStore();
    const { user } = useAuthStore();

    const [replyModalVisible, setReplyModalVisible] = useState(false);
    const [selectedReview, setSelectedReview] = useState<AgentReview | null>(null);
    const [replyText, setReplyText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user?.id) {
            // We need the agent ID. Assuming user.id maps to agent.user_id, 
            // but fetchReviews expects agentId. 
            // Ideally we should have agentId in store or user object.
            // For now, let's try to fetch using the profile endpoint first if needed, 
            // or assume the backend handles it. 
            // Actually, the route is /:agent_id/reviews. 
            // We need to get the agent ID from the store if available.
            const agentId = useAgentStore.getState().stats ? useAgentStore.getState().dashboardData?.agent?.id : null;
            if (agentId) {
                fetchReviews(agentId);
            } else {
                // If not loaded, try to load dashboard first
                useAgentStore.getState().fetchDashboard().then(() => {
                    const id = useAgentStore.getState().dashboardData?.agent?.id;
                    if (id) fetchReviews(id);
                });
            }
        }
    }, [user]);

    const handleReply = (review: AgentReview) => {
        setSelectedReview(review);
        setReplyText(review.agent_response || "");
        setReplyModalVisible(true);
    };

    const submitReply = async () => {
        if (!selectedReview || !replyText.trim()) return;

        setSubmitting(true);
        try {
            await respondToReview(selectedReview.id, replyText);
            setReplyModalVisible(false);
            Alert.alert("Success", "Response posted successfully");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to post response");
        } finally {
            setSubmitting(false);
        }
    };

    const renderItem = ({ item }: { item: AgentReview }) => (
        <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={18} color="#7C3AED" />
                    </View>
                    <View>
                        <Text style={styles.reviewEyebrow}>Customer Review</Text>
                        <Text style={styles.userName}>{item.user?.full_name || "Unknown User"}</Text>
                        <View style={styles.ratingContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={star <= item.rating ? "star" : "star-outline"}
                                    size={14}
                                    color="#F59E0B"
                                />
                            ))}
                        </View>
                    </View>
                </View>
                <Text style={styles.date}>{formatDate(item.created_at)}</Text>
            </View>

            {item.review_text && (
                <Text style={styles.reviewText}>{item.review_text}</Text>
            )}

            <View style={styles.transactionInfo}>
                <Text style={styles.transactionLabel}>Transaction</Text>
                <Text style={styles.transactionText}>
                    {item.transaction?.type} • {item.transaction?.amount} {item.transaction?.token_type}
                </Text>
            </View>

            {item.agent_response ? (
                <View style={styles.responseContainer}>
                    <Text style={styles.responseLabel}>Your Response:</Text>
                    <Text style={styles.responseText}>{item.agent_response}</Text>
                    <Text style={styles.responseDate}>
                        {item.agent_response_at ? formatDate(item.agent_response_at) : ""}
                    </Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.replyButton}
                    onPress={() => handleReply(item)}
                >
                    <Ionicons name="arrow-undo-outline" size={16} color="#7C3AED" />
                    <Text style={styles.replyButtonText}>Reply to Review</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Reviews</Text>
                        <View style={{ width: 24 }} />
                    </View>
                </SafeAreaView>
            </View>

            <FlatList
                data={reviews}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <LinearGradient
                        colors={["#F7FFF9", "#FFFFFF"]}
                        style={styles.summaryCard}
                    >
                        <Text style={styles.summaryEyebrow}>Agent Reputation</Text>
                        <Text style={styles.summaryTitle}>Customer Reviews</Text>
                        <Text style={styles.summaryText}>
                            Read customer feedback, monitor satisfaction, and reply to reviews that need your voice.
                        </Text>
                    </LinearGradient>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={() => {
                            const id = useAgentStore.getState().dashboardData?.agent?.id;
                            if (id) fetchReviews(id);
                        }}
                        tintColor="#7C3AED"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="star-outline" size={28} color="#00B14F" />
                        </View>
                        <Text style={styles.emptyText}>No reviews yet</Text>
                        <Text style={styles.emptySubtext}>
                            Customer ratings and feedback will appear here after completed transactions.
                        </Text>
                    </View>
                }
            />

            {/* Reply Modal */}
            <Modal
                visible={replyModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setReplyModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reply to Review</Text>
                            <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Replying to {selectedReview?.user?.full_name}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Write your response..."
                            multiline
                            numberOfLines={4}
                            value={replyText}
                            onChangeText={setReplyText}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, (!replyText.trim() || submitting) && styles.disabledButton]}
                            onPress={submitReply}
                            disabled={!replyText.trim() || submitting}
                        >
                            <Text style={styles.submitButtonText}>
                                {submitting ? "Posting..." : "Post Response"}
                            </Text>
                        </TouchableOpacity>
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
    headerWrapper: {
        // marginBottom: 20,
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
        marginTop: 20,
    },
    backButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    summaryCard: {
        borderRadius: 22,
        padding: 18,
        marginTop: 6,
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
    },
    card: {
        backgroundColor: "white",
        borderRadius: 22,
        padding: 18,
        marginBottom: 12,
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
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F5F3FF",
        borderWidth: 1,
        borderColor: "#E9DDFD",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    reviewEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    ratingContainer: {
        flexDirection: "row",
        marginTop: 2,
    },
    date: {
        fontSize: 12,
        color: "#6B7280",
    },
    reviewText: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
        marginBottom: 12,
    },
    transactionInfo: {
        backgroundColor: "#FBFCFD",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        marginBottom: 12,
    },
    transactionLabel: {
        fontSize: 11,
        fontWeight: "800",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 4,
    },
    transactionText: {
        fontSize: 13,
        color: "#4B5563",
        fontWeight: "600",
    },
    replyButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: "#F5F3FF",
        borderWidth: 1,
        borderColor: "#E9DDFD",
    },
    replyButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#7C3AED",
        marginLeft: 6,
    },
    responseContainer: {
        backgroundColor: "#F0FDF4",
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: "#00B14F",
    },
    responseLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#00B14F",
        marginBottom: 4,
    },
    responseText: {
        fontSize: 14,
        color: "#374151",
    },
    responseDate: {
        fontSize: 10,
        color: "#6B7280",
        marginTop: 4,
        textAlign: "right",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
    },
    emptyIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 15,
        color: "#6B7280",
        fontWeight: "700",
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: "#9CA3AF",
        fontWeight: "500",
        textAlign: "center",
        maxWidth: 260,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        minHeight: 300,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 14,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        marginBottom: 16,
        backgroundColor: "#F9FAFB",
    },
    submitButton: {
        backgroundColor: "#7C3AED",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    disabledButton: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});
