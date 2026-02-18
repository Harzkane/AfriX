import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { isXOFCountry } from "@/constants/payment";
import { XOF_MOBILE_MONEY_PROVIDERS } from "@/constants/payment";
import { getCountryByCode } from "@/constants/countries";

export default function EditBankDetails() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const fromAgentProfile = params?.from === "agent-profile";
    const { user } = useAuthStore();
    const { updateProfile, loading } = useAgentStore();
    const countryCode = (user as any)?.country_code || (user as any)?.country || "";
    const countryInfo = countryCode ? getCountryByCode(countryCode) : null;
    const showMobileMoney = countryCode ? isXOFCountry(countryCode) : false;

    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [withdrawalAddress, setWithdrawalAddress] = useState("");
    const [mobileMoneyProvider, setMobileMoneyProvider] = useState("");
    const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
    const [errors, setErrors] = useState<{
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
        withdrawalAddress?: string;
    }>({});

    const handleGoBack = () => {
        if (fromAgentProfile) {
            router.push("/agent/(tabs)/profile");
        } else {
            router.back();
        }
    };

    useEffect(() => {
        if (user) {
            setBankName((user as any).bank_name || "");
            setAccountNumber((user as any).account_number || "");
            setAccountName((user as any).account_name || "");
            setWithdrawalAddress((user as any).withdrawal_address || "");
            setMobileMoneyProvider((user as any).mobile_money_provider || XOF_MOBILE_MONEY_PROVIDERS[0]);
            setMobileMoneyNumber((user as any).mobile_money_number || "");
        }
    }, [user]);

    const validateAddress = (address: string): boolean => {
        // Basic Ethereum address validation
        return address.startsWith("0x") && address.length === 42;
    };

    const handleSave = async () => {
        // Validate inputs
        const newErrors: any = {};

        if (!bankName.trim()) {
            newErrors.bankName = "Bank name is required";
        }

        if (!accountNumber.trim()) {
            newErrors.accountNumber = "Account number is required";
        }

        if (!accountName.trim()) {
            newErrors.accountName = "Account name is required";
        }

        if (!withdrawalAddress.trim()) {
            newErrors.withdrawalAddress = "Withdrawal address is required";
        } else if (!validateAddress(withdrawalAddress)) {
            newErrors.withdrawalAddress = "Invalid address format (must start with 0x)";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const payload: any = {
                bank_name: bankName.trim(),
                account_number: accountNumber.trim(),
                account_name: accountName.trim(),
                withdrawal_address: withdrawalAddress.trim(),
            };
            if (showMobileMoney) {
                payload.mobile_money_provider = mobileMoneyProvider.trim() || null;
                payload.mobile_money_number = mobileMoneyNumber.trim() || null;
            }
            await updateProfile(payload);

            Alert.alert(
                "Success",
                "Bank details updated successfully",
                [{ text: "OK", onPress: () => handleGoBack() }]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update bank details");
        }
    };

    const isFormValid =
        bankName.trim().length > 0 &&
        accountNumber.trim().length > 0 &&
        accountName.trim().length > 0 &&
        withdrawalAddress.trim().length > 0 &&
        Object.keys(errors).length === 0;

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    style={styles.headerGradient}
                />
                <SafeAreaView edges={["top"]} style={styles.headerContent}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Update Bank Details</Text>
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
                    {countryInfo ? (
                        <View style={styles.countryRow}>
                            <Ionicons name="globe-outline" size={20} color="#6B7280" style={styles.countryIcon} />
                            <Text style={styles.countryLabel}>Country</Text>
                            <Text style={styles.countryValue}>{countryInfo.name}</Text>
                        </View>
                    ) : null}

                    {/* Bank Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bank Name *</Text>
                        <View style={[styles.inputContainer, errors.bankName && styles.inputError]}>
                            <Ionicons name="business-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={bankName}
                                onChangeText={(text) => {
                                    setBankName(text);
                                    if (errors.bankName) setErrors({ ...errors, bankName: undefined });
                                }}
                                placeholder="Enter bank name"
                                editable={!loading}
                            />
                        </View>
                        {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
                    </View>

                    {/* Account Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Account Number *</Text>
                        <View style={[styles.inputContainer, errors.accountNumber && styles.inputError]}>
                            <Ionicons name="card-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={accountNumber}
                                onChangeText={(text) => {
                                    setAccountNumber(text);
                                    if (errors.accountNumber) setErrors({ ...errors, accountNumber: undefined });
                                }}
                                placeholder="Enter account number"
                                keyboardType="numeric"
                                editable={!loading}
                            />
                        </View>
                        {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
                    </View>

                    {/* Account Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Account Name *</Text>
                        <View style={[styles.inputContainer, errors.accountName && styles.inputError]}>
                            <Ionicons name="person-circle-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={accountName}
                                onChangeText={(text) => {
                                    setAccountName(text);
                                    if (errors.accountName) setErrors({ ...errors, accountName: undefined });
                                }}
                                placeholder="Enter account holder name"
                                editable={!loading}
                            />
                        </View>
                        {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
                    </View>

                    {/* Mobile Money (XOF agents) */}
                    {showMobileMoney && (
                        <>
                            <Text style={[styles.label, { marginTop: 8 }]}>Mobile Money (optional)</Text>
                            <Text style={styles.helperText}>
                                In XOF countries many users pay via Orange Money, Wave, Kiren. Add your details so users can pay you.
                            </Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Provider</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <View style={styles.pickerRow}>
                                        {XOF_MOBILE_MONEY_PROVIDERS.map((p) => (
                                            <TouchableOpacity
                                                key={p}
                                                style={[styles.chip, mobileMoneyProvider === p && styles.chipActive]}
                                                onPress={() => setMobileMoneyProvider(p)}
                                            >
                                                <Text style={[styles.chipText, mobileMoneyProvider === p && styles.chipTextActive]}>{p}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mobile Money Number</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={mobileMoneyNumber}
                                        onChangeText={setMobileMoneyNumber}
                                        placeholder="e.g. +221 77 123 45 67"
                                        keyboardType="phone-pad"
                                        editable={!loading}
                                    />
                                </View>
                            </View>
                        </>
                    )}

                    {/* Withdrawal Address */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>USDT Withdrawal Address *</Text>
                        <View style={[styles.inputContainer, errors.withdrawalAddress && styles.inputError]}>
                            <Ionicons name="wallet-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.addressInput]}
                                value={withdrawalAddress}
                                onChangeText={(text) => {
                                    setWithdrawalAddress(text);
                                    if (errors.withdrawalAddress) setErrors({ ...errors, withdrawalAddress: undefined });
                                }}
                                placeholder="0x..."
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                            />
                        </View>
                        {errors.withdrawalAddress && <Text style={styles.errorText}>{errors.withdrawalAddress}</Text>}
                        <Text style={styles.helperText}>
                            Polygon network USDT address for withdrawals
                        </Text>
                    </View>

                    {/* Warning Box */}
                    <View style={styles.warningBox}>
                        <Ionicons name="warning" size={20} color="#F59E0B" />
                        <Text style={styles.warningText}>
                            Please ensure all details are correct. Incorrect banking information may delay payments.
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
    countryRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    countryIcon: {
        marginRight: 10,
    },
    countryLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    countryValue: {
        marginLeft: "auto",
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
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
        paddingVertical: 12,
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
    addressInput: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        fontSize: 14,
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
    pickerRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        flex: 1,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    chipActive: {
        backgroundColor: "#EDE9FE",
        borderColor: "#7C3AED",
    },
    chipText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7280",
    },
    chipTextActive: { color: "#7C3AED" },
    warningBox: {
        flexDirection: "row",
        backgroundColor: "#FEF3C7",
        padding: 12,
        borderRadius: 12,
        gap: 8,
        marginTop: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: "#F59E0B",
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
