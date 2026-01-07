import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBurnStore } from "@/stores/slices/burnSlice";

export default function ConfirmSellScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { createBurnRequest, loading } = useBurnStore();

    const {
        amount,
        tokenType,
        agentId,
        agentName,
        bankName,
        accountNumber,
        accountName,
    } = params;

    const handleConfirm = async () => {
        // Debug: Log all params
        console.log("🔍 Confirm screen params:", {
            amount,
            tokenType,
            agentId,
            agentName,
            bankName,
            accountNumber,
            accountName,
        });

        // Validate required fields
        if (!tokenType || !amount || !agentId) {
            Alert.alert("Error", "Missing required information. Please start over.");
            return;
        }

        try {
            const requestData = {
                agent_id: agentId as string,
                amount: amount as string,
                token_type: tokenType as string,
                bank_account: {
                    bank_name: bankName as string,
                    account_number: accountNumber as string,
                    account_name: accountName as string,
                },
            };

            console.log("📤 Sending burn request:", requestData);

            await createBurnRequest(requestData);

            Alert.alert("Success", "Sell request created successfully!", [
                { text: "OK", onPress: () => router.replace("/(tabs)/sell-tokens/status") }
            ]);
        } catch (error: any) {
            // Check if this is a self-transaction error
            const errorMessage = error.message || "";
            if (errorMessage.includes("cannot create burn requests to themselves")) {
                Alert.alert(
                    "⚠️ Cannot Select Yourself",
                    "As an agent, you cannot sell tokens to yourself. Please select a different agent to complete this transaction.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
            } else {
                Alert.alert("Error", error.message || "Failed to create request");
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm Request</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>You are selling</Text>
                    <Text style={styles.summaryAmount}>
                        {amount} {tokenType}
                    </Text>
                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>To Agent</Text>
                        <Text style={styles.rowValue}>{agentName}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Receiving Bank</Text>
                        <Text style={styles.rowValue}>{bankName}</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Account Number</Text>
                        <Text style={styles.rowValue}>{accountNumber}</Text>
                    </View>
                </View>

                <View style={styles.infoBox}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                    <Text style={styles.infoText}>
                        Your {amount} {tokenType} will be locked in escrow. Once the agent sends payment to your bank, you will be asked to confirm receipt to release the tokens.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.confirmText}>Confirm & Sell</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
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
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    content: {
        padding: 20,
    },
    summaryCard: {
        backgroundColor: "#F9FAFB",
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    summaryLabel: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 8,
    },
    summaryAmount: {
        fontSize: 32,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
        marginBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    rowLabel: {
        fontSize: 14,
        color: "#6B7280",
    },
    rowValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
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
    confirmButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    confirmText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
