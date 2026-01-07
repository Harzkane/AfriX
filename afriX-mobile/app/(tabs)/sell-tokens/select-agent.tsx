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
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useAuthStore } from "@/stores";

// Mock agent type until we have a proper store/type
interface Agent {
    id: string;
    full_name: string;
    rating: number;
    country: string;
    available_capacity: number;
    response_time_minutes: number;
}

export default function SelectAgentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            // Filter agents by user's country
            const countryCode = user?.country_code || "NG";
            const { data } = await apiClient.get(`${API_ENDPOINTS.AGENTS.LIST}?country=${countryCode}`);
            setAgents(data.data || []);
        } catch (error) {
            console.error("Failed to fetch agents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAgent = (agent: Agent) => {
        router.push({
            pathname: "/(tabs)/sell-tokens/bank-details",
            params: { ...params, agentId: agent.id, agentName: agent.full_name }
        });
    };

    const renderAgent = ({ item }: { item: Agent }) => (
        <TouchableOpacity
            style={styles.agentCard}
            onPress={() => handleSelectAgent(item)}
        >
            <View style={styles.agentAvatar}>
                <Text style={styles.avatarText}>
                    {item.full_name.substring(0, 2).toUpperCase()}
                </Text>
            </View>
            <View style={styles.agentInfo}>
                <Text style={styles.agentName}>{item.full_name}</Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.responseTime}>~{item.response_time_minutes} mins</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Agent</Text>
                <View style={{ width: 24 }} />
            </View>

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
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No agents available currently.</Text>
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
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        padding: 16,
    },
    agentCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    agentAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#00B14F",
    },
    agentInfo: {
        flex: 1,
    },
    agentName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    ratingText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginLeft: 4,
    },
    dot: {
        marginHorizontal: 6,
        color: "#9CA3AF",
    },
    responseTime: {
        fontSize: 14,
        color: "#6B7280",
    },
    emptyState: {
        padding: 40,
        alignItems: "center",
    },
    emptyText: {
        color: "#9CA3AF",
        fontSize: 16,
    },
});
