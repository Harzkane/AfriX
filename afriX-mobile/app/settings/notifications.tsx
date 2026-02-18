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
    const [smsEnabled, setSmsEnabled] = useState(user?.sms_notifications_enabled ?? false);

    const [transactions, setTransactions] = useState(true);
    const [security, setSecurity] = useState(true);
    const [agentUpdates, setAgentUpdates] = useState(true);
    const [marketing, setMarketing] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await apiClient.get<{ success: boolean; data: NotificationSettingsData }>("/notifications/settings");
                if (cancelled || !res.data?.data) return;
                const d = res.data.data;
                setPushEnabled(d.push?.enabled ?? true);
                setEmailEnabled(d.email?.enabled ?? true);
                setTransactions(d.push?.transactions ?? true);
                setSecurity(d.push?.security ?? true);
                setAgentUpdates(d.push?.agentUpdates ?? true);
                setMarketing(d.push?.marketing ?? false);
            } catch (e) {
                console.error("Fetch notification settings:", e);
            } finally {
                if (!cancelled) setLoadingSettings(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleToggle = async (
        type: "push" | "email" | "sms",
        value: boolean
    ) => {
        try {
            setUpdating(true);
            let fieldName = "";

            // 1. Optimistic Update
            switch (type) {
                case "push":
                    setPushEnabled(value);
                    fieldName = "push_notifications_enabled";
                    break;
                case "email":
                    setEmailEnabled(value);
                    fieldName = "email_notifications_enabled";
                    break;
                case "sms":
                    setSmsEnabled(value);
                    fieldName = "sms_notifications_enabled";
                    break;
            }

            // 2. Call Backend
            await apiClient.put("/users/profile", {
                [fieldName]: value,
            });

            // 3. Update Global Store
            if (user) {
                setUser({
                    ...user,
                    [fieldName]: value,
                });
            }
        } catch (error) {
            console.error("Failed to update notification settings:", error);
            // Revert on error
            switch (type) {
                case "push":
                    setPushEnabled(!value);
                    break;
                case "email":
                    setEmailEnabled(!value);
                    break;
                case "sms":
                    setSmsEnabled(!value);
                    break;
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleAlertTypeToggle = async (key: "transactions" | "security" | "agentUpdates" | "marketing", value: boolean) => {
        const setters: Record<string, (v: boolean) => void> = {
            transactions: setTransactions,
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
                    requests: true,
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
        } catch (e) {
            console.error("Update notification settings:", e);
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
    }: {
        icon: string;
        title: string;
        subtitle?: string;
        value: boolean;
        onValueChange: (v: boolean) => void;
        disabled?: boolean;
    }) => (
        <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon as any} size={22} color="#4B5563" />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: "#E5E7EB", true: "#00B14F" }}
                thumbColor={"#FFFFFF"}
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
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Channels</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="notifications-outline"
                            title="Push Notifications"
                            subtitle="Receive alerts on this device"
                            value={pushEnabled}
                            onValueChange={(v: boolean) => handleToggle("push", v)}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="mail-outline"
                            title="Email Notifications"
                            subtitle="Receive updates via email"
                            value={emailEnabled}
                            onValueChange={(v: boolean) => handleToggle("email", v)}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="chatbox-ellipses-outline"
                            title="SMS Notifications"
                            subtitle="Receive critical alerts via SMS"
                            value={smsEnabled}
                            onValueChange={(v: boolean) => handleToggle("sms", v)}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Alert types</Text>
                    {loadingSettings ? (
                        <View style={styles.card}>
                            <View style={styles.loadingRow}>
                                <ActivityIndicator size="small" color="#00B14F" />
                                <Text style={styles.loadingText}>Loading…</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            <SettingItem
                                icon="wallet-outline"
                                title="Transaction updates"
                                subtitle="Mint, burn, and transfer notifications"
                                value={transactions}
                                onValueChange={(v) => handleAlertTypeToggle("transactions", v)}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="shield-checkmark-outline"
                                title="Security alerts"
                                subtitle="Login and account changes"
                                value={security}
                                onValueChange={(v) => handleAlertTypeToggle("security", v)}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="briefcase-outline"
                                title="Agent updates"
                                subtitle="Withdrawals, reviews, and agent activity"
                                value={agentUpdates}
                                onValueChange={(v) => handleAlertTypeToggle("agentUpdates", v)}
                            />
                            <View style={styles.divider} />
                            <SettingItem
                                icon="megaphone-outline"
                                title="Marketing & promos"
                                subtitle="News and special offers"
                                value={marketing}
                                onValueChange={(v) => handleAlertTypeToggle("marketing", v)}
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
        backgroundColor: "#F3F4F6",
    },
    headerWrapper: {
        marginBottom: 20,
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
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 12,
        marginLeft: 4,
        textTransform: "uppercase",
    },
    comingSoon: {
        fontSize: 12,
        color: "#9CA3AF",
        marginBottom: 8,
        marginLeft: 4,
    },
    settingItemDisabled: {
        opacity: 0.7,
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
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
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
        fontWeight: "500",
        color: "#111827",
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 12,
        color: "#6B7280",
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginLeft: 64,
    },
});
