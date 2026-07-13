import React from "react";
import {
    ScrollView, StyleSheet, Text,
    TouchableOpacity, View, useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatAmount, formatDate } from "@/utils/format";

const getTypeConfig = (type: string) => {
    if (type === "mint") return { label: "Mint", icon: "arrow-up-circle" as const, bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" };
    if (type === "burn") return { label: "Burn", icon: "arrow-down-circle" as const, bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" };
    return { label: type || "Transaction", icon: "cash" as const, bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" };
};

const getStatusColor = (status: string) => {
    switch (String(status || "").toLowerCase()) {
        case "completed": return "#059669";
        case "pending": return "#D97706";
        case "failed": return "#EF4444";
        default: return "#6B7280";
    }
};

export default function TransactionDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { dashboardData } = useAgentStore();
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
        inputBg: isDark ? "rgba(255,255,255,0.04)" : "#F8F7FF",
    };

    const tx = dashboardData?.recent_transactions?.find((t: any) => t.id === id);

    if (!tx) {
        return (
            <View style={[styles.container, { backgroundColor: theme.bg }]}>
                <SafeAreaView style={styles.errorWrap}>
                    <LinearGradient colors={["#EDE9FE", "#DDD6FE"]} style={styles.errorIconCircle}>
                        <Ionicons name="alert-circle-outline" size={28} color="#7C3AED" />
                    </LinearGradient>
                    <Text style={[styles.errorTitle, { color: theme.text }]}>Transaction unavailable</Text>
                    <Text style={[styles.errorSub, { color: theme.muted }]}>This transaction could not be found.</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
                        <Text style={styles.backBtnText}>Go back</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    const normalizedType = String(tx.type || "").toLowerCase();
    const isMint = normalizedType === "mint";
    const isBurn = normalizedType === "burn";
    const counterparty = isMint ? tx.toUser?.full_name : tx.fromUser?.full_name;
    const tokenType = tx.token_type || "NT";
    const commissionSource = tx.agent_commission ?? tx.fee_amount ?? tx.fee;
    const commissionAmount = commissionSource != null && commissionSource !== ""
        ? String(commissionSource)
        : tx.status === "completed"
            ? (parseFloat(String(tx.amount || 0)) * 0.01).toString()
            : "0";
    const commissionLabel = tx.fee_kind === "agent_commission" ? (tx.fee_label || "Agent Commission") : "Commission earned";
    const commission = formatAmount(commissionAmount, tokenType);
    const amountDisplay = formatAmount(tx.amount, tokenType);
    const typeConfig = getTypeConfig(normalizedType);
    const statusColor = getStatusColor(tx.status);

    const infoRows = [
        { label: "Flow", value: isMint ? "Mint to customer" : isBurn ? "Burn from customer" : tx.type },
        { label: "Counterparty", value: counterparty || "User" },
        { label: "Token", value: tokenType },
        { label: "Reference", value: tx.reference || "—" },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Flat Header — matches user/agent dashboard header style */}
            <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.headerBackBtn, { backgroundColor: theme.accentLight }]} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color={theme.accent} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction Details</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero amount card */}
                <LinearGradient
                    colors={isMint ? ["#064E3B", "#065F46", "#047857"] : ["#78350F", "#92400E", "#B45309"]}
                    style={styles.heroCard}
                >
                    <View style={styles.heroRow}>
                        <View style={[styles.heroTypePill, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                            <Ionicons name={typeConfig.icon} size={16} color="#FFFFFF" />
                            <Text style={styles.heroTypePillText}>{typeConfig.label}</Text>
                        </View>
                        <View style={[styles.heroStatusPill, { backgroundColor: `${statusColor}25` }]}>
                            <Text style={[styles.heroStatusText, { color: "#FFFFFF" }]}>
                                {String(tx.status || "completed").replace(/_/g, " ").toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.heroAmountLabel}>Transaction Amount</Text>
                    <Text style={styles.heroAmount}>{amountDisplay} {tokenType}</Text>
                    <Text style={styles.heroDate}>{formatDate(tx.created_at, true)}</Text>
                </LinearGradient>

                {/* Transaction Summary */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.cardAccentBar, { backgroundColor: typeConfig.color }]} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Transaction Summary</Text>
                    {infoRows.map((row, idx) => (
                        <View key={row.label} style={[styles.infoRow, { borderBottomColor: theme.border }, idx === infoRows.length - 1 && { borderBottomWidth: 0 }]}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>{row.label}</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Commission card */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.cardAccentBar, { backgroundColor: theme.green }]} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Settlement Details</Text>
                    <View style={[styles.commissionBanner, { backgroundColor: isDark ? "rgba(0,177,79,0.1)" : "#ECFDF5", borderColor: isDark ? "rgba(0,177,79,0.2)" : "#A7F3D0" }]}>
                        <View>
                            <Text style={[styles.commissionLabel, { color: "#059669" }]}>{commissionLabel}</Text>
                        </View>
                        <Text style={[styles.commissionValue, { color: theme.green }]}>+{commission} {tokenType}</Text>
                    </View>
                    {[
                        { label: "Status", value: String(tx.status || "completed").replace(/_/g, " ").toUpperCase() },
                        { label: "Recorded On", value: formatDate(tx.created_at, true) },
                    ].map((row, idx) => (
                        <View key={row.label} style={[styles.stripRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <Text style={[styles.stripLabel, { color: theme.muted }]}>{row.label}</Text>
                            <Text style={[styles.stripValue, { color: theme.text }]}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Metadata */}
                {tx.metadata ? (
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={[styles.cardAccentBar, { backgroundColor: theme.accent }]} />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Additional Data</Text>
                        <View style={[styles.metaBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                            <Text style={[styles.metaLabel, { color: theme.muted }]}>Metadata</Text>
                            <Text style={[styles.metaText, { color: theme.muted }]}>
                                {JSON.stringify(tx.metadata, null, 2)}
                            </Text>
                        </View>
                    </View>
                ) : null}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    errorWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    errorIconCircle: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    errorTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
    errorSub: { fontSize: 14, fontWeight: "500", textAlign: "center", marginBottom: 24 },
    backBtn: { backgroundColor: "#7C3AED", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
    backBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
    headerContainer: { borderBottomWidth: 1 },
    headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    headerBackBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
    headerSpacer: { width: 36 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    heroCard: { borderRadius: 26, padding: 22, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    heroTypePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    heroTypePillText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
    heroStatusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    heroStatusText: { fontSize: 11, fontWeight: "800" },
    heroAmountLabel: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.75)", marginBottom: 6 },
    heroAmount: { fontSize: 30, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.8 },
    heroDate: { fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.7)", marginTop: 6 },
    card: { borderRadius: 22, borderWidth: 1, marginBottom: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    cardAccentBar: { height: 4 },
    cardTitle: { fontSize: 16, fontWeight: "800", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
    infoLabel: { fontSize: 14, fontWeight: "600" },
    infoValue: { fontSize: 14, fontWeight: "800", maxWidth: "60%", textAlign: "right" },
    commissionBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginVertical: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
    commissionLabel: { fontSize: 13, fontWeight: "700" },
    commissionValue: { fontSize: 18, fontWeight: "900" },
    stripRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
    stripLabel: { fontSize: 13, fontWeight: "600" },
    stripValue: { fontSize: 13, fontWeight: "800" },
    metaBox: { marginHorizontal: 16, marginBottom: 14, borderRadius: 12, borderWidth: 1, padding: 12 },
    metaLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
    metaText: { fontFamily: "monospace", fontSize: 11, lineHeight: 18 },
});
