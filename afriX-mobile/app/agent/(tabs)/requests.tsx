import React, { useCallback, useEffect, useState } from "react";
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, RefreshControl, useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatAmount, formatDate } from "@/utils/format";

const getCommissionPresentation = (item: any, tokenType: string) => {
    const rawAmount = item.agent_commission ?? item.fee_amount ?? item.fee ?? 0;
    const amount = formatAmount(rawAmount, tokenType);
    const label = item.fee_kind === "agent_commission"
        ? (item.fee_label || "Agent Commission")
        : "Commission Earned";
    return { amount, label };
};

const isAdminResolvedRecord = (item: any) => item?.metadata?.admin_resolved === true;

const getStatusMeta = (status?: string) => {
    switch (String(status || "").toLowerCase()) {
        case "proof_submitted": return { label: "PROOF SUBMITTED", bg: "#FEF3C7", border: "#FDE68A", text: "#B45309" };
        case "escrowed": return { label: "ESCROWED", bg: "#DBEAFE", border: "#BFDBFE", text: "#1D4ED8" };
        case "pending": return { label: "PENDING", bg: "#F3F4F6", border: "#E5E7EB", text: "#4B5563" };
        case "disputed": return { label: "DISPUTED", bg: "#FEE2E2", border: "#FECACA", text: "#B91C1C" };
        case "completed": return { label: "COMPLETED", bg: "#DCFCE7", border: "#BBF7D0", text: "#15803D" };
        case "rejected": return { label: "REJECTED", bg: "#FEE2E2", border: "#FECACA", text: "#B91C1C" };
        case "expired": return { label: "EXPIRED", bg: "#F3F4F6", border: "#E5E7EB", text: "#6B7280" };
        case "cancelled": return { label: "CANCELLED", bg: "#F3F4F6", border: "#E5E7EB", text: "#6B7280" };
        default: return { label: String(status || "unknown").replace(/_/g, " ").toUpperCase(), bg: "#F3F4F6", border: "#E5E7EB", text: "#4B5563" };
    }
};

