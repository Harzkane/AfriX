import React, { useState } from "react";
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    Dimensions
} from "react-native";
import { Text, Surface, Card } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBurnStore } from "@/stores/slices/burnSlice";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

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

            await createBurnRequest(requestData);

            Alert.alert("Success", "Sell request created successfully!", [
                { text: "OK", onPress: () => router.replace("/(tabs)/sell-tokens/status") }
            ]);
        } catch (error: any) {
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
            {/* Header Section */}
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
                        <Text style={styles.headerTitle}>Review Request</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.introContainer}>
                    <Text style={styles.title}>Confirm Your Transaction</Text>
                    <Text style={styles.subtitle}>
                        Please review the details below before processing your sell request.
                    </Text>
                </View>

                {/* Amount Summary Card */}
                <Surface style={styles.summaryCard} elevation={0}>
                    <Text style={styles.summaryLabel}>Total to Sell</Text>
                    <View style={styles.amountContainer}>
                        <Text style={styles.summaryAmount}>{amount}</Text>
                        <Text style={styles.tokenTag}>{tokenType}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconBg}>
                            <Ionicons name="person-outline" size={18} color="#00B14F" />
                        </View>
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Recipient Agent</Text>
                            <Text style={styles.detailValue}>{agentName}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconBg}>
                            <Ionicons name="business-outline" size={18} color="#00B14F" />
                        </View>
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Payout Bank</Text>
                            <Text style={styles.detailValue}>{bankName}</Text>
                        </View>
                    </View>

                    <View style={styles.detailRow}>
                        <View style={styles.detailIconBg}>
                            <Ionicons name="card-outline" size={18} color="#00B14F" />
                        </View>
                        <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>Account Details</Text>
                            <Text style={styles.detailValue}>{accountNumber}</Text>
                            <Text style={styles.accountSubValue}>{accountName}</Text>
                        </View>
                    </View>
                </Surface>

                {/* Security Box */}
                <View style={styles.infoBox}>
                    <View style={styles.infoIconBg}>
                        <Ionicons name="shield-checkmark" size={24} color="#00B14F" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoTitle}>Secure Escrow</Text>
                        <Text style={styles.infoText}>
                            Your tokens will be held securely in escrow. They will only be released to the agent after you confirm receipt of payment in your bank account.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Footer Action */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.confirmButton, loading && styles.disabledButton]}
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.confirmText}>Confirm & Sell Now</Text>
                            <Ionicons name="flash" size={20} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    headerWrapper: {
        marginBottom: 0,
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 140,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    introContainer: {
        marginTop: 30,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#6B7280",
        lineHeight: 22,
    },
    summaryCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    summaryLabel: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
        textAlign: "center",
        marginBottom: 12,
    },
    amountContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "center",
        marginBottom: 24,
        gap: 8,
    },
    summaryAmount: {
        fontSize: 40,
        fontWeight: "900",
        color: "#111827",
    },
    tokenTag: {
        fontSize: 18,
        fontWeight: "700",
        color: "#00B14F",
    },
    divider: {
        height: 1,
        backgroundColor: "#F3F4F6",
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: "row",
        marginBottom: 20,
        gap: 16,
    },
    detailIconBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#ECFDF5",
        alignItems: "center",
        justifyContent: "center",
    },
    detailTextContainer: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: "#9CA3AF",
        fontWeight: "600",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
    },
    accountSubValue: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 2,
    },
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#F0FDF4",
        padding: 20,
        borderRadius: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: "#DCFCE7",
    },
    infoIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#00B14F",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#166534",
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: "#15803D",
        lineHeight: 20,
    },
    footer: {
        padding: 20,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        paddingBottom: Platform.OS === 'ios' ? 90 : 80, // Lift above floating tab bar
    },
    confirmButton: {
        backgroundColor: "#00B14F",
        height: 58,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
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
    confirmText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
