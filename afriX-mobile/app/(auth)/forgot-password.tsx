// app/(auth)/forgot-password.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, Button, Text, HelperText } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { forgotPassword, clearError } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setMessage("Email is required");
      return;
    }

    setLoading(true);
    setMessage(null);
    clearError();

    try {
      await forgotPassword(email);
      router.replace(`/(auth)/check-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setMessage(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#00B14F", "#008F40"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Forgot Password</Text>

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

        <HelperText type="info" style={styles.subtitle}>
          Enter your registered email
        </HelperText>

        {message && <Text style={styles.message}>{message}</Text>}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={!email.trim() || loading}
          style={!email.trim() || loading ? styles.disabledBtn : styles.btn}
          contentStyle={{ paddingVertical: 6 }}
        >
          Send Reset Link
        </Button>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center" },
  title: {
    fontSize: 30,
    marginBottom: 24,
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
  },
  input: { marginBottom: 16 },
  message: { textAlign: "center", marginVertical: 8, color: "#D9534F" },

  // real button styles
  btn: {
    backgroundColor: "#00B14F",
    marginTop: 12,
    borderRadius: 8,
  },
  disabledBtn: {
    backgroundColor: "#9CA3AF",
    marginTop: 12,
    borderRadius: 8,
  },
});
