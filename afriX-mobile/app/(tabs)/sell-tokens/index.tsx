import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useWalletStore } from "@/stores";
import { parseAmountInput, formatAmountForInput, clampAmountToMax, formatAmount } from "@/utils/format";

const TOKENS = ["NT", "CT", "USDT"];
const PRESET_AMOUNTS = [1000, 5000, 10000, 20000, 50000];

export default function SellTokensScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { wallets } = useWalletStore();
    const [amount, setAmount] = useState("");
    const [selectedToken, setSelectedToken] = useState("NT");

    // Check if agent is pre-selected from agent profile
    const preSelectedAgentId = params.agentId as string | undefined;
    const preSelectedAgentName = params.agentName as string | undefined;

    const getBalance = (token: string) => {
        const wallet = wallets.find((w) => w.token_type === token);
        return wallet ? parseFloat(wallet.balance).toFixed(2) : "0.00";
    };

    const getAvailableBalance = (token: string) => {
        const wallet = wallets.find((w) => w.token_type === token);
        return wallet ? parseFloat(wallet.available_balance) : 0;
    };

    const availableBalance = getAvailableBalance(selectedToken);
    const tokenTypeForFormat = selectedToken as "NT" | "CT" | "USDT";
    const amountNum = parseFloat(amount) || 0;
    const hasInsufficientBalance = amountNum > availableBalance;

    // When user changes token type, clamp amount to new token's balance
    useEffect(() => {
        if (amount && amountNum > availableBalance) {
            setAmount(clampAmountToMax(amount, availableBalance, tokenTypeForFormat));
        }
    }, [selectedToken]);

    const handleAmountChange = (text: string) => {
        const parsed = parseAmountInput(text, tokenTypeForFormat);
        const clamped = clampAmountToMax(parsed, availableBalance, tokenTypeForFormat);
        setAmount(clamped);
    };

    const handleSetPreset = (preset: number) => {
        const clamped = Math.min(preset, availableBalance);
        const raw =
            tokenTypeForFormat === "USDT"
                ? clamped.toFixed(2)
                : Math.floor(clamped).toString();
        setAmount(raw);
    };

    const handleSetMax = () => {
        const raw =
            tokenTypeForFormat === "USDT"
                ? availableBalance.toFixed(2)
                : Math.floor(availableBalance).toString();
        setAmount(raw);
    };

    const handleContinue = () => {
        if (!amount || amountNum <= 0 || hasInsufficientBalance) return;

        // If agent is pre-selected, skip agent selection and go to bank details
        if (preSelectedAgentId && preSelectedAgentName) {
            router.push({
                pathname: "/(tabs)/sell-tokens/bank-details",
                params: {
                    amount,
                    tokenType: selectedToken,
                    agentId: preSelectedAgentId,
                    agentName: preSelectedAgentName
                }
            });
        } else {
            // Otherwise, go to agent selection
            router.push({
                pathname: "/(tabs)/sell-tokens/select-agent",
                params: { amount, tokenType: selectedToken }
            });
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === "ios" ? -8 : 12}
        >
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
                            <Text style={styles.headerTitle}>Sell Tokens</Text>
                            <View style={{ width: 24 }} />
                        </View>
                    </SafeAreaView>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.label}>Select Token to Sell</Text>
                    <View style={styles.tokenContainer}>
                        {TOKENS.map((token) => (
                            <TouchableOpacity
                                key={token}
                                style={[
                                    styles.tokenButton,
                                    selectedToken === token && styles.selectedToken,
                                ]}
                                onPress={() => setSelectedToken(token)}
                            >
                                <Text
                                    style={[
                                        styles.tokenText,
                                        selectedToken === token && styles.selectedTokenText,
                                    ]}
                                >
                                    {token}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Amount</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={selectedToken === "USDT" ? "0.00" : "0"}
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={formatAmountForInput(amount, tokenTypeForFormat)}
                            onChangeText={handleAmountChange}
                            autoFocus
                        />
                        <Text style={styles.currencySuffix}>{selectedToken}</Text>
                    </View>

                    {/* Preset Amounts + MAX */}
                    <View style={styles.presets}>
                        {PRESET_AMOUNTS.map((preset) => (
                            <TouchableOpacity
                                key={preset}
                                style={[
                                    styles.presetBtn,
                                    amountNum === preset && styles.presetBtnActive,
                                ]}
                                onPress={() => handleSetPreset(preset)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.presetText,
                                        amountNum === preset && styles.presetTextActive,
                                    ]}
                                >
                                    {preset.toLocaleString()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.maxBtn}
                            onPress={handleSetMax}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.maxBtnText}>MAX</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.balanceText}>
                        Available Balance: {formatAmount(availableBalance, selectedToken)} {selectedToken}
                    </Text>

                    {hasInsufficientBalance && amountNum > 0 && (
                        <View style={styles.warningCard}>
                            <Ionicons name="warning" size={20} color="#F59E0B" />
                            <Text style={styles.warningText}>
                                Amount exceeds your available balance. You have{" "}
                                {formatAmount(availableBalance, selectedToken)} {selectedToken}.
                            </Text>
                        </View>
                    )}

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                        <Text style={styles.infoText}>
                            Tokens will be held in escrow until the agent confirms payment to your bank account.
                        </Text>
                    </View>
                </ScrollView>

                <SafeAreaView edges={["bottom"]} style={styles.footerWrapper}>
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                (!amount || amountNum <= 0 || hasInsufficientBalance) &&
                                styles.disabledButton,
                            ]}
                            onPress={handleContinue}
                            disabled={!amount || amountNum <= 0 || hasInsufficientBalance}
                        >
                            <Text style={styles.continueText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    keyboardView: {
        flex: 1,
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
        marginTop: 10,
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginBottom: 12,
    },
    tokenContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 32,
    },
    tokenButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
    },
    selectedToken: {
        backgroundColor: "#ECFDF5",
        borderColor: "#00B14F",
    },
    tokenText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
    },
    selectedTokenText: {
        color: "#00B14F",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "#E5E7EB",
        paddingBottom: 8,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 40,
        fontWeight: "700",
        color: "#111827",
    },
    currencySuffix: {
        fontSize: 20,
        fontWeight: "600",
        color: "#9CA3AF",
        marginLeft: 8,
    },
    balanceText: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 12,
    },
    presets: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
    },
    presetBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    presetBtnActive: {
        backgroundColor: "#ECFDF5",
        borderColor: "#00B14F",
    },
    presetText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    presetTextActive: {
        color: "#00B14F",
    },
    maxBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    maxBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#3B82F6",
    },
    warningCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#FFFBEB",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FDE68A",
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: "#92400E",
        lineHeight: 18,
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#F3F4F6",
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: "#4B5563",
        lineHeight: 20,
    },
    footerWrapper: {
        backgroundColor: "#F3F4F6",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
    },
    continueButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    disabledButton: {
        backgroundColor: "#D1D5DB",
    },
    continueText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