export default function AgentRequests() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { pendingRequests, history, dashboardData, fetchPendingRequests, fetchDashboard, loading } = useAgentStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    type TabType = "mint" | "burn" | "history";
    const [activeTab, setActiveTab] = useState<TabType>("mint");

    const theme = {
        bg: isDark ? "#090B14" : "#F5F4FC",
        card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "#1E1638" : "#EDE9FE",
        accent: "#7C3AED",
        accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
        green: "#00B14F",
    };

    const loadData = useCallback(() => {
        fetchPendingRequests();
        fetchDashboard();
    }, [fetchDashboard, fetchPendingRequests]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const tabParam = params.tab as string | undefined;
        const nextTab: "mint" | "burn" | "history" =
            tabParam === "burn" || tabParam === "history" ? tabParam : "mint";
        setActiveTab(nextTab);
    }, [params.tab]);

    const historyItems = [
        ...((dashboardData?.recent_transactions || []).map((item: any) => ({ ...item, __kind: "transaction" as const }))),
        ...(history.map((item: any) => ({ ...item, __kind: "request" as const }))),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const filteredRequests = activeTab === "history"
        ? historyItems
        : pendingRequests.filter((r) => {
            const type = String(r.type || "").toLowerCase() || (r.bank_account ? "burn" : "mint");
            return type === activeTab;
        });

    const mintCount = pendingRequests.filter((r) => (String(r.type || "").toLowerCase() || (r.bank_account ? "burn" : "mint")) === "mint").length;
    const burnCount = pendingRequests.filter((r) => (String(r.type || "").toLowerCase() || (r.bank_account ? "burn" : "mint")) === "burn").length;

    const historyCount = historyItems.length;
    const tabs: { key: "mint" | "burn" | "history"; label: string; count: number }[] = [
        { key: "mint", label: "Mint", count: mintCount },
        { key: "burn", label: "Burn", count: burnCount },
        { key: "history", label: "History", count: historyCount },
    ];

    const renderRequest = ({ item }: { item: any }) => {
        const isHistory = activeTab === "history";
        const isHistoryTransaction = isHistory && item.__kind === "transaction";
        const isHistoryRequest = isHistory && item.__kind === "request";
        const resolvedType = item.type || (item.bank_account ? "burn" : "mint");
        const isMint = isHistoryTransaction ? item.type === "mint" : resolvedType === "mint";
        const userName = isHistoryTransaction
            ? (isMint ? item.toUser?.full_name : item.fromUser?.full_name)
            : item.user?.full_name;
        const tokenType = item.token_type || "NT";
        const commission = isHistoryTransaction ? getCommissionPresentation(item, tokenType) : null;
        const adminResolved = isHistoryTransaction && isAdminResolvedRecord(item);
        const statusMeta = getStatusMeta(item.status);
        const mintTone = { iconBg: isDark ? "rgba(0, 177, 79, 0.12)" : "#ECFDF5", iconColor: "#00B14F", chipBg: isDark ? "rgba(0, 177, 79, 0.12)" : "#DCFCE7", chipText: "#15803D" };
        const burnTone = { iconBg: isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB", iconColor: "#D97706", chipBg: isDark ? "rgba(245, 158, 11, 0.12)" : "#FEF3C7", chipText: "#B45309" };
        const tone = isMint ? mintTone : burnTone;
        const accentBarColor = isMint ? "#00B14F" : "#D97706";

        return (
            <TouchableOpacity
                onPress={() =>
                    isHistoryTransaction
                        ? router.push(`/agent/transaction-details/${item.id}`)
                        : router.push(`/agent/request-details/${item.id}`)
                }
                activeOpacity={0.8}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
                {/* Accent bar */}
                <View style={[styles.cardAccentBar, { backgroundColor: accentBarColor }]} />

                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardUserRow}>
                        <View style={[styles.cardAvatar, { backgroundColor: tone.iconBg }]}>
                            <Ionicons name={isMint ? "arrow-up" : "arrow-down"} size={18} color={tone.iconColor} />
                        </View>
                        <View>
                            <Text style={[styles.cardEyebrow, { color: theme.muted }]}>
                                {isHistoryTransaction
                                    ? adminResolved
                                        ? (isMint ? "Admin Resolved Mint" : "Admin Resolved Burn")
                                        : (isMint ? "Mint Transaction" : "Burn Transaction")
                                    : isHistoryRequest
                                        ? (isMint ? "Mint Request Record" : "Burn Request Record")
                                        : (isMint ? "Pending Mint" : "Pending Burn")}
                            </Text>
                            <Text style={[styles.cardUserName, { color: theme.text }]}>{userName || "Unknown User"}</Text>
                            <Text style={[styles.cardDate, { color: theme.muted }]}>{formatDate(item.created_at)}</Text>
                        </View>
                    </View>
                    <View style={styles.cardBadges}>
                        {isHistoryTransaction && (
                            <View style={[styles.typeBadge, { backgroundColor: isDark ? "rgba(37, 99, 235, 0.15)" : "#EFF6FF" }]}>
                                <Text style={[styles.typeBadgeText, { color: "#2563EB" }]}>TX</Text>
                            </View>
                        )}
                        {isHistoryRequest && (
                            <View style={[styles.typeBadge, { backgroundColor: theme.accentLight }]}>
                                <Text style={[styles.typeBadgeText, { color: theme.accent }]}>REC</Text>
                            </View>
                        )}
                        <View style={[styles.mintBurnBadge, { backgroundColor: tone.chipBg }]}>
                            <Text style={[styles.mintBurnBadgeText, { color: tone.chipText }]}>{isMint ? "MINT" : "BURN"}</Text>
                        </View>
                    </View>
                </View>

                {/* Amount row */}
                <View style={[styles.amountBox, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F8F7FF", borderColor: theme.border }]}>
                    <View>
                        <Text style={[styles.amountLabel, { color: theme.muted }]}>Amount</Text>
                        <Text style={[styles.amountValue, { color: theme.text }]}>
                            {formatAmount(item.amount, item.token_type)} {item.token_type}
                        </Text>
                    </View>
                    <View style={[styles.tokenChip, { backgroundColor: theme.accentLight }]}>
                        <Text style={[styles.tokenChipText, { color: theme.accent }]}>{item.token_type}</Text>
                    </View>
                </View>

                {/* Commission (transactions) */}
                {isHistoryTransaction && commission && (
                    <View style={[styles.commissionBox, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.1)" : "#ECFDF5", borderColor: isDark ? "rgba(0, 177, 79, 0.2)" : "#BBF7D0" }]}>
                        <Text style={[styles.commissionLabel, { color: "#059669" }]}>{commission.label}</Text>
                        <Text style={[styles.commissionValue, { color: "#00B14F" }]}>+{commission.amount} {tokenType}</Text>
                    </View>
                )}

                {/* Admin resolve banner */}
                {adminResolved && (
                    <View style={styles.resolvedBox}>
                        <Text style={styles.resolvedLabel}>Admin Resolution</Text>
                        <View style={[styles.statusBadge, { backgroundColor: "#ECFDF3", borderColor: "#B7E4C7" }]}>
                            <Text style={[styles.statusBadgeText, { color: "#15803D" }]}>
                                {item.metadata?.resolution_action === "penalize_agent" ? "ADMIN CREDIT + PENALTY" : "ADMIN CREDIT"}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Status */}
                {(!isHistory || isHistoryRequest) && (
                    <View style={styles.statusRow}>
                        <Text style={[styles.resolvedLabel, { color: theme.muted }]}>Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg, borderColor: statusMeta.border }]}>
                            <Text style={[styles.statusBadgeText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
                        </View>
                    </View>
                )}

                {/* Footer tap hint */}
                {(!isHistory || isHistoryRequest) && (
                    <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                        <Text style={[styles.cardFooterText, { color: theme.muted }]}>Tap to view details</Text>
                        <Ionicons name="chevron-forward" size={15} color={theme.muted} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Flat Header (Matches User Header design styling) */}
            <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <Text style={[styles.headerTitleText, { color: theme.text }]}>Requests</Text>
                    <View style={[styles.agentBadge, { backgroundColor: theme.accentLight }]}>
                        <Text style={[styles.agentBadgeText, { color: theme.accent }]}>Agent</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* Tab strip */}
            <View style={[styles.tabStrip, { backgroundColor: isDark ? "#120E22" : "#FDFCFF", borderColor: theme.border }]}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tabBtn, activeTab === tab.key && { backgroundColor: theme.accent }]}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabLabel, { color: activeTab === tab.key ? "#FFFFFF" : theme.muted }]}>
                            {tab.label}
                        </Text>
                        <View style={[
                            styles.tabCount,
                            { backgroundColor: activeTab === tab.key ? "rgba(255,255,255,0.2)" : (isDark ? "#1E1638" : "#EDE9FE") }
                        ]}>
                            <Text style={[styles.tabCountText, { color: activeTab === tab.key ? "#FFFFFF" : theme.accent }]}>
                                {tab.count}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredRequests}
                renderItem={renderRequest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#7C3AED" />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <LinearGradient
                            colors={["#EDE9FE", "#DDD6FE"]}
                            style={styles.emptyIconCircle}
                        >
                            <Ionicons
                                name={activeTab === "history" ? "time-outline" : activeTab === "mint" ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                                size={28}
                                color="#7C3AED"
                            />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>
                            {activeTab === "history" ? "No history yet" : `No ${activeTab} requests`}
                        </Text>
                        <Text style={[styles.emptySub, { color: theme.muted }]}>
                            {activeTab === "history"
                                ? "Completed transactions and closed records will appear here."
                                : "New exchange requests from users will appear here."}
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        paddingTop: 10,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitleText: {
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    agentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    agentBadgeText: {
        fontSize: 10,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tabStrip: {
        flexDirection: "row",
        margin: 16,
        borderRadius: 18,
        padding: 5,
        gap: 5,
        borderWidth: 1,
    },
    tabBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 11,
        borderRadius: 13,
    },
    tabLabel: { fontSize: 13, fontWeight: "800" },
    tabCount: {
        minWidth: 22,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    tabCountText: { fontSize: 11, fontWeight: "800" },
    listContent: { paddingHorizontal: 16 },
    card: {
        borderRadius: 22,
        borderWidth: 1,
        marginBottom: 14,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardAccentBar: { height: 4, width: "100%" },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 16,
        paddingBottom: 12,
    },
    cardUserRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    cardAvatar: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    cardEyebrow: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
    cardUserName: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
    cardDate: { fontSize: 11, fontWeight: "500" },
    cardBadges: { alignItems: "flex-end", gap: 6 },
    typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    typeBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
    mintBurnBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    mintBurnBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
    amountBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        borderWidth: 1,
        padding: 12,
    },
    amountLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 },
    amountValue: { fontSize: 18, fontWeight: "800" },
    tokenChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    tokenChipText: { fontSize: 13, fontWeight: "800" },
    commissionBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
    },
    commissionLabel: { fontSize: 13, fontWeight: "700" },
    commissionValue: { fontSize: 16, fontWeight: "800" },
    resolvedBox: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 16,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    resolvedLabel: { fontSize: 13, fontWeight: "600" },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 16,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
    },
    statusBadgeText: { fontSize: 11, fontWeight: "800" },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        borderTopWidth: 1,
    },
    cardFooterText: { fontSize: 12, fontWeight: "600" },
    emptyState: { padding: 60, alignItems: "center" },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
    emptySub: { fontSize: 13, fontWeight: "500", textAlign: "center", maxWidth: 260, lineHeight: 20 },
});
