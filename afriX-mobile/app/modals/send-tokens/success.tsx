// app/modals/send-tokens/success.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransferStore } from "@/stores";
import * as Haptics from "expo-haptics";

export default function TransferSuccessScreen() {
    const router = useRouter();
    const { recipientEmail, tokenType, amount, fee, reset } = useTransferStore();

    const amountNum = parseFloat(amount) || 0;
    const feeNum = fee || 0;
    const recipientReceived = amountNum - feeNum;

    useEffect(() => {
        // Haptic feedback on success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const handleDone = () => {
        reset();
        router.replace("/(tabs)");
    };

    const handleSendAgain = () => {
        reset();
        router.replace("/modals/send-tokens");
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Success Icon with Animation */}
                <View style={styles.iconContainer}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={64} color="#FFFFFF" />
                    </View>
                </View>

                {/* Success Message */}
                <Text style={styles.title}>Transfer Successful!</Text>
                <Text style={styles.subtitle}>
                    Your tokens have been sent successfully
                </Text>

                {/* Transfer Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Sent to</Text>
                        <Text style={styles.detailValue}>{recipientEmail}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.detailValueAmount}>
                            {amountNum.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType}
                        </Text>
                    </View>
                    {feeNum > 0 && (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Platform fee</Text>
                                <Text style={styles.detailValue}>
                                    {feeNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tokenType}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Recipient received</Text>
                                <Text style={styles.detailValue}>
                                    {recipientReceived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tokenType}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        The recipient will receive a notification about this transfer
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.sendAgainBtn}
                        onPress={handleSendAgain}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="send-outline" size={20} color="#00B14F" />
                        <Text style={styles.sendAgainBtnText}>Send Again</Text>
                    </TouchableOpacity>

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
        marginBottom: 24,
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
    infoCard: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#EFF6FF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#1E40AF",
        lineHeight: 18,
    },
    buttonContainer: {
        width: "100%",
        gap: 12,
    },
    sendAgainBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#F0FDF4",
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#00B14F",
    },
    sendAgainBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#00B14F",
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
