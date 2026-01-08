// app/transactions/index.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { formatDate } from "@/utils/format";

interface Transaction {
    id: string;
    reference: string;
    type: string;
    status: string;
    amount: string;
    token_type: string;
    description: string;
    created_at: string;
    metadata?: {
        request_id?: string;
        bank_reference?: string;
        [key: string]: any;
    };
    agent?: {
        id: string;
        tier: string;
        rating: number;
        user?: {
            full_name: string;
        };
    };
}

export default function TransactionHistoryScreen() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pendingReviews, setPendingReviews] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "mint" | "burn">("all");

    const fetchTransactions = async () => {
        try {
            setLoading(true);

            // Fetch all transactions
            const { data: txData } = await apiClient.get("/transactions");
            const allTx = txData.data.transactions || [];

            // Fetch pending reviews (these have agent data)
            const { data: reviewData } = await apiClient.get("/transactions/pending-review");
            const pendingTx = reviewData.data.transactions || [];

            console.log("📊 API_ENDPOINTS.REQUESTS.USER:", API_ENDPOINTS.REQUESTS.USER);
            // Fetch user requests (pending mint/burn)
            const { data: requestData } = await apiClient.get(API_ENDPOINTS.REQUESTS.USER);
            const requests = requestData.data || [];
            console.log("📊 Fetched Requests:", requests.length);

            // Filter requests to only show pending/active ones
            const activeRequests = requests.filter((r: any) =>
                !["confirmed", "completed", "cancelled", "rejected", "expired"].includes(r.status.toLowerCase())
            );
            console.log("📊 Active Requests:", activeRequests.length);

            // Map requests to Transaction format
            const formattedRequests = activeRequests.map((req: any) => ({
                id: req.id,
                reference: req.id,
                type: req.type,
                status: req.status,
                amount: req.amount,
                token_type: req.token_type,
                description: `${req.type === "mint" ? "Mint" : "Burn"} Request`,
                created_at: req.created_at,
                agent: req.agent,
            }));

            // Create a map of pending transactions with agent data
            const pendingMap = new Map<string, Transaction>();
            pendingTx.forEach((tx: Transaction) => {
                pendingMap.set(tx.id, tx);
            });

            // Merge agent data from pending reviews into all transactions
            const mergedTransactions = allTx.map((tx: Transaction) => {
                const pendingTx = pendingMap.get(tx.id);
                if (pendingTx && pendingTx.agent) {
                    return { ...tx, agent: pendingTx.agent };
                }
                return tx;
            });
            console.log("📊 Merged Transactions:", mergedTransactions.length);

            const pendingIds = new Set<string>(pendingTx.map((tx: Transaction) => tx.id));

            // Combine requests and transactions
            const allItems = [...formattedRequests, ...mergedTransactions].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            console.log("📊 All Items:", allItems.length);
            allItems.forEach(item => console.log(`Item: ${item.type} - ${item.status}`));

            setTransactions(allItems);
            setPendingReviews(pendingIds);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter((tx) => {
        if (filter === "all") return true;
        return tx.type === filter;
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return "#00B14F";
            case "pending":
                return "#FFB800";
            case "failed":
                return "#EF4444";
            default:
                return "#6B7280";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "mint":
                return "add-circle";
            case "burn":
                return "remove-circle";
            case "transfer":
                return "swap-horizontal";
            default:
                return "cash";
        }
    };


    const handleTransactionPress = (tx: Transaction) => {
        if (tx.type === "mint") {
            if (tx.status.toLowerCase() === "pending") {
                // Go to upload proof - tx.id is the request ID for pending requests
                router.push({
                    pathname: "/modals/buy-tokens/upload-proof",
                    params: { requestId: tx.id },
                });
            } else {
                // For completed transactions, extract request_id from metadata
                // Fall back to tx.id for backward compatibility
                const requestId = tx.metadata?.request_id || tx.id;
                router.push({
                    pathname: "/modals/buy-tokens/status",
                    params: { requestId: requestId },
                });
            }
        } else if (tx.type === "burn") {
            // Extract request_id from metadata, fall back to tx.id
            const requestId = tx.metadata?.request_id || tx.id;
            router.push({
                pathname: "/(tabs)/sell-tokens/status",
                params: { requestId: requestId },
            });
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Activity</Text>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {(["all", "mint", "burn"] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filter === f && styles.filterTextActive,
                            ]}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Transaction List */}
            <ScrollView
                style={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchTransactions} tintColor="#00B14F" />
                }
            >
                {filteredTransactions.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        {/* Empty State Card */}
                        <View style={styles.emptyStateCard}>
                            <View style={styles.emptyStateIconContainer}>
                                <View style={styles.emptyStateIconBg}>
                                    <Ionicons name="receipt-outline" size={64} color="#00B14F" />
                                </View>
                            </View>

                            <Text style={styles.emptyStateTitle}>
                                {filter === "all"
                                    ? "No Activity Yet"
                                    : filter === "mint"
                                        ? "No Mint Transactions"
                                        : "No Burn Transactions"}
                            </Text>

                            <Text style={styles.emptyStateDescription}>
                                {filter === "all"
                                    ? "Your transaction history will appear here once you start buying, selling, or transferring tokens."
                                    : filter === "mint"
                                        ? "You haven't purchased any tokens yet. Start by buying your first tokens from a trusted agent."
                                        : "You haven't sold any tokens yet. Start by selling tokens to convert them to fiat currency."}
                            </Text>

                            {/* Quick Actions */}
                            <View style={styles.emptyStateActions}>
                                {filter === "all" || filter === "mint" ? (
                                    <TouchableOpacity
                                        style={styles.emptyStateButton}
                                        onPress={() => router.push("/modals/buy-tokens")}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={["#00B14F", "#008F40"]}
                                            style={styles.emptyStateButtonGradient}
                                        >
                                            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                            <Text style={styles.emptyStateButtonText}>
                                                Buy Tokens
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ) : null}

                                {filter === "all" || filter === "burn" ? (
                                    <TouchableOpacity
                                        style={[styles.emptyStateButton, styles.emptyStateButtonSecondary]}
                                        onPress={() => router.push("/(tabs)/sell-tokens")}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.emptyStateButtonSecondaryContent}>
                                            <Ionicons name="arrow-down-circle" size={20} color="#F59E0B" />
                                            <Text style={styles.emptyStateButtonTextSecondary}>
                                                Sell Tokens
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            {/* Info Section */}
                            <View style={styles.emptyStateInfo}>
                                <View style={styles.infoItem}>
                                    <View style={styles.infoIcon}>
                                        <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                                    </View>
                                    <Text style={styles.infoText}>
                                        All transactions are secure and protected
                                    </Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <View style={styles.infoIcon}>
                                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                                    </View>
                                    <Text style={styles.infoText}>
                                        Track your mint and burn requests in real-time
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* What You'll See Section */}
                        <View style={styles.whatYoullSeeCard}>
                            <Text style={styles.whatYoullSeeTitle}>What you'll see here</Text>
                            <View style={styles.whatYoullSeeList}>
                                <View style={styles.whatYoullSeeItem}>
                                    <View style={[styles.whatYoullSeeIcon, { backgroundColor: "#F0FDF4" }]}>
                                        <Ionicons name="add-circle" size={18} color="#00B14F" />
                                    </View>
                                    <View style={styles.whatYoullSeeContent}>
                                        <Text style={styles.whatYoullSeeItemTitle}>Mint Transactions</Text>
                                        <Text style={styles.whatYoullSeeItemDescription}>
                                            When you buy tokens from agents
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.whatYoullSeeItem}>
                                    <View style={[styles.whatYoullSeeIcon, { backgroundColor: "#FEF3C7" }]}>
                                        <Ionicons name="remove-circle" size={18} color="#F59E0B" />
                                    </View>
                                    <View style={styles.whatYoullSeeContent}>
                                        <Text style={styles.whatYoullSeeItemTitle}>Burn Transactions</Text>
                                        <Text style={styles.whatYoullSeeItemDescription}>
                                            When you sell tokens to agents
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.whatYoullSeeItem}>
                                    <View style={[styles.whatYoullSeeIcon, { backgroundColor: "#EFF6FF" }]}>
                                        <Ionicons name="swap-horizontal" size={18} color="#3B82F6" />
                                    </View>
                                    <View style={styles.whatYoullSeeContent}>
                                        <Text style={styles.whatYoullSeeItemTitle}>Transfers</Text>
                                        <Text style={styles.whatYoullSeeItemDescription}>
                                            When you send or receive tokens
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    filteredTransactions.map((tx) => (
                        <TouchableOpacity
                            key={tx.id}
                            style={styles.transactionCard}
                            onPress={() => handleTransactionPress(tx)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.transactionHeader}>
                                <View style={styles.transactionLeft}>
                                    <View
                                        style={[
                                            styles.iconContainer,
                                            {
                                                backgroundColor:
                                                    tx.type === "mint" ? "#F0FDF4" : "#FEF3C7",
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={getTypeIcon(tx.type)}
                                            size={20}
                                            color={tx.type === "mint" ? "#00B14F" : "#F59E0B"}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.transactionType}>
                                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                        </Text>
                                        <Text style={styles.transactionDate}>
                                            {formatDate(tx.created_at, true)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.transactionRight}>
                                    <Text style={styles.transactionAmount}>
                                        {tx.type === "burn" ? "-" : "+"}
                                        {parseFloat(tx.amount).toLocaleString()} {tx.token_type}
                                    </Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(tx.status) + "20" },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                { color: getStatusColor(tx.status) },
                                            ]}
                                        >
                                            {tx.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Agent Info & Rate Button */}
                            {tx.agent && (
                                <View style={styles.agentSection}>
                                    <View style={styles.agentInfo}>
                                        <Ionicons
                                            name="person-circle-outline"
                                            size={16}
                                            color="#6B7280"
                                        />
                                        <Text style={styles.agentName}>
                                            {tx.agent.user?.full_name || "Agent"}
                                        </Text>
                                        <View style={styles.ratingContainer}>
                                            <Ionicons name="star" size={12} color="#FFB800" />
                                            <Text style={styles.ratingText}>
                                                {tx.agent.rating.toFixed(1)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Rate Agent Button */}
                                    {pendingReviews.has(tx.id) && (
                                        <TouchableOpacity
                                            style={styles.rateButton}
                                            onPress={() =>
                                                router.push({
                                                    pathname: "/modals/buy-tokens/rate-agent",
                                                    params: { transactionId: tx.id },
                                                })
                                            }
                                        >
                                            <Ionicons name="star-outline" size={16} color="#8B5CF6" />
                                            <Text style={styles.rateButtonText}>Rate Agent</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        marginBottom: 20,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 140,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 20,
        marginTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    placeholder: {
        width: 40,
    },
    filterContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    filterTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#F9FAFB",
    },
    filterTabActive: {
        backgroundColor: "#00B14F",
    },
    filterText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    filterTextActive: {
        color: "#FFFFFF",
    },
    list: {
        flex: 1,
    },
    emptyStateContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    emptyStateCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyStateIconContainer: {
        marginBottom: 20,
    },
    emptyStateIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "#D1FAE5",
    },
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    emptyStateDescription: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    emptyStateActions: {
        width: "100%",
        gap: 12,
        marginBottom: 24,
    },
    emptyStateButton: {
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyStateButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        gap: 8,
    },
    emptyStateButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    emptyStateButtonSecondary: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#F59E0B",
        backgroundColor: "#FFFFFF",
    },
    emptyStateButtonSecondaryContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 8,
    },
    emptyStateButtonTextSecondary: {
        fontSize: 16,
        fontWeight: "600",
        color: "#F59E0B",
    },
    emptyStateInfo: {
        width: "100%",
        gap: 12,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    infoIcon: {
        width: 24,
        alignItems: "center",
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 18,
    },
    whatYoullSeeCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    whatYoullSeeTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 16,
    },
    whatYoullSeeList: {
        gap: 16,
    },
    whatYoullSeeItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    whatYoullSeeIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    whatYoullSeeContent: {
        flex: 1,
    },
    whatYoullSeeItemTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    whatYoullSeeItemDescription: {
        fontSize: 12,
        color: "#6B7280",
        lineHeight: 16,
    },
    transactionCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    transactionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    transactionType: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    transactionRight: {
        alignItems: "flex-end",
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    agentSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    agentInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    agentName: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    ratingText: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "600",
    },
    rateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: "#FAF5FF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E9D5FF",
    },
    rateButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#8B5CF6",
    },
    bottomSpacer: {
        height: 100,
    },
});
