import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useAuthStore, useWalletStore } from "@/stores";
import apiClient from "@/services/apiClient";

export default function ReceiveTokensScreen() {
    const router = useRouter();
    const [tokenType, setTokenType] = useState<"NT" | "CT" | "USDT">("NT");
    const [startTime] = useState(new Date());

    const { user } = useAuthStore();
    const { getWalletByType } = useWalletStore();

    const wallet = getWalletByType(tokenType);
    const walletAddress = wallet?.blockchain_address || "";
    const userEmail = user?.email || "";


    // QR code data - contains user email for P2P transfers
    const qrData = JSON.stringify({
        type: "afritoken_receive",
        email: userEmail,
        token: tokenType,
        version: "1.0",
    });

    const handleCopyAddress = async () => {
        if (walletAddress) {
            await Clipboard.setStringAsync(walletAddress);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Copied!", "Wallet address copied to clipboard");
        }
    };

    const handleCopyEmail = async () => {
        await Clipboard.setStringAsync(userEmail);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Copied!", "Email address copied to clipboard");
    };

    const handleShare = async () => {
        try {
            const message = `Send me ${tokenType} tokens on AfriToken!\n\nMy email: ${userEmail}\n${walletAddress ? `Wallet: ${walletAddress}` : ""
                }`;

            await Share.share({
                message,
                title: "Receive AfriToken",
            });
        } catch (error) {
            console.error("Share error:", error);
        }
    };

    return (
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
                        <Text style={styles.headerTitle}>Receive Tokens</Text>
                        <View style={{ width: 24 }} />
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.subtitle}>
                    Share your QR code or email to receive tokens
                </Text>

                {/* Token Type Selector */}
                <View style={styles.section}>
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
                            <Ionicons
                                name="cash-outline"
                                size={20}
                                color={tokenType === "NT" ? "#00B14F" : "#9CA3AF"}
                            />
                            <Text
                                style={[
                                    styles.tokenText,
                                    tokenType === "NT" && styles.tokenTextActive,
                                ]}
                            >
                                NT
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tokenOption,
                                tokenType === "CT" && styles.tokenOptionActive,
                            ]}
                            onPress={() => setTokenType("CT")}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="leaf-outline"
                                size={20}
                                color={tokenType === "CT" ? "#10B981" : "#9CA3AF"}
                            />
                            <Text
                                style={[
                                    styles.tokenText,
                                    tokenType === "CT" && styles.tokenTextActive,
                                ]}
                            >
                                CT
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tokenOption,
                                tokenType === "USDT" && styles.tokenOptionActive,
                            ]}
                            onPress={() => setTokenType("USDT")}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="logo-usd"
                                size={20}
                                color={tokenType === "USDT" ? "#3B82F6" : "#9CA3AF"}
                            />
                            <Text
                                style={[
                                    styles.tokenText,
                                    tokenType === "USDT" && styles.tokenTextActive,
                                ]}
                            >
                                USDT
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                    <View style={styles.qrWrapper}>
                        <QRCode value={qrData} size={220} backgroundColor="#FFFFFF" />
                    </View>
                    <Text style={styles.qrLabel}>Scan to send {tokenType}</Text>
                </View>

                {/* Email Address */}
                <View style={styles.addressCard}>
                    <View style={styles.addressHeader}>
                        <Ionicons name="mail" size={20} color="#00B14F" />
                        <Text style={styles.addressLabel}>Your Email</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addressRow}
                        onPress={handleCopyEmail}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.addressText} numberOfLines={1}>
                            {userEmail}
                        </Text>
                        <Ionicons name="copy-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* Wallet Address (if available) */}
                {walletAddress && (
                    <View style={styles.addressCard}>
                        <View style={styles.addressHeader}>
                            <Ionicons name="wallet" size={20} color="#00B14F" />
                            <Text style={styles.addressLabel}>Wallet Address</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.addressRow}
                            onPress={handleCopyAddress}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.addressText} numberOfLines={1}>
                                {walletAddress}
                            </Text>
                            <Ionicons name="copy-outline" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <View style={styles.infoText}>
                        <Text style={styles.infoTitle}>How to receive tokens</Text>
                        <Text style={styles.infoDesc}>
                            Share your QR code or email with the sender. They can scan it or
                            enter your email to send you tokens.
                        </Text>
                    </View>
                </View>

            </ScrollView>

            <SafeAreaView edges={["bottom"]} style={styles.footerWrapper}>
                <View style={styles.footer}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.shareBtn}
                            onPress={handleShare}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.shareBtnText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => router.back()}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.doneBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
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
    section: {
        marginBottom: 24,
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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#F9FAFB",
        borderWidth: 2,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingVertical: 12,
    },
    tokenOptionActive: {
        borderColor: "#00B14F",
        backgroundColor: "#F0FDF4",
    },
    tokenText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    tokenTextActive: {
        color: "#00B14F",
    },
    qrContainer: {
        alignItems: "center",
        marginBottom: 32,
    },
    qrWrapper: {
        padding: 24,
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#E5E7EB",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    qrLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    addressCard: {
        backgroundColor: "#F9FAFB",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    addressHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    addressLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#111827",
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        backgroundColor: "#FFFFFF",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    addressText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "500",
        color: "#111827",
        fontFamily: "monospace",
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
        paddingTop: 16,
        paddingBottom: 24,
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
    },
    shareBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
    },
    shareBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    doneBtn: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    doneBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#6B7280",
    },
});
