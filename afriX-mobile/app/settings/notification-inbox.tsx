import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    FlatList,
    Modal,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/apiClient";
import { useNotificationStore } from "@/stores";

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

export default function NotificationInboxScreen() {
    const router = useRouter();
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
            setFetchError("Couldn’t load notifications. Pull to try again.");
            if (!append) setList([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, []);

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
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    const getNotificationAccent = (type: string) => {
        const normalizedType = (type || "").toLowerCase();
        if (normalizedType.includes("security")) return { bg: "#FEF2F2", color: "#DC2626" };
        if (normalizedType.includes("agent")) return { bg: "#F3E8FF", color: "#7C3AED" };
        if (normalizedType.includes("transaction") || normalizedType.includes("wallet")) {
            return { bg: "#ECFDF3", color: "#00B14F" };
        }
        return { bg: "#EFF6FF", color: "#3B82F6" };
    };

    const renderItem = ({ item }: { item: NotificationItem }) => {
        const accent = getNotificationAccent(item.type);

        return (
            <TouchableOpacity
                style={[styles.item, item.is_read && styles.itemRead]}
                onPress={() => openNotificationDetail(item)}
                activeOpacity={0.75}
            >
                <View style={[styles.cardAccent, { backgroundColor: accent.color }]} />
                <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                        <View style={styles.itemLeft}>
                            <View style={[styles.itemIconWrap, { backgroundColor: accent.bg }]}>
                                <Ionicons name="notifications-outline" size={18} color={accent.color} />
                            </View>
                            <View style={styles.itemBody}>
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.itemTime}>{formatDate(item.created_at)}</Text>
                            </View>
                        </View>
                        {!item.is_read ? <View style={styles.unreadDot} /> : null}
                    </View>

                    {item.message ? (
                        <Text style={styles.itemMessage}>{item.message}</Text>
                    ) : null}

                    <View style={styles.itemFooter}>
                        <Text style={styles.itemStatus}>{item.is_read ? "Read" : "Unread"}</Text>
                        {markingId === item.id ? (
                            <ActivityIndicator size="small" color="#00B14F" />
                        ) : (
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Notification Center</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </View>

            {loading && list.length === 0 && !fetchError ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#00B14F" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            ) : fetchError ? (
                <View style={styles.centered}>
                    <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>Couldn’t load notifications</Text>
                    <Text style={styles.emptySubtitle}>{fetchError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications(1, false)} activeOpacity={0.85}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : list.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No notifications yet</Text>
                    <Text style={styles.emptySubtitle}>
                        You&apos;ll see updates here when you complete transactions, receive agent activity, or get security alerts.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.35}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00B14F"]} />
                    }
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <LinearGradient
                                colors={["#F7FFF9", "#FFFFFF"]}
                                style={styles.summaryCard}
                            >
                                <Text style={styles.summaryEyebrow}>Inbox Overview</Text>
                                <Text style={styles.summaryTitle}>Stay on top of every important update</Text>
                                <Text style={styles.summaryText}>
                                    Review transaction alerts, security notices, and account activity from one organized inbox.
                                </Text>
                            </LinearGradient>

                            <View style={styles.toolbarRow}>
                                <View style={styles.counterPill}>
                                    <Text style={styles.counterValue}>{unreadCount}</Text>
                                    <Text style={styles.counterLabel}>Unread</Text>
                                </View>
                                {unreadCount > 0 ? (
                                    <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn} activeOpacity={0.8}>
                                        <Text style={styles.markAllText}>Mark all read</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    }
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator size="small" color="#00B14F" />
                                <Text style={styles.footerLoaderText}>Loading more notifications...</Text>
                            </View>
                        ) : <View style={styles.footerSpacer} />
                    }
                />
            )}

            <Modal
                visible={!!selectedNotification}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedNotification(null)}
            >
                <View style={styles.sheetOverlay}>
                    <TouchableOpacity
                        style={styles.sheetBackdrop}
                        activeOpacity={1}
                        onPress={() => setSelectedNotification(null)}
                    />
                    <SafeAreaView edges={["bottom"]} style={styles.sheetWrapper}>
                        <View style={styles.sheetHandle} />
                        {selectedNotification ? (
                            <View style={styles.sheetContent}>
                                <View style={styles.sheetHeader}>
                                    <View style={[styles.sheetIconWrap, { backgroundColor: getNotificationAccent(selectedNotification.type).bg }]}>
                                        <Ionicons
                                            name="notifications-outline"
                                            size={20}
                                            color={getNotificationAccent(selectedNotification.type).color}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setSelectedNotification(null)}
                                        style={styles.sheetCloseButton}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="close" size={20} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.sheetTitle}>{selectedNotification.title}</Text>
                                <Text style={styles.sheetMeta}>
                                    {formatDate(selectedNotification.created_at)} · {selectedNotification.is_read ? "Read" : "Unread"}
                                </Text>

                                <View style={styles.sheetMessageCard}>
                                    <Text style={styles.sheetMessage}>
                                        {selectedNotification.message || "No additional message content for this notification."}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.sheetPrimaryButton}
                                    onPress={() => setSelectedNotification(null)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.sheetPrimaryButtonText}>Done</Text>
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
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 20,
        marginTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.4,
    },
    headerSpacer: {
        width: 40,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    footerLoader: {
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    footerLoaderText: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
    },
    footerSpacer: {
        height: 12,
    },
    listHeader: {
        paddingTop: 58,
        marginBottom: 10,
    },
    summaryCard: {
        borderRadius: 22,
        padding: 18,
        marginTop: -22,
        marginBottom: 16,
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
    toolbarRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    counterPill: {
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
    counterValue: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
    },
    counterLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7280",
    },
    markAllBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: "#ECFDF3",
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#D1FAE5",
    },
    markAllText: {
        fontSize: 13,
        color: "#059669",
        fontWeight: "700",
    },
    item: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#EAF0F5",
        overflow: "hidden",
    },
    cardAccent: {
        height: 4,
        width: "100%",
    },
    itemRead: {
        opacity: 0.92,
    },
    itemContent: {
        padding: 16,
    },
    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    itemLeft: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        flex: 1,
    },
    itemIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    itemBody: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    itemTime: {
        fontSize: 12,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#00B14F",
        marginTop: 6,
    },
    itemMessage: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
        marginTop: 12,
        marginBottom: 14,
    },
    itemFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    itemStatus: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#F9FAFB",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#374151",
        marginTop: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 8,
        textAlign: "center",
        paddingHorizontal: 24,
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 20,
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: "#00B14F",
        borderRadius: 14,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    sheetOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(15, 23, 42, 0.24)",
    },
    sheetBackdrop: {
        flex: 1,
    },
    sheetWrapper: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
    },
    sheetHandle: {
        width: 48,
        height: 5,
        borderRadius: 999,
        backgroundColor: "#D1D5DB",
        alignSelf: "center",
        marginBottom: 16,
    },
    sheetContent: {
        paddingBottom: 8,
    },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    sheetIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    sheetCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
        lineHeight: 28,
        marginBottom: 6,
        letterSpacing: -0.4,
    },
    sheetMeta: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
        marginBottom: 16,
    },
    sheetMessageCard: {
        backgroundColor: "#FBFCFD",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EEF2F7",
        marginBottom: 18,
    },
    sheetMessage: {
        fontSize: 15,
        lineHeight: 22,
        color: "#374151",
    },
    sheetPrimaryButton: {
        backgroundColor: "#00B14F",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    sheetPrimaryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});
