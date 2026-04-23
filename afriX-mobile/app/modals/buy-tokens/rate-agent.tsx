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
} from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore, useWalletStore } from "@/stores";

export default function RateAgentScreen() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const router = useRouter();
  const { submitReview, loading } = useAgentStore();
  const { fetchWallets } = useWalletStore();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const handleSkip = async () => {
    await fetchWallets();
    router.replace("/(tabs)");
  };

  const handleSubmit = async () => {
    if (!transactionId) {
      Alert.alert("Unavailable", "This transaction can no longer be rated.");
      return;
    }

    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating");
      return;
    }

    try {
      await submitReview({
        transaction_id: transactionId,
        rating,
        review_text: reviewText,
      });

      Alert.alert("Thank You!", "Your review has been submitted.", [
        {
          text: "OK",
          onPress: handleSkip,
        },
      ]);
    } catch (error: any) {
      const message =
        error?.message || "Failed to submit review. Please try again.";
      const normalized = message.toLowerCase();

      if (normalized.includes("already reviewed this transaction")) {
        Alert.alert(
          "Already Rated",
          "You've already submitted a review for this transaction.",
          [
            {
              text: "OK",
              onPress: handleSkip,
            },
          ]
        );
      } else {
        Alert.alert("Error", message);
      }
    }
  };

  const ratingMeta = getRatingMeta(rating);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? -8 : 12}
    >
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
              <Text style={styles.headerTitle}>Rate Agent</Text>
              <View style={styles.headerSpacer} />
            </View>
          </SafeAreaView>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#F7FFF9", "#FFFFFF"]}
            style={styles.summaryCard}
          >
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={["#00B14F", "#059669"]}
                style={styles.heroIcon}
              >
                <Ionicons name="checkmark" size={34} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <Text style={styles.summaryEyebrow}>Transaction Complete</Text>
            <Text style={styles.summaryTitle}>How was your agent experience?</Text>
            <Text style={styles.summaryText}>
              Your feedback helps other users choose better agents and helps us
              maintain a more trusted marketplace.
            </Text>

            <View style={styles.highlightRow}>
              <View style={styles.highlightPill}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
                <Text style={styles.highlightText}>Build trust</Text>
              </View>
              <View style={styles.highlightPill}>
                <Ionicons name="people-outline" size={16} color="#2563EB" />
                <Text style={styles.highlightText}>Help other users</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Rating</Text>
            <Text style={styles.cardSubtitle}>
              Tap a star to score the agent based on speed, communication, and
              overall reliability.
            </Text>

            <View style={styles.ratingCard}>
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
                        active && styles.starButtonActive,
                      ]}
                    >
                      <Ionicons
                        name={active ? "star" : "star-outline"}
                        size={28}
                        color={active ? "#F59E0B" : "#9CA3AF"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.ratingLabel,
                  rating > 0 && { color: ratingMeta.color },
                ]}
              >
                {ratingMeta.label}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Leave a Comment</Text>
            <Text style={styles.cardSubtitle}>
              Share anything helpful about the transaction. This is optional.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Tell us more about your experience..."
              placeholderTextColor="#9CA3AF"
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
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#6B7280"
              />
              <Text style={styles.tipText}>
                Keep feedback specific and respectful so it stays useful for the
                community.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="star" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={styles.skipBtnText}>Skip and go to dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const getRatingMeta = (rating: number) => {
  if (rating === 5) return { label: "Excellent", color: "#00B14F" };
  if (rating === 4) return { label: "Great", color: "#16A34A" };
  if (rating === 3) return { label: "Good", color: "#2563EB" };
  if (rating === 2) return { label: "Fair", color: "#D97706" };
  if (rating === 1) return { label: "Poor", color: "#DC2626" };
  return { label: "Tap to rate", color: "#6B7280" };
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
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
    // height: 120,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
    // marginTop: 10,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 40,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    marginTop: -34,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6F4EA",
    alignItems: "center",
  },
  heroIconWrap: {
    marginBottom: 16,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
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
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  highlightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginTop: 16,
  },
  highlightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  highlightText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#344054",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAF0F5",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    marginBottom: 16,
  },
  ratingCard: {
    backgroundColor: "#FBFCFD",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EEF2F7",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  starButtonActive: {
    backgroundColor: "#FFF7E8",
    borderColor: "#FCD34D",
  },
  ratingLabel: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: "700",
    color: "#6B7280",
  },
  input: {
    backgroundColor: "#FBFCFD",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: "#111827",
    minHeight: 140,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
  },
  actions: {
    marginTop: 4,
    gap: 14,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00B14F",
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitBtnDisabled: {
    backgroundColor: "#86EFAC",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
});
