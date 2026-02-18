import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore } from "@/stores";
import { Link, useRouter } from "expo-router";
import { debugAuth } from "@/utils/debugAuth";

const BIOMETRIC_LOGIN_KEY = "biometric_login_enabled";

const COLORS = {
  primary: "#16A34A", // enabled
  disabled: "#9CA3AF", // disabled
  textOnPrimary: "#ffffff",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showBiometricUnlock, setShowBiometricUnlock] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Face ID or Touch ID");
  const [biometricLoading, setBiometricLoading] = useState(false);
  const { login, loading, error, unlockWithBiometric } = useAuthStore();

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("auth_token");
      const bioEnabled = await SecureStore.getItemAsync(BIOMETRIC_LOGIN_KEY);
      if (!token || bioEnabled !== "true") {
        setShowBiometricUnlock(false);
        return;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        setShowBiometricUnlock(false);
        return;
      }
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFace = types.includes(2);
      const hasFinger = types.includes(1);
      setBiometricLabel(
        hasFace && hasFinger ? "Face ID or Touch ID" : hasFace ? "Face ID" : "Touch ID"
      );
      setShowBiometricUnlock(true);
    })();
  }, []);

  const isDisabled = loading || !email || !password;

  const handleBiometricUnlock = async () => {
    setBiometricLoading(true);
    try {
      const success = await unlockWithBiometric();
      if (success) router.replace("/");
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const response: any = await login({ email, password });

      if (response?.requires_2fa) {
        router.push({
          pathname: "/(auth)/two-factor",
          params: { temp_token: response.temp_token }
        });
        return;
      }

      // DEBUG: Verify token was saved
      await debugAuth();

      router.replace("/");
    } catch {
      // error handled in store
    }
  };

  return (
    <LinearGradient
      colors={["#00B14F", "#008F40"]}
      style={{ flex: 1 }}
    >
      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo/Brand Section */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>AfriX</Text>
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Biometric unlock - show when user has stored session + biometric enabled */}
          {showBiometricUnlock && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricUnlock}
              disabled={biometricLoading || loading}
            >
              {biometricLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={24} color="#FFFFFF" style={styles.biometricIcon} />
                  <Text style={styles.biometricButtonText}>
                    Unlock with {biometricLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Card Container */}
          <View style={styles.card}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              outlineColor="rgba(0,0,0,0.1)"
              activeOutlineColor="#00B14F"
              textColor="#111827"
              theme={{ colors: { background: '#FFFFFF', onSurfaceVariant: '#6B7280' } }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              outlineColor="rgba(0,0,0,0.1)"
              activeOutlineColor="#00B14F"
              textColor="#111827"
              theme={{ colors: { background: '#FFFFFF', onSurfaceVariant: '#6B7280' } }}
            />

            {error && <HelperText type="error" style={styles.errorText}>{error}</HelperText>}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={isDisabled}
              buttonColor={isDisabled ? COLORS.disabled : COLORS.primary}
              textColor={COLORS.textOnPrimary}
              style={styles.btn}
              contentStyle={styles.btnContent}
            >
              Login
            </Button>

            <Link href="/(auth)/forgot-password" asChild>
              <Button mode="text" style={styles.linkBtn} textColor="#00B14F">
                Forgot Password?
              </Button>
            </Link>
          </View>

          {/* Bottom Links */}
          <View style={styles.bottomSection}>
            <Link href="/(auth)/resend-verification" asChild>
              <Button mode="text" style={styles.linkBtnWhite} textColor="rgba(255,255,255,0.9)">
                Resend Verification Email
              </Button>
            </Link>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <Button mode="text" style={styles.registerLink} textColor="#FFFFFF" labelStyle={{ fontWeight: '700' }}>
                  Register
                </Button>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
  },

  decorativeCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -50,
    right: -50,
  },

  decorativeCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: 100,
    left: -40,
  },

  brandSection: {
    alignItems: "center",
    marginBottom: 40,
  },

  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },

  logoText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },

  welcomeText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },

  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 20,
    minWidth: 220,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  biometricIcon: {
    marginRight: 10,
  },
  biometricButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },

  input: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },

  errorText: {
    marginBottom: 8,
  },

  btn: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 0,
  },

  btnContent: {
    height: 50,
  },

  linkBtn: {
    marginTop: 12,
    alignSelf: "center",
  },

  bottomSection: {
    alignItems: "center",
  },

  linkBtnWhite: {
    marginBottom: 8,
  },

  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  registerText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
  },

  registerLink: {
    marginLeft: -8,
  },
});
