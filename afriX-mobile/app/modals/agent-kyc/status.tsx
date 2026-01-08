import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatDate } from "@/utils/format";

type KycStatus = "not_submitted" | "under_review" | "approved" | "rejected";

export default function KycStatusScreen() {
    const router = useRouter();
    const { checkKycStatus } = useAgentStore();
    const [status, setStatus] = useState<KycStatus>("not_submitted");
    const [loading, setLoading] = useState(true);
    const [rejectionReason, setRejectionReason] = useState("");
    const [submittedAt, setSubmittedAt] = useState(new Date());

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const data = await checkKycStatus();
                if (data) {
                    setStatus(data.status as KycStatus);
                    if (data.rejection_reason) setRejectionReason(data.rejection_reason);
                    if (data.submitted_at) setSubmittedAt(new Date(data.submitted_at));
                } else {
                    // If null, it means not submitted or not agent
                    setStatus("not_submitted");
                }
            } catch (error) {
                console.error("Failed to fetch KYC status:", error);
                setStatus("not_submitted");
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, []);

    const getStatusConfig = () => {
        switch (status) {
            case "under_review":
                return {
                    icon: "time-outline",
                    iconColor: "#F59E0B",
                    iconBg: "#FEF3C7",
                    title: "Under Review",
                    description: "Our team is reviewing your documents. This usually takes 1-3 business days.",
                    showTimeline: true,
                };
            case "approved":
                return {
                    icon: "checkmark-circle",
                    iconColor: "#00B14F",
                    iconBg: "#F0FDF4",
                    title: "KYC Approved!",
                    description: "Your identity has been verified. You can now make your security deposit to activate your agent account.",
                    showTimeline: false,
                };
            case "rejected":
                return {
                    icon: "close-circle",
                    iconColor: "#EF4444",
                    iconBg: "#FEE2E2",
                    title: "KYC Rejected",
                    description: rejectionReason || "Your documents did not meet our requirements. Please review and resubmit.",
                    showTimeline: false,
                };
            default:
                return {
                    icon: "document-text-outline",
                    iconColor: "#6B7280",
                    iconBg: "#F3F4F6",
                    title: "Not Submitted",
                    description: "Please submit your KYC documents to continue.",
                    showTimeline: false,
                };
        }
    };

    const config = getStatusConfig();

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00B14F" />
                    <Text style={styles.loadingText}>Checking status...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>KYC Status</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={[styles.statusIcon, { backgroundColor: config.iconBg }]}>
                        <Ionicons name={config.icon as any} size={48} color={config.iconColor} />
                    </View>
                    <Text style={styles.statusTitle}>{config.title}</Text>
                    <Text style={styles.statusDescription}>{config.description}</Text>
                    {status !== "not_submitted" && (
                        <Text style={styles.submittedDate}>
                            Submitted on {formatDate(submittedAt)}
                        </Text>
                    )}
                </View>

                {/* Timeline */}
                {config.showTimeline && (
                    <View style={styles.timeline}>
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.timelineDotComplete]} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Documents Submitted</Text>
                                <Text style={styles.timelineDesc}>Your KYC documents have been received</Text>
                            </View>
                        </View>

                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.timelineDotActive]} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Under Review</Text>
                                <Text style={styles.timelineDesc}>Our team is verifying your identity</Text>
                            </View>
                        </View>

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Approval Decision</Text>
                                <Text style={styles.timelineDesc}>You'll be notified once reviewed</Text>
                            </View>
                        </View>

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Make Deposit</Text>
                                <Text style={styles.timelineDesc}>Activate your agent account</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Info Banner */}
                {status === "under_review" && (
                    <View style={styles.infoBanner}>
                        <Ionicons name="notifications-outline" size={20} color="#00B14F" />
                        <Text style={styles.infoText}>
                            We'll send you a notification once your KYC is reviewed. You can also check back here anytime.
                        </Text>
                    </View>
                )}

                {/* Rejection Reason */}
                {status === "rejected" && rejectionReason && (
                    <View style={styles.rejectionCard}>
                        <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                        <Text style={styles.rejectionText}>{rejectionReason}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                {status === "not_submitted" && (
                    <TouchableOpacity
                        style={styles.depositButton}
                        onPress={() => router.push("/modals/agent-kyc/personal-info")}
                    >
                        <Text style={styles.depositButtonText}>Start Verification</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {status === "approved" && (
                    <TouchableOpacity
                        style={styles.depositButton}
                        onPress={() => router.push("/modals/agent-deposit")}
                    >
                        <Text style={styles.depositButtonText}>Make Security Deposit</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {status === "rejected" && (
                    <TouchableOpacity
                        style={styles.resubmitButton}
                        onPress={() => router.push("/modals/agent-kyc/personal-info")}
                    >
                        <Text style={styles.resubmitButtonText}>Resubmit Documents</Text>
                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {status === "under_review" ? (
                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => router.push("/(tabs)")}
                    >
                        <Text style={styles.homeButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.homeButton, { marginTop: 12 }]}
                        onPress={() => router.push("/(tabs)")}
                    >
                        <Text style={styles.homeButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                )}
            </View>
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
    backButton: {
        padding: 4,
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
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#6B7280",
    },
    content: {
        padding: 20,
    },
    statusCard: {
        alignItems: "center",
        marginBottom: 32,
        marginTop: 20,
    },
    statusIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    statusDescription: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 24,
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    submittedDate: {
        fontSize: 14,
        color: "#9CA3AF",
    },
    timeline: {
        marginBottom: 24,
    },
    timelineItem: {
        flexDirection: "row",
        marginBottom: 24,
    },
    timelineDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#E5E7EB",
        marginRight: 16,
        marginTop: 4,
    },
    timelineDotComplete: {
        backgroundColor: "#00B14F",
    },
    timelineDotActive: {
        backgroundColor: "#F59E0B",
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    timelineDesc: {
        fontSize: 14,
        color: "#6B7280",
    },
    infoBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
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
    rejectionCard: {
        backgroundColor: "#FEF2F2",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FEE2E2",
    },
    rejectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#DC2626",
        marginBottom: 8,
    },
    rejectionText: {
        fontSize: 14,
        color: "#991B1B",
        lineHeight: 20,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    depositButton: {
        flexDirection: "row",
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    depositButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    resubmitButton: {
        flexDirection: "row",
        backgroundColor: "#EF4444",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    resubmitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    homeButton: {
        backgroundColor: "#F3F4F6",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    homeButtonText: {
        color: "#374151",
        fontSize: 16,
        fontWeight: "600",
    },
});
