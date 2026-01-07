import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/services/apiClient";
import { useAuthStore } from "@/stores";

export default function TwoFactorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { setToken, setUser } = useAuthStore();

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [tempToken, setTempToken] = useState<string>("");

    useEffect(() => {
        if (params.temp_token) {
            setTempToken(params.temp_token as string);
        } else {
            Alert.alert("Error", "Invalid session. Please login again.");
            router.replace("/(auth)/login");
        }
    }, [params]);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Alert.alert("Error", "Please enter a valid 6-digit code");
            return;
        }

        try {
            setLoading(true);
            const response = await apiClient.post("/auth/2fa/validate", {
                temp_token: tempToken,
                token: otp,
            });

            if (response.data.success) {
                const { user, tokens } = response.data.data;

                // Save tokens and user
                setToken(tokens.access_token);
                setUser(user);

                // Navigate to home
                router.replace("/");
            }
        } catch (error: any) {
            console.error("2FA Validation error:", error);
            const message = error.response?.data?.message || "Verification failed";
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.content}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="shield-checkmark" size={48} color="#00B14F" />
                    </View>
                    <Text style={styles.title}>Two-Factor Authentication</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code from your authenticator app to continue.
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.otpInput}
                        value={otp}
                        onChangeText={setOtp}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                    />

                    <TouchableOpacity
                        style={[styles.verifyButton, loading && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        <Text style={styles.verifyButtonText}>
                            {loading ? "Verifying..." : "Verify Code"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        flex: 1,
        padding: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        marginBottom: 32,
    },
    header: {
        alignItems: "center",
        marginBottom: 48,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(0, 177, 79, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 24,
    },
    form: {
        width: "100%",
    },
    otpInput: {
        width: "100%",
        height: 64,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 32,
        textAlign: "center",
        letterSpacing: 8,
        marginBottom: 32,
        color: "#111827",
        backgroundColor: "#F9FAFB",
    },
    verifyButton: {
        width: "100%",
        height: 56,
        backgroundColor: "#00B14F",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: "#9CA3AF",
        shadowOpacity: 0,
    },
    verifyButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
