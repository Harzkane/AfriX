// app/transactions/index.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/stores";
import { formatDate } from "@/utils/format";
import { useTranslation } from "react-i18next";

interface Transaction {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  fee?: string;
  fee_amount?: string | number;
  fee_kind?: string;
  fee_label?: string | null;
  platform_fee?: string | number;
  agent_commission?: string | number;
  token_type: string;
  description: string;
  created_at: string;
  from_user_id?: string;
  to_user_id?: string;
  metadata?: {
    request_id?: string;
    bank_reference?: string;
    received_amount?: number;
    to_token?: string;
    from_token?: string;
    [key: string]: any;
  };
  agent?: {
    id: string;
    tier: string;
    rating: number;
    user?: {
      full_name: string;
    };
  };
}

const getActivityIdentity = (item: Transaction) =>
  String(item.metadata?.request_id || item.reference || item.id || "");

const getActivityScore = (item: Transaction) => {
  const status = String(item.status || "").toLowerCase();
  const statusScore =
    status === "proof_submitted"
      ? 5
      : status === "escrowed"
        ? 4
        : status === "confirmed" || status === "completed"
          ? 3
          : status === "pending"
            ? 2
            : 1;
  const metadataScore = item.metadata ? 1 : 0;
  const agentScore = item.agent ? 1 : 0;

  return statusScore + metadataScore + agentScore;
};

const isAdminResolvedActivity = (item: Transaction) =>
  item.metadata?.admin_resolved === true;

