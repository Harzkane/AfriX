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
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore, useWalletStore, useMintRequestStore, useBurnStore, useAgentStore, useNotificationStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { formatDate } from "@/utils/format";
import Svg, { Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const {
    wallets,
    fetchWallets,
    loading,
    exchangeRates,
    fetchExchangeRates,
    portfolioHistory,
    portfolioTrend,
    fetchPortfolioHistory,
  } = useWalletStore();
  const { currentRequest, checkStatus, fetchCurrentRequest } = useMintRequestStore();
  const { currentRequest: currentBurnRequest, fetchCurrentBurnRequestForUser } = useBurnStore();
  const { fetchAgentStats, agentStatus } = useAgentStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const [lastUnread, setLastUnread] = useState<number | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#0A0E17" : "#F9FAFB",
    cardBg: isDark ? "#121824" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#111827",
    textMuted: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#1E293B" : "#E5E7EB",
    divider: isDark ? "#1E293B" : "#F3F4F6",
    success: "#00B14F",
    successBg: isDark ? "rgba(0,177,79,0.15)" : "rgba(0,177,79,0.08)",
  };

  const isAgentUser =
    user?.role?.toLowerCase() === "agent" ||
    user?.role?.toLowerCase() === "admin" ||
    agentStatus === "active";

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
    const isVerified = user?.email_verified;

    return (
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={() => router.push("/(tabs)/profile")}
      >
        {isAgentUser && <View style={styles.agentRing} />}

        <View style={styles.avatarMain}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarInitials}>{getInitials(user?.full_name)}</Text>
          </View>
        </View>

        {isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={10} color="#00B14F" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const router = useRouter();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

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

  const handleTransactionPress = (tx: any) => {
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
          params: { requestId },
        });
      }
    } else if (tx.type === "burn") {
      const requestId = tx.metadata?.request_id || tx.id;
      router.push({
        pathname: "/(tabs)/sell-tokens/status",
        params: { requestId },
      });
    } else {
      router.push("/activity");
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
      fetchCurrentBurnRequestForUser();
      fetchExchangeRates();
      fetchPortfolioHistory();
      fetchUnreadCount();
    }
  }, [isAuthenticated, user, fetchExchangeRates, fetchPortfolioHistory]);

  // Refresh when user navigates back to this tab
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      fetchWallets();
      fetchRecentTransactions();
      fetchAgentStats();
      fetchCurrentRequest();
      fetchCurrentBurnRequestForUser();
      fetchExchangeRates();
      fetchPortfolioHistory();
      fetchUnreadCount();
      const req = useMintRequestStore.getState().currentRequest;
      if (req) checkStatus(req.id);
    }, [isAuthenticated, fetchUnreadCount])
  );

  // Show in-app banner when unread count increases while on dashboard
  useEffect(() => {
    if (lastUnread === null) {
      setLastUnread(unreadCount);
      return;
    }
    if (unreadCount > lastUnread) {
      setBannerVisible(true);
    }
    setLastUnread(unreadCount);
  }, [unreadCount, lastUnread]);

  const onRefresh = () => {
    if (isAuthenticated) {
      fetchWallets();
      fetchRecentTransactions();
      fetchAgentStats();
      fetchCurrentRequest();
      fetchCurrentBurnRequestForUser();
      fetchExchangeRates();
      fetchPortfolioHistory();
      if (currentRequest) {
        checkStatus(currentRequest.id);
      }
    }
  };

  if (isAuthenticated && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>{t("home.loading_account", "Loading your account...")}</Text>
      </View>
    );
  }

  if (wallets.length === 0 && loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>{t("home.loading_wallets", "Loading your wallets...")}</Text>
      </View>
    );
  }

  // Get NT, CT, and USDT wallets
  const ntWallet = wallets.find((w) => w.token_type === "NT");
  const ctWallet = wallets.find((w) => w.token_type === "CT");
  const usdtWallet = wallets.find((w) => w.token_type === "USDT");
  const activeMintFlow = !!(
    currentRequest &&
    ["pending", "proof_submitted"].includes((currentRequest.status || "").toLowerCase())
  );
  const activeBurnFlow = !!(
    currentBurnRequest &&
    ["pending", "escrowed", "fiat_sent"].includes((currentBurnRequest.status || "").toLowerCase())
  );
  const activeFlowCount = [activeMintFlow, activeBurnFlow].filter(Boolean).length;
  const fundedWalletCount = wallets.filter(
    (wallet) => parseFloat(wallet.balance || "0") > 0
  ).length;

  const verificationLevel = user?.verification_level || 0;
  const verificationConfig = {
    0: {
      label: "Unverified",
      dailyLimit: "$0/day",
      nextStep: "Verify your email to start trading",
      icon: "mail-open-outline" as const,
      tone: "warning" as const,
    },
    1: {
      label: "Email Verified",
      dailyLimit: "$100/day",
      nextStep: "Add more profile verification to unlock higher limits",
      icon: "checkmark-circle-outline" as const,
      tone: "success" as const,
    },
    2: {
      label: "Phone Verified",
      dailyLimit: "$500/day",
      nextStep: "Complete ID verification for the highest limits",
      icon: "call-outline" as const,
      tone: "info" as const,
    },
    3: {
      label: "ID Verified",
      dailyLimit: "$2,000/day",
      nextStep: "You have access to the highest standard limits",
      icon: "shield-checkmark-outline" as const,
      tone: "success" as const,
    },
  } as const;

  const currentVerification = verificationConfig[
    verificationLevel as keyof typeof verificationConfig
  ] || verificationConfig[0];

  const verificationAccentStyle =
    currentVerification.tone === "success"
      ? styles.verificationAccentSuccess
      : currentVerification.tone === "info"
        ? styles.verificationAccentInfo
        : styles.verificationAccentWarning;

  const verificationIconStyle =
    currentVerification.tone === "success"
      ? styles.verificationIconSuccess
      : currentVerification.tone === "info"
        ? styles.verificationIconInfo
        : styles.verificationIconWarning;

  const shouldPromptProfile = verificationLevel < 3;

  // Dynamic Sparkline Generator
  const generateSparklineData = (history: any[]) => {
    if (!history || history.length < 2) {
      // Default upward placeholder trend if not enough history points
      return "M 5,30 C 20,30 30,10 45,22 C 60,34 70,5 95,10";
    }

    const values = history.map((item) => parseFloat(item.total_value_nt || 0));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;

    const width = 90; // viewBox goes 5 to 95
    const height = 30; // viewBox goes 5 to 35

    const points = values.map((val, index) => {
      const x = 5 + (index / (values.length - 1)) * width;
      const y = 35 - ((val - min) / range) * height;
      return { x, y };
    });

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x},${points[i].y}`;
    }
    return path;
  };

  const isPositiveTrend = (portfolioTrend?.percentage ?? 0) >= 0;
  const trendColor = isPositiveTrend ? "#00B14F" : "#EF4444";
  const trendIcon = isPositiveTrend ? "trending-up" : "trending-down";

  // Total Portfolio Calculations
  const ntBalance = parseFloat(ntWallet?.balance || "0");
  const ctBalance = parseFloat(ctWallet?.balance || "0");
  const usdtBalance = parseFloat(usdtWallet?.balance || "0");

  const usdtRateNT = exchangeRates.USDT_TO_NT || 1500;
  const usdtRateCT = exchangeRates.USDT_TO_CT || 565;

  const totalNT = ntBalance + (ctBalance * (usdtRateNT / usdtRateCT)) + (usdtBalance * usdtRateNT);
  const totalUSD = totalNT / usdtRateNT;

  const getTransactionDisplay = (tx: any) => {
    const isDebit = tx.from_user_id === user?.id || tx.type === "burn";
    let title = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
    let subtitle = formatDate(tx.created_at);

    if (tx.type === "mint") {
      title = t("home.activity_received", "Received");
      const agentName = tx.agent?.user?.full_name || tx.metadata?.agent_name;
      subtitle = agentName
        ? `${t("home.activity_from_agent", "From {{agent}}", { agent: agentName })} • ${formatDate(tx.created_at)}`
        : `${t("home.activity_bought", "Bought")} • ${formatDate(tx.created_at)}`;
    } else if (tx.type === "burn") {
      title = t("home.activity_sent", "Sent");
      const agentName = tx.agent?.user?.full_name || tx.metadata?.agent_name;
      subtitle = agentName
        ? `${t("home.activity_to_agent", "To {{agent}}", { agent: agentName })} • ${formatDate(tx.created_at)}`
        : `${t("home.activity_sold", "Sold")} • ${formatDate(tx.created_at)}`;
    } else if (tx.type === "transfer") {
      if (isDebit) {
        title = t("home.activity_sent", "Sent");
        const recipient = tx.metadata?.recipient_name || tx.metadata?.to_user_email || "Transfer";
        subtitle = `${t("home.activity_to_agent", "To {{agent}}", { agent: recipient })} • ${formatDate(tx.created_at)}`;
      } else {
        title = t("home.activity_received", "Received");
        const sender = tx.metadata?.sender_name || tx.metadata?.from_user_email || "Transfer";
        subtitle = `${t("home.activity_from_agent", "From {{agent}}", { agent: sender })} • ${formatDate(tx.created_at)}`;
      }
    } else if (tx.type === "swap") {
      title = t("home.activity_swapped", "Swapped");
      const fromToken = tx.metadata?.from_token || tx.token_type;
      const toToken = tx.metadata?.to_token || (tx.token_type === "NT" ? "USDT" : "NT");
      subtitle = `${t("home.activity_swap_summary", "{{from}} to {{to}}", { from: fromToken, to: toToken })} • ${formatDate(tx.created_at)}`;
    }

    return { title, subtitle, isDebit };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Top Header */}
      <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[styles.logoText, { color: colors.text }]}>
              Afri<Text style={{ color: "#00B14F" }}>X</Text>
            </Text>
          </View>
          <View style={styles.headerRight}>
            {isAgentUser && (
              <TouchableOpacity
                style={[styles.switchBtn, { backgroundColor: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)", borderColor: colors.border }]}
                onPress={() => router.replace("/agent/dashboard")}
                activeOpacity={0.8}
              >
                <Ionicons name="swap-horizontal" size={13} color="#7C3AED" style={{ marginRight: 4 }} />
                <Text style={[styles.switchBtnText, { color: "#7C3AED" }]}>{t("home.switch_agent", "Agent")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.bellBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }]}
              onPress={() => router.push("/settings/notification-inbox")}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <DashboardAvatar />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.text} />
        }
      >
        <View style={styles.contentContainer}>
          {/* In-app notification banner */}
          {bannerVisible && unreadCount > 0 && (
            <TouchableOpacity
              style={styles.notificationBanner}
              activeOpacity={0.8}
              onPress={() => {
                setBannerVisible(false);
                router.push("/settings/notification-inbox");
              }}
            >
              <View style={styles.notificationBannerContent}>
                <View style={styles.notificationBannerIcon}>
                  <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.notificationBannerText}>
                  <Text style={styles.notificationBannerTitle}>{t("home.notifications_title", "New notifications")}</Text>
                  <Text style={styles.notificationBannerSubtitle}>
                    {unreadCount === 1
                      ? t("home.notification_banner_single", "You have 1 new notification")
                      : t("home.notification_banner_plural", `You have ${unreadCount} new notifications`, { count: unreadCount })}
                  </Text>
                </View>
                <Text style={styles.notificationBannerAction}>{t("home.notifications_view", "View")}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Welcome Greeting */}
          <View style={styles.greetingSection}>
            <Text style={[styles.greetingText, { color: colors.textMuted }]}>
              {t("home.welcome_back_user", "Welcome back,")}
            </Text>
            <Text style={[styles.userNameText, { color: colors.text }]}>
              {user?.full_name || user?.email?.split("@")[0] || "User"} 👋
            </Text>
          </View>

          {/* Total Portfolio Value Hero Card */}
          <View style={[styles.portfolioCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.portfolioTopRow}>
              <View style={styles.portfolioLeft}>
                <TouchableOpacity
                  style={styles.portfolioLabelRow}
                  activeOpacity={0.7}
                  onPress={() => setShowBalance(!showBalance)}
                >
                  <Text style={[styles.portfolioLabel, { color: colors.textMuted }]}>{t("home.portfolio_label", "Total Portfolio Value")}</Text>
                  <Ionicons
                    name={showBalance ? "eye-outline" : "eye-off-outline"}
                    size={15}
                    color={colors.textMuted}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>

                <Text style={[styles.portfolioValue, { color: colors.text }]}>
                  {showBalance
                    ? `₦${totalNT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "₦••••••"
                  }
                </Text>

                <Text style={[styles.portfolioSubValue, { color: colors.textMuted }]}>
                  {showBalance
                    ? `≈ $${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "≈ $••••"
                  }
                </Text>
              </View>

              <View style={styles.portfolioRight}>
                {/* Beautiful Sparkline Trend SVG */}
                <Svg width={90} height={35} viewBox="0 0 100 40">
                  <Path
                    d={generateSparklineData(portfolioHistory)}
                    fill="none"
                    stroke={trendColor}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <View style={styles.trendRow}>
                  <Ionicons name={trendIcon as any} size={12} color={trendColor} style={{ marginRight: 2 }} />
                  <Text style={[styles.trendText, { color: trendColor }]}>
                    {portfolioTrend?.trend || "0.00%"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions Grid (3x2) */}
          <View style={[styles.actionsCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.actionsGrid}>
              {/* Row 1: Buy, Sell, Send */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push("/modals/buy-tokens")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: "#00B14F" }]}>
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text }]}>{t("home.action_buy", "Buy")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push("/(tabs)/sell-tokens")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: "#F59E0B" }]}>
                    <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text }]}>{t("home.action_sell", "Sell")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push("/modals/send-tokens")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: "#00B14F" }]}>
                    <Ionicons name="send" size={20} color="#FFFFFF" style={{ transform: [{ rotate: "-45deg" }], marginLeft: 2, marginTop: -2 }} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text }]}>{t("home.action_send", "Send")}</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2: Receive, Swap, Request */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push("/modals/receive-tokens")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: "#10B981" }]}>
                    <Ionicons name="download" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text }]}>{t("home.action_receive", "Receive")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push("/modals/swap-tokens")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: "#8B5CF6" }]}>
                    <Ionicons name="swap-horizontal" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text }]}>{t("home.action_swap", "Swap")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push("/modals/request-tokens")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: "#EC4899" }]}>
                    <Ionicons name="hand-left" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text }]}>{t("home.action_request", "Request")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* My Wallets Unified List */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>{t("home.my_wallets", "My Wallets")}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/activity")}>
                <Text style={styles.seeAllText}>{t("home.see_all", "See all")}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.walletsCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {/* Naira Token Wallet Row */}
              {ntWallet && (
                <View style={styles.walletRowItem}>
                  <View style={styles.walletRowLeft}>
                    <View style={[styles.walletIconWrap, { backgroundColor: isDark ? "rgba(0,177,79,0.15)" : "#E6F7ED" }]}>
                      <Ionicons name="cash-outline" size={18} color="#00B14F" />
                    </View>
                    <View>
                      <Text style={[styles.walletTokenName, { color: colors.text }]}>{t("home.token_naira", "Naira Token")}</Text>
                      <Text style={[styles.walletTokenSymbol, { color: colors.textMuted }]}>NT</Text>
                    </View>
                  </View>
                  <View style={styles.walletRowRight}>
                    <Text style={[styles.walletBalanceText, { color: colors.text }]}>
                      {showBalance
                        ? parseFloat(ntWallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "••••••"
                      }
                    </Text>
                    <Text style={[styles.walletEquivText, { color: colors.textMuted }]}>
                      {showBalance
                        ? `≈ $${(parseFloat(ntWallet.balance) / usdtRateNT).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "≈ $••••"
                      }
                    </Text>
                  </View>
                </View>
              )}

              {/* Divider */}
              {ntWallet && ctWallet && <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />}

              {/* XOF Token Wallet Row */}
              {ctWallet && (
                <View style={styles.walletRowItem}>
                  <View style={styles.walletRowLeft}>
                    <View style={[styles.walletIconWrap, { backgroundColor: isDark ? "rgba(16,185,129,0.15)" : "#EBFDF5" }]}>
                      <Ionicons name="leaf-outline" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text style={[styles.walletTokenName, { color: colors.text }]}>{t("home.token_xof", "XOF Token")}</Text>
                      <Text style={[styles.walletTokenSymbol, { color: colors.textMuted }]}>CT</Text>
                    </View>
                  </View>
                  <View style={styles.walletRowRight}>
                    <Text style={[styles.walletBalanceText, { color: colors.text }]}>
                      {showBalance
                        ? parseFloat(ctWallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "••••••"
                      }
                    </Text>
                    <Text style={[styles.walletEquivText, { color: colors.textMuted }]}>
                      {showBalance
                        ? `≈ $${(parseFloat(ctWallet.balance) / usdtRateCT).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "≈ $••••"
                      }
                    </Text>
                  </View>
                </View>
              )}

              {/* Divider */}
              {(ntWallet || ctWallet) && usdtWallet && <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />}

              {/* USDT Wallet Row */}
              {usdtWallet && (
                <View style={styles.walletRowItem}>
                  <View style={styles.walletRowLeft}>
                    <View style={[styles.walletIconWrap, { backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF" }]}>
                      <Ionicons name="logo-usd" size={18} color="#3B82F6" />
                    </View>
                    <View>
                      <Text style={[styles.walletTokenName, { color: colors.text }]}>{t("home.token_usdt", "Tether USD")}</Text>
                      <Text style={[styles.walletTokenSymbol, { color: colors.textMuted }]}>USDT</Text>
                    </View>
                  </View>
                  <View style={styles.walletRowRight}>
                    <Text style={[styles.walletBalanceText, { color: colors.text }]}>
                      {showBalance
                        ? parseFloat(usdtWallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : "••••••"
                      }
                    </Text>
                    <Text style={[styles.walletEquivText, { color: colors.textMuted }]}>
                      {showBalance
                        ? `≈ $${parseFloat(usdtWallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "≈ $••••"
                      }
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Security Banner Card */}
          <TouchableOpacity
            style={[styles.securityBannerCard, { backgroundColor: isDark ? "rgba(0,177,79,0.12)" : "#EBFDF5", borderColor: isDark ? "#0E5B2E" : "#D1FAE5" }]}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <View style={styles.securityBannerContent}>
              <View style={styles.securityBannerLeft}>
                <View style={styles.securityShieldWrap}>
                  <Ionicons name="shield-checkmark" size={20} color="#00B14F" />
                </View>
                <View style={styles.securityBannerTextWrap}>
                  <Text style={[styles.securityBannerTitle, { color: colors.text }]}>{t("home.security_banner_title", "Secure. Fast. Built for Africa.")}</Text>
                  <Text style={[styles.securityBannerSub, { color: colors.textMuted }]}>{t("home.security_banner_sub", "Your funds are protected with bank-level security.")}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#00B14F" />
            </View>
          </TouchableOpacity>



          {/* Verification Level & Limits Card */}
          <View style={[styles.verificationCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.verificationHeader}>
              <View style={[styles.verificationIconWrap, verificationIconStyle]}>
                <Ionicons name={currentVerification.icon} size={18} color="#111827" />
              </View>
              <View style={styles.verificationHeaderText}>
                <Text style={styles.verificationEyebrow}>{t("home.verification_limits", "Verification & Limits")}</Text>
                <Text style={[styles.verificationTitle, { color: colors.text }]}>{currentVerification.label}</Text>
              </View>
              <View style={[styles.verificationAccentPill, verificationAccentStyle]}>
                <Text style={styles.verificationAccentText}>Level {verificationLevel}</Text>
              </View>
            </View>

            <View style={[styles.verificationBody, { backgroundColor: isDark ? "#1E293B" : "#F9FAFB" }]}>
              <View style={styles.verificationMetric}>
                <Text style={[styles.verificationMetricLabel, { color: colors.textMuted }]}>{t("home.daily_limit", "Daily limit")}</Text>
                <Text style={[styles.verificationMetricValue, { color: colors.text }]}>{currentVerification.dailyLimit}</Text>
              </View>
              <View style={[styles.verificationDivider, { backgroundColor: colors.border }]} />
              <View style={styles.verificationMetric}>
                <Text style={[styles.verificationMetricLabel, { color: colors.textMuted }]}>{t("home.status", "Status")}</Text>
                <Text style={[styles.verificationMetricValue, { color: colors.text }]}>
                  {user?.email_verified ? t("home.email_confirmed", "Email confirmed") : t("home.action_needed", "Action needed")}
                </Text>
              </View>
            </View>

            <Text style={[styles.verificationHint, { color: colors.textMuted }]}>{currentVerification.nextStep}</Text>

            {shouldPromptProfile && (
              <TouchableOpacity
                style={styles.verificationAction}
                activeOpacity={0.8}
                onPress={() => router.push("/(tabs)/profile")}
              >
                <Text style={styles.verificationActionText}>{t("home.open_profile", "Open profile")}</Text>
                <Ionicons name="chevron-forward" size={16} color="#00B14F" />
              </TouchableOpacity>
            )}
          </View>

          {/* Active Mint Alert */}
          {currentRequest &&
            ["pending", "proof_submitted"].includes(
              (currentRequest.status || "").toLowerCase()
            ) && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/modals/buy-tokens/status",
                    params: { requestId: currentRequest.id },
                  })
                }
              >
                <Surface style={[styles.alertCard, { backgroundColor: isDark ? "#2A1E00" : "#FFFBEB", borderColor: isDark ? "#7A5800" : "#FEF3C7" }]} elevation={0}>
                  <View style={styles.alertContent}>
                    <View style={styles.alertIcon}>
                      <Ionicons name="hourglass-outline" size={20} color="#FFB800" />
                    </View>
                    <View style={styles.alertText}>
                      <Text style={[styles.alertTitle, { color: isDark ? "#FFD25C" : "#92400E" }]}>{t("home.mint_in_progress", "Mint in Progress")}</Text>
                      <Text style={[styles.alertSubtitle, { color: isDark ? "#FFB800" : "#B45309" }]}>
                        {t("home.tap_to_view_status", "Tap to view status or pull down to refresh")}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                  </View>
                </Surface>
              </TouchableOpacity>
            )}

          {/* Active Burn Alert */}
          {currentBurnRequest &&
            ["pending", "escrowed", "fiat_sent"].includes(
              (currentBurnRequest.status || "").toLowerCase()
            ) && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/sell-tokens/status",
                    params: { requestId: currentBurnRequest.id },
                  })
                }
              >
                <Surface style={[styles.alertCard, { backgroundColor: isDark ? "#2A1E00" : "#FFFBEB", borderColor: isDark ? "#7A5800" : "#FEF3C7" }]} elevation={0}>
                  <View style={styles.alertContent}>
                    <View style={styles.alertIcon}>
                      <Ionicons name="hourglass-outline" size={20} color="#F59E0B" />
                    </View>
                    <View style={styles.alertText}>
                      <Text style={[styles.alertTitle, { color: isDark ? "#FFD25C" : "#92400E" }]}>{t("home.burn_in_progress", "Burn (Sell) in Progress")}</Text>
                      <Text style={[styles.alertSubtitle, { color: isDark ? "#FFB800" : "#B45309" }]}>
                        {t("home.tap_to_view_status", "Tap to view status or pull down to refresh")}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                  </View>
                </Surface>
              </TouchableOpacity>
            )}

          {/* Getting Started Guide */}
          {recentTransactions.length === 0 && wallets.length > 0 && (
            <View style={styles.gettingStartedSection}>
              <View style={[styles.gettingStartedCard, { borderColor: colors.border, borderWidth: 1 }]}>
                <LinearGradient
                  colors={isDark ? ["#1E293B", "#0F172A"] : ["#EFF6FF", "#DBEAFE"]}
                  style={styles.gettingStartedGradient}
                >
                  <View style={styles.gettingStartedHeader}>
                    <View style={[styles.gettingStartedIcon, { backgroundColor: isDark ? "#334155" : "#FFFFFF" }]}>
                      <Ionicons name="rocket-outline" size={32} color="#3B82F6" />
                    </View>
                    <View style={styles.gettingStartedText}>
                      <Text style={[styles.gettingStartedTitle, { color: colors.text }]}>{t("home.get_started_guide", "Get Started")}</Text>
                      <Text style={[styles.gettingStartedSubtitle, { color: colors.textMuted }]}>
                        {t("home.getting_started_sub", "Welcome to AfriX! Here's how to begin")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepsContainer}>
                    <TouchableOpacity
                      style={[styles.stepItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                      onPress={() => router.push("/modals/buy-tokens")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>1</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>{t("home.step1_title", "Buy Your First Tokens")}</Text>
                        <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                          {t("home.step1_desc", "Select an agent and purchase NT or CT tokens")}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.stepItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                      onPress={() => router.push("/education")}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.stepNumber, styles.stepNumberComplete]}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, { color: colors.text }]}>{t("home.step2_title", "Learn the Basics")}</Text>
                        <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                          {t("home.step2_desc", "Complete education modules to understand tokens")}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.stepItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                      <View style={[styles.stepNumber, styles.stepNumberInactive]}>
                        <Text style={styles.stepNumberTextInactive}>3</Text>
                      </View>
                      <View style={styles.stepContent}>
                        <Text style={[styles.stepTitle, styles.stepTitleInactive, { color: colors.textMuted }]}>
                          {t("home.step3_title", "Explore Features")}
                        </Text>
                        <Text style={[styles.stepDescription, { color: colors.textMuted }]}>
                          {t("home.step3_desc", "Send, receive, swap, and manage your tokens")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          )}

          {/* Quick Tips Guide */}
          {recentTransactions.length === 0 && (
            <View style={styles.tipsSection}>
              <View style={styles.sectionHeaderCompact}>
                <Text style={[styles.sectionTitleText, { color: colors.text }]}>{t("home.quick_tips", "Quick Tips")}</Text>
                <Text style={styles.sectionHint}>{t("home.helpful_reminders", "Helpful reminders")}</Text>
              </View>
              <View style={styles.tipsGrid}>
                <View style={[styles.tipCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: isDark ? "rgba(0,177,79,0.15)" : "#F0FDF4" }]}>
                    <Ionicons name="shield-checkmark" size={20} color="#00B14F" />
                  </View>
                  <Text style={[styles.tipTitle, { color: colors.text }]}>{t("home.tip_secure_title", "Secure")}</Text>
                  <Text style={[styles.tipDescription, { color: colors.textMuted }]}>
                    {t("home.tip_secure_desc", "All transactions are protected with escrow")}
                  </Text>
                </View>

                <View style={[styles.tipCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF" }]}>
                    <Ionicons name="people" size={20} color="#3B82F6" />
                  </View>
                  <Text style={[styles.tipTitle, { color: colors.text }]}>{t("home.tip_agents_title", "Trusted Agents")}</Text>
                  <Text style={[styles.tipDescription, { color: colors.textMuted }]}>
                    {t("home.tip_agents_desc", "Verified agents ready to help you")}
                  </Text>
                </View>

                <View style={[styles.tipCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View style={[styles.tipIcon, { backgroundColor: isDark ? "rgba(139,92,246,0.15)" : "#FAF5FF" }]}>
                    <Ionicons name="flash" size={20} color="#8B5CF6" />
                  </View>
                  <Text style={[styles.tipTitle, { color: colors.text }]}>{t("home.tip_fast_title", "Fast")}</Text>
                  <Text style={[styles.tipDescription, { color: colors.textMuted }]}>
                    {t("home.tip_fast_desc", "Quick transactions, instant confirmations")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Recent Activity Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitleText, { color: colors.text }]}>{t("home.recent_activity", "Recent Activity")}</Text>
              <TouchableOpacity onPress={() => router.push("/activity")}>
                <Text style={styles.seeAllText}>{t("home.see_all", "See all")}</Text>
              </TouchableOpacity>
            </View>

            {recentTransactions.length > 0 ? (
              <View style={[styles.transactionsCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                {recentTransactions.map((tx, idx) => {
                  const { title, subtitle, isDebit } = getTransactionDisplay(tx);

                  return (
                    <View key={tx.id}>
                      <TouchableOpacity
                        style={styles.transactionItemRow}
                        onPress={() => handleTransactionPress(tx)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.transactionItemLeft}>
                          <View style={[styles.transactionItemIconWrap, { backgroundColor: isDebit ? (isDark ? "rgba(239,68,68,0.15)" : "#FEF2F2") : (isDark ? "rgba(0,177,79,0.15)" : "#F0FDF4") }]}>
                            <Ionicons
                              name={isDebit ? "arrow-up" : "arrow-down"}
                              size={16}
                              color={isDebit ? "#EF4444" : "#00B14F"}
                            />
                          </View>
                          <View style={{ flexShrink: 1 }}>
                            <Text style={[styles.transactionItemTitle, { color: colors.text }]} numberOfLines={1}>
                              {title}
                            </Text>
                            <Text style={[styles.transactionItemSub, { color: colors.textMuted }]} numberOfLines={1}>
                              {subtitle}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.transactionItemRight}>
                          <Text style={[styles.transactionItemAmt, { color: isDebit ? "#EF4444" : "#00B14F" }]}>
                            {isDebit ? "-" : "+"}
                            {parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.token_type}
                          </Text>
                          <View
                            style={[
                              styles.transactionStatusBadge,
                              {
                                backgroundColor:
                                  tx.status === "completed" ? (isDark ? "rgba(0,177,79,0.2)" : "rgba(0,177,79,0.1)") : (isDark ? "rgba(255,184,0,0.2)" : "rgba(255,184,0,0.1)"),
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.transactionStatusBadgeText,
                                {
                                  color:
                                    tx.status === "completed" ? "#00B14F" : "#FFB800",
                                },
                              ]}
                            >
                              {t(`home.status_${(tx.status || "").toLowerCase()}` as any, tx.status) as any}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      {idx < recentTransactions.length - 1 && <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />}
                    </View>
                  );
                })}
              </View>
            ) : (
              /* Empty State */
              <View style={[styles.emptyStateContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? "#1E293B" : "#F9FAFB" }]}>
                  <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>{t("home.no_transactions", "No transactions yet")}</Text>
                <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                  {t("home.no_transactions_desc", "Start by buying or selling tokens to see your activity here")}
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateBtn}
                  onPress={() => router.push("/modals/buy-tokens")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emptyStateBtnText}>{t("home.get_started_guide", "Get Started")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  switchBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
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
    backgroundColor: "rgba(0,177,79,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,177,79,0.2)",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 17,
    backgroundColor: "rgba(0,177,79,0.15)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarInitials: {
    color: "#00B14F",
    fontSize: 14,
    fontWeight: "700",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#00B14F",
  },
  agentRing: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
  },
  contentContainer: {
    paddingTop: 10,
  },
  notificationBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  notificationBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  notificationBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  notificationBannerText: {
    flex: 1,
  },
  notificationBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F9FAFB",
    marginBottom: 2,
  },
  notificationBannerSubtitle: {
    fontSize: 12,
    color: "#D1D5DB",
  },
  notificationBannerAction: {
    fontSize: 13,
    fontWeight: "600",
    color: "#22C55E",
    marginLeft: 8,
  },
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 10,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  userNameText: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: -0.4,
  },
  portfolioCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  portfolioTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  portfolioLeft: {
    flex: 1,
  },
  portfolioLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  portfolioLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  portfolioValue: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  portfolioSubValue: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  portfolioRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,177,79,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00B14F",
  },
  actionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  actionsGrid: {
    gap: 16,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionBtn: {
    alignItems: "center",
    width: 80,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#00B14F",
  },
  walletsCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  walletRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  walletRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  walletIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  walletTokenName: {
    fontSize: 15,
    fontWeight: "600",
  },
  walletTokenSymbol: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  walletRowRight: {
    alignItems: "flex-end",
  },
  walletBalanceText: {
    fontSize: 16,
    fontWeight: "700",
  },
  walletEquivText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
  },
  securityBannerCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  securityBannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  securityBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  securityShieldWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  securityBannerTextWrap: {
    flex: 1,
  },
  securityBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  securityBannerSub: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  agentShortcutCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  agentShortcutGradient: {
    borderRadius: 20,
    borderWidth: 1,
  },
  agentShortcutContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  agentShortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  agentShortcutText: {
    flex: 1,
  },
  agentShortcutTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  agentShortcutSubtitle: {
    fontSize: 12,
  },
  verificationCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  verificationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  verificationIconSuccess: {
    backgroundColor: "#DCFCE7",
  },
  verificationIconInfo: {
    backgroundColor: "#DBEAFE",
  },
  verificationIconWarning: {
    backgroundColor: "#FEF3C7",
  },
  verificationHeaderText: {
    flex: 1,
  },
  verificationEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#00B14F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  verificationAccentPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  verificationAccentSuccess: {
    backgroundColor: "#ECFDF5",
  },
  verificationAccentInfo: {
    backgroundColor: "#EFF6FF",
  },
  verificationAccentWarning: {
    backgroundColor: "#FFFBEB",
  },
  verificationAccentText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065F46",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  verificationBody: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  verificationMetric: {
    flex: 1,
  },
  verificationMetricLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  verificationMetricValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  verificationDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
  verificationHint: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  verificationAction: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
  },
  verificationActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00B14F",
  },
  alertCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  alertContent: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
  },
  gettingStartedSection: {
    marginBottom: 20,
  },
  gettingStartedCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  gettingStartedGradient: {
    padding: 18,
  },
  gettingStartedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  gettingStartedIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  gettingStartedText: {
    flex: 1,
  },
  gettingStartedTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  gettingStartedSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  stepsContainer: {
    gap: 10,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepNumberComplete: {
    backgroundColor: "#00B14F",
  },
  stepNumberInactive: {
    backgroundColor: "#F3F4F6",
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepNumberTextInactive: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  stepTitleInactive: {
    color: "#9CA3AF",
  },
  stepDescription: {
    fontSize: 11,
    lineHeight: 15,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeaderCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  tipsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  tipCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  tipDescription: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
  transactionsCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  transactionItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  transactionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  transactionItemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionItemTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  transactionItemSub: {
    fontSize: 11,
    marginTop: 2,
  },
  transactionItemRight: {
    alignItems: "flex-end",
  },
  transactionItemAmt: {
    fontSize: 15,
    fontWeight: "700",
  },
  transactionStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  transactionStatusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyStateBtn: {
    backgroundColor: "#00B14F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyStateBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: 40,
  },
});
