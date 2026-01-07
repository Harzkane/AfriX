import { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { WithdrawalRequest } from "@/stores/types/agent.types";
import { formatAmount, formatDate } from "@/utils/format";

export default function WithdrawalHistory() {
    const router = useRouter();
    const { withdrawalRequests, fetchWithdrawalRequests, loading } = useAgentStore();

    useEffect(() => {
        fetchWithdrawalRequests();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "#F59E0B";
            case "approved": return "#3B82F6";
            case "paid": return "#00B14F";
            case "rejected": return "#EF4444";
            default: return "#6B7280";
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case "pending": return "#FEF3C7";
            case "approved": return "#DBEAFE";
            case "paid": return "#DCFCE7";
            case "rejected": return "#FEE2E2";
            default: return "#F3F4F6";
        }
    };

    const renderItem = ({ item }: { item: WithdrawalRequest }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.amount}>${formatAmount(item.amount_usd, "USDT")}</Text>
                    <Text style={styles.date}>
                        {formatDate(item.created_at)}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusBg(item.status) }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                </View>
            </View>

            {item.status === 'rejected' && item.admin_notes && (
                <View style={styles.noteBox}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.noteText}>{item.admin_notes}</Text>
                </View>
            )}

            {item.status === 'paid' && item.paid_tx_hash && (
                <View style={styles.txBox}>
                    <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                    <Text style={styles.txText} numberOfLines={1} ellipsizeMode="middle">
                        Tx: {item.paid_tx_hash}
                    </Text>
                </View>
            )}

            <View style={styles.divider} />

            <View style={styles.footer}>
                <Text style={styles.idText}>ID: {item.id.slice(0, 8)}...</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Withdrawal History</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={withdrawalRequests}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchWithdrawalRequests} tintColor="#7C3AED" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No withdrawal history found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    amount: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    date: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    noteBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEE2E2",
        padding: 8,
        borderRadius: 8,
        gap: 6,
        marginBottom: 12,
    },
    noteText: {
        fontSize: 12,
        color: "#EF4444",
        flex: 1,
    },
    txBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#DCFCE7",
        padding: 8,
        borderRadius: 8,
        gap: 6,
        marginBottom: 12,
    },
    txText: {
        fontSize: 12,
        color: "#00B14F",
        flex: 1,
        fontFamily: "monospace",
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginBottom: 8,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    idText: {
        fontSize: 10,
        color: "#9CA3AF",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280",
    },
});
