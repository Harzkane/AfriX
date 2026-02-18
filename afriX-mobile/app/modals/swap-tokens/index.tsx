// app/modals/swap-tokens/index.tsx
import React, { useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSwapStore, useWalletStore } from "@/stores";
import { parseAmountInput, formatAmountForInput, clampAmountToMax } from "@/utils/format";

const TOKEN_INFO = {
    NT: { name: "Naira Token", icon: "cash-outline", color: "#00B14F" },
    CT: { name: "XOF Token", icon: "leaf-outline", color: "#10B981" },
    USDT: { name: "USDT", icon: "logo-usd", color: "#3B82F6" },
};

export default function SwapTokensScreen() {
    const router = useRouter();

    const {
        fromToken,
        toToken,
        amount,
        estimatedReceive,
        exchangeRate,
        fetchingRate,
        setFromToken,
        setToToken,
        setAmount,
        swapTokens,
        fetchExchangeRate,
        reset,
    } = useSwapStore();

    const { getWalletByType } = useWalletStore();

    const fromWallet = getWalletByType(fromToken);
    const toWallet = getWalletByType(toToken);

    useEffect(() => {
        fetchExchangeRate();
    }, []);

    const availableBalance = fromWallet
        ? parseFloat(fromWallet.available_balance)
        : 0;

    // When user changes "From" token, clamp amount to new token's balance so input updates
    useEffect(() => {
        const num = parseFloat(amount) || 0;
        if (amount && num > availableBalance) {
            setAmount(clampAmountToMax(amount, availableBalance, fromToken));
        }
    }, [fromToken]);

    const amountNum = parseFloat(amount) || 0;
    const hasInsufficientBalance = amountNum > availableBalance;

    const handleContinue = () => {
        if (!amount || amountNum <= 0) {
            return;
        }

        if (hasInsufficientBalance) {
            return;
        }

        router.push("/modals/swap-tokens/confirm");
    };

    const handleSetMax = () => {
        if (fromWallet) {
            const raw =
                fromToken === "USDT"
                    ? availableBalance.toFixed(2)
                    : Math.floor(availableBalance).toString();
            setAmount(raw);
        }
    };

    const handleAmountChange = (text: string) => {
        const parsed = parseAmountInput(text, fromToken);
        const clamped = clampAmountToMax(parsed, availableBalance, fromToken);
        setAmount(clamped);
    };

    const handleCancel = () => {
        reset();
        router.back();
    };

    const TokenSelector = ({
        label,
        selectedToken,
        onSelect,
    }: {
        label: string;
        selectedToken: "NT" | "CT" | "USDT";
        onSelect: (token: "NT" | "CT" | "USDT") => void;
    }) => (
        <View style={styles.tokenSelectorContainer}>
            <Text style={styles.selectorLabel}>{label}</Text>
            <View style={styles.tokenOptions}>
                {(["NT", "CT", "USDT"] as const).map((token) => (
                    <TouchableOpacity
                        key={token}
                        style={[
                            styles.tokenOption,
                            selectedToken === token && styles.tokenOptionActive,
                        ]}
                        onPress={() => onSelect(token)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={TOKEN_INFO[token].icon as any}
                            size={20}
                            color={
                                selectedToken === token
                                    ? TOKEN_INFO[token].color
                                    : "#9CA3AF"
                            }
                        />
                        <Text
                            style={[
                                styles.tokenOptionText,
                                selectedToken === token && styles.tokenOptionTextActive,
                            ]}
                        >
                            {token}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

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
                                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Swap Tokens</Text>
                            <View style={{ width: 24 }} />
                        </View>
                    </SafeAreaView>
                </View>

                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.subtitle}>
                        Exchange your tokens at the current rate
                    </Text>

                    {/* From Token */}
                    <View style={styles.swapCard}>
                        <TokenSelector
                            label="From"
                            selectedToken={fromToken}
                            onSelect={setFromToken}
                        />

                        {/* Amount Input */}
                        <View style={styles.amountSection}>
                            <View style={styles.amountInputWrapper}>
                                <TextInput
                                    mode="outlined"
                                    value={formatAmountForInput(amount, fromToken)}
                                    onChangeText={handleAmountChange}
                                    keyboardType="numeric"
                                    placeholder={fromToken === "USDT" ? "0.00" : "0"}
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.amountInput}
                                    outlineStyle={styles.amountInputOutline}
                                    contentStyle={styles.amountInputContent}
                                />
                                <TouchableOpacity
                                    style={styles.maxBtn}
                                    onPress={handleSetMax}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.maxBtnText}>MAX</Text>
                                </TouchableOpacity>
                            </View>

                            {fromWallet && (
                                <Text style={styles.balanceText}>
                                    Available: {availableBalance.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{" "}
                                    {fromToken}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Swap Direction Button */}
                    <View style={styles.swapButtonContainer}>
                        <TouchableOpacity
                            style={styles.swapDirectionBtn}
                            onPress={swapTokens}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="swap-vertical" size={24} color="#00B14F" />
                        </TouchableOpacity>
                    </View>

                    {/* To Token */}
                    <View style={styles.swapCard}>
                        <TokenSelector
                            label="To"
                            selectedToken={toToken}
                            onSelect={setToToken}
                        />

                        {/* Estimated Receive */}
                        <View style={styles.receiveSection}>
                            <Text style={styles.receiveLabel}>You will receive</Text>
                            <View style={styles.receiveAmount}>
                                {fetchingRate ? (
                                    <ActivityIndicator size="small" color="#00B14F" />
                                ) : (
                                    <Text style={styles.receiveValue}>
                                        {parseFloat(estimatedReceive).toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{" "}
                                        {toToken}
                                    </Text>
                                )}
                            </View>

                            {toWallet && (
                                <Text style={styles.balanceText}>
                                    Current balance: {parseFloat(toWallet.available_balance).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{" "}
                                    {toToken}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Exchange Rate */}
                    <View style={styles.rateCard}>
                        <View style={styles.rateRow}>
                            <Text style={styles.rateLabel}>Exchange Rate</Text>
                            {fetchingRate ? (
                                <ActivityIndicator size="small" color="#6B7280" />
                            ) : (
                                <Text style={styles.rateValue}>
                                    1 {fromToken} = {exchangeRate.toFixed(4)} {toToken}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Insufficient Balance Warning */}
                    {hasInsufficientBalance && amountNum > 0 && (
                        <View style={styles.warningCard}>
                            <Ionicons name="warning" size={20} color="#F59E0B" />
                            <Text style={styles.warningText}>
                                Insufficient balance. You need{" "}
                                {(amountNum - availableBalance).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{" "}
                                {fromToken} more.
                            </Text>
                        </View>
                    )}

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                        <View style={styles.infoText}>
                            <Text style={styles.infoTitle}>Instant Swap</Text>
                            <Text style={styles.infoDesc}>
                                Your swap will be processed instantly at the current exchange rate.
                            </Text>
                        </View>
                    </View>

                </ScrollView>

                <SafeAreaView edges={["bottom"]} style={styles.footerWrapper}>
                    <View style={styles.footer}>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={handleCancel}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.continueBtn,
                                    (!amount || amountNum <= 0 || hasInsufficientBalance) &&
                                    styles.continueBtnDisabled,
                                ]}
                                onPress={handleContinue}
                                disabled={!amount || amountNum <= 0 || hasInsufficientBalance}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueBtnText}>Review Swap</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
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
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
    },
    subtitle: {
        fontSize: 14,
        color: "#9CA3AF",
    },
    swapCard: {
        backgroundColor: "#F9FAFB",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    tokenSelectorContainer: {
        marginBottom: 16,
    },
    selectorLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 12,
    },
    tokenOptions: {
        flexDirection: "row",
        gap: 8,
    },
    tokenOption: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        paddingVertical: 10,
    },
    tokenOptionActive: {
        borderColor: "#00B14F",
        backgroundColor: "#F0FDF4",
    },
    tokenOptionText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    tokenOptionTextActive: {
        color: "#00B14F",
    },
    amountSection: {
        marginTop: 8,
    },
    amountInputWrapper: {
        position: "relative",
    },
    amountInput: {
        backgroundColor: "#FFFFFF",
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
    },
    amountInputOutline: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
    },
    amountInputContent: {
        paddingVertical: 16,
        paddingRight: 80,
        color: "#111827",
    },
    maxBtn: {
        position: "absolute",
        right: 12,
        top: "50%",
        transform: [{ translateY: -16 }],
        backgroundColor: "#EFF6FF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    maxBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#3B82F6",
    },
    balanceText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 8,
    },
    swapButtonContainer: {
        alignItems: "center",
        marginVertical: -20,
        zIndex: 1,
    },
    swapDirectionBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
        borderColor: "#00B14F",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    receiveSection: {
        marginTop: 8,
    },
    receiveLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 8,
    },
    receiveAmount: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        minHeight: 60,
        justifyContent: "center",
    },
    receiveValue: {
        fontSize: 24,
        fontWeight: "700",
        color: "#00B14F",
    },
    rateCard: {
        backgroundColor: "#EFF6FF",
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    rateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    rateLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1E40AF",
    },
    rateValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1E40AF",
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
    infoCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: "#EFF6FF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    infoText: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 18,
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
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B7280",
    },
    continueBtn: {
        flex: 2,
        backgroundColor: "#00B14F",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    continueBtnDisabled: {
        backgroundColor: "#E5E7EB",
    },
    continueBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
