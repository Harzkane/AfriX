// app/modals/send-tokens/scan-qr.tsx
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, useColorScheme, Text } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, Camera } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useTransferStore } from "@/stores";
import { useTranslation } from "react-i18next";

export default function ScanQRScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const { setRecipient, setTokenType } = useTransferStore();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
  };

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
      const qrData = JSON.parse(data);

      if (qrData.type !== "afritoken_receive") {
        Alert.alert(
          t("send_tokens.scan_qr.err_invalid_qr_title", "Invalid QR Code"),
          t("send_tokens.scan_qr.err_invalid_qr", "This QR code is not from AfriToken. Please scan a valid AfriToken receive QR code."),
          [{ text: t("common.ok", "OK"), onPress: () => setScanned(false) }]
        );
        return;
      }

      const { email, token } = qrData;

      if (!email) {
        Alert.alert(
          t("send_tokens.scan_qr.err_invalid_qr_title", "Invalid QR Code"),
          t("send_tokens.scan_qr.err_missing_email", "QR code does not contain recipient email."),
          [{ text: t("common.ok", "OK"), onPress: () => setScanned(false) }]
        );
        return;
      }

      setRecipient(email);
      if (token) {
        setTokenType(token);
      }

      router.replace("/modals/send-tokens/amount");
    } catch (error) {
      console.error("QR scan error:", error);
      Alert.alert(
        t("send_tokens.scan_qr.err_invalid_qr_title", "Invalid QR Code"),
        t("send_tokens.scan_qr.err_parse_failed", "Could not read QR code. Please try again or enter email manually."),
        [
          { text: t("send_tokens.scan_qr.btn_manual", "Manual Entry"), onPress: () => router.back() },
          { text: t("send_tokens.scan_qr.btn_retry", "Retry"), onPress: () => setScanned(false) },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.message, { color: theme.muted }]}>{t("send_tokens.scan_qr.loading_permission", "Requesting camera permission...")}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionDenied}>
          <Ionicons name="camera-outline" size={64} color={theme.muted} />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>{t("send_tokens.scan_qr.denied_title", "Camera Access Denied")}</Text>
          <Text style={[styles.permissionText, { color: theme.muted }]}>
            {t("send_tokens.scan_qr.denied_desc", "Please enable camera access in your device settings to scan QR codes.")}
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.accent }]}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Text style={styles.backBtnText}>{t("send_tokens.scan_qr.btn_back", "Go Back")}</Text>
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
              {t("send_tokens.scan_qr.scan_instruction", "Scan AfriToken Receive QR Code")}
            </Text>
          </View>

          {/* Scanning frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.frameCorner, { borderColor: theme.accent }]} />
            <View style={[styles.frameCorner, styles.frameCornerTopRight, { borderColor: theme.accent }]} />
            <View style={[styles.frameCorner, styles.frameCornerBottomLeft, { borderColor: theme.accent }]} />
            <View style={[styles.frameCorner, styles.frameCornerBottomRight, { borderColor: theme.accent }]} />
          </View>

          {/* Bottom overlay */}
          <View style={styles.overlayBottom}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={24} color="#FFFFFF" />
              <Text style={styles.cancelBtnText}>{t("send_tokens.scan_qr.btn_cancel", "Cancel")}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  overlayTop: {
    flex: 1.2,
    backgroundColor: "rgba(7, 17, 26, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 40,
    letterSpacing: -0.3,
  },
  scanFrame: {
    width: 260,
    height: 260,
    alignSelf: "center",
    position: "relative",
  },
  frameCorner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderWidth: 4,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderRadius: 8,
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
    flex: 1.2,
    backgroundColor: "rgba(7, 17, 26, 0.65)",
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
    fontWeight: "700",
    color: "#FFFFFF",
  },
  message: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  permissionDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.4,
  },
  permissionText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    fontWeight: "500",
  },
  backBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 18,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
