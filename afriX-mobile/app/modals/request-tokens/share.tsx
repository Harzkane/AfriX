import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Share,
  Alert,
  Platform,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import { useTranslation } from "react-i18next";
import { useRequestStore, useAuthStore } from "@/stores";
import { WEB_URL } from "@/constants/api";

export default function ShareRequestScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const qrSvgRef = useRef<any>(null);

  const { createdRequest, draftRequest, resetDraft } = useRequestStore();

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.14)" : "#FEF3C7",
    amberBorder: isDark ? "rgba(245,158,11,0.3)" : "#FDE68A",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
  };

  const { user } = useAuthStore();
  const creatorEmail = createdRequest?.creatorEmail || user?.email || "";

  const fullPaymentUrl = `${WEB_URL}/pay/${requestId}?amount=${amount}&token=${tokenType}&note=${encodeURIComponent(note)}${creatorEmail ? `&email=${encodeURIComponent(creatorEmail)}` : ""}`;
  const shareUrl = createdRequest?.shareUrl || fullPaymentUrl;

  const qrPayload = JSON.stringify({
    type: "afrix_payment_request",
    requestId,
    amount: amount.toString(),
    token: tokenType,
    note,
    email: creatorEmail,
    url: fullPaymentUrl,
  });

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareUrl);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      t("request_tokens.share.link_copied_title", "Link Copied!"),
      t("request_tokens.share.link_copied_desc", "Payment link copied to clipboard")
    );
  };

  const handleCopyRequestId = async () => {
    await Clipboard.setStringAsync(requestId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied!", "Request ID copied to clipboard.");
  };

  const handleNativeShare = async (channel?: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const message = `💰 AfriExchange Payment Request (${requestId})\n\nAmount: ${amount.toLocaleString()} ${tokenType}\nNote: ${note}\n\nPay here: ${shareUrl}`;
      await Share.share({
        message,
        title: `Pay ${amount.toLocaleString()} ${tokenType} on AfriExchange`,
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  const handleDownloadQr = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (qrSvgRef.current && typeof qrSvgRef.current.toDataURL === "function") {
        qrSvgRef.current.toDataURL((data: string) => {
          if (!data) {
            handleCopyLink();
            return;
          }

          (async () => {
            try {
              const fileUri = `${FileSystem.cacheDirectory}AfriX-Payment-Request-${requestId}.png`;
              await FileSystem.writeAsStringAsync(fileUri, data, {
                encoding: FileSystem.EncodingType.Base64,
              });

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              const caption = `🛡️ AfriX Payment Request (${requestId})\n💰 Amount: ${amount.toLocaleString()} ${tokenType}\n📝 Note: "${note}"\n🌐 Pay online: ${shareUrl}`;

              await Share.share(
                Platform.OS === "ios"
                  ? { url: fileUri, message: caption }
                  : { message: caption, url: fileUri },
                { dialogTitle: `AfriX Payment Request ${requestId}` }
              );
            } catch (fileErr) {
              console.warn("QR file write/share notice:", fileErr);
              handleCopyLink();
            }
          })();
        });
      } else {
        handleCopyLink();
      }
    } catch (err) {
      console.warn("handleDownloadQr error:", err);
      handleCopyLink();
    }
  };

  const handleDone = () => {
    resetDraft();
    router.replace("/(tabs)");
  };

  const getFiatEquivalent = () => {
    if (tokenType === "NT") return `= ${amount.toLocaleString()} NGN`;
    if (tokenType === "CT") return `= ≈ ${amount.toLocaleString()} XOF`;
    return `= $${amount.toLocaleString()} USD`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleDone}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("request_tokens.share.header_title", "Share Request")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.accent }]}>
            ✓ {t("request_tokens.share.header_subtitle", "Your request is ready! Share the link or QR code so others can view and pay.")}
          </Text>
        </View>

        {/* Flying Paper Plane Graphic */}
        <View style={styles.headerGraphicBox}>
          <LinearGradient colors={["#00B14F", "#059669"]} style={styles.headerGraphicBg}>
            <Ionicons name="paper-plane" size={22} color="#FFF" />
          </LinearGradient>
        </View>
      </View>

      {/* Stepper Navigation Bar */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepItemCompleted}>
          <View style={[styles.stepBadgeCompleted, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={12} color="#FFF" />
          </View>
          <Text style={[styles.stepTextCompleted, { color: theme.muted }]}>
            {t("request_tokens.create.stepper_create", "Create")}
          </Text>
        </View>
        <View style={[styles.stepLineActive, { backgroundColor: theme.accent }]} />
        <View style={styles.stepItemCompleted}>
          <View style={[styles.stepBadgeCompleted, { backgroundColor: theme.accent }]}>
            <Ionicons name="checkmark" size={12} color="#FFF" />
          </View>
          <Text style={[styles.stepTextCompleted, { color: theme.muted }]}>
            {t("request_tokens.create.stepper_review", "Review")}
          </Text>
        </View>
        <View style={[styles.stepLineActive, { backgroundColor: theme.accent }]} />
        <View style={styles.stepItemActive}>
          <View style={[styles.stepBadgeActive, { backgroundColor: theme.accent }]}>
            <Text style={styles.stepBadgeTextActive}>3</Text>
          </View>
          <Text style={[styles.stepTextActive, { color: theme.text }]}>
            {t("request_tokens.create.stepper_share", "Share")}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success Header Card */}
        <View style={[styles.successBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.successLeft}>
            <View style={[styles.successIconBox, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.successTitle, { color: theme.accent }]}>
                {t("request_tokens.share.success_title", "Request Created Successfully!")}
              </Text>
              <Text style={[styles.successSub, { color: theme.muted }]}>
                {t("request_tokens.share.success_subtitle", "Your request is active and ready to be paid.")}
              </Text>
            </View>
          </View>

          <View style={[styles.requestIdBox, { borderLeftColor: theme.border }]}>
            <Text style={[styles.requestIdLabel, { color: theme.muted }]}>
              {t("request_tokens.share.request_id", "Request ID")}
            </Text>
            <TouchableOpacity style={styles.requestIdRow} onPress={handleCopyRequestId} activeOpacity={0.7}>
              <Text style={[styles.requestIdText, { color: theme.text }]}>{requestId}</Text>
              <Ionicons name="copy-outline" size={14} color={theme.accent} />
            </TouchableOpacity>
            <Text style={[styles.createdDateText, { color: theme.muted }]}>
              Created on Aug 14, 2026 • 10:20 AM
            </Text>
          </View>
        </View>

        {/* Active Request Details Card */}
        <View style={[styles.requestCard, { backgroundColor: theme.card, borderColor: theme.accentBorder }]}>
          <View style={styles.requestCardHeader}>
            <View style={[styles.tokenIconCircle, { backgroundColor: "#0F172A" }]}>
              <Text style={{ color: "#FFF", fontSize: 10, fontWeight: "900" }}>{tokenType}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tokenNameText, { color: theme.text }]}>
                {tokenType === "NT" ? "Naira Token" : tokenType === "CT" ? "CFA Token" : "Tether"}
              </Text>
              <Text style={[styles.tokenSymbolText, { color: theme.muted }]}>{tokenType}</Text>
            </View>

            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <View style={[styles.statusBadge, { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder }]}>
                <Text style={[styles.statusBadgeText, { color: theme.amber }]}>PENDING</Text>
              </View>
              <Text style={[styles.amountText, { color: theme.text }]}>
                {amount.toLocaleString()} {tokenType}
              </Text>
              <Text style={[styles.fiatAmountText, { color: theme.muted }]}>{getFiatEquivalent()}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Metadata Table */}
          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <Ionicons name="globe-outline" size={14} color={theme.accent} />
              <Text style={[styles.metaLabel, { color: theme.muted }]}>Request from</Text>
            </View>
            <Text style={[styles.metaValue, { color: theme.text }]}>Anyone (Public request)</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.muted} />
              <Text style={[styles.metaLabel, { color: theme.muted }]}>Note</Text>
            </View>
            <Text style={[styles.metaValue, { color: theme.text }]}>{note}</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.muted} />
              <Text style={[styles.metaLabel, { color: theme.muted }]}>Expires in</Text>
            </View>
            <Text style={[styles.metaValue, { color: theme.text }]}>7 days (Aug 21, 2026 • 10:20 AM)</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaLabelRow}>
              <Ionicons name="eye-outline" size={14} color={theme.muted} />
              <Text style={[styles.metaLabel, { color: theme.muted }]}>Visibility</Text>
            </View>
            <Text style={[styles.metaValue, { color: theme.text }]}>Public</Text>
          </View>
        </View>

        {/* SHARE PAYMENT LINK Section */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>
            {t("request_tokens.share.share_link_title", "SHARE PAYMENT LINK")}
          </Text>

          <View style={[styles.urlBox, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
            <Ionicons name="link" size={16} color={theme.accent} />
            <Text style={[styles.urlText, { color: theme.text }]} numberOfLines={1}>
              {shareUrl}
            </Text>
            <TouchableOpacity style={[styles.copyBtn, { backgroundColor: theme.card }]} onPress={handleCopyLink} activeOpacity={0.8}>
              <Text style={[styles.copyBtnText, { color: theme.accent }]}>Copy</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionEyebrow, { color: theme.muted, marginTop: 12 }]}>
            {t("request_tokens.share.share_via_title", "SHARE VIA")}
          </Text>

          <View style={styles.shareAppsRow}>
            <TouchableOpacity style={styles.appCol} onPress={() => handleNativeShare("WhatsApp")} activeOpacity={0.8}>
              <View style={[styles.appCircle, { backgroundColor: "#25D366" }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
              </View>
              <Text style={[styles.appName, { color: theme.muted }]}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appCol} onPress={() => handleNativeShare("Telegram")} activeOpacity={0.8}>
              <View style={[styles.appCircle, { backgroundColor: "#0088CC" }]}>
                <Ionicons name="paper-plane" size={20} color="#FFF" />
              </View>
              <Text style={[styles.appName, { color: theme.muted }]}>Telegram</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appCol} onPress={() => handleNativeShare("Email")} activeOpacity={0.8}>
              <View style={[styles.appCircle, { backgroundColor: "#3B82F6" }]}>
                <Ionicons name="mail" size={20} color="#FFF" />
              </View>
              <Text style={[styles.appName, { color: theme.muted }]}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appCol} onPress={() => handleNativeShare("Messages")} activeOpacity={0.8}>
              <View style={[styles.appCircle, { backgroundColor: "#10B981" }]}>
                <Ionicons name="chatbubble" size={20} color="#FFF" />
              </View>
              <Text style={[styles.appName, { color: theme.muted }]}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.appCol} onPress={() => handleNativeShare()} activeOpacity={0.8}>
              <View style={[styles.appCircle, { backgroundColor: theme.cardAlt, borderWidth: 1, borderColor: theme.border }]}>
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
              </View>
              <Text style={[styles.appName, { color: theme.muted }]}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QR CODE Section */}
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>
            {t("request_tokens.share.qr_code_title", "QR CODE")}
          </Text>

          <View style={styles.qrRow}>
            <View style={styles.qrBox}>
              <QRCode getRef={(c) => (qrSvgRef.current = c)} value={qrPayload} size={110} backgroundColor="#FFFFFF" />
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.qrTitle, { color: theme.text }]}>
                {t("request_tokens.share.qr_scan_desc", "Scan to pay this request")}
              </Text>
              <Text style={[styles.qrSub, { color: theme.muted }]}>
                {t("request_tokens.share.qr_scan_sub", "Recipients can scan this QR code to view and pay instantly.")}
              </Text>

              <TouchableOpacity
                style={[styles.downloadQrBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                onPress={handleDownloadQr}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={16} color={theme.accent} />
                <Text style={[styles.downloadQrBtnText, { color: theme.accent }]}>
                  {t("request_tokens.share.btn_download", "Download")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Notification Banner */}
        <View style={[styles.noticeBox, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.blue} />
          <Text style={[styles.noticeText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
            {t("request_tokens.review.notice_text", "We'll notify you when someone responds or fulfills your request.")}
          </Text>
        </View>

        {/* Bottom Action Buttons */}
        <TouchableOpacity
          style={[styles.shareAgainBtn, { backgroundColor: theme.accent }]}
          onPress={() => handleNativeShare()}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={18} color="#FFF" />
          <Text style={styles.shareAgainText}>
            {t("request_tokens.share.btn_share_again", "Share Again")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.doneBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Text style={[styles.doneText, { color: theme.text }]}>
            {t("request_tokens.share.btn_done", "Done")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
  headerGraphicBox: { width: 44, height: 44 },
  headerGraphicBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 8,
  },
  stepItemCompleted: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBadgeCompleted: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTextCompleted: { fontSize: 13, fontWeight: "600" },
  stepLineActive: { width: 24, height: 2 },

  stepItemActive: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBadgeActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeTextActive: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  stepTextActive: { fontSize: 13, fontWeight: "800" },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  successBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
    gap: 14,
  },
  successLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  successIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: 15, fontWeight: "800" },
  successSub: { fontSize: 11, lineHeight: 15, fontWeight: "500", marginTop: 2 },

  requestIdBox: { paddingLeft: 12, borderLeftWidth: 2, gap: 2 },
  requestIdLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  requestIdRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  requestIdText: { fontSize: 15, fontWeight: "900", letterSpacing: 0.5 },
  createdDateText: { fontSize: 10, fontWeight: "500", marginTop: 2 },

  requestCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  requestCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  tokenIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenNameText: { fontSize: 16, fontWeight: "900" },
  tokenSymbolText: { fontSize: 11, fontWeight: "600" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  amountText: { fontSize: 18, fontWeight: "900" },
  fiatAmountText: { fontSize: 11, fontWeight: "600" },

  divider: { height: 1, width: "100%" },

  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaLabel: { fontSize: 11, fontWeight: "600" },
  metaValue: { fontSize: 12, fontWeight: "700" },

  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 10,
  },
  sectionEyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },

  urlBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  urlText: { flex: 1, fontSize: 12, fontWeight: "700" },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  copyBtnText: { fontSize: 12, fontWeight: "800" },

  shareAppsRow: { flexDirection: "row", justifyContent: "space-around", paddingTop: 4 },
  appCol: { alignItems: "center", gap: 6 },
  appCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: { fontSize: 10, fontWeight: "600" },

  qrRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 4 },
  qrBox: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  qrTitle: { fontSize: 14, fontWeight: "800" },
  qrSub: { fontSize: 11, lineHeight: 15, fontWeight: "500" },
  downloadQrBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  downloadQrBtnText: { fontSize: 12, fontWeight: "800" },

  noticeBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 12, fontWeight: "600" },

  shareAgainBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  shareAgainText: { color: "#FFF", fontSize: 16, fontWeight: "900" },

  doneBtn: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: { fontSize: 15, fontWeight: "800" },
});
