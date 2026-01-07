import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AgentRequest } from "@/stores/types/agent.types";
import { useRouter } from "expo-router";
import { formatAmount, formatDate } from "@/utils/format";

export default function AgentRequests() {
    const router = useRouter();
    const { pendingRequests, dashboardData, fetchPendingRequests, fetchDashboard, loading } = useAgentStore();
    const [activeTab, setActiveTab] = useState<"mint" | "burn" | "history">("mint");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        fetchPendingRequests();
        fetchDashboard();
    };

    const filteredRequests = activeTab === "history"
        ? (dashboardData?.recent_transactions || [])
        : pendingRequests.filter((r) => {
            // Basic type inference based on fields if type is missing
            const type = r.type || (r.bank_account ? "burn" : "mint");
            return type === activeTab;
        });

    const renderRequest = ({ item }: { item: any }) => {
        const isHistory = activeTab === "history";
        const isMint = isHistory ? item.type === 'mint' : (item.type === "mint" || !item.bank_account);
        const userName = isHistory
            ? (isMint ? item.toUser?.full_name : item.fromUser?.full_name)
            : item.user?.full_name;
        const commission = isHistory ? formatAmount((parseFloat(item.amount) * 0.01).toString(), "USDT") : null;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => !isHistory && router.push(`/agent/request-details/${item.id}`)}
                activeOpacity={isHistory ? 1 : 0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.userContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {userName?.substring(0, 2).toUpperCase() || "U"}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{userName || "Unknown User"}</Text>
                            <Text style={styles.date}>
                                {formatDate(item.created_at)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.badge, { backgroundColor: isMint ? "#F3E8FF" : "#FEF3C7" }]}>
                        <Text style={[styles.badgeText, { color: isMint ? "#7C3AED" : "#F59E0B" }]}>
                            {isMint ? "MINT" : "BURN"}
                        </Text>
                    </View>
                </View>

                <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>
                        {formatAmount(item.amount, item.token_type)} {item.token_type}
                    </Text>
                </View>

                {isHistory && commission && (
                    <View style={styles.commissionContainer}>
                        <Text style={styles.commissionLabel}>Commission Earned</Text>
                        <Text style={styles.commissionValue}>+${commission}</Text>
                    </View>
                )}

                {!isHistory && (
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusLabel}>Status</Text>
                        <Text style={styles.statusValue}>{item.status.replace("_", " ").toUpperCase()}</Text>
                    </View>
                )}

                {!isHistory && (
                    <View style={styles.footer}>
                        <Text style={styles.actionText}>Tap to view details</Text>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                )}
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
                        <Text style={styles.title}>Requests</Text>
                    </View>
                </SafeAreaView>
            </View>

            <View style={styles.tabsContainer}>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "mint" && styles.activeTab]}
                        onPress={() => setActiveTab("mint")}
                    >
                        <Text style={[styles.tabText, activeTab === "mint" && styles.activeTabText]}>
                            Mint Requests
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "burn" && styles.activeTab]}
                        onPress={() => setActiveTab("burn")}
                    >
                        <Text style={[styles.tabText, activeTab === "burn" && styles.activeTabText]}>
                            Burn Requests
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "history" && styles.activeTab]}
                        onPress={() => setActiveTab("history")}
                    >
                        <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
                            History
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredRequests}
                renderItem={renderRequest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchPendingRequests} tintColor="#7C3AED" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No pending {activeTab} requests.</Text>
                    </View>
                }
            />
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
        // borderBottomLeftRadius: 30,
        // borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 16,
    },
    header: {
        paddingBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    tabs: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        marginTop: -20,
        borderRadius: 16,
        padding: 6,
        gap: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: "transparent",
    },
    activeTab: {
        backgroundColor: "#00B14F",
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        fontWeight: "600",
        color: "#4B5563",
    },
    activeTabText: {
        color: "white",
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3E8FF",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontWeight: "700",
        color: "#7C3AED",
    },
    commissionContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
        backgroundColor: "#ECFDF5",
        padding: 8,
        borderRadius: 8,
    },
    commissionLabel: {
        color: "#059669",
        fontWeight: "500",
    },
    commissionValue: {
        fontWeight: "700",
        color: "#00B14F",
        fontSize: 16,
    },
    userName: {
        fontWeight: "600",
        color: "#111827",
    },
    date: {
        fontSize: 12,
        color: "#6B7280",
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    mintBadge: {
        backgroundColor: "#ECFDF5",
    },
    burnBadge: {
        backgroundColor: "#FFFBEB",
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "700",
    },
    mintText: {
        color: "#00B14F",
    },
    burnText: {
        color: "#F59E0B",
    },
    amountContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    amountLabel: {
        color: "#6B7280",
    },
    amountValue: {
        fontWeight: "700",
        color: "#111827",
        fontSize: 16,
    },
    statusContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    statusLabel: {
        color: "#6B7280",
    },
    statusValue: {
        fontWeight: "600",
        color: "#4B5563",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingTop: 12,
    },
    actionText: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    emptyState: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        color: "#9CA3AF",
    },
});
