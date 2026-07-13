import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
  useColorScheme,
  Animated,
  Text,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMintRequestStore, useWalletStore } from "@/stores";
import { StatusTracker } from "@/components/ui/StatusTracker";
import { TimerComponent } from "@/components/ui/TimerComponent";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate } from "@/utils/format";
import apiClient from "@/services/apiClient";

export default function MintStatusScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const { currentRequest, checkStatus, openDispute } = useMintRequestStore();
  const { fetchWallets } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDetails, setDisputeDetails] = useState("");
  const [canRate, setCanRate] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

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

  const isTerminalStatus = (status: string) =>
    ["confirmed", "cancelled", "rejected", "expired", "refunded"].includes((status || "").toLowerCase());

  const isExpiredByTime = (req: { expires_at?: string } | null) => {
    if (!req?.expires_at) return false;
    return new Date(req.expires_at).getTime() <= Date.now();
  };

  useEffect(() => {
    if (!requestId) return;
    checkStatus(requestId);
    const interval = setInterval(() => {
      const state = useMintRequestStore.getState();
      const req = state.currentRequest;
      if (req && req.id === requestId && !isTerminalStatus(req.status) && !isExpiredByTime(req)) {
        state.checkStatus(requestId);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [checkStatus, requestId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkStatus(requestId);
    setRefreshing(false);
  };

  const handleGoHome = async () => {
    await fetchWallets();
    router.replace("/(tabs)");
  };

  const handleCreateNew = () => {
    router.replace({
      pathname: "/modals/buy-tokens",
      params: {
        amount: currentRequest?.amount?.toString() ?? "",
        tokenType: currentRequest?.token_type ?? "NT",
      },
    });
  };

  const handleSubmitDispute = async () => {
    if (!currentRequest || !disputeReason.trim()) {
      Alert.alert("Error", "Please provide a reason for the dispute");
      return;
    }
    try {
      await openDispute(currentRequest.id, disputeReason, disputeDetails);
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeDetails("");
      Alert.alert("Dispute Submitted", "Our support team will review it shortly.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to open dispute");
    }
  };

  const handleDismiss = async () => {
    if (!currentRequest) return;
    if (currentRequest.status.toLowerCase() === "pending") {
      try { await useMintRequestStore.getState().cancelMintRequest(currentRequest.id); }
      catch (e) { console.log("Failed to cancel expired request:", e); }
    }
    useMintRequestStore.getState().clearRequest();
    router.replace("/(tabs)");
  };

  useEffect(() => {
    const checkCanRate = async () => {
      if (!currentRequest) return;
      const isCompleted = (currentRequest.status || "").toLowerCase() === "confirmed";
      try {
        if (!isCompleted) { setCanRate(false); return; }
        const { data } = await apiClient.get("/transactions/pending-review");
        const pending = data?.data?.transactions || data?.data || [];
        const match = pending.find((tx: any) => tx.id === currentRequest.id || tx.request_id === currentRequest.id);
        setCanRate(!!match);
      } catch { setCanRate(true); }
    };
    checkCanRate();
  }, [currentRequest]);

  if (!currentRequest) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Loading request status…</Text>
        </View>
      </View>
    );
  }

  const statusLower = (currentRequest.status || "").toLowerCase();
  const isCompleted = statusLower === "confirmed";
  const isExpiredByStatus = statusLower === "expired";
  const isExpiredByTimeNow = !isCompleted && isExpiredByTime(currentRequest);
  const isExpired = isExpiredByStatus || isExpiredByTimeNow;
  const isCancelled = currentRequest.status === "cancelled" || currentRequest.status === "CANCELLED";
  const isRejected = currentRequest.status.toLowerCase() === "rejected";
  const isDisputed = currentRequest.status.toLowerCase() === "disputed";
  const hasExistingDispute = !!currentRequest.latest_dispute;
  const hasResolvedDispute = (currentRequest.latest_dispute?.status || "").toLowerCase() === "resolved";
  const isFailed = isExpired || isCancelled || isRejected;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "#00B14F";
      case "pending": case "proof_submitted": return "#FFB800";
      case "expired": case "cancelled": case "rejected": return "#EF4444";
      case "disputed": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  const statusColor = getStatusColor(currentRequest.status);

  const getStatusIcon = (status: string): any => {
    switch (status.toLowerCase()) {
      case "confirmed": return "checkmark-circle";
      case "pending": return "time";
      case "proof_submitted": return "search";
      case "expired": return "timer-outline";
      case "cancelled": return "close-circle";
      case "rejected": return "close-circle";
      case "disputed": return "alert-circle";
      default: return "ellipse-outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed": return "Confirmed";
      case "pending": return "Pending";
      case "proof_submitted": return "Under Review";
      case "expired": return "Expired";
      case "cancelled": return "Cancelled";
      case "rejected": return "Rejected";
      case "disputed": return "In Dispute";
      default: return status.replace("_", " ");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Fixed collapsible header */}
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
              <Text style={[styles.headerTitle, { color: theme.text }]}>Request Status</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  Track progress and take action when needed.
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
        {/* Ambient glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* STATUS HERO CARD */}
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
            Created {formatDate(currentRequest.created_at, true)}
          </Text>
        </View>

        {/* TIMER */}
        {!isTerminalStatus(currentRequest.status) &&
          new Date(currentRequest.expires_at).getTime() > Date.now() && (
            <View style={[styles.timerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <TimerComponent expiresAt={currentRequest.expires_at} onExpire={() => checkStatus(requestId)} />
            </View>
          )}

        {/* STATUS TRACKER */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-branch-outline" size={16} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Tracking Progress</Text>
          </View>
          <StatusTracker currentStatus={currentRequest.status} />
        </View>

        {/* PAYMENT PROOF */}
        {currentRequest.payment_proof_url && (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="image-outline" size={16} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Payment Proof</Text>
            </View>
            <Text style={[styles.proofHint, { color: theme.muted }]}>
              Your uploaded receipt — the agent will verify this image.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(currentRequest.payment_proof_url!)}
              activeOpacity={0.9}
              style={styles.proofTouchable}
            >
              <Image source={{ uri: currentRequest.payment_proof_url }} style={styles.proofImage} resizeMode="cover" />
              <View style={styles.proofOverlay}>
                <View style={styles.proofTapBadge}>
                  <Ionicons name="expand-outline" size={14} color="#FFF" />
                  <Text style={styles.proofTapText}>View full size</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* STATUS MESSAGE CARDS */}
        {statusLower === "pending" && !isExpired && (
          <View style={[styles.messageCard, { backgroundColor: theme.warningSoft, borderColor: theme.warningBorder }]}>
            <View style={[styles.messageIconBox, { backgroundColor: theme.warning + "25" }]}>
              <Ionicons name="information-circle" size={20} color={theme.warning} />
            </View>
            <View style={styles.messageBody}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>Action Required</Text>
              <Text style={[styles.messageText, { color: theme.muted }]}>
                Please upload your payment proof so the agent can confirm your transfer.
              </Text>
              <TouchableOpacity
                style={[styles.msgActionBtn, { backgroundColor: theme.accent }]}
                onPress={() => router.push({ pathname: "/modals/buy-tokens/upload-proof", params: { requestId: currentRequest.id } })}
                activeOpacity={0.85}
              >
                <Text style={styles.msgActionBtnText}>Upload Proof Now</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {statusLower === "proof_submitted" && (
          <View style={[styles.messageCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.messageIconBox, { backgroundColor: theme.blue + "25" }]}>
              <Ionicons name="search" size={20} color={theme.blue} />
            </View>
            <View style={styles.messageBody}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>Under Review</Text>
              <Text style={[styles.messageText, { color: theme.muted }]}>
                The agent is verifying your payment. You'll be notified once complete.
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
              <Text style={[styles.messageTitle, { color: theme.text }]}>Successfully Minted!</Text>
              <Text style={[styles.messageText, { color: theme.muted }]}>
                {parseFloat(currentRequest.amount).toLocaleString()} {currentRequest.token_type} tokens are now in your wallet.
              </Text>
            </View>
          </View>
        )}

        {isFailed && (
          <View style={[styles.messageCard, { backgroundColor: theme.dangerSoft, borderColor: theme.dangerBorder }]}>
            <View style={[styles.messageIconBox, { backgroundColor: theme.danger + "25" }]}>
              <Ionicons name="close-circle" size={20} color={theme.danger} />
            </View>
            <View style={styles.messageBody}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>
                {isExpired ? "Request Expired" : isCancelled ? "Request Cancelled" : "Payment Rejected"}
              </Text>
              <Text style={[styles.messageText, { color: theme.muted }]}>
                {isRejected
                  ? hasResolvedDispute
                    ? "This request was closed after dispute review. Contact support if you need further help."
                    : "Your payment proof was rejected. If you have concerns, you can open a dispute."
                  : "This transaction was not completed in time or was manually cancelled."}
              </Text>
              {isRejected && !hasExistingDispute && (
                <TouchableOpacity
                  style={[styles.msgActionBtn, { backgroundColor: theme.danger, marginTop: 12 }]}
                  onPress={() => setShowDisputeModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="shield-outline" size={14} color="#FFF" />
                  <Text style={styles.msgActionBtnText}>Open Dispute</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {isDisputed && (
          <View style={[styles.messageCard, { backgroundColor: theme.warningSoft, borderColor: theme.warningBorder }]}>
            <View style={[styles.messageIconBox, { backgroundColor: theme.warning + "25" }]}>
              <Ionicons name="alert-circle" size={20} color={theme.warning} />
            </View>
            <View style={styles.messageBody}>
              <Text style={[styles.messageTitle, { color: theme.text }]}>Dispute Opened</Text>
              <Text style={[styles.messageText, { color: theme.muted }]}>
                Our support team is investigating. We'll reach out to you via email soon.
              </Text>
            </View>
          </View>
        )}

        {/* FOOTER ACTIONS */}
        <View style={styles.footerActions}>
          {isCompleted && canRate ? (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
              onPress={async () => {
                try {
                  const { data } = await apiClient.get("/transactions/pending-review");
                  const pending = data?.data?.transactions || data?.data || [];
                  const transaction = pending.find(
                    (tx: any) => tx.id === currentRequest.id || tx.request_id === currentRequest.id
                  );
                  router.replace({ pathname: "/modals/buy-tokens/rate-agent", params: { transactionId: transaction?.id || currentRequest.id } });
                } catch {
                  router.replace({ pathname: "/modals/buy-tokens/rate-agent", params: { transactionId: currentRequest.id } });
                }
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="star" size={18} color="#FFF" />
              <Text style={styles.primaryBtnText}>Rate Experience</Text>
            </TouchableOpacity>
          ) : isFailed ? (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border, flex: 1 }]}
                onPress={handleDismiss}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryBtnText, { color: theme.muted }]}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, backgroundColor: theme.accent }]}
                onPress={handleCreateNew}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.primaryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleGoHome}
              activeOpacity={0.8}
            >
              <Ionicons name="home-outline" size={18} color={theme.muted} />
              <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Go to Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SUPPORT LINK */}
        <TouchableOpacity style={styles.helpLink} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
          <Text style={[styles.helpLinkText, { color: theme.muted }]}>Need help with this request?</Text>
          <Text style={[styles.supportText, { color: theme.accent }]}>Contact Support</Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? "#0E1726" : "#FFFFFF" }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconBox, { backgroundColor: isDark ? "rgba(245,158,11,0.15)" : "#FFF7E8" }]}>
                  <Ionicons name="shield-outline" size={18} color="#F59E0B" />
                </View>
                <Text style={[styles.modalTitle, { color: isDark ? "#F8FAFC" : "#111827" }]}>Open Dispute</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDisputeModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? "#1E2A3A" : "#F3F4F6" }]}
              >
                <Ionicons name="close" size={18} color={isDark ? "#94A3B8" : "#4B5563"} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: isDark ? "#94A3B8" : "#6B7280" }]}>
              Explain why you believe your payment proof was wrongly rejected. Our support team will investigate.
            </Text>

            <Text style={[styles.inputLabel, { color: isDark ? "#CBD5E1" : "#374151" }]}>Reason *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? "#111C2B" : "#FBFCFD", borderColor: isDark ? "#1E2A3A" : "#E4E7EC", color: isDark ? "#F8FAFC" : "#111827" }]}
              placeholder="e.g., I have valid payment proof"
              placeholderTextColor={isDark ? "#475569" : "#98A2B3"}
              value={disputeReason}
              onChangeText={setDisputeReason}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.inputLabel, { color: isDark ? "#CBD5E1" : "#374151" }]}>Additional Details (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: isDark ? "#111C2B" : "#FBFCFD", borderColor: isDark ? "#1E2A3A" : "#E4E7EC", color: isDark ? "#F8FAFC" : "#111827" }]}
              placeholder="Provide any additional information..."
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
                <Text style={[styles.modalCancelText, { color: isDark ? "#94A3B8" : "#4B5563" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#EF4444" }]}
                onPress={handleSubmitDispute}
              >
                <Text style={styles.modalSubmitText}>Submit Dispute</Text>
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
  timerCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
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
  msgActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  msgActionBtnText: { color: "#FFF", fontSize: 13, fontWeight: "800" },
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
