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
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to change password");
        }
    };

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
                        <Text style={styles.headerTitle}>Change Password</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Password</Text>
                    <View style={styles.card}>
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Current password</Text>
                            <View style={styles.inputWrap}>
                                <TextInput
                                    style={styles.input}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Enter current password"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showCurrent}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowCurrent((s) => !s)}
                                    style={styles.eyeBtn}
                                >
                                    <Ionicons
                                        name={showCurrent ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>New password</Text>
                            <View style={styles.inputWrap}>
                                <TextInput
                                    style={styles.input}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="At least 8 characters"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showNew}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowNew((s) => !s)}
                                    style={styles.eyeBtn}
                                >
                                    <Ionicons
                                        name={showNew ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Confirm new password</Text>
                            <TextInput
                                style={styles.inputFull}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Re-enter new password"
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitBtnText}>Update password</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                    Use a strong password: mix of letters, numbers and symbols.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F3F4F6" },
    headerWrapper: { zIndex: 10, elevation: 8, backgroundColor: "#00B14F" },
    headerGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
    headerContent: { paddingHorizontal: 20 },
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
    headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
    content: { padding: 20, paddingTop: 40, paddingBottom: 40 },
    section: { marginBottom: 24 },
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
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputRow: { marginBottom: 4 },
    label: { fontSize: 13, fontWeight: "500", color: "#6B7280", marginBottom: 8 },
    inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, backgroundColor: "#F9FAFB" },
    input: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: "#111827" },
    inputFull: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, color: "#111827", backgroundColor: "#F9FAFB" },
    eyeBtn: { padding: 12 },
    divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
    submitBtn: {
        backgroundColor: "#00B14F",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
    hint: { fontSize: 13, color: "#6B7280", marginTop: 16, textAlign: "center" },
});
