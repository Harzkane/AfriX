import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AgentKycModal() {
    const router = useRouter();

    const documents = [
        {
            icon: "card-outline",
            title: "Government-Issued ID",
            description: "Passport, driver's license, or national ID card",
            required: true,
        },
        {
            icon: "camera-outline",
            title: "Selfie with ID",
            description: "Clear photo of you holding your ID document",
            required: true,
        },
        {
            icon: "document-text-outline",
            title: "Proof of Address",
            description: "Utility bill or bank statement (less than 3 months old)",
            required: true,
        },
        {
            icon: "business-outline",
            title: "Business Registration",
            description: "Optional: If you operate as a business",
            required: false,
        },
    ];

    const tips = [
        "Ensure all documents are clear and readable",
        "Photos should be well-lit with no glare",
        "All four corners of documents should be visible",
        "Selfie should clearly show your face and ID",
        "Documents must be valid and not expired",
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>KYC Verification</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, styles.progressDotComplete]}>
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.progressLabel}>Register</Text>
                    </View>
                    <View style={[styles.progressLine, styles.progressLineActive]} />
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, styles.progressDotActive]}>
                            <Text style={styles.progressNumber}>2</Text>
                        </View>
                        <Text style={styles.progressLabel}>KYC</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressStep}>
                        <View style={styles.progressDot}>
                            <Text style={styles.progressNumber}>3</Text>
                        </View>
                        <Text style={styles.progressLabel}>Deposit</Text>
                    </View>
                </View>

                {/* Introduction */}
                <View style={styles.introSection}>
                    <Text style={styles.introTitle}>Verify Your Identity</Text>
                    <Text style={styles.introDescription}>
                        To become an agent, we need to verify your identity. This helps keep the
                        platform safe for everyone.
                    </Text>
                </View>

                {/* Required Documents */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Required Documents</Text>
                    {documents.map((doc, index) => (
                        <View key={index} style={styles.documentCard}>
                            <View style={styles.documentIcon}>
                                <Ionicons name={doc.icon as any} size={24} color="#00B14F" />
                            </View>
                            <View style={styles.documentText}>
                                <View style={styles.documentHeader}>
                                    <Text style={styles.documentTitle}>{doc.title}</Text>
                                    {doc.required && (
                                        <View style={styles.requiredBadge}>
                                            <Text style={styles.requiredText}>Required</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.documentDescription}>{doc.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Tips */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📸 Photo Tips</Text>
                    <View style={styles.tipsCard}>
                        {tips.map((tip, index) => (
                            <View key={index} style={styles.tipItem}>
                                <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="shield-checkmark" size={20} color="#00B14F" />
                    <Text style={styles.infoText}>
                        Your documents are encrypted and stored securely. We never share your
                        information with third parties.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => router.push("/modals/agent-kyc/personal-info")}
                >
                    <Text style={styles.startButtonText}>Start KYC Verification</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
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
    content: {
        padding: 20,
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
    },
    progressStep: {
        alignItems: "center",
    },
    progressDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    progressDotActive: {
        backgroundColor: "#00B14F",
    },
    progressDotComplete: {
        backgroundColor: "#00B14F",
    },
    progressNumber: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    progressLabel: {
        fontSize: 12,
        color: "#6B7280",
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: "#F3F4F6",
        marginHorizontal: 8,
        marginBottom: 28,
    },
    progressLineActive: {
        backgroundColor: "#00B14F",
    },
    introSection: {
        marginBottom: 32,
        alignItems: "center",
    },
    introTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    introDescription: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 24,
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
    documentCard: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        marginBottom: 12,
    },
    documentIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#F0FDF4",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    documentText: {
        flex: 1,
    },
    documentHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    documentTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
    },
    requiredBadge: {
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    requiredText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#DC2626",
    },
    documentDescription: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
    },
    tipsCard: {
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        padding: 16,
    },
    tipItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    tipText: {
        fontSize: 14,
        color: "#374151",
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
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
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    startButton: {
        flexDirection: "row",
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    startButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
