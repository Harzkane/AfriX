// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, useColorScheme } from "react-native";
import { useNotificationStore } from "@/stores";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useTranslation();
  const tabBarBg = isDark ? "#0E1726" : "#FFFFFF";
  const tabBarBorder = isDark ? "#1E2A3A" : "#E5E7EB";
  const activeTint = "#00B14F";
  const inactiveTint = isDark ? "#94A3B8" : "#9CA3AF";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: tabBarBorder,
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
        tabBarBadgeStyle: {
          backgroundColor: activeTint,
          color: "#FFFFFF",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home", "Home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t("tabs.activity", "Activity"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: t("tabs.agents", "Agents"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile", "Profile"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hide these from tab bar - they're accessed via navigation (not as tabs) */}
      {/* Sell flow: hide tab bar entirely on these screens */}
      <Tabs.Screen
        name="sell-tokens/index"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="sell-tokens/select-agent"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="sell-tokens/bank-details"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="sell-tokens/confirm"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen
        name="sell-tokens/status"
        options={{
          href: null,
          // Hide bottom tab bar on the sell request status screen
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="agents/[id]" options={{ href: null }} />
      <Tabs.Screen name="transaction-details/[id]" options={{ href: null }} />
    </Tabs>
  );
}
