import React, { useState, useEffect } from "react";
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
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";

const BIOMETRIC_LOGIN_KEY = "biometric_login_enabled";

export default function SecurityScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [biometricLoading, setBiometricLoading] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(
        user?.two_factor_enabled || false
    );

    useEffect(() => {
        SecureStore.getItemAsync(BIOMETRIC_LOGIN_KEY).then((value) => {
            setBiometricsEnabled(value === "true");
        });
    }, []);

    const [show2FAModal, setShow2FAModal] = useState(false);
    const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
    const [disablePassword, setDisablePassword] = useState("");
    const [disableOtp, setDisableOtp] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [otp, setOtp] = useState("");
    const [secret, setSecret] = useState("");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"setup" | "verify">("setup");

    const handleBiometricToggle = async (value: boolean) => {
        if (value) {
            setBiometricLoading(true);
            try {
                // Face ID is not supported in Expo Go – require a development build
                if (Constants.appOwnership === "expo") {
                    Alert.alert(
                        "Use a development build",
                        "Biometric login (Face ID / Touch ID) does not work in Expo Go. Build the app with: npx expo run:ios"
                    );
                    setBiometricLoading(false);
                    return;
                }
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                if (!hasHardware || !isEnrolled) {
                    Alert.alert(
                        "Not available",
                        "Biometric login is not available on this device. Set up Face ID or Touch ID in your device settings. If you use Expo Go, you need a development build (npx expo run:ios) for Face ID."
                    );
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
                } else {
                    setBiometricsEnabled(false);
                    const errorMsg = (result as { error?: string }).error;
                    if (errorMsg === "user_cancel" || errorMsg === "system_cancel") {
                        Alert.alert("Cancelled", "Authentication was cancelled.");
                    } else if (errorMsg === "lockout") {
                        Alert.alert(
                            "Try again later",
                            "Too many failed attempts. Use your device passcode to unlock, then try again."
                        );
                    } else {
                        Alert.alert(
                            "Couldn’t enable",
                            "Biometric authentication failed. Try again or use a development build if you are testing."
                        );
                    }
                }
            } catch {
                setBiometricsEnabled(false);
                Alert.alert(
                    "Couldn’t enable",
                    "Biometric login could not be enabled. If you use Expo Go, build the app with: npx expo run:ios"
                );
            } finally {
                setBiometricLoading(false);
            }
        } else {
            await SecureStore.deleteItemAsync(BIOMETRIC_LOGIN_KEY);
            setBiometricsEnabled(false);
        }
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
            // Disable 2FA: show modal for password + optional 6-digit code
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
            Alert.alert("Success", "2FA disabled successfully");
        } catch {
            Alert.alert(
                "Couldn’t disable 2FA",
                "Check your password and 6-digit code, then try again."
            );
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
        disabled = false,
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
                    disabled={disabled}
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
                            onPress={() => router.replace("/(tabs)/profile")}
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
                            subtitle="Use Face ID or Touch ID to unlock the app"
                            value={biometricsEnabled}
                            onValueChange={handleBiometricToggle}
                            disabled={biometricLoading}
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
                            onPress={() => router.push("/settings/change-password")}
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
                        <TouchableOpacity
                            style={styles.secretCodeTouchable}
                            onPress={async () => {
                                if (!secret) return;
                                await Clipboard.setStringAsync(secret);
                                Alert.alert("Copied", "2FA code copied to clipboard");
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secretCode} selectable>{secret}</Text>
                            <View style={styles.copyHint}>
                                <Ionicons name="copy-outline" size={16} color="#6B7280" />
                                <Text style={styles.copyHintText}>Tap to copy</Text>
                            </View>
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

            {/* Disable 2FA Modal */}
            <Modal visible={showDisable2FAModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Disable 2FA</Text>
                        <TouchableOpacity onPress={() => { setShowDisable2FAModal(false); setDisablePassword(""); setDisableOtp(""); }}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.stepText}>Enter your account password. You can also enter the current 6-digit code from your authenticator app for extra verification.</Text>
                        <Text style={styles.secretText}>Account password</Text>
                        <TextInput
                            style={styles.otpInput}
                            value={disablePassword}
                            onChangeText={setDisablePassword}
                            placeholder="Password"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Text style={styles.secretText}>6-digit code (optional)</Text>
                        <TextInput
                            style={styles.otpInput}
                            value={disableOtp}
                            onChangeText={(t) => setDisableOtp(t.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                        <TouchableOpacity
                            style={[styles.verifyButton, loading && styles.buttonDisabled]}
                            onPress={handleDisable2FASubmit}
                            disabled={loading}
                        >
                            <Text style={styles.verifyButtonText}>{loading ? "Disabling..." : "Disable 2FA"}</Text>
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
        zIndex: 10,
        elevation: 8,
        backgroundColor: "#00B14F",
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
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
        paddingTop: 40,
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
    secretCodeTouchable: {
        backgroundColor: "#F3F4F6",
        padding: 12,
        borderRadius: 8,
        marginBottom: 32,
    },
    secretCode: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: 2,
        overflow: "hidden",
    },
    copyHint: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    copyHintText: {
        fontSize: 13,
        color: "#6B7280",
        marginLeft: 6,
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
