// app/modals/send-tokens/amount.tsx
import React, { useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransferStore, useWalletStore } from "@/stores";

const PRESET_AMOUNTS = [1000, 5000, 10000, 20000];

export default function SendAmountScreen() {
    const router = useRouter();

    const {
        tokenType,
        amount,
        setAmount,
        note,
        setNote,
        fee,
        calculateFee,
        recipientEmail,
    } = useTransferStore();

    const { getWalletByType } = useWalletStore();
    const wallet = getWalletByType(tokenType);

    useEffect(() => {
        calculateFee();
    }, [amount]);

    const availableBalance = wallet ? parseFloat(wallet.available_balance) : 0;
    const amountNum = parseFloat(amount) || 0;
    const total = amountNum + fee;
    const hasInsufficientBalance = total > availableBalance;

    const handleContinue = () => {
        if (!amount || amountNum <= 0) {
            return;
        }

        if (hasInsufficientBalance) {
            return;
        }

        router.push("/modals/send-tokens/confirm");
    };

    const handleSetPreset = (preset: number) => {
        setAmount(preset.toString());
    };

    const handleSetMax = () => {
        if (wallet) {
            // Set max amount minus fee (approximate)
            const maxAmount = availableBalance - (availableBalance * 0.005);
            setAmount(Math.max(0, maxAmount).toFixed(2));
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Recipient Info */}
                <View style={styles.recipientCard}>
                    <View style={styles.recipientHeader}>
                        <Ionicons name="person-circle-outline" size={40} color="#00B14F" />
                        <View style={styles.recipientInfo}>
                            <Text style={styles.recipientLabel}>Sending to</Text>
                            <Text style={styles.recipientEmail}>{recipientEmail}</Text>
                        </View>
                    </View>
                </View>

                {/* Amount Input */}
                <View style={styles.section}>
                    <Text style={styles.label}>Amount to Send</Text>
                    <View style={styles.amountInputWrapper}>
                        <TextInput
                            mode="outlined"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                            style={styles.amountInput}
                            outlineStyle={styles.amountInputOutline}
                            contentStyle={styles.amountInputContent}
                            returnKeyType="done"
                        />
                        <Text style={styles.currencyLabel}>{tokenType}</Text>
                    </View>

                    {/* Preset Amounts */}
                    <View style={styles.presets}>
                        {PRESET_AMOUNTS.map((preset) => (
                            <TouchableOpacity
                                key={preset}
                                style={[
                                    styles.presetBtn,
                                    amount === preset.toString() && styles.presetBtnActive,
                                ]}
                                onPress={() => handleSetPreset(preset)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.presetText,
                                        amount === preset.toString() && styles.presetTextActive,
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
                </View>

                {/* Balance Info */}
                {wallet && (
                    <View style={styles.balanceInfo}>
                        <View style={styles.balanceRow}>
                            <Text style={styles.balanceLabel}>Available Balance</Text>
                            <Text style={styles.balanceValue}>
                                {availableBalance.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{" "}
                                {tokenType}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Transaction Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Transaction Summary</Text>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Amount</Text>
                        <Text style={styles.summaryValue}>
                            {amountNum.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Fee (0.5%)</Text>
                        <Text style={styles.summaryValue}>
                            {fee.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType}
                        </Text>
                    </View>

                    <View style={[styles.summaryRow, styles.summaryRowTotal]}>
                        <Text style={styles.summaryLabelTotal}>Total</Text>
                        <Text style={styles.summaryValueTotal}>
                            {total.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType}
                        </Text>
                    </View>
                </View>

                {/* Insufficient Balance Warning */}
                {hasInsufficientBalance && amountNum > 0 && (
                    <View style={styles.warningCard}>
                        <Ionicons name="warning" size={20} color="#F59E0B" />
                        <Text style={styles.warningText}>
                            Insufficient balance. You need{" "}
                            {(total - availableBalance).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{" "}
                            {tokenType} more.
                        </Text>
                    </View>
                )}

                {/* Optional Note */}
                <View style={styles.section}>
                    <Text style={styles.label}>Add Note (Optional)</Text>
                    <TextInput
                        mode="outlined"
                        value={note}
                        onChangeText={setNote}
                        placeholder="e.g., Payment for services"
                        multiline
                        numberOfLines={3}
                        style={styles.noteInput}
                        outlineStyle={styles.noteInputOutline}
                        maxLength={500}
                    />
                    <Text style={styles.noteHint}>{note.length}/500</Text>
                </View>

                {/* Continue Button */}
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
                    <Text style={styles.continueBtnText}>Review Transfer</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    recipientCard: {
        backgroundColor: "#F0FDF4",
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#D1FAE5",
    },
    recipientHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    recipientInfo: {
        flex: 1,
    },
    recipientLabel: {
        fontSize: 12,
        color: "#065F46",
        fontWeight: "500",
        marginBottom: 2,
    },
    recipientEmail: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    amountInputWrapper: {
        position: "relative",
    },
    amountInput: {
        backgroundColor: "#FFFFFF",
        fontSize: 32,
        fontWeight: "700",
        textAlign: "center",
    },
    amountInputOutline: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#00B14F",
    },
    amountInputContent: {
        paddingVertical: 20,
        paddingRight: 80,
    },
    currencyLabel: {
        position: "absolute",
        right: 24,
        top: "50%",
        transform: [{ translateY: -12 }],
        fontSize: 20,
        fontWeight: "600",
        color: "#6B7280",
    },
    presets: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 16,
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
        backgroundColor: "#F0FDF4",
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
    balanceInfo: {
        marginBottom: 24,
    },
    balanceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    balanceLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    balanceValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    summaryCard: {
        backgroundColor: "#F9FAFB",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    summaryTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    summaryRowTotal: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        marginBottom: 0,
    },
    summaryLabelTotal: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    summaryValueTotal: {
        fontSize: 18,
        fontWeight: "700",
        color: "#00B14F",
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
    noteInput: {
        backgroundColor: "#FFFFFF",
        fontSize: 14,
    },
    noteInputOutline: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#F3F4F6",
    },
    noteHint: {
        fontSize: 12,
        color: "#9CA3AF",
        textAlign: "right",
        marginTop: 4,
    },
    continueBtn: {
        backgroundColor: "#00B14F",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    continueBtnDisabled: {
        backgroundColor: "#E5E7EB",
    },
    continueBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    bottomSpacer: {
        height: 40,
    },
});
