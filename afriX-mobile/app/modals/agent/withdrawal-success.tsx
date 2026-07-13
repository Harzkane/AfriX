import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Animated, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function WithdrawalSuccess() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        amount?: string;
        requestId?: string;
        from?: string;
    }>();
    const amount = params?.amount ?? "0";
    const requestId = params?.requestId ?? "";
    const fromAgentProfile = params?.from === "agent-profile";

    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const theme = {
        bg: isDark ? "#090B14" : "#F8FAFC",
        card: isDark ? "rgba(30, 22, 56, 0.6)" : "#FFFFFF",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "rgba(124, 58, 237, 0.2)" : "#E2E8F0",
        accent: "#7C3AED",
        accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
        green: "#10B981",
        greenLight: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
    };

    const handleDone = () => {
        if (fromAgentProfile) {
            router.replace("/agent/(tabs)/profile");
        } else {
            router.back();
        }
    };

    const shortId = requestId ? `${requestId.slice(0, 8).toUpperCase()}...` : "—";
    
    // Animation Values
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
                // Spring-like bounce
                easing: (t) => {
                    const c4 = (2 * Math.PI) / 3;
                    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
                }
            }),
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ])
        ]).start();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Soft background gradient glow */}
            <LinearGradient
                colors={isDark ? ["rgba(124, 58, 237, 0.15)", "transparent"] : ["rgba(124, 58, 237, 0.08)", "transparent"]}
                style={styles.backgroundGlow}
                pointerEvents="none"
            />
            
            <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
                <View style={styles.mainContent}>
                    
                    {/* Animated Icon */}
                    <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
                        <View style={[styles.iconOuterRing, { backgroundColor: theme.greenLight }]}>
                            <View style={[styles.iconInnerRing, { backgroundColor: theme.greenLight }]}>
                                <View style={[styles.iconCenter, { backgroundColor: theme.green }]}>
                                    <Ionicons name="checkmark-sharp" size={44} color="#FFFFFF" style={styles.checkIcon} />
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Animated Text & Card */}
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: "100%", alignItems: "center" }}>
                        <Text style={[styles.title, { color: theme.text }]}>Request Submitted</Text>
                        <Text style={[styles.subtitle, { color: theme.muted }]}>
                            Your withdrawal is on its way.
                        </Text>

                        {/* Premium Receipt Card */}
                        <View style={[styles.receiptCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.receiptHeader}>
                                <Text style={[styles.receiptAmountLabel, { color: theme.muted }]}>Withdrawal Amount</Text>
                                <Text style={[styles.receiptAmountValue, { color: theme.text }]}>
                                    <Text style={styles.currencySymbol}>$</Text>
                                    {Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                                <View style={[styles.tokenBadge, { backgroundColor: theme.accentLight }]}>
                                    <Text style={[styles.tokenBadgeText, { color: theme.accent }]}>USDT</Text>
                                </View>
                            </View>

                            <View style={styles.dividerWrap}>
                                <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.bg }]} />
                                <View style={styles.dashedLine}>
                                    {[...Array(20)].map((_, i) => (
                                        <View key={i} style={[styles.dash, { backgroundColor: theme.border }]} />
                                    ))}
                                </View>
                                <View style={[styles.notch, styles.notchRight, { backgroundColor: theme.bg }]} />
                            </View>

                            <View style={styles.receiptFooter}>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.muted }]}>Date</Text>
                                    <Text style={[styles.detailValue, { color: theme.text }]}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.muted }]}>Request ID</Text>
                                    <Text style={[styles.detailValueMono, { color: theme.text }]}>{shortId}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.muted }]}>Status</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: theme.accentLight }]}>
                                        <Text style={[styles.statusBadgeText, { color: theme.accent }]}>Processing</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.infoPill, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0" }]}>
                            <Ionicons name="information-circle" size={16} color={theme.muted} style={{ marginRight: 6 }} />
                            <Text style={[styles.infoPillText, { color: theme.muted }]}>
                                Usually processed within 1–3 business days.
                            </Text>
                        </View>
                    </Animated.View>
                </View>

                <Animated.View style={[styles.footer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <TouchableOpacity 
                        style={[styles.doneButton, { backgroundColor: theme.accent }]} 
                        onPress={handleDone} 
                        activeOpacity={0.85}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </Animated.View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGlow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    safe: {
        flex: 1,
        justifyContent: "space-between",
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 20,
    },
    
    // Icon Animation Styles
    iconContainer: {
        marginBottom: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    iconOuterRing: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: "center",
        justifyContent: "center",
    },
    iconInnerRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
    },
    iconCenter: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#10B981",
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    checkIcon: {
        marginTop: 2,
        marginLeft: 1,
    },

    title: {
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        textAlign: "center",
        fontWeight: "500",
        marginBottom: 32,
    },

    // Premium Receipt Card
    receiptCard: {
        width: "100%",
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
        overflow: "hidden",
    },
    receiptHeader: {
        padding: 24,
        alignItems: "center",
    },
    receiptAmountLabel: {
        fontSize: 13,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    receiptAmountValue: {
        fontSize: 40,
        fontWeight: "900",
        letterSpacing: -1.5,
        marginBottom: 12,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: "700",
        opacity: 0.7,
    },
    tokenBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    tokenBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.5,
    },

    // Divider with Notches
    dividerWrap: {
        flexDirection: "row",
        alignItems: "center",
        height: 24,
        position: "relative",
    },
    notch: {
        width: 24,
        height: 24,
        borderRadius: 12,
        position: "absolute",
        zIndex: 2,
    },
    notchLeft: {
        left: -12,
    },
    notchRight: {
        right: -12,
    },
    dashedLine: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginHorizontal: 16,
        overflow: "hidden",
    },
    dash: {
        width: 8,
        height: 1.5,
        borderRadius: 1,
    },

    receiptFooter: {
        padding: 24,
        gap: 16,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    detailValue: {
        fontSize: 15,
        fontWeight: "700",
    },
    detailValueMono: {
        fontSize: 14,
        fontWeight: "700",
        fontFamily: "Courier",
        letterSpacing: 0.5,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    infoPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    infoPillText: {
        fontSize: 13,
        fontWeight: "600",
    },

    footer: {
        paddingHorizontal: 24,
        paddingBottom: 16,
        width: "100%",
    },
    doneButton: {
        width: "100%",
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowColor: "#7C3AED",
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: "800",
        color: "white",
        letterSpacing: 0.3,
    },
});

