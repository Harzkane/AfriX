import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { SUPPORTED_COUNTRIES, Country } from "@/constants/countries";
import apiClient from "@/services/apiClient";
import { useAgentStore } from "@/stores/slices/agentSlice";

export default function AgentRegistrationModal() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // Form state
    const [countries, setCountries] = useState<Country[]>(SUPPORTED_COUNTRIES);
    const [country, setCountry] = useState("NG");
    const [currency, setCurrency] = useState("NGN");
    const [withdrawalAddress, setWithdrawalAddress] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const { data } = await apiClient.get("/config/countries");
            if (data.success && data.data.length > 0) {
                setCountries(data.data);
            }
        } catch (error) {
            console.log("Failed to fetch countries, using default list");
        }
    };

    const validateAddress = (address: string): boolean => {
        // Basic Ethereum address validation
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        return ethAddressRegex.test(address);
    };

    const handleCountryChange = (countryCode: string) => {
        setCountry(countryCode);
        const selectedCountry = countries.find((c) => c.code === countryCode);
        if (selectedCountry) {
            setCurrency(selectedCountry.currency);
        }
        setShowCountryPicker(false);
    };

    const getCountryName = () => {
        return countries.find((c) => c.code === country)?.name || "Select Country";
    };

    const handleSubmit = async () => {
        // Validation
        const newErrors: { [key: string]: string } = {};

        if (!withdrawalAddress.trim()) {
            newErrors.withdrawalAddress = "Withdrawal address is required";
        } else if (!validateAddress(withdrawalAddress)) {
            newErrors.withdrawalAddress = "Invalid Ethereum address format";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            // Call API to register agent
            await useAgentStore.getState().registerAsAgent({
                country,
                currency,
                withdrawal_address: withdrawalAddress,
            });

            Alert.alert(
                "Registration Successful!",
                "Your agent application has been submitted. Please complete KYC verification to continue.",
                [
                    {
                        text: "Continue to KYC",
                        onPress: () => {
                            router.replace("/modals/agent-kyc");
                        },
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to register as agent");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Agent Registration</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, styles.progressDotActive]}>
                            <Text style={styles.progressNumber}>1</Text>
                        </View>
                        <Text style={styles.progressLabel}>Register</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressStep}>
                        <View style={styles.progressDot}>
                            <Text style={styles.progressNumber}>2</Text>
                        </View>
                        <Text style={styles.progressLabel}>KYC</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressStep}>
                        <View style={styles.progressDot}>
                            <Text style={styles.progressNumber}>3</Text>
                        </View>
                        <Text style={styles.progressLabel}>Deposit</Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Basic Information</Text>
                    <Text style={styles.formDescription}>
                        Provide your location and withdrawal details
                    </Text>

                    {/* Country Selector */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Country *</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => setShowCountryPicker(true)}
                        >
                            <Text style={styles.selectInputText}>{getCountryName()}</Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Currency (Auto-filled) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Currency</Text>
                        <View style={styles.disabledInput}>
                            <Text style={styles.disabledInputText}>{currency}</Text>
                            <Ionicons name="lock-closed" size={16} color="#9CA3AF" />
                        </View>
                        <Text style={styles.helperText}>
                            Automatically set based on your country
                        </Text>
                    </View>

                    {/* Withdrawal Address */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>USDT Withdrawal Address (Polygon) *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.withdrawalAddress && styles.inputError,
                            ]}
                            placeholder="0x..."
                            value={withdrawalAddress}
                            onChangeText={(text) => {
                                setWithdrawalAddress(text);
                                if (errors.withdrawalAddress) {
                                    setErrors({ ...errors, withdrawalAddress: "" });
                                }
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {errors.withdrawalAddress ? (
                            <Text style={styles.errorText}>{errors.withdrawalAddress}</Text>
                        ) : (
                            <Text style={styles.helperText}>
                                Your earnings will be sent to this address
                            </Text>
                        )}
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color="#00B14F" />
                        <Text style={styles.infoText}>
                            Make sure your withdrawal address is correct. You can update it later in
                            settings.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Continue to KYC</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Country Picker Modal */}
            <Modal
                visible={showCountryPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCountryPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.countryList}>
                            {countries.map((c) => (
                                <TouchableOpacity
                                    key={c.code}
                                    style={[
                                        styles.countryOption,
                                        country === c.code && styles.countryOptionSelected,
                                    ]}
                                    onPress={() => {
                                        handleCountryChange(c.code);
                                        setShowCountryPicker(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.countryOptionText,
                                            country === c.code && styles.countryOptionTextSelected,
                                        ]}
                                    >
                                        {c.name}
                                    </Text>
                                    {country === c.code && (
                                        <Ionicons name="checkmark" size={20} color="#00B14F" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    content: {
        padding: 20,
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
    },
    progressStep: {
        alignItems: "center",
    },
    progressDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    progressDotActive: {
        backgroundColor: "#00B14F",
    },
    progressNumber: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    progressLabel: {
        fontSize: 12,
        color: "#6B7280",
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: "#F3F4F6",
        marginHorizontal: 8,
        marginBottom: 28,
    },
    form: {
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    formDescription: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    selectInput: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#FFFFFF",
    },
    selectInputText: {
        fontSize: 16,
        color: "#111827",
    },
    input: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#111827",
        backgroundColor: "#FFFFFF",
    },
    inputError: {
        borderColor: "#EF4444",
    },
    disabledInput: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#F9FAFB",
    },
    disabledInputText: {
        fontSize: 16,
        color: "#6B7280",
    },
    helperText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },
    errorText: {
        fontSize: 12,
        color: "#EF4444",
        marginTop: 4,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F0FDF4",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#00B14F",
    },
    infoText: {
        fontSize: 13,
        color: "#065F46",
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    submitButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingBottom: 20,
        maxHeight: "60%",
    },
    countryList: {
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    countryOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    countryOptionSelected: {
        backgroundColor: "#F0FDF4",
    },
    countryOptionText: {
        fontSize: 16,
        color: "#111827",
    },
    countryOptionTextSelected: {
        color: "#00B14F",
        fontWeight: "600",
    },
});
