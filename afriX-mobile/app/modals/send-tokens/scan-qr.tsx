// app/modals/send-tokens/scan-qr.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { CameraView, Camera } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useTransferStore } from "@/stores";

export default function ScanQRScreen() {
    const router = useRouter();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const { setRecipient, setTokenType } = useTransferStore();

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        })();
    }, []);

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;

        setScanned(true);

        try {
            // Parse QR code data
            const qrData = JSON.parse(data);

            // Validate QR code format
            if (qrData.type !== "afritoken_receive") {
                Alert.alert(
                    "Invalid QR Code",
                    "This QR code is not from AfriToken. Please scan a valid AfriToken receive QR code.",
                    [{ text: "OK", onPress: () => setScanned(false) }]
                );
                return;
            }

            // Extract data
            const { email, token } = qrData;

            if (!email) {
                Alert.alert(
                    "Invalid QR Code",
                    "QR code does not contain recipient email.",
                    [{ text: "OK", onPress: () => setScanned(false) }]
                );
                return;
            }

            // Set recipient and token type
            setRecipient(email);
            if (token) {
                setTokenType(token);
            }

            // Navigate to amount screen
            router.replace("/modals/send-tokens/amount");
        } catch (error) {
            console.error("QR scan error:", error);
            Alert.alert(
                "Invalid QR Code",
                "Could not read QR code. Please try again or enter email manually.",
                [
                    {
                        text: "Manual Entry",
                        onPress: () => router.back(),
                    },
                    {
                        text: "Retry",
                        onPress: () => setScanned(false),
                    },
                ]
            );
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionDenied}>
                    <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.permissionTitle}>Camera Access Denied</Text>
                    <Text style={styles.permissionText}>
                        Please enable camera access in your device settings to scan QR codes.
                    </Text>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                <View style={styles.overlay}>
                    {/* Top overlay */}
                    <View style={styles.overlayTop}>
                        <Text style={styles.instructionText}>
                            Scan AfriToken Receive QR Code
                        </Text>
                    </View>

                    {/* Scanning frame */}
                    <View style={styles.scanFrame}>
                        <View style={styles.frameCorner} />
                        <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
                        <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
                        <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
                    </View>

                    {/* Bottom overlay */}
                    <View style={styles.overlayBottom}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "transparent",
    },
    overlayTop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    instructionText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
        textAlign: "center",
        paddingHorizontal: 40,
    },
    scanFrame: {
        width: 280,
        height: 280,
        alignSelf: "center",
        position: "relative",
    },
    frameCorner: {
        position: "absolute",
        width: 40,
        height: 40,
        borderColor: "#00B14F",
        borderWidth: 4,
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    frameCornerTopRight: {
        left: undefined,
        right: 0,
        borderLeftWidth: 0,
        borderRightWidth: 4,
    },
    frameCornerBottomLeft: {
        top: undefined,
        bottom: 0,
        borderTopWidth: 0,
        borderBottomWidth: 4,
    },
    frameCornerBottomRight: {
        top: undefined,
        left: undefined,
        right: 0,
        bottom: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderRightWidth: 4,
        borderBottomWidth: 4,
    },
    overlayBottom: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    message: {
        fontSize: 16,
        color: "#FFFFFF",
        textAlign: "center",
        marginTop: 100,
    },
    permissionDenied: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        backgroundColor: "#FFFFFF",
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginTop: 24,
        marginBottom: 12,
        textAlign: "center",
    },
    permissionText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 32,
    },
    backBtn: {
        backgroundColor: "#00B14F",
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
