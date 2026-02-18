import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/stores";
import { AgentCard } from "@/components/ui/AgentCard";

type SortOption = "rating" | "fastest" | "capacity";

export default function SelectAgentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ amount?: string; tokenType?: string }>();
    const { user } = useAuthStore();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortOption>("rating");

    const userAmount = params.amount ? parseFloat(params.amount) : undefined;
    const tokenType = (params.tokenType as string) || "NT";

    useEffect(() => {
        fetchAgents();
    }, [sort]);

    const fetchAgents = async () => {
        try {
            const countryCode = user?.country_code || "NG";
            let url = `${API_ENDPOINTS.AGENTS.LIST}?country=${countryCode}`;
            if (sort && sort !== "rating") url += `&sort=${sort}`;
            const { data } = await apiClient.get(url);
            setAgents(data.data || []);
        } catch (error) {
            console.error("Failed to fetch agents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAgent = (agent: any) => {
        router.push({
            pathname: "/(tabs)/sell-tokens/bank-details",
            params: { ...params, agentId: agent.id, agentName: agent.full_name }
        });
    };

    return (
        <View style={styles.container}>
            {/* Gradient Header */}
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>Select Agent</Text>
                            <Text style={styles.subtitle}>
                                {userAmount != null && userAmount > 0
                                    ? `Sell ${userAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${tokenType} — choose an agent`
                                    : "Choose an agent to sell your tokens"}
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00B14F" />
                    <Text style={styles.loadingText}>Finding available agents...</Text>
                </View>
            ) : (
                <>
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
                    <FlatList
                        data={agents}
                        renderItem={({ item }) => (
                            <AgentCard
                                agent={item}
                                onSelect={handleSelectAgent}
                                userAmount={userAmount}
                                tokenType={tokenType}
                            />
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                                </View>
                                <Text style={styles.emptyText}>No agents available</Text>
                                <Text style={styles.emptySubtext}>
                                    Please try again later or contact support
                                </Text>
                            </View>
                        }
                    />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    headerWrapper: {
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
        flexDirection: "row",
        alignItems: "flex-start",
        paddingTop: 10,
        paddingBottom: 20,
    },
    backButton: {
        marginRight: 12,
        marginTop: 4,
        padding: 4,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.9)",
        fontWeight: "500",
    },
    sortRow: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 20,
        marginBottom: 12,
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
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 8,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 80,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#F9FAFB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
    },
});
