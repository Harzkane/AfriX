import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { WithdrawalRequest } from "@/stores/types/agent.types";
import { formatAmount, formatDate } from "@/utils/format";

const getCommissionPresentation = (tx: any, tokenType: string) => {
    const rawAmount = tx.agent_commission ?? tx.fee_amount ?? tx.fee ?? 0;
    const amount = formatAmount(rawAmount, tokenType);
    const label = tx.fee_kind === "agent_commission"
        ? (tx.fee_label || "Agent Commission")
        : "Commission earned";
    return { amount, label };
};

export default function AgentDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const {
        stats,
        dashboardData,
        fetchAgentStats,
        fetchDashboard,
        fetchPendingRequests,
        fetchWithdrawalRequests,
        withdrawalRequests,
        loading,
    } = useAgentStore();

    const theme = {
        bg: isDark ? "#090B14" : "#F5F4FC",
        card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "#1E1638" : "#EDE9FE",
        accent: "#7C3AED",
        accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
        green: "#00B14F",
        greenLight: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)",
        amber: "#D97706",
        amberLight: isDark ? "rgba(217, 119, 6, 0.12)" : "rgba(217, 119, 6, 0.06)",
        blue: "#3B82F6",
        blueLight: isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.06)",
        danger: "#EF4444",
        dangerLight: isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.06)",
    };

    const loadData = useCallback(async () => {
        await Promise.all([fetchAgentStats(), fetchDashboard(), fetchPendingRequests(), fetchWithdrawalRequests()]);
    }, [fetchAgentStats, fetchDashboard, fetchPendingRequests, fetchWithdrawalRequests]);

    useEffect(() => { loadData(); }, [loadData]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    // Computed values
    const totalEarningsUsdt = dashboardData?.financials?.total_earnings_usdt ?? 0;
    const availableCapacityUsdt = dashboardData?.financials?.available_capacity ?? stats?.available_capacity ?? 0;
    const outstandingTokens = dashboardData?.financials?.outstanding_tokens ?? 0;
    const totalDepositedFloat = dashboardData?.financials?.total_deposit ?? 0;
    const pendingRequestsCount = stats?.pending_requests || 0;
    const totalMintedUsdt = dashboardData?.financials?.total_minted_usdt ?? 0;
    const totalBurnedUsdt = dashboardData?.financials?.total_burned_usdt ?? 0;

    const getWithdrawalStatusColor = (status: string) => {
        switch (status) {
            case "pending": return { bg: theme.amberLight, text: theme.amber };
            case "paid": return { bg: theme.greenLight, text: theme.green };
            case "approved": return { bg: theme.blueLight, text: theme.blue };
            case "rejected": return { bg: theme.dangerLight, text: theme.danger };
            default: return { bg: theme.accentLight, text: theme.accent };
        }
    };

    const getDepositStatusColor = (status?: string) => {
        const s = (status || "").toLowerCase();
        if (s === "completed" || s === "verified") return { bg: theme.greenLight, text: theme.green, label: "Verified" };
        if (s === "pending") return { bg: theme.amberLight, text: theme.amber, label: "Pending" };
        if (s === "failed" || s === "rejected") return { bg: theme.dangerLight, text: theme.danger, label: "Rejected" };
        return { bg: theme.blueLight, text: theme.blue, label: "Processing" };
    };

    const getInitials = (name?: string) => {
        if (!name) return "A";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Background Glow */}
            <LinearGradient
                colors={isDark ? ["rgba(124, 58, 237, 0.18)", "rgba(9, 11, 20, 0)"] : ["rgba(124, 58, 237, 0.12)", "rgba(255, 255, 255, 0)"]}
                style={styles.backgroundGlow}
                pointerEvents="none"
            />

            {/* Sticky Top Header */}
            <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.logoText, { color: theme.text }]}>
                            Afri<Text style={{ color: "#00B14F" }}>X</Text> <Text style={{ color: theme.accent, fontSize: 16 }}>Agent</Text>
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            style={[styles.switchBtn, { backgroundColor: theme.accentLight, borderColor: theme.border }]}
                            onPress={() => router.replace("/(tabs)")}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="swap-horizontal" size={13} color={theme.accent} style={{ marginRight: 4 }} />
                            <Text style={[styles.switchBtnText, { color: theme.accent }]}>User Mode</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={() => router.push("/agent/(tabs)/profile")}
                        >
                            <View style={[styles.agentRing, { borderColor: theme.accent }]} />
                            <View style={styles.avatarMain}>
                                <View style={styles.avatarInner}>
                                    <Text style={styles.avatarInitials}>{getInitials(user?.full_name)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={theme.accent} />}
                showsVerticalScrollIndicator={false}
            >

                {/* ─── Hero Earnings Card ─── */}
                <LinearGradient
                    colors={["#5B21B6", "#7C3AED", "#6D28D9"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    {/* Top row */}
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroBadge}>
                            <Ionicons name="flash" size={12} color="#EDE9FE" />
                            <Text style={styles.heroBadgeText}>Live Agent Snapshot</Text>
                        </View>
                        {pendingRequestsCount > 0 && (
                            <View style={styles.heroPendingChip}>
                                <View style={styles.heroPendingDot} />
                                <Text style={styles.heroPendingText}>{pendingRequestsCount} pending</Text>
                            </View>
                        )}
                    </View>

                    {/* Earnings */}
                    <Text style={styles.heroLabel}>Total Earnings</Text>
                    <Text style={styles.heroValue}>{formatAmount(totalEarningsUsdt, "USDT")} <Text style={styles.heroValueSuffix}>USDT</Text></Text>
                    <Text style={styles.heroSubtext}>Combined commission across your completed mint and burn activity.</Text>

                    {/* Stats strip */}
                    <View style={styles.heroStatsRow}>
                        <View style={styles.heroStatBlock}>
                            <Text style={styles.heroStatCaption}>Float Capacity</Text>
                            <Text style={styles.heroStatValue}>{formatAmount(availableCapacityUsdt, "USDT")} USDT</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroStatBlock}>
                            <Text style={styles.heroStatCaption}>Success Rate</Text>
                            <Text style={styles.heroStatValue}>{dashboardData?.performance?.success_rate || "100%"}</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroStatBlock}>
                            <Text style={styles.heroStatCaption}>Avg Response</Text>
                            <Text style={styles.heroStatValue}>{dashboardData?.performance?.response_time || "5"} min</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* ─── Quick Insight Pills ─── */}
                <View style={styles.insightRow}>
                    {[
                        { icon: "time-outline", iconBg: theme.amberLight, iconColor: theme.amber, label: "Pending", value: String(pendingRequestsCount) },
                        { icon: "analytics-outline", iconBg: theme.blueLight, iconColor: theme.blue, label: "Net Activity", value: `${formatAmount(totalMintedUsdt - totalBurnedUsdt, "USDT")} USDT` },
                        { icon: "star", iconBg: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB", iconColor: "#F59E0B", label: "Rating", value: dashboardData?.agent?.rating || "5.0" },
                    ].map((item) => (
                        <View key={item.label} style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.insightIconBox, { backgroundColor: item.iconBg }]}>
                                <Ionicons name={item.icon as any} size={16} color={item.iconColor} />
                            </View>
                            <Text style={[styles.insightLabel, { color: theme.muted }]}>{item.label}</Text>
                            <Text style={[styles.insightValue, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{item.value}</Text>
                        </View>
                    ))}
                </View>

                {/* ─── Quick Actions ─── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.muted }]}>QUICK ACTIONS</Text>
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {[
                            {
                                icon: "list", iconBg: theme.accentLight, iconColor: theme.accent,
                                label: "Review Requests", sub: "Process incoming mint and burn tasks.",
                                onPress: () => router.push({ pathname: "/agent/requests", params: { tab: "mint" } } as any),
                            },
                            {
                                icon: "wallet", iconBg: theme.greenLight, iconColor: theme.green,
                                label: "Deposit Funds", sub: "Top up your float and keep exchange capacity healthy.",
                                onPress: () => router.push("/agent/deposit"),
                            },
                            {
                                icon: "cash-outline", iconBg: theme.blueLight, iconColor: theme.blue,
                                label: "Request Withdrawal", sub: "Cash out your earned commissions.",
                                onPress: () => router.push("/modals/agent/withdrawal-request?from=agent-dashboard"),
                            },
                        ].map((action, idx, arr) => (
                            <View key={action.label}>
                                <TouchableOpacity style={styles.actionRow} onPress={action.onPress} activeOpacity={0.7}>
                                    <View style={[styles.actionIconBox, { backgroundColor: action.iconBg }]}>
                                        <Ionicons name={action.icon as any} size={20} color={action.iconColor} />
                                    </View>
                                    <View style={styles.actionTextWrap}>
                                        <Text style={[styles.actionLabel, { color: theme.text }]}>{action.label}</Text>
                                        <Text style={[styles.actionSub, { color: theme.muted }]}>{action.sub}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={theme.muted} />
                                </TouchableOpacity>
                                {idx < arr.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* ─── Agent Float & Liquidity ─── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.muted }]}>FLOAT & LIQUIDITY</Text>
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {[
                            {
                                icon: "speedometer-outline", iconBg: theme.accentLight, iconColor: theme.accent,
                                label: "Available Capacity", sub: "Liquidity limit to process trades",
                                value: `${formatAmount(availableCapacityUsdt, "USDT")} USDT`,
                                valueColor: theme.accent,
                            },
                            {
                                icon: "hourglass-outline", iconBg: theme.amberLight, iconColor: theme.amber,
                                label: "Outstanding Balance", sub: "Float currently tied in processes",
                                value: `${formatAmount(outstandingTokens, "USDT")} USDT`,
                                valueColor: theme.amber,
                            },
                            {
                                icon: "wallet-outline", iconBg: theme.greenLight, iconColor: theme.green,
                                label: "Total Deposited Float", sub: "Agent collateral in smart contract",
                                value: `${formatAmount(totalDepositedFloat, "USDT")} USDT`,
                                valueColor: theme.green,
                            },
                        ].map((row, idx, arr) => (
                            <View key={row.label}>
                                <View style={styles.floatRow}>
                                    <View style={[styles.actionIconBox, { backgroundColor: row.iconBg }]}>
                                        <Ionicons name={row.icon as any} size={20} color={row.iconColor} />
                                    </View>
                                    <View style={styles.floatTextWrap}>
                                        <Text style={[styles.floatLabel, { color: theme.text }]}>{row.label}</Text>
                                        <Text style={[styles.floatSub, { color: theme.muted }]}>{row.sub}</Text>
                                    </View>
                                    <Text style={[styles.floatValue, { color: row.valueColor }]} numberOfLines={1}>{row.value}</Text>
                                </View>
                                {idx < arr.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* ─── Token Performance ─── */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.muted }]}>TOKEN PERFORMANCE</Text>
                    <View style={[styles.tokenPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>

                        {/* Column header chips */}
                        <View style={styles.tokenColHeaders}>
                            <View style={styles.tokenColHeaderLabel} />
                            {[
                                { label: "Earnings", icon: "cash-outline", iconColor: theme.green, iconBg: theme.greenLight },
                                { label: "Minted", icon: "arrow-up-circle-outline", iconColor: theme.blue, iconBg: theme.blueLight },
                                { label: "Burned", icon: "flame-outline", iconColor: theme.danger, iconBg: theme.dangerLight },
                            ].map((col) => (
                                <View key={col.label} style={styles.tokenColHeaderCell}>
                                    <View style={[styles.tokenColIconBox, { backgroundColor: col.iconBg }]}>
                                        <Ionicons name={col.icon as any} size={13} color={col.iconColor} />
                                    </View>
                                    <Text style={[styles.tokenColHeaderText, { color: theme.muted }]}>{col.label}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={[styles.tokenDivider, { backgroundColor: theme.border }]} />

                        {/* NT Row */}
                        {[
                            { code: "NT", codeBg: theme.accentLight, codeColor: theme.accent },
                            { code: "CT", codeBg: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB", codeColor: "#D97706" },
                        ].map((tok, tokIdx, tokArr) => (
                            <View key={tok.code}>
                                <View style={styles.tokenDataRow}>
                                    {/* Token badge */}
                                    <View style={[styles.tokenBadge, { backgroundColor: tok.codeBg }]}>
                                        <Text style={[styles.tokenBadgeText, { color: tok.codeColor }]}>{tok.code}</Text>
                                    </View>

                                    {/* Earnings cell */}
                                    <View style={styles.tokenDataCell}>
                                        <Text style={[styles.tokenDataPrimary, { color: theme.text }]} numberOfLines={1}>
                                            {formatAmount((dashboardData?.financials?.total_earnings_by_token as Record<string, number>)?.[tok.code] ?? 0, tok.code)} {tok.code}
                                        </Text>
                                        <Text style={[styles.tokenDataSub, { color: theme.muted }]} numberOfLines={1}>
                                            ≈ {formatAmount((dashboardData?.financials?.total_earnings_by_token_usdt as Record<string, number>)?.[tok.code] ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>

                                    {/* Minted cell */}
                                    <View style={styles.tokenDataCell}>
                                        <Text style={[styles.tokenDataPrimary, { color: theme.text }]} numberOfLines={1}>
                                            {formatAmount((dashboardData?.financials?.total_minted_by_token as Record<string, number>)?.[tok.code] ?? 0, tok.code)} {tok.code}
                                        </Text>
                                        <Text style={[styles.tokenDataSub, { color: theme.muted }]} numberOfLines={1}>
                                            ≈ {formatAmount((dashboardData?.financials?.total_minted_by_token_usdt as Record<string, number>)?.[tok.code] ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>

                                    {/* Burned cell */}
                                    <View style={styles.tokenDataCell}>
                                        <Text style={[styles.tokenDataPrimary, { color: theme.text }]} numberOfLines={1}>
                                            {formatAmount((dashboardData?.financials?.total_burned_by_token as Record<string, number>)?.[tok.code] ?? 0, tok.code)} {tok.code}
                                        </Text>
                                        <Text style={[styles.tokenDataSub, { color: theme.muted }]} numberOfLines={1}>
                                            ≈ {formatAmount((dashboardData?.financials?.total_burned_by_token_usdt as Record<string, number>)?.[tok.code] ?? 0, "USDT")} USDT
                                        </Text>
                                    </View>
                                </View>
                                {tokIdx < tokArr.length - 1 && <View style={[styles.tokenDivider, { backgroundColor: theme.border }]} />}
                            </View>
                        ))}
                    </View>
                </View>

                {/* ─── Recent Deposits ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.muted }]}>RECENT DEPOSITS</Text>
                        <TouchableOpacity onPress={() => router.push("/agent/deposit-history")} activeOpacity={0.7}>
                            <Text style={[styles.viewAll, { color: theme.accent }]}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {dashboardData?.deposit_history && dashboardData.deposit_history.length > 0 ? (
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {dashboardData.deposit_history.map((deposit: any, index: number) => {
                                const ds = getDepositStatusColor(deposit.status);
                                return (
                                    <View key={deposit.id}>
                                        <TouchableOpacity
                                            style={styles.listRow}
                                            activeOpacity={0.7}
                                            onPress={() => router.push("/agent/deposit-history")}
                                        >
                                            <View style={[styles.listIcon, { backgroundColor: theme.greenLight }]}>
                                                <Ionicons name="arrow-down" size={18} color={theme.green} />
                                            </View>
                                            <View style={styles.listInfo}>
                                                <Text style={[styles.listEyebrow, { color: theme.muted }]}>Deposit</Text>
                                                <Text style={[styles.listAmount, { color: theme.text }]}>+{formatAmount(deposit.amount, "USDT")} USDT</Text>
                                                <Text style={[styles.listDate, { color: theme.muted }]}>{formatDate(deposit.created_at)}</Text>
                                            </View>
                                            <View style={[styles.statusPill, { backgroundColor: ds.bg }]}>
                                                <Text style={[styles.statusPillText, { color: ds.text }]}>{ds.label}</Text>
                                            </View>
                                        </TouchableOpacity>
                                        {index < dashboardData.deposit_history.length - 1 && (
                                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="wallet-outline" size={28} color={theme.muted} style={{ marginBottom: 8 }} />
                            <Text style={[styles.emptyText, { color: theme.muted }]}>No recent deposits</Text>
                        </View>
                    )}
                </View>

                {/* ─── Recent Withdrawals ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.muted }]}>RECENT WITHDRAWALS</Text>
                        <TouchableOpacity onPress={() => router.push("/agent/withdrawal-history")} activeOpacity={0.7}>
                            <Text style={[styles.viewAll, { color: theme.accent }]}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {withdrawalRequests.length > 0 ? (
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {withdrawalRequests.slice(0, 3).map((request: WithdrawalRequest, index: number) => {
                                const ws = getWithdrawalStatusColor(request.status);
                                return (
                                    <View key={request.id}>
                                        <TouchableOpacity
                                            style={styles.listRow}
                                            activeOpacity={0.7}
                                            onPress={() => router.push("/agent/withdrawal-history")}
                                        >
                                            <View style={[styles.listIcon, { backgroundColor: theme.dangerLight }]}>
                                                <Ionicons name="arrow-up" size={18} color={theme.danger} />
                                            </View>
                                            <View style={styles.listInfo}>
                                                <Text style={[styles.listEyebrow, { color: theme.muted }]}>Withdrawal</Text>
                                                <Text style={[styles.listAmount, { color: theme.text }]}>{formatAmount(request.amount_usd, "USDT")} USDT</Text>
                                                <Text style={[styles.listDate, { color: theme.muted }]}>{formatDate(request.created_at)}</Text>
                                            </View>
                                            <View style={[styles.statusPill, { backgroundColor: ws.bg }]}>
                                                <Text style={[styles.statusPillText, { color: ws.text }]}>
                                                    {request.status === "approved" ? "Approved" : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        {index < Math.min(withdrawalRequests.length, 3) - 1 && (
                                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="cash-outline" size={28} color={theme.muted} style={{ marginBottom: 8 }} />
                            <Text style={[styles.emptyText, { color: theme.muted }]}>No withdrawal requests</Text>
                        </View>
                    )}
                </View>

                {/* ─── Recent Transactions ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.muted }]}>RECENT TRANSACTIONS</Text>
                        <TouchableOpacity onPress={() => router.push({ pathname: "/agent/requests", params: { tab: "history" } } as any)} activeOpacity={0.7}>
                            <Text style={[styles.viewAll, { color: theme.accent }]}>View All</Text>
                        </TouchableOpacity>
                    </View>
                    {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {dashboardData.recent_transactions.slice(0, 5).map((tx: any, index: number) => {
                                const isMint = tx.type === "mint";
                                const userName = isMint ? tx.toUser?.full_name : tx.fromUser?.full_name;
                                const tokenType = tx.token_type || "NT";
                                const commission = getCommissionPresentation(tx, tokenType);
                                return (
                                    <View key={tx.id}>
                                        <TouchableOpacity
                                            style={styles.listRow}
                                            activeOpacity={0.7}
                                            onPress={() => router.push(`/agent/transaction-details/${tx.id}`)}
                                        >
                                            <View style={[styles.listIcon, { backgroundColor: isMint ? theme.greenLight : theme.amberLight }]}>
                                                <Ionicons name={isMint ? "arrow-up" : "arrow-down"} size={18} color={isMint ? theme.green : theme.amber} />
                                            </View>
                                            <View style={styles.listInfo}>
                                                <Text style={[styles.listEyebrow, { color: theme.muted }]}>{isMint ? "Mint Transaction" : "Burn Transaction"}</Text>
                                                <Text style={[styles.listAmount, { color: theme.text }]}>{userName || "Unknown user"}</Text>
                                                <Text style={[styles.listDate, { color: theme.muted }]}>{formatDate(tx.created_at)}</Text>
                                            </View>
                                            <View style={styles.txAmountCol}>
                                                <Text style={[styles.txAmount, { color: theme.text }]}>{formatAmount(tx.amount, tx.token_type)} {tx.token_type}</Text>
                                                <Text style={[styles.txCommission, { color: theme.green }]}>+{commission.amount} {tokenType}</Text>
                                            </View>
                                        </TouchableOpacity>
                                        {index < Math.min(dashboardData.recent_transactions.length, 5) - 1 && (
                                            <View style={[styles.divider, { backgroundColor: theme.border }]} />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="swap-horizontal" size={28} color={theme.muted} style={{ marginBottom: 8 }} />
                            <Text style={[styles.emptyText, { color: theme.muted }]}>No recent transactions</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    backgroundGlow: {
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 200,
    },

    // ── Header ──
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
        justifyContent: "center",
    },
    logoText: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatarContainer: {
        width: 38,
        height: 38,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    avatarMain: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(124, 58, 237, 0.12)",
        borderWidth: 1,
        borderColor: "rgba(124, 58, 237, 0.2)",
    },
    avatarInner: {
        width: "100%",
        height: "100%",
        borderRadius: 17,
        backgroundColor: "rgba(124, 58, 237, 0.15)",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    avatarInitials: {
        color: "#7C3AED",
        fontSize: 14,
        fontWeight: "700",
    },
    agentRing: {
        position: "absolute",
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.5,
        borderColor: "#7C3AED",
    },
    switchBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
    },
    switchBtnText: { fontSize: 12, fontWeight: "700" },

    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },

    // ── Hero Card ──
    heroCard: {
        borderRadius: 28,
        padding: 22,
        marginBottom: 16,
        shadowColor: "#7C3AED",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 8,
    },
    heroTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },
    heroBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    heroBadgeText: { fontSize: 10, fontWeight: "800", color: "#EDE9FE", textTransform: "uppercase", letterSpacing: 0.4 },
    heroPendingChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(255,255,255,0.12)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    heroPendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#A7F3D0" },
    heroPendingText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
    heroLabel: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
    heroValue: { fontSize: 34, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1, marginBottom: 6 },
    heroValueSuffix: { fontSize: 20, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
    heroSubtext: { fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.75)", marginBottom: 18 },
    heroStatsRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    heroStatBlock: { flex: 1 },
    heroDivider: { width: 1, alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.18)", marginHorizontal: 12 },
    heroStatCaption: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.68)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 },
    heroStatValue: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },

    // ── Insight Pills ──
    insightRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
    },
    insightCard: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 1,
        padding: 12,
        alignItems: "flex-start",
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    insightIconBox: {
        width: 32,
        height: 32,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    insightLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 },
    insightValue: { fontSize: 13, fontWeight: "800" },

    // ── Section ──
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    sectionTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 },
    viewAll: { fontSize: 13, fontWeight: "700" },

    // ── Card ──
    card: {
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    divider: { height: 1 },

    // ── Action Row ──
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    actionIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    actionTextWrap: { flex: 1 },
    actionLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
    actionSub: { fontSize: 12, fontWeight: "500", lineHeight: 17 },

    // ── Float Row ──
    floatRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    floatTextWrap: { flex: 1 },
    floatLabel: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
    floatSub: { fontSize: 12, fontWeight: "500" },
    floatValue: { fontSize: 14, fontWeight: "800", flexShrink: 0, maxWidth: 120, textAlign: "right" },

    // ── Token Performance ──
    // ── Token Performance Panel (matrix) ──
    tokenPanel: {
        borderRadius: 24,
        borderWidth: 1,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    tokenColHeaders: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    tokenColHeaderLabel: { width: 38 },
    tokenColHeaderCell: {
        flex: 1,
        alignItems: "center",
        gap: 5,
    },
    tokenColIconBox: {
        width: 28,
        height: 28,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    tokenColHeaderText: {
        fontSize: 10,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    tokenDivider: { height: 1 },
    tokenDataRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 4,
    },
    tokenBadge: {
        width: 34,
        height: 28,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 4,
    },
    tokenBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
    tokenDataCell: {
        flex: 1,
        alignItems: "center",
    },
    tokenDataPrimary: { fontSize: 12, fontWeight: "800", textAlign: "center" },
    tokenDataSub: { fontSize: 10, fontWeight: "500", marginTop: 2, textAlign: "center" },


    // ── List Rows ──
    listRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    listIcon: {
        width: 38,
        height: 38,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    listInfo: { flex: 1 },
    listEyebrow: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
    listAmount: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
    listDate: { fontSize: 11, fontWeight: "500" },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusPillText: { fontSize: 11, fontWeight: "700" },

    // ── Tx Amounts ──
    txAmountCol: { alignItems: "flex-end", flexShrink: 0, gap: 3 },
    txAmount: { fontSize: 13, fontWeight: "800" },
    txCommission: { fontSize: 11, fontWeight: "600" },

    // ── Empty ──
    emptyCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 30,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.02,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    emptyText: { fontSize: 14, fontWeight: "600" },
});
