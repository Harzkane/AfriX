// File: app/(tabs)/index.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore, useWalletStore, useMintRequestStore, useAgentStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { wallets, fetchWallets, loading, exchangeRates, fetchExchangeRates } = useWalletStore();
  const { currentRequest, checkStatus, fetchCurrentRequest } = useMintRequestStore();
  // const { pendingReviewsCount } = useAgentStore(); // Removed as it doesn't exist on AgentState
  const router = useRouter();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);


  // Fetch recent transactions
  const fetchRecentTransactions = async () => {
    try {
      const { data } = await require("@/services/apiClient").default.get("/transactions");
      const transactions = data.data.transactions || [];
      setRecentTransactions(transactions.slice(0, 4)); // Get 4 most recent
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("📊 Fetching wallets for user:", user.email);
      fetchWallets();
      fetchRecentTransactions();
    }
  }, [isAuthenticated, user]);

  // Refresh when user navigates back to this tab
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log("👁️  Dashboard focused, refreshing");
        fetchWallets();
        fetchRecentTransactions();
        if (currentRequest) {
          checkStatus(currentRequest.id);
        }
      }
    }, [isAuthenticated, currentRequest?.id])
  );

  const onRefresh = () => {
    if (isAuthenticated) {
      fetchWallets();
      fetchRecentTransactions();
      if (currentRequest) {
        checkStatus(currentRequest.id);
      }
    }
  };

  if (isAuthenticated && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Loading your account...</Text>
      </View>
    );
  }

  if (wallets.length === 0 && loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Loading your wallets...</Text>
      </View>
    );
  }

  // Get NT and CT wallets
  const ntWallet = wallets.find((w) => w.token_type === "NT");
  const ctWallet = wallets.find((w) => w.token_type === "CT");
  const usdtWallet = wallets.find((w) => w.token_type === "USDT");

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
      >
        {/* Header */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={["#00B14F", "#008F40"]}
            style={styles.headerGradient}
          />
          <SafeAreaView edges={["top"]} style={styles.headerContent}>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Welcome back</Text>
                <Text style={styles.userName}>
                  {user?.full_name || user?.email?.split("@")[0] || "User"}
                </Text>
              </View>
              <TouchableOpacity style={styles.avatar}>
                <Ionicons name="person-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentContainer}>

          {/* Active Mint Alert */}
          {currentRequest &&
            ["pending", "proof_submitted"].includes(
              currentRequest.status.toLowerCase()
            ) && (
              <Surface style={styles.alertCard} elevation={0}>
                <View style={styles.alertContent}>
                  <View style={styles.alertIcon}>
                    <Ionicons name="hourglass-outline" size={20} color="#FFB800" />
                  </View>
                  <View style={styles.alertText}>
                    <Text style={styles.alertTitle}>Mint in Progress</Text>
                    <Text style={styles.alertSubtitle}>
                      Pull down to refresh and check status
                    </Text>
                  </View>
                </View>
              </Surface>
            )}

          {/* Token Balances */}
          <View style={styles.balancesSection}>
            {/* Top Row: NT and CT */}
            <View style={styles.walletRow}>
              {/* NT Wallet */}
              {ntWallet && (
                <View style={styles.walletCard}>
                  <View style={styles.walletHeader}>
                    <View style={styles.tokenBadge}>
                      <Ionicons name="cash-outline" size={16} color="#00B14F" />
                    </View>
                    <View>
                      <Text style={styles.tokenLabel}>Naira Token</Text>
                      <Text style={styles.tokenSymbol}>NT</Text>
                    </View>
                  </View>
                  <Text style={styles.mainBalance}>
                    {parseFloat(ntWallet.balance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <View style={styles.availableRow}>
                    <Text style={styles.availableLabel}>Available</Text>
                    <Text style={styles.availableAmount}>
                      {parseFloat(ntWallet.available_balance).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {/* CT Wallet */}
              {ctWallet && (
                <View style={[styles.walletCard, styles.ctWalletCard]}>
                  <View style={styles.walletHeader}>
                    <View style={[styles.tokenBadge, styles.ctBadge]}>
                      <Ionicons name="leaf-outline" size={16} color="#10B981" />
                    </View>
                    <View>
                      <Text style={styles.tokenLabel}>XOF Token</Text>
                      <Text style={styles.tokenSymbol}>CT</Text>
                    </View>
                  </View>
                  <Text style={styles.mainBalance}>
                    {parseFloat(ctWallet.balance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <View style={styles.availableRow}>
                    <Text style={styles.availableLabel}>Available</Text>
                    <Text style={styles.availableAmount}>
                      {parseFloat(ctWallet.available_balance).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* USDT Wallet - Full width long card */}
            {usdtWallet && (
              <View style={[styles.walletCard, styles.usdtWalletCard]}>
                <View style={styles.walletHeader}>
                  <View style={[styles.tokenBadge, styles.usdtBadge]}>
                    <Ionicons name="logo-usd" size={16} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.tokenLabel}>USDT</Text>
                    <Text style={styles.tokenSymbol}>Tether USD</Text>
                  </View>
                </View>

                <View style={styles.balanceRow}>
                  <Text style={styles.mainBalance}>
                    {parseFloat(usdtWallet.balance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>

                  {/* Equivalents */}
                  <View style={styles.equivalentsContainer}>
                    <Text style={styles.equivalentText}>
                      ≈ {(parseFloat(usdtWallet.balance) * exchangeRates.USDT_TO_NT).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })} NT
                    </Text>
                    <Text style={styles.equivalentText}>
                      ≈ {(parseFloat(usdtWallet.balance) * exchangeRates.USDT_TO_CT).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })} CT
                    </Text>
                  </View>
                </View>
                <View style={styles.availableRow}>
                  <Text style={styles.availableLabel}>Available</Text>
                  <Text style={styles.availableAmount}>
                    {parseFloat(usdtWallet.available_balance).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.actionsGrid}>
              {/* Row 1 */}
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/modals/buy-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, styles.buyIcon]}>
                  <Ionicons name="add-circle-outline" size={24} color="#00B14F" />
                </View>
                <Text style={styles.actionLabel}>Buy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/(tabs)/sell-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, styles.sellIcon]}>
                  <Ionicons name="arrow-down-circle-outline" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.actionLabel}>Sell</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/modals/receive-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, styles.receiveIcon]}>
                  <Ionicons name="download-outline" size={24} color="#10B981" />
                </View>
                <Text style={styles.actionLabel}>Receive</Text>
              </TouchableOpacity>

              {/* Row 2 */}
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/modals/send-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, styles.sendIcon]}>
                  <Ionicons name="send-outline" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.actionLabel}>Send</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/modals/swap-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, styles.swapIcon]}>
                  <Ionicons name="swap-horizontal-outline" size={24} color="#8B5CF6" />
                </View>
                <Text style={styles.actionLabel}>Swap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/modals/request-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, styles.requestIcon]}>
                  <Ionicons name="hand-left-outline" size={24} color="#EC4899" />
                </View>
                <Text style={styles.actionLabel}>Request</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <View style={styles.transactionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity onPress={() => router.push("/activity")}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {recentTransactions.map((tx) => (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.transactionItem}
                  onPress={() => router.push("/activity")}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            tx.type === "mint" ? "#F0FDF4" : "#FEF3C7",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          tx.type === "mint"
                            ? "add-circle"
                            : tx.type === "burn"
                              ? "remove-circle"
                              : "swap-horizontal"
                        }
                        size={18}
                        color={tx.type === "mint" ? "#00B14F" : "#F59E0B"}
                      />
                    </View>
                    <View>
                      <Text style={styles.transactionType}>
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(tx.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>
                      {tx.type === "burn" ? "-" : "+"}
                      {parseFloat(tx.amount).toLocaleString()} {tx.token_type}
                    </Text>
                    <View
                      style={[
                        styles.transactionStatus,
                        {
                          backgroundColor:
                            tx.status === "completed"
                              ? "#00B14F20"
                              : "#FFB80020",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.transactionStatusText,
                          {
                            color:
                              tx.status === "completed" ? "#00B14F" : "#FFB800",
                          },
                        ]}
                      >
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  headerWrapper: {
    marginBottom: 20,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontWeight: "500",
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  contentContainer: {
    marginTop: -40,
  },
  alertCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  alertContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  alertIcon: {
    marginRight: 12,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: "#B45309",
  },
  reviewCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  reviewIcon: {
    backgroundColor: "#F3E8FF",
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B21A8",
    marginBottom: 2,
  },
  reviewSubtitle: {
    fontSize: 12,
    color: "#7C3AED",
  },
  transactionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00B14F",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  transactionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transactionStatusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  balancesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
    flexDirection: "column", // Changed to column to stack rows
  },
  walletRow: {
    flexDirection: "row",
    gap: 12,
  },
  walletCard: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    minWidth: 0,
  },
  ctWalletCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  usdtWalletCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    marginTop: 16, // Add spacing from NT/CT cards
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tokenBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  ctBadge: {
    backgroundColor: "#FFFFFF",
  },
  usdtBadge: {
    backgroundColor: "#EFF6FF",
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#065F46",
    marginBottom: 1,
  },
  mainBalance: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.5,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  equivalentsContainer: {
    alignItems: "flex-end",
  },
  equivalentText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 1,
  },
  tokenSymbol: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  availableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1FAE5",
  },
  availableLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  availableAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "30%",
    maxWidth: "32%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  sendIcon: {
    backgroundColor: "#EFF6FF",
  },
  receiveIcon: {
    backgroundColor: "#F0FDF4",
  },
  swapIcon: {
    backgroundColor: "#FAF5FF",
  },
  buyIcon: {
    backgroundColor: "#F0FDF4",
  },
  sellIcon: {
    backgroundColor: "#FFFBEB",
  },
  historyIcon: {
    backgroundColor: "#F9FAFB",
  },
  requestIcon: {
    backgroundColor: "#FCE7F3",
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 40,
  },
});
