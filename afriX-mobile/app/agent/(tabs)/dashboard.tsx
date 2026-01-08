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

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Surface style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: "#FFFBEB" }]}>
                            <Ionicons name="time-outline" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.statLabel}>Pending Requests</Text>
                        <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                            {stats?.pending_requests || 0}
                        </Text>
                    </Surface>
                    <Surface style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: "#F0FDF4" }]}>
                            <Ionicons name="wallet-outline" size={20} color="#00B14F" />
                        </View>
                        <Text style={styles.statLabel}>Available Capacity</Text>
                        <Text style={styles.statValue}>
                            ${formatAmount(stats?.available_capacity || 0, "USDT")}
                        </Text>
                    </Surface>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Surface style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: "#F0FDF4" }]}>
                            <Ionicons name="cash-outline" size={20} color="#00B14F" />
                        </View>
                        <Text style={styles.statLabel}>Total Earnings</Text>
                        <Text style={[styles.statValue, { color: "#00B14F" }]}>
                            ${formatAmount(stats?.total_earnings || 0, "USDT")}
                        </Text>
                    </Surface>
                    <Surface style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: "#EFF6FF" }]}>
                            <Ionicons name="arrow-up-circle-outline" size={20} color="#3B82F6" />
                        </View>
                        <Text style={styles.statLabel}>Total Minted</Text>
                        <Text style={styles.statValue}>
                            {formatAmount(stats?.total_minted || 0, "NT")}
                        </Text>
                    </Surface>
                </View>

                {/* Single Stat Card */}
                <View style={styles.statsGrid}>
                    <Surface style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: "#FEF2F2" }]}>
                            <Ionicons name="arrow-down-circle-outline" size={20} color="#EF4444" />
                        </View>
                        <Text style={styles.statLabel}>Total Burned</Text>
                        <Text style={styles.statValue}>
                            {formatAmount(stats?.total_burned || 0, "NT")}
                        </Text>
                    </Surface>
                    <View style={{ flex: 1 }} />
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push("/agent/requests")}
                            activeOpacity={0.7}
                        >
                            <Surface style={styles.actionSurface}>
                                <View style={[styles.actionIcon, { backgroundColor: "#F5F3FF" }]}>
                                    <Ionicons name="list" size={24} color="#7C3AED" />
                                </View>
                                <Text style={styles.actionText}>View Requests</Text>
                            </Surface>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push("/agent/deposit")}
                            activeOpacity={0.7}
                        >
                            <Surface style={styles.actionSurface}>
                                <View style={[styles.actionIcon, { backgroundColor: "#F0FDF4" }]}>
                                    <Ionicons name="wallet" size={24} color="#00B14F" />
                                </View>
                                <Text style={styles.actionText}>Deposit Funds</Text>
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
                            {dashboardData.deposit_history.map((deposit: any, index: number) => (
                                <View key={deposit.id}>
                                    <View style={styles.listItem}>
                                        <View style={[styles.listItemIcon, { backgroundColor: "#F0FDF4" }]}>
                                            <Ionicons name="arrow-down" size={20} color="#00B14F" />
                                        </View>
                                        <View style={styles.listItemInfo}>
                                            <Text style={styles.listItemAmount}>+{formatAmount(deposit.amount, "USDT")} USDT</Text>
                                            <Text style={styles.listItemDate}>
                                                {formatDate(deposit.created_at)}
                                            </Text>
                                        </View>
                                        <View style={styles.depositStatus}>
                                            <Text style={styles.depositStatusText}>Verified</Text>
                                        </View>
                                    </View>
                                    {index < dashboardData.deposit_history.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </Surface>
                    ) : (
                        <Surface style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No recent deposits</Text>
                        </Surface>
                    )}
                </View>

                {/* Recent Withdrawals Summary */}
                {withdrawalRequests.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Withdrawals</Text>
                            <TouchableOpacity onPress={() => router.push("/agent/withdrawal-history")}>
                                <Text style={styles.viewAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <Surface style={styles.listCard}>
                            {withdrawalRequests.slice(0, 2).map((request: WithdrawalRequest, index: number) => (
                                <View key={request.id}>
                                    <View style={styles.listItem}>
                                        <View style={[styles.listItemIcon, { backgroundColor: "#FEF2F2" }]}>
                                            <Ionicons name="arrow-up" size={20} color="#EF4444" />
                                        </View>
                                        <View style={styles.listItemInfo}>
                                            <Text style={styles.listItemAmount}>${formatAmount(request.amount_usd, "USDT")}</Text>
                                            <Text style={styles.listItemDate}>
                                                {formatDate(request.created_at)}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, {
                                            backgroundColor:
                                                request.status === 'pending' ? '#FFFBEB' :
                                                    request.status === 'paid' ? '#F0FDF4' :
                                                        request.status === 'rejected' ? '#FEF2F2' : '#EFF6FF'
                                        }]}>
                                            <Text style={[styles.statusText, {
                                                color:
                                                    request.status === 'pending' ? '#D97706' :
                                                        request.status === 'paid' ? '#00B14F' :
                                                            request.status === 'rejected' ? '#EF4444' : '#3B82F6'
                                            }]}>
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                    {index < Math.min(withdrawalRequests.length, 2) - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </Surface>
                    </View>
                )}

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
                        <TouchableOpacity onPress={() => router.push("/agent/requests")}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
                        <Surface style={styles.listCard}>
                            {dashboardData.recent_transactions.slice(0, 5).map((tx: any, index: number) => {
                                const isMint = tx.type === 'mint';
                                const userName = isMint ? tx.toUser?.full_name : tx.fromUser?.full_name;
                                const commission = (parseFloat(tx.amount) * 0.01).toFixed(2);

                                return (
                                    <View key={tx.id}>
                                        <View style={styles.listItem}>
                                            <View style={[styles.listItemIcon, { backgroundColor: isMint ? "#F0FDF4" : "#FFFBEB" }]}>
                                                <Ionicons
                                                    name={isMint ? "arrow-up" : "arrow-down"}
                                                    size={20}
                                                    color={isMint ? "#00B14F" : "#F59E0B"}
                                                />
                                            </View>
                                            <View style={styles.listItemInfo}>
                                                <Text style={styles.listItemType}>{isMint ? "Mint" : "Burn"} - {userName}</Text>
                                                <Text style={styles.listItemDate}>
                                                    {formatDate(tx.created_at)}
                                                </Text>
                                            </View>
                                            <View style={styles.listItemAmounts}>
                                                <Text style={styles.listItemAmountValue}>{formatAmount(tx.amount, tx.token_type)} {tx.token_type}</Text>
                                                <Text style={styles.transactionCommission}>+${formatAmount(commission, "USDT")} earned</Text>
                                            </View>
                                        </View>
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
        paddingTop: 40,
    },
    statsGrid: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
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
    viewAllText: {
        fontSize: 14,
        color: "#00B14F",
        fontWeight: "600",
    },
    actionGrid: {
        flexDirection: "row",
        gap: 16,
    },
    actionButton: {
        flex: 1,
    },
    actionSurface: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    actionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    listCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        overflow: "hidden",
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
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#F3F4F6",
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
        borderRadius: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F3F4F6",
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
