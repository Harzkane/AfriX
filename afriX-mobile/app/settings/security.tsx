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

    const handleBiometricToggle = async (value: boolean) => {
        if (value) {
            setBiometricLoading(true);
            try {
                if (Constants.appOwnership === "expo") {
                    Alert.alert(
                        "Use a development build",
                        "Biometric login does not work in Expo Go. Build the app with: npx expo run:ios"
                    );
                    setBiometricLoading(false);
                    return;
                }

                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();

                if (!hasHardware || !isEnrolled) {
                    Alert.alert(
                        "Not available",
                        "Biometric login is not available on this device. Set up Face ID or Touch ID in your device settings first."
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
                            "Biometric authentication failed. Try again when your device biometrics are available."
                        );
                    }
                }
            } catch {
                setBiometricsEnabled(false);
                Alert.alert(
                    "Couldn’t enable",
                    "Biometric login could not be enabled on this device."
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
            try {
                setLoading(true);
                const response = await apiClient.post("/auth/2fa/setup");
                if (response.data.success) {
                    setQrCode(response.data.data.qr_code);
                    setSecret(response.data.data.secret);
                    setShow2FAModal(true);
                }
            } catch (error) {
                console.error("Setup 2FA error:", error);
                Alert.alert("Error", "Failed to initiate 2FA setup");
            } finally {
                setLoading(false);
            }
        } else {
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
        tint = "#4B5563",
        iconBg = "#F3F4F6",
    }: any) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={type === "switch"}
            activeOpacity={0.7}
        >
            <View style={[styles.settingIcon, { backgroundColor: iconBg }]}>
                <Ionicons name={icon} size={20} color={tint} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
            </View>
            {type === "switch" ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    disabled={disabled}
                    trackColor={{ false: "#E5E7EB", true: "#00B14F" }}
                    thumbColor="#FFFFFF"
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
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Security</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={["#F7FFF9", "#FFFFFF"]}
                    style={styles.summaryCard}
                >
                    <Text style={styles.summaryEyebrow}>Account Protection</Text>
                    <Text style={styles.summaryTitle}>Strengthen how your account stays secure</Text>
                    <Text style={styles.summaryText}>
                        Manage biometric login, two-factor authentication, and password controls from one protected place.
                    </Text>
                </LinearGradient>

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
                            tint="#00B14F"
                            iconBg="#ECFDF3"
                        />
                        <View style={styles.divider} />
                        <SettingItem
                            icon="shield-checkmark-outline"
                            title="Two-Factor Auth (2FA)"
                            subtitle="Add an extra layer of login security"
                            value={twoFactorEnabled}
                            onValueChange={handle2FAToggle}
                            tint="#3B82F6"
                            iconBg="#EFF6FF"
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
                            tint="#8B5CF6"
                            iconBg="#F3E8FF"
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
                            tint="#F59E0B"
                            iconBg="#FEF3C7"
                        />
                    </View>
                </View>
            </ScrollView>

            <Modal visible={show2FAModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Setup 2FA</Text>
                        <TouchableOpacity onPress={() => setShow2FAModal(false)}>
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.stepText}>
                            1. Scan this QR code with your authenticator app.
                        </Text>
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
                            <Text style={styles.verifyButtonText}>
                                {loading ? "Verifying..." : "Verify & Enable"}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>

            <Modal visible={showDisable2FAModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Disable 2FA</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setShowDisable2FAModal(false);
                                setDisablePassword("");
                                setDisableOtp("");
                            }}
                        >
                            <Ionicons name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.stepText}>
                            Enter your account password. You can also add the current 6-digit authenticator code for extra verification.
                        </Text>

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
                            onChangeText={(text) => setDisableOtp(text.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <TouchableOpacity
                            style={[styles.verifyButton, loading && styles.buttonDisabled]}
                            onPress={handleDisable2FASubmit}
                            disabled={loading}
                        >
                            <Text style={styles.verifyButtonText}>
                                {loading ? "Disabling..." : "Disable 2FA"}
                            </Text>
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
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 58,
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
        // height: 120,
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
        fontSize: 22,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.4,
    },
    headerSpacer: {
        width: 40,
    },
    summaryCard: {
        borderRadius: 22,
        padding: 18,
        marginTop: -22,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#E6F4EA",
    },
    summaryEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
        letterSpacing: -0.5,
    },
    summaryText: {
        fontSize: 13,
        lineHeight: 20,
        color: "#6B7280",
        fontWeight: "500",
        marginTop: 6,
    },
    section: {
        marginBottom: 18,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: "800",
        color: "#6B7280",
        marginBottom: 10,
        marginLeft: 4,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 12,
        color: "#6B7280",
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginLeft: 68,
    },
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
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
    },
    modalContent: {
        padding: 24,
        alignItems: "center",
    },
    stepText: {
        fontSize: 15,
        color: "#374151",
        textAlign: "center",
        marginBottom: 20,
        fontWeight: "500",
        lineHeight: 22,
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
        width: "100%",
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 8,
        fontWeight: "600",
    },
    secretCodeTouchable: {
        width: "100%",
        backgroundColor: "#F3F4F6",
        padding: 12,
        borderRadius: 12,
        marginBottom: 32,
        alignItems: "center",
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
        minHeight: 56,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        textAlign: "center",
        letterSpacing: 6,
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
