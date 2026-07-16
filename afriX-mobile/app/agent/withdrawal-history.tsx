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
import { WithdrawalRequest } from "@/stores/types/agent.types";
import { formatAmount, formatDate } from "@/utils/format";
import { useTranslation } from "react-i18next";

const getStatusMeta = (t: any, status: string) => {
    switch (status) {
        case "paid":
            return { label: t("agent.withdrawal_history.status_paid", "Paid"), color: "#059669", tint: "#ECFDF5", border: "#A7F3D0", icon: "checkmark-circle-outline" as const };
        case "approved":
            return { label: t("agent.withdrawal_history.status_approved", "Approved"), color: "#2563EB", tint: "#EFF6FF", border: "#BFDBFE", icon: "checkmark-done-outline" as const };
        case "rejected":
            return { label: t("agent.withdrawal_history.status_rejected", "Rejected"), color: "#EF4444", tint: "#FEF2F2", border: "#FECACA", icon: "close-circle-outline" as const };
        default:
            return { label: t("agent.withdrawal_history.status_pending", "Pending"), color: "#D97706", tint: "#FFFBEB", border: "#FDE68A", icon: "time-outline" as const };
    }
};

export default function WithdrawalHistory() {
    const { t } = useTranslation();
    const router = useRouter();
    const { withdrawalRequests, fetchWithdrawalRequests, loading } = useAgentStore();
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

    const loadHistory = useCallback(() => { fetchWithdrawalRequests(); }, [fetchWithdrawalRequests]);
    useEffect(() => { loadHistory(); }, [loadHistory]);

    const totalRequested = withdrawalRequests.reduce((sum, item) => sum + (Number(item.amount_usd) || 0), 0);
    const pendingCount = withdrawalRequests.filter((item) => item.status === "pending").length;

    const renderItem = ({ item }: { item: WithdrawalRequest }) => {
        const statusMeta = getStatusMeta(t, item.status);
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/agent/withdrawal-details/${item.id}`)}
            >
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.cardAccentBar, { backgroundColor: statusMeta.color }]} />
                    <View style={styles.cardBody}>
                        <View style={[styles.iconBox, { backgroundColor: statusMeta.tint }]}>
                            <Ionicons name={statusMeta.icon} size={20} color={statusMeta.color} />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={[styles.cardEyebrow, { color: theme.muted }]}>{t("agent.withdrawal_history.wd_request", "Withdrawal Request")}</Text>
                            <Text style={[styles.cardAmount, { color: theme.text }]}>{formatAmount(item.amount_usd, "USDT")} USDT</Text>
                            <Text style={[styles.cardDate, { color: theme.muted }]}>{formatDate(item.created_at, true)}</Text>
                        </View>
                        <View style={[styles.statusChip, { backgroundColor: statusMeta.tint, borderColor: statusMeta.border }]}>
                            <Text style={[styles.statusChipText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                        </View>
                    </View>
                    <View style={[styles.stripRow, { borderTopColor: theme.border }]}>
                        <Text style={[styles.stripLabel, { color: theme.muted }]}>{t("agent.withdrawal_history.request_id", "Request ID")}</Text>
                        <Text style={[styles.stripValue, { color: theme.text }]}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.stripRow, { borderTopColor: theme.border }]}>
                        <Text style={[styles.stripLabel, { color: theme.muted }]}>{t("agent.withdrawal_history.submitted", "Submitted")}</Text>
                        <Text style={[styles.stripValue, { color: theme.text }]}>{formatDate(item.created_at)}</Text>
                    </View>
                    {item.status === "rejected" && item.admin_notes ? (
                        <View style={[styles.messageBanner, { backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "#FEF2F2", borderColor: "#FECACA", borderTopColor: theme.border }]}>
                            <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                            <Text style={styles.errorText}>{item.admin_notes}</Text>
                        </View>
                    ) : null}
                    {item.status === "paid" && item.paid_tx_hash ? (
                        <View style={[styles.messageBanner, { backgroundColor: isDark ? "rgba(0,177,79,0.1)" : "#ECFDF5", borderColor: "#A7F3D0", borderTopColor: theme.border }]}>
                            <Ionicons name="checkmark-circle-outline" size={15} color="#00B14F" />
                            <Text style={styles.successText} numberOfLines={1} ellipsizeMode="middle">Tx: {item.paid_tx_hash}</Text>
                        </View>
                    ) : null}
                    <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                        <Text style={[styles.footerText, { color: theme.muted }]}>{t("agent.withdrawal_history.tap_view", "Tap to view details")}</Text>
                        <Ionicons name="chevron-forward" size={15} color={theme.muted} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Flat Header */}
            <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={20} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitleText, { color: theme.text }]}>{t("agent.withdrawal_history.header_title", "Withdrawals")}</Text>
                    </View>
                    <View style={[styles.agentBadge, { backgroundColor: theme.accentLight }]}>
                        <Text style={[styles.agentBadgeText, { color: theme.accent }]}>{t("agent.withdrawal_history.agent_badge", "Agent")}</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* Summary banner */}
            <View style={[styles.summaryBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.muted }]}>{t("agent.withdrawal_history.total_requested", "Total Requested")}</Text>
                    <Text style={[styles.summaryValue, { color: theme.accent }]}>{formatAmount(totalRequested, "USDT")} USDT</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.muted }]}>{t("agent.withdrawal_history.pending", "Pending")}</Text>
                    <Text style={[styles.summaryValue, { color: "#D97706" }]}>{pendingCount}</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: theme.muted }]}>{t("agent.withdrawal_history.total", "Total")}</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{withdrawalRequests.length}</Text>
                </View>
            </View>

            <FlatList
                data={withdrawalRequests}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} tintColor="#7C3AED" />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <LinearGradient colors={["#EDE9FE", "#DDD6FE"]} style={styles.emptyIconCircle}>
                            <Ionicons name="cash-outline" size={28} color="#7C3AED" />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("agent.withdrawal_history.empty_title", "No withdrawals yet")}</Text>
                        <Text style={[styles.emptySub, { color: theme.muted }]}>{t("agent.withdrawal_history.empty_sub", "Your withdrawal requests will appear here once you submit one.")}</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
        paddingTop: 10,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "transparent",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitleText: {
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    agentBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    agentBadgeText: {
        fontSize: 10,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    summaryBanner: {
        flexDirection: "row", marginHorizontal: 16, marginVertical: 12,
        borderRadius: 18, borderWidth: 1, padding: 16,
        shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    summaryItem: { flex: 1, alignItems: "center" },
    summaryLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
    summaryValue: { fontSize: 16, fontWeight: "900" },
    summaryDivider: { width: 1, alignSelf: "stretch", marginHorizontal: 12 },
    listContent: { paddingHorizontal: 16, paddingBottom: 80 },
    card: {
        borderRadius: 20, borderWidth: 1, marginBottom: 12, overflow: "hidden",
        shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    cardAccentBar: { height: 4 },
    cardBody: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
    iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    cardInfo: { flex: 1 },
    cardEyebrow: { fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
    cardAmount: { fontSize: 16, fontWeight: "800", marginBottom: 2 },
    cardDate: { fontSize: 11, fontWeight: "500" },
    statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    statusChipText: { fontSize: 11, fontWeight: "800" },
    stripRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
    stripLabel: { fontSize: 12, fontWeight: "600" },
    stripValue: { fontSize: 12, fontWeight: "800" },
    messageBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, paddingHorizontal: 14, borderTopWidth: 1 },
    errorText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#EF4444" },
    successText: { flex: 1, fontSize: 12, fontWeight: "600", color: "#00B14F" },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, paddingHorizontal: 14, borderTopWidth: 1 },
    footerText: { fontSize: 12, fontWeight: "600" },
    emptyState: { paddingTop: 60, alignItems: "center", paddingHorizontal: 32 },
    emptyIconCircle: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    emptyTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
    emptySub: { fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 20 },
});
