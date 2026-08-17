import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, useColorScheme, Text } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, Camera } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTransferStore } from "@/stores";
import { useTranslation } from "react-i18next";
import { fetchPaymentRequest } from "@/services/paymentRequestService";

export default function ScanQRScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const { setRecipient, setTokenType, setAmount, setNote, setRequestId } = useTransferStore();

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

  // Reset scanned state whenever screen regains focus
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
    }, [])
  );

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const trimmed = data.trim();

      const cleanString = (val?: string | null) => {
        if (!val) return "";
        return val.replace(/[\\"'\}\s]/g, "").trim();
      };

      const extractEmail = (val?: string | null) => {
        if (!val) return "";
        const match = val.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        return match ? match[0].toLowerCase() : "";
      };

      const checkStatusAndNavigate = async (reqId: string, onProceed: () => void) => {
        try {
          const res = await fetchPaymentRequest(reqId);
          if (res.data?.data?.status === "completed") {
            Alert.alert(
              t("send_tokens.scan_qr.request_paid_title", "Request Already Paid"),
              t("send_tokens.scan_qr.request_paid_desc", "This payment request ({{reqId}}) has already been paid and fulfilled by a previous transfer.", { reqId }),
              [{ text: t("send_tokens.scan_qr.btn_back", "Go Back"), onPress: () => router.back() }]
            );
            return;
          }
          if (res.data?.data?.status !== "pending") {
            Alert.alert(
              t("send_tokens.scan_qr.request_unavailable_title", "Request Unavailable"),
              t("send_tokens.scan_qr.request_unavailable_desc", "This payment request is no longer available for payment.", { reqId }),
              [{ text: t("send_tokens.scan_qr.btn_back", "Go Back"), onPress: () => router.back() }]
            );
            return;
          }
        } catch (e) {
          // Offline or request not yet on server — allow the transfer to proceed
        }
        onProceed();
      };

      // Case 1: Standard JSON payload (Receive QR / Payment Request JSON) - CHECK JSON FIRST
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const qrData = JSON.parse(trimmed);
        const rawEmail = qrData.email || qrData.address || qrData.recipient;
        const email = extractEmail(rawEmail) || extractEmail(cleanString(rawEmail));
        const token = qrData.token || qrData.tokenType || "NT";
        const amt = qrData.amount ? qrData.amount.toString() : "";
        const noteText = qrData.note || qrData.description || "";
        const reqId = (qrData.requestId || qrData.reference || "").toString().toUpperCase();
        const paymentUrl = qrData.url || "";

        const proceed = () => {
          if (email) setRecipient(email);
          if (token && ["NT", "CT", "USDT"].includes(token)) setTokenType(token as "NT" | "CT" | "USDT");
          if (amt) setAmount(amt);
          if (noteText) setNote(noteText);
          if (reqId) setRequestId(reqId);
          router.replace("/modals/send-tokens/amount");
        };

        // Payment request JSON: always verify on server when we have a request id
        if (reqId) {
          await checkStatusAndNavigate(reqId, proceed);
          return;
        }

        // Legacy payment JSON with embedded URL
        if (paymentUrl && (paymentUrl.includes("RQST-") || paymentUrl.includes("/pay/"))) {
          const match = paymentUrl.match(/RQST-[A-Z0-9]+/i);
          const urlReqId = match ? match[0].toUpperCase() : "";
          if (urlReqId) {
            await checkStatusAndNavigate(urlReqId, proceed);
            return;
          }
        }

        // Receive QR / plain JSON with email only (no payment request)
        if (email) {
          proceed();
          return;
        }
      }

      // Case 2: Payment Request URL (e.g. https://afri-x.vercel.app/pay/RQST-8F3A7K?amount=10000&token=NT&note=Rent)
      if (trimmed.includes("RQST-") || trimmed.includes("/pay/")) {
        const match = trimmed.match(/RQST-[A-Z0-9]+/i);
        const reqId = match ? match[0].toUpperCase() : trimmed;
        
        let parsedAmount = "";
        let parsedToken = "NT";
        let parsedNote = "";
        let parsedEmail = "";

        if (trimmed.includes("?")) {
          const queryString = trimmed.split("?")[1];
          const urlParams = new URLSearchParams(queryString);
          if (urlParams.get("amount")) parsedAmount = urlParams.get("amount") || "";
          if (urlParams.get("token")) parsedToken = urlParams.get("token") || "NT";
          if (urlParams.get("note")) parsedNote = urlParams.get("note") || "";
          if (urlParams.get("email")) parsedEmail = extractEmail(urlParams.get("email"));
        }

        const proceedWithServerData = async () => {
          // Fetch the full request from server to get the creator's email
          let recipientEmail = parsedEmail;
          let finalAmount = parsedAmount;
          let finalToken = parsedToken;
          let finalNote = parsedNote;

          try {
            const res = await fetchPaymentRequest(reqId);
            const serverData = res.data?.data;
            if (serverData) {
              // Use server-provided recipient email (the creator who requested tokens)
              if (!recipientEmail && serverData.to_user?.email) {
                recipientEmail = serverData.to_user.email;
              }
              // Fill in amount and token from server if not in URL
              if (!finalAmount && serverData.amount) finalAmount = serverData.amount.toString();
              if (serverData.token_type && ["NT", "CT", "USDT"].includes(serverData.token_type)) {
                finalToken = serverData.token_type;
              }
            }
          } catch (e) {
            // Offline: proceed with what we have from the URL
          }

          setRecipient(recipientEmail || "");
          if (finalToken && ["NT", "CT", "USDT"].includes(finalToken)) setTokenType(finalToken as "NT" | "CT" | "USDT");
          if (finalAmount) setAmount(finalAmount);
          if (finalNote) setNote(finalNote);
          if (reqId) setRequestId(reqId);
          router.replace("/modals/send-tokens/amount");
        };

        await checkStatusAndNavigate(reqId, proceedWithServerData);
        return;
      }

      // Case 3: Plain email address or wallet address
      if (trimmed.includes("@") || trimmed.startsWith("0x") || trimmed.length > 5) {
        setRecipient(cleanString(trimmed));
        router.replace("/modals/send-tokens/amount");
        return;
      }

      Alert.alert(
        t("send_tokens.scan_qr.err_invalid_qr_title", "Invalid QR Code"),
        t("send_tokens.scan_qr.err_invalid_qr", "Could not recognize this QR code. Please scan a valid AfriX receive QR code."),
        [{ text: t("common.ok", "OK"), onPress: () => setScanned(false) }]
      );
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
