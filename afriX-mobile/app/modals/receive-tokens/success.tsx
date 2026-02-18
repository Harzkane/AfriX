// app/modals/receive-tokens/success.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { formatDate } from "@/utils/format";

export default function ReceiveSuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // params: amount, tokenType, fromEmail, senderName, country, city, timestamp
    const { amount, tokenType, fromEmail, senderName, country, city, timestamp } = params;

    const formattedDate = timestamp
        ? formatDate(timestamp as string, true)
        : "N/A";

    const location = [city, country].filter(Boolean).join(", ") || "Unknown";

    useEffect(() => {
        // Haptic feedback on success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const handleDone = () => {
        router.replace("/(tabs)");
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={64} color="#FFFFFF" />
                    </View>
                </View>

                {/* Success Message */}
                <Text style={styles.title}>Tokens Received!</Text>
                <Text style={styles.subtitle}>
                    You have successfully received tokens
                </Text>

                {/* Transfer Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Received from</Text>
                        <Text style={styles.detailValue}>{senderName || fromEmail || "User"}</Text>
                    </View>

                    {fromEmail && senderName && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Email</Text>
                            <Text style={styles.detailValue}>{fromEmail}</Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Location</Text>
                        <Text style={styles.detailValue}>{location}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date & Time</Text>
                        <Text style={styles.detailValue}>{formattedDate}</Text>
                    </View>

                    <View style={[styles.detailRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 }]}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.detailValueAmount}>
                            {parseFloat(amount as string || "0").toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={handleDone}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        alignItems: "center",
    },
    iconContainer: {
        marginBottom: 32,
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
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
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#9CA3AF",
        marginBottom: 40,
        textAlign: "center",
    },
    detailsCard: {
        width: "100%",
        backgroundColor: "#F9FAFB",
        padding: 24,
        borderRadius: 16,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        textAlign: "right",
    },
    detailValueAmount: {
        fontSize: 20,
        fontWeight: "700",
        color: "#00B14F",
    },
    buttonContainer: {
        width: "100%",
    },
    doneBtn: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    doneBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
