import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { getCountryByCode, stripLeadingZero } from "@/constants/countries";
import { useTranslation } from "react-i18next";

const normalizeLocalPhoneInput = (value: string) =>
  stripLeadingZero(value).replace(/\D/g, "").slice(0, 15);

const formatPhoneForDisplay = (value: string) => {
  const digits = normalizeLocalPhoneInput(value);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
};

export default function AgentProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { stats, dashboardData, withdrawalRequests, fetchAgentStats, fetchDashboard, fetchWithdrawalRequests, loading } = useAgentStore();

  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const countryCode = (user as any)?.country_code || (user as any)?.country || "";
  const countryInfo = countryCode ? getCountryByCode(countryCode) : null;

  const theme = {
    bg: isDark ? "#090B14" : "#F5F4FC",
    card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
    cardAlt: isDark ? "rgba(255, 255, 255, 0.05)" : "#F9F8FF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E1638" : "#EDE9FE",
    accent: "#7C3AED",
    accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
    green: "#00B14F",
    greenLight: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)",
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) {
      setHeaderMaxHeight(height);
    }
  };

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const subtitleMaxHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [80, 0],
    extrapolate: "clamp",
  });

  const subtitleMargin = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [4, 0],
    extrapolate: "clamp",
  });

  const loadData = useCallback(async () => {
    await Promise.all([fetchAgentStats(), fetchDashboard(), fetchWithdrawalRequests()]);
  }, [fetchAgentStats, fetchDashboard, fetchWithdrawalRequests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "platinum": return "#A855F7";
      case "gold": return "#F59E0B";
      case "silver": return "#94A3B8";
      case "bronze": return "#B45309";
      default: return "#9CA3AF";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active": return "#00B14F";
      case "pending": return "#F59E0B";
      case "suspended": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const baseMaxWithdrawable = dashboardData?.financials?.total_deposit ?? 0;
  const pendingReserved = (withdrawalRequests || []).reduce((sum, req) => {
    if (req.status !== "pending") return sum;
    const value = parseFloat(req.amount_usd || "0");
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
  const effectiveMaxWithdrawable = Math.max(0, baseMaxWithdrawable - pendingReserved);
  const pendingWithdrawals = (withdrawalRequests || []).filter((r) => r.status === "pending");
  const approvedUnpaidWithdrawals = (withdrawalRequests || []).filter((r) => r.status === "approved" && !r.paid_at);
  const totalPendingAmount = pendingWithdrawals.reduce((sum, r) => sum + (parseFloat(r.amount_usd || "0") || 0), 0);
  const totalApprovedUnpaidAmount = approvedUnpaidWithdrawals.reduce((sum, r) => sum + (parseFloat(r.amount_usd || "0") || 0), 0);

  const formatContactNumber = (value?: string | null) => {
    if (!value?.trim()) return "N/A";
    const formatted = formatPhoneForDisplay(value);
    if (!formatted) return "N/A";
    return countryInfo ? `${countryInfo.dialCode} ${formatted}` : formatted;
  };

  const getInitials = (name?: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const agentTier = dashboardData?.agent?.tier || "Bronze";
  const agentStatus = dashboardData?.agent?.status || "Pending";
  const agentRating = parseFloat(dashboardData?.agent?.rating || "5");

  const infoRows = [
    { icon: "person-outline", iconBg: theme.accentLight, iconColor: theme.accent, label: t("agent.profile.full_name", "Full Name"), value: user?.full_name || "N/A" },
    { icon: "mail-outline", iconBg: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF", iconColor: "#3B82F6", label: t("agent.profile.email", "Email"), value: user?.email || "N/A" },
    { icon: "call-outline", iconBg: theme.greenLight, iconColor: theme.green, label: t("agent.profile.phone", "Phone"), value: formatContactNumber(user?.phone_number) },
    { icon: "logo-whatsapp", iconBg: theme.greenLight, iconColor: "#25D366", label: t("agent.profile.whatsapp", "WhatsApp"), value: formatContactNumber((user as any)?.whatsapp_number || user?.phone_number) },
    { icon: "location-outline", iconBg: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB", iconColor: "#D97706", label: t("agent.profile.country", "Country"), value: countryInfo ? `${countryInfo.name} (${countryInfo.code})` : "N/A" },
  ];

  const businessRows = [
    { icon: "business-outline", iconBg: isDark ? "rgba(219,39,119,0.12)" : "#FDF2F8", iconColor: "#DB2777", label: t("agent.profile.bank_name", "Bank Name"), value: (user as any)?.bank_name || t("agent.profile.not_set", "Not set") },
    { icon: "card-outline", iconBg: theme.accentLight, iconColor: theme.accent, label: t("agent.profile.account_number", "Account Number"), value: (user as any)?.account_number || t("agent.profile.not_set", "Not set") },
    { icon: "person-circle-outline", iconBg: theme.accentLight, iconColor: theme.accent, label: t("agent.profile.account_name", "Account Name"), value: (user as any)?.account_name || t("agent.profile.not_set", "Not set") },
    { icon: "wallet-outline", iconBg: theme.accentLight, iconColor: theme.accent, label: t("agent.profile.withdrawal_address", "Withdrawal Address"), value: (user as any)?.withdrawal_address || t("agent.profile.not_set", "Not set"), truncate: true },
    ...((user as any)?.mobile_money_provider || (user as any)?.mobile_money_number ? [
      { icon: "phone-portrait-outline", iconBg: isDark ? "rgba(234,88,12,0.12)" : "#FFF7ED", iconColor: "#EA580C", label: t("agent.profile.mobile_money_provider", "Mobile Money Provider"), value: (user as any)?.mobile_money_provider || "—" },
      { icon: "call-outline", iconBg: isDark ? "rgba(234,88,12,0.12)" : "#FFF7ED", iconColor: "#EA580C", label: t("agent.profile.mobile_money_number", "Mobile Money Number"), value: formatContactNumber((user as any)?.mobile_money_number) === "N/A" ? "—" : formatContactNumber((user as any)?.mobile_money_number) },
    ] : []),
    { icon: "shield-checkmark-outline", iconBg: theme.greenLight, iconColor: theme.green, label: t("agent.profile.verification", "Verification"), value: (user as any)?.is_verified ? t("agent.profile.verified", "Verified ✓") : t("agent.profile.not_verified", "Not Verified") },
  ] as Array<{ icon: string; iconBg: string; iconColor: string; label: string; value: string; truncate?: boolean }>;

  const settingsRows = [
    { icon: "create-outline", iconBg: theme.accentLight, iconColor: theme.accent, label: t("agent.profile.edit_profile", "Edit Profile"), path: "/modals/agent/edit-profile?from=agent-profile" },
    { icon: "card-outline", iconBg: isDark ? "rgba(219,39,119,0.12)" : "#FDF2F8", iconColor: "#DB2777", label: t("agent.profile.update_bank", "Update Bank Details"), path: "/modals/agent/edit-bank-details?from=agent-profile" },
    { icon: "cash-outline", iconBg: theme.greenLight, iconColor: theme.green, label: t("agent.profile.request_withdrawal", "Request Withdrawal"), path: "/modals/agent/withdrawal-request?from=agent-profile" },
    { icon: "shield-checkmark-outline", iconBg: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF", iconColor: "#3B82F6", label: t("agent.profile.view_kyc", "View KYC Status"), path: "/modals/agent-kyc/status?from=agent-profile" },
    { icon: "star", iconBg: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB", iconColor: "#F59E0B", label: t("agent.profile.view_reviews", "View Reviews ({{count}})", { count: stats?.total_reviews || 0 }), path: "/agent/reviews" },
  ];

  type InfoRow = { icon: string; iconBg: string; iconColor: string; label: string; value: string; truncate?: boolean };
  const renderInfoCard = (rows: InfoRow[]) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {rows.map((row, idx) => (
        <View key={row.label}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconBox, { backgroundColor: row.iconBg }]}>
              <Ionicons name={row.icon as any} size={18} color={row.iconColor} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.muted }]}>{row.label}</Text>
              <Text
                style={[styles.infoValue, { color: theme.text }]}
                numberOfLines={row.truncate ? 1 : undefined}
                ellipsizeMode={row.truncate ? "middle" : undefined}
              >
                {row.value}
              </Text>
            </View>
          </View>
          {idx < rows.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Background Glow */}
      <LinearGradient
        colors={isDark ? ["rgba(124, 58, 237, 0.22)", "rgba(9, 11, 20, 0)"] : ["rgba(124, 58, 237, 0.18)", "rgba(255, 255, 255, 0)"]}
        style={styles.backgroundGlow}
        pointerEvents="none"
      />

      {/* Collapsing Header */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[
          styles.headerWrapper,
          {
            backgroundColor: theme.bg,
            borderBottomColor: theme.border,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          },
        ]}
      >
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("agent.profile.header_title", "Agent Profile")}</Text>
              <Animated.View style={{
                opacity: subtitleOpacity,
                maxHeight: subtitleMaxHeight,
                marginTop: subtitleMargin,
                overflow: "hidden"
              }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("agent.profile.header_subtitle", "Manage bank details, check review scores, and request withdrawals.")}
                </Text>
              </Animated.View>
            </View>

            <TouchableOpacity
              style={[styles.switchBtn, { backgroundColor: theme.accentLight, borderColor: theme.border }]}
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal" size={13} color={theme.accent} style={{ marginRight: 4 }} />
              <Text style={[styles.switchBtnText, { color: theme.accent }]}>{t("agent.profile.user_mode", "User Mode")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={theme.accent} />}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Spacer matching the header height */}
        <View style={{ height: headerMaxHeight }} />

        {/* Brand New Modern Hero Profile Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[theme.accent, "#3B82F6"]}
              style={styles.avatarGradientRing}
            >
              <View style={[styles.avatarInner, { backgroundColor: theme.card }]}>
                <Text style={[styles.avatarText, { color: theme.text }]}>
                  {getInitials(user?.full_name)}
                </Text>
              </View>
            </LinearGradient>
            <View style={[styles.verifiedBadge, { backgroundColor: theme.card, shadowColor: isDark ? "#000" : theme.accent }]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.green} />
            </View>
          </View>

          <Text style={[styles.userName, { color: theme.text }]}>{user?.full_name || "Agent"}</Text>
          <Text style={[styles.userEmail, { color: theme.muted }]}>{user?.email}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.tierBadge, { backgroundColor: getTierColor(agentTier) + "18", borderColor: getTierColor(agentTier) + "30" }]}>
              <Ionicons name="trophy" size={12} color={getTierColor(agentTier)} />
              <Text style={[styles.tierBadgeText, { color: getTierColor(agentTier) }]}>{agentTier.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(agentStatus) + "12", borderColor: getStatusColor(agentStatus) + "30" }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(agentStatus) }]} />
              <Text style={[styles.statusBadgeText, { color: getStatusColor(agentStatus) }]}>{agentStatus.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Snapshot stats segmented row */}
        <View style={[styles.statsRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: theme.text }]}>{agentRating.toFixed(1)}</Text>
            <View style={styles.ratingStars}>
              <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 2 }} />
              <Text style={[styles.ratingSubLabel, { color: theme.muted }]}>({stats?.total_reviews || 0})</Text>
            </View>
            <Text style={[styles.statLabel, { color: theme.muted }]}>{t("agent.profile.stat_rating", "Rating")}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: theme.text }]}>{dashboardData?.performance?.success_rate || "100%"}</Text>
            <View style={styles.placeholderMargin} />
            <Text style={[styles.statLabel, { color: theme.muted }]}>{t("agent.profile.stat_success_rate", "Success Rate")}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: theme.text }]}>{`${dashboardData?.performance?.response_time || "5"}m`}</Text>
            <View style={styles.placeholderMargin} />
            <Text style={[styles.statLabel, { color: theme.muted }]}>{t("agent.profile.stat_avg_response", "Avg Response")}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>{t("agent.profile.section_personal", "PERSONAL INFORMATION")}</Text>
          {renderInfoCard(infoRows)}
        </View>

        {/* Business Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>{t("agent.profile.section_business", "BUSINESS DETAILS")}</Text>
          {renderInfoCard(businessRows)}
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>{t("agent.profile.section_financial", "FINANCIAL SUMMARY")}</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.finGrid}>
              {[
                { label: t("agent.profile.fin_total_deposit", "Total Deposit"), value: `${(dashboardData?.financials?.total_deposit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`, color: theme.text },
                { label: t("agent.profile.fin_available_capacity", "Available Capacity"), value: `${(dashboardData?.financials?.available_capacity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`, color: theme.accent },
                { label: t("agent.profile.fin_total_earnings", "Total Earnings"), value: `${(dashboardData?.financials?.total_earnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`, color: theme.green },
                { label: t("agent.profile.fin_outstanding", "Outstanding"), value: `${(dashboardData?.financials?.outstanding_tokens ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`, color: theme.text },
                { label: t("agent.profile.fin_max_withdrawable", "Max Withdrawable"), value: `${effectiveMaxWithdrawable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`, color: theme.text },
                { label: t("agent.profile.fin_utilization_rate", "Utilization Rate"), value: dashboardData?.financials?.utilization_rate || "0%", color: theme.text },
              ].map((item) => (
                <View key={item.label} style={styles.finItem}>
                  <Text style={[styles.finLabel, { color: theme.muted }]}>{item.label}</Text>
                  <Text style={[styles.finValue, { color: item.color }]} numberOfLines={1} ellipsizeMode="tail">{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Withdrawal status */}
            <View style={styles.wdStatus}>
              <Text style={[styles.wdStatusTitle, { color: theme.text }]}>{t("agent.profile.withdrawal_status", "Withdrawal Status")}</Text>
              <View style={styles.wdRow}>
                <View style={styles.wdPill}>
                  <View style={[styles.wdDot, { backgroundColor: "#F59E0B" }]} />
                  <Text style={[styles.wdPillLabel, { color: theme.muted }]}>{t("agent.profile.wd_pending", "Pending")}</Text>
                </View>
                <Text style={[styles.wdPillValue, { color: theme.text }]}>
                  {pendingWithdrawals.length} • {totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </Text>
              </View>
              <View style={styles.wdRow}>
                <View style={styles.wdPill}>
                  <View style={[styles.wdDot, { backgroundColor: "#3B82F6" }]} />
                  <Text style={[styles.wdPillLabel, { color: theme.muted }]}>{t("agent.profile.wd_approved_unpaid", "Approved (Unpaid)")}</Text>
                </View>
                <Text style={[styles.wdPillValue, { color: theme.text }]}>
                  {approvedUnpaidWithdrawals.length} • {totalApprovedUnpaidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>{t("agent.profile.section_performance", "PERFORMANCE METRICS")}</Text>
          <View style={[styles.perfCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {[
              { icon: "swap-horizontal", iconBg: theme.accentLight, iconColor: theme.accent, label: t("agent.profile.perf_total_tx", "Total Transactions"), value: dashboardData?.performance?.total_transactions || "0" },
              { icon: "checkmark-done-circle", iconBg: theme.greenLight, iconColor: theme.green, label: t("agent.profile.perf_success_rate", "Success Rate"), value: dashboardData?.performance?.success_rate || "100%" },
              { icon: "time-outline", iconBg: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB", iconColor: "#D97706", label: t("agent.profile.perf_response_time", "Response Time"), value: `${dashboardData?.performance?.response_time || "5"} mins` },
            ].map((item) => (
              <View key={item.label} style={styles.perfItem}>
                <View style={[styles.perfIconBox, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
                </View>
                <Text style={[styles.perfLabel, { color: theme.muted }]}>{item.label}</Text>
                <Text style={[styles.perfValue, { color: theme.text }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.muted }]}>{t("agent.profile.section_settings", "ACCOUNT SETTINGS")}</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {settingsRows.map((row, idx) => (
              <View key={row.label}>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => router.push(row.path as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.infoIconBox, { backgroundColor: row.iconBg }]}>
                    <Ionicons name={row.icon as any} size={18} color={row.iconColor} />
                  </View>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>{row.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.muted} />
                </TouchableOpacity>
                {idx < settingsRows.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: theme.danger + "20", backgroundColor: theme.dangerSoft }]}
          onPress={() => {
            useAuthStore.getState().logout();
            router.replace("/(auth)/login");
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out" size={18} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>{t("agent.profile.logout", "Logout Account")}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingTop: 12,
  },
  headerCopy: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  backgroundGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGradientRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 102,
    height: 102,
    borderRadius: 51,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    borderRadius: 999,
    padding: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  ratingSubLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 2,
  },
  placeholderMargin: {
    marginBottom: 4,
    height: 14,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    height: 28,
    alignSelf: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  divider: {
    height: 1,
  },
  finGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
  },
  finItem: {
    width: "50%",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  finLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  finValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  wdStatus: {
    padding: 16,
    paddingTop: 12,
  },
  wdStatusTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },
  wdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  wdPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  wdDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  wdPillLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  wdPillValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  perfCard: {
    flexDirection: "row",
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  perfItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  perfIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  perfLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textAlign: "center",
    marginBottom: 4,
  },
  perfValue: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 15,
    marginTop: 10,
    shadowColor: "#EF4444",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "800",
  },
});
