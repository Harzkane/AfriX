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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/stores";
import { formatDate } from "@/utils/format";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingReviews, setPendingReviews] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const FILTERS = [
    "all",
    "mint",
    "burn",
    "swap",
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
      ? "Activity Overview"
      : `${String(filter).charAt(0).toUpperCase() + String(filter).slice(1)} Activity`;
  const currentFilterSummary =
    filter === "all"
      ? "Review every request and transaction outcome across mint, burn, swap, transfer, credit, and debit in one timeline."
      : `Review your ${filter} activity and track the current status of each entry.`;

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
    return isDebitForUser(tx) ? "Debit" : "Credit";
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
      ["swap", "transfer", "credit", "debit"].includes(
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
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#00B14F", "#008F40"]}
          style={styles.headerGradient}
        />
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Activity</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.tabsContainer}>
        <LinearGradient
          colors={["#F7FFF9", "#FFFFFF"]}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryEyebrow}>User Timeline</Text>
          <Text style={styles.summaryTitle}>{currentFilterLabel}</Text>
          <Text style={styles.summaryText}>{currentFilterSummary}</Text>
          <View style={styles.summaryMetaRow}>
            <View style={styles.summaryMetaPill}>
              <Text style={styles.summaryMetaValue}>{transactions.length}</Text>
              <Text style={styles.summaryMetaLabel}>Total</Text>
            </View>
            <View style={styles.summaryMetaPill}>
              <Text style={styles.summaryMetaValue}>{pendingCount}</Text>
              <Text style={styles.summaryMetaLabel}>Pending</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          ref={filterScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          style={styles.filterScroll}
        >
          {FILTERS.map((f, index) => (
            <TouchableOpacity
              key={f}
              style={[styles.tab, filter === f && styles.activeTab]}
              onPress={() => handleFilterPress(f)}
              onLayout={(e) => {
                const x =
                  e.nativeEvent?.layout?.x ??
                  (e as { layout?: { x: number } }).layout?.x;
                if (typeof x === "number") tabLayoutX.current[index] = x;
              }}
            >
              <Text
                style={[styles.tabText, filter === f && styles.activeTabText]}
                numberOfLines={1}
              >
                {String(f).charAt(0).toUpperCase() + String(f).slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchTransactions}
            tintColor="#00B14F"
          />
        }
      >
        {loading && transactions.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00B14F" />
            <Text style={styles.loadingText}>Loading activity...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            {/* Empty State Card */}
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconContainer}>
                <View style={styles.emptyStateIconBg}>
                  <Ionicons name="receipt-outline" size={64} color="#00B14F" />
                </View>
              </View>

              <Text style={styles.emptyStateTitle}>
                {filter === "all"
                  ? "No Activity Yet"
                  : filter === "mint"
                    ? "No Mint Transactions"
                    : filter === "burn"
                      ? "No Burn Transactions"
                      : filter === "swap"
                        ? "No Swap Transactions"
                        : filter === "transfer"
                          ? "No Transfer Transactions"
                          : filter === "credit"
                            ? "No Credit Transactions"
                            : "No Debit Transactions"}
              </Text>

              <Text style={styles.emptyStateDescription}>
                {filter === "all"
                  ? "Your requests and transaction history will appear here once you start buying, selling, swapping, or transferring tokens."
                  : filter === "mint"
                    ? "You haven't purchased any tokens yet. Start by buying your first tokens from a trusted agent."
                    : filter === "burn"
                      ? "You haven't sold any tokens yet. Start by selling tokens to convert them to fiat currency."
                      : filter === "swap"
                        ? "You haven't swapped any tokens yet. Use Swap to convert between different token types."
                        : filter === "transfer"
                          ? "You haven't sent or received any tokens yet. Start by using Send or Receive to move tokens."
                          : filter === "credit"
                            ? "You don't have any incoming credits yet. Credits appear when you receive tokens from another user."
                            : "You don't have any debits yet. Debits appear when you send tokens to another user."}
              </Text>

              {/* Quick Actions */}
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
                        Buy Tokens
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
                        Sell Tokens
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Info Section */}
              <View style={styles.emptyStateInfo}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#00B14F"
                    />
                  </View>
                  <Text style={styles.infoText}>
                    All transactions are secure and protected
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.infoText}>
                    Track request progress, final outcomes, and completed transactions in one place
                  </Text>
                </View>
              </View>
            </View>

            {/* What You'll See Section */}
            <View style={styles.whatYoullSeeCard}>
              <Text style={styles.whatYoullSeeTitle}>
                What you&apos;ll see here
              </Text>
              <View style={styles.whatYoullSeeList}>
                <View style={styles.whatYoullSeeItem}>
                  <View
                    style={[
                      styles.whatYoullSeeIcon,
                      { backgroundColor: "#F0FDF4" },
                    ]}
                  >
                    <Ionicons name="add-circle" size={18} color="#00B14F" />
                  </View>
                  <View style={styles.whatYoullSeeContent}>
                    <Text style={styles.whatYoullSeeItemTitle}>
                      Mint Transactions
                    </Text>
                    <Text style={styles.whatYoullSeeItemDescription}>
                      When you buy tokens from agents
                    </Text>
                  </View>
                </View>
                <View style={styles.whatYoullSeeItem}>
                  <View
                    style={[
                      styles.whatYoullSeeIcon,
                      { backgroundColor: "#FEF3C7" },
                    ]}
                  >
                    <Ionicons name="remove-circle" size={18} color="#F59E0B" />
                  </View>
                  <View style={styles.whatYoullSeeContent}>
                    <Text style={styles.whatYoullSeeItemTitle}>
                      Burn Transactions
                    </Text>
                    <Text style={styles.whatYoullSeeItemDescription}>
                      When you sell tokens to agents
                    </Text>
                  </View>
                </View>
                <View style={styles.whatYoullSeeItem}>
                  <View
                    style={[
                      styles.whatYoullSeeIcon,
                      { backgroundColor: "#EFF6FF" },
                    ]}
                  >
                    <Ionicons
                      name="swap-horizontal"
                      size={18}
                      color="#3B82F6"
                    />
                  </View>
                  <View style={styles.whatYoullSeeContent}>
                    <Text style={styles.whatYoullSeeItemTitle}>Transfers</Text>
                    <Text style={styles.whatYoullSeeItemDescription}>
                      When you send or receive tokens
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <>
            {filteredTransactions.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={styles.transactionCard}
                onPress={() => handleTransactionPress(tx)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.cardAccent,
                    { backgroundColor: getTypeStyle(tx.type).color },
                  ]}
                />
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        styles.avatar,
                        {
                          backgroundColor: getTypeStyle(tx.type).bg,
                          borderColor: getTypeStyle(tx.type).bg,
                        },
                      ]}
                    >
                      <Ionicons
                        name={getTypeIcon(tx.type)}
                        size={18}
                        color={getTypeStyle(tx.type).color}
                      />
                    </View>
                    <View style={styles.transactionMeta}>
                      <Text style={styles.eyebrow}>
                        {isAdminResolvedActivity(tx)
                          ? "Admin Resolution"
                          : getCreditDebitLabel(tx) || "Transaction"}
                      </Text>
                      <Text style={styles.transactionType}>
                        {isAdminResolvedActivity(tx) && tx.type === "mint"
                          ? "Mint Credit"
                          : tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(tx.created_at, true)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(tx.status) + "18" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(tx.status) },
                        ]}
                      >
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.transactionBody}>
                  <View style={styles.amountContainer}>
                    <View>
                      <Text style={styles.amountLabel}>Amount</Text>
                      <Text style={styles.transactionAmount}>
                        {getAmountPrefix(tx)}
                        {parseFloat(tx.amount).toLocaleString()} {tx.token_type}
                      </Text>
                    </View>
                    <View style={styles.amountMeta}>
                      <Text style={styles.amountMetaLabel}>Status</Text>
                      <Text
                        style={[
                          styles.amountMetaValue,
                          { color: getStatusColor(tx.status) },
                        ]}
                      >
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {tx.type === "swap" &&
                tx.metadata?.received_amount != null &&
                tx.metadata?.to_token ? (
                  <View style={styles.infoStrip}>
                    <Text style={styles.infoStripLabel}>Received</Text>
                    <Text style={styles.infoStripValue}>
                      {parseFloat(String(tx.metadata.received_amount)).toLocaleString()}{" "}
                      {tx.metadata.to_token}
                    </Text>
                  </View>
                ) : null}

                {parseFloat(String(tx.fee_amount ?? tx.fee ?? "0")) > 0 ? (
                  <View style={styles.infoStrip}>
                    <Text style={styles.infoStripLabel}>
                      {tx.fee_label || "Fee"}
                    </Text>
                    <Text style={styles.infoStripValue}>
                      {String(tx.fee_amount ?? tx.fee ?? "0")} {tx.token_type}
                    </Text>
                  </View>
                ) : null}

                {isAdminResolvedActivity(tx) ? (
                  <View style={styles.infoStrip}>
                    <Text style={styles.infoStripLabel}>Resolution</Text>
                    <Text style={styles.infoStripValue}>
                      {tx.metadata?.resolution_action === "penalize_agent"
                        ? "Admin resolved in your favor"
                        : "Admin credited your wallet"}
                    </Text>
                  </View>
                ) : null}

                {tx.agent && (
                  <View style={styles.agentSection}>
                    <View style={styles.agentInfo}>
                      <Ionicons
                        name="person-circle-outline"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.agentName}>
                        {tx.agent.user?.full_name || "Agent"}
                      </Text>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={12} color="#FFB800" />
                        <Text style={styles.ratingText}>
                          {(tx.agent.rating || 5.0).toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    {pendingReviews.has(tx.id) && (
                      <TouchableOpacity
                        style={styles.rateButton}
                        onPress={() =>
                          router.push({
                            pathname: "/modals/buy-tokens/rate-agent",
                            params: { transactionId: tx.id },
                          })
                        }
                      >
                        <Ionicons name="star-outline" size={16} color="#8B5CF6" />
                        <Text style={styles.rateButtonText}>Rate Agent</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={styles.footer}>
                  <Text style={styles.actionText}>Tap to view details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: -34,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E6F4EA",
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00B14F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 6,
  },
  summaryMetaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  summaryMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EAF0F5",
  },
  summaryMetaValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  summaryMetaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterScroll: {
    minHeight: 52,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: "#EAF0F5",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    flexShrink: 0,
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
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyStateContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateIconContainer: {
    marginBottom: 20,
  },
  emptyStateIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#D1FAE5",
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  emptyStateActions: {
    width: "100%",
    gap: 12,
    marginBottom: 24,
  },
  emptyStateButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyStateButtonSecondary: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F59E0B",
    backgroundColor: "#FFFFFF",
  },
  emptyStateButtonSecondaryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  emptyStateButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F59E0B",
  },
  emptyStateInfo: {
    width: "100%",
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIcon: {
    width: 24,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  whatYoullSeeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  whatYoullSeeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  whatYoullSeeList: {
    gap: 16,
  },
  whatYoullSeeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  whatYoullSeeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  whatYoullSeeContent: {
    flex: 1,
  },
  whatYoullSeeItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  whatYoullSeeItemDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  transactionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#EAF0F5",
    overflow: "hidden",
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
    marginBottom: 16,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  transactionMeta: {
    flex: 1,
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
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#6B7280",
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
    backgroundColor: "#FBFCFD",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  amountLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  amountMeta: {
    alignItems: "flex-end",
  },
  amountMetaLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  amountMetaValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textTransform: "capitalize",
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
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
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  infoStripLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoStripValue: {
    fontSize: 15,
    color: "#111827",
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
    color: "#6B7280",
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: "#6B7280",
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
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  actionText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 72,
  },
});
