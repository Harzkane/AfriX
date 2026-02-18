import React, { useState } from "react";
import {
    View,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { isXOFToken } from "@/constants/payment";
import { XOF_MOBILE_MONEY_PROVIDERS } from "@/constants/payment";

const { width } = Dimensions.get("window");

type PaymentMethod = "bank" | "mobile_money";

export default function BankDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        amount?: string;
        tokenType?: string;
        agentId?: string;
        agentName?: string;
    }>();

    const tokenType = params.tokenType || "NT";
    const showPaymentChoice = isXOFToken(tokenType);

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [mobileProvider, setMobileProvider] = useState<string>(XOF_MOBILE_MONEY_PROVIDERS[0]);
    const [mobileNumber, setMobileNumber] = useState("");

    const handleContinue = () => {
        if (paymentMethod === "bank") {
            if (!bankName || !accountNumber || !accountName) return;
            router.push({
                pathname: "/(tabs)/sell-tokens/confirm",
                params: {
                    ...params,
                    paymentType: "bank",
                    bankName,
                    accountNumber,
                    accountName,
                },
            });
        } else {
            if (!mobileNumber.trim() || !accountName.trim()) return;
            router.push({
                pathname: "/(tabs)/sell-tokens/confirm",
                params: {
                    ...params,
                    paymentType: "mobile_money",
                    mobileProvider,
                    mobileNumber: mobileNumber.trim(),
                    accountName,
                },
            });
        }
    };

    const isFormValid =
        paymentMethod === "bank"
            ? !!(bankName && accountNumber && accountName)
            : !!(mobileNumber.trim() && accountName.trim());

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
                        <Text style={styles.headerTitle}>
                            {showPaymentChoice ? "Receive Payment" : "Recipient Bank"}
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                >
                    <View style={styles.introContainer}>
                        <Text style={styles.title}>Where should we send funds?</Text>
                        <Text style={styles.subtitle}>
                            {showPaymentChoice
                                ? "Choose how you want to receive payment. In XOF countries most agents use mobile money (Orange Money, Wave, Kiren) or bank."
                                : "Provide the bank account details where your chosen agent will transfer the money."}
                        </Text>
                    </View>

                    {showPaymentChoice && (
                        <View style={styles.methodRow}>
                            <TouchableOpacity
                                style={[
                                    styles.methodBtn,
                                    paymentMethod === "bank" && styles.methodBtnActive,
                                ]}
                                onPress={() => setPaymentMethod("bank")}
                            >
                                <Ionicons
                                    name="business-outline"
                                    size={22}
                                    color={paymentMethod === "bank" ? "#00B14F" : "#6B7280"}
                                />
                                <Text
                                    style={[
                                        styles.methodBtnText,
                                        paymentMethod === "bank" && styles.methodBtnTextActive,
                                    ]}
                                >
                                    Bank
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.methodBtn,
                                    paymentMethod === "mobile_money" && styles.methodBtnActive,
                                ]}
                                onPress={() => setPaymentMethod("mobile_money")}
                            >
                                <Ionicons
                                    name="phone-portrait-outline"
                                    size={22}
                                    color={
                                        paymentMethod === "mobile_money" ? "#00B14F" : "#6B7280"
                                    }
                                />
                                <Text
                                    style={[
                                        styles.methodBtnText,
                                        paymentMethod === "mobile_money" &&
                                        styles.methodBtnTextActive,
                                    ]}
                                >
                                    Mobile Money
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.formCard}>
                        {paymentMethod === "bank" ? (
                            <>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Bank Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons
                                            name="business-outline"
                                            size={20}
                                            color="#9CA3AF"
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. GTBank, Zenith, Kuda"
                                            placeholderTextColor="#9CA3AF"
                                            value={bankName}
                                            onChangeText={setBankName}
                                        />
                                    </View>
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Account Number</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons
                                            name="card-outline"
                                            size={20}
                                            color="#9CA3AF"
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="0123456789"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="numeric"
                                            maxLength={15}
                                            value={accountNumber}
                                            onChangeText={setAccountNumber}
                                        />
                                    </View>
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Account Holder Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons
                                            name="person-outline"
                                            size={20}
                                            color="#9CA3AF"
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Full name as on account"
                                            placeholderTextColor="#9CA3AF"
                                            value={accountName}
                                            onChangeText={setAccountName}
                                        />
                                    </View>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Mobile Money Provider</Text>
                                    <View style={styles.pickerRow} pointerEvents="box-none">
                                        {XOF_MOBILE_MONEY_PROVIDERS.map((p) => (
                                            <TouchableOpacity
                                                key={p}
                                                style={[
                                                    styles.chip,
                                                    mobileProvider === p && styles.chipActive,
                                                ]}
                                                onPress={() => setMobileProvider(p)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        mobileProvider === p && styles.chipTextActive,
                                                    ]}
                                                >
                                                    {p}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <View style={styles.formGroup} key="mobile-phone-field">
                                    <Text style={styles.label}>Phone Number</Text>
                                    <View style={styles.inputWrapper} collapsable={false} pointerEvents="box-none">
                                        <Ionicons
                                            name="call-outline"
                                            size={20}
                                            color="#9CA3AF"
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            key="mobile-money-phone-input"
                                            style={styles.input}
                                            placeholder="e.g. 77 123 45 67"
                                            placeholderTextColor="#9CA3AF"
                                            keyboardType="phone-pad"
                                            value={mobileNumber}
                                            onChangeText={setMobileNumber}
                                            editable={true}
                                        />
                                    </View>
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Account / Wallet Holder Name</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons
                                            name="person-outline"
                                            size={20}
                                            color="#9CA3AF"
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Full name as on mobile money"
                                            placeholderTextColor="#9CA3AF"
                                            value={accountName}
                                            onChangeText={setAccountName}
                                        />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    <View style={styles.warningBox}>
                        <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.warningText}>
                                Please double-check these details. Incorrect info may lead to lost
                                funds.
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.continueButton, !isFormValid && styles.disabledButton]}
                        onPress={handleContinue}
                        disabled={!isFormValid}
                    >
                        <Text style={styles.continueText}>Review & Confirm</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    headerWrapper: { marginBottom: 0 },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 140,
    },
    headerContent: { paddingHorizontal: 20 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 20,
        marginTop: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    scrollView: { flex: 1 },
    content: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    introContainer: { marginBottom: 24, marginTop: 30 },
    title: {
        fontSize: 22,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        lineHeight: 22,
    },
    methodRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    methodBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "#F3F4F6",
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    methodBtnActive: {
        backgroundColor: "#ECFDF5",
        borderColor: "#00B14F",
    },
    methodBtnText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#6B7280",
    },
    methodBtnTextActive: { color: "#00B14F" },
    formCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    formGroup: { marginBottom: 20 },
    label: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 14,
        paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    input: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 16,
        fontSize: 16,
        color: "#111827",
        fontWeight: "500",
    },
    pickerRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    chipActive: {
        backgroundColor: "#ECFDF5",
        borderColor: "#00B14F",
    },
    chipText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
    },
    chipTextActive: { color: "#00B14F" },
    warningBox: {
        flexDirection: "row",
        backgroundColor: "#FFFBEB",
        padding: 16,
        borderRadius: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: "#FEF3C7",
    },
    warningText: {
        fontSize: 13,
        color: "#92400E",
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        paddingBottom: 24,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    continueButton: {
        backgroundColor: "#00B14F",
        height: 56,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: "#9CA3AF",
        shadowOpacity: 0,
        elevation: 0,
    },
    continueText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