const ACTIVE_ACTIVITY_STATUSES = [
  "pending",
  "proof_submitted",
  "escrowed",
  "fiat_sent",
  "processing",
  "disputed",
] as const;

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();

  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const FILTERS = [
    "all",
    "mint",
    "burn",
    "swap",
    "collection",
    "transfer",
    "credit",
    "debit",
  ] as const;
  type FilterType = (typeof FILTERS)[number];
  const [filter, setFilter] = useState<FilterType>("all");
  const filterScrollRef = useRef<ScrollView>(null);
  const tabLayoutX = useRef<number[]>([]);

  const ESTIMATED_TAB_WIDTH = 84;
  const FILTER_GAP = 12;
  const handleFilterPress = (f: FilterType) => {
    setFilter(f);
    const index = FILTERS.indexOf(f);
    if (index < 0) return;
    const x =
      tabLayoutX.current[index] !== undefined
        ? tabLayoutX.current[index] - 24
        : index * (ESTIMATED_TAB_WIDTH + FILTER_GAP);
    requestAnimationFrame(() => {
      filterScrollRef.current?.scrollTo({ x: Math.max(0, x), animated: true });
    });
  };

  const fetchAllTransactions = async () => {
    const limit = 100;
    let page = 1;
    let pages = 1;
    const collected: Transaction[] = [];

    while (page <= pages) {
      const { data } = await apiClient.get("/transactions", {
        params: { page, limit },
      });
      const txPage = data?.data?.transactions || [];
      const pagination = data?.data?.pagination;

      collected.push(...txPage);
      pages = pagination?.pages || 1;
      page += 1;
    }

    return collected;
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      const allTx = await fetchAllTransactions();

      // Fetch pending reviews (these have agent data)
      const { data: reviewData } = await apiClient.get(
        "/transactions/pending-review",
      );
      const pendingTx = reviewData.data.transactions || [];

      if (__DEV__) {
        console.log(
          "📊 API_ENDPOINTS.REQUESTS.USER:",
          API_ENDPOINTS.REQUESTS.USER,
        );
      }
      // Fetch user requests (pending mint/burn)
      const { data: requestData } = await apiClient.get(
        API_ENDPOINTS.REQUESTS.USER,
      );
      const requests = requestData.data || [];

      // Keep active requests for overlap filtering, but also keep closed request
      // outcomes so rejected/expired/cancelled items remain visible in Activity.
      const activeRequests = requests.filter(
        (r: any) =>
          ![
            "confirmed",
            "completed",
            "cancelled",
            "rejected",
            "expired",
          ].includes(r.status.toLowerCase()),
      );
      const visibleRequests = requests.filter(
        (r: any) =>
          !["confirmed", "completed"].includes(r.status.toLowerCase()),
      );
      if (__DEV__) {
        console.log(
          "📊 Fetched Requests:",
          requests.length,
          "Active:",
          activeRequests.length,
        );
      }

      // Map visible requests to Transaction format
      const formattedRequests = visibleRequests.map((req: any) => ({
        id: req.id,
        reference: req.id,
        type: req.type,
        status: req.status,
        amount: req.amount,
        token_type: req.token_type,
        description: `${req.type === "mint" ? "Mint" : "Burn"} Request`,
        created_at: req.created_at,
        agent: req.agent,
      }));

      // Create a map of pending transactions with agent data
      const pendingMap = new Map<string, Transaction>();
      pendingTx.forEach((tx: Transaction) => {
        pendingMap.set(tx.id, tx);
      });

      // Create a set of active request IDs to filter duplicates
      const activeRequestIds = new Set(activeRequests.map((r: any) => r.id));

      // Merge agent data from pending reviews into all transactions
      const mergedTransactions = allTx
        .map((tx: Transaction) => {
          const pendingTx = pendingMap.get(tx.id);
          if (pendingTx && pendingTx.agent) {
            return { ...tx, agent: pendingTx.agent };
          }
          return tx;
        })
        .filter((tx: Transaction) => {
          // If it's a transaction already shown as an active request, skip to avoid double entry.
          // This applies even if status is 'completed' (during the transient finalization phase).
          if (
            tx.metadata?.request_id &&
            activeRequestIds.has(tx.metadata.request_id)
          ) {
            return false;
          }
          return true;
        });
      const pendingIds = new Set<string>(
        pendingTx.map((tx: Transaction) => tx.id),
      );

      // Combine requests and transactions, then remove overlapping logical records.
      const dedupedItems = new Map<string, Transaction>();
      [...formattedRequests, ...mergedTransactions].forEach((item) => {
        const identity = getActivityIdentity(item);
        if (!identity) return;

        const current = dedupedItems.get(identity);
        if (!current || getActivityScore(item) > getActivityScore(current)) {
          dedupedItems.set(identity, item);
        }
      });

      const allItems = Array.from(dedupedItems.values()).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      if (__DEV__) {
        console.log(
          "📊 Merged:",
          mergedTransactions.length,
          "All Items:",
          allItems.length,
        );
      }

      setTransactions(allItems);
      setPendingReviews(pendingIds);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    return (tx.type || "").toLowerCase() === filter;
  });
  const pendingCount = transactions.filter(
    (tx) =>
      ACTIVE_ACTIVITY_STATUSES.includes(
        ((tx.status || "").toLowerCase() as (typeof ACTIVE_ACTIVITY_STATUSES)[number]),
      ),
  ).length;
  const currentFilterLabel =
    filter === "all"
      ? t("activity.overview_label", "Activity Overview")
      : t(`activity.filter_${filter}_label` as any, `${t(`activity.filter_${filter}` as any)} Activity`, { filter: t(`activity.filter_${filter}` as any) });
  const currentFilterSummary =
    filter === "all"
      ? t("activity.overview_summary", "Review every request and transaction outcome across mint, burn, swap, transfer, credit, and debit in one timeline.")
      : t(`activity.filter_${filter}_summary` as any, "Review your {{filter}} activity and track the current status of each entry.", { filter: t(`activity.filter_${filter}` as any).toLowerCase() });

  const completedCount = transactions.filter((tx) =>
    ["confirmed", "completed"].includes((tx.status || "").toLowerCase()),
  ).length;
  const failedCount = transactions.filter((tx) =>
    ["rejected", "expired", "cancelled", "failed"].includes(
      (tx.status || "").toLowerCase(),
    ),
  ).length;
  const activeCount = pendingCount;

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    surface: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    divider: isDark ? "#1E2A3A" : "#EEF2F7",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  };

  const activityStats = [
    { label: t("activity.stat_total", "Total"), value: transactions.length },
    { label: t("activity.stat_active", "Active"), value: activeCount },
    { label: t("activity.stat_completed", "Completed"), value: completedCount },
    { label: t("activity.stat_issues", "Issues"), value: failedCount },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "#00B14F";
      case "proof_submitted":
      case "escrowed":
      case "fiat_sent":
      case "pending":
      case "processing":
        return "#FFB800";
      case "disputed":
        return "#7C3AED";
      case "rejected":
      case "expired":
      case "cancelled":
      case "failed":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getTypeIcon = (type: string) => {
    switch ((type || "").toLowerCase()) {
      case "mint":
        return "add-circle";
      case "burn":
        return "remove-circle";
      case "transfer":
      case "swap":
      case "credit":
      case "debit":
        return "swap-horizontal";
      case "collection":
        return "folder-open";
      default:
        return "cash";
    }
  };

  const getTypeStyle = (type: string) => {
    switch ((type || "").toLowerCase()) {
      case "mint":
        return { bg: "#F0FDF4", color: "#00B14F" };
      case "burn":
        return { bg: "#FEF3C7", color: "#F59E0B" };
      case "swap":
        return { bg: "#F5F3FF", color: "#7C3AED" };
      case "collection":
        return { bg: "#ECFDF5", color: "#059669" };
      case "transfer":
      case "credit":
        return { bg: "#EFF6FF", color: "#3B82F6" };
      case "debit":
        return { bg: "#FEF2F2", color: "#DC2626" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const isCreditOrDebitType = (type: string) =>
    ["transfer", "swap", "credit", "debit"].includes(
      (type || "").toLowerCase(),
    );

  const isDebitForUser = (tx: Transaction) =>
    user?.id && tx.from_user_id === user.id;

  const getAmountPrefix = (tx: Transaction) => {
    if (tx.type === "burn") return "-";
    if (tx.type === "mint") return "+";
    if (isCreditOrDebitType(tx.type)) return isDebitForUser(tx) ? "-" : "+";
    return "+";
  };

  const getCreditDebitLabel = (tx: Transaction) => {
    if (!isCreditOrDebitType(tx.type)) return null;
    return isDebitForUser(tx) ? t("activity.filter_debit", "Debit") : t("activity.filter_credit", "Credit");
  };

  const handleTransactionPress = (tx: Transaction) => {
    if (tx.type === "mint") {
      if (tx.status.toLowerCase() === "pending") {
        router.push({
          pathname: "/modals/buy-tokens/upload-proof",
          params: { requestId: tx.id },
        });
      } else {
        const requestId = tx.metadata?.request_id || tx.id;
        router.push({
          pathname: "/modals/buy-tokens/status",
          params: { requestId: requestId },
        });
      }
    } else if (tx.type === "burn") {
      const requestId = tx.metadata?.request_id || tx.id;
      router.push({
        pathname: "/(tabs)/sell-tokens/status",
        params: { requestId: requestId },
      });
    } else if (
      ["swap", "collection", "transfer", "credit", "debit"].includes(
        (tx.type || "").toLowerCase(),
      )
    ) {
      router.push({
        pathname: "/(tabs)/transaction-details/[id]",
        params: { id: tx.id, from: "activity" },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={
          isDark
            ? ["rgba(0,177,79,0.18)", "rgba(7,17,26,0)"]
            : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]
        }
        style={styles.backgroundGlow}
        pointerEvents="none"
      />

      <Animated.View
        onLayout={handleHeaderLayout}
        style={[
          styles.headerWrapper,
          {
            backgroundColor: theme.background,
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
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backButton,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.text }]}>{t("activity.title")}</Text>
              <Animated.View style={{
                opacity: subtitleOpacity,
                maxHeight: subtitleMaxHeight,
                marginTop: subtitleMargin,
                overflow: "hidden"
              }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("activity.subtitle")}
                </Text>
              </Animated.View>
            </View>

            <View style={[styles.headerBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.headerBadgeText, { color: theme.text }]}>{t("agents.live")}</Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchTransactions}
            tintColor={theme.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Spacer matching the header height */}
        <View style={{ height: headerMaxHeight }} />
        <View style={styles.screenContent}>
          <LinearGradient
            colors={isDark ? ["#0E1726", "#111E2E"] : ["#FFFFFF", "#F4FBF7"]}
            style={[
              styles.heroCard,
              { borderColor: theme.border, shadowColor: isDark ? "#000" : "#0F172A" },
            ]}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <Text style={[styles.heroEyebrow, { color: theme.accent }]}>
                  {t("activity.timeline_title")}
                </Text>
                <Text style={[styles.heroTitle, { color: theme.text }]}>
                  {currentFilterLabel}
                </Text>
                <Text style={[styles.heroSubtitle, { color: theme.muted }]}>
                  {currentFilterSummary}
                </Text>
              </View>

              <View style={[styles.heroPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.heroPillLabel, { color: theme.text }]}>
                  {t("activity.updated_now")}
                </Text>
              </View>
            </View>

            <View style={styles.heroStatsGrid}>
              {activityStats.map((item) => (
                <View
                  key={item.label}
                  style={[styles.heroStatCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Text style={[styles.heroStatValue, { color: theme.text }]}>
                    {item.value}
                  </Text>
                  <Text style={[styles.heroStatLabel, { color: theme.muted }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitleText, { color: theme.text }]}>
                {t("activity.filters")}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>
                {t("activity.filters_sub")}
              </Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionBadgeText, { color: theme.text }]}>
                {filteredTransactions.length}
              </Text>
              <Text style={[styles.sectionBadgeLabel, { color: theme.muted }]}>
                {t("activity.items")}
              </Text>
            </View>
          </View>

          <ScrollView
            ref={filterScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.tabs,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            style={styles.filterScroll}
          >
            {FILTERS.map((f, index) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.tab,
                  { borderColor: theme.border },
                  filter === f && styles.activeTab,
                ]}
                onPress={() => handleFilterPress(f)}
                onLayout={(e) => {
                  const x =
                    e.nativeEvent?.layout?.x ??
                    (e as { layout?: { x: number } }).layout?.x;
                  if (typeof x === "number") tabLayoutX.current[index] = x;
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.muted },
                    filter === f && styles.activeTabText,
                  ]}
                  numberOfLines={1}
                >
                  {t(`activity.filter_${String(f).toLowerCase()}` as any)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionTitleText, { color: theme.text }]}>
                {t("activity.recent_activity")}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>
                {t("activity.recent_activity_sub")}
              </Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionBadgeText, { color: theme.text }]}>
                {transactions.length}
              </Text>
              <Text style={[styles.sectionBadgeLabel, { color: theme.muted }]}>
                {t("activity.total")}
              </Text>
            </View>
          </View>

          {loading && transactions.length === 0 ? (
            <View style={[styles.loadingContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: theme.muted }]}>
                {t("activity.loading_activity", "Loading activity...")}
              </Text>
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.emptyStateIconBg,
                  {
                    backgroundColor: theme.accentSoft,
                    borderColor: isDark ? "rgba(0,177,79,0.2)" : "#D1FAE5",
                  },
                ]}
              >
                <Ionicons name="receipt-outline" size={46} color={theme.accent} />
              </View>

              <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
                {t(`activity.empty_title_${filter}` as any, "No transactions yet")}
              </Text>

              <Text style={[styles.emptyStateDescription, { color: theme.muted }]}>
                {t(`activity.empty_desc_${filter}` as any, "Your requests and transaction history will appear here once you start.")}
              </Text>

              <View style={styles.emptyStateActions}>
                {filter === "all" || filter === "mint" ? (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => router.push("/modals/buy-tokens")}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#00B14F", "#008F40"]}
                      style={styles.emptyStateButtonGradient}
                    >
                      <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.emptyStateButtonText}>
                        {t("activity.btn_buy", "Buy Tokens")}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : null}

                {filter === "all" || filter === "burn" ? (
                  <TouchableOpacity
                    style={[
                      styles.emptyStateButton,
                      styles.emptyStateButtonSecondary,
                    ]}
                    onPress={() => router.push("/(tabs)/sell-tokens")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.emptyStateButtonSecondaryContent}>
                      <Ionicons
                        name="arrow-down-circle"
                        size={20}
                        color="#F59E0B"
                      />
                      <Text style={styles.emptyStateButtonTextSecondary}>
                        {t("activity.btn_sell", "Sell Tokens")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.emptyStateInfo}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#00B14F"
                    />
                  </View>
                  <Text style={[styles.infoText, { color: theme.muted }]}>
                    {t("activity.secure_hint", "All transactions are secure and protected")}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                  </View>
                  <Text style={[styles.infoText, { color: theme.muted }]}>
                    {t("activity.track_hint", "Track request progress, final outcomes, and completed transactions in one place")}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              {filteredTransactions.map((tx) => {
                const typeTone = getTypeStyle(tx.type);

                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={[
                      styles.transactionCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        shadowColor: isDark ? "#000" : "#0F172A",
                      },
                    ]}
                    onPress={() => handleTransactionPress(tx)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.cardAccent,
                        { backgroundColor: typeTone.color },
                      ]}
                    />

                    <View style={styles.transactionHeader}>
                      <View style={styles.transactionLeft}>
                        <View
                          style={[
                            styles.avatar,
                            {
                              backgroundColor: typeTone.bg,
                              borderColor: typeTone.bg,
                            },
                          ]}
                        >
                          <Ionicons
                            name={getTypeIcon(tx.type)}
                            size={18}
                            color={typeTone.color}
                          />
                        </View>
                        <View style={styles.transactionMeta}>
                          <View style={styles.transactionMetaRow}>
                            <Text style={[styles.eyebrow, { color: theme.muted }]}>
                              {isAdminResolvedActivity(tx)
                                ? t("activity.admin_resolution", "Admin Resolution")
                                : getCreditDebitLabel(tx) || t("activity.transaction", "Transaction")}
                            </Text>
                            {pendingReviews.has(tx.id) ? (
                              <View
                                style={[
                                  styles.pendingBadge,
                                  {
                                    backgroundColor: theme.accentSoft,
                                    borderColor: isDark
                                      ? "rgba(0,177,79,0.2)"
                                      : "#D1FAE5",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.pendingBadgeText,
                                    { color: theme.accent },
                                  ]}
                                >
                                  {t("activity.pending_review", "Pending review")}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={[styles.transactionType, { color: theme.text }]}>
                            {isAdminResolvedActivity(tx) && tx.type === "mint"
                              ? t("activity.mint_credit", "Mint Credit")
                              : t(`activity.filter_${(tx.type || "").toLowerCase()}` as any, tx.type.charAt(0).toUpperCase() + tx.type.slice(1))}
                          </Text>
                          <Text style={[styles.transactionDate, { color: theme.muted }]}>
                            {formatDate(tx.created_at, true)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.transactionRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: getStatusColor(tx.status) + "18",
                              borderColor: getStatusColor(tx.status) + "28",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(tx.status) },
                            ]}
                          >
                            {t(`home.status_${(tx.status || "").toLowerCase()}` as any, tx.status)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.transactionBody}>
                      <View
                        style={[
                          styles.amountContainer,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <View>
                          <Text style={[styles.amountLabel, { color: theme.muted }]}>
                            {t("activity.amount_label", "Amount")}
                          </Text>
                          <Text style={[styles.transactionAmount, { color: theme.text }]}>
                            {getAmountPrefix(tx)}
                            {parseFloat(tx.amount).toLocaleString()} {tx.token_type}
                          </Text>
                        </View>
                        <View style={styles.amountMeta}>
                          <Text style={[styles.amountMetaLabel, { color: theme.muted }]}>
                            {t("home.status", "Status")}
                          </Text>
                          <Text
                            style={[
                              styles.amountMetaValue,
                              { color: getStatusColor(tx.status) },
                            ]}
                          >
                            {t(`home.status_${(tx.status || "").toLowerCase()}` as any, tx.status)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {tx.type === "swap" &&
                      tx.metadata?.received_amount != null &&
                      tx.metadata?.to_token ? (
                      <View
                        style={[
                          styles.infoStrip,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                          {t("home.activity_received", "Received")}
                        </Text>
                        <Text style={[styles.infoStripValue, { color: theme.text }]}>
                          {parseFloat(String(tx.metadata.received_amount)).toLocaleString()}{" "}
                          {tx.metadata.to_token}
                        </Text>
                      </View>
                    ) : null}

                    {parseFloat(String(tx.fee_amount ?? tx.fee ?? "0")) > 0 ? (
                      <View
                        style={[
                          styles.infoStrip,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                          {tx.fee_label || t("activity.fee", "Fee")}
                        </Text>
                        <Text style={[styles.infoStripValue, { color: theme.text }]}>
                          {String(tx.fee_amount ?? tx.fee ?? "0")} {tx.token_type}
                        </Text>
                      </View>
                    ) : null}

                    {isAdminResolvedActivity(tx) ? (
                      <View
                        style={[
                          styles.infoStrip,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.infoStripLabel, { color: theme.muted }]}>
                          {t("activity.resolution", "Resolution")}
                        </Text>
                        <Text style={[styles.infoStripValue, { color: theme.text }]}>
                          {tx.metadata?.resolution_action === "penalize_agent"
                            ? t("activity.admin_resolved_favor", "Admin resolved in your favor")
                            : t("activity.admin_credited_wallet", "Admin credited your wallet")}
                        </Text>
                      </View>
                    ) : null}

                    {tx.agent && (
                      <View
                        style={[
                          styles.agentSection,
                          { borderTopColor: theme.divider },
                        ]}
                      >
                        <View style={styles.agentInfo}>
                          <Ionicons
                            name="person-circle-outline"
                            size={16}
                            color={theme.muted}
                          />
                          <Text style={[styles.agentName, { color: theme.muted }]}>
                            {tx.agent.user?.full_name || t("home.switch_agent", "Agent")}
                          </Text>
                          <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={12} color="#FFB800" />
                            <Text style={[styles.ratingText, { color: theme.muted }]}>
                              {(tx.agent.rating || 5.0).toFixed(1)}
                            </Text>
                          </View>
                        </View>

                        {pendingReviews.has(tx.id) && (
                          <TouchableOpacity
                            style={[
                              styles.rateButton,
                              {
                                backgroundColor: isDark
                                  ? "rgba(124,58,237,0.14)"
                                  : "#FAF5FF",
                                borderColor: isDark
                                  ? "rgba(216,180,254,0.3)"
                                  : "#E9D5FF",
                              },
                            ]}
                            onPress={() =>
                              router.push({
                                pathname: "/modals/buy-tokens/rate-agent",
                                params: { transactionId: tx.id },
                              })
                            }
                          >
                            <Ionicons
                              name="star-outline"
                              size={16}
                              color="#8B5CF6"
                            />
                            <Text style={styles.rateButtonText}>{t("activity.rate_agent", "Rate Agent")}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.footerButton,
                        {
                          borderTopColor: theme.divider,
                          backgroundColor: theme.surface,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleTransactionPress(tx)}
                    >
                      <Text style={[styles.actionText, { color: theme.text }]}>
                        View transaction details
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={theme.muted}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  backgroundGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  headerWrapper: {
    zIndex: 10,
    borderBottomWidth: 1,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "left",
    letterSpacing: -0.5,
  },
  headerCopy: {
    flex: 1,
    paddingTop: 1,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 18,
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  heroPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroPillLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  heroStatsGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  heroStatCard: {
    // width: "48%",
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  heroStatLabel: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  sectionBadgeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  sectionBadgeLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  filterScroll: {
    minHeight: 52,
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    padding: 6,
    gap: 10,
    borderWidth: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 999,
    flexShrink: 0,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  activeTab: {
    backgroundColor: "#00B14F",
    borderColor: "#00B14F",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 28 },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 88,
    borderRadius: 24,
    borderWidth: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  emptyStateCard: {
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyStateIconBg: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: 18,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  emptyStateDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateActions: {
    width: "100%",
    gap: 12,
    marginBottom: 20,
  },
  emptyStateButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  emptyStateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyStateButtonSecondary: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    backgroundColor: "#FFFFFF",
  },
  emptyStateButtonSecondaryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 8,
  },
  emptyStateButtonTextSecondary: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F59E0B",
  },
  emptyStateInfo: {
    width: "100%",
    gap: 12,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoIcon: {
    width: 24,
    alignItems: "center",
    paddingTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  transactionCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  transactionMeta: {
    flex: 1,
  },
  transactionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  transactionRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  transactionBody: {
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  amountMeta: {
    alignItems: "flex-end",
  },
  amountMetaLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  amountMetaValue: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  infoStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoStripLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoStripValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  agentSection: {
    marginTop: 4,
    marginBottom: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  agentName: {
    fontSize: 13,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FAF5FF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  rateButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 16,
  },
  footerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 2,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 72,
  },
});
