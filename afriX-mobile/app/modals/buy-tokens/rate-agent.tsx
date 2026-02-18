// app/modals/buy-tokens/rate-agent.tsx
import React, { useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAgentStore, useWalletStore } from "@/stores";

export default function RateAgentScreen() {
    const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
    const router = useRouter();
    const { submitReview, loading } = useAgentStore();
    const { fetchWallets } = useWalletStore();
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState("");

    const handleSkip = async () => {
        await fetchWallets();
        router.replace("/(tabs)");
    };

    const handleSubmit = async () => {
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

            // If the server says this transaction is already reviewed,
            // treat it as a non-fatal case: inform the user and send them home.
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

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerSpacer}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                </View>

                <View style={styles.iconContainer}>
                    <View style={styles.successIcon}>
                        <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                    </View>
                </View>

                <Text style={styles.title}>Transaction Complete!</Text>
                <Text style={styles.subtitle}>
                    How was your experience with the agent?
                </Text>

                {/* Star Rating */}
                <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={40}
                                color="#FFB800"
                                style={styles.star}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.ratingLabel}>
                    {rating === 0
                        ? "Tap to rate"
                        : rating === 5
                            ? "Excellent!"
                            : rating >= 4
                                ? "Great"
                                : rating >= 3
                                    ? "Good"
                                    : rating >= 2
                                        ? "Fair"
                                        : "Poor"}
                </Text>

                {/* Review Text */}
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Leave a comment (optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Tell us more about your experience..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={4}
                        value={reviewText}
                        onChangeText={setReviewText}
                        textAlignVertical="top"
                    />
                </View>

                {/* Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Review</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={handleSkip}
                        disabled={loading}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.skipBtnText}>Skip & Go to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        padding: 24,
        alignItems: "center",
    },
    headerSpacer: {
        height: 60,
        alignSelf: "stretch",
        justifyContent: "flex-start",
        alignItems: "flex-start",
    },
    backButton: {
        padding: 4,
    },
    iconContainer: {
        marginBottom: 24,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#00B14F",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 22,
    },
    ratingContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    star: {
        padding: 4,
    },
    ratingLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFB800",
        marginBottom: 40,
    },
    inputContainer: {
        width: "100%",
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: "#111827",
        minHeight: 120,
    },
    actions: {
        width: "100%",
        gap: 16,
    },
    submitBtn: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    submitBtnDisabled: {
        backgroundColor: "#A7F3D0",
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    skipBtn: {
        paddingVertical: 12,
        alignItems: "center",
    },
    skipBtnText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#6B7280",
    },
});
