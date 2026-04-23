// app/modals/swap-tokens/success.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSwapStore } from "@/stores";
import * as Haptics from "expo-haptics";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function SwapSuccessScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { fromToken, toToken, amount, estimatedReceive, swapFee, lastFee, lastReceivedAmount, reset } = useSwapStore();

    const amountNum = parseFloat(amount) || 0;
    const receivedNum = lastReceivedAmount ?? (parseFloat(estimatedReceive) || 0);
    const feeNum = lastFee ?? (swapFee ?? 0);

    useEffect(() => {
        // Haptic feedback on success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const handleDone = () => {
        reset();
        router.replace("/(tabs)");
    };

    const handleSwapAgain = () => {
        reset();
        router.replace("/modals/swap-tokens");
    };

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <ScrollView
                bounces={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                {/* Success Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.successCircle}>
                        <Ionicons name="checkmark" size={64} color="#FFFFFF" />
                    </View>
                </View>

                {/* Success Message */}
                <Text style={styles.title}>Swap Successful!</Text>
                <Text style={styles.subtitle}>
                    Your tokens have been swapped successfully
                </Text>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryEyebrow}>Completed</Text>
                    <Text style={styles.summaryTitle}>Your balances are updated</Text>
                    <Text style={styles.summaryText}>
                        The conversion is complete and the received token amount is now reflected in your wallet.
                    </Text>
                </View>

                {/* Swap Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.swapRow}>
                        <View style={styles.swapItem}>
                            <Text style={styles.swapLabel}>Swapped</Text>
                            <Text style={styles.swapValue}>
                                {amountNum.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{" "}
                                {fromToken}
                            </Text>
                        </View>

                        <Ionicons name="arrow-forward" size={24} color="#6B7280" />

                        <View style={styles.swapItem}>
                            <Text style={styles.swapLabel}>Received</Text>
                            <Text style={[styles.swapValue, styles.receiveValue]}>
                                {receivedNum.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{" "}
                                {toToken}
                            </Text>
                        </View>
                    </View>
                    {feeNum > 0 && (
                        <View style={[styles.swapRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" }]}>
                            <Text style={styles.swapLabel}>Platform fee</Text>
                            <Text style={styles.swapValue}>
                                {feeNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fromToken}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.infoText}>
                        Your wallet balances have been updated
                    </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.swapAgainBtn}
                        onPress={handleSwapAgain}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="swap-horizontal" size={20} color="#00B14F" />
                        <Text style={styles.swapAgainBtnText}>Swap Again</Text>
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
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 20,
        // paddingTop: 60,
        alignItems: "center",
    },
    iconContainer: {
        marginBottom: 32,
    },
    successCircle: {
        width: 100,
        height: 100,
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
        marginBottom: 24,
        textAlign: "center",
    },
    summaryCard: {
        width: "100%",
        backgroundColor: "#F7FFF9",
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
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
    detailsCard: {
        width: "100%",
        backgroundColor: "#FBFCFD",
        padding: 24,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    swapRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    swapItem: {
        flex: 1,
        alignItems: "center",
    },
    swapLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 8,
    },
    swapValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },
    receiveValue: {
        color: "#00B14F",
    },
    infoCard: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#EFF6FF",
        padding: 18,
        borderRadius: 18,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#1E40AF",
    },
    buttonContainer: {
        width: "100%",
        gap: 12,
        marginTop: "auto",
    },
    swapAgainBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#F0FDF4",
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "#00B14F",
    },
    swapAgainBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#00B14F",
    },
    doneBtn: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    doneBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
