// app/(tabs)/agents/[id].tsx
import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import apiClient from "@/services/apiClient";
import { SUPPORTED_COUNTRIES, stripLeadingZero } from "@/constants/countries";
import { useWalletStore } from "@/stores";
import { formatDate, formatAmountOrCompact } from "@/utils/format";

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

const normalizePhoneForDisplay = (value?: string | null) =>
    stripLeadingZero(String(value || "").replace(/\D/g, "")).slice(0, 15);

const formatPhoneForDisplay = (value?: string | null) => {
    const digits = normalizePhoneForDisplay(value);

    if (!digits) return "";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;

    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
};

const getDialCodeForCountry = (country?: string | null) => {
    const normalizedCountry = String(country || "").trim().toLowerCase();
    if (!normalizedCountry) return null;

    return (
        SUPPORTED_COUNTRIES.find(
            (item) =>
                item.code.toLowerCase() === normalizedCountry ||
                item.name.toLowerCase() === normalizedCountry
        )?.dialCode || null
    );
};

const formatContactNumber = (value?: string | null, country?: string | null) => {
    const raw = String(value || "").trim();
    if (!raw) return "";

    if (raw.startsWith("+")) {
        const digits = raw.slice(1).replace(/\D/g, "");
        return digits ? `+${formatPhoneForDisplay(digits)}` : raw;
    }

    const formatted = formatPhoneForDisplay(raw);
    if (!formatted) return raw;

    const dialCode = getDialCodeForCountry(country);
    return dialCode ? `${dialCode} ${formatted}` : formatted;
};

const getContactNumberForLink = (value?: string | null, country?: string | null) => {
    const raw = String(value || "").trim();
    if (!raw) return "";

    if (raw.startsWith("+")) {
        const digits = raw.slice(1).replace(/\D/g, "");
        return digits ? `+${digits}` : raw;
    }

    const digits = normalizePhoneForDisplay(raw);
    if (!digits) return "";

    const dialCode = getDialCodeForCountry(country);
    return dialCode ? `${dialCode}${digits}` : digits;
};

