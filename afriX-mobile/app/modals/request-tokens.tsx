import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";

const upcomingFeatures = [
    {
        icon: "people-outline" as const,
        title: "Request from anyone",
        description: "Create token requests for friends, customers, or teammates in a few taps.",
    },
    {
        icon: "options-outline" as const,
        title: "Choose exact amounts",
        description: "Set the token type, amount, and a clear reason so recipients know what to pay.",
    },
    {
        icon: "pulse-outline" as const,
        title: "Track request status",
        description: "See when requests are pending, viewed, paid, or overdue from one clean timeline.",
    },
];

const premiumBenefits = [
    "Faster collection flow without back-and-forth chat",
    "Clear status visibility for every outstanding request",
    "Instant confirmation when a request is fulfilled",
];

export default function RequestTokensModal() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.headerGradient} />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
                            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Request Tokens</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <LinearGradient colors={["#F7FFF9", "#FFFFFF"]} style={styles.heroCard}>
                    <View style={styles.heroBadge}>
                        <Ionicons name="sparkles-outline" size={14} color="#00B14F" />
                        <Text style={styles.heroBadgeText}>Premium update in progress</Text>
                    </View>

                    <View style={styles.heroArt}>
                        <View style={styles.heroIconShell}>
                            <LinearGradient colors={["#DCFCE7", "#FFFFFF"]} style={styles.heroIconCircle}>
                                <Ionicons name="hand-left-outline" size={38} color="#00B14F" />
                            </LinearGradient>
                        </View>
                        <View style={styles.heroFloatCard}>
                            <Ionicons name="notifications-outline" size={16} color="#0F766E" />
                            <Text style={styles.heroFloatText}>Request alert</Text>
                        </View>
                    </View>

                    <Text style={styles.heroTitle}>A better way to ask for tokens is coming</Text>
                    <Text style={styles.heroSubtitle}>
                        We are redesigning this flow to feel more polished, easier to track, and more trustworthy for both sender and recipient.
                    </Text>
                </LinearGradient>

                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <View style={styles.statusIcon}>
                            <Ionicons name="construct-outline" size={18} color="#00B14F" />
                        </View>
                        <View style={styles.statusCopy}>
                            <Text style={styles.statusEyebrow}>Now Working On</Text>
                            <Text style={styles.statusTitle}>Request flow premium refresh</Text>
                        </View>
                    </View>
                    <Text style={styles.statusText}>
                        This screen is next in the upgrade queue, and the refreshed experience will follow the same premium direction as Buy, Sell, Send, Receive, and Swap.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionEyebrow}>What’s Coming</Text>
                    <Text style={styles.sectionTitle}>Planned request experience</Text>
                    {upcomingFeatures.map((feature) => (
                        <View key={feature.title} style={styles.featureCard}>
                            <View style={styles.featureIconWrap}>
                                <Ionicons name={feature.icon} size={22} color="#00B14F" />
                            </View>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.timelineCard}>
                    <Text style={styles.sectionEyebrow}>Flow Direction</Text>
                    <Text style={styles.sectionTitle}>What the polished journey will support</Text>
                    <View style={styles.timelineStep}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Create request</Text>
                            <Text style={styles.timelineText}>Select token, amount, and recipient details with a cleaner form flow.</Text>
                        </View>
                    </View>
                    <View style={styles.timelineStep}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Share and notify</Text>
                            <Text style={styles.timelineText}>Recipients will get a clearer prompt with context for what you are requesting.</Text>
                        </View>
                    </View>
                    <View style={styles.timelineStep}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineTitle}>Track completion</Text>
                            <Text style={styles.timelineText}>Monitor pending and completed requests without chasing updates manually.</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.benefitsCard}>
                    <Text style={styles.sectionEyebrow}>Why It Matters</Text>
                    <Text style={styles.sectionTitle}>The upgrade is focused on clarity and confidence</Text>
                    {premiumBenefits.map((benefit) => (
                        <View key={benefit} style={styles.benefitRow}>
                            <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                            <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={styles.footerWrapper}>
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()} activeOpacity={0.85}>
                        <Text style={styles.primaryButtonText}>Back for now</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F6F8FB",
    },
    headerWrapper: {
        position: "relative",
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 122,
    },
    headerContent: {
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 4,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.16)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 18,
    },
    heroCard: {
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: "#E6F4EA",
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
        elevation: 4,
    },
    heroBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F0FDF4",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        marginBottom: 18,
    },
    heroBadgeText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#047857",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    heroArt: {
        marginBottom: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    heroIconShell: {
        alignItems: "center",
        justifyContent: "center",
    },
    heroIconCircle: {
        width: 104,
        height: 104,
        borderRadius: 52,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#D1FAE5",
    },
    heroFloatCard: {
        position: "absolute",
        right: 28,
        bottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#ECFDF5",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#A7F3D0",
    },
    heroFloatText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#0F766E",
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#111827",
        lineHeight: 34,
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        fontSize: 15,
        color: "#6B7280",
        lineHeight: 23,
    },
    statusCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    statusHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    statusIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
    },
    statusCopy: {
        flex: 1,
    },
    statusEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    statusText: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 21,
    },
    section: {
        gap: 12,
    },
    sectionEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        lineHeight: 28,
        marginBottom: 2,
    },
    featureCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
        backgroundColor: "#FFFFFF",
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    featureIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: "#F0FDF4",
        alignItems: "center",
        justifyContent: "center",
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
    },
    featureDescription: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 21,
    },
    timelineCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    timelineStep: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginTop: 16,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 6,
        backgroundColor: "#00B14F",
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    timelineText: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 21,
    },
    benefitsCard: {
        backgroundColor: "#F7FFF9",
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: "#D9FBE7",
    },
    benefitRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        marginTop: 14,
    },
    benefitText: {
        flex: 1,
        fontSize: 14,
        color: "#166534",
        lineHeight: 21,
        fontWeight: "500",
    },
    footerWrapper: {
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 12,
    },
    primaryButton: {
        backgroundColor: "#00B14F",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 17,
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
});
