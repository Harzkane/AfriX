import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AgentReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const theme = {
    bg: isDark ? "#090B14" : "#F5F4FC",
    card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
    cardAlt: isDark ? "rgba(255, 255, 255, 0.05)" : "#F9F8FF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E1638" : "#EDE9FE",
    accent: "#7C3AED",
    accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
    green: "#00B14F",
    greenLight: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)",
    inputBg: isDark ? "rgba(255,255,255,0.06)" : "#F8F7FF",
    danger: "#EF4444",
  };

  useEffect(() => {
    if (user?.id) {
      const agentId = useAgentStore.getState().stats ? useAgentStore.getState().dashboardData?.agent?.id : null;
      if (agentId) {
        fetchReviews(agentId);
      } else {
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

  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "5.0";

  const renderItem = ({ item }: { item: AgentReview }) => {
    const isFiveStar = item.rating === 5;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={[
              styles.avatarContainer,
              { borderColor: isFiveStar ? theme.green : theme.border }
            ]}>
              <View style={[styles.avatar, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="person" size={16} color={theme.accent} />
              </View>
            </View>
            <View style={styles.userTextCol}>
              <Text style={[styles.reviewEyebrow, { color: theme.muted }]}>Customer Review</Text>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                {item.user?.full_name || "Unknown User"}
              </Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= item.rating ? "star" : "star-outline"}
                    size={12}
                    color="#F59E0B"
                  />
                ))}
              </View>
            </View>
          </View>
          <Text style={[styles.date, { color: theme.muted }]}>{formatDate(item.created_at)}</Text>
        </View>

        {item.review_text ? (
          <Text style={[styles.reviewText, { color: theme.text }]}>{item.review_text}</Text>
        ) : null}

        {/* Transaction details row pill */}
        <View style={styles.metaRow}>
          <View style={[styles.transactionInfo, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="swap-horizontal" size={12} color={theme.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.transactionText, { color: theme.text }]}>
              {item.transaction?.type ? item.transaction.type.toUpperCase() : "TRADE"} • {item.transaction?.amount} {item.transaction?.token_type}
            </Text>
          </View>
        </View>

        {item.agent_response ? (
          <View style={styles.responseWrapper}>
            <View style={[styles.threadLine, { backgroundColor: theme.border }]} />
            <View style={[styles.responseContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <View style={styles.responseHeader}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.green} style={{ marginRight: 6 }} />
                <Text style={[styles.responseLabel, { color: theme.text }]}>Your Response</Text>
                <Text style={[styles.responseDate, { color: theme.muted }]}>
                  {item.agent_response_at ? formatDate(item.agent_response_at) : ""}
                </Text>
              </View>
              <Text style={[styles.responseText, { color: theme.muted }]}>{item.agent_response}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.replyButton, { backgroundColor: theme.accentLight, borderColor: theme.border }]}
            onPress={() => handleReply(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-undo-outline" size={14} color={theme.accent} />
            <Text style={[styles.replyButtonText, { color: theme.accent }]}>Reply to Review</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Flat Header */}
      <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBackBtn, { backgroundColor: theme.accentLight }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={theme.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Reviews</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <LinearGradient
            colors={isDark ? ["rgba(124, 58, 237, 0.15)", "rgba(18, 14, 36, 0.8)"] : ["rgba(124, 58, 237, 0.05)", "#FFFFFF"]}
            style={[styles.summaryCard, { borderColor: theme.border }]}
          >
            <View style={styles.summaryTop}>
              <View>
                <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>Agent Reputation</Text>
                <Text style={[styles.summaryTitle, { color: theme.text }]}>Customer Reviews</Text>
              </View>
              {totalReviews > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.green + "15", borderColor: theme.green + "30" }]}>
                  <Ionicons name="shield-checkmark" size={14} color={theme.green} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: theme.green }]}>Active Seller</Text>
                </View>
              )}
            </View>

            <View style={[styles.statsDivider, { backgroundColor: theme.border }]} />

            {/* Dashboard stats row inside header */}
            <View style={styles.reputationMetrics}>
              <View style={styles.metricBlock}>
                <Text style={[styles.metricValue, { color: theme.text }]}>{averageRating}</Text>
                <View style={styles.metricLabelRow}>
                  <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 2 }} />
                  <Text style={[styles.metricLabel, { color: theme.muted }]}>Average Score</Text>
                </View>
              </View>
              <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />
              <View style={styles.metricBlock}>
                <Text style={[styles.metricValue, { color: theme.text }]}>{totalReviews}</Text>
                <Text style={[styles.metricLabel, { color: theme.muted }]}>Total Reviews</Text>
              </View>
              <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />
              <View style={styles.metricBlock}>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {totalReviews > 0
                    ? `${Math.round((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100)}%`
                    : "100%"}
                </Text>
                <Text style={[styles.metricLabel, { color: theme.muted }]}>Positive Ratio</Text>
              </View>
            </View>
          </LinearGradient>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              const id = useAgentStore.getState().dashboardData?.agent?.id;
              if (id) fetchReviews(id);
            }}
            tintColor={theme.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <LinearGradient colors={["#EDE9FE", "#DDD6FE"]} style={styles.emptyIconCircle}>
              <Ionicons name="star-outline" size={28} color={theme.accent} />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: theme.text }]}>No reviews yet</Text>
            <Text style={[styles.emptySub, { color: theme.muted }]}>
              Customer ratings and feedback will appear here after your completed transactions.
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
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Reply to Review</Text>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
              Replying to {selectedReview?.user?.full_name}
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              placeholder="Write your response..."
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={4}
              value={replyText}
              onChangeText={setReplyText}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.accent, shadowColor: theme.accent },
                (!replyText.trim() || submitting) && styles.disabledButton
              ]}
              onPress={submitReply}
              disabled={!replyText.trim() || submitting}
              activeOpacity={0.85}
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
  },
  headerContainer: {
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statsDivider: {
    height: 1,
    marginVertical: 16,
  },
  reputationMetrics: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  metricBlock: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  verticalDivider: {
    width: 1,
    height: 32,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    flex: 1,
    marginRight: 10,
  },
  avatarContainer: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 2,
    marginRight: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  userTextCol: {
    flex: 1,
  },
  reviewEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  ratingContainer: {
    flexDirection: "row",
    marginTop: 3,
    gap: 2,
  },
  date: {
    fontSize: 11,
    fontWeight: "600",
  },
  reviewText: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  transactionInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  transactionText: {
    fontSize: 11,
    fontWeight: "700",
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: "800",
  },
  responseWrapper: {
    flexDirection: "row",
    marginTop: 12,
    paddingLeft: 8,
  },
  threadLine: {
    width: 2,
    marginRight: 12,
    borderRadius: 99,
  },
  responseContainer: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  responseDate: {
    fontSize: 11,
    fontWeight: "500",
  },
  responseText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    fontWeight: "500",
    minHeight: 100,
    marginBottom: 18,
  },
  submitButton: {
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
});
