import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  RefreshControl,
  Image,
  Linking,
  KeyboardAvoidingView,
  useColorScheme,
  Animated,
  Text,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBurnStore } from "@/stores/slices/burnSlice";
import { BurnRequestStatus } from "@/stores/types/burn.types";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { formatDate } from "@/utils/format";
import apiClient from "@/services/apiClient";
import { useTranslation } from "react-i18next";

export default function SellTokensStatusScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { currentRequest, fetchCurrentBurnRequest, confirmFiatReceipt, openDispute, loading } = useBurnStore();
  const { t } = useTranslation();
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [canRate, setCanRate] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    warning: "#F59E0B",
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    warningBorder: isDark ? "rgba(245,158,11,0.25)" : "#FEF3C7",
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    dangerBorder: isDark ? "rgba(239,68,68,0.25)" : "#FEE2E2",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
    successSoft: isDark ? "rgba(0,177,79,0.12)" : "#F0FDF4",
    successBorder: isDark ? "rgba(0,177,79,0.25)" : "#D1FAE5",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  useEffect(() => {
    if (requestId) {
      fetchCurrentBurnRequest(requestId);
    } else {
      fetchCurrentBurnRequest();
    }

    const interval = setInterval(() => {
      if (requestId) {
        fetchCurrentBurnRequest(requestId);
      } else {
        fetchCurrentBurnRequest();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchCurrentBurnRequest, requestId]);

  useEffect(() => {
    const checkCanRate = async () => {
      try {
        if (!currentRequest || currentRequest.status !== BurnRequestStatus.CONFIRMED) {
          setCanRate(false);
          return;
        }

        const { data } = await apiClient.get("/transactions/pending-review");
        const pending = data?.data?.transactions || data?.data || [];
        const match = pending.find((tx: any) => tx.id === currentRequest.id || tx.request_id === currentRequest.id);
        setCanRate(!!match);
      } catch {
        setCanRate(true);
      }
    };
    checkCanRate();
  }, [currentRequest]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (requestId) {
      await fetchCurrentBurnRequest(requestId);
    } else {
      await fetchCurrentBurnRequest();
    }
    setRefreshing(false);
  };

  const handleConfirmFiat = async () => {
    if (!currentRequest) return;
    Alert.alert(
      t("sell_tokens.confirm_payout_title", "Confirm Fiat Payout"),
      t("sell_tokens.confirm_payout_body", "Have you received the cash in your mobile money or bank account?"),
      [
        { text: t("sell_tokens.confirm_payout_no", "No, Go Back"), style: "cancel" },
        {
          text: t("sell_tokens.confirm_payout_yes", "Yes, I've Received It"),
          onPress: async () => {
            try {
              await confirmFiatReceipt(currentRequest.id);
              Alert.alert(t("sell_tokens.confirm_success_title", "Success 🎉"), t("sell_tokens.confirm_success_body", "Escrow released successfully!"));
            } catch (error: any) {
              Alert.alert(t("profile.error_title", "Error"), error.message || t("sell_tokens.failed_confirm_receipt", "Failed to confirm receipt"));
            }
          },
        },
      ]
    );
  };

  const handleSubmitDispute = async () => {
    if (!currentRequest || !disputeReason.trim()) {
      Alert.alert(t("profile.error_title", "Error"), t("sell_tokens.dispute_reason_required", "Please provide a reason for the dispute"));
      return;
    }
    try {
      await openDispute(currentRequest.id, disputeReason, disputeDetails);
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeDetails("");
      Alert.alert(t("sell_tokens.dispute_opened_title", "Dispute Opened"), t("sell_tokens.dispute_opened_body", "Our support team will review this transaction."));
    } catch (error: any) {
      Alert.alert(t("profile.error_title", "Error"), error.message || t("sell_tokens.failed_open_dispute", "Failed to open dispute"));
    }
  };

  const handleDismiss = () => {
    useBurnStore.getState().resetCurrentRequest();
    router.replace("/(tabs)");
  };

  if (loading && !currentRequest) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>{t("sell_tokens.loading_status", "Loading request status…")}</Text>
        </View>
      </View>
    );
  }

  if (!currentRequest) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.errorContainer}>
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="document-text-outline" size={64} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.text }]}>{t("sell_tokens.no_active_requests", "No active sell requests found.")}</Text>
            <TouchableOpacity style={[styles.homeButton, { backgroundColor: theme.accent }]} onPress={() => router.replace("/(tabs)")}>
              <Text style={styles.homeButtonText}>{t("sell_tokens.go_home", "Go Home")}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const getStatusColor = (status: BurnRequestStatus) => {
    switch (status) {
      case BurnRequestStatus.PENDING:
      case BurnRequestStatus.ESCROWED:
        return "#FFB800";
      case BurnRequestStatus.FIAT_SENT:
        return "#3B82F6";
      case BurnRequestStatus.CONFIRMED:
        return "#00B14F";
      case BurnRequestStatus.EXPIRED:
      case BurnRequestStatus.REJECTED:
        return "#EF4444";
      case BurnRequestStatus.DISPUTED:
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: BurnRequestStatus): any => {
    switch (status) {
      case BurnRequestStatus.CONFIRMED: return "checkmark-circle";
      case BurnRequestStatus.PENDING: return "time";
      case BurnRequestStatus.ESCROWED: return "lock-closed";
      case BurnRequestStatus.FIAT_SENT: return "card-outline";
      case BurnRequestStatus.EXPIRED: return "timer-outline";
      case BurnRequestStatus.REJECTED: return "close-circle";
      case BurnRequestStatus.DISPUTED: return "alert-circle";
      default: return "ellipse-outline";
    }
  };

  const getStatusLabel = (status: BurnRequestStatus) => {
    switch (status) {
      case BurnRequestStatus.PENDING: return t("sell_tokens.status_pending", "Processing Request");
      case BurnRequestStatus.ESCROWED: return t("sell_tokens.status_escrowed", "Locked in Escrow");
      case BurnRequestStatus.FIAT_SENT: return t("sell_tokens.status_fiat_sent", "Payout Sent");
      case BurnRequestStatus.CONFIRMED: return t("sell_tokens.status_confirmed", "Transaction Completed");
      case BurnRequestStatus.EXPIRED: return t("sell_tokens.status_expired", "Request Expired");
      case BurnRequestStatus.REJECTED: return t("sell_tokens.status_rejected", "Request Rejected");
      case BurnRequestStatus.DISPUTED: return t("sell_tokens.status_disputed", "Under Dispute");
      default: return (status as string).toUpperCase();
    }
  };

  const isExpiredByTime = (req: { expires_at?: string } | null) => {
    if (!req?.expires_at) return false;
    return new Date(req.expires_at).getTime() <= Date.now();
  };

  const isCompleted = currentRequest.status === BurnRequestStatus.CONFIRMED;
  const isExpired = currentRequest.status === BurnRequestStatus.EXPIRED || (!isCompleted && isExpiredByTime(currentRequest));
  const isRejected = currentRequest.status === BurnRequestStatus.REJECTED;
  const isDisputed = currentRequest.status === BurnRequestStatus.DISPUTED;
  const isFailed = isExpired || isRejected || isDisputed;
  const isFiatSent = currentRequest.status === BurnRequestStatus.FIAT_SENT;
  const statusColor = getStatusColor(currentRequest.status);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Fixed Header */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[
          styles.headerWrapper,
          { backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.push("/activity")}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("sell_tokens.status_title", "Sell Request Status")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("sell_tokens.status_desc", "Track your payout progress and confirm receipt.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        {/* Ambient Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* HERO CARD */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.08)", "rgba(14,23,38,0)"] : ["rgba(0,177,79,0.05)", "rgba(255,255,255,0)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTop}>
            <View style={[styles.heroIconRing, { backgroundColor: statusColor + "20" }]}>
              <Ionicons name={getStatusIcon(currentRequest.status)} size={28} color={statusColor} />
            </View>
            <View style={styles.heroMeta}>
              <View style={[styles.statusPill, { backgroundColor: statusColor + "20" }]}>
                <View style={[styles.statusPillDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusPillText, { color: statusColor }]}>
                  {getStatusLabel(currentRequest.status)}
                </Text>
              </View>
              <Text style={[styles.heroRef, { color: theme.muted }]}>
                Ref: {currentRequest.id.split("-")[0].toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.heroAmount, { color: theme.text }]}>
            {parseFloat(currentRequest.amount).toLocaleString()}{" "}
            <Text style={[styles.heroToken, { color: theme.muted }]}>{currentRequest.token_type}</Text>
          </Text>
          <Text style={[styles.heroDate, { color: theme.muted }]}>
            {t("sell_tokens.created_at_time", "Created {{time}}", { time: formatDate(currentRequest.created_at, true) })}
          </Text>
        </View>

        {/* TIMELINE */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-branch-outline" size={16} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t("sell_tokens.tracking_progress", "Tracking Progress")}</Text>
          </View>

          <View style={styles.timeline}>
            {/* Step 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineMarker}>
                <View style={styles.timelineDotActive} />
                <View style={styles.timelineLineActive} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>{t("sell_tokens.timeline_step1_title", "Request Created")}</Text>
                <Text style={[styles.timelineDesc, { color: theme.muted }]}>{t("sell_tokens.timeline_step1_desc", "Tokens are locked in secure escrow.")}</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineMarker}>
                <View
                  style={[
                    styles.timelineDot,
                    (currentRequest.status === BurnRequestStatus.FIAT_SENT ||
                      currentRequest.status === BurnRequestStatus.CONFIRMED) &&
                      styles.timelineDotActive,
                  ]}
                />
                <View
                  style={[
                    styles.timelineLine,
                    currentRequest.status === BurnRequestStatus.CONFIRMED && styles.timelineLineActive,
                  ]}
                />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>{t("sell_tokens.timeline_step2_title", "Agent Payout")}</Text>
                <Text style={[styles.timelineDesc, { color: theme.muted }]}>
                  {currentRequest.status === BurnRequestStatus.FIAT_SENT
                    ? t("sell_tokens.timeline_step2_desc_sent", "Agent marked payout as sent. Check bank / mobile wallet.")
                    : currentRequest.status === BurnRequestStatus.CONFIRMED
                    ? t("sell_tokens.timeline_step2_desc_verified", "Payment verified by you.")
                    : t("sell_tokens.timeline_step2_desc_waiting", "Waiting for agent to transfer local currency…")}
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={[styles.timelineItem, { marginBottom: 0 }]}>
              <View style={styles.timelineMarker}>
                <View
                  style={[
                    styles.timelineDot,
                    currentRequest.status === BurnRequestStatus.CONFIRMED && styles.timelineDotActive,
                  ]}
                />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>{t("sell_tokens.timeline_step3_title", "Completion")}</Text>
                <Text style={[styles.timelineDesc, { color: theme.muted }]}>
                  {currentRequest.status === BurnRequestStatus.CONFIRMED
                    ? t("sell_tokens.timeline_step3_desc_complete", "Escrow released to agent. Order complete.")
                    : t("sell_tokens.timeline_step3_desc_pending", "Pending confirmation from your side.")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* PAYMENT PROOF */}
        {(currentRequest.status === BurnRequestStatus.FIAT_SENT ||
          currentRequest.status === BurnRequestStatus.CONFIRMED) &&
          currentRequest.fiat_proof_url && (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="image-outline" size={16} color={theme.accent} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>{t("sell_tokens.agent_receipt_title", "Agent's Payout Receipt")}</Text>
              </View>
              <Text style={[styles.proofHint, { color: theme.muted }]}>
                {t("sell_tokens.agent_receipt_desc", "Verify this receipt matches the incoming amount in your account.")}
              </Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(currentRequest.fiat_proof_url!)}
                activeOpacity={0.9}
                style={styles.proofTouchable}
              >
                <Image source={{ uri: currentRequest.fiat_proof_url }} style={styles.proofImage} resizeMode="cover" />
                <View style={styles.proofOverlay}>
                  <View style={styles.proofTapBadge}>
                    <Ionicons name="expand-outline" size={14} color="#FFF" />
                    <Text style={styles.proofTapText}>{t("sell_tokens.view_full_size", "View full size")}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

        {/* MESSAGE BANNERS */}
        {isFiatSent && (
          <View style={[styles.messageCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.messageIconBox, { backgroundColor: theme.blue + "25" }]}>
              <Ionicons name="information-circle" size={20} color={theme.blue} />
            </View>
            <View style={styles.messageBody}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>{t("sell_tokens.incoming_payment", "Incoming Payment")}</Text>
              <Text style={[styles.messageText, { color: theme.muted }]}>
                {t("sell_tokens.incoming_payment_desc", "The agent marked the payout as completed. Please confirm receipt to release the escrowed tokens.")}
              </Text>
            </View>
          </View>
        )}

        {isCompleted && (
          <View style={[styles.messageCard, { backgroundColor: theme.successSoft, borderColor: theme.successBorder }]}>
            <View style={[styles.messageIconBox, { backgroundColor: theme.accent + "25" }]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
            </View>
            <View style={styles.messageBody}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>{t("sell_tokens.status_completed_title", "Sell Request Completed")}</Text>
              <Text style={[styles.messageText, { color: theme.muted }]}>
                {t("sell_tokens.status_completed_desc", "Payout confirmed. Escrowed tokens have been safely released to the agent.")}
              </Text>
            </View>
          </View>
        )}

        {isFailed && (
          <View
            style={[
              styles.messageCard,
              {
                backgroundColor: isDisputed ? theme.warningSoft : theme.dangerSoft,
                borderColor: isDisputed ? theme.warningBorder : theme.dangerBorder,
              },
            ]}
          >
            <View
              style={[
                styles.messageIconBox,
                { backgroundColor: isDisputed ? theme.warning + "25" : theme.danger + "25" },
              ]}
            >
              <Ionicons
                name={isDisputed ? "alert-circle" : "close-circle"}
                size={20}
                color={isDisputed ? theme.warning : theme.danger}
              />
            </View>
            <View style={styles.messageBody}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>
                {isExpired ? t("sell_tokens.status_expired", "Request Expired") : isRejected ? t("sell_tokens.status_rejected", "Request Rejected") : t("sell_tokens.status_disputed", "Under Dispute")}
              </Text>
              <Text style={[styles.messageText, { color: theme.muted }]}>
                {isDisputed
                  ? t("sell_tokens.status_disputed_desc", "This request expired after agent claimed paid. An administrative dispute is open.")
                  : isExpired
                  ? t("sell_tokens.status_expired_desc", "Tokens have been refunded to your wallet.")
                  : t("sell_tokens.status_rejected_desc", "The agent rejected this request. Tokens returned.")}
              </Text>
            </View>
          </View>
        )}

        {/* BOTTOM FIXED & FLOW BUTTONS */}
        <View style={styles.footerActions}>
          {isFiatSent && (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowDisputeModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="alert-circle-outline" size={18} color={theme.danger} />
                <Text style={[styles.secondaryBtnText, { color: theme.danger }]}>{t("sell_tokens.btn_no_payment", "No Payment")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: theme.accent }]}
                onPress={handleConfirmFiat}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>{t("sell_tokens.btn_confirm_receipt", "Confirm Receipt")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {isCompleted && canRate && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
              onPress={async () => {
                try {
                  const { data } = await apiClient.get("/transactions");
                  const transactions = data?.data?.transactions || data?.data || [];
                  const match = transactions.find(
                    (tx: any) =>
                      tx.agent_id === currentRequest.agent_id &&
                      parseFloat(tx.amount) === parseFloat(currentRequest.amount) &&
                      tx.token_type === currentRequest.token_type &&
                      (tx.type || "").toLowerCase() === "burn"
                  );
                  router.replace({
                    pathname: "/modals/buy-tokens/rate-agent",
                    params: { transactionId: match?.id || currentRequest.id },
                  });
                } catch {
                  router.replace({
                    pathname: "/modals/buy-tokens/rate-agent",
                    params: { transactionId: currentRequest.id },
                  });
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="star" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>{t("sell_tokens.btn_rate_experience", "Rate Experience")}</Text>
            </TouchableOpacity>
          )}

          {isFailed ? (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handleDismiss}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.muted }]}>{t("sell_tokens.btn_dismiss", "Dismiss")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: theme.accent }]}
                onPress={() => router.replace("/(tabs)/sell-tokens")}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>{t("sell_tokens.btn_try_again", "Try Again")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            !isFiatSent &&
            !canRate && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.replace("/(tabs)")}
                activeOpacity={0.8}
              >
                <Ionicons name="home-outline" size={18} color={theme.muted} />
                <Text style={[styles.secondaryBtnText, { color: theme.text }]}>{t("tabs.home", "Dashboard")}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <TouchableOpacity style={styles.helpLink} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
          <Text style={[styles.helpLinkText, { color: theme.muted }]}>{t("sell_tokens.need_help", "Need help with this request?")}</Text>
          <Text style={[styles.supportText, { color: theme.accent }]}>{t("sell_tokens.contact_support", "Contact Support")}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* DISPUTE MODAL */}
      <Modal
        visible={showDisputeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? "#0E1726" : "#FFFFFF" }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconBox, { backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FFF7E8" }]}>
                  <Ionicons name="shield-outline" size={18} color="#F59E0B" />
                </View>
                <Text style={[styles.modalTitle, { color: isDark ? "#F8FAFC" : "#111827" }]}>{t("sell_tokens.open_dispute_title", "Open Dispute")}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDisputeModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? "#1E2A3A" : "#F3F4F6" }]}
              >
                <Ionicons name="close" size={18} color={isDark ? "#94A3B8" : "#4B5563"} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: isDark ? "#94A3B8" : "#6B7280" }]}>
              {t("sell_tokens.dispute_modal_desc", "Please explain why you didn't receive the payment. Our support team will investigate.")}
            </Text>

            <Text style={[styles.inputLabel, { color: isDark ? "#CBD5E1" : "#374151" }]}>{t("sell_tokens.dispute_reason_label", "Reason *")}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#111C2B" : "#FBFCFD",
                  borderColor: isDark ? "#1E2A3A" : "#E4E7EC",
                  color: isDark ? "#F8FAFC" : "#111827",
                },
              ]}
              placeholder={t("sell_tokens.dispute_reason_placeholder", "e.g., No payment received in my account")}
              placeholderTextColor={isDark ? "#475569" : "#98A2B3"}
              value={disputeReason}
              onChangeText={setDisputeReason}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.inputLabel, { color: isDark ? "#CBD5E1" : "#374151" }]}>
              {t("sell_tokens.dispute_details_label", "Additional Details (Optional)")}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? "#111C2B" : "#FBFCFD",
                  borderColor: isDark ? "#1E2A3A" : "#E4E7EC",
                  color: isDark ? "#F8FAFC" : "#111827",
                },
              ]}
              placeholder={t("sell_tokens.dispute_details_placeholder", "Provide any additional information...")}
              placeholderTextColor={isDark ? "#475569" : "#98A2B3"}
              value={disputeDetails}
              onChangeText={setDisputeDetails}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: isDark ? "#1E2A3A" : "#F3F4F6" }]}
                onPress={() => setShowDisputeModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: isDark ? "#94A3B8" : "#4B5563" }]}>{t("common.cancel", "Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}
                onPress={handleSubmitDispute}
              >
                <Text style={styles.modalSubmitText}>{t("sell_tokens.btn_submit_dispute", "Submit Dispute")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    minWidth: 200,
  },
  loadingText: { fontSize: 14, fontWeight: "600" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    width: "100%",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  homeButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  homeButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  headerWrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
  },
  headerSafeArea: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 200,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  heroIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMeta: { flex: 1, gap: 6 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusPillDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.3 },
  heroRef: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 4,
  },
  heroToken: { fontSize: 20, fontWeight: "700" },
  heroDate: { fontSize: 12, fontWeight: "500" },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  timeline: { paddingLeft: 4 },
  timelineItem: { flexDirection: "row", marginBottom: 4 },
  timelineMarker: { alignItems: "center", marginRight: 12, width: 16 },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E2E8F0",
    zIndex: 1,
  },
  timelineDotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#00B14F",
    zIndex: 1,
    borderWidth: 3,
    borderColor: "#D1FAE5",
  },
  timelineLine: { width: 2, flex: 1, backgroundColor: "#E2E8F0", marginVertical: 4 },
  timelineLineActive: { width: 2, flex: 1, backgroundColor: "#00B14F", marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 18 },
  timelineTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  timelineDesc: { fontSize: 12, lineHeight: 17, fontWeight: "500" },
  proofHint: { fontSize: 13, fontWeight: "500", marginBottom: 12 },
  proofTouchable: { borderRadius: 18, overflow: "hidden", position: "relative" },
  proofImage: { width: "100%", height: 220 },
  proofOverlay: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    padding: 12,
    alignItems: "flex-end",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  proofTapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  proofTapText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  messageCard: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },
  messageIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  messageBody: { flex: 1 },
  messageTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  messageText: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  footerActions: { gap: 12, marginTop: 6 },
  footerRow: { flexDirection: "row", gap: 12 },
  primaryBtn: {
    flexDirection: "row",
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  secondaryBtn: {
    flexDirection: "row",
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "700" },
  helpLink: { alignItems: "center", marginTop: 20, gap: 4 },
  helpLinkText: { fontSize: 13, fontWeight: "500" },
  supportText: { fontSize: 14, fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,17,26,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },
  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "900" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDescription: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: { height: 110, textAlignVertical: "top" },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontSize: 15, fontWeight: "700" },
  modalSubmitText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
});
