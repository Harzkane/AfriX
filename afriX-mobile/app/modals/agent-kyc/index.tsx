import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function AgentKycModal() {
    const router = useRouter();
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
        blue: "#3B82F6",
        blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
        danger: "#EF4444",
        dangerSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    };

    const documents = [
        {
            icon: "card",
            color: theme.blue,
            bg: theme.blueSoft,
            title: "Government-Issued ID",
            description: "Passport, driver's license, or national ID card",
            required: true,
        },
        {
            icon: "camera",
            color: theme.accent,
            bg: theme.accentSoft,
            title: "Selfie with ID",
            description: "Clear photo of you holding your ID document",
            required: true,
        },
        {
            icon: "document-text",
            color: "#8B5CF6",
            bg: isDark ? "rgba(139,92,246,0.12)" : "#F5F3FF",
            title: "Proof of Address",
            description: "Utility bill or bank statement (less than 3 months old)",
            required: true,
        },
        {
            icon: "business",
            color: "#F59E0B",
            bg: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
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

    const progressSteps = [
        { label: "Register", done: true, active: false },
        { label: "KYC", done: false, active: true },
        { label: "Deposit", done: false, active: false },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.navBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>KYC Verification</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Stepper */}
                <View style={[styles.stepperCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {progressSteps.map((step, i) => (
                        <React.Fragment key={i}>
                            <View style={styles.stepItem}>
                                {step.done ? (
                                    <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.stepDot}>
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    </LinearGradient>
                                ) : step.active ? (
                                    <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.stepDot}>
                                        <Text style={styles.stepNum}>{i + 1}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={[styles.stepDot, { backgroundColor: theme.border }]}>
                                        <Text style={[styles.stepNum, { color: theme.muted }]}>{i + 1}</Text>
                                    </View>
                                )}
                                <Text style={[styles.stepLabel, { color: step.done || step.active ? theme.accent : theme.muted }]}>
                                    {step.label}
                                </Text>
                            </View>
                            {i < progressSteps.length - 1 && (
                                <View style={[styles.stepLine, { backgroundColor: step.done ? theme.accent : theme.border }]} />
                            )}
                        </React.Fragment>
                    ))}
                </View>

                {/* Hero Banner */}
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroBanner}
                >
                    <View style={styles.heroIconCircle}>
                        <Ionicons name="shield-checkmark" size={26} color="#00B14F" />
                    </View>
                    <Text style={styles.heroEyebrow}>STEP 2 OF 3</Text>
                    <Text style={styles.heroTitle}>Verify Your Identity</Text>
                    <Text style={styles.heroSubtitle}>
                        To become an agent, we need to verify your identity. This helps keep the platform safe for everyone.
                    </Text>
                </LinearGradient>

                {/* Required Documents */}
                <Text style={[styles.sectionHeading, { color: theme.muted }]}>REQUIRED DOCUMENTS</Text>
                <View style={[styles.docsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {documents.map((doc, i) => (
                        <View key={i}>
                            <View style={styles.docRow}>
                                <View style={[styles.docIconBox, { backgroundColor: doc.bg }]}>
                                    <Ionicons name={doc.icon as any} size={20} color={doc.color} />
                                </View>
                                <View style={styles.docText}>
                                    <View style={styles.docTitleRow}>
                                        <Text style={[styles.docTitle, { color: theme.text }]}>{doc.title}</Text>
                                        {doc.required ? (
                                            <View style={[styles.requiredBadge, { backgroundColor: theme.dangerSoft }]}>
                                                <Text style={[styles.requiredText, { color: theme.danger }]}>Required</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.optionalBadge, { backgroundColor: theme.cardAlt }]}>
                                                <Text style={[styles.optionalText, { color: theme.muted }]}>Optional</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.docDesc, { color: theme.muted }]}>{doc.description}</Text>
                                </View>
                            </View>
                            {i < documents.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                        </View>
                    ))}
                </View>

                {/* Photo Tips */}
                <Text style={[styles.sectionHeading, { color: theme.muted }]}>📸 PHOTO TIPS</Text>
                <View style={[styles.tipsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {tips.map((tip, i) => (
                        <View key={i}>
                            <View style={styles.tipRow}>
                                <View style={[styles.tipIconBox, { backgroundColor: theme.accentSoft }]}>
                                    <Ionicons name="checkmark" size={13} color={theme.accent} />
                                </View>
                                <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
                            </View>
                            {i < tips.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                        </View>
                    ))}
                </View>

                {/* Security Info */}
                <View style={[styles.infoBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent + "30" }]}>
                    <Ionicons name="shield-checkmark" size={20} color={theme.accent} />
                    <Text style={[styles.infoBannerText, { color: theme.accent }]}>
                        Your documents are encrypted and stored securely. We never share your information with third parties.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.startBtn, { backgroundColor: theme.accent }]}
                    onPress={() => router.push("/modals/agent-kyc/personal-info")}
                    activeOpacity={0.85}
                >
                    <Text style={styles.startBtnText}>Start KYC Verification</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    navBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: { fontSize: 18, fontWeight: "800" },
    content: { padding: 16 },
    stepperCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginBottom: 16,
    },
    stepItem: { alignItems: "center", gap: 6 },
    stepDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNum: { color: "#FFF", fontSize: 14, fontWeight: "800" },
    stepLabel: { fontSize: 12, fontWeight: "700" },
    stepLine: {
        flex: 1,
        height: 2,
        marginHorizontal: 6,
        marginBottom: 22,
    },
    heroBanner: {
        borderRadius: 24,
        padding: 22,
        marginBottom: 20,
    },
    heroIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    heroEyebrow: {
        fontSize: 10,
        fontWeight: "800",
        color: "rgba(255,255,255,0.7)",
        letterSpacing: 1,
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: -0.4,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "rgba(255,255,255,0.85)",
        lineHeight: 20,
    },
    sectionHeading: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.8,
        marginBottom: 10,
        marginLeft: 4,
    },
    docsCard: {
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 20,
    },
    docRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        gap: 12,
    },
    docIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    docText: { flex: 1 },
    docTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 3,
    },
    docTitle: { fontSize: 15, fontWeight: "800", flex: 1 },
    requiredBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    requiredText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
    optionalBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    optionalText: { fontSize: 10, fontWeight: "700" },
    docDesc: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
    divider: { height: 1 },
    tipsCard: {
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    tipRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
    },
    tipIconBox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    tipText: { flex: 1, fontSize: 14, fontWeight: "600" },
    infoBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    infoBannerText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    startBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 18,
        gap: 8,
    },
    startBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
