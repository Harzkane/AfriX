// app/(tabs)/profile.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  Animated,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuthStore, useNotificationStore, useSettingsStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDate } from "@/utils/format";
import { useTranslation } from "react-i18next";
import { getCurrencyByCountryCode } from "@/constants/countries";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { agentStatus, fetchAgentStats } = useAgentStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { t } = useTranslation();
  const { language, setLanguage } = useSettingsStore();
  const currentLang = language || (user && getCurrencyByCountryCode(user.country_code) === "XOF" ? "fr" : "en");

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    warning: "#F59E0B",
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    purple: "#8B5CF6",
    purpleSoft: isDark ? "rgba(139,92,246,0.12)" : "#F5F3FF",
  };

  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) {
      setHeaderMaxHeight(height);
    }
  };

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const subtitleMaxHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [80, 0],
    extrapolate: "clamp",
  });

  const subtitleMargin = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [4, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (user) {
      fetchAgentStats();
    }
  }, [fetchAgentStats, user]);

  useFocusEffect(
    React.useCallback(() => {
      if (user) fetchUnreadCount();
    }, [user, fetchUnreadCount])
  );

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/welcome");
  };

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.muted }]}>{t("profile.loading", "Loading profile...")}</Text>
      </View>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const MenuRow = ({ icon, label, onPress, rightContent, iconColor, iconBgColor }: any) => (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.65}>
      <View style={[styles.menuIconBox, { backgroundColor: iconBgColor || theme.cardAlt }]}>
        <Ionicons name={icon} size={20} color={iconColor || theme.muted} />
      </View>
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      {rightContent ? rightContent : <Ionicons name="chevron-forward" size={18} color={theme.muted} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={isDark ? ["rgba(0,177,79,0.22)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.18)", "rgba(255,255,255,0)"]}
        style={styles.backgroundGlow}
        pointerEvents="none"
      />

      {/* Fixed Header */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[
          styles.headerWrapper,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          },
        ]}
      >
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.text }]}>{t("profile.title")}</Text>
              <Animated.View style={{
                opacity: subtitleOpacity,
                maxHeight: subtitleMaxHeight,
                marginTop: subtitleMargin,
                overflow: "hidden"
              }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("profile.subtitle")}
                </Text>
              </Animated.View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile/edit")}
              style={[styles.editButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Spacer matching the header height */}
        <View style={{ height: headerMaxHeight }} />

        {/* Brand New Modern Hero Profile Section */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[theme.accent, "#3B82F6"]}
              style={styles.avatarGradientRing}
            >
              <View style={[styles.avatarInner, { backgroundColor: theme.card }]}>
                <Text style={[styles.avatarText, { color: theme.text }]}>
                  {getInitials(user.full_name)}
                </Text>
              </View>
            </LinearGradient>
            {user.email_verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.card, shadowColor: isDark ? "#000" : theme.accent }]}>
                <Ionicons name="checkmark-circle" size={24} color={theme.accent} />
              </View>
            )}
          </View>

          <Text style={[styles.userName, { color: theme.text }]}>{user.full_name || "User"}</Text>
          <Text style={[styles.userEmail, { color: theme.muted }]}>{user.email}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.roleBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accent + "30" }]}>
              <Ionicons name="person-outline" size={12} color={theme.accent} />
              <Text style={[styles.badgeText, { color: theme.accent }]}>{user.role?.toUpperCase() || "USER"}</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: theme.blueSoft, borderColor: theme.blue + "30" }]}>
              <Ionicons name="shield-checkmark-outline" size={12} color={theme.blue} />
              <Text style={[styles.badgeText, { color: theme.blue }]}>{t("profile.level_value", "Level {{level}}", { level: user.verification_level || 0 })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          {/* Agent Center Card - Redesigned as a stunning CTA banner */}
          {agentStatus === "active" || user.role === "agent" ? (
            <TouchableOpacity
              onPress={() => router.replace("/agent/dashboard")}
              activeOpacity={0.85}
              style={styles.bannerCard}
            >
              <LinearGradient
                colors={["#8B5CF6", "#6D28D9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextWrap}>
                    <Text style={styles.bannerLabel}>{t("profile.agent_dashboard_label", "AGENT DASHBOARD")}</Text>
                    <Text style={styles.bannerTitle}>{t("profile.switch_agent_mode", "Switch to Agent Mode")}</Text>
                    <Text style={styles.bannerSubtitle}>{t("profile.manage_agent_desc", "Manage deposits, withdrawals, and commissions.")}</Text>
                  </View>
                  <View style={styles.bannerIconCircle}>
                    <Ionicons name="arrow-forward" size={20} color="#8B5CF6" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : agentStatus ? (
            <TouchableOpacity
              onPress={() => router.push("/modals/agent-kyc/status")}
              activeOpacity={0.85}
              style={styles.bannerCard}
            >
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextWrap}>
                    <Text style={styles.bannerLabel}>{t("profile.app_pending_label", "APPLICATION PENDING")}</Text>
                    <Text style={styles.bannerTitle}>{t("profile.check_app_status", "Check Application Status")}</Text>
                    <Text style={styles.bannerSubtitle}>{t("profile.kyc_review_desc", "Your KYC documents are currently under review.")}</Text>
                  </View>
                  <View style={styles.bannerIconCircle}>
                    <Ionicons name="time" size={20} color="#F59E0B" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/modals/become-agent")}
              activeOpacity={0.85}
              style={styles.bannerCard}
            >
              <LinearGradient
                colors={["#00B14F", "#008F40"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerGradient}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextWrap}>
                    <Text style={styles.bannerLabel}>{t("profile.earn_label", "EARN WITH AFRIX")}</Text>
                    <Text style={styles.bannerTitle}>{t("profile.become_agent_title", "Become an AfriX Agent")}</Text>
                    <Text style={styles.bannerSubtitle}>{t("profile.earn_commission_desc", "Earn commissions by facilitating fiat transfers.")}</Text>
                  </View>
                  <View style={styles.bannerIconCircle}>
                    <Ionicons name="arrow-up-circle" size={20} color="#00B14F" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Account Status Segmented Row */}
          <View style={[styles.statsRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.statTile}>
              <Text style={[styles.statValue, { color: theme.text }]}>{t("profile.level_value", "Level {{level}}", { level: user.verification_level || 0 })}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>{t("profile.verification")}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statTile}>
              <Text style={[styles.statValue, { color: theme.text }]}>{user.country_code || "NG"}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>{t("profile.region")}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statTile}>
              <Text style={[styles.statValue, { color: theme.text }]}>{new Date(user.created_at).getFullYear()}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>{t("profile.joined")}</Text>
            </View>
          </View>

          {/* Settings Section */}
          <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("profile.section_security_pref", "SECURITY & PREFERENCES")}</Text>
          <View style={[styles.menuListCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <MenuRow
              icon="lock-closed"
              iconColor={theme.blue}
              iconBgColor={theme.blueSoft}
              label={t("profile.security_settings")}
              onPress={() => router.push("/settings/security")}
            />
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <MenuRow
              icon="notifications"
              iconColor={theme.accent}
              iconBgColor={theme.accentSoft}
              label={t("profile.notification_inbox")}
              onPress={() => router.push("/settings/notification-inbox")}
              rightContent={
                <View style={styles.notificationBadgeRow}>
                  {unreadCount > 0 && (
                    <View style={styles.unreadCountBadge}>
                      <Text style={styles.unreadCountText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={theme.muted} />
                </View>
              }
            />
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <MenuRow
              icon="options"
              iconColor={theme.warning}
              iconBgColor={theme.warningSoft}
              label={t("profile.notification_preferences")}
              onPress={() => router.push("/settings/notifications")}
            />
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <MenuRow
              icon="book"
              iconColor={theme.purple}
              iconBgColor={theme.purpleSoft}
              label={t("profile.education_hub")}
              onPress={() => router.push("/education")}
            />
            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
            <MenuRow
              icon="language-outline"
              iconColor={theme.accent}
              iconBgColor={theme.accentSoft}
              label={t("profile.language")}
              rightContent={
                <View style={styles.languageToggleContainer}>
                  <TouchableOpacity
                    onPress={() => setLanguage("en")}
                    style={[styles.langBadge, currentLang === "en" && { backgroundColor: theme.accent }]}
                  >
                    <Text style={[styles.langText, currentLang === "en" && styles.activeLangText]}>EN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLanguage("fr")}
                    style={[styles.langBadge, currentLang === "fr" && { backgroundColor: theme.accent }]}
                  >
                    <Text style={[styles.langText, currentLang === "fr" && styles.activeLangText]}>FR</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>

          {/* Support Section */}
          <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("profile.section_support_help", "SUPPORT & HELP")}</Text>
          <View style={[styles.menuListCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <MenuRow
              icon="help-circle"
              iconColor={theme.blue}
              iconBgColor={theme.blueSoft}
              label={t("profile.help_desk")}
              onPress={() => router.push("/help-support")}
            />
          </View>

          {/* Logout Section */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            style={[styles.logoutButton, { backgroundColor: theme.dangerSoft, borderColor: theme.danger + "20" }]}
          >
            <Ionicons name="log-out" size={20} color={theme.danger} />
            <Text style={[styles.logoutButtonText, { color: theme.danger }]}>{t("profile.logout")}</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: theme.muted }]}>{t("profile.version")} 1.1.0</Text>
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerWrapper: {
    zIndex: 10,
    borderBottomWidth: 1,
  },
  backgroundGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
    marginTop: 4,
  },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatarGradientRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 102,
    height: 102,
    borderRadius: 51,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    borderRadius: 999,
    padding: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 3,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bannerCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  bannerGradient: {
    padding: 20,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 17,
    marginTop: 4,
  },
  bannerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 18,
    marginBottom: 20,
  },
  statTile: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginLeft: 8,
    marginBottom: 8,
  },
  menuListCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  menuDivider: {
    height: 1,
  },
  notificationBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unreadCountBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 16,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "800",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 10,
  },
  bottomSpacer: {
    height: 48,
  },
  languageToggleContainer: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },
  langBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
  },
  langText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
  },
  activeLangText: {
    color: "#FFFFFF",
  },
});
