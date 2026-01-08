import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { Surface } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";

export default function AgentProfile() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { stats, dashboardData, fetchAgentStats, fetchDashboard, loading } = useAgentStore();

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        await Promise.all([fetchAgentStats(), fetchDashboard()]);
    };

    const getTierColor = (tier: string) => {
        switch (tier?.toLowerCase()) {
            case 'platinum': return '#E5E4E2';
            case 'gold': return '#FFD700';
            case 'silver': return '#C0C0C0';
            case 'bronze': return '#CD7F32';
            default: return '#9CA3AF';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return '#00B14F';
            case 'pending': return '#F59E0B';
            case 'suspended': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= rating ? "star" : "star-outline"}
                    size={16}
                    color="#F59E0B"
                />
            );
        }
        return stars;
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <Text style={styles.title}>Agent Profile</Text>
                            <TouchableOpacity
                                style={styles.switchButton}
                                onPress={() => router.replace("/(tabs)")}
                            >
                                <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
                                <Text style={styles.switchText}>Switch to User</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#FFFFFF" />
                }
            >

                {/* Profile Header Card */}
                <Surface style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: "#F5F3FF" }]}>
                            <Ionicons name="person" size={40} color="#7C3AED" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user?.full_name || "Agent"}</Text>
                            <View style={styles.ratingContainer}>
                                <View style={styles.stars}>
                                    {renderStars(Math.round(parseFloat(dashboardData?.agent?.rating || "5")))}
                                </View>
                                <Text style={styles.ratingText}>
                                    {dashboardData?.agent?.rating || "5.0"}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.badges}>
                        <View style={[styles.badge, { backgroundColor: getTierColor(dashboardData?.agent?.tier) + '15' }]}>
                            <Ionicons name="trophy" size={14} color={getTierColor(dashboardData?.agent?.tier)} />
                            <Text style={[styles.badgeText, { color: getTierColor(dashboardData?.agent?.tier) }]}>
                                {dashboardData?.agent?.tier || "Bronze"}
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(dashboardData?.agent?.status) + '15' }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(dashboardData?.agent?.status) }]} />
                            <Text style={[styles.badgeText, { color: getStatusColor(dashboardData?.agent?.status) }]}>
                                {dashboardData?.agent?.status || "Pending"}
                            </Text>
                        </View>
                    </View>
                </Surface>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <Surface style={styles.card}>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F3F4F6" }]}>
                                <Ionicons name="person-outline" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Full Name</Text>
                                <Text style={styles.infoValue}>{user?.full_name || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F3F4F6" }]}>
                                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F3F4F6" }]}>
                                <Ionicons name="call-outline" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Phone Number</Text>
                                <Text style={styles.infoValue}>{user?.phone_number || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F3F4F6" }]}>
                                <Ionicons name="logo-whatsapp" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>WhatsApp</Text>
                                <Text style={styles.infoValue}>{(user as any)?.whatsapp_number || user?.phone_number || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F3F4F6" }]}>
                                <Ionicons name="location-outline" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Country</Text>
                                <Text style={styles.infoValue}>{user?.country_code || "N/A"}</Text>
                            </View>
                        </View>
                    </Surface>
                </View>

                {/* Business Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Business Details</Text>
                    <Surface style={styles.card}>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#FDF2F8" }]}>
                                <Ionicons name="business-outline" size={20} color="#DB2777" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Bank Name</Text>
                                <Text style={styles.infoValue}>{(user as any)?.bank_name || "Not set"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F3F4F6" }]}>
                                <Ionicons name="card-outline" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Account Number</Text>
                                <Text style={styles.infoValue}>{(user as any)?.account_number || "Not set"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F3F4F6" }]}>
                                <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Account Name</Text>
                                <Text style={styles.infoValue}>{(user as any)?.account_name || "Not set"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F5F3FF" }]}>
                                <Ionicons name="wallet-outline" size={20} color="#7C3AED" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Withdrawal Address</Text>
                                <Text style={[styles.infoValue, styles.addressText]} numberOfLines={1}>
                                    {(user as any)?.withdrawal_address || "Not set"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: "#F0FDF4" }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#00B14F" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Verification Status</Text>
                                <View style={styles.verificationBadge}>
                                    <Text style={styles.verificationText}>
                                        {(user as any)?.is_verified ? "Verified" : "Not Verified"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Surface>
                </View>

                {/* Financial Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Summary</Text>
                    <Surface style={styles.card}>
                        <View style={styles.financialGrid}>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>Total Deposit</Text>
                                <Text style={styles.financialValue}>
                                    ${dashboardData?.financials?.total_deposit?.toLocaleString() || "0.00"}
                                </Text>
                            </View>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>Available Capacity</Text>
                                <Text style={[styles.financialValue, { color: "#7C3AED" }]}>
                                    ${dashboardData?.financials?.available_capacity?.toLocaleString() || "0.00"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.financialGrid}>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>Total Earnings</Text>
                                <Text style={[styles.financialValue, { color: "#00B14F" }]}>
                                    ${dashboardData?.financials?.total_earnings?.toLocaleString() || "0.00"}
                                </Text>
                            </View>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>Outstanding Tokens</Text>
                                <Text style={styles.financialValue}>
                                    {dashboardData?.financials?.outstanding_tokens?.toLocaleString() || "0"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.financialGrid}>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>Max Withdrawable</Text>
                                <Text style={styles.financialValue}>
                                    ${dashboardData?.financials?.max_withdrawable?.toLocaleString() || "0.00"}
                                </Text>
                            </View>
                            <View style={styles.financialItem}>
                                <Text style={styles.financialLabel}>Utilization Rate</Text>
                                <Text style={styles.financialValue}>
                                    {dashboardData?.financials?.utilization_rate || "0%"}
                                </Text>
                            </View>
                        </View>
                    </Surface>
                </View>

                {/* Performance Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Metrics</Text>
                    <Surface style={styles.card}>
                        <View style={styles.performanceGrid}>
                            <View style={styles.performanceItem}>
                                <View style={[styles.performanceIcon, { backgroundColor: "#F5F3FF" }]}>
                                    <Ionicons name="swap-horizontal" size={24} color="#7C3AED" />
                                </View>
                                <Text style={styles.performanceLabel}>Total Transactions</Text>
                                <Text style={styles.performanceValue}>
                                    {dashboardData?.performance?.total_transactions || "0"}
                                </Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={[styles.performanceIcon, { backgroundColor: "#FFFBEB" }]}>
                                    <Ionicons name="chatbubbles" size={24} color="#F59E0B" />
                                </View>
                                <Text style={styles.performanceLabel}>Total Reviews</Text>
                                <Text style={styles.performanceValue}>
                                    {dashboardData?.performance?.total_reviews || "0"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.performanceGrid}>
                            <View style={styles.performanceItem}>
                                <View style={[styles.performanceIcon, { backgroundColor: "#F0FDF4" }]}>
                                    <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                                </View>
                                <Text style={styles.performanceLabel}>Success Rate</Text>
                                <Text style={styles.performanceValue}>
                                    {dashboardData?.performance?.success_rate || "100%"}
                                </Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={[styles.performanceIcon, { backgroundColor: "#EFF6FF" }]}>
                                    <Ionicons name="time" size={24} color="#3B82F6" />
                                </View>
                                <Text style={styles.performanceLabel}>Avg Response</Text>
                                <Text style={styles.performanceValue}>
                                    {dashboardData?.performance?.response_time || "5"} min
                                </Text>
                            </View>
                        </View>
                    </Surface>
                </View>

                {/* Reviews Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    <Surface style={styles.card}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/agent/reviews")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: "#FFFBEB" }]}>
                                    <Ionicons name="star" size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.settingText}>
                                    View Reviews ({stats?.total_reviews || 0})
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </Surface>
                </View>

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    <Surface style={styles.card}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/modals/agent/edit-profile")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: "#F5F3FF" }]}>
                                    <Ionicons name="create-outline" size={20} color="#7C3AED" />
                                </View>
                                <Text style={styles.settingText}>Edit Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/modals/agent/edit-bank-details")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: "#FDF2F8" }]}>
                                    <Ionicons name="card-outline" size={20} color="#DB2777" />
                                </View>
                                <Text style={styles.settingText}>Update Bank Details</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/modals/agent/withdrawal-request")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: "#F0FDF4" }]}>
                                    <Ionicons name="cash-outline" size={20} color="#00B14F" />
                                </View>
                                <Text style={styles.settingText}>Request Withdrawal</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/modals/agent-kyc/status")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: "#EFF6FF" }]}>
                                    <Ionicons name="shield-checkmark-outline" size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.settingText}>View KYC Status</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => {
                                useAuthStore.getState().logout();
                                router.replace("/(auth)/login");
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: "#FEF2F2" }]}>
                                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                </View>
                                <Text style={[styles.settingText, { color: "#EF4444" }]}>Logout</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </Surface>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
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
        height: 140,
    },
    headerContent: {
        paddingHorizontal: 16,
    },
    header: {
        paddingBottom: 20,
        marginTop: 10,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },
    switchButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    switchText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    content: {
        padding: 16,
        paddingBottom: 100,
        paddingTop: 40,
    },
    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    avatarContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 6,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stars: {
        flexDirection: "row",
        gap: 2,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#F59E0B",
    },
    badges: {
        flexDirection: "row",
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#6B7280",
        marginBottom: 12,
        marginLeft: 4,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: "#9CA3AF",
        marginBottom: 2,
        fontWeight: "500",
    },
    infoValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    addressText: {
        fontSize: 13,
        color: "#6B7280",
    },
    verificationBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    verificationText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#00B14F",
    },
    divider: {
        height: 1,
        backgroundColor: "#F9FAFB",
        marginLeft: 52,
    },
    financialGrid: {
        flexDirection: "row",
        gap: 16,
        paddingVertical: 12,
    },
    financialItem: {
        flex: 1,
    },
    financialLabel: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 6,
        fontWeight: "500",
    },
    financialValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
    },
    performanceGrid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    performanceItem: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    performanceIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    performanceLabel: {
        fontSize: 11,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 4,
        fontWeight: "600",
        paddingHorizontal: 8,
    },
    performanceValue: {
        fontSize: 16,
        fontWeight: "800",
        color: "#111827",
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    settingText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    bottomSpacer: {
        height: 40,
    },
});
