import React, { useState } from "react";
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

const TOKENS = ["NT", "CT", "USDT"];

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

    const handleContinue = () => {
        if (!amount || parseFloat(amount) <= 0) return;

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
            style={{ flex: 1 }}
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

                <ScrollView contentContainerStyle={styles.content}>
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
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            autoFocus
                        />
                        <Text style={styles.currencySuffix}>{selectedToken}</Text>
                    </View>

                    <Text style={styles.balanceText}>
                        Available Balance: {getBalance(selectedToken)} {selectedToken}
                    </Text>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                        <Text style={styles.infoText}>
                            Tokens will be held in escrow until the agent confirms payment to your bank account.
                        </Text>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            (!amount || parseFloat(amount) <= 0) && styles.disabledButton,
                        ]}
                        onPress={handleContinue}
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        <Text style={styles.continueText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
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
        padding: 20,
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
        marginBottom: 32,
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
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
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
