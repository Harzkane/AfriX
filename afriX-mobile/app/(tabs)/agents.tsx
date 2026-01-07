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
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/stores";

interface Agent {
    id: string;
    full_name: string;
    rating: number;
    country: string;
    currency: string;
    tier: string;
    available_capacity: number;
    response_time_minutes: number;
    is_verified: boolean;
    phone_number?: string;
    whatsapp_number?: string;
}

export default function AgentsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            // Filter agents by user's country
            const countryCode = user?.country_code || "NG";
            const { data } = await apiClient.get(
                `${API_ENDPOINTS.AGENTS.LIST}?country=${countryCode}`
            );
            setAgents(data.data || []);
        } catch (error) {
            console.error("Failed to fetch agents:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAgentPress = (agent: Agent) => {
        router.push({
            pathname: "/(tabs)/agents/[id]",
            params: { id: agent.id },
        });
    };

    const getTierColor = (tier: string) => {
        switch (tier.toLowerCase()) {
            case "premium":
                return "#8B5CF6";
            case "pro":
                return "#3B82F6";
            default:
                return "#00B14F";
        }
    };

    const getTierBadgeStyle = (tier: string) => {
        const color = getTierColor(tier);
        return {
            backgroundColor: color + "20",
            borderColor: color,
        };
    };

    const renderAgent = ({ item }: { item: Agent }) => (
        <TouchableOpacity
            style={styles.agentCard}
            onPress={() => handleAgentPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.agentHeader}>
                <View style={styles.agentAvatar}>
                    <Text style={styles.avatarText}>
                        {item.full_name.substring(0, 2).toUpperCase()}
                    </Text>
                    {item.is_verified && (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                        </View>
                    )}
                </View>
                <View style={styles.agentInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.agentName}>{item.full_name}</Text>
                        <View
                            style={[
                                styles.tierBadge,
                                getTierBadgeStyle(item.tier),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tierText,
                                    { color: getTierColor(item.tier) },
                                ]}
                            >
                                {item.tier}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.statText}>{item.rating.toFixed(1)}</Text>
                        </View>
                        <Text style={styles.dot}>•</Text>
                        <View style={styles.stat}>
                            <Ionicons name="time-outline" size={14} color="#6B7280" />
                            <Text style={styles.statText}>
                                ~{item.response_time_minutes} mins
                            </Text>
                        </View>
                    </View>
                    <View style={styles.capacityRow}>
                        <Ionicons name="wallet-outline" size={14} color="#6B7280" />
                        <Text style={styles.capacityText}>
                            ${item.available_capacity.toLocaleString()} available
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        </TouchableOpacity>
    );

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
                        <Text style={styles.title}>Agents</Text>
                        <Text style={styles.subtitle}>
                            Find trusted agents in your country
                        </Text>
                    </View>
                </SafeAreaView>
            </View>

            {/* Agents List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00B14F" />
                </View>
            ) : (
                <FlatList
                    data={agents}
                    renderItem={renderAgent}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchAgents(true)}
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
        height: 160,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    headerTop: {
        paddingBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "#FFFFFF",
        opacity: 0.9,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        padding: 20,
    },
    agentCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    agentHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    agentAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        position: "relative",
    },
    avatarText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#00B14F",
    },
    verifiedBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
    },
    agentInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    agentName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginRight: 8,
    },
    tierBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    tierText: {
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    stat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
    },
    dot: {
        marginHorizontal: 8,
        color: "#D1D5DB",
        fontSize: 12,
    },
    capacityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    capacityText: {
        fontSize: 12,
        color: "#6B7280",
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
