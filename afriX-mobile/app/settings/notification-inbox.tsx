import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    FlatList,
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
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [markingId, setMarkingId] = useState<string | null>(null);

    const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
        setFetchError(null);
        try {
            if (!append) setLoading(true);
            const res = await apiClient.get<{
                success: boolean;
                data: NotificationItem[];
                unreadCount: number;
                pagination: { page: number; limit: number; total: number; totalPages: number };
            }>("/notifications", { params: { page: pageNum, limit: 20 } });
            const raw = res.data?.data;
            const items = Array.isArray(raw) ? raw : [];
            setList(append ? (prev) => [...prev, ...items] : items);
            const count = res.data?.unreadCount ?? 0;
            setUnreadCount(count);
            useNotificationStore.getState().setUnreadCount(count);
            setTotalPages(res.data?.pagination?.totalPages ?? 1);
            setPage(pageNum);
        } catch (e) {
            console.error("Fetch notifications error:", e);
            setFetchError("Couldn’t load notifications. Pull to try again.");
            if (!append) setList([]);
        } finally {
            setLoading(false);
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

    const markRead = async (id: string) => {
        setMarkingId(id);
        try {
            await apiClient.post(`/notifications/${id}/read`);
            setList((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
            );
            const newCount = Math.max(0, unreadCount - 1);
            setUnreadCount(newCount);
            useNotificationStore.getState().setUnreadCount(newCount);
        } catch (e) {
            console.error("Mark read error:", e);
        } finally {
            setMarkingId(null);
        }
    };

    const markAllRead = async () => {
        try {
            await apiClient.post("/notifications/read-all");
            setList((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
            setUnreadCount(0);
            useNotificationStore.getState().setUnreadCount(0);
        } catch (e) {
            console.error("Mark all read error:", e);
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString();
    };

    const renderItem = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            style={[styles.item, item.is_read && styles.itemRead]}
            onPress={() => {
                if (!item.is_read) markRead(item.id);
            }}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.itemDot, !item.is_read && styles.itemDotUnread]} />
                <View style={styles.itemBody}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    {item.message ? (
                        <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
                    ) : null}
                    <Text style={styles.itemTime}>{formatDate(item.created_at)}</Text>
                </View>
            </View>
            {markingId === item.id ? (
                <ActivityIndicator size="small" color="#00B14F" />
            ) : null}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Notification center</Text>
                        {unreadCount > 0 ? (
                            <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                                <Text style={styles.markAllText}>Mark all read</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 80 }} />
                        )}
                    </View>
                </SafeAreaView>
            </View>

            {loading && list.length === 0 && !fetchError ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#00B14F" />
                </View>
            ) : fetchError ? (
                <View style={styles.centered}>
                    <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>Couldn’t load notifications</Text>
                    <Text style={styles.emptySubtitle}>{fetchError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications(1, false)}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : list.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No notifications yet</Text>
                    <Text style={styles.emptySubtitle}>
                        You’ll see notifications here when you complete a buy or sell, get agent updates, or receive security alerts.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={list}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00B14F"]} />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F3F4F6" },
    headerWrapper: { marginBottom: 12 },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
    },
    headerContent: { paddingHorizontal: 20 },
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
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
    markAllBtn: { paddingVertical: 8, paddingHorizontal: 12 },
    markAllText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
    listContent: { padding: 16, paddingBottom: 32 },
    item: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    itemRead: { opacity: 0.85 },
    itemLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
    itemDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "transparent",
        marginTop: 8,
        marginRight: 12,
    },
    itemDotUnread: { backgroundColor: "#00B14F" },
    itemBody: { flex: 1 },
    itemTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
    itemMessage: { fontSize: 14, color: "#6B7280", marginBottom: 4 },
    itemTime: { fontSize: 12, color: "#9CA3AF" },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 12 },
    emptySubtitle: { fontSize: 14, color: "#6B7280", marginTop: 8, textAlign: "center", paddingHorizontal: 24 },
    retryButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: "#00B14F",
        borderRadius: 12,
    },
    retryButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
});
