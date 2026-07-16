// app/settings/notification-inbox.tsx
import React, { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  useColorScheme,
  Animated,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/apiClient";
import { useNotificationStore } from "@/stores";
import * as Haptics from "expo-haptics";

import { useTranslation } from "react-i18next";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function NotificationInboxScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    divider: isDark ? "#1A2638" : "#F1F5F9",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    redBorder: isDark ? "rgba(239,68,68,0.25)" : "#FEE2E2",
    purple: "#8B5CF6",
    purpleSoft: isDark ? "rgba(139,92,246,0.12)" : "#F3E8FF",
    purpleBorder: isDark ? "rgba(139,92,246,0.25)" : "#DDD6FE",
    modalOverlay: "rgba(15, 23, 42, 0.6)",
  };

  const [list, setList] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    setFetchError(null);
    try {
      if (!append) setLoading(true);
      if (append) setLoadingMore(true);
      const res = await apiClient.get<{
        success: boolean;
        data: NotificationItem[];
        unreadCount: number;
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>("/notifications", { params: { page: pageNum, limit: 20 } });
      const raw = res.data?.data;
      const items = Array.isArray(raw) ? raw : [];
      setList(
        append
          ? (prev) => {
              const seen = new Set(prev.map((item) => item.id));
              return [...prev, ...items.filter((item) => !seen.has(item.id))];
            }
          : items
      );
      const count = res.data?.unreadCount ?? 0;
      setUnreadCount(count);
      setPage(res.data?.pagination?.page ?? pageNum);
      setTotalPages(res.data?.pagination?.totalPages ?? 1);
      useNotificationStore.getState().setUnreadCount(count);
    } catch (error) {
      console.error("Fetch notifications error:", error);
      setFetchError(t("settings.notifications_inbox.err_fetch", "Couldn’t load notifications. Pull to try again."));
      if (!append) setList([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, false);
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, false);
  };

  const loadMore = () => {
    if (loading || loadingMore || refreshing || page >= totalPages) return;
    fetchNotifications(page + 1, true);
  };

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      await apiClient.post(`/notifications/${id}/read`);
      setList((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      useNotificationStore.getState().setUnreadCount(newCount);
    } catch (error) {
      console.error("Mark read error:", error);
    } finally {
      setMarkingId(null);
    }
  };

  const markAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await apiClient.post("/notifications/read-all");
      setList((prev) =>
        prev.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      useNotificationStore.getState().setUnreadCount(0);
    } catch (error) {
      console.error("Mark all read error:", error);
    }
  };

  const openNotificationDetail = async (item: NotificationItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNotification(item);
    if (!item.is_read) {
      await markRead(item.id);
      setSelectedNotification((prev) =>
        prev && prev.id === item.id
          ? { ...prev, is_read: true, read_at: new Date().toISOString() }
          : prev
      );
    }
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return t("settings.notifications_inbox.just_now", "Just now");
    if (diff < 3600000) return t("settings.notifications_inbox.m_ago", "{{count}}m ago", { count: Math.floor(diff / 60000) });
    if (diff < 86400000) return t("settings.notifications_inbox.h_ago", "{{count}}h ago", { count: Math.floor(diff / 3600000) });
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getNotificationAccent = (type: string) => {
    const normalizedType = (type || "").toLowerCase();
    if (normalizedType.includes("security")) {
      return { bg: theme.redSoft, color: theme.red, border: theme.redBorder };
    }
    if (normalizedType.includes("agent")) {
      return { bg: theme.purpleSoft, color: theme.purple, border: theme.purpleBorder };
    }
    if (normalizedType.includes("transaction") || normalizedType.includes("wallet")) {
      return { bg: theme.accentSoft, color: theme.accent, border: theme.accentBorder };
    }
    return { bg: theme.blueSoft, color: theme.blue, border: theme.blueBorder };
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const accent = getNotificationAccent(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          { backgroundColor: theme.card, borderColor: theme.border },
          item.is_read && { opacity: 0.75 },
        ]}
        onPress={() => openNotificationDetail(item)}
        activeOpacity={0.8}
      >
        {/* Left colored bar */}
        <View style={[styles.cardAccentBar, { backgroundColor: accent.color }]} />

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={[styles.itemIconBox, { backgroundColor: accent.bg }]}>
              <Ionicons name="notifications-outline" size={18} color={accent.color} />
            </View>
            <View style={styles.itemBody}>
              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[styles.itemTime, { color: theme.muted }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
          </View>

          {item.message ? (
            <Text style={[styles.itemMessage, { color: theme.muted }]} numberOfLines={2}>
              {item.message}
            </Text>
          ) : null}

          <View style={[styles.itemFooter, { borderTopColor: theme.divider }]}>
            <Text style={[styles.itemStatusText, { color: theme.muted }]}>
              {item.is_read ? t("settings.notifications_inbox.status_read", "Read") : t("settings.notifications_inbox.status_unread", "Unread")}
            </Text>
            {markingId === item.id ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Ionicons name="chevron-forward" size={16} color={theme.muted} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Collapsible Header */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > headerMaxHeight) setHeaderMaxHeight(h);
        }}
        style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("settings.notifications_inbox.header_title", "Notification Center")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("settings.notifications_inbox.header_subtitle", "Keep track of transactions and activity alerts.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {loading && list.length === 0 && !fetchError ? (
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>{t("settings.notifications_inbox.loading", "Loading notifications...")}</Text>
        </View>
      ) : fetchError ? (
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.muted} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("settings.notifications_inbox.err_title", "Couldn't load notifications")}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.muted }]}>{fetchError}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.accent }]} onPress={() => fetchNotifications(1, false)} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>{t("common.retry", "Retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : list.length === 0 ? (
        <View style={[styles.centered, { backgroundColor: theme.background }]}>
          <Ionicons name="notifications-off-outline" size={48} color={theme.muted} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{t("settings.notifications_inbox.empty_title", "No notifications yet")}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
            {t("settings.notifications_inbox.empty_sub", "You will see alerts here when you complete transactions, receive agent updates, or key security events occur.")}
          </Text>
        </View>
      ) : (
        <AnimatedFlatList
          data={list}
          renderItem={renderItem as any}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[styles.listContent, { paddingTop: headerMaxHeight + 16 }]}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.accent]} tintColor={theme.accent} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Summary Overview Card */}
              <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("settings.notifications_inbox.overview_eyebrow", "INBOX OVERVIEW")}</Text>
                <Text style={[styles.introTitle, { color: theme.text }]}>{t("settings.notifications_inbox.overview_title", "Stay on top of updates")}</Text>
                <Text style={[styles.introSubtitle, { color: theme.muted }]}>
                  {t("settings.notifications_inbox.overview_subtitle", "Review your transaction logs, security updates, and general alerts from one organized repository.")}
                </Text>
              </View>

              {/* Toolbar */}
              <View style={styles.toolbarRow}>
                <View style={[styles.counterBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.counterValue, { color: theme.text }]}>{unreadCount}</Text>
                  <Text style={[styles.counterLabel, { color: theme.muted }]}>{t("settings.notifications_inbox.unread_label", "Unread")}</Text>
                </View>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllRead} style={[styles.markAllBtn, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]} activeOpacity={0.8}>
                    <Text style={[styles.markAllText, { color: theme.accent }]}>{t("settings.notifications_inbox.btn_mark_all", "Mark all read")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={[styles.footerLoaderText, { color: theme.muted }]}>{t("settings.notifications_inbox.loading_more", "Loading more notifications...")}</Text>
              </View>
            ) : <View style={{ height: 32 }} />
          }
        />
      )}

      {/* ── Detail Modal Sheet ── */}
      <Modal
        visible={!!selectedNotification}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={[styles.sheetOverlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedNotification(null)}
          />
          <SafeAreaView edges={["bottom"]} style={[styles.sheetWrapper, { backgroundColor: theme.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            {selectedNotification ? (
              <View style={styles.sheetContent}>
                <View style={styles.sheetHeaderRow}>
                  <View style={[styles.sheetIconBox, { backgroundColor: getNotificationAccent(selectedNotification.type).bg }]}>
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color={getNotificationAccent(selectedNotification.type).color}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedNotification(null)}
                    style={[styles.sheetCloseBtn, { backgroundColor: isDark ? "#111C2B" : "#F8FAFC" }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={20} color={theme.muted} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sheetTitle, { color: theme.text }]}>{selectedNotification.title}</Text>
                <Text style={[styles.sheetMeta, { color: theme.muted }]}>
                  {formatDate(selectedNotification.created_at)} · {selectedNotification.is_read ? t("settings.notifications_inbox.status_read", "Read") : t("settings.notifications_inbox.status_unread", "Unread")}
                </Text>

                <View style={[styles.sheetMessageCard, { backgroundColor: isDark ? "#111C2B" : "#F8FAFC", borderColor: theme.border }]}>
                  <Text style={[styles.sheetMessage, { color: theme.text }]}>
                    {selectedNotification.message || t("settings.notifications_inbox.no_message", "No additional message content for this notification.")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.sheetPrimaryBtn, { backgroundColor: theme.accent }]}
                  onPress={() => setSelectedNotification(null)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.sheetPrimaryBtnText}>{t("common.done", "Done")}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10, borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 10, paddingBottom: 16,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  glow: {
    position: "absolute", top: 0, left: 0, right: 0, height: 200,
  },
  introCard: {
    borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1,
  },
  introEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8 },
  introTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, letterSpacing: -0.4 },
  introSubtitle: { fontSize: 14, lineHeight: 21 },
  listHeader: {
    marginBottom: 8,
  },
  toolbarRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
  },
  counterBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1,
  },
  counterValue: { fontSize: 14, fontWeight: "800" },
  counterLabel: { fontSize: 12, fontWeight: "600" },
  markAllBtn: {
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1,
  },
  markAllText: { fontSize: 13, fontWeight: "800" },
  itemCard: {
    borderRadius: 22, borderWidth: 1, overflow: "hidden", marginBottom: 12,
    flexDirection: "row",
  },
  cardAccentBar: {
    width: 5,
  },
  itemContent: { flex: 1, padding: 16 },
  itemHeader: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  itemIconBox: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  itemTime: { fontSize: 11, fontWeight: "600" },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, marginTop: 6,
  },
  itemMessage: { fontSize: 13, lineHeight: 18, fontWeight: "500", marginTop: 10, marginBottom: 12 },
  itemFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTopWidth: 1,
  },
  itemStatusText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  centered: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 24,
  },
  loadingText: { fontSize: 13, fontWeight: "600", marginTop: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "800", marginTop: 12 },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 19, fontWeight: "500", marginTop: 6, paddingHorizontal: 16 },
  retryBtn: {
    marginTop: 20, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14,
  },
  retryBtnText: { fontSize: 14, fontWeight: "800", color: "#FFF" },
  footerLoader: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16,
  },
  footerLoaderText: { fontSize: 13, fontWeight: "600" },

  // Detail Modal Sheet
  sheetOverlay: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { flex: 1 },
  sheetIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  sheetWrapper: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  sheetHandle: {
    width: 44, height: 5, borderRadius: 999, alignSelf: "center", marginBottom: 16,
  },
  sheetContent: { paddingBottom: 8 },
  sheetHeaderRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
  },
  sheetCloseBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  sheetTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4, marginBottom: 6, lineHeight: 26 },
  sheetMeta: { fontSize: 12, fontWeight: "600", marginBottom: 16 },
  sheetMessageCard: {
    borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 18,
  },
  sheetMessage: { fontSize: 14, lineHeight: 21, fontWeight: "500" },
  sheetPrimaryBtn: {
    height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  sheetPrimaryBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
});
