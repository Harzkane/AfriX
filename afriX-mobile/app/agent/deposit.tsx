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
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { useAgentStore } from "@/stores/slices/agentSlice";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";
import { useTranslation } from "react-i18next";

type DepositFieldErrors = {
    amount?: string;
    txHash?: string;
};

export default function DepositScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { submitDeposit, loading } = useAgentStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

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

    const theme = {
        bg: isDark ? "#090B14" : "#F5F4FC",
        card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
        cardAlt: isDark ? "rgba(255, 255, 255, 0.05)" : "#F9F8FF",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "#1E1638" : "#EDE9FE",
        accent: "#7C3AED",
        accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
        green: "#00B14F",
        danger: "#EF4444",
        dangerSoft: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
        inputBg: isDark ? "rgba(255, 255, 255, 0.06)" : "#F9F8FF",
    };

    const fetchDepositAddress = async () => {
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.AGENTS.DEPOSIT_ADDRESS);
            setDepositData(data.data);
        } catch {
            Alert.alert(t("agent.deposit.deposit_failed", "Deposit failed"), t("agent.deposit.err_fetch_address", "Failed to fetch deposit address"));
        } finally {
            setFetching(false);
        }
    };

    const handleCopy = (text: string) => {
        Clipboard.setString(text);
        Alert.alert(t("agent.deposit.copied_title", "Copied"), t("agent.deposit.copied_desc", "Address copied to clipboard"));
    };

    const validateAmount = (value: string) => {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return t("agent.deposit.val_enter_amount", "Please enter deposit amount");
        }

        const depositAmount = parseFloat(trimmedValue);
        if (isNaN(depositAmount)) {
            return t("agent.deposit.val_valid_amount", "Enter a valid deposit amount");
        }

        if (minimumDeposit > 0 && depositAmount < minimumDeposit) {
            return t("agent.deposit.val_min_deposit", "Minimum deposit is ${{min}} USDT", { min: minimumDeposit });
        }

        return "";
    };

    const validateTxHash = (value: string) => {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return t("agent.deposit.val_enter_hash", "Please enter transaction hash");
        }

        if (!trimmedValue.startsWith("0x")) {
            return t("agent.deposit.val_hash_prefix", "Transaction hash must start with 0x");
        }

        if (!/^0x[a-fA-F0-9]{64}$/.test(trimmedValue)) {
            return t("agent.deposit.val_hash_length", "Enter a valid 66-character transaction hash");
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
            Alert.alert(t("agent.deposit.deposit_failed", "Deposit failed"), t("agent.deposit.err_highlighted_fields", "Please correct the highlighted fields"));
            return;
        }

        try {
            await submitDeposit(parseFloat(amount.trim()), txHash.trim());
            Alert.alert(
                t("agent.deposit.success_title", "Deposit Submitted"),
                t("agent.deposit.success_desc", "Your deposit has been submitted for verification. We will update your balance after confirmation."),
                [{ text: "OK", onPress: () => router.back() }]
            );
        } catch (error: any) {
            const raw = error.response?.data?.message || error.message || "";
            let errorMessage = raw || t("agent.deposit.err_failed_verification", "Deposit could not be verified. Please try again.");

            if (raw.includes("already been used")) {
                errorMessage =
                    t("agent.deposit.err_already_applied", "This deposit was already applied. Each transaction can only be used once.");
            } else if (
                raw.includes("Transaction not found or not confirmed") ||
                raw.includes("could not confirm this transaction yet")
            ) {
                errorMessage =
                    t("agent.deposit.err_not_confirmed", "We could not confirm this transaction yet. Please wait for blockchain confirmation and try again.");
            } else if (raw.includes("Transaction failed on blockchain")) {
                errorMessage =
                    t("agent.deposit.err_failed_blockchain", "This blockchain transaction failed and cannot be used for deposit verification.");
            } else if (raw.includes("No USDT transfer to treasury found")) {
                errorMessage =
                    t("agent.deposit.err_no_transfer", "No USDT transfer to the platform deposit address was found in this transaction.");
            } else if (raw.includes("Amount mismatch")) {
                errorMessage =
                    t("agent.deposit.err_amount_mismatch", "The amount you entered does not match the confirmed blockchain transfer.");
            }

            Alert.alert(t("agent.deposit.deposit_failed", "Deposit failed"), errorMessage);
        }
    };

    if (fetching) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Flat Header — consistent with other account screens */}
            <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.headerBackBtn, { backgroundColor: theme.accentLight }]} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color={theme.accent} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{t("agent.deposit.header_title", "Deposit Funds")}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Purple themed summary card */}
                    <LinearGradient
                        colors={isDark ? ["rgba(124, 58, 237, 0.15)", "rgba(18, 14, 36, 0.8)"] : ["rgba(124, 58, 237, 0.05)", "#FFFFFF"]}
                        style={[styles.introSection, { borderColor: theme.border }]}
                    >
                        <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("agent.deposit.treasury_topup", "Treasury Top-Up")}</Text>
                        <Text style={[styles.introTitle, { color: theme.text }]}>{t("agent.deposit.add_capacity", "Add Agent Capacity")}</Text>
                        <Text style={[styles.introDescription, { color: theme.muted }]}>
                            {t("agent.deposit.topup_desc", "Top up your float to support more mint and burn transactions with fresh USDT liquidity.")}
                        </Text>
                    </LinearGradient>

                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>{t("agent.deposit.min_deposit", "Minimum Deposit")}</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>${minimumDeposit || 0} USDT</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>{t("agent.deposit.network", "Network")}</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{depositNetwork}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>{t("agent.deposit.token", "Token")}</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>USDT</Text>
                        </View>
                    </View>

                    <View style={[styles.warningBanner, { backgroundColor: theme.dangerSoft, borderColor: theme.danger + "20" }]}>
                        <Ionicons name="warning" size={18} color={theme.danger} />
                        <Text style={[styles.warningText, { color: theme.danger }]}>
                            {t("agent.deposit.warning_desc", "Only send USDT on Polygon network. Sending any other network or token will result in permanent loss.")}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.muted }]}>{t("agent.deposit.deposit_address", "Deposit Address")}</Text>
                        <View style={[styles.qrContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={{ padding: 16, backgroundColor: "#FFFFFF", borderRadius: 16 }}>
                                {depositAddress ? (
                                    <QRCode
                                        value={depositAddress}
                                        size={160}
                                        color="#000000"
                                        backgroundColor="#FFFFFF"
                                    />
                                ) : null}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.addressContainer, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                            onPress={() => handleCopy(depositAddress)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="middle">
                                {depositAddress || t("agent.deposit.address_unavailable", "Address unavailable")}
                            </Text>
                            <View style={[styles.copyButton, { backgroundColor: theme.accentLight }]}>
                                <Ionicons name="copy-outline" size={16} color={theme.accent} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.muted }]}>{t("agent.deposit.verify_deposit", "Verify Deposit")}</Text>

                        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.muted }]}>{t("agent.deposit.amount_label", "Amount (USDT) *")}</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: fieldErrors.amount ? theme.danger : theme.border }]}>
                                    <Text style={[styles.inputPrefix, { color: theme.text }]}>$</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder={`Minimum ${minimumDeposit || 0}`}
                                        placeholderTextColor={theme.muted}
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
                                </View>
                                {fieldErrors.amount ? (
                                    <Text style={styles.errorText}>{fieldErrors.amount}</Text>
                                ) : (
                                    <Text style={[styles.helperText, { color: theme.muted }]}>
                                        {t("agent.deposit.amount_helper", "Enter the exact USDT amount you sent to the address above.")}
                                    </Text>
                                )}
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: theme.muted }]}>{t("agent.deposit.hash_label", "Transaction Hash *")}</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: fieldErrors.txHash ? theme.danger : theme.border }]}>
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="0x..."
                                        placeholderTextColor={theme.muted}
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
                                </View>
                                {fieldErrors.txHash ? (
                                    <Text style={styles.errorText}>{fieldErrors.txHash}</Text>
                                ) : (
                                    <Text style={[styles.helperText, { color: theme.muted }]}>
                                        {t("agent.deposit.hash_helper", "Paste the transaction hash from your wallet after the transfer is sent.")}
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    <View style={[styles.infoBanner, { backgroundColor: theme.accentLight, borderColor: theme.border }]}>
                        <Ionicons name="information-circle" size={18} color={theme.accent} style={{ marginRight: 6 }} />
                        <Text style={[styles.infoText, { color: theme.accent }]}>
                            {t("agent.deposit.confirmations_desc", "Deposits are verified on-chain. Confirmation can take a few minutes depending on network conditions.")}
                        </Text>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>

                <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            { backgroundColor: theme.accent },
                            (!isFormValid || loading) && styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={!isFormValid || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>{t("agent.deposit.btn_submit", "Submit for Verification")}</Text>
                                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                            </>
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
    },
    headerContainer: {
        borderBottomWidth: 1,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    headerBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    headerSpacer: {
        width: 36,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    introSection: {
        marginBottom: 20,
        alignItems: "center",
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
    },
    introEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    introTitle: {
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 6,
        textAlign: "center",
        letterSpacing: -0.4,
    },
    introDescription: {
        fontSize: 13,
        textAlign: "center",
        lineHeight: 20,
        fontWeight: "500",
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: "600",
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "800",
    },
    divider: {
        height: 1,
    },
    warningBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 20,
        gap: 8,
    },
    warningText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
        fontWeight: "600",
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        marginBottom: 10,
        marginLeft: 4,
    },
    qrContainer: {
        alignItems: "center",
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 12,
    },
    addressContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 18,
        borderWidth: 1.5,
        gap: 12,
    },
    addressText: {
        flex: 1,
        fontSize: 13,
        fontFamily: "monospace",
        fontWeight: "600",
    },
    copyButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    formCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
        marginBottom: 14,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: "800",
        marginBottom: 8,
        marginLeft: 4,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        borderWidth: 1.5,
        paddingHorizontal: 14,
    },
    inputPrefix: {
        fontSize: 16,
        fontWeight: "700",
        marginRight: 4,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        paddingVertical: 14,
    },
    helperText: {
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: "500",
    },
    errorText: {
        fontSize: 12,
        color: "#EF4444",
        marginTop: 6,
        marginLeft: 4,
        fontWeight: "600",
    },
    infoBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
    },
    infoText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
        fontWeight: "500",
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    submitButton: {
        flexDirection: "row",
        paddingVertical: 15,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.55,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
});
