import { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
                        <View>
                            <Text style={styles.greeting}>Agent Dashboard</Text>
                            <Text style={styles.subGreeting}>Welcome back, {user?.full_name}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.switchButton}
                            onPress={() => router.replace("/(tabs)")}
                        >
                            <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.switchText}>User View</Text>
                        </TouchableOpacity>
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
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Pending Requests</Text>
                        <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                            {stats?.pending_requests || 0}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Available Capacity</Text>
                        <Text style={styles.statValue}>
                            ${formatAmount(stats?.available_capacity || 0, "USDT")}
                        </Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Earnings</Text>
                        <Text style={[styles.statValue, { color: "#00B14F" }]}>
                            ${formatAmount(stats?.total_earnings || 0, "USDT")}
                        </Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Minted</Text>
                        <Text style={styles.statValue}>
                            {formatAmount(stats?.total_minted || 0, "NT")}
                        </Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Burned</Text>
                        <Text style={styles.statValue}>
                            {formatAmount(stats?.total_burned || 0, "NT")}
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push("/agent/requests")}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: "#F3E8FF" }]}>
                                <Ionicons name="list" size={24} color="#7C3AED" />
                            </View>
                            <Text style={styles.actionText}>View Requests</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push("/agent/deposit")}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: "#ECFDF5" }]}>
                                <Ionicons name="wallet" size={24} color="#00B14F" />
                            </View>
                            <Text style={styles.actionText}>Deposit Funds</Text>
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
                        <View style={styles.depositList}>
                            {dashboardData.deposit_history.map((deposit: any) => (
                                <View key={deposit.id} style={styles.depositItem}>
                                    <View style={styles.depositIcon}>
                                        <Ionicons name="arrow-down" size={20} color="#00B14F" />
                                    </View>
                                    <View style={styles.depositInfo}>
                                        <Text style={styles.depositAmount}>+{formatAmount(deposit.amount, "USDT")} USDT</Text>
                                        <Text style={styles.depositDate}>
                                            {formatDate(deposit.created_at)}
                                        </Text>
                                    </View>
                                    <View style={styles.depositStatus}>
                                        <Text style={styles.depositStatusText}>Verified</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>No recent deposits</Text>
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
                        {withdrawalRequests.slice(0, 2).map((request: WithdrawalRequest) => (
                            <View key={request.id} style={styles.withdrawalCard}>
                                <View style={styles.withdrawalRow}>
                                    <View>
                                        <Text style={styles.withdrawalAmount}>${formatAmount(request.amount_usd, "USDT")}</Text>
                                        <Text style={styles.withdrawalDate}>
                                            {formatDate(request.created_at)}
                                        </Text>
                                    </View>
                                    <View style={[styles.statusBadge, {
                                        backgroundColor:
                                            request.status === 'pending' ? '#FEF3C7' :
                                                request.status === 'paid' ? '#DCFCE7' :
                                                    request.status === 'rejected' ? '#FEE2E2' : '#DBEAFE'
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
                            </View>
                        ))}
                    </View>
                )}

                {/* Performance Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Performance Summary</Text>
                    </View>
                    <View style={styles.performanceCard}>
                        <View style={styles.performanceRow}>
                            <View style={styles.performanceItem}>
                                <Ionicons name="star" size={20} color="#F59E0B" />
                                <Text style={styles.performanceLabel}>Rating</Text>
                                <Text style={styles.performanceValue}>{dashboardData?.agent?.rating || "5.0"}</Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <Ionicons name="time" size={20} color="#7C3AED" />
                                <Text style={styles.performanceLabel}>Avg Response</Text>
                                <Text style={styles.performanceValue}>{dashboardData?.performance?.response_time || "5"} min</Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#00B14F" />
                                <Text style={styles.performanceLabel}>Success Rate</Text>
                                <Text style={styles.performanceValue}>{dashboardData?.performance?.success_rate || "100%"}</Text>
                            </View>
                        </View>
                        <View style={styles.performanceRow}>
                            <View style={styles.performanceItem}>
                                <Ionicons name="swap-horizontal" size={20} color="#3B82F6" />
                                <Text style={styles.performanceLabel}>Transactions</Text>
                                <Text style={styles.performanceValue}>{dashboardData?.performance?.total_transactions || "0"}</Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <Ionicons name="chatbubbles" size={20} color="#8B5CF6" />
                                <Text style={styles.performanceLabel}>Reviews</Text>
                                <Text style={styles.performanceValue}>{dashboardData?.performance?.total_reviews || "0"}</Text>
                            </View>
                            <View style={styles.performanceItem} />
                        </View>
                    </View>
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
                        <View style={styles.transactionList}>
                            {dashboardData.recent_transactions.slice(0, 5).map((tx: any) => {
                                const isMint = tx.type === 'mint';
                                const userName = isMint ? tx.toUser?.full_name : tx.fromUser?.full_name;
                                const commission = (parseFloat(tx.amount) * 0.01).toFixed(2);

                                return (
                                    <View key={tx.id} style={styles.transactionItem}>
                                        <View style={[styles.transactionIcon, { backgroundColor: isMint ? "#ECFDF5" : "#FEF3C7" }]}>
                                            <Ionicons
                                                name={isMint ? "arrow-up" : "arrow-down"}
                                                size={20}
                                                color={isMint ? "#00B14F" : "#F59E0B"}
                                            />
                                        </View>
                                        <View style={styles.transactionInfo}>
                                            <Text style={styles.transactionType}>{isMint ? "Mint" : "Burn"} - {userName}</Text>
                                            <Text style={styles.transactionDate}>
                                                {formatDate(tx.created_at)}
                                            </Text>
                                        </View>
                                        <View style={styles.transactionAmounts}>
                                            <Text style={styles.transactionAmount}>{formatAmount(tx.amount, tx.token_type)} {tx.token_type}</Text>
                                            <Text style={styles.transactionCommission}>+${formatAmount(commission, "USDT")} earned</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>No recent transactions</Text>
                    )}
                </View>
            </ScrollView>
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
        height: 140,
        // borderBottomLeftRadius: 30,
        // borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 20,
        marginTop: 10,
    },
    greeting: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    subGreeting: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
    },
    switchButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        marginTop: 30,

    },
    switchText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    content: {
        padding: 16,
    },
    statsGrid: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: "white",
        padding: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 8,
        fontWeight: "500",
    },
    statValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    viewAllText: {
        fontSize: 14,
        color: "#7C3AED",
        fontWeight: "600",
    },
    withdrawalCard: {
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    withdrawalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    withdrawalAmount: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#111827",
    },
    withdrawalDate: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 2,
    },
    statusBadge: {
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#D97706",
    },
    actionGrid: {
        flexDirection: "row",
        gap: 16,
    },
    actionButton: {
        flex: 1,
        backgroundColor: "white",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
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
        color: "#374151",
    },
    transactionList: {
        gap: 12,
    },
    transactionItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    transactionInfo: {
        flex: 1,
    },
    transactionType: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: "#6B7280",
    },
    transactionAmounts: {
        alignItems: "flex-end",
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    transactionCommission: {
        fontSize: 12,
        color: "#00B14F",
        fontWeight: "500",
    },
    performanceCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    performanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    performanceItem: {
        flex: 1,
        alignItems: "center",
        gap: 8,
    },
    performanceLabel: {
        fontSize: 12,
        color: "#6B7280",
        textAlign: "center",
    },
    performanceValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    // sectionHeader: {
    //     flexDirection: "row",
    //     justifyContent: "space-between",
    //     alignItems: "center",
    //     marginBottom: 16,
    // },
    // viewAllText: {
    //     fontSize: 14,
    //     color: "#7C3AED",
    //     fontWeight: "600",
    // },
    depositList: {
        gap: 12,
    },
    depositItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    depositIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
    },
    depositInfo: {
        flex: 1,
    },
    depositAmount: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    depositDate: {
        fontSize: 12,
        color: "#6B7280",
    },
    depositStatus: {
        backgroundColor: "#ECFDF5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    depositStatusText: {
        fontSize: 12,
        color: "#00B14F",
        fontWeight: "600",
    },
    emptyText: {
        fontSize: 14,
        color: "#9CA3AF",
        textAlign: "center",
        paddingVertical: 24,
    },
});
