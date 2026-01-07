import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Clipboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

export default function AgentDepositScreen() {
    const router = useRouter();
    const [txHash, setTxHash] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    // TODO: Get this from backend/agent profile
    const depositAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    const minimumDeposit = 100;

    const copyAddress = () => {
        Clipboard.setString(depositAddress);
        Alert.alert("Copied!", "Deposit address copied to clipboard");
    };

    const handleSubmit = async () => {
        // Validation
        if (!amount.trim()) {
            Alert.alert("Error", "Please enter deposit amount");
            return;
        }

        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount < minimumDeposit) {
            Alert.alert("Error", `Minimum deposit is $${minimumDeposit} USDT`);
            return;
        }

        if (!txHash.trim()) {
            Alert.alert("Error", "Please enter transaction hash");
            return;
        }

        if (!txHash.startsWith("0x") || txHash.length !== 66) {
            Alert.alert("Error", "Invalid transaction hash format");
            return;
        }

        setLoading(true);

        try {
            // TODO: Submit deposit to backend
            // await apiClient.post('/agents/deposit', {
            //     amount_usd: depositAmount,
            //     tx_hash: txHash,
            // });

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            Alert.alert(
                "Deposit Submitted!",
                "Your deposit is being verified. You'll be notified once confirmed and your agent account will be activated.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.replace("/agent/dashboard");
                        },
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit deposit");
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
                <Text style={styles.headerTitle}>Security Deposit</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, styles.progressDotComplete]}>
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.progressLabel}>Register</Text>
                    </View>
                    <View style={[styles.progressLine, styles.progressLineActive]} />
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, styles.progressDotComplete]}>
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.progressLabel}>KYC</Text>
                    </View>
                    <View style={[styles.progressLine, styles.progressLineActive]} />
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, styles.progressDotActive]}>
                            <Text style={styles.progressNumber}>3</Text>
                        </View>
                        <Text style={styles.progressLabel}>Deposit</Text>
                    </View>
                </View>

                {/* Introduction */}
                <View style={styles.introSection}>
                    <Text style={styles.introTitle}>Almost There! 🎉</Text>
                    <Text style={styles.introDescription}>
                        Make your security deposit to activate your agent account and start earning.
                    </Text>
                </View>

                {/* Deposit Info */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Minimum Deposit</Text>
                        <Text style={styles.infoValue}>${minimumDeposit} USDT</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Network</Text>
                        <Text style={styles.infoValue}>Polygon (MATIC)</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Token</Text>
                        <Text style={styles.infoValue}>USDT (ERC-20)</Text>
                    </View>
                </View>

                {/* Warning Banner */}
                <View style={styles.warningBanner}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                    <Text style={styles.warningText}>
                        Only send USDT on Polygon network! Sending wrong token or wrong network will
                        result in permanent loss of funds.
                    </Text>
                </View>

                {/* QR Code */}
                <View style={styles.qrSection}>
                    <Text style={styles.sectionTitle}>Deposit Address</Text>
                    <View style={styles.qrContainer}>
                        <QRCode value={depositAddress} size={200} />
                    </View>
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                            {depositAddress}
                        </Text>
                        <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
                            <Ionicons name="copy-outline" size={20} color="#00B14F" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Deposit Form */}
                <View style={styles.form}>
                    <Text style={styles.sectionTitle}>Confirm Your Deposit</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount (USDT) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={`Minimum ${minimumDeposit}`}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                        />
                        <Text style={styles.helperText}>
                            This will be your minting capacity
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Transaction Hash *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0x..."
                            value={txHash}
                            onChangeText={setTxHash}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <Text style={styles.helperText}>
                            Enter the transaction hash from your wallet
                        </Text>
                    </View>
                </View>

                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={20} color="#00B14F" />
                    <Text style={styles.infoText}>
                        Your deposit will be verified on the blockchain. This usually takes 2-5
                        minutes.
                    </Text>
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
                        <>
                            <Text style={styles.submitButtonText}>Verify Deposit</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    progressDotComplete: {
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
    progressLineActive: {
        backgroundColor: "#00B14F",
    },
    introSection: {
        marginBottom: 24,
        alignItems: "center",
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
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
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
        borderRadius: 12,
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 16,
    },
    addressContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
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
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
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
    helperText: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },
    infoBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F0FDF4",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#00B14F",
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
        borderTopColor: "#F3F4F6",
    },
    submitButton: {
        flexDirection: "row",
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
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
