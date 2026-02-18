import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useEffect } from "react";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { AgentStatus } from "@/stores/types/agent.types";

export default function BecomeAgentModal() {
    const router = useRouter();
    const { agentStatus, kycStatus, checkKycStatus, fetchAgentStats } = useAgentStore();

    useEffect(() => {
        // Fetch latest status when screen opens
        const checkStatus = async () => {
            try {
                await checkKycStatus();
                await fetchAgentStats();

                // If already applied, redirect to status screen immediately
                // We use a small timeout to allow the store to update and avoid flicker
                if (agentStatus === AgentStatus.PENDING || agentStatus === AgentStatus.UNDER_REVIEW) {
                    router.replace("/modals/agent-kyc/status");
                } else if (agentStatus === AgentStatus.APPROVED) {
                    router.replace("/modals/agent-deposit");
                }
            } catch (error) {
                console.log("Status check failed:", error);
            }
        };

        checkStatus();
    }, [agentStatus]);

    const benefits = [
        {
            icon: "cash-outline",
            title: "Earn Transaction Fees",
            description: "Keep 0.5% of every transaction you facilitate",
        },
        {
            icon: "trending-up-outline",
            title: "Volume Bonuses",
            description: "Earn up to 0.3% extra for high transaction volumes",
        },
        {
            icon: "people-outline",
            title: "Build Your Network",
            description: "Connect with users and grow your customer base",
        },
        {
            icon: "shield-checkmark-outline",
            title: "Secure Platform",
            description: "Protected by smart contracts and escrow system",
        },
    ];

    const requirements = [
        { text: "Minimum $100 USDT security deposit", met: false },
        { text: "Valid government-issued ID", met: false },
        { text: "Proof of address (utility bill or bank statement)", met: false },
        { text: "Bank account or mobile money account", met: false },
        { text: "Complete KYC verification", met: false },
    ];

    const renderFooter = () => {
        if (agentStatus === AgentStatus.PENDING || agentStatus === AgentStatus.UNDER_REVIEW) {
            return (
                <View style={styles.footer}>
                    <View style={styles.statusContainer}>
                        <Ionicons name="time" size={24} color="#F59E0B" />
                        <Text style={styles.statusText}>Application Under Review</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push("/modals/agent-kyc/status")}
                    >
                        <Text style={styles.primaryButtonText}>Check Status</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (agentStatus === AgentStatus.APPROVED) {
            return (
                <View style={styles.footer}>
                    <View style={styles.statusContainer}>
                        <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                        <Text style={[styles.statusText, { color: "#00B14F" }]}>Application Approved!</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push("/modals/agent-deposit")}
                    >
                        <Text style={styles.primaryButtonText}>Complete Setup</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                        router.push("/modals/agent-learn-more");
                    }}
                >
                    <Text style={styles.secondaryButtonText}>Learn More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push("/modals/agent-registration")}
                >
                    <Text style={styles.primaryButtonText}>Start Application</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Become an Agent</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroIcon}>
                        <Ionicons name="briefcase" size={48} color="#00B14F" />
                    </View>
                    <Text style={styles.heroTitle}>Join the AfriToken Agent Network</Text>
                    <Text style={styles.heroSubtitle}>
                        Facilitate token exchanges and earn fees while helping users access digital currency
                    </Text>
                </View>

                {/* Benefits */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why Become an Agent?</Text>
                    {benefits.map((benefit, index) => (
                        <View key={index} style={styles.benefitCard}>
                            <View style={styles.benefitIcon}>
                                <Ionicons name={benefit.icon as any} size={24} color="#00B14F" />
                            </View>
                            <View style={styles.benefitText}>
                                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                                <Text style={styles.benefitDescription}>{benefit.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Requirements */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Requirements</Text>
                    <View style={styles.requirementsCard}>
                        {requirements.map((req, index) => (
                            <View key={index} style={styles.requirementItem}>
                                <Ionicons
                                    name={req.met ? "checkmark-circle" : "ellipse-outline"}
                                    size={20}
                                    color={req.met ? "#00B14F" : "#9CA3AF"}
                                />
                                <Text style={styles.requirementText}>{req.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Earnings Example */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Potential Earnings</Text>
                    <View style={styles.earningsCard}>
                        <View style={styles.earningRow}>
                            <Text style={styles.earningLabel}>Conservative (50 tx/month)</Text>
                            <Text style={styles.earningAmount}>₦1,250/month</Text>
                        </View>
                        <View style={styles.earningRow}>
                            <Text style={styles.earningLabel}>Moderate (200 tx/month)</Text>
                            <Text style={styles.earningAmount}>₦9,600/month</Text>
                        </View>
                        <View style={styles.earningRow}>
                            <Text style={styles.earningLabel}>Active (1000 tx/month)</Text>
                            <Text style={styles.earningAmount}>₦80,000/month</Text>
                        </View>
                    </View>
                </View>

                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={20} color="#00B14F" />
                    <Text style={styles.infoText}>
                        Application review typically takes 1-3 business days
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            {renderFooter()}
        </SafeAreaView>
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
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    content: {
        padding: 20,
    },
    heroSection: {
        alignItems: "center",
        marginBottom: 32,
    },
    heroIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#F0FDF4",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 16,
    },
    benefitCard: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        marginBottom: 12,
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#F0FDF4",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    benefitText: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    benefitDescription: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
    },
    requirementsCard: {
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        padding: 16,
    },
    requirementItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    requirementText: {
        fontSize: 14,
        color: "#374151",
        marginLeft: 12,
        flex: 1,
    },
    earningsCard: {
        backgroundColor: "#F0FDF4",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#00B14F",
    },
    earningRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    earningLabel: {
        fontSize: 14,
        color: "#374151",
    },
    earningAmount: {
        fontSize: 16,
        fontWeight: "700",
        color: "#00B14F",
    },
    infoBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#00B14F",
    },
    infoText: {
        fontSize: 14,
        color: "#065F46",
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        flexDirection: "row",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#F3F4F6",
    },
    secondaryButtonText: {
        color: "#374151",
        fontSize: 16,
        fontWeight: "600",
    },
    primaryButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#00B14F",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    statusContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#F59E0B",
    },
});
