import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";
import apiClient from "@/services/apiClient";
import { useAuthStore } from "@/stores";
import { formatDate } from "@/utils/format";

const FROM_ACTIVITY = "activity";

export default function UserTransactionDetailScreen() {
    const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
    const router = useRouter();
    const { user } = useAuthStore();
    const [tx, setTx] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setError("Missing transaction id");
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                setError(null);
                const { data } = await apiClient.get(`/transactions/${id}`);
                if (!cancelled && data?.data) {
                    setTx(data.data);
                } else if (!cancelled) {
                    setError("Transaction not found");
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e.response?.data?.message || "Failed to load transaction");
                    setTx(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const getTypeConfig = (type: string) => {
        const normalizedType = (type || "").toLowerCase();

        if (normalizedType === "mint") {
            return { label: "Mint", icon: "add-circle" as const, bg: "#F0FDF4", color: "#00B14F", border: "#DDF7E5" };
        }
        if (normalizedType === "burn") {
            return { label: "Burn", icon: "remove-circle" as const, bg: "#FFF8ED", color: "#D97706", border: "#FDE7C2" };
        }
        if (normalizedType === "swap") {
            return { label: "Swap", icon: "swap-horizontal" as const, bg: "#F5F3FF", color: "#7C3AED", border: "#E9D5FF" };
        }
        if (normalizedType === "transfer") {
            return { label: "Transfer", icon: "swap-horizontal" as const, bg: "#EFF6FF", color: "#2563EB", border: "#DBEAFE" };
        }
        if (normalizedType === "credit") {
            return { label: "Credit", icon: "arrow-down-circle" as const, bg: "#EFF6FF", color: "#2563EB", border: "#DBEAFE" };
        }
        if (normalizedType === "debit") {
            return { label: "Debit", icon: "arrow-up-circle" as const, bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
        }

        return { label: type || "Transaction", icon: "cash" as const, bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
    };

    const getStatusColor = (status: string) => {
        switch ((status || "").toLowerCase()) {
            case "completed":
                return "#00B14F";
            case "pending":
                return "#F59E0B";
            case "failed":
                return "#EF4444";
            default:
                return "#6B7280";
        }
    };

    const goBack = () => {
        if (from === FROM_ACTIVITY) {
            router.replace("/(tabs)/activity");
            return;
        }
        router.back();
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00B14F" />
                <Text style={styles.loadingText}>Loading transaction...</Text>
            </View>
        );
    }

    if (error || !tx) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <View style={styles.errorIconWrap}>
                        <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
                    </View>
                    <Text style={styles.errorTitle}>Transaction unavailable</Text>
                    <Text style={styles.errorText}>{error || "Transaction not found"}</Text>
                    <TouchableOpacity onPress={goBack} style={styles.primaryButton} activeOpacity={0.85}>
                        <Text style={styles.primaryButtonText}>Go back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const typeConfig = getTypeConfig(tx.type);
    const isOut = tx.from_user_id === user?.id;
    const normalizedType = (tx.type || "").toLowerCase();
    const feeLabel = tx.fee_label || "Fee";
    const feeAmount = parseFloat(String(tx.fee_amount ?? tx.fee ?? 0)) || 0;
    const amountValue = parseFloat(String(tx.amount || 0)) || 0;
    const showNetAfterFee =
        feeAmount > 0 &&
        ["platform_fee", "transaction_fee", "none"].includes(tx.fee_kind || "transaction_fee");
    const isCreditOrDebitType = ["transfer", "swap", "credit", "debit"].includes(normalizedType);
    const creditOrDebitLabel = isCreditOrDebitType
        ? (isOut ? "Debit" : "Credit")
        : normalizedType === "mint"
            ? "Credit"
            : normalizedType === "burn"
                ? "Debit"
                : null;
    const showAmountAsOut = isCreditOrDebitType ? isOut : normalizedType === "burn";
    const counterparty = isOut
        ? (tx.toUser?.full_name || tx.toUser?.email || "—")
        : (tx.fromUser?.full_name || tx.fromUser?.email || "—");
    const receivedAmount = parseFloat(String(tx.metadata?.received_amount ?? 0)) || 0;
    const statusColor = getStatusColor(tx.status);

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.headerGradient} />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={goBack} style={styles.headerButton} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Transaction Details</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={["#F7FFF9", "#FFFFFF"]} style={styles.summaryCard}>
                    <Text style={styles.summaryEyebrow}>Activity Record</Text>
                    <Text style={styles.summaryTitle}>{typeConfig.label} Transaction</Text>
                    <Text style={styles.summaryText}>
                        Review the amount, status, counterpart, and any fee details linked to this activity entry.
                    </Text>

                    <View style={styles.summaryTopRow}>
                        <View style={[styles.typePill, { backgroundColor: typeConfig.bg, borderColor: typeConfig.border }]}>
                            <Ionicons name={typeConfig.icon} size={18} color={typeConfig.color} />
                            <Text style={[styles.typePillText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                        </View>

                        <View style={[styles.statusPill, { backgroundColor: `${statusColor}16` }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {String(tx.status || "").replace(/_/g, " ").toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.amountContainer}>
                        <View>
                            <Text style={styles.amountLabel}>
                                {creditOrDebitLabel ? `${creditOrDebitLabel} Amount` : "Amount"}
                            </Text>
                            <Text style={styles.amountValue}>
                                {showAmountAsOut ? "-" : "+"}
                                {amountValue.toLocaleString()} {tx.token_type || ""}
                            </Text>
                        </View>
                        <View style={styles.amountMeta}>
                            <Text style={styles.amountMetaLabel}>Date</Text>
                            <Text style={styles.amountMetaValue}>{formatDate(tx.created_at, true)}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <Surface style={styles.card}>
                    <View style={styles.cardAccent} />
                    <Text style={styles.cardTitle}>Transaction Summary</Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{isOut ? "To" : "From"}</Text>
                        <Text style={styles.infoValue}>{counterparty}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Token</Text>
                        <Text style={styles.infoValue}>{tx.token_type || "—"}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Reference</Text>
                        <Text style={styles.infoValue} numberOfLines={1}>{tx.reference || "—"}</Text>
                    </View>

                    {tx.description ? (
                        <View style={styles.noteBlock}>
                            <Text style={styles.noteLabel}>Description</Text>
                            <Text style={styles.noteText}>{tx.description}</Text>
                        </View>
                    ) : null}
                </Surface>

                {feeAmount > 0 || (normalizedType === "swap" && receivedAmount > 0) || (normalizedType === "transfer" && isOut && showNetAfterFee) ? (
                    <Surface style={styles.card}>
                        <View style={styles.cardAccent} />
                        <Text style={styles.cardTitle}>Settlement Details</Text>

                        {feeAmount > 0 ? (
                            <View style={styles.infoStrip}>
                                <Text style={styles.infoStripLabel}>{feeLabel}</Text>
                                <Text style={styles.infoStripValue}>
                                    {feeAmount.toLocaleString()} {tx.token_type || ""}
                                </Text>
                            </View>
                        ) : null}

                        {showNetAfterFee ? (
                            <View style={styles.infoStrip}>
                                <Text style={styles.infoStripLabel}>Net After Fee</Text>
                                <Text style={styles.infoStripValue}>
                                    {showAmountAsOut
                                        ? `${(amountValue - feeAmount).toLocaleString()} ${tx.token_type || ""}`
                                        : `${amountValue.toLocaleString()} ${tx.token_type || ""}`}
                                </Text>
                            </View>
                        ) : null}

                        {normalizedType === "swap" && receivedAmount > 0 ? (
                            <View style={styles.infoStrip}>
                                <Text style={styles.infoStripLabel}>You Received</Text>
                                <Text style={[styles.infoStripValue, styles.successValue]}>
                                    +{receivedAmount.toLocaleString()} {tx.metadata?.to_token || ""}
                                </Text>
                            </View>
                        ) : null}

                        {normalizedType === "transfer" && isOut && showNetAfterFee ? (
                            <View style={styles.infoStrip}>
                                <Text style={styles.infoStripLabel}>Recipient Received</Text>
                                <Text style={styles.infoStripValue}>
                                    {(amountValue - feeAmount).toLocaleString()} {tx.token_type || ""}
                                </Text>
                            </View>
                        ) : null}
                    </Surface>
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
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
        marginTop: 10,
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
    scrollContent: {
        padding: 16,
        paddingTop: 50,
        paddingBottom: 40,
    },
    summaryCard: {
        borderRadius: 22,
        padding: 18,
        marginTop: -34,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E6F4EA",
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
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
        letterSpacing: -0.5,
    },
    summaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: "#6B7280",
        fontWeight: "500",
        marginTop: 6,
        marginBottom: 16,
    },
    summaryTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
        gap: 12,
    },
    typePill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        gap: 6,
        borderWidth: 1,
    },
    typePillText: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.4,
    },
    amountContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FBFCFD",
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        gap: 12,
    },
    amountLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 5,
    },
    amountValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
    },
    amountMeta: {
        alignItems: "flex-end",
        flexShrink: 1,
    },
    amountMetaLabel: {
        fontSize: 11,
        color: "#6B7280",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 5,
    },
    amountMetaValue: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
        textAlign: "right",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#EAF0F5",
        overflow: "hidden",
    },
    cardAccent: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: "#00B14F",
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 16,
        marginTop: 6,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        gap: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    infoValue: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        textAlign: "right",
    },
    noteBlock: {
        marginTop: 16,
        backgroundColor: "#FBFCFD",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },
    noteLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 6,
    },
    noteText: {
        fontSize: 14,
        lineHeight: 21,
        color: "#111827",
        fontWeight: "500",
    },
    infoStrip: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "#F8FAFC",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#EEF2F7",
        gap: 12,
    },
    infoStripLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "600",
    },
    infoStripValue: {
        flex: 1,
        fontSize: 15,
        color: "#111827",
        fontWeight: "700",
        textAlign: "right",
    },
    successValue: {
        color: "#00B14F",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#F9FAFB",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: "#6B7280",
        fontWeight: "500",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#F9FAFB",
    },
    errorIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FEF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});
