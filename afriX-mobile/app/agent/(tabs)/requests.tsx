import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { Surface } from "react-native-paper";
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
        case "proof_submitted":
            return { label: "PROOF SUBMITTED", backgroundColor: "#FEF3C7", borderColor: "#FDE68A", textColor: "#B45309" };
        case "escrowed":
            return { label: "ESCROWED", backgroundColor: "#DBEAFE", borderColor: "#BFDBFE", textColor: "#1D4ED8" };
        case "pending":
            return { label: "PENDING", backgroundColor: "#F3F4F6", borderColor: "#E5E7EB", textColor: "#4B5563" };
        case "disputed":
            return { label: "DISPUTED", backgroundColor: "#FEE2E2", borderColor: "#FECACA", textColor: "#B91C1C" };
        case "completed":
            return { label: "COMPLETED", backgroundColor: "#DCFCE7", borderColor: "#BBF7D0", textColor: "#15803D" };
        case "rejected":
            return { label: "REJECTED", backgroundColor: "#FEE2E2", borderColor: "#FECACA", textColor: "#B91C1C" };
        case "expired":
            return { label: "EXPIRED", backgroundColor: "#F3F4F6", borderColor: "#E5E7EB", textColor: "#6B7280" };
        case "cancelled":
            return { label: "CANCELLED", backgroundColor: "#F3F4F6", borderColor: "#E5E7EB", textColor: "#6B7280" };
        default:
            return {
                label: String(status || "unknown").replace(/_/g, " ").toUpperCase(),
                backgroundColor: "#F3F4F6",
                borderColor: "#E5E7EB",
                textColor: "#4B5563",
            };
    }
};

