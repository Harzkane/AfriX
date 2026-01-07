// app/(auth)/resend-verification.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";

export default function ResendVerificationScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { resendVerification, clearError } = useAuthStore();

  const router = useRouter();

  const handleResend = async () => {
    setLoading(true);
    setMessage(null);
    clearError();

    try {
      await resendVerification(email);
      // Redirect to check-email screen with the email as param
      router.replace(`/(auth)/check-email?email=${encodeURIComponent(email)}`);
      setMessage("Verification email sent!");
    } catch (err: any) {
      // Show temporary message if needed (optional)
      setMessage(err.message || "Failed to resend verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <View style={styles.inner}>
        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-unread-outline" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Resend Verification</Text>
          <Text style={styles.subtitle}>Enter your email to resend</Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            mode="outlined"
            outlineColor="rgba(0,0,0,0.1)"
            activeOutlineColor="#00B14F"
            textColor="#111827"
            theme={{ colors: { background: '#FFFFFF', onSurfaceVariant: '#6B7280' } }}
          />
          {message && <Text style={styles.message}>{message}</Text>}
          <Button
            mode="contained"
            onPress={handleResend}
            loading={loading}
            style={styles.button}
            contentStyle={{ paddingVertical: 8 }}
            buttonColor="#00B14F"
          >
            Resend Email
          </Button>
        </View>

        <Text style={styles.footerText}>
          Check your spam folder if you don't see the email
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
  input: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  message: {
    textAlign: "center",
    marginVertical: 8,
    color: "#00B14F",
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    elevation: 0,
  },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
});
