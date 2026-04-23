import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    Clipboard,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useAgentStore } from "@/stores/slices/agentSlice";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";

type DepositFieldErrors = {
    amount?: string;
    txHash?: string;
};

export default function DepositScreen() {
    const router = useRouter();
    const { submitDeposit, loading } = useAgentStore();
    const [depositData, setDepositData] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [amount, setAmount] = useState("");
    const [txHash, setTxHash] = useState("");
    const [fieldErrors, setFieldErrors] = useState<DepositFieldErrors>({});

    useEffect(() => {
        fetchDepositAddress();
    }, []);

    const minimumDeposit = Number(depositData?.minimum_deposit || 0);
    const depositAddress = depositData?.address || "";
    const depositNetwork = depositData?.network || "Polygon";

    const fetchDepositAddress = async () => {
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.AGENTS.DEPOSIT_ADDRESS);
            setDepositData(data.data);
        } catch {
            Alert.alert("Error", "Failed to fetch deposit address");
        } finally {
            setFetching(false);
        }
    };

    const handleCopy = (text: string) => {
        Clipboard.setString(text);
        Alert.alert("Copied", "Address copied to clipboard");
    };

    const validateAmount = (value: string) => {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return "Please enter deposit amount";
        }

        const depositAmount = parseFloat(trimmedValue);
        if (isNaN(depositAmount)) {
            return "Enter a valid deposit amount";
        }

        if (minimumDeposit > 0 && depositAmount < minimumDeposit) {
            return `Minimum deposit is $${minimumDeposit} USDT`;
        }

        return "";
    };

    const validateTxHash = (value: string) => {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return "Please enter transaction hash";
        }

        if (!trimmedValue.startsWith("0x")) {
            return "Transaction hash must start with 0x";
        }

        if (!/^0x[a-fA-F0-9]{64}$/.test(trimmedValue)) {
            return "Enter a valid 66-character transaction hash";
        }

        return "";
    };

    const sanitizeAmountInput = (value: string) => {
        const sanitized = value.replace(/[^0-9.]/g, "");
        const parts = sanitized.split(".");

        if (parts.length <= 1) {
            return sanitized;
        }

        return `${parts[0]}.${parts.slice(1).join("")}`;
    };

    const handleAmountChange = (value: string) => {
        const nextAmount = sanitizeAmountInput(value);
        setAmount(nextAmount);
        setFieldErrors((current) => ({
            ...current,
            amount: nextAmount ? validateAmount(nextAmount) : "",
        }));
    };

    const handleTxHashChange = (value: string) => {
        const nextHash = value.trim().replace(/\s+/g, "");
        setTxHash(nextHash);
        setFieldErrors((current) => ({
            ...current,
            txHash: nextHash ? validateTxHash(nextHash) : "",
        }));
    };

    const validateForm = () => {
        const nextErrors = {
            amount: validateAmount(amount),
            txHash: validateTxHash(txHash),
        };

        setFieldErrors(nextErrors);
        return !nextErrors.amount && !nextErrors.txHash;
    };

    const isFormComplete = amount.trim().length > 0 && txHash.trim().length > 0;
    const isFormValid =
        isFormComplete && !validateAmount(amount) && !validateTxHash(txHash);

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert("Error", "Please correct the highlighted fields");
            return;
        }

        try {
            await submitDeposit(parseFloat(amount.trim()), txHash.trim());
            Alert.alert(
                "Deposit Submitted",
                "Your deposit has been submitted for verification. We will update your balance after confirmation.",
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error: any) {
            const raw = error.response?.data?.message || error.message || "";
            let errorMessage = raw || "Deposit could not be verified. Please try again.";

            if (raw.includes("already been used")) {
                errorMessage =
                    "This deposit was already applied. Each transaction can only be used once.";
            } else if (
                raw.includes("Transaction not found or not confirmed") ||
                raw.includes("could not confirm this transaction yet")
            ) {
                errorMessage =
                    "We could not confirm this transaction yet. Please wait for blockchain confirmation and try again.";
            } else if (raw.includes("Transaction failed on blockchain")) {
                errorMessage =
                    "This blockchain transaction failed and cannot be used for deposit verification.";
            } else if (raw.includes("No USDT transfer to treasury found")) {
                errorMessage =
                    "No USDT transfer to the platform deposit address was found in this transaction.";
            } else if (raw.includes("Amount mismatch")) {
                errorMessage =
                    "The amount you entered does not match the confirmed blockchain transfer.";
            }

            Alert.alert("Deposit failed", errorMessage);
        }
    };

    if (fetching) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00B14F" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Deposit Funds</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <LinearGradient
                        colors={["#F7FFF9", "#FFFFFF"]}
                        style={styles.introSection}
                    >
                        <Text style={styles.introEyebrow}>Treasury Top-Up</Text>
                        <Text style={styles.introTitle}>Add More Agent Capacity</Text>
                        <Text style={styles.introDescription}>
                            Top up your agent float to support more mint and burn activity with fresh USDT liquidity.
                        </Text>
                    </LinearGradient>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Minimum Deposit</Text>
                            <Text style={styles.infoValue}>${minimumDeposit || 0} USDT</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Network</Text>
                            <Text style={styles.infoValue}>{depositNetwork}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Token</Text>
                            <Text style={styles.infoValue}>USDT</Text>
                        </View>
                    </View>

                    <View style={styles.warningBanner}>
                        <Ionicons name="warning" size={20} color="#DC2626" />
                        <Text style={styles.warningText}>
                            Only send USDT on Polygon network. Sending the wrong token or network may permanently lose funds.
                        </Text>
                    </View>

                    <View style={styles.qrSection}>
                        <Text style={styles.sectionTitle}>Deposit Address</Text>
                        <View style={styles.qrContainer}>
                            {depositAddress ? <QRCode value={depositAddress} size={200} /> : null}
                        </View>
                        <TouchableOpacity
                            style={styles.addressContainer}
                            onPress={() => handleCopy(depositAddress)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                                {depositAddress || "Address unavailable"}
                            </Text>
                            <View style={styles.copyButton}>
                                <Ionicons name="copy-outline" size={20} color="#00B14F" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.form}>
                        <Text style={styles.sectionTitle}>Verify Deposit</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Amount (USDT) *</Text>
                            <TextInput
                                style={[styles.input, fieldErrors.amount ? styles.inputError : null]}
                                placeholder={`Minimum ${minimumDeposit || 0}`}
                                value={amount}
                                onChangeText={handleAmountChange}
                                onBlur={() =>
                                    setFieldErrors((current) => ({
                                        ...current,
                                        amount: validateAmount(amount),
                                    }))
                                }
                                keyboardType="decimal-pad"
                            />
                            {fieldErrors.amount ? (
                                <Text style={styles.errorText}>{fieldErrors.amount}</Text>
                            ) : (
                                <Text style={styles.helperText}>
                                    Enter the exact USDT amount you sent to the treasury address.
                                </Text>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Transaction Hash *</Text>
                            <TextInput
                                style={[styles.input, fieldErrors.txHash ? styles.inputError : null]}
                                placeholder="0x..."
                                value={txHash}
                                onChangeText={handleTxHashChange}
                                onBlur={() =>
                                    setFieldErrors((current) => ({
                                        ...current,
                                        txHash: validateTxHash(txHash),
                                    }))
                                }
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {fieldErrors.txHash ? (
                                <Text style={styles.errorText}>{fieldErrors.txHash}</Text>
                            ) : (
                                <Text style={styles.helperText}>
                                    Paste the transaction hash from your wallet after the transfer is sent.
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={20} color="#00B14F" />
                        <Text style={styles.infoText}>
                            Deposits are verified on-chain. Confirmation can take a few minutes depending on network conditions.
                        </Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!isFormValid || loading) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!isFormValid || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Submit for Verification</Text>
                                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
        backgroundColor: "#FFFFFF",
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 28,
    },
    introSection: {
        marginBottom: 24,
        alignItems: "center",
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E6F4EA",
    },
    introEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    introTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        textAlign: "center",
    },
    introDescription: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 24,
    },
    infoCard: {
        backgroundColor: "#FBFCFD",
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#EAF0F5",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    infoValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    warningBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#FEF2F2",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#FEE2E2",
        marginBottom: 24,
    },
    warningText: {
        fontSize: 14,
        color: "#991B1B",
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
        fontWeight: "500",
    },
    qrSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 16,
    },
    qrContainer: {
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#EAF0F5",
        marginBottom: 16,
    },
    addressContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FBFCFD",
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#EAF0F5",
    },
    addressText: {
        flex: 1,
        fontSize: 14,
        color: "#374151",
        fontFamily: "monospace",
    },
    copyButton: {
        padding: 8,
        marginLeft: 8,
    },
    form: {
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: "800",
        color: "#4B5563",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    input: {
        borderWidth: 1,
        borderColor: "#EAF0F5",
        borderRadius: 14,
        padding: 14,
        fontSize: 16,
        color: "#111827",
        backgroundColor: "#FFFFFF",
    },
    inputError: {
        borderColor: "#FCA5A5",
        backgroundColor: "#FFFBFB",
    },
    helperText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },
    errorText: {
        fontSize: 12,
        color: "#DC2626",
        marginTop: 6,
        fontWeight: "500",
    },
    infoBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F0FDF4",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#D8F3E3",
    },
    infoText: {
        fontSize: 14,
        color: "#065F46",
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#EAF0F5",
        backgroundColor: "#FFFFFF",
    },
    submitButton: {
        flexDirection: "row",
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