export default function AgentRequests() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { pendingRequests, history, dashboardData, fetchPendingRequests, fetchDashboard, loading } = useAgentStore();

    const [activeTab, setActiveTab] = useState<"mint" | "burn" | "history">("mint");

    const loadData = useCallback(() => {
        fetchPendingRequests();
        fetchDashboard();
    }, [fetchDashboard, fetchPendingRequests]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Keep activeTab in sync with the `tab` query param so external
    // navigations (from dashboard) can force a specific tab.
    useEffect(() => {
        const tabParam = params.tab as string | undefined;
        const nextTab: "mint" | "burn" | "history" =
            tabParam === "burn" || tabParam === "history" ? tabParam : "mint";
        setActiveTab(nextTab);
    }, [params.tab]);

    const historyItems = [
        ...((dashboardData?.recent_transactions || []).map((item: any) => ({
            ...item,
            __kind: "transaction" as const,
        }))),
        ...(history.map((item: any) => ({
            ...item,
            __kind: "request" as const,
        }))),
    ].sort(
        (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const filteredRequests = activeTab === "history"
        ? historyItems
        : pendingRequests.filter((r) => {
            // Basic type inference based on fields if type is missing
            const type = r.type || (r.bank_account ? "burn" : "mint");
            return type === activeTab;
        });
    const mintCount = pendingRequests.filter((r) => (r.type || (r.bank_account ? "burn" : "mint")) === "mint").length;
    const burnCount = pendingRequests.filter((r) => (r.type || (r.bank_account ? "burn" : "mint")) === "burn").length;
    const historyCount = historyItems.length;
    const screenTitle = activeTab === "history"
        ? "Request History"
        : activeTab === "mint"
            ? "Mint Requests"
            : "Burn Requests";
    const screenSummary = activeTab === "history"
        ? "Review completed transactions alongside rejected, expired, disputed, or otherwise closed request records."
        : activeTab === "mint"
            ? "Monitor user buy requests that still need your attention or confirmation."
            : "Handle sell requests and track those awaiting your payout process.";

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
        const cardTone = isMint
            ? { tint: "#F0FDF4", text: "#00B14F", border: "#DDF7E5", icon: "arrow-up" as const }
            : { tint: "#FFF8ED", text: "#D97706", border: "#FDE7C2", icon: "arrow-down" as const };

        return (
            <TouchableOpacity
                onPress={() =>
                    isHistoryTransaction
                        ? router.push(`/agent/transaction-details/${item.id}`)
                        : router.push(`/agent/request-details/${item.id}`)
                }
                activeOpacity={0.7}
            >
                <Surface style={styles.card}>
                    <View style={[styles.cardAccent, { backgroundColor: cardTone.text }]} />
                    <View style={styles.cardHeader}>
                        <View style={styles.userContainer}>
                            <View style={[styles.avatar, { backgroundColor: cardTone.tint, borderColor: cardTone.border }]}>
                                <Ionicons name={cardTone.icon} size={18} color={cardTone.text} />
                            </View>
                            <View>
                                <Text style={styles.eyebrow}>
                                    {isHistoryTransaction
                                        ? adminResolved
                                            ? (isMint ? "Admin Resolved Mint" : "Admin Resolved Burn")
                                            : (isMint ? "Mint Transaction" : "Burn Transaction")
                                        : isHistoryRequest
                                            ? (isMint ? "Mint Request Record" : "Burn Request Record")
                                            : (isMint ? "Pending Mint" : "Pending Burn")}
                                </Text>
                                <Text style={styles.userName}>{userName || "Unknown User"}</Text>
                                <Text style={styles.date}>
                                    {formatDate(item.created_at)}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.headerBadges}>
                            {isHistoryTransaction && (
                                <View style={styles.transactionBadge}>
                                    <Text style={styles.transactionBadgeText}>TRANSACTION</Text>
                                </View>
                            )}
                            {isHistoryRequest && (
                                <View style={styles.recordBadge}>
                                    <Text style={styles.recordBadgeText}>RECORD</Text>
                                </View>
                            )}
                            <View style={[styles.badge, { backgroundColor: cardTone.tint, borderColor: cardTone.border }]}>
                                <Text style={[styles.badgeText, { color: cardTone.text }]}>
                                    {isMint ? "MINT" : "BURN"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.amountContainer}>
                        <View>
                            <Text style={styles.amountLabel}>Amount</Text>
                            <Text style={styles.amountValue}>
                                {formatAmount(item.amount, item.token_type)} {item.token_type}
                            </Text>
                        </View>
                        <View style={styles.amountMeta}>
                            <Text style={styles.amountMetaLabel}>Token</Text>
                            <Text style={styles.amountMetaValue}>{item.token_type}</Text>
                        </View>
                    </View>

                    {isHistoryTransaction && commission != null && (
                        <View style={styles.commissionContainer}>
                            <Text style={styles.commissionLabel}>{commission.label}</Text>
                            <Text style={styles.commissionValue}>+{commission.amount} {tokenType}</Text>
                        </View>
                    )}

                    {adminResolved && (
                        <View style={styles.statusContainer}>
                            <Text style={styles.statusLabel}>Resolution</Text>
                            <View style={[styles.statusBadge, { backgroundColor: "#ECFDF3", borderColor: "#B7E4C7" }]}>
                                <Text style={[styles.statusValue, { color: "#15803D" }]}>
                                    {item.metadata?.resolution_action === "penalize_agent"
                                        ? "ADMIN CREDIT + PENALTY"
                                        : "ADMIN CREDIT"}
                                </Text>
                            </View>
                        </View>
                    )}

                    {(!isHistory || isHistoryRequest) && (
                        <View style={styles.statusContainer}>
                            <Text style={styles.statusLabel}>Status</Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor: statusMeta.backgroundColor,
                                        borderColor: statusMeta.borderColor,
                                    },
                                ]}
                            >
                                <Text style={[styles.statusValue, { color: statusMeta.textColor }]}>{statusMeta.label}</Text>
                            </View>
                        </View>
                    )}

                    {(!isHistory || isHistoryRequest) && (
                        <View style={styles.footer}>
                            <Text style={styles.actionText}>Tap to view details</Text>
                            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                        </View>
                    )}
                </Surface>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.headerButton}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Requests</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </View>

            <View style={styles.tabsContainer}>
                <LinearGradient
                    colors={["#F7FFF9", "#FFFFFF"]}
                    style={styles.summaryCard}
                >
                    <Text style={styles.summaryEyebrow}>Agent Workflow</Text>
                    <Text style={styles.summaryTitle}>{screenTitle}</Text>
                    <Text style={styles.summaryText}>{screenSummary}</Text>
                </LinearGradient>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "mint" && styles.activeTab]}
                        onPress={() => setActiveTab("mint")}
                    >
                        <View style={styles.tabInner}>
                            <Text style={[styles.tabText, activeTab === "mint" && styles.activeTabText]}>
                                Mint Requests
                            </Text>
                            <View style={[styles.tabCountBadge, activeTab === "mint" && styles.activeTabCountBadge]}>
                                <Text style={[styles.tabCountText, activeTab === "mint" && styles.activeTabCountText]}>{mintCount}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "burn" && styles.activeTab]}
                        onPress={() => setActiveTab("burn")}
                    >
                        <View style={styles.tabInner}>
                            <Text style={[styles.tabText, activeTab === "burn" && styles.activeTabText]}>
                                Burn Requests
                            </Text>
                            <View style={[styles.tabCountBadge, activeTab === "burn" && styles.activeTabCountBadge]}>
                                <Text style={[styles.tabCountText, activeTab === "burn" && styles.activeTabCountText]}>{burnCount}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "history" && styles.activeTab]}
                        onPress={() => setActiveTab("history")}
                    >
                        <View style={styles.tabInner}>
                            <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
                                History
                            </Text>
                            <View style={[styles.tabCountBadge, activeTab === "history" && styles.activeTabCountBadge]}>
                                <Text style={[styles.tabCountText, activeTab === "history" && styles.activeTabCountText]}>{historyCount}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredRequests}
                renderItem={renderRequest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#7C3AED" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons
                                name={activeTab === "history" ? "time-outline" : activeTab === "mint" ? "arrow-up-circle-outline" : "arrow-down-circle-outline"}
                                size={28}
                                color="#00B14F"
                            />
                        </View>
                        <Text style={styles.emptyText}>
                            {activeTab === "history"
                                ? "No request history yet."
                                : `No pending ${activeTab} requests.`}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {activeTab === "history"
                                ? "Completed transactions and closed request records will appear here once you start processing requests."
                                : "New agent tasks will appear here as users submit exchange requests."}
                        </Text>
                    </View>
                }
            />
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
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },
    headerSpacer: {
        width: 40,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 8,
    },
    summaryCard: {
        borderRadius: 22,
        padding: 18,
        marginTop: -34,
        marginBottom: 14,
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
    },
    tabs: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 6,
        gap: 6,
        borderWidth: 1,
        borderColor: "#EAF0F5",
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 12,
    },
    tabInner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    activeTab: {
        backgroundColor: "#00B14F",
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
    },
    activeTabText: {
        color: "#FFFFFF",
    },
    tabCountBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        paddingHorizontal: 6,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    activeTabCountBadge: {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderColor: "rgba(255,255,255,0.24)",
    },
    tabCountText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#4B5563",
    },
    activeTabCountText: {
        color: "#FFFFFF",
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
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
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    userContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
    },
    headerBadges: {
        alignItems: "flex-end",
        gap: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    recordBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    recordBadgeText: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
        color: "#6B7280",
    },
    transactionBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    transactionBadgeText: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
        color: "#2563EB",
    },
    amountContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "#FBFCFD",
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
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
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
    },
    amountMeta: {
        alignItems: "flex-end",
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
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },
    commissionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "#F0FDF4",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#D1FAE5",
    },
    commissionLabel: {
        fontSize: 14,
        color: "#059669",
        fontWeight: "600",
    },
    commissionValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#00B14F",
    },
    statusContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    statusLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    statusBadge: {
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    statusValue: {
        fontSize: 12,
        fontWeight: "700",
        color: "#4B5563",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingTop: 16,
    },
    actionText: {
        fontSize: 13,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    emptyState: {
        padding: 60,
        alignItems: "center",
    },
    emptyIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 15,
        color: "#6B7280",
        fontWeight: "700",
        textAlign: "center",
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: "#9CA3AF",
        fontWeight: "500",
        textAlign: "center",
        maxWidth: 260,
    },
});
