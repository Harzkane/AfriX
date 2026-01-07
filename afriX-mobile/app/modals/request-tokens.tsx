import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RequestTokensModal() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Request Tokens</Text>
                        <View style={{ width: 28 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="hand-left" size={48} color="#EC4899" />
                    </View>
                    <View style={styles.sparkle1}>
                        <Ionicons name="sparkles" size={20} color="#F59E0B" />
                    </View>
                    <View style={styles.sparkle2}>
                        <Ionicons name="sparkles" size={16} color="#8B5CF6" />
                    </View>
                </View>

                {/* Main Message */}
                <Text style={styles.title}>Coming Soon! 🎉</Text>
                <Text style={styles.subtitle}>Request Tokens Feature</Text>

                {/* Description */}
                <Text style={styles.description}>
                    We're building something amazing for you! Soon you'll be able to:
                </Text>

                {/* Features List */}
                <View style={styles.featuresList}>
                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Request from Friends</Text>
                            <Text style={styles.featureDesc}>
                                Send payment requests to your contacts
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Set Custom Amounts</Text>
                            <Text style={styles.featureDesc}>
                                Specify exactly how much you need
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Track Requests</Text>
                            <Text style={styles.featureDesc}>
                                See who's paid and who hasn't
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#00B14F" />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Instant Notifications</Text>
                            <Text style={styles.featureDesc}>
                                Get notified when someone fulfills your request
                            </Text>
                        </View>
                    </View>
                </View>

                {/* CTA */}
                <View style={styles.ctaContainer}>
                    <Text style={styles.ctaText}>
                        Stay tuned! We're working hard to bring this feature to you.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Got it, thanks!</Text>
                </TouchableOpacity>
            </View>
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
        height: 120,
        // borderBottomLeftRadius: 30,
        // borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 20,
        marginTop: 10,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    content: {
        padding: 24,
        alignItems: "center",
    },
    iconContainer: {
        position: "relative",
        marginBottom: 32,
        marginTop: 20,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FCE7F3",
        justifyContent: "center",
        alignItems: "center",
    },
    sparkle1: {
        position: "absolute",
        top: -5,
        right: -5,
    },
    sparkle2: {
        position: "absolute",
        bottom: 5,
        left: -10,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#EC4899",
        marginBottom: 24,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 24,
    },
    featuresList: {
        width: "100%",
        marginBottom: 32,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    featureIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 14,
        color: "#6B7280",
        lineHeight: 20,
    },
    ctaContainer: {
        backgroundColor: "#F0FDF4",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#00B14F",
        marginBottom: 20,
    },
    ctaText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#065F46",
        textAlign: "center",
        lineHeight: 22,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    backButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    backButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
