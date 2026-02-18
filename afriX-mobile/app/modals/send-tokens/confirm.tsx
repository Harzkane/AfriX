// app/modals/send-tokens/confirm.tsx
import React, { useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useTransferStore, useWalletStore } from "@/stores";

export default function ConfirmTransferScreen() {
    const router = useRouter();
    const [authenticating, setAuthenticating] = useState(false);

    const {
        recipientEmail,
        tokenType,
        amount,
        note,
        fee,
        loading,
        error,
        executeTransfer,
    } = useTransferStore();

    const { fetchWallets } = useWalletStore();

    const amountNum = parseFloat(amount) || 0;
    const total = amountNum + fee;

    const handleBiometricAuth = async () => {
        try {
            setAuthenticating(true);

            // Check if biometric is available
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                // Fallback to direct confirmation
                handleConfirm();
                return;
            }

            // Authenticate with biometric
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Confirm transfer",
                fallbackLabel: "Use Passcode",
                cancelLabel: "Cancel",
                disableDeviceFallback: false, // Allow fallback to passcode/PIN
            });

            if (result.success) {
                handleConfirm();
            } else {
                setAuthenticating(false);
                // If they cancelled or it failed, we don't do handleConfirm()
                // the user just stays on the screen.
            }
        } catch (error) {
            console.error("Biometric auth error:", error);
            setAuthenticating(false);
            // Fallback to direct confirmation if something goes wrong with the module
            handleConfirm();
        }
    };

    const handleConfirm = async () => {
        try {
            await executeTransfer();

            // Refresh wallets to show updated balance
            await fetchWallets();

            // Navigate to success screen
            router.replace("/modals/send-tokens/success");
        } catch (error: any) {
            setAuthenticating(false);
            Alert.alert(
                "Transfer Failed",
                error.response?.data?.message || error.message || "Please try again",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="send" size={48} color="#00B14F" />
                    </View>
                    <Text style={styles.title}>Review Transfer</Text>
                    <Text style={styles.subtitle}>
                        Please confirm the details before sending
                    </Text>
                </View>

                {/* Transfer Details */}
                <View style={styles.detailsCard}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Recipient</Text>
                        <Text style={styles.detailValue}>{recipientEmail}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Token Type</Text>
                        <Text style={styles.detailValue}>{tokenType}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.detailValue}>
                            {amountNum.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Transaction Fee</Text>
                        <Text style={styles.detailValue}>
                            {fee.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType}
                        </Text>
                    </View>

                    {note && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Note</Text>
                            <Text style={[styles.detailValue, styles.noteValue]}>{note}</Text>
                        </View>
                    )}

                    <View style={[styles.detailRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>
                            {total.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType}
                        </Text>
                    </View>
                </View>

                {/* Security Info */}
                <View style={styles.securityCard}>
                    <Ionicons name="shield-checkmark" size={20} color="#00B14F" />
                    <View style={styles.securityText}>
                        <Text style={styles.securityTitle}>Secure Transfer</Text>
                        <Text style={styles.securityDesc}>
                            This transaction is encrypted and secure
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

            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={styles.footerWrapper}>
                <View style={styles.footer}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => router.back()}
                            disabled={loading || authenticating}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelBtnText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                (loading || authenticating) && styles.confirmBtnDisabled,
                            ]}
                            onPress={handleBiometricAuth}
                            disabled={loading || authenticating}
                            activeOpacity={0.8}
                        >
                            {loading || authenticating ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                    <Text style={styles.confirmBtnText}>Confirm Transfer</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
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
    detailsCard: {
        backgroundColor: "#F9FAFB",
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        color: "#6B7280",
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        textAlign: "right",
    },
    noteValue: {
        fontWeight: "400",
        fontStyle: "italic",
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#00B14F",
    },
    securityCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#F0FDF4",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#D1FAE5",
    },
    securityText: {
        flex: 1,
    },
    securityTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#065F46",
        marginBottom: 2,
    },
    securityDesc: {
        fontSize: 12,
        color: "#059669",
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
    footerWrapper: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
});
