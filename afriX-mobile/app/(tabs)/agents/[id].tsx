// app/(tabs)/agents/[id].tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useWalletStore } from "@/stores";
import { formatDate, formatAmount, formatAmountOrCompact } from "@/utils/format";

interface AgentProfile {
    id: string;
    full_name: string;
    rating: number;
    country: string;
    city?: string;
    currency: string;
    tier: string;
    status?: string;
    is_online?: boolean;
    available_capacity: number;
    response_time_minutes: number;
    is_verified: boolean;
    commission_rate?: number;
    max_transaction_limit?: number;
    phone_number?: string;
    whatsapp_number?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    // XOF agents: optional mobile money details (Orange Money, Wave, Moov, etc.)
    mobile_money_provider?: string;
    mobile_money_number?: string;
    total_minted?: number;
    total_burned?: number;
}

interface Review {
    id: string;
    rating: number;
    review_text: string;
    created_at: string;
    user: {
        full_name: string;
    };
}

export default function AgentProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const agentId = params.id as string;
    const { exchangeRates } = useWalletStore();

    const [agent, setAgent] = useState<AgentProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgentProfile();
        fetchAgentReviews();
    }, [agentId]);

    const fetchAgentProfile = async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get(`/agents/${agentId}`);
            setAgent(data.data);
        } catch (error) {
            console.error("Failed to fetch agent profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAgentReviews = async () => {
        try {
            const { data } = await apiClient.get(`/agents/${agentId}/reviews?limit=5`);
            setReviews(data.data.reviews || []);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        }
    };

    const handleCall = (phoneNumber: string) => {
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleWhatsApp = (whatsappNumber: string) => {
        Linking.openURL(`whatsapp://send?phone=${whatsappNumber}`);
    };

    const handleBuyTokens = () => {
        router.push({
            pathname: "/modals/buy-tokens",
            params: { agentId: agent?.id, agentName: agent?.full_name },
        });
    };

    const handleSellTokens = () => {
        router.push({
            pathname: "/(tabs)/sell-tokens",
            params: { agentId: agent?.id, agentName: agent?.full_name },
        });
    };

    const getTierColor = (tier: string) => {
        switch (tier?.toLowerCase()) {
            case "premium":
                return "#8B5CF6";
            case "pro":
                return "#3B82F6";
            default:
                return "#00B14F";
        }
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00B14F" />
            </View>
        );
    }

    if (!agent) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Agent not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.headerBackButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Agent Profile</Text>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Agent Info Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {agent.full_name.substring(0, 2).toUpperCase()}
                            </Text>
                        </View>
                        {agent.is_verified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.agentName}>{agent.full_name}</Text>
                    <View style={styles.tierRow}>
                        <View
                            style={[
                                styles.tierBadge,
                                { backgroundColor: getTierColor(agent.tier) + "20", borderColor: getTierColor(agent.tier) + "40" },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tierText,
                                    { color: getTierColor(agent.tier) },
                                ]}
                            >
                                {agent.tier} Agent
                            </Text>
                        </View>
                        {(agent.is_online === true || agent.status === "active") && (
                            <View style={styles.activePill}>
                                <Text style={styles.activePillText}>Active</Text>
                            </View>
                        )}
                    </View>
                    {([agent.city, agent.country].filter(Boolean).length > 0) && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-outline" size={14} color="#6B7280" />
                            <Text style={styles.locationText}>
                                {[agent.city, agent.country].filter(Boolean).join(", ")}
                            </Text>
                        </View>
                    )}

                    {/* Rating */}
                    <View style={styles.ratingContainer}>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={star <= agent.rating ? "star" : "star-outline"}
                                    size={20}
                                    color="#F59E0B"
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingText}>{agent.rating.toFixed(1)}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Ionicons name="wallet-outline" size={24} color="#00B14F" />
                        <Text style={styles.statValue}>
                            ${formatAmountOrCompact(agent.available_capacity)}
                        </Text>
                        <Text style={styles.statLabel}>Capacity</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={24} color="#3B82F6" />
                        <Text style={styles.statValue}>~{agent.response_time_minutes}</Text>
                        <Text style={styles.statLabel}>Mins Response</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="swap-horizontal" size={24} color="#8B5CF6" />
                        <Text style={styles.statValue}>
                            {((agent.total_minted || 0) + (agent.total_burned || 0)).toLocaleString()}
                        </Text>
                        <Text style={styles.statLabel}>Transactions</Text>
                    </View>
                </View>

                {/* Max/trade = agent's USDT capacity converted to NT/CT & Fee */}
                <View style={styles.extraStatsRow}>
                    {(() => {
                        const cap = Number(agent.available_capacity) || 0;
                        const maxStored = agent.max_transaction_limit != null ? Number(agent.max_transaction_limit) : null;
                        const unit = agent.currency === "XOF" ? "CT" : "NT";
                        const rate = unit === "NT" ? exchangeRates.USDT_TO_NT : exchangeRates.USDT_TO_CT;
                        const capacityInLocal = rate && rate > 0 && cap > 0 ? cap * rate : null;
                        const maxTradeDisplay = capacityInLocal != null ? capacityInLocal : maxStored;
                        return maxTradeDisplay != null && maxTradeDisplay > 0 ? (
                            <View style={styles.extraStat}>
                                <Ionicons name="card-outline" size={18} color="#6B7280" />
                                <Text style={styles.extraStatLabel}>Max/trade</Text>
                                <Text style={styles.extraStatValue}>
                                    {formatAmountOrCompact(maxTradeDisplay, unit)}
                                </Text>
                            </View>
                        ) : null;
                    })()}
                    {agent.commission_rate != null && (
                        <View style={styles.extraStat}>
                            <Ionicons name="pricetag-outline" size={18} color="#6B7280" />
                            <Text style={styles.extraStatLabel}>Fee</Text>
                            <Text style={styles.extraStatValue}>
                                ~{(Number(agent.commission_rate) * 100).toFixed(1)}%
                            </Text>
                        </View>
                    )}
                </View>

                {/* Contact Info */}
                {(agent.phone_number || agent.whatsapp_number) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Contact</Text>
                        {agent.phone_number && (
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => handleCall(agent.phone_number!)}
                            >
                                <Ionicons name="call-outline" size={20} color="#00B14F" />
                                <Text style={styles.contactText}>{agent.phone_number}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                        {agent.whatsapp_number && (
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => handleWhatsApp(agent.whatsapp_number!)}
                            >
                                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                                <Text style={styles.contactText}>{agent.whatsapp_number}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Bank Details */}
                {agent.bank_name && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Bank Details</Text>
                        <View style={styles.bankCard}>
                            <View style={styles.bankRow}>
                                <Text style={styles.bankLabel}>Bank Name</Text>
                                <Text style={styles.bankValue}>{agent.bank_name}</Text>
                            </View>
                            {agent.account_number && (
                                <View style={styles.bankRow}>
                                    <Text style={styles.bankLabel}>Account Number</Text>
                                    <Text style={styles.bankValue}>{agent.account_number}</Text>
                                </View>
                            )}
                            {agent.account_name && (
                                <View style={styles.bankRow}>
                                    <Text style={styles.bankLabel}>Account Name</Text>
                                    <Text style={styles.bankValue}>{agent.account_name}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Mobile Money (XOF countries) */}
                {(agent.currency === "XOF" || agent.mobile_money_provider || agent.mobile_money_number) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mobile Money (XOF)</Text>
                        <View style={styles.bankCard}>
                            <View style={styles.bankRow}>
                                <Text style={styles.bankLabel}>Provider</Text>
                                <Text style={styles.bankValue}>{agent.mobile_money_provider || "—"}</Text>
                            </View>
                            {agent.mobile_money_number && (
                                <View style={styles.bankRow}>
                                    <Text style={styles.bankLabel}>Phone Number</Text>
                                    <Text style={styles.bankValue}>{agent.mobile_money_number}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Reviews */}
                {reviews.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Reviews</Text>
                        {reviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>
                                        {review.user.full_name}
                                    </Text>
                                    <View style={styles.reviewStars}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                                key={star}
                                                name={star <= review.rating ? "star" : "star-outline"}
                                                size={12}
                                                color="#F59E0B"
                                            />
                                        ))}
                                    </View>
                                </View>
                                {review.review_text && (
                                    <Text style={styles.reviewText}>{review.review_text}</Text>
                                )}
                                <Text style={styles.reviewDate}>
                                    {formatDate(review.created_at)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Action Buttons - sticky footer, same pattern as Buy/Sell */}
            <SafeAreaView edges={["bottom"]} style={styles.footerWrapper}>
                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.sellButton]}
                        onPress={handleSellTokens}
                    >
                        <Ionicons name="arrow-down-circle-outline" size={20} color="#F59E0B" />
                        <Text style={styles.sellButtonText}>Sell Tokens</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.buyButton]}
                        onPress={handleBuyTokens}
                    >
                        <Ionicons name="arrow-up-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.buyButtonText}>Buy Tokens</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: "#6B7280",
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: "#00B14F",
        borderRadius: 8,
    },
    backButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    header: {
        marginBottom: 20,
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
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 20,
        marginTop: 10,
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 28,
        fontWeight: "700",
        color: "#00B14F",
    },
    verifiedBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
    },
    agentName: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    tierRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        flexWrap: "wrap",
    },
    tierBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    activePill: {
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#00B14F",
    },
    activePillText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#059669",
        textTransform: "uppercase",
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 12,
    },
    locationText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    tierText: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stars: {
        flexDirection: "row",
        gap: 4,
    },
    ratingText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    statsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statDivider: {
        width: 1,
        backgroundColor: "#F3F4F6",
    },
    statValue: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },
    extraStatsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    extraStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    extraStatLabel: {
        fontSize: 13,
        color: "#6B7280",
        fontWeight: "500",
    },
    extraStatValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    contactText: {
        flex: 1,
        fontSize: 16,
        color: "#111827",
        marginLeft: 12,
    },
    bankCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    bankRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    bankLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    bankValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    reviewCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    reviewStars: {
        flexDirection: "row",
        gap: 2,
    },
    reviewText: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
        marginBottom: 8,
    },
    reviewDate: {
        fontSize: 12,
        color: "#9CA3AF",
    },
    bottomSpacer: {
        height: 24,
    },
    footerWrapper: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    actionBar: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    sellButton: {
        backgroundColor: "#FEF3C7",
        borderWidth: 1,
        borderColor: "#F59E0B",
    },
    sellButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#F59E0B",
    },
    buyButton: {
        backgroundColor: "#00B14F",
    },
    buyButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
