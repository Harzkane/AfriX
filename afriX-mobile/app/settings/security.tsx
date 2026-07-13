// app/settings/security.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Image,
  useColorScheme,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";

const BIOMETRIC_LOGIN_KEY = "biometric_login_enabled";

export default function SecurityScreen() {
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
    purple: "#8B5CF6",
    purpleSoft: isDark ? "rgba(139,92,246,0.12)" : "#F3E8FF",
    purpleBorder: isDark ? "rgba(139,92,246,0.25)" : "#DDD6FE",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.25)" : "#FDE68A",
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    redBorder: isDark ? "rgba(239,68,68,0.25)" : "#FEE2E2",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
    placeholder: isDark ? "#475569" : "#9CA3AF",
    modalBg: isDark ? "#0E1726" : "#FFFFFF",
    modalBorder: isDark ? "#1E2A3A" : "#E2E8F0",
  };

  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableOtp, setDisableOtp] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [otp, setOtp] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(BIOMETRIC_LOGIN_KEY).then((v) => {
      setBiometricsEnabled(v === "true");
    });
  }, []);

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      setBiometricLoading(true);
      try {
        if (Constants.appOwnership === "expo") {
          Alert.alert("Use a development build", "Biometric login doesn't work in Expo Go. Build the app with: npx expo run:ios");
          setBiometricLoading(false);
          return;
        }
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          Alert.alert("Not available", "Biometric login is not available on this device. Set up Face ID or Touch ID in your device settings first.");
          setBiometricLoading(false);
          return;
        }
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Verify identity to enable biometric login",
          cancelLabel: "Cancel",
          fallbackLabel: "Use password",
          disableDeviceFallback: true,
        });
        if (result.success) {
          await SecureStore.setItemAsync(BIOMETRIC_LOGIN_KEY, "true");
          setBiometricsEnabled(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setBiometricsEnabled(false);
          const err = (result as { error?: string }).error;
          if (err === "user_cancel" || err === "system_cancel") {
            Alert.alert("Cancelled", "Authentication was cancelled.");
          } else if (err === "lockout") {
            Alert.alert("Try again later", "Too many failed attempts. Use your device passcode to unlock, then try again.");
          } else {
            Alert.alert("Couldn't enable", "Biometric authentication failed. Try again when your device biometrics are available.");
          }
        }
      } catch {
        setBiometricsEnabled(false);
        Alert.alert("Couldn't enable", "Biometric login could not be enabled on this device.");
      } finally {
        setBiometricLoading(false);
      }
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_LOGIN_KEY);
      setBiometricsEnabled(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handle2FAToggle = async (value: boolean) => {
    if (value) {
      try {
        setLoading(true);
        const response = await apiClient.post("/auth/2fa/setup");
        if (response.data.success) {
          setQrCode(response.data.data.qr_code);
          setSecret(response.data.data.secret);
          setShow2FAModal(true);
        }
      } catch {
        Alert.alert("Error", "Failed to initiate 2FA setup");
      } finally {
        setLoading(false);
      }
    } else {
      setDisablePassword("");
      setDisableOtp("");
      setShowDisable2FAModal(true);
    }
  };

  const handleDisable2FASubmit = async () => {
    if (!disablePassword.trim()) {
      Alert.alert("Error", "Enter your account password.");
      return;
    }
    try {
      setLoading(true);
      const body: { password: string; token?: string } = { password: disablePassword.trim() };
      if (disableOtp.trim().length === 6) body.token = disableOtp.trim();
      await apiClient.post("/auth/2fa/disable", body);
      setTwoFactorEnabled(false);
      if (user) setUser({ ...user, two_factor_enabled: false });
      setShowDisable2FAModal(false);
      setDisablePassword("");
      setDisableOtp("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "2FA disabled successfully");
    } catch {
      Alert.alert("Couldn't disable 2FA", "Check your password and 6-digit code, then try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }
    try {
      setLoading(true);
      await apiClient.post("/auth/2fa/verify", { token: otp });
      setTwoFactorEnabled(true);
      if (user) setUser({ ...user, two_factor_enabled: true });
      setShow2FAModal(false);
      setOtp("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Two-Factor Authentication enabled!");
    } catch {
      Alert.alert("Error", "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reusable row components
  const SwitchRow = ({
    icon, iconColor, iconBg, title, subtitle, value, onValueChange, disabled = false,
  }: {
    icon: string; iconColor: string; iconBg: string;
    title: string; subtitle: string;
    value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean;
  }) => (
    <View style={[styles.settingRow, { borderColor: theme.divider }]}>
      <View style={[styles.settingIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: theme.muted }]}>{subtitle}</Text>
      </View>
      {disabled ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: isDark ? "#1E2A3A" : "#E2E8F0", true: theme.accent }}
          thumbColor="#FFFFFF"
        />
      )}
    </View>
  );

  const LinkRow = ({
    icon, iconColor, iconBg, title, subtitle, onPress,
  }: {
    icon: string; iconColor: string; iconBg: string;
    title: string; subtitle: string; onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderColor: theme.divider }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.settingIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: theme.muted }]}>{subtitle}</Text>
      </View>
      <View style={[styles.chevronBox, { backgroundColor: isDark ? "#111C2B" : "#F1F5F9" }]}>
        <Ionicons name="chevron-forward" size={16} color={theme.muted} />
      </View>
    </TouchableOpacity>
  );

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
              onPress={() => router.replace("/(tabs)/profile")}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Security</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  Manage authentication and account protection.
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
        {/* Ambient glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* Intro card */}
        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.introEyebrow, { color: theme.accent }]}>ACCOUNT PROTECTION</Text>
          <Text style={[styles.introTitle, { color: theme.text }]}>Keep your account secure</Text>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            Manage biometric login, two-factor authentication, and password controls — all from one protected place.
          </Text>
        </View>

        {/* ── Authentication ── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>Authentication</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SwitchRow
            icon="finger-print-outline"
            iconColor={theme.accent}
            iconBg={theme.accentSoft}
            title="Biometric Login"
            subtitle="Use Face ID or Touch ID to unlock the app"
            value={biometricsEnabled}
            onValueChange={handleBiometricToggle}
            disabled={biometricLoading}
          />
          <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
          <SwitchRow
            icon="shield-checkmark-outline"
            iconColor={theme.blue}
            iconBg={theme.blueSoft}
            title="Two-Factor Auth (2FA)"
            subtitle="Add an extra layer of login security"
            value={twoFactorEnabled}
            onValueChange={handle2FAToggle}
          />
        </View>

        {/* 2FA status banner */}
        {twoFactorEnabled && (
          <View style={[styles.infoBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <View style={[styles.infoBannerIcon, { backgroundColor: theme.accent + "30" }]}>
              <Ionicons name="shield-checkmark" size={16} color={theme.accent} />
            </View>
            <Text style={[styles.infoBannerText, { color: isDark ? "#6EE7B7" : "#065F46" }]}>
              Two-factor authentication is active. Your account has an extra layer of protection.
            </Text>
          </View>
        )}

        {/* ── Password ── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>Password</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LinkRow
            icon="key-outline"
            iconColor={theme.purple}
            iconBg={theme.purpleSoft}
            title="Change Password"
            subtitle="Update your account password securely"
            onPress={() => router.push("/settings/change-password")}
          />
        </View>

        {/* ── Devices ── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>Devices</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LinkRow
            icon="phone-portrait-outline"
            iconColor={theme.amber}
            iconBg={theme.amberSoft}
            title="Manage Devices"
            subtitle="See all devices logged into your account"
            onPress={() => Alert.alert("Coming Soon", "Device management is coming soon.")}
          />
        </View>

        {/* Tips card */}
        <View style={[styles.tipsCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={styles.tipsHeader}>
            <View style={[styles.tipsIconBox, { backgroundColor: theme.blue + "22" }]}>
              <Ionicons name="bulb-outline" size={16} color={theme.blue} />
            </View>
            <Text style={[styles.tipsTitle, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>Security tips</Text>
          </View>
          {[
            "Enable biometrics for fast, secure access without typing your password.",
            "2FA significantly reduces the risk of unauthorized account access.",
            "Never share your OTP or password with anyone, including support staff.",
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: theme.blue }]} />
              <Text style={[styles.tipText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* ── Setup 2FA Modal ── */}
      <Modal visible={show2FAModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Setup 2FA</Text>
                <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                  Scan the QR code or enter the key manually
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? "#111C2B" : "#F1F5F9", borderColor: theme.border }]}
                onPress={() => setShow2FAModal(false)}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.modalStepCard, { backgroundColor: isDark ? "#111C2B" : "#F8FAFC", borderColor: theme.border }]}>
              <View style={[styles.modalStepBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
                <Text style={[styles.modalStepNum, { color: theme.accent }]}>01</Text>
              </View>
              <Text style={[styles.modalStepText, { color: theme.text }]}>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </Text>
            </View>

            {/* QR Code */}
            <View style={[styles.qrWrapper, { backgroundColor: "#FFFFFF", borderColor: theme.border }]}>
              {qrCode ? (
                <Image source={{ uri: qrCode }} style={styles.qrImage} />
              ) : (
                <View style={[styles.qrPlaceholder, { backgroundColor: isDark ? "#1E2A3A" : "#F3F4F6" }]} />
              )}
            </View>

            {/* Manual code */}
            <View style={[styles.modalStepCard, { backgroundColor: isDark ? "#111C2B" : "#F8FAFC", borderColor: theme.border }]}>
              <View style={[styles.modalStepBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
                <Text style={[styles.modalStepNum, { color: theme.accent }]}>02</Text>
              </View>
              <Text style={[styles.modalStepText, { color: theme.text }]}>
                Or enter this setup key manually in your authenticator app
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.secretBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              onPress={async () => {
                if (!secret) return;
                await Clipboard.setStringAsync(secret);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Copied", "2FA setup key copied to clipboard");
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.secretCode, { color: theme.text }]} selectable>{secret}</Text>
              <View style={styles.copyHintRow}>
                <Ionicons name="copy-outline" size={14} color={theme.accent} />
                <Text style={[styles.copyHintText, { color: theme.accent }]}>Tap to copy</Text>
              </View>
            </TouchableOpacity>

            {/* OTP entry */}
            <View style={[styles.modalStepCard, { backgroundColor: isDark ? "#111C2B" : "#F8FAFC", borderColor: theme.border }]}>
              <View style={[styles.modalStepBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
                <Text style={[styles.modalStepNum, { color: theme.accent }]}>03</Text>
              </View>
              <Text style={[styles.modalStepText, { color: theme.text }]}>
                Enter the 6-digit code shown in your authenticator app
              </Text>
            </View>

            <TextInput
              style={[styles.otpInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={otp}
              onChangeText={setOtp}
              placeholder="000000"
              placeholderTextColor={theme.placeholder}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.6 }]}
              onPress={verifyAndEnable2FA}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.primaryBtnText}>Verify &amp; Enable</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Disable 2FA Modal ── */}
      <Modal visible={showDisable2FAModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: theme.modalBg }]}>
          <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Disable 2FA</Text>
                <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                  Confirm your identity to remove 2FA
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? "#111C2B" : "#F1F5F9", borderColor: theme.border }]}
                onPress={() => { setShowDisable2FAModal(false); setDisablePassword(""); setDisableOtp(""); }}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Warning banner */}
            <View style={[styles.warnBanner, { backgroundColor: theme.redSoft, borderColor: theme.redBorder }]}>
              <Ionicons name="warning-outline" size={18} color={theme.red} />
              <Text style={[styles.warnBannerText, { color: theme.red }]}>
                Disabling 2FA reduces your account security. Only proceed if you intend to remove this protection.
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: theme.muted }]}>Account password</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={disablePassword}
              onChangeText={setDisablePassword}
              placeholder="Enter your password"
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.inputLabel, { color: theme.muted }]}>6-digit code (optional)</Text>
            <TextInput
              style={[styles.otpInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={disableOtp}
              onChangeText={(t) => setDisableOtp(t.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={theme.placeholder}
              keyboardType="number-pad"
              maxLength={6}
            />

            <TouchableOpacity
              style={[styles.dangerBtn, loading && { opacity: 0.6 }]}
              onPress={handleDisable2FASubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Text style={styles.primaryBtnText}>Disable 2FA</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
    borderRadius: 22, borderWidth: 1, marginBottom: 20, overflow: "hidden",
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
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: "700", marginBottom: 3 },
  settingSubtitle: { fontSize: 12, lineHeight: 18, fontWeight: "500" },
  cardDivider: { height: 1, marginHorizontal: 16 },
  chevronBox: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  infoBanner: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1,
    marginTop: -12, marginBottom: 20,
  },
  infoBannerIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoBannerText: { flex: 1, fontSize: 13, fontWeight: "500", lineHeight: 19 },
  tipsCard: {
    borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 8,
  },
  tipsHeader: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12,
  },
  tipsIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  tipsTitle: { fontSize: 14, fontWeight: "800" },
  tipRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8,
  },
  tipDot: {
    width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "500" },

  // Modal styles
  modalContainer: { flex: 1 },
  modalHeaderRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingBottom: 16, paddingTop: 8,
  },
  modalTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, fontWeight: "500" },
  modalCloseBtn: {
    width: 38, height: 38, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalContent: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40,
  },
  modalStepCard: {
    flexDirection: "row", gap: 12, alignItems: "flex-start",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 14,
  },
  modalStepBadge: {
    width: 34, height: 34, borderRadius: 10, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  modalStepNum: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  modalStepText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  qrWrapper: {
    alignSelf: "center", padding: 16, borderRadius: 20, borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  qrImage: { width: 180, height: 180 },
  qrPlaceholder: { width: 180, height: 180, borderRadius: 12 },
  secretBox: {
    borderRadius: 18, borderWidth: 1, padding: 16,
    alignItems: "center", marginBottom: 16,
  },
  secretCode: {
    fontSize: 22, fontWeight: "800", letterSpacing: 4,
  },
  copyHintRow: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8,
  },
  copyHintText: { fontSize: 13, fontWeight: "700" },
  otpInput: {
    height: 60, borderWidth: 1.5, borderRadius: 18,
    paddingHorizontal: 16, fontSize: 28, textAlign: "center",
    fontWeight: "800", letterSpacing: 8, marginBottom: 20,
  },
  formInput: {
    height: 54, borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: 16, fontSize: 16, marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12, fontWeight: "800", textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 8,
  },
  primaryBtn: {
    height: 58, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  dangerBtn: {
    height: 58, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  primaryBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  warnBanner: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 20,
  },
  warnBannerText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 19 },
});
