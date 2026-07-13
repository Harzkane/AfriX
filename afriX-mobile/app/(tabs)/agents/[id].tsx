// app/(tabs)/agents/[id].tsx
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
    useColorScheme,
    Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const theme = {
        background: isDark ? "#07111A" : "#F5F7FB",
        card: isDark ? "#0E1726" : "#FFFFFF",
        cardAlt: isDark ? "#111C2B" : "#F8FAFC",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "#1E2A3A" : "#E2E8F0",
        accent: "#00B14F",
        accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
        blueSoft: isDark ? "rgba(59,130,246,0.14)" : "#EFF6FF",
        purpleSoft: isDark ? "rgba(139,92,246,0.14)" : "#F5F3FF",
    };

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
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.loadingText, { color: theme.muted }]}>Loading agent profile...</Text>
            </View>
        );
    }

    if (!agent) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.errorIconWrap, { backgroundColor: isDark ? "rgba(239,68,68,0.14)" : "#FEF2F2" }]}>
                    <Ionicons name="person-circle-outline" size={28} color="#EF4444" />
                </View>
                <Text style={[styles.errorTitle, { color: theme.text }]}>Agent not found</Text>
                <Text style={[styles.errorText, { color: theme.muted }]}>
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
    const feePercent = agent.commission_rate != null ? (Number(agent.commission_rate) * 100).toFixed(1) : null;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={isDark ? ["rgba(0,177,79,0.22)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.18)", "rgba(255,255,255,0)"]}
                style={styles.heroGradient}
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
                            style={[styles.headerBackButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleWrap}>
                            <Text style={[styles.headerKicker, { color: theme.text }]}>Agent Profile</Text>
                            <Animated.View style={{
                                opacity: subtitleOpacity,
                                maxHeight: subtitleMaxHeight,
                                overflow: "hidden"
                            }}>
                                <Text style={[styles.headerTitle, { color: theme.muted }]}>Review before you trade</Text>
                            </Animated.View>
                        </View>
                        <View style={styles.placeholder} />
                    </View>
                </SafeAreaView>
            </Animated.View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                {/* Spacer matching the header height */}
                <View style={{ height: headerMaxHeight }} />
                <LinearGradient
                    colors={isDark ? ["#0E1726", "#111E2E"] : ["#F7FFF9", "#FFFFFF"]}
                    style={[styles.summaryCard, { borderColor: theme.border }]}
                >
                    <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>Verified Agent</Text>
                    <Text style={[styles.summaryTitle, { color: theme.text }]}>Choose an agent with confidence</Text>
                    <Text style={[styles.summaryText, { color: theme.muted }]}>
                        Check capacity, response speed, payment channels, and recent feedback before you buy or sell tokens.
                    </Text>
                </LinearGradient>

                <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
                            <Text style={[styles.agentName, { color: theme.text }]}>{agent.full_name}</Text>
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
                                    <View style={[styles.activePill, { backgroundColor: theme.accentSoft, borderColor: theme.accent + "40" }]}>
                                        <Text style={[styles.activePillText, { color: theme.accent }]}>Active</Text>
                                    </View>
                                )}
                            </View>
                            {location ? (
                                <View style={styles.locationRow}>
                                    <Ionicons name="location-outline" size={14} color={theme.muted} />
                                    <Text style={[styles.locationText, { color: theme.muted }]}>{location}</Text>
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
                        <Text style={[styles.ratingText, { color: theme.text }]}>{agent.rating.toFixed(1)} rating</Text>
                    </View>
                </View>

                <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIconWrap, { backgroundColor: theme.accentSoft }]}>
                            <Ionicons name="wallet-outline" size={20} color={theme.accent} />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>${formatAmountOrCompact(agent.available_capacity)}</Text>
                        <Text style={[styles.statLabel, { color: theme.muted }]}>Capacity</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIconWrap, { backgroundColor: theme.blueSoft }]}>
                            <Ionicons name="time-outline" size={20} color="#3B82F6" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>~{agent.response_time_minutes} min</Text>
                        <Text style={[styles.statLabel, { color: theme.muted }]}>Response</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.statItem}>
                        <View style={[styles.statIconWrap, { backgroundColor: theme.purpleSoft }]}>
                            <Ionicons name="swap-horizontal" size={20} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.statValue, { color: theme.text }]}>{totalTransactions.toLocaleString()}</Text>
                        <Text style={[styles.statLabel, { color: theme.muted }]}>Transactions</Text>
                    </View>
                </View>

                <View style={styles.quickRow}>
                    {maxTradeDisplay != null && maxTradeDisplay > 0 ? (
                        <View style={[styles.highlightPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="card-outline" size={16} color={theme.muted} />
                            <Text style={[styles.highlightLabel, { color: theme.muted }]}>Max/trade</Text>
                            <Text style={[styles.highlightValue, { color: theme.text }]}>
                                {formatAmountOrCompact(maxTradeDisplay, maxTradeUnit)}
                            </Text>
                        </View>
                    ) : null}
                    {feePercent != null ? (
                        <View style={[styles.highlightPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="pricetag-outline" size={16} color={theme.muted} />
                            <Text style={[styles.highlightLabel, { color: theme.muted }]}>Fee</Text>
                            <Text style={[styles.highlightValue, { color: theme.text }]}>~{feePercent}%</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.actionsGrid}>
                    {agent.phone_number ? (
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => handleCall(agent.phone_number!)}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.actionIconWrap, { backgroundColor: theme.accentSoft }]}>
                                <Ionicons name="call-outline" size={18} color={theme.accent} />
                            </View>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>Call</Text>
                            <Text style={[styles.actionSubtitle, { color: theme.muted }]}>{formattedPhoneNumber || agent.phone_number}</Text>
                        </TouchableOpacity>
                    ) : null}

                    {agent.whatsapp_number ? (
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={() => handleWhatsApp(agent.whatsapp_number!)}
                            activeOpacity={0.85}
                        >
                            <View style={[styles.actionIconWrap, { backgroundColor: isDark ? "rgba(37,211,102,0.16)" : "#ECFDF5" }]}>
                                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                            </View>
                            <Text style={[styles.actionTitle, { color: theme.text }]}>WhatsApp</Text>
                            <Text style={[styles.actionSubtitle, { color: theme.muted }]}>{formattedWhatsAppNumber || agent.whatsapp_number}</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {(agent.phone_number || agent.whatsapp_number) && (
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact</Text>
                        {agent.phone_number ? (
                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                                onPress={() => handleCall(agent.phone_number!)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.contactLeft}>
                                    <View style={[styles.contactIconWrap, { backgroundColor: theme.accentSoft }]}>
                                        <Ionicons name="call-outline" size={18} color={theme.accent} />
                                    </View>
                                    <View>
                                        <Text style={[styles.contactLabel, { color: theme.muted }]}>Phone</Text>
                                        <Text style={[styles.contactText, { color: theme.text }]}>{formattedPhoneNumber || agent.phone_number}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.muted} />
                            </TouchableOpacity>
                        ) : null}
                        {agent.whatsapp_number ? (
                            <TouchableOpacity
                                style={[styles.contactButton, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                                onPress={() => handleWhatsApp(agent.whatsapp_number!)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.contactLeft}>
                                    <View style={[styles.contactIconWrap, { backgroundColor: isDark ? "rgba(37,211,102,0.14)" : "#ECFDF5" }]}>
                                        <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                                    </View>
                                    <View>
                                        <Text style={[styles.contactLabel, { color: theme.muted }]}>WhatsApp</Text>
                                        <Text style={[styles.contactText, { color: theme.text }]}>{formattedWhatsAppNumber || agent.whatsapp_number}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.muted} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}

                {agent.bank_name ? (
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Bank Details</Text>
                        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>Bank Name</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{agent.bank_name}</Text>
                        </View>
                        {agent.account_number ? (
                            <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                                <Text style={[styles.infoLabel, { color: theme.muted }]}>Account Number</Text>
                                <Text style={[styles.infoValue, { color: theme.text }]}>{agent.account_number}</Text>
                            </View>
                        ) : null}
                        {agent.account_name ? (
                            <View style={styles.infoRowLast}>
                                <Text style={[styles.infoLabel, { color: theme.muted }]}>Account Name</Text>
                                <Text style={[styles.infoValue, { color: theme.text }]}>{agent.account_name}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                {(agent.currency === "XOF" || agent.mobile_money_provider || agent.mobile_money_number) && (
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Mobile Money</Text>
                        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>Provider</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{agent.mobile_money_provider || "—"}</Text>
                        </View>
                        {agent.mobile_money_number ? (
                            <View style={styles.infoRowLast}>
                                <Text style={[styles.infoLabel, { color: theme.muted }]}>Phone Number</Text>
                                <Text style={[styles.infoValue, { color: theme.text }]}>{agent.mobile_money_number}</Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {reviews.length > 0 && (
                    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Reviews</Text>
                        {reviews.map((review, index) => (
                            <View
                                key={review.id}
                                style={[
                                    styles.reviewCard,
                                    { borderBottomColor: theme.border },
                                    index === reviews.length - 1 && styles.reviewCardLast,
                                ]}
                            >
                                <View style={styles.reviewHeader}>
                                    <Text style={[styles.reviewerName, { color: theme.text }]}>{review.user.full_name}</Text>
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
                                    <Text style={[styles.reviewText, { color: theme.muted }]}>{review.review_text}</Text>
                                ) : null}
                                <Text style={[styles.reviewDate, { color: theme.muted }]}>{formatDate(review.created_at)}</Text>
                            </View>
                        ))}
                    </View>
                )}
                <View style={styles.actionBar}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.sellButton, { backgroundColor: isDark ? "rgba(245,158,11,0.14)" : "#FEF3C7", borderColor: "#F59E0B" }]}
                        onPress={handleSellTokens}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="arrow-down-circle-outline" size={20} color="#F59E0B" />
                        <Text style={[styles.sellButtonText, { color: "#F59E0B" }]}>Sell Tokens</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.buyButton, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
                        onPress={handleBuyTokens}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="arrow-up-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.buyButtonText}>Buy Tokens</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    errorIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: "center",
        lineHeight: 20,
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
        borderBottomWidth: 1,
    },
    heroBlock: {
        marginBottom: 10,
    },
    heroGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 210,
    },
    headerContent: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 8,
    },
    headerBackButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitleWrap: {
        flex: 1,
        paddingTop: 2,
    },
    headerKicker: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.4,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: "500",
        lineHeight: 20,
        marginTop: 4,
    },
    placeholder: {
        width: 42,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 48,
    },
    summaryCard: {
        borderRadius: 24,
        padding: 18,
        marginTop: -24,
        marginBottom: 14,
        borderWidth: 1,
    },
    summaryEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginBottom: 6,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    summaryText: {
        fontSize: 13,
        lineHeight: 20,
        fontWeight: "500",
        marginTop: 6,
    },
    profileCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 14,
        borderWidth: 1,
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
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
    },
    activePillText: {
        fontSize: 11,
        fontWeight: "800",
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
        fontWeight: "500",
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    stars: {
        flexDirection: "row",
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: "700",
    },
    statsCard: {
        borderRadius: 24,
        padding: 18,
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 14,
        borderWidth: 1,
    },
    statItem: {
        alignItems: "center",
        flex: 1,
    },
    statIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    statDivider: {
        width: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: "800",
        marginTop: 8,
        textAlign: "center",
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: "500",
        textAlign: "center",
    },
    quickRow: {
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 14,
    },
    highlightPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 999,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
    },
    highlightLabel: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    highlightValue: {
        fontSize: 13,
        fontWeight: "700",
    },
    actionsGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 14,
    },
    actionCard: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 20,
        padding: 14,
    },
    actionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
        fontWeight: "500",
        lineHeight: 18,
    },
    sectionCard: {
        borderRadius: 24,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 14,
    },
    contactButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
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
        alignItems: "center",
        justifyContent: "center",
    },
    contactLabel: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 4,
    },
    contactText: {
        fontSize: 15,
        fontWeight: "700",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
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
        fontWeight: "500",
    },
    infoValue: {
        flex: 1,
        textAlign: "right",
        fontSize: 14,
        fontWeight: "700",
    },
    reviewCard: {
        paddingVertical: 14,
        borderBottomWidth: 1,
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
    },
    reviewStars: {
        flexDirection: "row",
        gap: 2,
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    reviewDate: {
        fontSize: 12,
        fontWeight: "500",
    },
    actionBar: {
        flexDirection: "row",
        paddingTop: 16,
        paddingBottom: 16,
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
        borderWidth: 1,
    },
    sellButtonText: {
        fontSize: 16,
        fontWeight: "700",
    },
    buyButton: {
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
