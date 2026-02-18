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
    }, [countryCode, sort]);

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
            {/* Header Section */}
            <View style={styles.header}>
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
                        <Text style={styles.subtitle}>
                            Find trusted agents in your country
                        </Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* Sort */}
            <View style={styles.sortRow}>
                {(["rating", "fastest", "capacity"] as const).map((key) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.sortBtn, sort === key && styles.sortBtnActive]}
                        onPress={() => setSort(key)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.sortBtnText, sort === key && styles.sortBtnTextActive]}>
                            {key === "rating" ? "Best rated" : key === "fastest" ? "Fastest" : "Highest capacity"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Agents List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00B14F" />
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
        backgroundColor: "#F3F4F6",
    },
    header: {
        marginBottom: 20,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 140,
    },
    headerContent: {
        paddingHorizontal: 20,
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
    },
    subtitle: {
        fontSize: 14,
        color: "#FFFFFF",
        opacity: 0.9,
        marginLeft: 0,
        textAlign: "center",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    sortRow: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 20,
        marginBottom: 8,
        justifyContent: "center",
    },
    sortBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
    },
    sortBtnActive: {
        backgroundColor: "#00B14F",
    },
    sortBtnText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
    },
    sortBtnTextActive: {
        color: "#FFFFFF",
    },
    listContent: {
        padding: 20,
        paddingTop: 8,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        marginTop: 16,
        fontWeight: "600",
    },
    emptySubtext: {
        fontSize: 14,
        color: "#9CA3AF",
        marginTop: 4,
    },
});
