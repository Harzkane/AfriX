// app/modals/request-tokens/my-requests.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Share,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useRequestStore, UserRequestItem } from "@/stores";
import { WEB_URL } from "@/constants/api";
import { useAuthStore } from "@/stores";
import { formatAmount } from "@/utils/format";

type FilterStatus = "all" | "pending" | "completed" | "cancelled";

export default function MyRequestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { userRequests, fetchingHistory, fetchUserRequests, cancelPaymentRequest } = useRequestStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.14)" : "#FEF3C7",
    amberBorder: isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.14)" : "#FEE2E2",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
  };

  const loadRequests = useCallback(async () => {
    try {
      await fetchUserRequests();
    } catch (e) {
      console.warn("Failed to load user requests:", e);
    }
  }, [fetchUserRequests]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = userRequests.filter((item) => {
    if (filter === "all") return true;
    return item.status.toLowerCase() === filter;
  });

  const buildShareUrl = (item: UserRequestItem) => {
    const userEmail = user?.email || "";
    const note = item.description || "Token request";
    return `${WEB_URL}/pay/${item.reference}?amount=${item.amount}&token=${item.token_type}&note=${encodeURIComponent(note)}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ""}`;
  };

  const handleCopyLink = async (item: UserRequestItem) => {
    const url = buildShareUrl(item);
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      t("request_tokens.history.link_copied", "Link Copied!"),
      t("request_tokens.history.link_copied_desc", "Payment link copied to clipboard")
    );
  };

  const handleShare = async (item: UserRequestItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const url = buildShareUrl(item);
      const message = `💰 AfriExchange Payment Request (${item.reference})\n\nAmount: ${item.amount.toLocaleString()} ${item.token_type}\n\nPay here: ${url}`;
      await Share.share({
        message,
        title: `Pay ${item.amount.toLocaleString()} ${item.token_type} on AfriExchange`,
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  const handleCancel = (item: UserRequestItem) => {
    Alert.alert(
      t("request_tokens.history.cancel_title", "Cancel Request"),
      t("request_tokens.history.cancel_confirm", "Are you sure you want to cancel payment request {{ref}}? This cannot be undone.", { ref: item.reference }),
      [
        { text: t("common.no", "No"), style: "cancel" },
        {
          text: t("common.yes_cancel", "Yes, Cancel"),
          style: "destructive",
          onPress: async () => {
            setCancellingId(item.reference);
            try {
              await cancelPaymentRequest(item.reference);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                t("request_tokens.history.cancelled_title", "Cancelled"),
                t("request_tokens.history.cancelled_desc", "Payment request {{ref}} has been cancelled.", { ref: item.reference })
              );
            } catch (err: any) {
              Alert.alert(t("common.error", "Error"), err.message || "Failed to cancel request");
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "paid") {
      return { label: "PAID", bg: theme.accentSoft, color: theme.accent, border: theme.accentBorder };
    }
    if (s === "cancelled") {
      return { label: "CANCELLED", bg: theme.redSoft, color: theme.red, border: theme.redSoft };
    }
    return { label: "PENDING", bg: theme.amberSoft, color: theme.amber, border: theme.amberBorder };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("request_tokens.history.title", "My Requests")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            {t("request_tokens.history.subtitle", "Track & manage payment requests you've created")}
          </Text>
        </View>

        <TouchableOpacity
          onPress={loadRequests}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {(["all", "pending", "completed", "cancelled"] as FilterStatus[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(f);
            }}
            style={[
              styles.filterPill,
              { backgroundColor: theme.card, borderColor: theme.border },
              filter === f && { backgroundColor: theme.accent, borderColor: theme.accent },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: theme.muted },
                filter === f && { color: "#FFFFFF", fontWeight: "700" },
              ]}
            >
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List / Scroll view */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={fetchingHistory} onRefresh={loadRequests} tintColor={theme.accent} />
        }
      >
        {fetchingHistory && filteredRequests.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.muted }]}>
              {t("common.loading", "Loading requests...")}
            </Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="document-text-outline" size={36} color={theme.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {t("request_tokens.history.empty_title", "No Payment Requests Found")}
            </Text>
            <Text style={[styles.emptySub, { color: theme.muted }]}>
              {filter === "all"
                ? t("request_tokens.history.empty_desc_all", "You haven't created any payment requests yet. Tap '+' below to create one.")
                : t("request_tokens.history.empty_desc_filter", "No requests matching '{{filter}}' status.", { filter })}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/modals/request-tokens" as any)}
              style={[styles.createBtn, { backgroundColor: theme.accent }]}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.createBtnText}>
                {t("request_tokens.history.btn_create", "Create Payment Request")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredRequests.map((item) => {
            const badge = getStatusBadge(item.status);
            const isPending = item.status.toLowerCase() === "pending";
            const isCancellingThis = cancellingId === item.reference;

            return (
              <TouchableOpacity
                key={item.id || item.reference}
                onPress={() => router.push(`/modals/request-tokens/detail?reference=${item.reference}` as any)}
                activeOpacity={0.85}
                style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                {/* Top Row: Ref + Status */}
                <View style={styles.itemHeader}>
                  <View style={styles.refRow}>
                    <Ionicons name="card-outline" size={18} color={theme.accent} style={{ marginRight: 6 }} />
                    <Text style={[styles.refText, { color: theme.text }]}>{item.reference}</Text>
                    {item.mode === "merchant" && (
                      <View style={[styles.modeTag, { backgroundColor: theme.blueSoft }]}>
                        <Text style={[styles.modeTagText, { color: theme.blue }]}>MERCHANT</Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Amount & Token */}
                <View style={styles.amountRow}>
                  <Text style={[styles.amountValue, { color: theme.text }]}>
                    {formatAmount(item.amount, item.token_type)} <Text style={{ color: theme.accent }}>{item.token_type}</Text>
                  </Text>
                  <Text style={[styles.dateText, { color: theme.muted }]}>
                    {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                </View>

                {/* Note / Recipient */}
                {(item.description || item.recipient_email) && (
                  <View style={[styles.noteBox, { backgroundColor: theme.cardAlt }]}>
                    <Text style={[styles.noteText, { color: theme.muted }]} numberOfLines={2}>
                      {item.recipient_email ? `Target: ${item.recipient_email}` : item.description}
                    </Text>
                  </View>
                )}

                {/* Action Row */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleCopyLink(item)}
                    style={[styles.actionBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="copy-outline" size={14} color={theme.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>
                      {t("common.copy", "Copy Link")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleShare(item)}
                    style={[styles.actionBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social-outline" size={14} color={theme.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.actionBtnText, { color: theme.text }]}>
                      {t("common.share", "Share")}
                    </Text>
                  </TouchableOpacity>

                  {isPending && (
                    <TouchableOpacity
                      onPress={() => handleCancel(item)}
                      disabled={isCancellingThis}
                      style={[styles.actionBtn, { backgroundColor: theme.redSoft, borderColor: theme.redSoft }]}
                      activeOpacity={0.8}
                    >
                      {isCancellingThis ? (
                        <ActivityIndicator size="small" color={theme.red} />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={14} color={theme.red} style={{ marginRight: 4 }} />
                          <Text style={[styles.actionBtnText, { color: theme.red }]}>
                            {t("common.cancel", "Cancel")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    marginTop: 20,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  refText: {
    fontSize: 14,
    fontWeight: "700",
  },
  modeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  modeTagText: {
    fontSize: 9,
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  amountValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  dateText: {
    fontSize: 12,
  },
  noteBox: {
    padding: 10,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
