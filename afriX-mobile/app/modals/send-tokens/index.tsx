// app/modals/send-tokens/index.tsx
import React, { useRef, useState } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTransferStore, useWalletStore } from "@/stores";

export default function SendTokensScreen() {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView | null>(null);
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    const { tokenType, setTokenType, setRecipient, reset } = useTransferStore();
    const { getWalletByType } = useWalletStore();

    const wallet = getWalletByType(tokenType);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleContinue = () => {
        if (!email.trim()) {
            setEmailError("Please enter recipient's email");
            return;
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address");
            return;
        }

        setRecipient(email);
        router.push("/modals/send-tokens/amount");
    };

    const handleCancel = () => {
        reset();
        router.back();
    };

    const handleEmailFocus = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({
                y: 500,
                animated: true,
            });
        }, 120);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 72}
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
                            <Text style={styles.headerTitle}>Send Tokens</Text>
                            <View style={{ width: 24 }} />
                        </View>
                    </SafeAreaView>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.container}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <LinearGradient
                        colors={["#F7FFF9", "#FFFFFF"]}
                        style={styles.heroCard}
                    >
                        <Text style={styles.heroEyebrow}>Wallet Transfer</Text>
                        <Text style={styles.heroTitle}>Send tokens instantly</Text>
                        <Text style={styles.heroSubtitle}>
                            Choose the token you want to send, enter the recipient, and continue to complete the transfer securely.
                        </Text>
                    </LinearGradient>

                    {/* Token Type Selector */}
                    <View style={styles.section}>
                        <Text style={styles.sectionEyebrow}>Token Selection</Text>
                        <Text style={styles.label}>Select Token Type</Text>
                        <View style={styles.tokenSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.tokenOption,
                                    tokenType === "NT" && styles.tokenOptionActive,
                                ]}
                                onPress={() => setTokenType("NT")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.tokenEyebrow}>Domestic</Text>
                                <View
                                    style={[
                                        styles.tokenIcon,
                                        tokenType === "NT" && styles.tokenIconActive,
                                    ]}
                                >
                                    <Ionicons
                                        name="cash-outline"
                                        size={24}
                                        color={tokenType === "NT" ? "#00B14F" : "#9CA3AF"}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.tokenName,
                                        tokenType === "NT" && styles.tokenNameActive,
                                    ]}
                                >
                                    Naira Token
                                </Text>
                                <Text style={styles.tokenSymbol}>NT</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.tokenOption,
                                    tokenType === "CT" && styles.tokenOptionActive,
                                ]}
                                onPress={() => setTokenType("CT")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.tokenEyebrow}>Regional</Text>
                                <View
                                    style={[
                                        styles.tokenIcon,
                                        tokenType === "CT" && styles.tokenIconActive,
                                    ]}
                                >
                                    <Ionicons
                                        name="leaf-outline"
                                        size={24}
                                        color={tokenType === "CT" ? "#10B981" : "#9CA3AF"}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.tokenName,
                                        tokenType === "CT" && styles.tokenNameActive,
                                    ]}
                                >
                                    XOF Token
                                </Text>
                                <Text style={styles.tokenSymbol}>CT</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.tokenOption,
                                    tokenType === "USDT" && styles.tokenOptionActive,
                                ]}
                                onPress={() => setTokenType("USDT")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.tokenEyebrow}>Reserve</Text>
                                <View
                                    style={[
                                        styles.tokenIcon,
                                        tokenType === "USDT" && styles.tokenIconActive,
                                    ]}
                                >
                                    <Ionicons
                                        name="logo-usd"
                                        size={24}
                                        color={tokenType === "USDT" ? "#3B82F6" : "#9CA3AF"}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.tokenName,
                                        tokenType === "USDT" && styles.tokenNameActive,
                                    ]}
                                >
                                    USDT
                                </Text>
                                <Text style={styles.tokenSymbol}>USDT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Current Balance */}
                    {wallet && (
                        <View
                            style={[
                                styles.balanceCard,
                                tokenType === "CT" && styles.balanceCardCT,
                                tokenType === "USDT" && styles.balanceCardUSDT,
                            ]}
                        >
                            <Text style={styles.balanceEyebrow}>Available Wallet Position</Text>
                            <Text style={styles.balanceLabel}>Available Balance</Text>
                            <Text style={styles.balanceAmount}>
                                {parseFloat(wallet.available_balance).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{" "}
                                {tokenType}
                            </Text>
                        </View>
                    )}

                    {/* Recipient Email Input */}
                    <View style={styles.section}>
                        <Text style={styles.sectionEyebrow}>Recipient Details</Text>
                        <Text style={styles.label}>Recipient&apos;s Email</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color="#9CA3AF"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                mode="outlined"
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setEmailError("");
                                }}
                                keyboardType="email-address"
                                placeholder="user@example.com"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={handleEmailFocus}
                                style={styles.input}
                                outlineStyle={styles.inputOutline}
                                contentStyle={styles.inputContent}
                                error={!!emailError}
                            />
                        </View>
                        {emailError ? (
                            <Text style={styles.errorText}>{emailError}</Text>
                        ) : null}
                        <Text style={styles.inputHint}>
                            Use the recipient&apos;s AfriToken account email or scan their QR code below.
                        </Text>

                        {/* OR Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Scan QR Button */}
                        <TouchableOpacity
                            style={styles.scanQrBtn}
                            onPress={() => router.push("/modals/send-tokens/scan-qr")}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="qr-code-outline" size={24} color="#00B14F" />
                            <Text style={styles.scanQrText}>Scan QR Code</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <Ionicons name="information-circle" size={20} color="#3B82F6" />
                            <Text style={styles.infoTitle}>Quick Tip</Text>
                        </View>
                        <Text style={styles.infoText}>
                            Make sure the recipient has an AfriToken account with this email
                            address.
                        </Text>
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
                                    (!email.trim() || !!emailError) && styles.continueBtnDisabled,
                                ]}
                                onPress={handleContinue}
                                disabled={!email.trim() || !!emailError}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.continueBtnText}>Continue</Text>
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
    heroCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: "#E6F4EA",
    },
    heroEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
        letterSpacing: -0.4,
    },
    heroSubtitle: {
        fontSize: 15,
        color: "#6B7280",
        lineHeight: 22,
    },
    section: {
        marginBottom: 24,
    },
    sectionEyebrow: {
        fontSize: 11,
        fontWeight: "800",
        color: "#00B14F",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 12,
    },
    tokenSelector: {
        flexDirection: "row",
        gap: 12,
    },
    tokenOption: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
        borderColor: "#F3F4F6",
        borderRadius: 20,
        padding: 16,
        alignItems: "center",
    },
    tokenOptionActive: {
        borderColor: "#00B14F",
        backgroundColor: "#F0FDF4",
    },
    tokenIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    tokenIconActive: {
        backgroundColor: "#FFFFFF",
    },
    tokenEyebrow: {
        fontSize: 10,
        fontWeight: "800",
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    tokenName: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7280",
        marginBottom: 2,
        textAlign: "center",
    },
    tokenNameActive: {
        color: "#111827",
    },
    tokenSymbol: {
        fontSize: 10,
        fontWeight: "600",
        color: "#9CA3AF",
    },
    balanceCard: {
        backgroundColor: "#F0FDF4",
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#D1FAE5",
    },
    balanceCardCT: {
        backgroundColor: "#ECFDF5",
        borderColor: "#A7F3D0",
    },
    balanceCardUSDT: {
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
    },
    balanceEyebrow: {
        fontSize: 11,
        color: "#059669",
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
    },
    balanceLabel: {
        fontSize: 13,
        color: "#065F46",
        fontWeight: "500",
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: "700",
        color: "#111827",
        letterSpacing: -1,
    },
    inputWrapper: {
        position: "relative",
    },
    inputIcon: {
        position: "absolute",
        left: 16,
        top: 20,
        zIndex: 1,
    },
    input: {
        backgroundColor: "#FFFFFF",
        fontSize: 16,
        color: "#111827",
    },
    inputOutline: {
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#F3F4F6",
    },
    inputContent: {
        paddingLeft: 40,
        color: "#111827",
    },
    inputHint: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 8,
    },
    errorText: {
        fontSize: 12,
        color: "#EF4444",
        marginTop: 4,
        marginLeft: 4,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB",
    },
    dividerText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#9CA3AF",
        marginHorizontal: 12,
    },
    scanQrBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: "#F0FDF4",
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#00B14F",
        borderStyle: "dashed",
    },
    scanQrText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#00B14F",
    },
    infoCard: {
        backgroundColor: "#EFF6FF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#BFDBFE",
    },
    infoHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    infoText: {
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
