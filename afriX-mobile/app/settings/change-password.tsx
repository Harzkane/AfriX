// app/settings/change-password.tsx
import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
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
import * as Haptics from "expo-haptics";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secure: boolean;
  onToggleSecure: () => void;
  theme: {
    muted: string;
    inputBg: string;
    border: string;
    text: string;
    placeholder: string;
  };
}

// Defined OUTSIDE of ChangePasswordScreen component to avoid resetting focus on render
function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  onToggleSecure,
  theme,
}: PasswordFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholder}
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={onToggleSecure} style={styles.eyeBtn} activeOpacity={0.7}>
          <Ionicons
            name={secure ? "eye-outline" : "eye-off-outline"}
            size={22}
            color={theme.muted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, loading } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
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
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
    placeholder: isDark ? "#475569" : "#9CA3AF",
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const handleSubmit = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Enter your current password");
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert("Error", "Enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirmation do not match");
      return;
    }
    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password must be different from current password");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await changePassword(currentPassword, newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Your password has been updated.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/profile") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
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
              <Text style={[styles.headerTitle, { color: theme.text }]}>Change Password</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  Keep your account secure with a new password.
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

        {/* Intro card */}
        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.introEyebrow, { color: theme.accent }]}>PASSWORD SECURITY</Text>
          <Text style={[styles.introTitle, { color: theme.text }]}>Create a stronger password</Text>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            Update your password regularly to keep your account protected across all of your devices.
          </Text>
        </View>

        {/* Inputs card */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>Credentials</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            secure={!showCurrent}
            onToggleSecure={() => setShowCurrent((prev) => !prev)}
            theme={theme}
          />
          <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
          <PasswordField
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="At least 8 characters"
            secure={!showNew}
            onToggleSecure={() => setShowNew((prev) => !prev)}
            theme={theme}
          />
          <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter new password"
            secure={!showConfirm}
            onToggleSecure={() => setShowConfirm((prev) => !prev)}
            theme={theme}
          />
        </View>

        {/* Tip Card */}
        <View style={[styles.tipCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.tipIconBox, { backgroundColor: theme.blue + "22" }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>Password requirements</Text>
            <Text style={[styles.tipDesc, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              Use a mix of upper/lowercase letters, numbers, and symbols to ensure maximum defense against password attacks.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Update Password</Text>
              <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

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
    borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13, fontWeight: "700", marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderRadius: 16,
  },
  input: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 16, fontWeight: "600",
  },
  eyeBtn: { padding: 12 },
  cardDivider: { height: 1, marginVertical: 16 },
  tipCard: {
    flexDirection: "row", gap: 12, padding: 16, borderRadius: 22, borderWidth: 1, marginBottom: 24,
  },
  tipIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  tipTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  tipDesc: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  submitBtn: {
    height: 58, borderRadius: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
