// app/modals/swap-tokens/confirm.tsx
import React, { useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSwapStore, useWalletStore } from "@/stores";

export default function ConfirmSwapScreen() {
    const router = useRouter();

    const {
        fromToken,
        toToken,
        amount,
        estimatedReceive,
        exchangeRate,
        loading,
        error,
        executeSwap,
    } = useSwapStore();

    const { fetchWallets } = useWalletStore();

    const amountNum = parseFloat(amount) || 0;
    const estimatedNum = parseFloat(estimatedReceive) || 0;

    const handleConfirm = async () => {
        try {
            await executeSwap();

            // Refresh wallets to show updated balances
            await fetchWallets();

            // Navigate to success screen
            router.replace("/modals/swap-tokens/success");
        } catch (error: any) {
            Alert.alert(
                "Swap Failed",
                error.response?.data?.message || error.message || "Please try again",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="swap-horizontal" size={48} color="#00B14F" />
                </View>
                <Text style={styles.title}>Confirm Swap</Text>
                <Text style={styles.subtitle}>
                    Please review the swap details before confirming
                </Text>
            </View>

            {/* Swap Details */}
            <View style={styles.swapFlow}>
                {/* From Token */}
                <View style={styles.tokenCard}>
                    <Text style={styles.tokenLabel}>You send</Text>
                    <Text style={styles.tokenAmount}>
                        {amountNum.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}{" "}
                        {fromToken}
                    </Text>
                </View>

                {/* Arrow */}
                <View style={styles.arrowContainer}>
                    <Ionicons name="arrow-down" size={24} color="#00B14F" />
                </View>

                {/* To Token */}
                <View style={styles.tokenCard}>
                    <Text style={styles.tokenLabel}>You receive</Text>
                    <Text style={[styles.tokenAmount, styles.receiveAmount]}>
                        {estimatedNum.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}{" "}
                        {toToken}
                    </Text>
                </View>
            </View>

            {/* Exchange Rate */}
            <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Exchange Rate</Text>
                    <Text style={styles.detailValue}>
                        1 {fromToken} = {exchangeRate.toFixed(4)} {toToken}
                    </Text>
                </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <View style={styles.infoText}>
                    <Text style={styles.infoTitle}>Instant Swap</Text>
                    <Text style={styles.infoDesc}>
                        Your swap will be processed instantly. The exchange rate is locked for this transaction.
                    </Text>
                </View>
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => router.back()}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    <Text style={styles.cancelBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
                    onPress={handleConfirm}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.confirmBtnText}>Confirm Swap</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#9CA3AF",
        textAlign: "center",
    },
    swapFlow: {
        marginBottom: 24,
    },
    tokenCard: {
        backgroundColor: "#F9FAFB",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    tokenLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 8,
    },
    tokenAmount: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
    },
    receiveAmount: {
        color: "#00B14F",
    },
    arrowContainer: {
        alignItems: "center",
        marginVertical: 12,
    },
    detailsCard: {
        backgroundColor: "#EFF6FF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1E40AF",
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1E40AF",
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: "#EFF6FF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    infoText: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 18,
    },
    errorCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#FEF2F2",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FEE2E2",
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: "#DC2626",
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B7280",
    },
    confirmBtn: {
        flex: 2,
        backgroundColor: "#00B14F",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    confirmBtnDisabled: {
        backgroundColor: "#9CA3AF",
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    bottomSpacer: {
        height: 40,
    },
});
