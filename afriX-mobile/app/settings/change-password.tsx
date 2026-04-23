import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const { changePassword, loading } = useAuthStore();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async () => {
        if (!currentPassword.trim()) {
            Alert.alert("Error", "Enter your current password");
            return;
        }
        if (!newPassword.trim()) {
            Alert.alert("Error", "Enter a new password");
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Error", "New password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New password and confirmation do not match");
            return;
        }
        if (currentPassword === newPassword) {
            Alert.alert("Error", "New password must be different from current password");
            return;
        }

        try {
            await changePassword(currentPassword, newPassword);
            Alert.alert("Success", "Your password has been updated.", [
                { text: "OK", onPress: () => router.replace("/(tabs)/profile") },
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to change password");
        }
    };

    const PasswordField = ({
        label,
        value,
        onChangeText,
        placeholder,
        secure,
        onToggleSecure,
    }: {
        label: string;
        value: string;
        onChangeText: (text: string) => void;
        placeholder: string;
        secure: boolean;
        onToggleSecure: () => void;
    }) => (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrap}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={secure}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity onPress={onToggleSecure} style={styles.eyeBtn} activeOpacity={0.7}>
                    <Ionicons
                        name={secure ? "eye-outline" : "eye-off-outline"}
                        size={22}
                        color="#6B7280"
                    />
                </TouchableOpacity>
            </View>
        </View>
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
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Change Password</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <LinearGradient
                    colors={["#F7FFF9", "#FFFFFF"]}
                    style={styles.summaryCard}
                >
                    <Text style={styles.summaryEyebrow}>Password Security</Text>
                    <Text style={styles.summaryTitle}>Create a stronger password for your account</Text>
                    <Text style={styles.summaryText}>
                        Update your password regularly to keep your AfriX account protected across all devices.
                    </Text>
                </LinearGradient>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Credentials</Text>
                    <View style={styles.card}>
                        <PasswordField
                            label="Current password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter current password"
                            secure={!showCurrent}
                            onToggleSecure={() => setShowCurrent((prev) => !prev)}
                        />
                        <View style={styles.divider} />
                        <PasswordField
                            label="New password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="At least 8 characters"
                            secure={!showNew}
                            onToggleSecure={() => setShowNew((prev) => !prev)}
                        />
                        <View style={styles.divider} />
                        <PasswordField
                            label="Confirm new password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Re-enter new password"
                            secure={!showConfirm}
                            onToggleSecure={() => setShowConfirm((prev) => !prev)}
                        />
                    </View>
                </View>

                <View style={styles.tipCard}>
                    <View style={styles.tipIcon}>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#00B14F" />
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>Password tip</Text>
                        <Text style={styles.tipText}>
                            Use a mix of upper and lowercase letters, numbers, and symbols for a stronger password.
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.submitBtnText}>Update Password</Text>
                            <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
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
        fontSize: 22,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: -0.4,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 58,
        paddingBottom: 40,
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
        padding: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    fieldGroup: {
        marginBottom: 0,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 8,
    },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 14,
        backgroundColor: "#FBFCFD",
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#111827",
    },
    eyeBtn: {
        padding: 12,
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginVertical: 16,
    },
    tipCard: {
        backgroundColor: "#F0FDF4",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#D1FAE5",
        flexDirection: "row",
        gap: 12,
        marginBottom: 18,
    },
    tipIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#166534",
        marginBottom: 4,
    },
    tipText: {
        fontSize: 13,
        color: "#166534",
        lineHeight: 19,
    },
    submitBtn: {
        backgroundColor: "#00B14F",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
        flexDirection: "row",
        gap: 8,
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
