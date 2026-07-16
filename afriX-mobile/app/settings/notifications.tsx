// app/settings/notifications.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Animated,
  Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";
import * as Haptics from "expo-haptics";

import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    divider: isDark ? "#1A2638" : "#F1F5F9",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
    teal: "#0F766E",
    tealSoft: isDark ? "rgba(15,118,110,0.12)" : "#CCFBF1",
    tealBorder: isDark ? "rgba(15,118,110,0.25)" : "#99F6E4",
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    redBorder: isDark ? "rgba(239,68,68,0.25)" : "#FEE2E2",
    purple: "#8B5CF6",
    purpleSoft: isDark ? "rgba(139,92,246,0.12)" : "#F3E8FF",
    purpleBorder: isDark ? "rgba(139,92,246,0.25)" : "#DDD6FE",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.25)" : "#FDE68A",
  };

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

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const handleToggle = async (type: "push" | "email", value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      console.error("Failed to update settings:", error);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      console.error("Update settings type error:", error);
      setters[key](!value);
    } finally {
      setUpdating(false);
    }
  };

  const SettingRow = ({
    icon, iconColor, iconBg, title, subtitle, value, onValueChange, disabled,
  }: {
    icon: string; iconColor: string; iconBg: string;
    title: string; subtitle?: string; value: boolean;
    onValueChange: (v: boolean) => void; disabled?: boolean;
  }) => (
    <View style={[styles.settingRow, { borderColor: theme.divider }, disabled && { opacity: 0.6 }]}>
      <View style={[styles.settingIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: theme.muted }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: isDark ? "#1E2A3A" : "#E2E8F0", true: theme.accent }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > headerMaxHeight) setHeaderMaxHeight(h);
        }}
        style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/profile")}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("settings.notifications.header_title", "Notifications")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("settings.notifications.header_subtitle", "Manage your notification preferences.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* Summary Card */}
        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("settings.notifications.intro_eyebrow", "ALERT PREFERENCES")}</Text>
          <Text style={[styles.introTitle, { color: theme.text }]}>{t("settings.notifications.intro_title", "Control how we keep you informed")}</Text>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            {t("settings.notifications.intro_subtitle", "Choose your preferred channels and select which transaction, security, and promotional updates you want to receive.")}
          </Text>
        </View>

        {/* ── Channels ── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("settings.notifications.section_channels", "Channels")}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingRow
            icon="notifications-outline"
            iconColor={theme.accent}
            iconBg={theme.accentSoft}
            title={t("settings.notifications.push_title", "Push Notifications")}
            subtitle={t("settings.notifications.push_subtitle", "Receive alerts on this device")}
            value={pushEnabled}
            onValueChange={(val) => handleToggle("push", val)}
            disabled={updating}
          />
          <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
          <SettingRow
            icon="mail-outline"
            iconColor={theme.blue}
            iconBg={theme.blueSoft}
            title={t("settings.notifications.email_title", "Email Notifications")}
            subtitle={t("settings.notifications.email_subtitle", "Receive updates via email address")}
            value={emailEnabled}
            onValueChange={(val) => handleToggle("email", val)}
            disabled={updating}
          />
        </View>

        {/* SMS status alert/coming soon banner */}
        <View style={[styles.smsComingSoonCard, { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder }]}>
          <View style={[styles.smsIconBox, { backgroundColor: theme.amber + "22" }]}>
            <Ionicons name="chatbox-ellipses-outline" size={18} color={theme.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.smsTitleRow}>
              <Text style={[styles.smsTitle, { color: isDark ? "#FCD34D" : "#92400E" }]}>{t("settings.notifications.sms_title", "SMS Notifications")}</Text>
              <View style={[styles.smsBadge, { backgroundColor: isDark ? "#1E2A3A" : "#FFFFFF", borderColor: theme.amberBorder }]}>
                <Text style={[styles.smsBadgeText, { color: theme.amber }]}>{t("common.coming_soon", "Coming soon")}</Text>
              </View>
            </View>
            <Text style={[styles.smsDesc, { color: isDark ? "#FDE68A" : "#B45309" }]}>
              {t("settings.notifications.sms_desc", "Critical SMS transactional updates are planned, but they are not active on your account yet.")}
            </Text>
          </View>
        </View>

        {/* ── Alert Types ── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("settings.notifications.section_alert_types", "Alert Types")}</Text>
        {loadingSettings ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, paddingVertical: 32, alignItems: "center", justifyContent: "center" }]}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.muted }]}>{t("settings.notifications.loading_prefs", "Loading preferences...")}</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <SettingRow
              icon="wallet-outline"
              iconColor={theme.accent}
              iconBg={theme.accentSoft}
              title={t("settings.notifications.alert_transactions_title", "Transaction updates")}
              subtitle={t("settings.notifications.alert_transactions_subtitle", "Mint, burn, and transfer notifications")}
              value={transactions}
              onValueChange={(val) => handleAlertTypeToggle("transactions", val)}
              disabled={updating}
            />
            <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
            <SettingRow
              icon="git-pull-request-outline"
              iconColor={theme.teal}
              iconBg={theme.tealSoft}
              title={t("settings.notifications.alert_requests_title", "Request updates")}
              subtitle={t("settings.notifications.alert_requests_subtitle", "Mint, burn, and dispute status changes")}
              value={requests}
              onValueChange={(val) => handleAlertTypeToggle("requests", val)}
              disabled={updating || !pushEnabled}
            />
            <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
            <SettingRow
              icon="shield-checkmark-outline"
              iconColor={theme.red}
              iconBg={theme.redSoft}
              title={t("settings.notifications.alert_security_title", "Security alerts")}
              subtitle={t("settings.notifications.alert_security_subtitle", "Login prompts and key credential changes")}
              value={security}
              onValueChange={(val) => handleAlertTypeToggle("security", val)}
              disabled={updating}
            />
            <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
            <SettingRow
              icon="briefcase-outline"
              iconColor={theme.purple}
              iconBg={theme.purpleSoft}
              title={t("settings.notifications.alert_agent_title", "Agent updates")}
              subtitle={t("settings.notifications.alert_agent_subtitle", "Withdrawals, deposits, and agent verification status")}
              value={agentUpdates}
              onValueChange={(val) => handleAlertTypeToggle("agentUpdates", val)}
              disabled={updating}
            />
            <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
            <SettingRow
              icon="megaphone-outline"
              iconColor={theme.amber}
              iconBg={theme.amberSoft}
              title={t("settings.notifications.alert_marketing_title", "Marketing & promos")}
              subtitle={t("settings.notifications.alert_marketing_subtitle", "Product news, special offers, and market reports")}
              value={marketing}
              onValueChange={(val) => handleAlertTypeToggle("marketing", val)}
              disabled={updating}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10, borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 10, paddingBottom: 16,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute", top: 0, left: 0, right: 0, height: 200,
  },
  introCard: {
    borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1,
  },
  introEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8 },
  introTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, letterSpacing: -0.4 },
  introSubtitle: { fontSize: 14, lineHeight: 21 },
  sectionLabel: {
    fontSize: 11, fontWeight: "800", textTransform: "uppercase",
    letterSpacing: 0.8, marginBottom: 10, marginLeft: 4,
  },
  card: {
    borderRadius: 22, borderWidth: 1, padding: 8, marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  settingIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    marginRight: 14, flexShrink: 0,
  },
  settingText: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  settingSubtitle: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  cardDivider: { height: 1, marginHorizontal: 16 },
  smsComingSoonCard: {
    borderRadius: 22, borderWidth: 1, padding: 16,
    flexDirection: "row", gap: 12, marginBottom: 20,
  },
  smsIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  smsTitleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6,
  },
  smsTitle: { fontSize: 14, fontWeight: "800", flex: 1 },
  smsBadge: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1,
  },
  smsBadgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  smsDesc: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  loadingText: { fontSize: 13, fontWeight: "600", marginTop: 8 },
});
