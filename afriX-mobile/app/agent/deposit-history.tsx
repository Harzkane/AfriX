import React, { useCallback, useEffect } from "react";
import {
    FlatList, RefreshControl, StyleSheet,
    Text, TouchableOpacity, View, useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { DepositTransaction } from "@/stores/types/agent.types";
import { formatAmount, formatDate } from "@/utils/format";
import { useTranslation } from "react-i18next";

const getStatusMeta = (t: any, status?: string, isDark?: boolean) => {
    switch ((status || "").toLowerCase()) {
        case "completed":
        case "verified":
            return {
                label: t("agent.deposit_history.status_verified", "Verified"),
                color: "#059669",
                tint: isDark ? "rgba(5, 150, 105, 0.15)" : "#ECFDF5",
                border: isDark ? "rgba(5, 150, 105, 0.3)" : "#A7F3D0",
                icon: "checkmark-circle-outline" as const
            };
        case "pending":
            return {
                label: t("agent.deposit_history.status_pending", "Pending"),
                color: "#D97706",
                tint: isDark ? "rgba(217, 119, 6, 0.15)" : "#FFFBEB",
                border: isDark ? "rgba(217, 119, 6, 0.3)" : "#FDE68A",
                icon: "time-outline" as const
            };
        case "failed":
        case "rejected":
            return {
                label: t("agent.deposit_history.status_rejected", "Rejected"),
                color: "#EF4444",
                tint: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
                border: isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA",
                icon: "close-circle-outline" as const
            };
        default:
            return {
                label: t("agent.deposit_history.status_processing", "Processing"),
                color: "#3B82F6",
                tint: isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF",
                border: isDark ? "rgba(59, 130, 246, 0.3)" : "#BFDBFE",
                icon: "hourglass-outline" as const
            };
    }
};

export default function DepositHistory() {
    const { t } = useTranslation();
    const router = useRouter();
    const { depositHistory, fetchDepositHistory, loading } = useAgentStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

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

    const loadHistory = useCallback(() => { fetchDepositHistory(); }, [fetchDepositHistory]);
    useEffect(() => { loadHistory(); }, [loadHistory]);

    const totalDeposits = depositHistory.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const renderItem = ({ item }: { item: DepositTransaction }) => {
        const statusMeta = getStatusMeta(t, item.status, isDark);
        return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.cardAccentBar, { backgroundColor: statusMeta.color }]} />
                <View style={styles.cardBody}>
                    <View style={[styles.iconBox, { backgroundColor: statusMeta.tint }]}>
                        <Ionicons name={statusMeta.icon} size={20} color={statusMeta.color} />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardEyebrow, { color: theme.muted }]}>{t("agent.deposit_history.usdt_deposit", "USDT Deposit")}</Text>
                        <Text style={[styles.cardAmount, { color: theme.text }]}>+{formatAmount(item.amount, "USDT")} USDT</Text>
                        <Text style={[styles.cardDate, { color: theme.muted }]}>{formatDate(item.created_at, true)}</Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: statusMeta.tint, borderColor: statusMeta.border }]}>
                        <Text style={[styles.statusChipText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                    </View>
                </View>
                <View style={[styles.stripRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.stripLabel, { color: theme.muted }]}>{t("agent.deposit_history.reference", "Reference")}</Text>
                    <Text style={[styles.stripValue, { color: theme.text }]}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={[styles.stripRow, { borderTopColor: theme.border }]}>
                    <Text style={[styles.stripLabel, { color: theme.muted }]}>{t("agent.deposit_history.date", "Date")}</Text>
                    <Text style={[styles.stripValue, { color: theme.text }]}>{formatDate(item.created_at)}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Flat Header — consistent with other account screens */}
            <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.headerBackBtn, { backgroundColor: theme.accentLight }]} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color={theme.accent} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{t("agent.deposit_history.header_title", "Deposit History")}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            {/* Summary banner */}
            <View style={[styles.summaryBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.muted }]}>{t("agent.deposit_history.total_deposited", "Total Deposited")}</Text>
                    <Text style={[styles.summaryValue, { color: theme.green }]}>{formatAmount(totalDeposits, "USDT")} USDT</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.muted }]}>{t("agent.deposit_history.transactions", "Transactions")}</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{depositHistory.length}</Text>
                </View>
            </View>

            <FlatList
                data={depositHistory}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor={theme.accent} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <LinearGradient colors={isDark ? ["rgba(124,58,237,0.12)", "rgba(124,58,237,0.06)"] : ["#EDE9FE", "#DDD6FE"]} style={styles.emptyIconCircle}>
                            <Ionicons name="arrow-down-circle-outline" size={28} color={theme.accent} />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("agent.deposit_history.empty_title", "No deposits yet")}</Text>
                        <Text style={[styles.emptySub, { color: theme.muted }]}>{t("agent.deposit_history.empty_sub", "Your deposit history will appear here once you make your first deposit.")}</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        borderBottomWidth: 1,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    headerBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    headerSpacer: {
        width: 36,
    },
    summaryBanner: {
        flexDirection: "row", marginHorizontal: 16, marginVertical: 12,
        borderRadius: 24, borderWidth: 1, padding: 16,
        shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
    summaryValue: { fontSize: 17, fontWeight: "900" },
    summaryDivider: { width: 1, alignSelf: "stretch", marginHorizontal: 16 },
    listContent: { paddingHorizontal: 16, paddingBottom: 80 },
    card: {
        borderRadius: 24, borderWidth: 1, marginBottom: 12, overflow: "hidden",
        shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    cardAccentBar: { height: 4 },
    cardBody: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
    iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    cardInfo: { flex: 1 },
    cardEyebrow: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
    cardAmount: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
    cardDate: { fontSize: 11, fontWeight: "500" },
    statusChip: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
    },
    statusChipText: { fontSize: 11, fontWeight: "800" },
    stripRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
    stripLabel: { fontSize: 12, fontWeight: "600" },
    stripValue: { fontSize: 12, fontWeight: "800" },
    emptyState: { paddingTop: 60, alignItems: "center", paddingHorizontal: 32 },
    emptyIconCircle: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    emptyTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
    emptySub: { fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 20 },
});
