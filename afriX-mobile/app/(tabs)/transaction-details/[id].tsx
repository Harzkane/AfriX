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
const FROM_ACTIVITY = "activity";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";
import apiClient from "@/services/apiClient";
import { useAuthStore } from "@/stores";
import { formatDate } from "@/utils/format";

type TxType = "mint" | "burn" | "transfer" | "swap";

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
                if (!cancelled && data?.data) setTx(data.data);
                else if (!cancelled) setError("Transaction not found");
            } catch (e: any) {
                if (!cancelled) {
                    setError(e.response?.data?.message || "Failed to load transaction");
                    setTx(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    const getTypeConfig = (type: string) => {
        const t = (type || "").toLowerCase();
        if (t === "mint") return { label: "Mint", icon: "add-circle" as const, bg: "#F0FDF4", color: "#00B14F" };
        if (t === "burn") return { label: "Burn", icon: "remove-circle" as const, bg: "#FFFBEB", color: "#D97706" };
        if (t === "swap") return { label: "Swap", icon: "swap-horizontal" as const, bg: "#F5F3FF", color: "#7C3AED" };
        if (t === "transfer") return { label: "Transfer", icon: "swap-horizontal" as const, bg: "#EFF6FF", color: "#3B82F6" };
        if (t === "credit") return { label: "Credit", icon: "arrow-down-circle" as const, bg: "#EFF6FF", color: "#3B82F6" };
        if (t === "debit") return { label: "Debit", icon: "arrow-up-circle" as const, bg: "#FEF2F2", color: "#DC2626" };
        return { label: (type || "Transaction"), icon: "cash" as const, bg: "#F3F4F6", color: "#6B7280" };
    };

    const getStatusColor = (status: string) => {
        switch ((status || "").toLowerCase()) {
            case "completed": return "#00B14F";
            case "pending": return "#F59E0B";
            case "failed": return "#EF4444";
            default: return "#6B7280";
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#00B14F" />
                <Text style={styles.loadingText}>Loading transaction...</Text>
            </View>
        );
    }

    const goBack = () => {
        if (from === FROM_ACTIVITY) {
            router.replace("/(tabs)/activity");
        } else {
            router.back();
        }
    };

    if (error || !tx) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Transaction</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>{error || "Not found"}</Text>
                    <TouchableOpacity onPress={goBack} style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>Go back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const typeConfig = getTypeConfig(tx.type);
    const isOut = tx.from_user_id === user?.id;
    const counterparty = isOut
        ? (tx.toUser?.full_name || tx.toUser?.email || "—")
        : (tx.fromUser?.full_name || tx.fromUser?.email || "—");
    const isCreditOrDebitType = ["transfer", "swap", "credit", "debit"].includes((tx.type || "").toLowerCase());
    // Mint = incoming (Credit), Burn = outgoing (Debit) so all types use same card layout
    const creditOrDebitLabel = isCreditOrDebitType
        ? (isOut ? "Debit" : "Credit")
        : (tx.type || "").toLowerCase() === "mint"
            ? "Credit"
            : (tx.type || "").toLowerCase() === "burn"
                ? "Debit"
                : null;
    const showAmountAsOut = isCreditOrDebitType ? isOut : (tx.type || "").toLowerCase() === "burn";

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.gradient} />
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Transaction details</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <Surface style={styles.card}>
                        <View style={styles.typeRow}>
                            <View style={[styles.typePill, { backgroundColor: typeConfig.bg }]}>
                                <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
                                <Text style={[styles.typeLabel, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                            </View>
                            <View style={styles.typeRowRight}>
                                {creditOrDebitLabel ? (
                                    <View style={[styles.creditDebitPill, { backgroundColor: showAmountAsOut ? "#FEF2F2" : "#F0FDF4" }]}>
                                        <Text style={[styles.creditDebitPillText, { color: showAmountAsOut ? "#DC2626" : "#16A34A" }]}>
                                            {creditOrDebitLabel}
                                        </Text>
                                    </View>
                                ) : null}
                                <View style={[styles.statusPill, { backgroundColor: getStatusColor(tx.status) + "20" }]}>
                                    <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                                        {(tx.status || "").replace("_", " ")}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>{creditOrDebitLabel ? `${creditOrDebitLabel} · Amount` : "Amount"}</Text>
                            <Text style={styles.amount}>
                                {showAmountAsOut ? "-" : "+"}
                                {parseFloat(tx.amount || 0).toLocaleString()} {tx.token_type || ""}
                            </Text>
                        </View>

                        {parseFloat(tx.fee || 0) > 0 ? (
                            <>
                                <View style={styles.section}>
                                    <Text style={styles.label}>Fee</Text>
                                    <Text style={styles.value}>
                                        {parseFloat(tx.fee).toLocaleString()} {tx.token_type || ""}
                                    </Text>
                                </View>
                                <View style={styles.section}>
                                    <Text style={styles.label}>Net (after fee)</Text>
                                    <Text style={styles.value}>
                                        {showAmountAsOut
                                            ? `${(parseFloat(tx.amount || 0) - parseFloat(tx.fee || 0)).toLocaleString()} ${tx.token_type || ""} ${(tx.type || "").toLowerCase() === "swap" ? "converted" : "sent"}`
                                            : `${(parseFloat(tx.amount || 0).toLocaleString())} ${tx.token_type || ""} received`
                                        }
                                    </Text>
                                </View>
                            </>
                        ) : null}

                        {(tx.type || "").toLowerCase() === "swap" && tx.metadata?.received_amount != null ? (
                            <View style={styles.section}>
                                <Text style={styles.label}>You received</Text>
                                <Text style={[styles.amount, { color: "#16A34A" }]}>
                                    +{parseFloat(String(tx.metadata.received_amount)).toLocaleString()} {tx.metadata.to_token || ""}
                                </Text>
                            </View>
                        ) : null}

                        {(tx.type || "").toLowerCase() === "transfer" && isOut && parseFloat(tx.fee || 0) > 0 ? (
                            <View style={styles.section}>
                                <Text style={styles.label}>Recipient received</Text>
                                <Text style={styles.value}>
                                    {(parseFloat(tx.amount || 0) - parseFloat(tx.fee || 0)).toLocaleString()} {tx.token_type || ""}
                                </Text>
                            </View>
                        ) : null}

                        <View style={styles.section}>
                            <Text style={styles.label}>{isOut ? "To" : "From"}</Text>
                            <Text style={styles.value}>{counterparty}</Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>{formatDate(tx.created_at, true)}</Text>
                        </View>

                        {tx.description ? (
                            <View style={styles.section}>
                                <Text style={styles.label}>Description</Text>
                                <Text style={styles.value}>{tx.description}</Text>
                            </View>
                        ) : null}

                        {tx.reference ? (
                            <View style={styles.section}>
                                <Text style={styles.label}>Reference</Text>
                                <Text style={styles.reference} numberOfLines={1}>{tx.reference}</Text>
                            </View>
                        ) : null}
                    </Surface>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F9FAFB" },
    gradient: { position: "absolute", top: 0, left: 0, right: 0, height: 160 },
    safe: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
    content: { padding: 16, paddingBottom: 40 },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    loadingText: { marginTop: 12, fontSize: 15, color: "#6B7280" },
    errorText: { marginTop: 12, fontSize: 16, color: "#374151", textAlign: "center" },
    primaryButton: {
        marginTop: 24,
        backgroundColor: "#00B14F",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    primaryButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    typeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    typePill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
    typeLabel: { fontSize: 15, fontWeight: "600" },
    typeRowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    creditDebitPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    creditDebitPillText: { fontSize: 12, fontWeight: "600" },
    statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
    section: { marginBottom: 16 },
    label: { fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: "500" },
    value: { fontSize: 16, color: "#111827", fontWeight: "600" },
    amount: { fontSize: 20, color: "#111827", fontWeight: "700" },
    reference: { fontSize: 14, color: "#6B7280", fontVariant: ["tabular-nums"] },
});
