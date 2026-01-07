import { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
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
                        <Text style={styles.title}>Agent Profile</Text>
                        <TouchableOpacity
                            style={styles.switchButton}
                            onPress={() => router.replace("/(tabs)")}
                        >
                            <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.switchText}>User View</Text>
                        </TouchableOpacity>
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
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
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
                        <View style={[styles.badge, { backgroundColor: getTierColor(dashboardData?.agent?.tier) + '20' }]}>
                            <Ionicons name="trophy" size={14} color={getTierColor(dashboardData?.agent?.tier)} />
                            <Text style={[styles.badgeText, { color: getTierColor(dashboardData?.agent?.tier) }]}>
                                {dashboardData?.agent?.tier || "Bronze"}
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(dashboardData?.agent?.status) + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(dashboardData?.agent?.status) }]} />
                            <Text style={[styles.badgeText, { color: getStatusColor(dashboardData?.agent?.status) }]}>
                                {dashboardData?.agent?.status || "Pending"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Full Name</Text>
                                <Text style={styles.infoValue}>{user?.full_name || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{user?.email || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Phone Number</Text>
                                <Text style={styles.infoValue}>{user?.phone_number || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="logo-whatsapp" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>WhatsApp</Text>
                                <Text style={styles.infoValue}>{(user as any)?.whatsapp_number || user?.phone_number || "N/A"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Country</Text>
                                <Text style={styles.infoValue}>{user?.country_code || "N/A"}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Business Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Business Details</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Ionicons name="business-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Bank Name</Text>
                                <Text style={styles.infoValue}>{(user as any)?.bank_name || "Not set"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="card-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Account Number</Text>
                                <Text style={styles.infoValue}>{(user as any)?.account_number || "Not set"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Account Name</Text>
                                <Text style={styles.infoValue}>{(user as any)?.account_name || "Not set"}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="wallet-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Withdrawal Address</Text>
                                <Text style={[styles.infoValue, styles.addressText]} numberOfLines={1}>
                                    {(user as any)?.withdrawal_address || "Not set"}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Verification Status</Text>
                                <View style={styles.verificationBadge}>
                                    <Text style={styles.verificationText}>
                                        {(user as any)?.is_verified ? "Verified" : "Not Verified"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Financial Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Summary</Text>
                    <View style={styles.card}>
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
                    </View>
                </View>

                {/* Performance Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance Metrics</Text>
                    <View style={styles.card}>
                        <View style={styles.performanceGrid}>
                            <View style={styles.performanceItem}>
                                <View style={[styles.performanceIcon, { backgroundColor: "#F3E8FF" }]}>
                                    <Ionicons name="swap-horizontal" size={24} color="#7C3AED" />
                                </View>
                                <Text style={styles.performanceLabel}>Total Transactions</Text>
                                <Text style={styles.performanceValue}>
                                    {dashboardData?.performance?.total_transactions || "0"}
                                </Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={[styles.performanceIcon, { backgroundColor: "#FEF3C7" }]}>
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
                                <View style={[styles.performanceIcon, { backgroundColor: "#ECFDF5" }]}>
                                    <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                                </View>
                                <Text style={styles.performanceLabel}>Success Rate</Text>
                                <Text style={styles.performanceValue}>
                                    {dashboardData?.performance?.success_rate || "100%"}
                                </Text>
                            </View>
                            <View style={styles.performanceItem}>
                                <View style={[styles.performanceIcon, { backgroundColor: "#DBEAFE" }]}>
                                    <Ionicons name="time" size={24} color="#3B82F6" />
                                </View>
                                <Text style={styles.performanceLabel}>Avg Response</Text>
                                <Text style={styles.performanceValue}>
                                    {dashboardData?.performance?.response_time || "5"} min
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Reviews Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/agent/reviews")}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="star-outline" size={20} color="#F59E0B" />
                                <Text style={styles.settingText}>
                                    View Reviews ({stats?.total_reviews || 0})
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Settings</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/modals/agent/edit-profile")}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="create-outline" size={20} color="#7C3AED" />
                                <Text style={styles.settingText}>Edit Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/modals/agent/edit-bank-details")}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="card-outline" size={20} color="#7C3AED" />
                                <Text style={styles.settingText}>Update Bank Details</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/modals/agent/withdrawal-request")}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="cash-outline" size={20} color="#7C3AED" />
                                <Text style={styles.settingText}>Request Withdrawal</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => router.push("/modals/agent-kyc/status")}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
                                <Text style={styles.settingText}>View KYC Status</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={() => {
                                useAuthStore.getState().logout();
                                router.replace("/(auth)/login");
                            }}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                <Text style={[styles.settingText, { color: "#EF4444" }]}>Logout</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    headerWrapper: {
        // marginBottom: 20,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 140,
        // borderBottomLeftRadius: 30,
        // borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 20,
        marginTop: 0,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#FFFFFF",
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
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    content: {
        padding: 16,
    },
    profileCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F3E8FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 8,
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
        fontWeight: "600",
        color: "#6B7280",
    },
    badges: {
        flexDirection: "row",
        gap: 12,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "capitalize",
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
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 12,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 8,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    addressText: {
        fontFamily: "monospace",
        fontSize: 12,
    },
    verificationBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#ECFDF5",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    verificationText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#00B14F",
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 8,
    },
    financialGrid: {
        flexDirection: "row",
        gap: 16,
        paddingVertical: 8,
    },
    financialItem: {
        flex: 1,
    },
    financialLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 8,
    },
    financialValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
    },
    performanceGrid: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 16,
    },
    performanceItem: {
        flex: 1,
        alignItems: "center",
    },
    performanceIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    performanceLabel: {
        fontSize: 12,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 8,
    },
    performanceValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#111827",
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    settingText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
});
