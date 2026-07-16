// app/(tabs)/profile/edit.tsx
import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  Animated,
  Text,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

// Defined OUTSIDE to prevent focus loss on re-render
function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  editable = true,
  icon,
  theme,
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  autoCapitalize?: "none" | "words" | "sentences";
  editable?: boolean;
  icon: string;
  theme: {
    card: string;
    text: string;
    muted: string;
    border: string;
    inputBg: string;
    placeholder: string;
    accent: string;
  };
}) {
  return (
    <View style={fieldStyles.group}>
      <Text style={[fieldStyles.label, { color: theme.muted }]}>{label}</Text>
      <View
        style={[
          fieldStyles.inputRow,
          {
            backgroundColor: editable ? theme.inputBg : (theme.inputBg + "80"),
            borderColor: editable ? theme.border : (theme.border + "60"),
          },
        ]}
      >
        <View style={[fieldStyles.iconBox, { backgroundColor: editable ? theme.accent + "18" : theme.border + "40" }]}>
          <Ionicons name={icon as any} size={18} color={editable ? theme.accent : theme.muted} />
        </View>
        <TextInput
          style={[fieldStyles.input, { color: editable ? theme.text : theme.muted }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          autoCorrect={false}
        />
        {!editable && (
          <Ionicons name="lock-closed-outline" size={15} color={theme.muted} style={{ marginRight: 14 }} />
        )}
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 0 },
  label: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 18,
    overflow: "hidden",
  },
  iconBox: {
    width: 46, alignSelf: "stretch",
    alignItems: "center", justifyContent: "center",
  },
  input: {
    flex: 1, paddingVertical: 15, paddingHorizontal: 12,
    fontSize: 16, fontWeight: "600",
  },
});

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.25)" : "#FDE68A",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
    placeholder: isDark ? "#475569" : "#9CA3AF",
  };

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert(t("profile.error_title", "Error"), t("profile.error_name_required", "Full name is required"));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const response = await apiClient.put("/users/update", {
        full_name: fullName,
        phone_number: phoneNumber,
      });
      if (response.data.success) {
        setUser(response.data.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t("profile.save_success_title", "Success"), t("profile.save_success_desc", "Profile updated successfully"), [
          { text: t("profile.ok_btn", "OK"), onPress: () => router.back() },
        ]);
      }
    } catch (error: any) {
      Alert.alert(t("profile.error_title", "Error"), error.response?.data?.message || t("profile.error_save_failed", "Failed to update profile"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Collapsible Header */}
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
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("profile.edit_profile_title", "Edit Profile")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("profile.edit_profile_desc", "Update your personal information.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Ambient glow */}
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
            style={styles.glow}
            pointerEvents="none"
          />

          {/* Avatar card */}
          <View style={[styles.avatarCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LinearGradient
              colors={[theme.accent, "#3B82F6"]}
              style={styles.avatarRing}
            >
              <View style={[styles.avatarInner, { backgroundColor: theme.card }]}>
                <Text style={[styles.avatarText, { color: theme.text }]}>
                  {getInitials(user?.full_name)}
                </Text>
              </View>
            </LinearGradient>

            <View style={{ flex: 1 }}>
              <Text style={[styles.avatarName, { color: theme.text }]}>{user?.full_name || t("profile.your_name", "Your Name")}</Text>
              <Text style={[styles.avatarEmail, { color: theme.muted }]}>{user?.email}</Text>

              <View style={styles.badgeRow}>
                {user?.email_verified && (
                  <View style={[styles.badge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
                    <Ionicons name="checkmark-circle" size={11} color={theme.accent} />
                    <Text style={[styles.badgeText, { color: theme.accent }]}>{t("profile.verification_verified", "Verified")}</Text>
                  </View>
                )}
                <View style={[styles.badge, { backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF", borderColor: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE" }]}>
                  <Ionicons name="shield-checkmark-outline" size={11} color="#3B82F6" />
                  <Text style={[styles.badgeText, { color: "#3B82F6" }]}>{t("profile.level_value", "Level {{level}}", { level: user?.verification_level || 0 })}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Editable fields */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("profile.section_personal_info", "Personal Information")}</Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ProfileField
              label={t("profile.fullname_label", "Full Name")}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("profile.fullname_placeholder", "Enter your full name")}
              icon="person-outline"
              theme={theme}
            />
            <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
            <ProfileField
              label={t("profile.phone_label", "Phone Number")}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder={t("profile.phone_placeholder", "+234...")}
              keyboardType="phone-pad"
              autoCapitalize="none"
              icon="call-outline"
              theme={theme}
            />
          </View>

          {/* Phone warning */}
          <View style={[styles.warningBanner, { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder }]}>
            <View style={[styles.warningIconBox, { backgroundColor: theme.amber + "22" }]}>
              <Ionicons name="information-circle-outline" size={16} color={theme.amber} />
            </View>
            <Text style={[styles.warningText, { color: isDark ? "#FCD34D" : "#92400E" }]}>
              {t("profile.phone_change_warning", "Changing your phone number will require re-verification before it becomes active.")}
            </Text>
          </View>

          {/* Read-only fields */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("profile.section_account_details", "Account Details")}</Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ProfileField
              label={t("profile.email_label", "Email Address")}
              value={user?.email || ""}
              placeholder={t("profile.email_placeholder", "Email address")}
              icon="mail-outline"
              editable={false}
              theme={theme}
            />
            <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
            <ProfileField
              label={t("profile.role_label", "Account Role")}
              value={user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || "") || "User"}
              placeholder="Role"
              icon="briefcase-outline"
              editable={false}
              theme={theme}
            />
          </View>

          {/* Info tip */}
          <View style={[styles.infoCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Ionicons name="lock-closed-outline" size={14} color={theme.accent} />
            <Text style={[styles.infoText, { color: isDark ? "#6EE7B7" : "#065F46" }]}>
              {t("profile.readonly_info_tip", "Email and role fields are managed by the system and cannot be changed here. Contact support to update these.")}
            </Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>{t("profile.save_changes_btn", "Save Changes")}</Text>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
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

  avatarCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    borderRadius: 24, padding: 18, marginBottom: 20, borderWidth: 1,
  },
  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    padding: 3, alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  avatarInner: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  avatarName: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3, marginBottom: 2 },
  avatarEmail: { fontSize: 13, fontWeight: "500", marginBottom: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },

  sectionLabel: {
    fontSize: 11, fontWeight: "800", textTransform: "uppercase",
    letterSpacing: 0.8, marginBottom: 10, marginLeft: 4,
  },
  formCard: {
    borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 16,
  },
  cardDivider: { height: 1, marginVertical: 16 },

  warningBanner: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 20,
  },
  warningIconBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  warningText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "500" },

  infoCard: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: "500" },

  saveBtn: {
    height: 58, borderRadius: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
