import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";

export default function NotificationScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [updating, setUpdating] = useState(false);

    // Initialize state from user profile
    const [pushEnabled, setPushEnabled] = useState(
        user?.push_notifications_enabled ?? true
    );
    const [emailEnabled, setEmailEnabled] = useState(
        user?.email_notifications_enabled ?? true
    );
    const [smsEnabled, setSmsEnabled] = useState(
        user?.sms_notifications_enabled ?? false
    );

    // Placeholder states for specific alert types (not yet in backend)
    const [transactions, setTransactions] = useState(true);
    const [security, setSecurity] = useState(true);
    const [marketing, setMarketing] = useState(false);

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

    const SettingItem = ({
        icon,
        title,
        subtitle,
        value,
        onValueChange,
    }: any) => (
        <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={22} color="#4B5563" />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
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
                    <Text style={styles.sectionHeader}>Alert Types</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="wallet-outline"
                            title="Transaction Updates"
                            subtitle="Deposits, withdrawals, and transfers"
                            value={true}
                            onValueChange={() => { }}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="shield-checkmark-outline"
                            title="Security Alerts"
                            subtitle="Login attempts and password changes"
                            value={true}
                            onValueChange={() => { }}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="megaphone-outline"
                            title="Marketing & Promos"
                            subtitle="News, updates, and special offers"
                            value={false}
                            onValueChange={() => { }}
                        />
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
        marginBottom: 20,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
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
