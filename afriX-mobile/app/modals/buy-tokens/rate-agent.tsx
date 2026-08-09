import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore, useWalletStore } from "@/stores";
import { useTranslation } from "react-i18next";

export default function RateAgentScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { submitReview, loading } = useAgentStore();
  const { fetchWallets } = useWalletStore();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    surface: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    divider: isDark ? "#1E2A3A" : "#EEF2F7",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.25)" : "#FDE68A",
  };

  const handleSkip = async () => {
    await fetchWallets();
    router.replace("/(tabs)");
  };

  const handleSubmit = async () => {
    if (!transactionId) {
      Alert.alert(
        t("buy_tokens.rate_agent.err_unavailable", "Unavailable"),
        t("buy_tokens.rate_agent.err_unavailable", "This transaction can no longer be rated.")
      );
      return;
    }

    if (rating === 0) {
      Alert.alert(
        t("buy_tokens.rate_agent.err_rating_required", "Rating Required"),
        t("buy_tokens.rate_agent.err_rating_required", "Please select a star rating")
      );
      return;
    }

    try {
      await submitReview({
        transaction_id: transactionId,
        rating,
        review_text: reviewText,
      });

      Alert.alert(
        t("buy_tokens.rate_agent.alert_success_title", "Thank You!"),
        t("buy_tokens.rate_agent.alert_success_desc", "Your review has been submitted."),
        [
          {
            text: t("common.ok", "OK"),
            onPress: handleSkip,
          },
        ]
      );
    } catch (error: any) {
      const message =
        error?.message || t("common.failed", "Failed to submit review. Please try again.");
      const normalized = message.toLowerCase();

      if (normalized.includes("already reviewed this transaction")) {
        Alert.alert(
          t("buy_tokens.rate_agent.alert_already_rated_title", "Already Rated"),
          t("buy_tokens.rate_agent.alert_already_rated_desc", "You've already submitted a review for this transaction."),
          [
            {
              text: t("common.ok", "OK"),
              onPress: handleSkip,
            },
          ]
        );
      } else {
        Alert.alert(t("common.error", "Error"), message);
      }
    }
  };

  const ratingMeta = getRatingMeta(rating, t);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? -8 : 12}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Subtle Background Glow */}
        <LinearGradient
          colors={
            isDark
              ? ["rgba(0,177,79,0.18)", "rgba(7,17,26,0)"]
              : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]
          }
          style={styles.backgroundGlow}
          pointerEvents="none"
        />

        {/* Clean Modern Header */}
        <SafeAreaView
          edges={["top"]}
          style={[
            styles.headerWrapper,
            { backgroundColor: theme.background, borderBottomColor: theme.border },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.headerButton,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t("buy_tokens.rate_agent.header_title", "Rate Agent")}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                {t("buy_tokens.rate_agent.header_subtitle", "Share feedback on your transaction experience.")}
              </Text>
            </View>

            <TouchableOpacity onPress={handleSkip} activeOpacity={0.75}>
              <Text style={[styles.headerSkipText, { color: theme.muted }]}>
                {t("common.skip", "Skip")}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Hero Card */}
          <LinearGradient
            colors={isDark ? ["#0E1726", "#111E2E"] : ["#FFFFFF", "#F4FBF7"]}
            style={[
              styles.heroCard,
              { borderColor: theme.border, shadowColor: isDark ? "#000" : "#0F172A" },
            ]}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <LinearGradient
                  colors={["#00B14F", "#059669"]}
                  style={styles.heroIcon}
                >
                  <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <View style={styles.heroCopy}>
                <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>
                  {t("buy_tokens.rate_agent.summary_eyebrow", "Transaction Complete")}
                </Text>
                <Text style={[styles.summaryTitle, { color: theme.text }]}>
                  {t("buy_tokens.rate_agent.summary_title", "How was your agent experience?")}
                </Text>
              </View>
            </View>

            <Text style={[styles.summaryText, { color: theme.muted }]}>
              {t(
                "buy_tokens.rate_agent.summary_text",
                "Your feedback helps other users choose reliable agents and maintains a trusted marketplace."
              )}
            </Text>

            <View style={styles.highlightRow}>
              <View style={[styles.highlightPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="shield-checkmark-outline" size={16} color={theme.accent} />
                <Text style={[styles.highlightText, { color: theme.text }]}>
                  {t("buy_tokens.rate_agent.highlight_trust", "Build trust")}
                </Text>
              </View>
              <View style={[styles.highlightPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="people-outline" size={16} color="#3B82F6" />
                <Text style={[styles.highlightText, { color: theme.text }]}>
                  {t("buy_tokens.rate_agent.highlight_users", "Help community")}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Rating Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {t("buy_tokens.rate_agent.rating_title", "Your Rating")}
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
              {t(
                "buy_tokens.rate_agent.rating_subtitle",
                "Tap a star to score the agent based on speed, communication, and reliability."
              )}
            </Text>

            <View style={[styles.ratingCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= rating;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      activeOpacity={0.8}
                      style={[
                        styles.starButton,
                        { backgroundColor: theme.card, borderColor: active ? theme.amberBorder : theme.border },
                        active && { backgroundColor: theme.amberSoft },
                      ]}
                    >
                      <Ionicons
                        name={active ? "star" : "star-outline"}
                        size={28}
                        color={active ? theme.amber : theme.muted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.ratingLabel,
                  { color: rating > 0 ? ratingMeta.color : theme.muted },
                ]}
              >
                {ratingMeta.label}
              </Text>
            </View>
          </View>

          {/* Comment Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {t("buy_tokens.rate_agent.comment_title", "Leave a Comment")}
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
              {t("buy_tokens.rate_agent.comment_subtitle", "Share details about the transaction. This is optional.")}
            </Text>

            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
              ]}
              placeholder={t("buy_tokens.rate_agent.comment_placeholder", "Tell us more about your experience...")}
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={5}
              value={reviewText}
              onChangeText={setReviewText}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 180);
              }}
              textAlignVertical="top"
            />

            <View style={styles.tipRow}>
              <Ionicons name="information-circle-outline" size={16} color={theme.muted} />
              <Text style={[styles.tipText, { color: theme.muted }]}>
                {t(
                  "buy_tokens.rate_agent.tip_text",
                  "Keep feedback specific and respectful so it stays useful for the community."
                )}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: theme.accent },
                (loading || rating === 0) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || rating === 0}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="star" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>
                    {t("buy_tokens.rate_agent.btn_submit", "Submit Review")}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={[styles.skipBtnText, { color: theme.muted }]}>
                {t("buy_tokens.rate_agent.btn_skip", "Skip and go to dashboard")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const getRatingMeta = (rating: number, t: any) => {
  if (rating === 5) return { label: t("buy_tokens.rate_agent.rating_excellent", "Excellent"), color: "#00B14F" };
  if (rating === 4) return { label: t("buy_tokens.rate_agent.rating_great", "Great"), color: "#16A34A" };
  if (rating === 3) return { label: t("buy_tokens.rate_agent.rating_good", "Good"), color: "#2563EB" };
  if (rating === 2) return { label: t("buy_tokens.rate_agent.rating_fair", "Fair"), color: "#D97706" };
  if (rating === 1) return { label: t("buy_tokens.rate_agent.rating_poor", "Poor"), color: "#DC2626" };
  return { label: t("buy_tokens.rate_agent.rating_tap", "Tap to rate"), color: "#94A3B8" };
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  backgroundGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  headerWrapper: {
    zIndex: 10,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerCopy: {
    flex: 1,
    paddingTop: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  headerSkipText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 36,
    gap: 16,
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroIconWrap: {
    flexShrink: 0,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    marginTop: 12,
  },
  highlightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  highlightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
    marginBottom: 16,
  },
  ratingCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  starButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  ratingLabel: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "800",
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    fontWeight: "500",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 18,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
