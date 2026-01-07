import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";

export default function EditProfile() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { updateProfile, loading } = useAgentStore();

    const [phoneNumber, setPhoneNumber] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [errors, setErrors] = useState<{ phone?: string; whatsapp?: string }>({});

    useEffect(() => {
        // Pre-populate with current values
        if (user) {
            setPhoneNumber(user.phone_number || "");
            setWhatsappNumber((user as any).whatsapp_number || user.phone_number || "");
        }
    }, [user]);

    const validatePhone = (phone: string): boolean => {
        // Basic phone validation - adjust regex as needed
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phone.length >= 10 && phoneRegex.test(phone);
    };

    const handleSave = async () => {
        // Validate inputs
        const newErrors: { phone?: string; whatsapp?: string } = {};

        if (!phoneNumber.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!validatePhone(phoneNumber)) {
            newErrors.phone = "Invalid phone number format";
        }

        if (whatsappNumber && !validatePhone(whatsappNumber)) {
            newErrors.whatsapp = "Invalid WhatsApp number format";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await updateProfile({
                phone_number: phoneNumber.trim(),
                whatsapp_number: whatsappNumber.trim() || phoneNumber.trim(),
            });

            Alert.alert(
                "Success",
                "Profile updated successfully",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile");
        }
    };

    const isFormValid = phoneNumber.trim().length > 0 && Object.keys(errors).length === 0;

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <View style={{ width: 24 }} />
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
                    {/* Phone Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                            <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={phoneNumber}
                                onChangeText={(text) => {
                                    setPhoneNumber(text);
                                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                                }}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                                editable={!loading}
                            />
                        </View>
                        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
                    </View>

                    {/* WhatsApp Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>WhatsApp Number</Text>
                        <View style={[styles.inputContainer, errors.whatsapp && styles.inputError]}>
                            <Ionicons name="logo-whatsapp" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={whatsappNumber}
                                onChangeText={(text) => {
                                    setWhatsappNumber(text);
                                    if (errors.whatsapp) setErrors({ ...errors, whatsapp: undefined });
                                }}
                                placeholder="Enter WhatsApp number (optional)"
                                keyboardType="phone-pad"
                                editable={!loading}
                            />
                        </View>
                        {errors.whatsapp && <Text style={styles.errorText}>{errors.whatsapp}</Text>}
                        <Text style={styles.helperText}>
                            If empty, phone number will be used
                        </Text>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#7C3AED" />
                        <Text style={styles.infoText}>
                            These contact details will be visible to users when they select you as their agent.
                        </Text>
                    </View>
                </ScrollView>

                {/* Save Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, (!isFormValid || loading) && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={!isFormValid || loading}
                    >
                        {loading ? (
                            <Text style={styles.saveButtonText}>Saving...</Text>
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
        backgroundColor: "#F3F4F6",
    },
    headerWrapper: {
        // marginBottom: 20,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        // borderBottomLeftRadius: 30,
        // borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 20,
        marginTop: 20,
    },
    backButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
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
        padding: 16,
        paddingBottom: 100,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 12,
    },
    inputError: {
        borderColor: "#EF4444",
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: "#111827",
    },
    errorText: {
        fontSize: 12,
        color: "#EF4444",
        marginTop: 4,
    },
    helperText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#F3E8FF",
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#7C3AED",
        lineHeight: 18,
    },
    footer: {
        padding: 16,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    saveButton: {
        backgroundColor: "#7C3AED",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    saveButtonDisabled: {
        backgroundColor: "#9CA3AF",
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "white",
    },
});
