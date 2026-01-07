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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAgentStore } from "@/stores/slices/agentSlice";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/constants/api";

export default function DepositScreen() {
    const router = useRouter();
    const { submitDeposit, loading } = useAgentStore();
    const [depositData, setDepositData] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [amount, setAmount] = useState("");
    const [txHash, setTxHash] = useState("");

    useEffect(() => {
        fetchDepositAddress();
    }, []);

    const fetchDepositAddress = async () => {
        try {
            const { data } = await apiClient.get(API_ENDPOINTS.AGENTS.DEPOSIT_ADDRESS);
            setDepositData(data.data);
        } catch (error: any) {
            Alert.alert("Error", "Failed to fetch deposit address");
        } finally {
            setFetching(false);
        }
    };

    const handleCopy = (text: string) => {
        Clipboard.setString(text);
        Alert.alert("Copied", "Address copied to clipboard");
    };

    const handleSubmit = async () => {
        if (!amount || !txHash) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        try {
            await submitDeposit(parseFloat(amount), txHash);
            Alert.alert("Success", "Deposit submitted for verification!");
            router.back();
        } catch (error: any) {
            // Extract the actual error message from the response
            const errorMessage = error.response?.data?.message || error.message || "Failed to verify deposit";
            Alert.alert("Verification Failed", errorMessage);
        }
    };

    if (fetching) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
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
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Deposit Address</Text>
                    <Text style={styles.instruction}>
                        Send USDT (Polygon) to the address below:
                    </Text>

                    <TouchableOpacity
                        style={styles.addressContainer}
                        onPress={() => handleCopy(depositData?.address)}
                    >
                        <Text style={styles.addressText}>{depositData?.address}</Text>
                        <Ionicons name="copy-outline" size={20} color="#7C3AED" />
                    </TouchableOpacity>

                    <View style={styles.networkBadge}>
                        <Text style={styles.networkText}>Network: {depositData?.network}</Text>
                    </View>

                    <View style={styles.warningContainer}>
                        <Ionicons name="warning" size={20} color="#F59E0B" />
                        <Text style={styles.warningText}>
                            Only send USDT on Polygon network. Minimum deposit: ${depositData?.minimum_deposit}
                        </Text>
                    </View>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Verify Deposit</Text>
                    <Text style={styles.instruction}>
                        After sending funds, enter the details below:
                    </Text>

                    <Text style={styles.label}>Amount (USDT)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 100.00"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />

                    <Text style={styles.label}>Transaction Hash</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0x..."
                        value={txHash}
                        onChangeText={setTxHash}
                    />

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit for Verification</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    backButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#F3F4F6",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    formCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 8,
    },
    instruction: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 16,
    },
    addressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F3F4F6",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    addressText: {
        fontSize: 12,
        fontFamily: "monospace",
        color: "#374151",
        flex: 1,
        marginRight: 8,
    },
    networkBadge: {
        alignSelf: "flex-start",
        backgroundColor: "#EDE9FE",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 16,
    },
    networkText: {
        fontSize: 12,
        color: "#7C3AED",
        fontWeight: "600",
    },
    warningContainer: {
        flexDirection: "row",
        gap: 8,
        backgroundColor: "#FFFBEB",
        padding: 12,
        borderRadius: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        color: "#B45309",
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: "#111827",
        marginBottom: 16,
        backgroundColor: "#F9FAFB",
    },
    submitButton: {
        backgroundColor: "#7C3AED",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    submitButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
});
