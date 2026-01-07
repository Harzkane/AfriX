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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BankDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");

    const handleContinue = () => {
        if (!bankName || !accountNumber || !accountName) return;

        router.push({
            pathname: "/(tabs)/sell-tokens/confirm",
            params: {
                ...params,
                bankName,
                accountNumber,
                accountName,
            },
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bank Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    Enter the bank account where you want to receive payment.
                </Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Bank Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. GTBank"
                        value={bankName}
                        onChangeText={setBankName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Account Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0123456789"
                        keyboardType="numeric"
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Account Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Account Holder Name"
                        value={accountName}
                        onChangeText={setAccountName}
                    />
                </View>

                <View style={styles.warningBox}>
                    <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                    <Text style={styles.warningText}>
                        Ensure these details are correct. The agent will send money to this account.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        (!bankName || !accountNumber || !accountName) && styles.disabledButton,
                    ]}
                    onPress={handleContinue}
                    disabled={!bankName || !accountNumber || !accountName}
                >
                    <Text style={styles.continueText}>Review Request</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    description: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 24,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: "#111827",
    },
    warningBox: {
        flexDirection: "row",
        backgroundColor: "#FFFBEB",
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginTop: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        color: "#B45309",
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
