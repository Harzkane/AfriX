import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/apiClient";
import { useAuthStore } from "@/stores";
import { formatDate } from "@/utils/format";

const FROM_ACTIVITY = "activity";

export default function UserTransactionDetailScreen() {
    const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
    const router = useRouter();
    const { user } = useAuthStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
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
            <View
                style={[
                    styles.centerContainer,
                    { backgroundColor: isDark ? "#07111A" : "#F9FAFB" },
                ]}
            >
                <ActivityIndicator size="large" color="#00B14F" />
                <Text
                    style={[
                        styles.loadingText,
                        { color: isDark ? "#94A3B8" : "#6B7280" },
                    ]}
                >
                    Loading transaction...
                </Text>
            </View>
        );
    }

    if (error || !tx) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#07111A" : "#F9FAFB" }]}>
                <View style={[styles.errorContainer, { backgroundColor: isDark ? "#07111A" : "#F9FAFB" }]}>
                    <View style={[styles.errorIconWrap, { backgroundColor: isDark ? "rgba(239,68,68,0.14)" : "#FEF2F2" }]}>
                        <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
                    </View>
                    <Text style={[styles.errorTitle, { color: isDark ? "#F8FAFC" : "#111827" }]}>
                        Transaction unavailable
                    </Text>
                    <Text style={[styles.errorText, { color: isDark ? "#94A3B8" : "#6B7280" }]}>
                        {error || "Transaction not found"}
                    </Text>
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
    const theme = {
        background: isDark ? "#07111A" : "#F5F7FB",
        card: isDark ? "#0E1726" : "#FFFFFF",
        surface: isDark ? "#111C2B" : "#F8FAFC",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "#1E2A3A" : "#E2E8F0",
        divider: isDark ? "#1E2A3A" : "#EEF2F7",
        accent: "#00B14F",
        accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={
                    isDark
                        ? ["rgba(0,177,79,0.18)", "rgba(7,17,26,0)"]
                        : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]
                }
                style={styles.backgroundGlow}
                pointerEvents="none"
            />

            <SafeAreaView
                edges={["top"]}
                style={[
                    styles.headerWrapper,
                    { backgroundColor: theme.background, borderBottomColor: theme.border },
                ]}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={goBack}
                        style={[
                            styles.headerButton,
                            { backgroundColor: theme.card, borderColor: theme.border },
                        ]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>

                    <View style={styles.headerCopy}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>
                            Transaction details
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                            Review the amount, status, counterpart, and fee breakdown.
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.headerStatusPill,
                            {
                                backgroundColor: `${statusColor}16`,
                                borderColor: `${statusColor}28`,
                            },
                        ]}
                    >
                        <Text style={[styles.headerStatusText, { color: statusColor }]}>
                            {String(tx.status || "").replace(/_/g, " ")}
                        </Text>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={isDark ? ["#0E1726", "#111E2E"] : ["#FFFFFF", "#F4FBF7"]}
                    style={[
                        styles.heroCard,
                        {
                            borderColor: theme.border,
                            shadowColor: isDark ? "#000" : "#0F172A",
                        },
                    ]}
                >
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroCopy}>
                            <Text style={[styles.heroEyebrow, { color: theme.accent }]}>
                                Activity Record
                            </Text>
                            <Text style={[styles.heroTitle, { color: theme.text }]}>
                                {typeConfig.label} Transaction
                            </Text>
                            <Text style={[styles.heroText, { color: theme.muted }]}>
                                Review the amount, status, counterpart, and any fee details linked to this activity entry.
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.heroTypePill,
                                { backgroundColor: typeConfig.bg, borderColor: typeConfig.border },
                            ]}
                        >
                            <Ionicons name={typeConfig.icon} size={18} color={typeConfig.color} />
                            <Text style={[styles.heroTypeText, { color: typeConfig.color }]}>
                                {typeConfig.label}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.heroAmountRow}>
                        <View>
                            <Text style={[styles.amountLabel, { color: theme.muted }]}>
                                {creditOrDebitLabel ? `${creditOrDebitLabel} amount` : "Amount"}
                            </Text>
                            <Text style={[styles.amountValue, { color: theme.text }]}>
                                {showAmountAsOut ? "-" : "+"}
                                {amountValue.toLocaleString()} {tx.token_type || ""}
                            </Text>
                        </View>
                        <View style={[styles.heroDateChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.heroDateLabel, { color: theme.muted }]}>Date</Text>
                            <Text style={[styles.heroDateValue, { color: theme.text }]}>
                                {formatDate(tx.created_at, true)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.heroMetaRow}>
                        <View style={[styles.heroMetaChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.heroMetaLabel, { color: theme.muted }]}>Direction</Text>
                            <Text style={[styles.heroMetaValue, { color: theme.text }]}>
                                {showAmountAsOut ? "Outgoing" : "Incoming"}
                            </Text>
                        </View>
                        <View style={[styles.heroMetaChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.heroMetaLabel, { color: theme.muted }]}>Counterparty</Text>
                            <Text style={[styles.heroMetaValue, { color: theme.text }]}>
                                {counterparty}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Transaction summary
                    </Text>
                </View>

                <View
                    style={[
                        styles.detailCard,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            shadowColor: isDark ? "#000" : "#0F172A",
                        },
                    ]}
                >
                    <View style={[styles.cardAccent, { backgroundColor: typeConfig.color }]} />

                    <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
                        <Text style={[styles.detailLabel, { color: theme.muted }]}>From / To</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{counterparty}</Text>
                    </View>

                    <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
                        <Text style={[styles.detailLabel, { color: theme.muted }]}>Token</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]}>{tx.token_type || "—"}</Text>
                    </View>

                    <View style={[styles.detailRow, { borderBottomColor: theme.divider }]}>
                        <Text style={[styles.detailLabel, { color: theme.muted }]}>Reference</Text>
                        <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                            {tx.reference || "—"}
                        </Text>
                    </View>

                    {tx.description ? (
                        <View style={[styles.noteBlock, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.noteLabel, { color: theme.muted }]}>Description</Text>
                            <Text style={[styles.noteText, { color: theme.text }]}>{tx.description}</Text>
                        </View>
                    ) : null}
                </View>

                {((normalizedType === "transfer" && isOut) ||
                    normalizedType === "swap" ||
                    (normalizedType !== "transfer" && normalizedType !== "swap" && feeAmount > 0)) ? (
                    <>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Settlement details
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.detailCard,
                                {
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                    shadowColor: isDark ? "#000" : "#0F172A",
                                },
                            ]}
                        >
                            <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />

                            {feeAmount > 0 ? (
                                <View
                                    style={[
                                        styles.infoStrip,
                                        { backgroundColor: theme.surface, borderColor: theme.border },
                                    ]}
                                >
                                    <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                                        {feeLabel}
                                    </Text>
                                    <Text style={[styles.infoStripValue, { color: theme.text }]}>
                                        {feeAmount.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{" "}
                                        {tx.token_type || ""}
                                    </Text>
                                </View>
                            ) : null}

                            {normalizedType === "transfer" ? (
                                <>
                                    <View
                                        style={[
                                            styles.infoStrip,
                                            { backgroundColor: theme.surface, borderColor: theme.border },
                                        ]}
                                    >
                                        <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                                            Recipient received
                                        </Text>
                                        <Text style={[styles.infoStripValue, { color: theme.text }]}>
                                            {amountValue.toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}{" "}
                                            {tx.token_type || ""}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.infoStrip,
                                            { backgroundColor: theme.surface, borderColor: theme.border },
                                        ]}
                                    >
                                        <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                                            Total debited
                                        </Text>
                                        <Text style={[styles.infoStripValue, { color: theme.text }]}>
                                            {(amountValue + feeAmount).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}{" "}
                                            {tx.token_type || ""}
                                        </Text>
                                    </View>
                                </>
                            ) : normalizedType === "swap" ? (
                                <>
                                    {showNetAfterFee ? (
                                        <View
                                            style={[
                                                styles.infoStrip,
                                                { backgroundColor: theme.surface, borderColor: theme.border },
                                            ]}
                                        >
                                            <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                                                Net swapped
                                            </Text>
                                            <Text style={[styles.infoStripValue, { color: theme.text }]}>
                                                {(amountValue - feeAmount).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}{" "}
                                                {tx.token_type || ""}
                                            </Text>
                                        </View>
                                    ) : null}
                                    {receivedAmount > 0 && (
                                        <View
                                            style={[
                                                styles.infoStrip,
                                                { backgroundColor: theme.surface, borderColor: theme.border },
                                            ]}
                                        >
                                            <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                                                You received
                                            </Text>
                                            <Text style={[styles.infoStripValue, { color: theme.accent }]}>
                                                +{receivedAmount.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}{" "}
                                                {tx.metadata?.to_token || ""}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <>
                                    {showNetAfterFee ? (
                                        <View
                                            style={[
                                                styles.infoStrip,
                                                { backgroundColor: theme.surface, borderColor: theme.border },
                                            ]}
                                        >
                                            <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                                                Net after fee
                                            </Text>
                                            <Text style={[styles.infoStripValue, { color: theme.text }]}>
                                                {showAmountAsOut
                                                    ? `${(amountValue - feeAmount).toLocaleString(undefined, {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2,
                                                      })} ${tx.token_type || ""}`
                                                    : `${amountValue.toLocaleString(undefined, {
                                                          minimumFractionDigits: 2,
                                                          maximumFractionDigits: 2,
                                                      })} ${tx.token_type || ""}`}
                                            </Text>
                                        </View>
                                    ) : null}
                                </>
                            )}
                        </View>
                    </>
                ) : null}

                {tx.agent ? (
                    <>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Agent context
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.detailCard,
                                {
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                    shadowColor: isDark ? "#000" : "#0F172A",
                                },
                            ]}
                        >
                            <View style={[styles.cardAccent, { backgroundColor: "#7C3AED" }]} />
                            <View style={styles.agentRow}>
                                <View style={styles.agentInfo}>
                                    <Ionicons name="person-circle-outline" size={18} color={theme.muted} />
                                    <View>
                                        <Text style={[styles.detailLabel, { color: theme.muted }]}>
                                            Agent
                                        </Text>
                                        <Text style={[styles.detailValue, { color: theme.text }]}>
                                            {tx.agent.user?.full_name || "Agent"}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.agentRatingPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <Ionicons name="star" size={12} color="#FFB800" />
                                    <Text style={[styles.agentRatingText, { color: theme.text }]}>
                                        {(tx.agent.rating || 5.0).toFixed(1)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : null}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGlow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 180,
    },
    headerWrapper: {
        zIndex: 10,
        borderBottomWidth: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    headerCopy: {
        flex: 1,
        paddingTop: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    headerSubtitle: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "500",
    },
    headerStatusPill: {
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
    },
    headerStatusText: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "capitalize",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 36,
        gap: 18,
    },
    heroCard: {
        borderRadius: 28,
        padding: 18,
        borderWidth: 1,
        overflow: "hidden",
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 3,
    },
    heroTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 14,
    },
    heroCopy: {
        flex: 1,
    },
    heroEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.6,
    },
    heroText: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: "500",
    },
    heroTypePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
    },
    heroTypeText: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
    },
    heroAmountRow: {
        marginTop: 18,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 14,
    },
    amountLabel: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    heroDateChip: {
        alignItems: "flex-end",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
    },
    heroDateLabel: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    heroDateValue: {
        fontSize: 13,
        fontWeight: "700",
    },
    heroMetaRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
        flexWrap: "wrap",
    },
    heroMetaChip: {
        flex: 1,
        minWidth: "46%",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 18,
        borderWidth: 1,
    },
    heroMetaLabel: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.3,
        marginBottom: 3,
    },
    heroMetaValue: {
        fontSize: 13,
        fontWeight: "700",
    },
    sectionHeaderRow: {
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    detailCard: {
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        overflow: "hidden",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 2,
    },
    cardAccent: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    detailValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: "700",
        textAlign: "right",
    },
    noteBlock: {
        marginTop: 14,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
    },
    noteLabel: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 6,
    },
    noteText: {
        fontSize: 14,
        lineHeight: 21,
        fontWeight: "500",
    },
    infoStrip: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        gap: 12,
    },
    infoStripLabel: {
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
    },
    infoStripValue: {
        fontSize: 15,
        fontWeight: "700",
        textAlign: "right",
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
    agentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        paddingTop: 10,
        paddingBottom: 2,
    },
    agentInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    agentRatingPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
    },
    agentRatingText: {
        fontSize: 12,
        fontWeight: "800",
    },
});
