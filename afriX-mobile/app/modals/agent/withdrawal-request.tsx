import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";

export default function WithdrawalRequest() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const fromAgentProfile = params?.from === "agent-profile";
    const { user } = useAuthStore();
    const {
        dashboardData,
        createWithdrawalRequest,
        loading,
        withdrawalRequests,
        fetchWithdrawalRequests,
    } = useAgentStore();

    const [amount, setAmount] = useState("");
    const [displayAmount, setDisplayAmount] = useState("");
    const [error, setError] = useState("");

    const handleGoBack = () => {
        if (fromAgentProfile) {
            router.push("/agent/(tabs)/profile");
        } else {
            router.back();
        }
    };

    // Load latest withdrawal requests so summary can account for pending ones
    useEffect(() => {
        fetchWithdrawalRequests().catch(() => {
            // swallow error here; validation will still use dashboard fallback
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper function to format currency with commas
    const formatCurrency = (value: number): string => {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const floorToCurrency = (value: number): number => {
        return Math.floor((value + Number.EPSILON) * 100) / 100;
    };

    // Helper to format input with commas as user types
    const formatInput = (value: string): string => {
        // Remove all non-numeric characters except decimal point
        const cleaned = value.replace(/[^0-9.]/g, '');

        // Split into integer and decimal parts
        const parts = cleaned.split('.');

        // Format integer part with commas
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Limit to 2 decimal places
        if (parts[1]) {
            parts[1] = parts[1].substring(0, 2);
        }

        return parts.join('.');
    };

    // Helper to parse formatted input back to number
    const parseInput = (value: string): string => {
        return value.replace(/,/g, '');
    };

    // Calculate financial data
    const totalDeposit = dashboardData?.financials?.total_deposit || 0;
    const outstandingTokens = dashboardData?.financials?.outstanding_tokens || 0;

    // Base max withdrawable from dashboard (backend already exposes this),
    // with a fallback to the simple formula if needed.
    const baseMaxWithdrawable =
        dashboardData?.financials?.max_withdrawable ??
        (totalDeposit - outstandingTokens);

    // Reserve capacity for any pending withdrawal requests so agents
    // see an accurate "remaining" amount they can still request.
    const pendingReserved =
        (withdrawalRequests || []).reduce((sum, req) => {
            if (req.status !== "pending") return sum;
            const value = parseFloat(req.amount_usd || "0");
            return sum + (isNaN(value) ? 0 : value);
        }, 0);

    const maxWithdrawable = Math.max(0, baseMaxWithdrawable - pendingReserved);
    const safeMaxWithdrawable = floorToCurrency(maxWithdrawable);

    const withdrawalAddress = (user as any)?.withdrawal_address || "Not set";

    const validateAmount = (value: string): boolean => {
        const numValue = parseFloat(parseInput(value));

        if (isNaN(numValue) || numValue <= 0) {
            setError("Please enter a valid amount");
            return false;
        }

        if (numValue < 10) {
            setError("Minimum withdrawal is $10 USDT");
            return false;
        }

        if (numValue > safeMaxWithdrawable) {
            setError(`Maximum withdrawable is $${formatCurrency(safeMaxWithdrawable)}`);
            return false;
        }

        setError("");
        return true;
    };

    const handleAmountChange = (text: string) => {
        const formatted = formatInput(text);
        setDisplayAmount(formatted);
        setAmount(parseInput(formatted));
        if (formatted) validateAmount(formatted);
    };

    const handleQuickSelect = (percentage: number) => {
        const calculatedAmount = floorToCurrency(safeMaxWithdrawable * percentage / 100);
        const rawValue = calculatedAmount.toFixed(2);
        const formatted = formatInput(rawValue);
        setAmount(rawValue);
        setDisplayAmount(formatted);
        validateAmount(formatted);
    };

    const handleSubmit = async () => {
        if (!validateAmount(amount)) {
            return;
        }

        Alert.alert(
            "Confirm Withdrawal",
            `Request withdrawal of $${formatCurrency(parseFloat(amount))} USDT?\n\nProcessing time: 1-3 business days`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        try {
                            const result = await createWithdrawalRequest(parseFloat(amount));
                            const fromParam = fromAgentProfile ? "agent-profile" : "";
                            router.replace({
                                pathname: "/modals/agent/withdrawal-success",
                                params: {
                                    amount: amount,
                                    requestId: result.request.id,
                                    ...(fromParam ? { from: fromParam } : {}),
                                },
                            });
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "Failed to submit withdrawal request");
                        }
                    }
                }
            ]
        );
    };

    const isFormValid = amount.trim().length > 0 && !error && !loading;

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Request Withdrawal</Text>
                        <View style={{ width: 24 }} />
                    </View>
                </SafeAreaView>
            </View>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <LinearGradient
                        colors={["#F7FFF9", "#FFFFFF"]}
                        style={styles.introCard}
                    >
                        <Text style={styles.introEyebrow}>Withdrawal Planning</Text>
                        <Text style={styles.introTitle}>Move Available Funds Safely</Text>
                        <Text style={styles.introText}>
                            Review your live withdrawal capacity, choose an amount, and submit a payout request to your saved wallet.
                        </Text>
                    </LinearGradient>

                    {/* Financial Summary */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryHeader}>
                            <Ionicons name="wallet" size={24} color="#7C3AED" />
                            <Text style={styles.summaryTitle}>Financial Summary</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Deposit</Text>
                            <Text style={styles.summaryValue}>${formatCurrency(totalDeposit)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Outstanding Tokens</Text>
                            <Text style={styles.summaryValue}>${formatCurrency(outstandingTokens)}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={[styles.summaryRow, styles.maxWithdrawableRow]}>
                            <Text style={styles.maxWithdrawableLabel}>Max Withdrawable</Text>
                            <Text style={styles.maxWithdrawableValue}>${formatCurrency(safeMaxWithdrawable)}</Text>
                        </View>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Withdrawal Amount *</Text>
                        <View style={[styles.inputContainer, error && styles.inputError]}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.input}
                                value={displayAmount}
                                onChangeText={handleAmountChange}
                                placeholder="0.00"
                                keyboardType="decimal-pad"
                                editable={!loading}
                            />
                            <Text style={styles.currencyLabel}>USDT</Text>
                        </View>
                        {error && <Text style={styles.errorText}>{error}</Text>}
                    </View>

                    {/* Quick Select */}
                    <View style={styles.quickSelectGroup}>
                        <Text style={styles.quickSelectLabel}>Quick Select:</Text>
                        <View style={styles.quickSelectButtons}>
                            <TouchableOpacity
                                style={styles.quickSelectButton}
                                onPress={() => handleQuickSelect(25)}
                                disabled={loading}
                            >
                                <Text style={styles.quickSelectButtonText}>25%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickSelectButton}
                                onPress={() => handleQuickSelect(50)}
                                disabled={loading}
                            >
                                <Text style={styles.quickSelectButtonText}>50%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickSelectButton}
                                onPress={() => handleQuickSelect(75)}
                                disabled={loading}
                            >
                                <Text style={styles.quickSelectButtonText}>75%</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickSelectButton}
                                onPress={() => handleQuickSelect(100)}
                                disabled={loading}
                            >
                                <Text style={styles.quickSelectButtonText}>100%</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#7C3AED" />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>Important Information</Text>
                            <Text style={styles.infoText}>• Processing time: 1-3 business days</Text>
                            <Text style={styles.infoText}>• Minimum withdrawal: $10 USDT</Text>
                            <Text style={styles.infoText}>• Funds sent to: {withdrawalAddress.slice(0, 10)}...{withdrawalAddress.slice(-8)}</Text>
                            <Text style={styles.infoText}>• You cannot withdraw funds backing active tokens</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Submit Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitButton, (!isFormValid || loading) && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!isFormValid || loading}
                    >
                        {loading ? (
                            <Text style={styles.submitButtonText}>Processing...</Text>
                        ) : (
                            <Text style={styles.submitButtonText}>Request Withdrawal</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    introCard: {
        borderRadius: 22,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E6F4EA",
    },
    introEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
        letterSpacing: -0.5,
    },
    introText: {
        fontSize: 13,
        lineHeight: 20,
        color: "#6B7280",
        fontWeight: "500",
        marginTop: 6,
    },
    summaryCard: {
        backgroundColor: "white",
        borderRadius: 22,
        padding: 18,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#EAF0F5",
    },
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    divider: {
        height: 1,
        backgroundColor: "#EEF2F7",
        marginVertical: 8,
    },
    maxWithdrawableRow: {
        backgroundColor: "#F6F5FF",
        marginHorizontal: -18,
        paddingHorizontal: 18,
        paddingVertical: 12,
        marginBottom: -18,
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
    },
    maxWithdrawableLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#7C3AED",
    },
    maxWithdrawableValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#7C3AED",
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: "800",
        color: "#4B5563",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EAF0F5",
        paddingHorizontal: 12,
    },
    inputError: {
        borderColor: "#EF4444",
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: "700",
        color: "#6B7280",
        marginRight: 4,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    currencyLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
        marginLeft: 4,
    },
    errorText: {
        fontSize: 12,
        color: "#EF4444",
        marginTop: 4,
    },
    quickSelectGroup: {
        marginBottom: 24,
    },
    quickSelectLabel: {
        fontSize: 12,
        fontWeight: "800",
        color: "#4B5563",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    quickSelectButtons: {
        flexDirection: "row",
        gap: 8,
    },
    quickSelectButton: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#D7C7FA",
        paddingVertical: 10,
        alignItems: "center",
    },
    quickSelectButtonText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#7C3AED",
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#F6F5FF",
        padding: 14,
        borderRadius: 16,
        gap: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#E9DDFD",
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#7C3AED",
        marginBottom: 6,
    },
    infoText: {
        fontSize: 12,
        color: "#7C3AED",
        lineHeight: 18,
        marginBottom: 2,
    },
    footer: {
        padding: 16,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#EAF0F5",
    },
    submitButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    submitButtonDisabled: {
        backgroundColor: "#9CA3AF",
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "white",
    },
});
