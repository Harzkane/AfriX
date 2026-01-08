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
import { formatDate } from "@/utils/format";

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { wallets, fetchWallets, loading, exchangeRates, fetchExchangeRates } = useWalletStore();
  const { currentRequest, checkStatus, fetchCurrentRequest } = useMintRequestStore();
  const { fetchAgentStats } = useAgentStore();

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const DashboardAvatar = () => {
    const { agentStatus } = useAgentStore();
    const isAgent = user?.role?.toLowerCase() === "agent" ||
      user?.role?.toLowerCase() === "admin" ||
      agentStatus === "active";
    const isVerified = user?.email_verified;
    const verificationLevel = user?.verification_level || 0;
    const hasActiveRequest = currentRequest && ["pending", "proof_submitted"].includes(currentRequest.status.toLowerCase());

    return (
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => router.push("/(tabs)/profile")}
      >
        {/* Agent Gold Ring (Outermost) */}
        {isAgent && <View style={styles.agentRing} />}

        <View style={styles.avatarMain}>
          {/* Progress Ring Track */}
          <View style={styles.progressTrack} />

          {/* Dynamic Progress Ring (High Contrast White) */}
          <View style={[
            styles.progressRing,
            { borderRightColor: verificationLevel >= 1 ? "#FFFFFF" : "transparent" },
            { borderTopColor: verificationLevel >= 2 ? "#FFFFFF" : "transparent" },
            { borderLeftColor: verificationLevel >= 3 ? "#FFFFFF" : "transparent" },
            { borderBottomColor: verificationLevel >= 4 ? "#FFFFFF" : "transparent" },
          ]} />

          {/* Glassmorphism Avatar */}
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitials}>{getInitials(user?.full_name)}</Text>
          </View>
        </View>

        {/* Verified Badge */}
        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#00B14F" />
          </View>
        )}

        {/* Notification Dot */}
        {hasActiveRequest && (
          <View style={styles.notificationDot} />
        )}
      </TouchableOpacity>
    );
  };

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
      fetchAgentStats();
      fetchCurrentRequest();
    }
  }, [isAuthenticated, user]);

  // Refresh when user navigates back to this tab
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log("👁️  Dashboard focused, refreshing");
        fetchWallets();
        fetchRecentTransactions();
        fetchAgentStats();
        fetchCurrentRequest();
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
      fetchAgentStats();
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
              <DashboardAvatar />
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentContainer}>

          {/* Quick Actions Grid - Moved to top for prominence */}
          <View style={styles.actionsSection}>
            <View style={styles.actionsGrid}>
              {/* Row 1 - Primary Actions */}
              <TouchableOpacity
                style={styles.primaryActionCard}
                onPress={() => router.push("/modals/buy-tokens")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#00B14F", "#008F40"]}
                  style={styles.primaryActionGradient}
                >
                  <Ionicons name="add-circle" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.primaryActionLabel}>Buy Tokens</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionCard}
                onPress={() => router.push("/(tabs)/sell-tokens")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={styles.primaryActionGradient}
                >
                  <Ionicons name="arrow-down-circle" size={28} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.primaryActionLabel}>Sell Tokens</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2 - Secondary Actions */}
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push("/modals/send-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.secondaryActionIcon, styles.sendIcon]}>
                  <Ionicons name="send" size={22} color="#3B82F6" />
                </View>
                <Text style={styles.secondaryActionLabel}>Send</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push("/modals/receive-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.secondaryActionIcon, styles.receiveIcon]}>
                  <Ionicons name="download" size={22} color="#10B981" />
                </View>
                <Text style={styles.secondaryActionLabel}>Receive</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push("/modals/swap-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.secondaryActionIcon, styles.swapIcon]}>
                  <Ionicons name="swap-horizontal" size={22} color="#8B5CF6" />
                </View>
                <Text style={styles.secondaryActionLabel}>Swap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionCard}
                onPress={() => router.push("/modals/request-tokens")}
                activeOpacity={0.7}
              >
                <View style={[styles.secondaryActionIcon, styles.requestIcon]}>
                  <Ionicons name="hand-left" size={22} color="#EC4899" />
                </View>
                <Text style={styles.secondaryActionLabel}>Request</Text>
              </TouchableOpacity>
            </View>
          </View>

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

          {/* Getting Started Card - Show for new users */}
          {recentTransactions.length === 0 && wallets.length > 0 && (
            <View style={styles.gettingStartedSection}>
              <View style={styles.gettingStartedCard}>
                <LinearGradient
                  colors={["#EFF6FF", "#DBEAFE"]}
                  style={styles.gettingStartedGradient}
                >
                  <View style={styles.gettingStartedHeader}>
                    <View style={styles.gettingStartedIcon}>
                      <Ionicons name="rocket-outline" size={32} color="#3B82F6" />
                    </View>
                    <View style={styles.gettingStartedText}>
                      <Text style={styles.gettingStartedTitle}>Get Started</Text>
                      <Text style={styles.gettingStartedSubtitle}>
                        Welcome to AfriX! Here's how to begin
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepsContainer}>
                    <TouchableOpacity
                      style={styles.stepItem}
                      onPress={() => router.push("/modals/buy-tokens")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Buy Your First Tokens</Text>
                        <Text style={styles.stepDescription}>
                          Select an agent and purchase NT or CT tokens
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.stepItem}
                      onPress={() => router.push("/education")}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.stepNumber, styles.stepNumberComplete]}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Learn the Basics</Text>
                        <Text style={styles.stepDescription}>
                          Complete education modules to understand tokens
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View style={styles.stepItem}>
                      <View style={[styles.stepNumber, styles.stepNumberInactive]}>
                        <Text style={styles.stepNumberTextInactive}>3</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, styles.stepTitleInactive]}>
                          Explore Features
                        </Text>
                        <Text style={styles.stepDescription}>
                          Send, receive, swap, and manage your tokens
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Quick Tips Section - Show for new users */}
          {recentTransactions.length === 0 && (
            <View style={styles.tipsSection}>
              <Text style={styles.sectionTitle}>Quick Tips</Text>
              <View style={styles.tipsGrid}>
                <View style={styles.tipCard}>
                  <View style={[styles.tipIcon, { backgroundColor: "#F0FDF4" }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#00B14F" />
                  </View>
                  <Text style={styles.tipTitle}>Secure</Text>
                  <Text style={styles.tipDescription}>
                    All transactions are protected with escrow
                  </Text>
                </View>

                <View style={styles.tipCard}>
                  <View style={[styles.tipIcon, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="people" size={20} color="#3B82F6" />
                  </View>
                  <Text style={styles.tipTitle}>Trusted Agents</Text>
                  <Text style={styles.tipDescription}>
                    Verified agents ready to help you
                  </Text>
                </View>

                <View style={styles.tipCard}>
                  <View style={[styles.tipIcon, { backgroundColor: "#FAF5FF" }]}>
                    <Ionicons name="flash" size={20} color="#8B5CF6" />
                  </View>
                  <Text style={styles.tipTitle}>Fast</Text>
                  <Text style={styles.tipDescription}>
                    Quick transactions, instant confirmations
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Recent Transactions */}
          {recentTransactions.length > 0 ? (
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
                        {formatDate(tx.created_at)}
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
          ) : (
            // Empty State for Transactions
            <View style={styles.transactionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Activity</Text>
              </View>
              <View style={styles.emptyTransactionState}>
                <View style={styles.emptyTransactionIcon}>
                  <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyTransactionTitle}>
                  No transactions yet
                </Text>
                <Text style={styles.emptyTransactionText}>
                  Start by buying or selling tokens to see your activity here
                </Text>
                <TouchableOpacity
                  style={styles.emptyTransactionButton}
                  onPress={() => router.push("/modals/buy-tokens")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyTransactionButtonText}>
                    Get Started
                  </Text>
                </TouchableOpacity>
              </View>
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
    zIndex: 10,
    elevation: 8,
    backgroundColor: "#00B14F",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerContent: {
    paddingHorizontal: 20,
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
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  // Avatar Styles
  avatarContainer: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  agentRing: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  avatarMain: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  progressTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  progressRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#00B14F",
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  contentContainer: {
    paddingTop: 25,
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
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  // Primary Action Cards (Buy & Sell)
  primaryActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  // Secondary Actions Row (Send, Receive, Swap, Request)
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  secondaryActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    minWidth: 0,
  },
  secondaryActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  secondaryActionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  // Icon background colors
  sendIcon: {
    backgroundColor: "#EFF6FF",
  },
  receiveIcon: {
    backgroundColor: "#F0FDF4",
  },
  swapIcon: {
    backgroundColor: "#FAF5FF",
  },
  requestIcon: {
    backgroundColor: "#FCE7F3",
  },
  bottomSpacer: {
    height: 100,
  },
  // Getting Started Section
  gettingStartedSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  gettingStartedCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  gettingStartedGradient: {
    padding: 20,
  },
  gettingStartedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  gettingStartedIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  gettingStartedText: {
    flex: 1,
  },
  gettingStartedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  gettingStartedSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  stepsContainer: {
    gap: 12,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberComplete: {
    backgroundColor: "#00B14F",
  },
  stepNumberInactive: {
    backgroundColor: "#F3F4F6",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepNumberTextInactive: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  stepTitleInactive: {
    color: "#9CA3AF",
  },
  stepDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  // Quick Tips Section
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  tipCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  tipDescription: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 16,
  },
  // Empty Transaction State
  emptyTransactionState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  emptyTransactionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTransactionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  emptyTransactionText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyTransactionButton: {
    backgroundColor: "#00B14F",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyTransactionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
