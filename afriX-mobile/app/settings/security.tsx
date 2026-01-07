import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";

export default function SecurityScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(
        user?.two_factor_enabled || false
    );

    const [show2FAModal, setShow2FAModal] = useState(false);
    const [qrCode, setQrCode] = useState("");
    const [otp, setOtp] = useState("");
    const [secret, setSecret] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"setup" | "verify">("setup");

    const handleBiometricToggle = (value: boolean) => {
        setBiometricsEnabled(value);
        // TODO: Implement biometric storage logic
    };

    const handle2FAToggle = async (value: boolean) => {
        if (value) {
            // Enable 2FA
            try {
                setLoading(true);
                const response = await apiClient.post("/auth/2fa/setup");
                if (response.data.success) {
                    setQrCode(response.data.data.qr_code);
                    setSecret(response.data.data.secret);
                    setStep("setup");
                    setShow2FAModal(true);
                }
            } catch (error) {
                console.error("Setup 2FA error:", error);
                Alert.alert("Error", "Failed to initiate 2FA setup");
            } finally {
                setLoading(false);
            }
        } else {
            // Disable 2FA
            Alert.prompt(
                "Disable 2FA",
                "Enter your password to disable 2FA",
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Disable",
                        onPress: async (password?: string) => {
                            if (!password) return;
                            try {
                                await apiClient.post("/auth/2fa/disable", { password });
                                setTwoFactorEnabled(false);
                                if (user) setUser({ ...user, two_factor_enabled: false });
                                Alert.alert("Success", "2FA disabled successfully");
                            } catch (error) {
                                console.error("Disable 2FA error:", error);
                                Alert.alert("Error", "Failed to disable 2FA. Check your password.");
                            }
                        },
                    },
                ],
                "secure-text"
            );
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
            Alert.alert("Success", "Two-Factor Authentication enabled!");
        } catch (error) {
            console.error("Verify 2FA error:", error);
            Alert.alert("Error", "Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const SettingItem = ({
        icon,
        title,
        subtitle,
        value,
        onValueChange,
        type = "switch",
        onPress,
    }: any) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={type === "switch"}
            activeOpacity={0.7}
        >
            <View style={styles.settingIcon}>
                <Ionicons name={icon} size={22} color="#4B5563" />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {type === "switch" ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: "#E5E7EB", true: "#00B14F" }}
                    thumbColor={"#FFFFFF"}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Security</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Authentication</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="finger-print-outline"
                            title="Biometric Login"
                            subtitle="Use FaceID or TouchID to log in"
                            value={biometricsEnabled}
                            onValueChange={handleBiometricToggle}
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="shield-checkmark-outline"
                            title="Two-Factor Auth (2FA)"
                            subtitle="Add an extra layer of security"
                            value={twoFactorEnabled}
                            onValueChange={handle2FAToggle}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Password</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="key-outline"
                            title="Change Password"
                            subtitle="Update your account password"
                            type="link"
                            onPress={() => router.push("/(auth)/forgot-password")}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Devices</Text>
                    <View style={styles.card}>
                        <SettingItem
                            icon="phone-portrait-outline"
                            title="Manage Devices"
                            subtitle="See devices logged into your account"
                            type="link"
                            onPress={() =>
                                Alert.alert("Coming Soon", "Device management coming soon")
                            }
                        />
                    </View>
                </View>
            </ScrollView>

            {/* 2FA Setup Modal */}
            <Modal visible={show2FAModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Setup 2FA</Text>
                        <TouchableOpacity onPress={() => setShow2FAModal(false)}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.stepText}>1. Scan this QR code with your Authenticator App (Google Auth, Authy, etc.)</Text>
                        {qrCode ? (
                            <Image source={{ uri: qrCode }} style={styles.qrCode} />
                        ) : (
                            <View style={styles.qrPlaceholder} />
                        )}

                        <Text style={styles.secretText}>Or enter this code manually:</Text>
                        <TouchableOpacity onPress={() => {
                            // Copy to clipboard logic here if needed
                        }}>
                            <Text style={styles.secretCode}>{secret}</Text>
                        </TouchableOpacity>

                        <Text style={styles.stepText}>2. Enter the 6-digit code from the app</Text>
                        <TextInput
                            style={styles.otpInput}
                            value={otp}
                            onChangeText={setOtp}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <TouchableOpacity
                            style={[styles.verifyButton, loading && styles.buttonDisabled]}
                            onPress={verifyAndEnable2FA}
                            disabled={loading}
                        >
                            <Text style={styles.verifyButtonText}>{loading ? "Verifying..." : "Verify & Enable"}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerWrapper: {
        marginBottom: 20,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 20,
        marginTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    content: {
        padding: 20,
        marginTop: -10,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 12,
        marginLeft: 4,
        textTransform: "uppercase",
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111827",
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 12,
        color: "#6B7280",
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginLeft: 64,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
    },
    modalContent: {
        padding: 24,
        alignItems: "center",
    },
    stepText: {
        fontSize: 16,
        color: "#374151",
        textAlign: "center",
        marginBottom: 20,
        fontWeight: "500",
    },
    qrCode: {
        width: 200,
        height: 200,
        marginBottom: 24,
    },
    qrPlaceholder: {
        width: 200,
        height: 200,
        backgroundColor: "#F3F4F6",
        marginBottom: 24,
        borderRadius: 12,
    },
    secretText: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 8,
    },
    secretCode: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: 2,
        marginBottom: 32,
        backgroundColor: "#F3F4F6",
        padding: 12,
        borderRadius: 8,
        overflow: "hidden",
    },
    otpInput: {
        width: "100%",
        height: 56,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 24,
        textAlign: "center",
        letterSpacing: 8,
        marginBottom: 24,
        color: "#111827",
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
