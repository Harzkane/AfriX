import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, useColorScheme, View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

export default function AgentTabsLayout() {
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#7C3AED",
                tabBarInactiveTintColor: isDark ? "#475569" : "#9CA3AF",
                tabBarStyle: {
                    backgroundColor: isDark ? "#0F0A1E" : "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: isDark ? "#1E1638" : "#EDE9FE",
                    height: Platform.OS === "ios" ? 88 : 68,
                    paddingBottom: Platform.OS === "ios" ? 30 : 12,
                    paddingTop: 10,
                    elevation: 0,
                    shadowColor: "#7C3AED",
                    shadowOpacity: isDark ? 0.2 : 0.06,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: -4 },
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: 0.2,
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: t("agent.tabs.dashboard", "Dashboard"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                            <Ionicons name={focused ? "grid" : "grid-outline"} size={size - 2} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="requests"
                options={{
                    title: t("agent.tabs.requests", "Requests"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                            <Ionicons name={focused ? "list-circle" : "list-circle-outline"} size={size - 2} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t("agent.tabs.profile", "Profile"),
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                            <Ionicons name={focused ? "person" : "person-outline"} size={size - 2} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconWrap: {
        width: 36,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
    },
    iconWrapActive: {
        backgroundColor: "rgba(124, 58, 237, 0.12)",
    },
});
