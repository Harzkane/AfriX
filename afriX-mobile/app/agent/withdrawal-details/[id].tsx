import React, { useCallback, useEffect } from "react";
import {
    ActivityIndicator, ScrollView, StyleSheet,
    Text, TouchableOpacity, View, useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatAmount, formatDate } from "@/utils/format";
import { useTranslation } from "react-i18next";

const getStatusMeta = (t: any, status?: string | null) => {
    switch (String(status || "").toLowerCase()) {
        case "pending":
            return { label: t("agent.withdrawal_details.status_pending", "Pending").toUpperCase(), titleCase: t("agent.withdrawal_details.status_pending", "Pending"), color: "#D97706", tint: "#FFFBEB", border: "#FDE68A", icon: "time-outline" as const };
        case "approved":
            return { label: t("agent.withdrawal_details.status_approved", "Approved").toUpperCase(), titleCase: t("agent.withdrawal_details.status_approved", "Approved"), color: "#2563EB", tint: "#EFF6FF", border: "#BFDBFE", icon: "checkmark-done-outline" as const };
        case "rejected":
            return { label: t("agent.withdrawal_details.status_rejected", "Rejected").toUpperCase(), titleCase: t("agent.withdrawal_details.status_rejected", "Rejected"), color: "#DC2626", tint: "#FEF2F2", border: "#FECACA", icon: "close-circle-outline" as const };
        default:
            return { label: t("agent.withdrawal_details.status_paid", "Paid").toUpperCase(), titleCase: t("agent.withdrawal_details.status_paid", "Paid"), color: "#059669", tint: "#ECFDF5", border: "#A7F3D0", icon: "cash-outline" as const };
    }
};

export default function AgentWithdrawalDetailsScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
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
        inputBg: isDark ? "rgba(255,255,255,0.04)" : "#F8F7FF",
    };

    const loadHistory = useCallback(() => { fetchWithdrawalRequests(); }, [fetchWithdrawalRequests]);
    useEffect(() => { if (!withdrawalRequests.length) { loadHistory(); } }, [loadHistory, withdrawalRequests.length]);

    const request = withdrawalRequests.find((item) => item.id === id);

    if (loading && !request) {
        return (
            <View style={[styles.centerWrap, { backgroundColor: theme.bg }]}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={[styles.loadingText, { color: theme.muted }]}>{t("agent.withdrawal_details.loading", "Loading withdrawal details...")}</Text>
            </View>
        );
    }

    if (!request) {
        return (
            <View style={[styles.container, { backgroundColor: theme.bg }]}>
                <SafeAreaView style={styles.errorWrap}>
                    <LinearGradient colors={["#EDE9FE", "#DDD6FE"]} style={styles.errorIconCircle}>
                        <Ionicons name="alert-circle-outline" size={28} color="#7C3AED" />
                    </LinearGradient>
                    <Text style={[styles.errorTitle, { color: theme.text }]}>{t("agent.withdrawal_details.err_unavailable", "Withdrawal unavailable")}</Text>
                    <Text style={[styles.errorSub, { color: theme.muted }]}>{t("agent.withdrawal_details.err_not_found", "This withdrawal request could not be found.")}</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
                        <Text style={styles.backBtnText}>{t("agent.withdrawal_details.go_back", "Go back")}</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    const statusMeta = getStatusMeta(t, request.status);

    const summaryRows = [
        { label: t("agent.withdrawal_details.request_id", "Request ID"), value: request.id, mono: true },
        { label: t("agent.withdrawal_details.agent_id", "Agent ID"), value: request.agent_id, mono: true },
        { label: t("agent.withdrawal_details.status", "Status"), value: statusMeta.titleCase, colored: statusMeta.color },
        { label: t("agent.withdrawal_details.created_on", "Created On"), value: formatDate(request.created_at, true) },
        ...(request.paid_at ? [{ label: t("agent.withdrawal_details.paid_on", "Paid On"), value: formatDate(request.paid_at, true) }] : []),
    ] as Array<{ label: string; value: string; mono?: boolean; colored?: string }>;

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Header */}
            {/* Flat Header */}
            <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={20} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitleText, { color: theme.text }]}>{t("agent.withdrawal_details.header_title", "Details")}</Text>
                    </View>
                    <View style={[styles.agentBadge, { backgroundColor: theme.accentLight }]}>
                        <Text style={[styles.agentBadgeText, { color: theme.accent }]}>{t("agent.withdrawal_details.agent_badge", "Agent")}</Text>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero card */}
                <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.heroTopRow}>
                        <View style={[styles.statusChip, { backgroundColor: statusMeta.tint, borderColor: statusMeta.border }]}>
                            <Ionicons name={statusMeta.icon} size={14} color={statusMeta.color} />
                            <Text style={[styles.statusChipText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                        </View>
                        <View style={[styles.accentBar, { backgroundColor: statusMeta.color + "20" }]}>
                            <Ionicons name="cash-outline" size={16} color={statusMeta.color} />
                        </View>
                    </View>
                    <Text style={[styles.heroLabel, { color: theme.muted }]}>{t("agent.withdrawal_details.requested_amount_label", "Requested Amount")}</Text>
                    <Text style={[styles.heroAmount, { color: theme.text }]}>{formatAmount(request.amount_usd, "USDT")} USDT</Text>
                    <Text style={[styles.heroDate, { color: theme.muted }]}>{t("agent.withdrawal_details.submitted_at", "Submitted {{date}}", { date: formatDate(request.created_at, true) })}</Text>
                </View>

                {/* Request summary */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.cardAccentBar, { backgroundColor: theme.accent }]} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{t("agent.withdrawal_details.summary", "Request Summary")}</Text>
                    {summaryRows.map((row, idx) => (
                        <View key={row.label} style={[styles.infoRow, { borderBottomColor: theme.border }, idx === summaryRows.length - 1 && { borderBottomWidth: 0 }]}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>{row.label}</Text>
                            <Text
                                style={[styles.infoValue, { color: row.colored ?? theme.text }, row.mono && { fontFamily: "monospace", fontSize: 12 }]}
                                numberOfLines={1}
                            >
                                {row.value}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Settlement details */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.cardAccentBar, { backgroundColor: statusMeta.color }]} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{t("agent.withdrawal_details.settlement_details", "Settlement Details")}</Text>
                    {[
                        { label: t("agent.withdrawal_details.payout_amount", "Payout Amount"), value: `${formatAmount(request.amount_usd, "USDT")} USDT`, color: theme.text },
                        { label: t("agent.withdrawal_details.current_status", "Current Status"), value: statusMeta.titleCase, color: statusMeta.color },
                    ].map((row) => (
                        <View key={row.label} style={[styles.stripRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <Text style={[styles.stripLabel, { color: theme.muted }]}>{row.label}</Text>
                            <Text style={[styles.stripValue, { color: row.color }]}>{row.value}</Text>
                        </View>
                    ))}

                    {/* Tx hash */}
                    {request.paid_tx_hash ? (
                        <View style={[styles.txHashBox, { backgroundColor: isDark ? "rgba(5, 150, 105, 0.1)" : "#ECFDF5", borderColor: isDark ? "rgba(5, 150, 105, 0.2)" : "#A7F3D0" }]}>
                            <Text style={[styles.txHashLabel, { color: "#059669" }]}>{t("agent.withdrawal_details.paid_tx_hash", "Paid Transaction Hash")}</Text>
                            <Text style={[styles.txHashText, { color: "#059669" }]} numberOfLines={2}>{request.paid_tx_hash}</Text>
                        </View>
                    ) : null}

                    {/* Admin notes */}
                    {request.admin_notes ? (
                        <View style={[
                            styles.messageBox,
                            request.status === "rejected"
                                ? { backgroundColor: isDark ? "rgba(239,68,68,0.1)" : "#FEF2F2", borderColor: "#FECACA" }
                                : { backgroundColor: theme.inputBg, borderColor: theme.border },
                        ]}>
                            <Text style={[styles.messageBoxLabel, { color: request.status === "rejected" ? "#DC2626" : theme.muted }]}>
                                {request.status === "rejected" ? t("agent.withdrawal_details.rejection_reason", "Rejection Reason") : t("agent.withdrawal_details.admin_notes", "Admin Notes")}
                            </Text>
                            <Text style={[styles.messageBoxText, { color: request.status === "rejected" ? "#B42318" : theme.text }]}>
                                {request.admin_notes}
                            </Text>
                        </View>
                    ) : null}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    loadingText: { marginTop: 12, fontSize: 15, fontWeight: "500" },
    errorWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    errorIconCircle: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    errorTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
    errorSub: { fontSize: 14, fontWeight: "500", textAlign: "center", marginBottom: 24 },
    backBtn: { backgroundColor: "#7C3AED", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
    backBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
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
    headerBackBtn: {
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
    scrollContent: { padding: 16, paddingBottom: 40 },
    heroCard: {
        borderRadius: 24, borderWidth: 1, padding: 20, marginBottom: 14,
        shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
    },
    heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    statusChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
    statusChipText: { fontSize: 12, fontWeight: "800" },
    accentBar: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    heroLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    heroAmount: { fontSize: 28, fontWeight: "900", letterSpacing: -0.6, marginBottom: 6 },
    heroDate: { fontSize: 13, fontWeight: "500" },
    card: { borderRadius: 22, borderWidth: 1, marginBottom: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    cardAccentBar: { height: 4 },
    cardTitle: { fontSize: 16, fontWeight: "800", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    infoLabel: { fontSize: 13, fontWeight: "600" },
    infoValue: { fontSize: 13, fontWeight: "800", maxWidth: "55%", textAlign: "right" },
    stripRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
    stripLabel: { fontSize: 13, fontWeight: "600" },
    stripValue: { fontSize: 14, fontWeight: "800" },
    txHashBox: { marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
    txHashLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    txHashText: { fontFamily: "monospace", fontSize: 12, lineHeight: 18, fontWeight: "600" },
    messageBox: { marginHorizontal: 16, marginBottom: 14, borderRadius: 12, borderWidth: 1, padding: 12 },
    messageBoxLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6 },
    messageBoxText: { fontSize: 14, lineHeight: 21, fontWeight: "500" },
});
