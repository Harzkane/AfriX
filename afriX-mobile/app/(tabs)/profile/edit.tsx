import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Surface } from "react-native-paper";

export default function EditProfileScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const [fullName, setFullName] = useState(user?.full_name || "");
    const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert("Error", "Full name is required");
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.put("/users/update", {
                full_name: fullName,
                phone_number: phoneNumber,
            });

            if (response.data.success) {
                setUser(response.data.data);
                Alert.alert("Success", "Profile updated successfully", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            }
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to update profile"
            );
        } finally {
            setLoading(false);
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
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Surface style={styles.card}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="+234..."
                                placeholderTextColor="#9CA3AF"
                                keyboardType="phone-pad"
                            />
                            <View style={styles.warningContainer}>
                                <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
                                <Text style={styles.warningText}>
                                    Changing your phone number will require re-verification.
                                </Text>
                            </View>
                        </View>
                    </Surface>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 40,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#6B7280",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: "#111827",
        fontWeight: "500",
    },
    warningContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        gap: 10,
        backgroundColor: "#FFFBEB",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FEF3C7",
    },
    warningText: {
        fontSize: 13,
        color: "#B45309",
        flex: 1,
        lineHeight: 18,
        fontWeight: "500",
    },
    footer: {
        padding: 20,
        paddingBottom: 24,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    saveButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    disabledButton: {
        opacity: 0.7,
        backgroundColor: "#9CA3AF",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
