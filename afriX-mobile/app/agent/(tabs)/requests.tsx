import React, { useEffect, useState } from "react";
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
                onPress={() => !isHistory && router.push(`/agent/request-details/${item.id}`)}
                activeOpacity={isHistory ? 1 : 0.7}
            >
                <Surface style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.userContainer}>
                            <View style={[styles.avatar, { backgroundColor: isMint ? "#F0FDF4" : "#FFFBEB" }]}>
                                <Text style={[styles.avatarText, { color: isMint ? "#00B14F" : "#F59E0B" }]}>
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

                        <View style={[styles.badge, { backgroundColor: isMint ? "#F0FDF4" : "#FFFBEB" }]}>
                            <Text style={[styles.badgeText, { color: isMint ? "#00B14F" : "#F59E0B" }]}>
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
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusValue}>{item.status.replace("_", " ").toUpperCase()}</Text>
                            </View>
                        </View>
                    )}

                    {!isHistory && (
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
        paddingBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
        letterSpacing: -0.5,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 8,
    },
    tabs: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        marginTop: -30,
        borderRadius: 16,
        padding: 6,
        gap: 6,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: "#00B14F",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    activeTabText: {
        color: "#FFFFFF",
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
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
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "700",
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
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    amountContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 12,
    },
    amountLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    amountValue: {
        fontSize: 18,
        fontWeight: "800",
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
    emptyText: {
        fontSize: 15,
        color: "#9CA3AF",
        fontWeight: "500",
    },
});
