// app/(auth)/welcome.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      {/* Background Deep Glows */}
      <LinearGradient
        colors={isDark ? ["#051811", "#080E14"] : ["#E8FDF0", "#F4F7FC"]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Blur Orbs */}
      <View style={[styles.glowOrb1, { backgroundColor: isDark ? "rgba(0, 177, 79, 0.15)" : "rgba(0, 177, 79, 0.08)" }]} />
      <View style={[styles.glowOrb2, { backgroundColor: isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.06)" }]} />

      <View style={styles.inner}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={["#00B14F", "#10B981"]}
            style={styles.logoCircle}
          >
            <Ionicons name="swap-horizontal" size={38} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#0F172A" }]}>
            Afri<Text style={{ color: "#00B14F" }}>X</Text>
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? "#94A3B8" : "#475569" }]}>
            Your premium gate to digital asset exchanges and fast local transfers.
          </Text>
        </View>

        {/* Buttons Card */}
        <View style={[styles.buttonCard, { backgroundColor: isDark ? "rgba(16, 25, 36, 0.85)" : "#FFFFFF", borderColor: isDark ? "#1E2E42" : "#E2E8F0" }]}>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.primaryBtn} onPress={handlePress} activeOpacity={0.85}>
              <LinearGradient
                colors={["#00B14F", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: isDark ? "#1E2E42" : "#E2E8F0", backgroundColor: isDark ? "#162232" : "#F8FAFC" }]}
              onPress={handlePress}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryBtnText, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>Sign In</Text>
              <Ionicons name="log-in-outline" size={18} color={isDark ? "#F8FAFC" : "#0F172A"} />
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={[styles.footerText, { color: isDark ? "#475569" : "#94A3B8" }]}>
          Empowering Africa, one instant transfer at a time.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  glowOrb1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -60,
    right: -60,
  },
  glowOrb2: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    bottom: 80,
    left: -40,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
    paddingHorizontal: 16,
  },
  buttonCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 18,
    overflow: "hidden",
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
  footerText: {
    textAlign: "center",
    marginTop: 48,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
