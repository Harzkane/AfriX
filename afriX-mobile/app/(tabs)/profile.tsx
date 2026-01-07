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
                value={new Date(user.created_at).toLocaleDateString()}
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
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
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
    height: 200,
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
    fontWeight: "700",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#F0FDF4",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#00B14F",
  },
  verificationBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  roleTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  cardContent: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
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
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 8,
  },
  versionText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
