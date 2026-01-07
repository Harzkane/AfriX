import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useAuthStore } from "@/stores";
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    country_code: "NG",
  });

  const { register, loading, error } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleRegister = async () => {
    try {
      await register(form);
      navigation.navigate("verify", { email: form.email });
    } catch {
      Alert.alert("Error", error || "Registration failed");
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
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitle}>Join the AfriX ecosystem</Text>
          </View>

          {/* Card Container */}
          <View style={styles.card}>
            <TextInput
              label="Full Name"
              value={form.full_name}
              onChangeText={(v) => setForm({ ...form, full_name: v })}
              mode="outlined"
              style={styles.input}
              outlineColor="rgba(0,0,0,0.1)"
              activeOutlineColor="#00B14F"
              textColor="#111827"
              theme={{ colors: { background: '#FFFFFF', onSurfaceVariant: '#6B7280' } }}
            />

            <TextInput
              label="Email Address"
              value={form.email}
              onChangeText={(v) => setForm({ ...form, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              style={styles.input}
              outlineColor="rgba(0,0,0,0.1)"
              activeOutlineColor="#00B14F"
              textColor="#111827"
              theme={{ colors: { background: '#FFFFFF', onSurfaceVariant: '#6B7280' } }}
            />

            <TextInput
              label="Password"
              value={form.password}
              onChangeText={(v) => setForm({ ...form, password: v })}
              secureTextEntry
              mode="outlined"
              style={styles.input}
              outlineColor="rgba(0,0,0,0.1)"
              activeOutlineColor="#00B14F"
              textColor="#111827"
              theme={{ colors: { background: '#FFFFFF', onSurfaceVariant: '#6B7280' } }}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              mode="contained"
              loading={loading}
              onPress={handleRegister}
              style={styles.button}
              contentStyle={{ paddingVertical: 6 }}
              buttonColor="#00B14F"
            >
              Create Account
            </Button>
          </View>

          {/* Bottom Links */}
          <View style={styles.bottomSection}>
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Button mode="text" style={styles.loginLink} textColor="#FFFFFF" labelStyle={{ fontWeight: '700' }}>
                  Login
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

  button: {
    marginTop: 12,
    borderRadius: 12,
    elevation: 0,
  },

  errorText: {
    color: "#EF4444",
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },

  bottomSection: {
    alignItems: "center",
  },

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  loginText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
  },

  loginLink: {
    marginLeft: -8,
  },
});
