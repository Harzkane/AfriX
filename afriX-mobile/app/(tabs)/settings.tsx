import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/slices/authSlice";
import { useAgentStore } from "@/stores/slices/agentSlice";

export default function SettingsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { agentStatus } = useAgentStore();

    const settingsOptions = [
        {
            icon: "person-outline",
            title: "Account Settings",
            description: "Manage your account preferences",
            onPress: () => { },
            show: true,
        },
        {
            icon: "briefcase",
            title: "Become an Agent",
            description: "Apply to facilitate token exchanges",
            onPress: () => router.push("/modals/become-agent"),
            show: !agentStatus && user?.role !== "agent",
            highlight: true,
        },
        {
            icon: "shield-checkmark-outline",
            title: "Security",
            description: "Password, 2FA, and security settings",
            onPress: () => { },
            show: true,
        },
        {
            icon: "notifications-outline",
            title: "Notifications",
            description: "Manage notification preferences",
            onPress: () => { },
            show: true,
        },
        {
            icon: "help-circle-outline",
            title: "Help & Support",
            description: "FAQs, contact support",
            onPress: () => { },
            show: true,
        },
        {
            icon: "document-text-outline",
            title: "Legal",
            description: "Terms of service, privacy policy",
            onPress: () => { },
            show: true,
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>Settings</Text>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView style={styles.content}>
                {settingsOptions
                    .filter((option) => option.show)
                    .map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.settingItem,
                                option.highlight && styles.highlightedItem,
                            ]}
                            onPress={option.onPress}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    option.highlight && styles.highlightedIconContainer,
                                ]}
                            >
                                <Ionicons
                                    name={option.icon as any}
                                    size={24}
                                    color={option.highlight ? "#00B14F" : "#6B7280"}
                                />
                            </View>
                            <View style={styles.textContainer}>
                                <Text
                                    style={[
                                        styles.itemTitle,
                                        option.highlight && styles.highlightedTitle,
                                    ]}
                                >
                                    {option.title}
                                </Text>
                                <Text style={styles.itemDescription}>{option.description}</Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={option.highlight ? "#00B14F" : "#9CA3AF"}
                            />
                        </TouchableOpacity>
                    ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    header: {
        marginBottom: 20,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 140,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    headerTop: {
        paddingBottom: 20,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
    },
    content: {
        flex: 1,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    highlightedItem: {
        backgroundColor: "#F0FDF4",
        borderLeftWidth: 4,
        borderLeftColor: "#00B14F",
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    highlightedIconContainer: {
        backgroundColor: "#DCFCE7",
    },
    textContainer: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    highlightedTitle: {
        color: "#00B14F",
    },
    itemDescription: {
        fontSize: 13,
        color: "#6B7280",
    },
});

