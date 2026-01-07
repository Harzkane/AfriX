import { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { DepositTransaction } from "@/stores/types/agent.types";
import { formatAmount, formatDate } from "@/utils/format";

export default function DepositHistory() {
    const router = useRouter();
    const { depositHistory, fetchDepositHistory, loading } = useAgentStore();

    useEffect(() => {
        fetchDepositHistory();
    }, []);

    const renderItem = ({ item }: { item: DepositTransaction }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.amount}>+{formatAmount(item.amount, "USDT")} USDT</Text>
                    <Text style={styles.date}>
                        {formatDate(item.created_at)}
                    </Text>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Verified</Text>
                </View>
            </View>

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
                <Text style={styles.headerTitle}>Deposit History</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={depositHistory}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchDepositHistory} tintColor="#7C3AED" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyText}>No deposit history found</Text>
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
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#00B14F",
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
