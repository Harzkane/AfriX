import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { WithdrawalRequest } from "@/stores/types/agent.types";
import { formatAmount, formatDate } from "@/utils/format";

const getCommissionPresentation = (tx: any, tokenType: string) => {
    const rawAmount = tx.agent_commission ?? tx.fee_amount ?? tx.fee ?? 0;
    const amount = formatAmount(rawAmount, tokenType);
    const label = tx.fee_kind === "agent_commission"
        ? (tx.fee_label || "Agent Commission")
        : "Commission earned";

    return { amount, label };
};

export default function AgentDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { stats, dashboardData, fetchAgentStats, fetchDashboard, fetchPendingRequests, fetchWithdrawalRequests, withdrawalRequests, loading } = useAgentStore();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([fetchAgentStats(), fetchDashboard(), fetchPendingRequests(), fetchWithdrawalRequests()]);
    };

    const getDepositStatusMeta = (status?: string) => {
        switch ((status || "").toLowerCase()) {
            case "completed":
            case "verified":
                return {
                    label: "Verified",
                    backgroundColor: "#F0FDF4",
                    textColor: "#00B14F",
                };
            case "pending":
                return {
                    label: "Pending",
                    backgroundColor: "#FFFBEB",
                    textColor: "#D97706",
                };
            case "failed":
            case "rejected":
                return {
                    label: "Rejected",
                    backgroundColor: "#FEF2F2",
                    textColor: "#EF4444",
                };
            default:
                return {
                    label: "Processing",
                    backgroundColor: "#EFF6FF",
                    textColor: "#3B82F6",
                };
        }
    };

    const totalEarningsUsdt = dashboardData?.financials?.total_earnings_usdt ?? 0;
    const availableCapacityUsdt = dashboardData?.financials?.available_capacity ?? stats?.available_capacity ?? 0;
    const pendingRequestsCount = stats?.pending_requests || 0;
    const totalMintedUsdt = dashboardData?.financials?.total_minted_usdt ?? 0;
    const totalBurnedUsdt = dashboardData?.financials?.total_burned_usdt ?? 0;

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <View>
                                <Text style={styles.greeting}>Agent Dashboard</Text>
                                <Text style={styles.subGreeting}>Welcome back, {user?.full_name}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.switchButton}
                                onPress={() => router.replace("/(tabs)")}
                            >
                                <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
                                <Text style={styles.switchText}>Switch to User</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#FFFFFF" />
                }
            >
                <LinearGradient
                    colors={["#0E7A43", "#00B14F", "#26C26A"]}
                    start={{ x: 1, y: 0.5 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroBadge}>
                            <Ionicons name="sparkles" size={14} color="#E9FFE7" />
                            <Text style={styles.heroBadgeText}>Live Agent Snapshot</Text>
                        </View>
                        <Text style={styles.heroPendingText}>{pendingRequestsCount} pending</Text>
                    </View>
                    <Text style={styles.heroLabel}>Total Earnings</Text>
                    <Text style={styles.heroValue}>
                        {formatAmount(totalEarningsUsdt, "USDT")} USDT
                    </Text>
                    <Text style={styles.heroSubtext}>
                        Combined commission performance across your completed mint and burn activity.
                    </Text>
                    <View style={styles.heroStatsRow}>
                        <View style={styles.heroStatBlock}>
                            <Text style={styles.heroStatCaption}>Capacity</Text>
                            <Text style={styles.heroStatValue}>{formatAmount(availableCapacityUsdt, "USDT")} USDT</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroStatBlock}>
                            <Text style={styles.heroStatCaption}>Success Rate</Text>
                            <Text style={styles.heroStatValue}>{dashboardData?.performance?.success_rate || "100%"}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.insightRow}>
                    <Surface style={styles.insightCard}>
                        <View style={[styles.insightIcon, { backgroundColor: "#FFFBEB" }]}>
                            <Ionicons name="time-outline" size={18} color="#D97706" />
                        </View>
                        <Text style={styles.insightLabel}>Pending Requests</Text>
                        <Text style={[styles.insightValue, { color: "#B45309" }]}>{pendingRequestsCount}</Text>
                    </Surface>
                    <Surface style={styles.insightCard}>
                        <View style={[styles.insightIcon, { backgroundColor: "#EFF6FF" }]}>
                            <Ionicons name="analytics-outline" size={18} color="#2563EB" />
                        </View>
                        <Text style={styles.insightLabel}>Net Activity</Text>
                        <Text style={styles.insightValue}>
                            {formatAmount(totalMintedUsdt - totalBurnedUsdt, "USDT")} USDT
                        </Text>
                    </Surface>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>Quick Actions</Text>
                    <View style={styles.actionStack}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push({ pathname: "/agent/requests", params: { tab: "mint" } })}
                            activeOpacity={0.7}
                        >
                            <Surface style={styles.actionSurface}>
                                <View style={styles.actionMain}>
                                    <View style={[styles.actionIcon, { backgroundColor: "#F5F3FF" }]}>
                                        <Ionicons name="list" size={22} color="#7C3AED" />
                                    </View>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionText}>Review Requests</Text>
                                        <Text style={styles.actionSubtext}>Process incoming mint and burn tasks quickly.</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                            </Surface>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push("/agent/deposit")}
                            activeOpacity={0.7}
                        >
                            <Surface style={styles.actionSurface}>
                                <View style={styles.actionMain}>
                                    <View style={[styles.actionIcon, { backgroundColor: "#F0FDF4" }]}>
                                        <Ionicons name="wallet" size={22} color="#00B14F" />
                                    </View>
                                    <View style={styles.actionContent}>
                                        <Text style={styles.actionText}>Deposit Funds</Text>
                                        <Text style={styles.actionSubtext}>Top up your float and keep exchange capacity healthy.</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                            </Surface>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Deposits */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Deposits</Text>
                        <TouchableOpacity onPress={() => router.push("/agent/deposit-history")}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {dashboardData?.deposit_history && dashboardData.deposit_history.length > 0 ? (
                        <Surface style={styles.listCard}>
                            <View style={styles.listIntro}>
                                <Text style={styles.listIntroTitle}>Latest funding activity</Text>
                                <Text style={styles.listIntroText}>Recent top-ups to your working balance and their verification state.</Text>
                            </View>
                            {dashboardData.deposit_history.map((deposit: any, index: number) => {
                                const depositStatus = getDepositStatusMeta(deposit.status);
                                return (
                                <TouchableOpacity
                                    key={deposit.id}
                                    activeOpacity={0.7}
                                    onPress={() => router.push("/agent/deposit-history")}
                                >
                                    <View>
                                        <View style={styles.listItem}>
                                            <View style={[styles.listItemIcon, { backgroundColor: "#F0FDF4" }]}>
                                                <Ionicons name="arrow-down" size={20} color="#00B14F" />
                                            </View>
                                            <View style={styles.listItemInfo}>
                                                <Text style={styles.listItemEyebrow}>Deposit</Text>
                                                <Text style={styles.listItemAmount}>+{formatAmount(deposit.amount, "USDT")} USDT</Text>
                                                <Text style={styles.listItemDate}>
                                                    {formatDate(deposit.created_at)}
                                                </Text>
                                            </View>
                                            <View style={[styles.depositStatus, { backgroundColor: depositStatus.backgroundColor }]}>
                                                <Text style={[styles.depositStatusText, { color: depositStatus.textColor }]}>
                                                    {depositStatus.label}
                                                </Text>
                                            </View>
                                        </View>
                                        {index < dashboardData.deposit_history.length - 1 && <View style={styles.divider} />}
                                    </View>
                                </TouchableOpacity>
                                );
                            })}
                        </Surface>
                    ) : (
                        <Surface style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No recent deposits</Text>
                        </Surface>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, styles.sectionTitleStandalone]}>Token Performance</Text>
                    <Surface style={styles.tokenPanel}>
                        <View style={styles.tokenBlock}>
                            <View style={[styles.tokenCard, styles.tokenCardPositive]}>
                            <View style={styles.tokenBlockHeader}>
                                <View>
                                    <Text style={styles.tokenSectionLabel}>Earnings</Text>
                                    <Text style={styles.tokenPanelHint}>Commission by token</Text>
                                </View>
                                <View style={[styles.tokenHeaderIcon, { backgroundColor: "#ECFDF5" }]}>
                                    <Ionicons name="cash-outline" size={18} color="#059669" />
                                </View>
                            </View>
                            <View style={styles.tokenRows}>
                                <View style={styles.tokenRow}>
                                    <Text style={styles.tokenCode}>NT</Text>
                                    <View style={styles.tokenAmounts}>
                                        <Text style={styles.tokenPrimaryValue}>
                                            {formatAmount((dashboardData?.financials?.total_earnings_by_token as Record<string, number>)?.NT ?? 0, "NT")} NT
                                        </Text>
                                        <Text style={styles.tokenSecondaryValue}>
                                            About {formatAmount((dashboardData?.financials?.total_earnings_by_token_usdt as Record<string, number>)?.NT ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.tokenRowDivider} />
                                <View style={styles.tokenRow}>
                                    <Text style={styles.tokenCode}>CT</Text>
                                    <View style={styles.tokenAmounts}>
                                        <Text style={styles.tokenPrimaryValue}>
                                            {formatAmount((dashboardData?.financials?.total_earnings_by_token as Record<string, number>)?.CT ?? 0, "CT")} CT
                                        </Text>
                                        <Text style={styles.tokenSecondaryValue}>
                                            About {formatAmount((dashboardData?.financials?.total_earnings_by_token_usdt as Record<string, number>)?.CT ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            </View>
                        </View>

                        <View style={styles.tokenBlock}>
                            <View style={[styles.tokenCard, styles.tokenCardInfo]}>
                            <View style={styles.tokenBlockHeader}>
                                <View>
                                    <Text style={styles.tokenSectionLabel}>Minted</Text>
                                    <Text style={styles.tokenPanelHint}>Issued to users</Text>
                                </View>
                                <View style={[styles.tokenHeaderIcon, { backgroundColor: "#EFF6FF" }]}>
                                    <Ionicons name="arrow-up-circle-outline" size={18} color="#2563EB" />
                                </View>
                            </View>
                            <View style={styles.tokenRows}>
                                <View style={styles.tokenRow}>
                                    <Text style={styles.tokenCode}>NT</Text>
                                    <View style={styles.tokenAmounts}>
                                        <Text style={styles.tokenPrimaryValue}>
                                            {formatAmount((dashboardData?.financials?.total_minted_by_token as Record<string, number>)?.NT ?? 0, "NT")} NT
                                        </Text>
                                        <Text style={styles.tokenSecondaryValue}>
                                            About {formatAmount((dashboardData?.financials?.total_minted_by_token_usdt as Record<string, number>)?.NT ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.tokenRowDivider} />
                                <View style={styles.tokenRow}>
                                    <Text style={styles.tokenCode}>CT</Text>
                                    <View style={styles.tokenAmounts}>
                                        <Text style={styles.tokenPrimaryValue}>
                                            {formatAmount((dashboardData?.financials?.total_minted_by_token as Record<string, number>)?.CT ?? 0, "CT")} CT
                                        </Text>
                                        <Text style={styles.tokenSecondaryValue}>
                                            About {formatAmount((dashboardData?.financials?.total_minted_by_token_usdt as Record<string, number>)?.CT ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            </View>
                        </View>

                        <View style={styles.tokenBlockLast}>
                            <View style={[styles.tokenCard, styles.tokenCardDanger]}>
                            <View style={styles.tokenBlockHeader}>
                                <View>
                                    <Text style={styles.tokenSectionLabel}>Burned</Text>
                                    <Text style={styles.tokenPanelHint}>Redeemed from users</Text>
                                </View>
                                <View style={[styles.tokenHeaderIcon, { backgroundColor: "#FEF2F2" }]}>
                                    <Ionicons name="arrow-down-circle-outline" size={18} color="#DC2626" />
                                </View>
                            </View>
                            <View style={styles.tokenRows}>
                                <View style={styles.tokenRow}>
                                    <Text style={styles.tokenCode}>NT</Text>
                                    <View style={styles.tokenAmounts}>
                                        <Text style={styles.tokenPrimaryValue}>
                                            {formatAmount((dashboardData?.financials?.total_burned_by_token as Record<string, number>)?.NT ?? 0, "NT")} NT
                                        </Text>
                                        <Text style={styles.tokenSecondaryValue}>
                                            About {formatAmount((dashboardData?.financials?.total_burned_by_token_usdt as Record<string, number>)?.NT ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.tokenRowDivider} />
                                <View style={styles.tokenRow}>
                                    <Text style={styles.tokenCode}>CT</Text>
                                    <View style={styles.tokenAmounts}>
                                        <Text style={styles.tokenPrimaryValue}>
                                            {formatAmount((dashboardData?.financials?.total_burned_by_token as Record<string, number>)?.CT ?? 0, "CT")} CT
                                        </Text>
                                        <Text style={styles.tokenSecondaryValue}>
                                            About {formatAmount((dashboardData?.financials?.total_burned_by_token_usdt as Record<string, number>)?.CT ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            </View>
                        </View>
                    </Surface>
                </View>

                {/* Recent Withdrawals Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Withdrawals</Text>
                        <TouchableOpacity onPress={() => router.push("/agent/withdrawal-history")}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {withdrawalRequests.length > 0 ? (
                        <Surface style={styles.listCard}>
                            <View style={styles.listIntro}>
                                <Text style={styles.listIntroTitle}>Payout requests</Text>
                                <Text style={styles.listIntroText}>Track cash-out requests as they move from review to payment.</Text>
                            </View>
                            {withdrawalRequests.slice(0, 2).map((request: WithdrawalRequest, index: number) => (
                                <TouchableOpacity
                                    key={request.id}
                                    activeOpacity={0.7}
                                    onPress={() => router.push("/agent/withdrawal-history")}
                                >
                                    <View>
                                        <View style={styles.listItem}>
                                            <View style={[styles.listItemIcon, { backgroundColor: "#FEF2F2" }]}>
                                                <Ionicons name="arrow-up" size={20} color="#EF4444" />
                                            </View>
                                            <View style={styles.listItemInfo}>
                                                <Text style={styles.listItemEyebrow}>Withdrawal</Text>
                                                <Text style={styles.listItemAmount}>{formatAmount(request.amount_usd, "USDT")} USDT</Text>
                                                <Text style={styles.listItemDate}>
                                                    {formatDate(request.created_at)}
                                                </Text>
                                            </View>
                                            <View style={[styles.statusBadge, {
                                                backgroundColor:
                                                    request.status === "pending" ? "#FFFBEB" :
                                                        request.status === "paid" ? "#F0FDF4" :
                                                            request.status === "rejected" ? "#FEF2F2" : "#EFF6FF"
                                            }]}>
                                                <Text style={[styles.statusText, {
                                                    color:
                                                        request.status === "pending" ? "#D97706" :
                                                            request.status === "paid" ? "#00B14F" :
                                                                request.status === "rejected" ? "#EF4444" : "#3B82F6"
                                                }]}>
                                                    {request.status === "approved" ? "Approved" : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                        {index < Math.min(withdrawalRequests.length, 2) - 1 && <View style={styles.divider} />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </Surface>
                    ) : (
                        <Surface style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No withdrawal requests</Text>
                        </Surface>
                    )}
                </View>

                {/* Performance Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Performance Summary</Text>
                    </View>
                    <Surface style={styles.performanceCard}>
                        <View style={styles.performanceRow}>
                            <View style={styles.performanceItem}>
                                <View style={[styles.perfIconWrapper, { backgroundColor: "#FFFBEB" }]}>
                                    <Ionicons name="star" size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.performanceLabel}>Rating</Text>
                                <Text style={styles.performanceValue}>{dashboardData?.agent?.rating || "5.0"}</Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={[styles.perfIconWrapper, { backgroundColor: "#F5F3FF" }]}>
                                    <Ionicons name="time" size={20} color="#7C3AED" />
                                </View>
                                <Text style={styles.performanceLabel}>Avg Response</Text>
                                <Text style={styles.performanceValue}>{dashboardData?.performance?.response_time || "5"} min</Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={[styles.perfIconWrapper, { backgroundColor: "#F0FDF4" }]}>
                                    <Ionicons name="checkmark-circle" size={20} color="#00B14F" />
                                </View>
                                <Text style={styles.performanceLabel}>Success Rate</Text>
                                <Text style={styles.performanceValue}>{dashboardData?.performance?.success_rate || "100%"}</Text>
                            </View>
                        </View>
                    </Surface>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Transactions</Text>
                        <TouchableOpacity onPress={() => router.push({ pathname: "/agent/requests", params: { tab: "history" } })}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
                        <Surface style={styles.listCard}>
                            <View style={styles.listIntro}>
                                <Text style={styles.listIntroTitle}>Agent exchange activity</Text>
                                <Text style={styles.listIntroText}>Your most recent mint and burn transactions with earned commission context.</Text>
                            </View>
                            {dashboardData.recent_transactions.slice(0, 5).map((tx: any, index: number) => {
                                const isMint = tx.type === 'mint';
                                const userName = isMint ? tx.toUser?.full_name : tx.fromUser?.full_name;
                                const tokenType = tx.token_type || "NT";
                                const commission = getCommissionPresentation(tx, tokenType);

                                return (
                                    <View key={tx.id}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => router.push(`/agent/transaction-details/${tx.id}`)}
                                        >
                                            <View style={styles.listItem}>
                                            <View style={[styles.listItemIcon, { backgroundColor: isMint ? "#F0FDF4" : "#FFFBEB" }]}>
                                                <Ionicons
                                                    name={isMint ? "arrow-up" : "arrow-down"}
                                                    size={20}
                                                    color={isMint ? "#00B14F" : "#F59E0B"}
                                                />
                                            </View>
                                            <View style={styles.listItemInfo}>
                                                <Text style={styles.listItemEyebrow}>{isMint ? "Mint Transaction" : "Burn Transaction"}</Text>
                                                <Text style={styles.listItemType}>{userName}</Text>
                                                <Text style={styles.listItemDate}>
                                                    {formatDate(tx.created_at)}
                                                </Text>
                                                </View>
                                                <View style={styles.listItemAmounts}>
                                                    <Text style={styles.listItemAmountValue}>{formatAmount(tx.amount, tx.token_type)} {tx.token_type}</Text>
                                                    <Text style={styles.transactionCommission}>+{commission.amount} {tokenType} {commission.label.toLowerCase()}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                        {index < Math.min(dashboardData.recent_transactions.length, 5) - 1 && <View style={styles.divider} />}
                                    </View>
                                );
                            })}
                        </Surface>
                    ) : (
                        <Surface style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No recent transactions</Text>
                        </Surface>
                    )}
                </View>

                <View style={styles.bottomSpacer} />
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
        height: 150,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    header: {
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.9)",
        fontWeight: "500",
        marginTop: 2,
    },
    switchButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    switchText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    content: {
        padding: 20,
        paddingTop: 28,
    },
    heroCard: {
        borderRadius: 28,
        padding: 22,
        marginBottom: 16,
        shadowColor: "#0B7A42",
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 12 },
        elevation: 6,
    },
    heroTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },
    heroBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.16)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    heroBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#F0FFF4",
    },
    heroPendingText: {
        fontSize: 12,
        fontWeight: "700",
        color: "rgba(255,255,255,0.92)",
    },
    heroLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "rgba(255,255,255,0.84)",
        marginBottom: 6,
    },
    heroValue: {
        fontSize: 31,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: -0.8,
    },
    heroSubtext: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 20,
        color: "rgba(255,255,255,0.84)",
        maxWidth: "88%",
    },
    heroStatsRow: {
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    heroStatBlock: {
        flex: 1,
    },
    heroDivider: {
        width: 1,
        alignSelf: "stretch",
        backgroundColor: "rgba(255,255,255,0.16)",
        marginHorizontal: 14,
    },
    heroStatCaption: {
        fontSize: 11,
        fontWeight: "700",
        color: "rgba(255,255,255,0.72)",
        marginBottom: 5,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    heroStatValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    insightRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    insightCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#EEF2F7",
    },
    insightIcon: {
        width: 34,
        height: 34,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    insightLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
        marginBottom: 4,
    },
    insightValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    tokenSectionLabel: {
        fontSize: 12,
        fontWeight: "800",
        color: "#4B5563",
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    section: {
        marginTop: 12,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: -0.3,
    },
    sectionTitleStandalone: {
        marginBottom: 12,
    },
    viewAllText: {
        fontSize: 14,
        color: "#00B14F",
        fontWeight: "600",
    },
    tokenPanel: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#EEF2F7",
        padding: 18,
    },
    tokenBlock: {
        paddingBottom: 18,
        marginBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    tokenBlockLast: {
        paddingBottom: 0,
        marginBottom: 0,
    },
    tokenCard: {
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
    },
    tokenCardPositive: {
        backgroundColor: "#F8FFFA",
        borderColor: "#DDF7E5",
    },
    tokenCardInfo: {
        backgroundColor: "#F8FBFF",
        borderColor: "#DCEAFD",
    },
    tokenCardDanger: {
        backgroundColor: "#FFF8F8",
        borderColor: "#F8DADA",
    },
    tokenBlockHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    tokenPanelHint: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
        marginTop: 3,
    },
    tokenHeaderIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    tokenRows: {
        gap: 10,
    },
    tokenRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
    },
    tokenRowDivider: {
        height: 1,
        backgroundColor: "#F3F4F6",
    },
    tokenCode: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
        minWidth: 34,
    },
    tokenAmounts: {
        flex: 1,
        alignItems: "flex-end",
    },
    tokenPrimaryValue: {
        fontSize: 17,
        fontWeight: "800",
        color: "#111827",
    },
    tokenSecondaryValue: {
        fontSize: 11,
        color: "#7C8798",
        fontWeight: "500",
        marginTop: 3,
    },
    actionStack: {
        gap: 12,
    },
    actionButton: {
        width: "100%",
    },
    actionSurface: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 22,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EEF2F7",
    },
    actionMain: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    actionIcon: {
        width: 46,
        height: 46,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    actionContent: {
        flex: 1,
    },
    actionText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
    },
    actionSubtext: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
        marginTop: 4,
        lineHeight: 18,
    },
    listCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#EEF2F7",
        overflow: "hidden",
    },
    listIntro: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: "#FBFCFD",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    listIntroTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },
    listIntroText: {
        fontSize: 12,
        lineHeight: 18,
        color: "#6B7280",
        fontWeight: "500",
        marginTop: 4,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 12,
    },
    listItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    listItemInfo: {
        flex: 1,
    },
    listItemEyebrow: {
        fontSize: 11,
        color: "#6B7280",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 4,
    },
    listItemAmount: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 2,
    },
    listItemType: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 2,
    },
    listItemDate: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },
    listItemAmounts: {
        alignItems: "flex-end",
    },
    listItemAmountValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 2,
    },
    transactionCommission: {
        fontSize: 12,
        color: "#00B14F",
        fontWeight: "600",
    },
    depositStatus: {
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    depositStatusText: {
        fontSize: 11,
        color: "#00B14F",
        fontWeight: "700",
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
    },
    performanceCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#EEF2F7",
        padding: 20,
    },
    performanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    performanceItem: {
        flex: 1,
        alignItems: "center",
        gap: 8,
    },
    perfIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    performanceLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
        textAlign: "center",
    },
    performanceValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginHorizontal: 16,
    },
    emptyCard: {
        backgroundColor: "#FFFFFF",
        padding: 30,
        borderRadius: 24,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#EEF2F7",
    },
    emptyText: {
        fontSize: 14,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    bottomSpacer: {
        height: 100,
    },
});
