import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";

type NotificationSettingsData = {
    push: {
        enabled: boolean;
        transactions: boolean;
        requests: boolean;
        agentUpdates: boolean;
        security: boolean;
        marketing: boolean;
    };
    email: {
        enabled: boolean;
        transactionReceipts: boolean;
        agentUpdates: boolean;
        security: boolean;
        marketing: boolean;
    };
};

export default function NotificationScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [updating, setUpdating] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);

    const [pushEnabled, setPushEnabled] = useState(user?.push_notifications_enabled ?? true);
    const [emailEnabled, setEmailEnabled] = useState(user?.email_notifications_enabled ?? true);

    const [transactions, setTransactions] = useState(true);
    const [requests, setRequests] = useState(true);
    const [security, setSecurity] = useState(true);
    const [agentUpdates, setAgentUpdates] = useState(true);
    const [marketing, setMarketing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await apiClient.get<{ success: boolean; data: NotificationSettingsData }>("/notifications/settings");
                if (cancelled || !res.data?.data) return;
                const data = res.data.data;
                setPushEnabled(data.push?.enabled ?? true);
                setEmailEnabled(data.email?.enabled ?? true);
                setTransactions(data.push?.transactions ?? true);
                setRequests(data.push?.requests ?? true);
                setSecurity(data.push?.security ?? true);
                setAgentUpdates(data.push?.agentUpdates ?? true);
                setMarketing(data.push?.marketing ?? false);
            } catch (error) {
                console.error("Fetch notification settings:", error);
            } finally {
                if (!cancelled) setLoadingSettings(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleToggle = async (type: "push" | "email", value: boolean) => {
        try {
            setUpdating(true);
            const nextPushEnabled = type === "push" ? value : pushEnabled;
            const nextEmailEnabled = type === "email" ? value : emailEnabled;

            if (type === "push") setPushEnabled(value);
            if (type === "email") setEmailEnabled(value);

            await apiClient.put("/notifications/settings", {
                push: {
                    enabled: nextPushEnabled,
                    transactions,
                    requests,
                    agentUpdates,
                    security,
                    marketing,
                },
                email: {
                    enabled: nextEmailEnabled,
                    transactionReceipts: transactions,
                    agentUpdates,
                    security,
                    marketing,
                },
            });

            if (user) {
                setUser({
                    ...user,
                    push_notifications_enabled: nextPushEnabled,
                    email_notifications_enabled: nextEmailEnabled,
                });
            }
        } catch (error) {
            console.error("Failed to update notification settings:", error);
            if (type === "push") setPushEnabled(!value);
            if (type === "email") setEmailEnabled(!value);
        } finally {
            setUpdating(false);
        }
    };

    const handleAlertTypeToggle = async (
        key: "transactions" | "requests" | "security" | "agentUpdates" | "marketing",
        value: boolean
    ) => {
        const setters: Record<string, (v: boolean) => void> = {
            transactions: setTransactions,
            requests: setRequests,
            security: setSecurity,
            agentUpdates: setAgentUpdates,
            marketing: setMarketing,
        };
        setters[key](value);
        try {
            setUpdating(true);
            await apiClient.put("/notifications/settings", {
                push: {
                    enabled: pushEnabled,
                    transactions: key === "transactions" ? value : transactions,
                    requests: key === "requests" ? value : requests,
                    agentUpdates: key === "agentUpdates" ? value : agentUpdates,
                    security: key === "security" ? value : security,
                    marketing: key === "marketing" ? value : marketing,
                },
                email: {
                    enabled: emailEnabled,
                    transactionReceipts: key === "transactions" ? value : transactions,
                    agentUpdates: key === "agentUpdates" ? value : agentUpdates,
                    security: key === "security" ? value : security,
                    marketing: key === "marketing" ? value : marketing,
                },
            });
        } catch (error) {
            console.error("Update notification settings:", error);
            setters[key](!value);
        } finally {
            setUpdating(false);
        }
    };

    const SettingItem = ({
        icon,
        title,
        subtitle,
        value,
        onValueChange,
        disabled,
        tint = "#4B5563",
        iconBg = "#F3F4F6",
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        value: boolean;
        onValueChange: (v: boolean) => void;
        disabled?: boolean;
        tint?: string;
        iconBg?: string;
    }) => (
        <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
            <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon as any} size={20} color={tint} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: "#E5E7EB", true: "#00B14F" }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.replace("/(tabs)/profile")}
                            style={styles.backButton}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#F7FFF9", "#FFFFFF"]}
                    style={styles.summaryCard}
                >
                    <Text style={styles.summaryEyebrow}>Alert Preferences</Text>
                    <Text style={styles.summaryTitle}>Control how AfriX keeps you informed</Text>
                    <Text style={styles.summaryText}>
                        Choose your preferred channels and decide which account, transaction, and promotional updates you want to receive.
                    </Text>
                </LinearGradient>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Channels</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="notifications-outline"
                            title="Push Notifications"
                            subtitle="Receive alerts on this device"
                            value={pushEnabled}
                            onValueChange={(value: boolean) => handleToggle("push", value)}
                            disabled={updating}
                            tint="#00B14F"
                            iconBg="#ECFDF3"
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="mail-outline"
                            title="Email Notifications"
                            subtitle="Receive updates via email"
                            value={emailEnabled}
                            onValueChange={(value: boolean) => handleToggle("email", value)}
                            disabled={updating}
                            tint="#3B82F6"
                            iconBg="#EFF6FF"
                        />
                    </View>
                    <View style={styles.comingSoonCard}>
                        <View style={styles.comingSoonIcon}>
                            <Ionicons name="chatbox-ellipses-outline" size={18} color="#B45309" />
                        </View>
                        <View style={styles.comingSoonContent}>
                            <View style={styles.comingSoonTitleRow}>
                                <Text style={styles.comingSoonTitle}>SMS Notifications</Text>
                                <View style={styles.comingSoonBadge}>
                                    <Text style={styles.comingSoonBadgeText}>Coming soon</Text>
                                </View>
                            </View>
                            <Text style={styles.comingSoonText}>
                                Critical SMS alerts are planned, but they are not active yet on your account.
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Alert Types</Text>
                    {loadingSettings ? (
                        <View style={styles.card}>
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#00B14F" />
                                <Text style={styles.loadingText}>Loading preferences...</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            <SettingItem
                                icon="wallet-outline"
                                title="Transaction updates"
                                subtitle="Mint, burn, and transfer notifications"
                                value={transactions}
                                onValueChange={(value) => handleAlertTypeToggle("transactions", value)}
                                disabled={updating}
                                tint="#00B14F"
                                iconBg="#ECFDF3"
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="git-pull-request-outline"
                                title="Request updates"
                                subtitle="Mint, burn, and dispute status changes"
                                value={requests}
                                onValueChange={(value) => handleAlertTypeToggle("requests", value)}
                                disabled={updating || !pushEnabled}
                                tint="#0F766E"
                                iconBg="#CCFBF1"
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="shield-checkmark-outline"
                                title="Security alerts"
                                subtitle="Login and account changes"
                                value={security}
                                onValueChange={(value) => handleAlertTypeToggle("security", value)}
                                disabled={updating}
                                tint="#DC2626"
                                iconBg="#FEF2F2"
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="briefcase-outline"
                                title="Agent updates"
                                subtitle="Withdrawals, reviews, and agent activity"
                                value={agentUpdates}
                                onValueChange={(value) => handleAlertTypeToggle("agentUpdates", value)}
                                disabled={updating}
                                tint="#8B5CF6"
                                iconBg="#F3E8FF"
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="megaphone-outline"
                                title="Marketing & promos"
                                subtitle="News and special offers"
                                value={marketing}
                                onValueChange={(value) => handleAlertTypeToggle("marketing", value)}
                                disabled={updating}
                                tint="#F59E0B"
                                iconBg="#FEF3C7"
                            />
                        </View>
                    )}
                </View>
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
        height: 120,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 20,
        marginTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.4,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 58,
        paddingBottom: 40,
    },
    summaryCard: {
        borderRadius: 22,
        padding: 18,
        marginTop: -22,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#E6F4EA",
    },
    summaryEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
        letterSpacing: -0.5,
    },
    summaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: "#6B7280",
        fontWeight: "500",
        marginTop: 6,
    },
    section: {
        marginBottom: 18,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: "800",
        color: "#6B7280",
        marginBottom: 10,
        marginLeft: 4,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    settingItemDisabled: {
        opacity: 0.7,
    },
    comingSoonCard: {
        marginTop: 12,
        backgroundColor: "#FFFBEB",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#FDE68A",
        padding: 16,
        flexDirection: "row",
        gap: 12,
    },
    comingSoonIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "#FEF3C7",
        alignItems: "center",
        justifyContent: "center",
    },
    comingSoonContent: {
        flex: 1,
    },
    comingSoonTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 6,
    },
    comingSoonTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#92400E",
        flex: 1,
    },
    comingSoonBadge: {
        backgroundColor: "#FFFFFF",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: "#FDE68A",
    },
    comingSoonBadgeText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#B45309",
        textTransform: "uppercase",
    },
    comingSoonText: {
        fontSize: 13,
        lineHeight: 19,
        color: "#B45309",
        fontWeight: "500",
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
        marginRight: 12,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 12,
        color: "#6B7280",
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginLeft: 68,
    },
});
