// app/(tabs)/agents.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore, useAgentStore } from "@/stores";
import { AgentCard } from "@/components/ui/AgentCard";

type SortOption = "rating" | "fastest" | "capacity";

export default function AgentsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { agents, loading, fetchAgents } = useAgentStore();
    const [sort, setSort] = useState<SortOption>("rating");
    const [refreshing, setRefreshing] = useState(false);

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

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerTitleRow}>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.title}>Agents</Text>
                            <View style={{ width: 40 }} />
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <View style={styles.controlsContainer}>
                <LinearGradient
                    colors={["#F7FFF9", "#FFFFFF"]}
                    style={styles.summaryCard}
                >
                    <Text style={styles.summaryEyebrow}>Agent Network</Text>
                    <Text style={styles.summaryTitle}>Find trusted agents near you</Text>
                    <Text style={styles.summaryText}>
                        Compare verified agents by rating, response speed, and transaction capacity before you continue.
                    </Text>
                    <View style={styles.summaryMetaRow}>
                        <View style={styles.summaryMetaPill}>
                            <Text style={styles.summaryMetaValue}>{agents.length}</Text>
                            <Text style={styles.summaryMetaLabel}>Available</Text>
                        </View>
                        <View style={styles.summaryMetaPill}>
                            <Text style={styles.summaryMetaValue}>{countryCode}</Text>
                            <Text style={styles.summaryMetaLabel}>Country</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.sortPanel}>
                    {(["rating", "fastest", "capacity"] as const).map((key) => (
                        <TouchableOpacity
                            key={key}
                            style={[styles.sortBtn, sort === key && styles.sortBtnActive]}
                            onPress={() => setSort(key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.sortBtnText, sort === key && styles.sortBtnTextActive]}>
                                {key === "rating" ? "Best rated" : key === "fastest" ? "Fastest" : "Capacity"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Agents List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00B14F" />
                    <Text style={styles.loadingText}>Loading available agents...</Text>
                </View>
            ) : (
                <FlatList
                    data={agents}
                    renderItem={({ item }) => (
                        <AgentCard
                            agent={item}
                            onSelect={handleAgentPress}
                        />
                    )}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#00B14F"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons
                                name="people-outline"
                                size={64}
                                color="#D1D5DB"
                            />
                            <Text style={styles.emptyText}>
                                No agents available in your country
                            </Text>
                            <Text style={styles.emptySubtext}>
                                Check back later or contact support
                            </Text>
                        </View>
                    }
                />
            )}
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
        paddingHorizontal: 16,
    },
    headerTop: {
        paddingBottom: 20,
        marginTop: 10,
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.5,
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
        color: "#6B7280",
        fontWeight: "500",
    },
    controlsContainer: {
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 8,
    },
    summaryCard: {
        borderRadius: 22,
        padding: 18,
        marginTop: -34,
        marginBottom: 14,
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
    summaryMetaRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    summaryMetaPill: {
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
    summaryMetaValue: {
        fontSize: 14,
        fontWeight: "800",
        color: "#111827",
    },
    summaryMetaLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7280",
    },
    sortPanel: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 6,
        gap: 6,
        borderWidth: 1,
        borderColor: "#EAF0F5",
    },
    sortBtn: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    sortBtnActive: {
        backgroundColor: "#00B14F",
    },
    sortBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    sortBtnTextActive: {
        color: "#FFFFFF",
    },
    listContent: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 24,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        marginTop: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    emptySubtext: {
        fontSize: 14,
        color: "#9CA3AF",
        marginTop: 4,
        textAlign: "center",
    },
});
