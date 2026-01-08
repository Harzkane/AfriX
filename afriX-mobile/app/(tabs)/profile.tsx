// app/(tabs)/profile.tsx
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatDate } from "@/utils/format";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { agentStatus, fetchAgentStats } = useAgentStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchAgentStats();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/welcome");
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B14F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const InfoRow = ({ label, value, icon, color = "#6B7280" }: any) => (
    <View style={styles.infoRow}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const ActionItem = ({
    icon,
    label,
    onPress,
    color = "#111827",
    bgColor = "#F9FAFB",
    showChevron = true,
  }: any) => (
    <TouchableOpacity
      style={styles.actionItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.actionLabel, { color }]}>{label}</Text>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <LinearGradient
            colors={["#00B14F", "#008F40"]}
            style={styles.headerGradient}
          />
          <SafeAreaView edges={["top"]} style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>Profile</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile/edit")}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(user.full_name)}
                  </Text>
                </View>
                <View style={styles.verificationBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={user.email_verified ? "#00B14F" : "#9CA3AF"}
                  />
                </View>
              </View>
              <Text style={styles.userName}>{user.full_name || "User"}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleText}>
                  {user.role?.toUpperCase() || "USER"}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentContainer}>
          {/* Account Status Card */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account Status</Text>
            <View style={styles.cardContent}>
              <InfoRow
                label="Verification Level"
                value={`Level ${user.verification_level || 0}`}
                icon="shield-checkmark"
                color="#00B14F"
              />
              <View style={styles.divider} />
              <InfoRow
                label="Country"
                value={user.country_code || "Not set"}
                icon="earth"
                color="#3B82F6"
              />
              <View style={styles.divider} />
              <InfoRow
                label="Member Since"
                value={formatDate(user.created_at)}
                icon="calendar"
                color="#8B5CF6"
              />
            </View>
          </View>

          {/* Agent Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Agent Center</Text>
            <View style={styles.cardContent}>
              {agentStatus === "active" || user.role === "agent" ? (
                <ActionItem
                  icon="briefcase"
                  label="Switch to Agent Dashboard"
                  onPress={() => router.replace("/agent/dashboard")}
                  color="#7C3AED"
                  bgColor="#F3E8FF"
                />
              ) : agentStatus ? (
                <ActionItem
                  icon="time"
                  label="Check Application Status"
                  onPress={() => router.push("/modals/agent-kyc/status")}
                  color="#F59E0B"
                  bgColor="#FEF3C7"
                />
              ) : (
                <ActionItem
                  icon="briefcase-outline"
                  label="Become an Agent"
                  onPress={() => router.push("/modals/become-agent")}
                  color="#00B14F"
                  bgColor="#DCFCE7"
                />
              )}
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.cardContent}>
              <ActionItem
                icon="lock-closed-outline"
                label="Security"
                onPress={() => router.push("/settings/security")}
              />
              <View style={styles.divider} />
              <ActionItem
                icon="notifications-outline"
                label="Notifications"
                onPress={() => router.push("/settings/notifications")}
              />
              <View style={styles.divider} />
              <ActionItem
                icon="school-outline"
                label="Education Center"
                onPress={() => router.push("/education")}
              />
            </View>
          </View>

          {/* Support & Logout */}
          <View style={styles.sectionCard}>
            <View style={styles.cardContent}>
              <ActionItem
                icon="help-circle-outline"
                label="Help & Support"
                onPress={() => { }}
              />
              <View style={styles.divider} />
              <ActionItem
                icon="log-out-outline"
                label="Logout"
                onPress={handleLogout}
                color="#DC2626"
                bgColor="#FEE2E2"
                showChevron={false}
              />
            </View>
          </View>

          <Text style={styles.versionText}>Version 1.0.0</Text>
          <View style={styles.bottomSpacer} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    marginBottom: 60,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#00B14F",
  },
  verificationBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 12,
  },
  roleTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
    letterSpacing: 0.5,
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  cardContent: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  versionText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 20,
  },
  bottomSpacer: {
    height: 100, // Extra space for lifted tab bar
  },
});
