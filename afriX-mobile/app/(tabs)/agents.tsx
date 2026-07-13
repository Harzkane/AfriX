// app/(tabs)/agents.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    useColorScheme,
    Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore, useAgentStore } from "@/stores";
import { AgentCard } from "@/components/ui/AgentCard";

type SortOption = "rating" | "fastest" | "capacity";

const sortOptions: { key: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "rating", label: "Top rated", icon: "star" },
    { key: "fastest", label: "Fast response", icon: "time" },
    { key: "capacity", label: "More capacity", icon: "layers" },
];

export default function AgentsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { agents, loading, fetchAgents } = useAgentStore();
    const [sort, setSort] = useState<SortOption>("rating");
    const [refreshing, setRefreshing] = useState(false);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const insets = useSafeAreaInsets();
    const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
    const scrollY = useRef(new Animated.Value(0)).current;

    const handleHeaderLayout = (e: any) => {
        const { height } = e.nativeEvent.layout;
        if (height > headerMaxHeight) {
            setHeaderMaxHeight(height);
        }
    };

    const subtitleOpacity = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    const subtitleMaxHeight = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [80, 0],
        extrapolate: "clamp",
    });

    const subtitleMargin = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [4, 0],
        extrapolate: "clamp",
    });
    const theme = {
        background: isDark ? "#07111A" : "#F5F7FB",
        card: isDark ? "#0E1726" : "#FFFFFF",
        cardAlt: isDark ? "#111C2B" : "#F8FAFC",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "#1E2A3A" : "#E2E8F0",
        accent: "#00B14F",
        accentSoft: isDark ? "rgba(0,177,79,0.16)" : "#EAF8EF",
    };

    const countryCode = user?.country_code || "NG";

    useEffect(() => {
        fetchAgents(countryCode, sort);
    }, [countryCode, fetchAgents, sort]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAgents(countryCode, sort);
        setRefreshing(false);
    };

    const handleAgentPress = (agent: any) => {
        router.push({
            pathname: "/(tabs)/agents/[id]",
            params: { id: agent.id },
        });
    };

    const verifiedCount = useMemo(
        () => agents.filter((agent) => agent.is_verified).length,
        [agents]
    );
    const activeCount = useMemo(
        () => agents.filter((agent) => agent.is_online === true || agent.status === "active").length,
        [agents]
    );

    const Header = () => (
        <View style={styles.headerBlock}>
            {/* Spacer matching the header height */}
            <View style={{ height: headerMaxHeight }} />

            <View style={styles.listHeader}>
                <LinearGradient
                    colors={isDark ? ["#0E1726", "#111E2E"] : ["#F7FFF9", "#FFFFFF"]}
                    style={[styles.snapshotCard, { borderColor: theme.border }]}
                >
                    <View style={styles.snapshotTop}>
                        <View>
                            <Text style={[styles.snapshotLabel, { color: theme.accent }]}>Quick overview</Text>
                            <Text style={[styles.snapshotTitle, { color: theme.text }]}>Trade with confidence</Text>
                        </View>
                        <View style={[styles.countryBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="flag" size={14} color={theme.accent} />
                            <Text style={[styles.countryText, { color: theme.text }]}>{countryCode}</Text>
                        </View>
                    </View>

                    <View style={styles.snapshotGrid}>
                        <View style={[styles.snapshotTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="people-outline" size={16} color={theme.accent} />
                            <Text style={[styles.snapshotValue, { color: theme.text }]}>{agents.length}</Text>
                            <Text style={[styles.snapshotMeta, { color: theme.muted }]}>Available agents</Text>
                        </View>
                        <View style={[styles.snapshotTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="shield-checkmark-outline" size={16} color="#3B82F6" />
                            <Text style={[styles.snapshotValue, { color: theme.text }]}>{verifiedCount}</Text>
                            <Text style={[styles.snapshotMeta, { color: theme.muted }]}>Verified profiles</Text>
                        </View>
                        <View style={[styles.snapshotTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="flash-outline" size={16} color="#8B5CF6" />
                            <Text style={[styles.snapshotValue, { color: theme.text }]}>{activeCount}</Text>
                            <Text style={[styles.snapshotMeta, { color: theme.muted }]}>Online now</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.sectionHeadingRow}>
                    <View>
                        <Text style={[styles.sectionHeading, { color: theme.text }]}>Browse agents</Text>
                        <Text style={[styles.sectionSubheading, { color: theme.muted }]}>
                            Choose a sorting style that matches how you trade.
                        </Text>
                    </View>
                </View>

                <View style={[styles.sortPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {sortOptions.map((option) => {
                        const active = sort === option.key;
                        return (
                            <TouchableOpacity
                                key={option.key}
                                style={[
                                    styles.sortPill,
                                    active && { backgroundColor: theme.accent, borderColor: theme.accent },
                                ]}
                                onPress={() => setSort(option.key)}
                                activeOpacity={0.75}
                            >
                                <Ionicons
                                    name={option.icon}
                                    size={14}
                                    color={active ? "#FFFFFF" : theme.muted}
                                />
                                <Text style={[styles.sortText, { color: active ? "#FFFFFF" : theme.muted }]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={isDark ? ["rgba(0,177,79,0.22)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.18)", "rgba(255,255,255,0)"]}
                style={styles.backgroundGlow}
                pointerEvents="none"
            />

            {/* Fixed Header */}
            <Animated.View
                onLayout={handleHeaderLayout}
                style={[
                    styles.headerWrapper,
                    {
                        backgroundColor: theme.background,
                        borderBottomColor: theme.border,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 10,
                    },
                ]}
            >
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="arrow-back" size={22} color={theme.text} />
                        </TouchableOpacity>

                        <View style={styles.headerCopy}>
                            <Text style={[styles.title, { color: theme.text }]}>Agents</Text>
                            <Animated.View style={{
                                opacity: subtitleOpacity,
                                maxHeight: subtitleMaxHeight,
                                marginTop: subtitleMargin,
                                overflow: "hidden"
                            }}>
                                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                                    Compare verified agents by rating, response speed, and available capacity.
                                </Text>
                            </Animated.View>
                        </View>

                        <View style={[styles.headerBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
                            <Text style={[styles.headerBadgeText, { color: theme.text }]}>Live</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </Animated.View>

            {loading ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.background, paddingTop: headerMaxHeight }]}>
                    <ActivityIndicator size="large" color={theme.accent} />
                    <Text style={[styles.loadingText, { color: theme.muted }]}>Loading available agents...</Text>
                </View>
            ) : (
                <FlatList
                    data={agents}
                    renderItem={({ item }) => <AgentCard agent={item} onSelect={handleAgentPress} />}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={Header}
                    ListHeaderComponentStyle={styles.headerListWrap}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIconWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Ionicons name="people-outline" size={28} color={theme.accent} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No agents found</Text>
                            <Text style={[styles.emptyText, { color: theme.muted }]}>
                                We couldn&apos;t find active agents in your country right now.
                            </Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: "500",
    },
    headerBlock: {
        marginBottom: 16,
    },
    backgroundGlow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 180,
    },
    headerContent: {
        width: "100%",
        paddingBottom: 14,
    },
    headerWrapper: {
        borderBottomWidth: 1,
    },
    headerTop: {
        paddingHorizontal: 16,
        paddingTop: 6,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    headerCopy: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: "500",
        lineHeight: 20,
        marginTop: 4,
    },
    headerBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignSelf: "flex-start",
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    headerBadgeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    listHeader: {
        marginTop: 12,
    },
    snapshotCard: {
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        marginBottom: 14,
    },
    snapshotTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 14,
        gap: 12,
        flexWrap: "wrap",
    },
    snapshotLabel: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginBottom: 4,
    },
    snapshotTitle: {
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    countryBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexShrink: 0,
    },
    countryText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    snapshotGrid: {
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
    },
    snapshotTile: {
        flex: 1,
        minWidth: 92,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        alignItems: "center",
    },
    snapshotValue: {
        marginTop: 8,
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    snapshotMeta: {
        fontSize: 11,
        fontWeight: "600",
        marginTop: 2,
        textAlign: "center",
    },
    sectionHeadingRow: {
        marginTop: 6,
        marginBottom: 10,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    sectionSubheading: {
        fontSize: 13,
        fontWeight: "500",
        marginTop: 4,
    },
    sortPanel: {
        flexDirection: "row",
        gap: 8,
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
    },
    sortPill: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "transparent",
    },
    sortText: {
        fontSize: 13,
        fontWeight: "700",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    headerListWrap: {
        paddingBottom: 8,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 68,
        paddingHorizontal: 24,
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    emptyText: {
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
        fontWeight: "500",
    },
});
