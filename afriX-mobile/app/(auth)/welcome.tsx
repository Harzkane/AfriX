// app/(auth)/welcome.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function WelcomeScreen() {
  return (
    <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <View style={styles.inner}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>AfriX</Text>
          </View>
          <Text style={styles.title}>AfriX</Text>
          <Text style={styles.subtitle}>
            Your secure gateway to digital assets
          </Text>
        </View>

        {/* Buttons Card */}
        <View style={styles.buttonCard}>
          <Link href="/(auth)/register" asChild>
            <Button
              mode="contained"
              style={styles.primaryBtn}
              buttonColor="#00B14F"
              contentStyle={{ paddingVertical: 8 }}
            >
              Get Started
            </Button>
          </Link>

          <Link href="/(auth)/login" asChild>
            <Button
              mode="outlined"
              style={styles.secondaryBtn}
              textColor="#00B14F"
              contentStyle={{ paddingVertical: 8 }}
            >
              Login
            </Button>
          </Link>
        </View>

        <Text style={styles.footerText}>
          Empowering Africa, one token at a time
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeCircle1: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -80,
    right: -80,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: 120,
    left: -60,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 44,
    fontWeight: "700",
    textAlign: "center",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    color: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
  },
  buttonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    gap: 16,
  },
  primaryBtn: {
    borderRadius: 12,
    elevation: 0,
  },
  secondaryBtn: {
    borderRadius: 12,
    borderColor: "#00B14F",
    borderWidth: 2,
  },
  footerText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
});
