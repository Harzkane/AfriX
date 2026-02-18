import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function AgentTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#7C3AED", // Purple for Agent
                tabBarInactiveTintColor: "#9CA3AF",
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: "#E5E7EB",
                    height: Platform.OS === "ios" ? 88 : 68,
                    paddingBottom: Platform.OS === "ios" ? 30 : 12,
                    paddingTop: 10,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="requests"
                options={{
                    title: "Requests",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-circle" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