export default function AgentProfileScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const agentId = params.id as string;
    const { exchangeRates } = useWalletStore();

    const [agent, setAgent] = useState<AgentProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAgentProfile = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await apiClient.get(`/agents/${agentId}`);
            setAgent(data.data);
        } catch (error) {
            console.error("Failed to fetch agent profile:", error);
        } finally {
            setLoading(false);
        }
    }, [agentId]);

    const fetchAgentReviews = useCallback(async () => {
        try {
            const { data } = await apiClient.get(`/agents/${agentId}/reviews?limit=5`);
            setReviews(data.data.reviews || []);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        }
    }, [agentId]);

    useEffect(() => {
        fetchAgentProfile();
        fetchAgentReviews();
    }, [fetchAgentProfile, fetchAgentReviews]);

    const handleCall = async (phoneNumber: string) => {
        const contactNumber = getContactNumberForLink(phoneNumber, agent?.country);
        if (!contactNumber) return;

        try {
            await Linking.openURL(`tel:${contactNumber}`);
        } catch {
            Alert.alert("Unable to place call", "This phone number could not be opened on your device.");
        }
    };

    const handleWhatsApp = async (whatsappNumber: string) => {
        const contactNumber = getContactNumberForLink(whatsappNumber, agent?.country);
        if (!contactNumber) return;

        try {
            const normalizedNumber = contactNumber.replace(/^\+/, "");
            const whatsappUrl = `whatsapp://send?phone=${normalizedNumber}`;
            const webFallbackUrl = `https://wa.me/${normalizedNumber}`;
            const canOpenWhatsApp = await Linking.canOpenURL(whatsappUrl);

            if (!canOpenWhatsApp) {
                await Linking.openURL(webFallbackUrl);
                return;
            }

            await Linking.openURL(whatsappUrl);
        } catch {
            Alert.alert("Unable to open WhatsApp", "The WhatsApp link could not be opened on this device.");
        }
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
                <Text style={styles.loadingText}>Loading agent profile...</Text>
            </View>
        );
    }

    if (!agent) {
        return (
            <View style={styles.errorContainer}>
                <View style={styles.errorIconWrap}>
                    <Ionicons name="person-circle-outline" size={28} color="#EF4444" />
                </View>
                <Text style={styles.errorTitle}>Agent not found</Text>
                <Text style={styles.errorText}>
                    We couldn&apos;t load this agent profile right now.
                </Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()} activeOpacity={0.85}>
                    <Text style={styles.primaryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const tierColor = getTierColor(agent.tier);
    const isActive = agent.is_online === true || agent.status === "active";
    const location = [agent.city, agent.country].filter(Boolean).join(", ");
    const totalTransactions = (agent.total_minted || 0) + (agent.total_burned || 0);
    const maxTradeUnit = agent.currency === "XOF" ? "CT" : "NT";
    const rate = maxTradeUnit === "NT" ? exchangeRates.USDT_TO_NT : exchangeRates.USDT_TO_CT;
    const capacity = Number(agent.available_capacity) || 0;
    const maxStored = agent.max_transaction_limit != null ? Number(agent.max_transaction_limit) : null;
    const capacityInLocal = rate && rate > 0 && capacity > 0 ? capacity * rate : null;
    const maxTradeDisplay = capacityInLocal != null ? capacityInLocal : maxStored;
    const initials = agent.full_name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const formattedPhoneNumber = formatContactNumber(agent.phone_number, agent.country);
    const formattedWhatsAppNumber = formatContactNumber(agent.whatsapp_number, agent.country);

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.headerBackButton}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Agent Profile</Text>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#F7FFF9", "#FFFFFF"]}
                    style={styles.summaryCard}
                >
                    <Text style={styles.summaryEyebrow}>Verified Agent</Text>
                    <Text style={styles.summaryTitle}>Review this agent before you trade</Text>
                    <Text style={styles.summaryText}>
                        Check capacity, response speed, payment channels, and recent feedback before you buy or sell tokens.
                    </Text>
                </LinearGradient>

                <View style={styles.profileCard}>
                    <View style={styles.profileTopRow}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, { backgroundColor: `${tierColor}20` }]}>
                                <Text style={[styles.avatarText, { color: tierColor }]}>{initials}</Text>
                            </View>
                            {agent.is_verified && (
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={20} color="#00B14F" />
                                </View>
                            )}
                        </View>
                        <View style={styles.profileIdentity}>
                            <Text style={styles.agentName}>{agent.full_name}</Text>
                            <View style={styles.metaPillsRow}>
                                <View
                                    style={[
                                        styles.tierBadge,
                                        { backgroundColor: `${tierColor}15`, borderColor: `${tierColor}35` },
                                    ]}
                                >
                                    <Text style={[styles.tierText, { color: tierColor }]}>{agent.tier} agent</Text>
                                </View>
                                {isActive && (
                                    <View style={styles.activePill}>
                                        <Text style={styles.activePillText}>Active</Text>
                                    </View>
                                )}
                            </View>
                            {location ? (
                                <View style={styles.locationRow}>
                                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                                    <Text style={styles.locationText}>{location}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.ratingRow}>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={star <= Math.round(agent.rating) ? "star" : "star-outline"}
                                    size={18}
                                    color="#F59E0B"
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingText}>{agent.rating.toFixed(1)} rating</Text>
                    </View>
                </View>

                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Ionicons name="wallet-outline" size={22} color="#00B14F" />
                        <Text style={styles.statValue}>${formatAmountOrCompact(agent.available_capacity)}</Text>
                        <Text style={styles.statLabel}>Capacity</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={22} color="#3B82F6" />
                        <Text style={styles.statValue}>~{agent.response_time_minutes} min</Text>
                        <Text style={styles.statLabel}>Response</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Ionicons name="swap-horizontal" size={22} color="#8B5CF6" />
                        <Text style={styles.statValue}>{totalTransactions.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Transactions</Text>
                    </View>
                </View>

                <View style={styles.highlightsRow}>
                    {maxTradeDisplay != null && maxTradeDisplay > 0 ? (
                        <View style={styles.highlightPill}>
                            <Ionicons name="card-outline" size={16} color="#6B7280" />
                            <Text style={styles.highlightLabel}>Max/trade</Text>
                            <Text style={styles.highlightValue}>
                                {formatAmountOrCompact(maxTradeDisplay, maxTradeUnit)}
                            </Text>
                        </View>
                    ) : null}
                    {agent.commission_rate != null ? (
                        <View style={styles.highlightPill}>
                            <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                            <Text style={styles.highlightLabel}>Fee</Text>
                            <Text style={styles.highlightValue}>~{(Number(agent.commission_rate) * 100).toFixed(1)}%</Text>
                        </View>
                    ) : null}
                </View>

                {(agent.phone_number || agent.whatsapp_number) && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Contact</Text>
                        {agent.phone_number ? (
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => handleCall(agent.phone_number!)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.contactLeft}>
                                    <View style={styles.contactIconWrap}>
                                        <Ionicons name="call-outline" size={18} color="#00B14F" />
                                    </View>
                                    <View>
                                        <Text style={styles.contactLabel}>Phone</Text>
                                        <Text style={styles.contactText}>{formattedPhoneNumber || agent.phone_number}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        ) : null}
                        {agent.whatsapp_number ? (
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() => handleWhatsApp(agent.whatsapp_number!)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.contactLeft}>
                                    <View style={styles.contactIconWrap}>
                                        <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                                    </View>
                                    <View>
                                        <Text style={styles.contactLabel}>WhatsApp</Text>
                                        <Text style={styles.contactText}>{formattedWhatsAppNumber || agent.whatsapp_number}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}

                {agent.bank_name ? (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Bank Details</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Bank Name</Text>
                            <Text style={styles.infoValue}>{agent.bank_name}</Text>
                        </View>
                        {agent.account_number ? (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Account Number</Text>
                                <Text style={styles.infoValue}>{agent.account_number}</Text>
                            </View>
                        ) : null}
                        {agent.account_name ? (
                            <View style={styles.infoRowLast}>
                                <Text style={styles.infoLabel}>Account Name</Text>
                                <Text style={styles.infoValue}>{agent.account_name}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {(agent.currency === "XOF" || agent.mobile_money_provider || agent.mobile_money_number) && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Mobile Money</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Provider</Text>
                            <Text style={styles.infoValue}>{agent.mobile_money_provider || "—"}</Text>
                        </View>
                        {agent.mobile_money_number ? (
                            <View style={styles.infoRowLast}>
                                <Text style={styles.infoLabel}>Phone Number</Text>
                                <Text style={styles.infoValue}>{agent.mobile_money_number}</Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {reviews.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Recent Reviews</Text>
                        {reviews.map((review, index) => (
                            <View
                                key={review.id}
                                style={[styles.reviewCard, index === reviews.length - 1 && styles.reviewCardLast]}
                            >
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>{review.user.full_name}</Text>
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
                                {review.review_text ? (
                                    <Text style={styles.reviewText}>{review.review_text}</Text>
                                ) : null}
                                <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={styles.footerWrapper}>
                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.sellButton]}
                        onPress={handleSellTokens}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="arrow-down-circle-outline" size={20} color="#F59E0B" />
                        <Text style={styles.sellButtonText}>Sell Tokens</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.buyButton]}
                        onPress={handleBuyTokens}
                        activeOpacity={0.85}
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
        backgroundColor: "#F9FAFB",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        paddingHorizontal: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        padding: 24,
    },
    errorIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#FEF2F2",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 20,
        textAlign: "center",
    },
    primaryButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
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
        fontSize: 22,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.4,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 32,
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
    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 20,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#EAF0F5",
    },
    profileTopRow: {
        flexDirection: "row",
        gap: 16,
        alignItems: "center",
    },
    avatarContainer: {
        position: "relative",
    },
    avatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 28,
        fontWeight: "800",
    },
    verifiedBadge: {
        position: "absolute",
        right: -2,
        bottom: -2,
        backgroundColor: "#FFFFFF",
        borderRadius: 999,
    },
    profileIdentity: {
        flex: 1,
    },
    agentName: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 8,
        letterSpacing: -0.4,
    },
    metaPillsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 10,
    },
    tierBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
    },
    tierText: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    activePill: {
        backgroundColor: "#D1FAE5",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#A7F3D0",
    },
    activePillText: {
        fontSize: 11,
        fontWeight: "800",
        color: "#059669",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    stars: {
        flexDirection: "row",
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },
    statsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 18,
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#EAF0F5",
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
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
        marginTop: 8,
        textAlign: "center",
    },
    statLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
        fontWeight: "500",
        textAlign: "center",
    },
    highlightsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 14,
    },
    highlightPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FFFFFF",
        borderRadius: 999,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#EAF0F5",
    },
    highlightLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    highlightValue: {
        fontSize: 13,
        fontWeight: "700",
        color: "#111827",
    },
    sectionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#EAF0F5",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 14,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FBFCFD",
        padding: 14,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },
    contactLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    contactIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
    },
    contactLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 4,
    },
    contactText: {
        fontSize: 15,
        color: "#111827",
        fontWeight: "700",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
        gap: 12,
    },
    infoRowLast: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        gap: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    infoValue: {
        flex: 1,
        textAlign: "right",
        fontSize: 14,
        fontWeight: "700",
        color: "#111827",
    },
    reviewCard: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    reviewCardLast: {
        borderBottomWidth: 0,
        paddingBottom: 0,
    },
    reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: "700",
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
        fontWeight: "500",
    },
    footerWrapper: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    actionBar: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 10,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    sellButton: {
        backgroundColor: "#FEF3C7",
        borderWidth: 1,
        borderColor: "#F59E0B",
    },
    sellButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#F59E0B",
    },
    buyButton: {
        backgroundColor: "#00B14F",
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 4,
    },
    buyButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});
