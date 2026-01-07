// app/(auth)/check-email.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CheckEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  return (
    <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <View style={styles.inner}>
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>We've sent you a reset link</Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          <Text style={styles.message}>
            {email
              ? `We sent a password reset link to ${email}. Follow the instructions to reset your password.`
              : "We sent a password reset link to your email. Follow the instructions to reset your password."}
          </Text>

          <Button
            mode="contained"
            onPress={() => router.replace("/(auth)/login")}
            style={styles.button}
            buttonColor="#00B14F"
            contentStyle={{ paddingVertical: 8 }}
          >
            Back to Login
          </Button>
        </View>

        <Text style={styles.footerText}>
          Didn't receive the email? Check your spam folder
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
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: {
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
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    color: "#374151",
    lineHeight: 24,
  },
  button: {
    borderRadius: 12,
    elevation: 0,
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
});
