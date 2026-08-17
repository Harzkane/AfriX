// app/modals/request-tokens/detail.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  Share,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useRequestStore, useAuthStore, TokenType } from "@/stores";
import { formatAmount, formatUsdEquivalent } from "@/utils/format";
import { WEB_URL } from "@/constants/api";

export default function RequestDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reference?: string }>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { userRequests, cancelPaymentRequest } = useRequestStore();
  const { user } = useAuthStore();
  const [cancelling, setCancelling] = useState(false);

  const reference = params.reference || "";
  const requestItem = userRequests.find((r) => r.reference === reference || r.id === reference);

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
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.14)" : "#FEE2E2",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
  };

  if (!requestItem) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("request_tokens.detail.title", "Request Details")}
          </Text>
        </View>

        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.muted} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {t("request_tokens.detail.not_found", "Payment request details not found.")}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.btnPrimaryText}>{t("send_tokens.scan_qr.btn_back", "Go Back")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const userEmail = user?.email || "";
  const note = requestItem.description || "Token request";
  const shareUrl = `${WEB_URL}/pay/${requestItem.reference}?amount=${requestItem.amount}&token=${requestItem.token_type}&note=${encodeURIComponent(note)}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ""}`;
  const isPending = requestItem.status.toLowerCase() === "pending";

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed" || s === "paid") {
      return { label: "PAID", bg: theme.accentSoft, color: theme.accent, border: theme.accentBorder };
    }
    if (s === "cancelled") {
      return { label: "CANCELLED", bg: theme.redSoft, color: theme.red, border: theme.redSoft };
    }
    return { label: "PENDING", bg: theme.amberSoft, color: theme.amber, border: theme.amberBorder };
  };

  const badge = getStatusBadge(requestItem.status);

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareUrl);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Link Copied!", "Payment link copied to clipboard.");
  };

  const handleCopyRef = async () => {
    await Clipboard.setStringAsync(requestItem.reference);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied!", "Request ID copied to clipboard.");
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const message = `💰 AfriExchange Payment Request (${requestItem.reference})\n\nAmount: ${formatAmount(requestItem.amount, requestItem.token_type)} ${requestItem.token_type}\n\nPay here: ${shareUrl}`;
      await Share.share({
        message,
        title: `Pay ${formatAmount(requestItem.amount, requestItem.token_type)} ${requestItem.token_type} on AfriExchange`,
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      t("request_tokens.history.cancel_title", "Cancel Request"),
      t("request_tokens.history.cancel_confirm", "Are you sure you want to cancel payment request {{ref}}? This cannot be undone.", { ref: requestItem.reference }),
      [
        { text: t("common.no", "No"), style: "cancel" },
        {
          text: t("common.yes_cancel", "Yes, Cancel"),
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelPaymentRequest(requestItem.reference);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                t("request_tokens.history.cancelled_title", "Cancelled"),
                t("request_tokens.history.cancelled_desc", "Payment request {{ref}} has been cancelled.", { ref: requestItem.reference }),
                [{ text: t("common.ok", "OK"), onPress: () => router.back() }]
              );
            } catch (err: any) {
              Alert.alert(t("common.error", "Error"), err.message || "Failed to cancel request");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("request_tokens.detail.title", "Request Details")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            {requestItem.reference}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          activeOpacity={0.85}
        >
          <Ionicons name="share-social-outline" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Card Header */}
        <View style={[styles.statusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.refRow}>
            <TouchableOpacity onPress={handleCopyRef} style={styles.copyRefBtn} activeOpacity={0.7}>
              <Text style={[styles.refText, { color: theme.text }]}>{requestItem.reference}</Text>
              <Ionicons name="copy-outline" size={14} color={theme.accent} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
              <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>

          {/* Amount Display formatted to 2 decimal places */}
          <View style={styles.amountDisplay}>
            <Text style={[styles.amountValue, { color: theme.text }]}>
              {formatAmount(requestItem.amount, requestItem.token_type)}
            </Text>
            <View style={[styles.tokenTag, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.tokenTagText, { color: theme.accent }]}>{requestItem.token_type}</Text>
            </View>
          </View>

          <Text style={[styles.usdValue, { color: theme.muted }]}>
            {formatUsdEquivalent(requestItem.amount, requestItem.token_type as TokenType)}
          </Text>
        </View>

        {/* QR Code Container */}
        <View style={[styles.qrCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.qrWrapper}>
            <QRCode
              value={shareUrl}
              size={180}
              color={isDark ? "#FFFFFF" : "#07111A"}
              backgroundColor={isDark ? "#0E1726" : "#FFFFFF"}
            />
          </View>
          <Text style={[styles.qrCaption, { color: theme.muted }]}>
            {t("request_tokens.detail.qr_caption", "Scan with AfriExchange camera to pay")}
          </Text>
        </View>

        {/* Transaction Information Breakdown Table */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.detailsSectionTitle, { color: theme.text }]}>
            {t("request_tokens.detail.info_title", "Request Information")}
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Request Mode</Text>
            <View style={[styles.modePill, { backgroundColor: theme.cardAlt }]}>
              <Text style={[styles.modePillText, { color: theme.text }]}>
                {requestItem.mode === "merchant" ? "Merchant Invoice" : "Personal P2P"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Recipient Target</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {requestItem.recipient_email || "Anyone"}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Description / Note</Text>
            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
              {requestItem.description || "Token request"}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Created Date</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {new Date(requestItem.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>

        {/* Primary Actions Sheet */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleCopyLink}
            style={[styles.btnAction, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.85}
          >
            <Ionicons name="copy-outline" size={20} color={theme.text} />
            <Text style={[styles.btnActionText, { color: theme.text }]}>
              {t("request_tokens.share.btn_copy_link", "Copy Payment Link")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.btnAction, { backgroundColor: theme.accent }]}
            activeOpacity={0.85}
          >
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.btnActionText, { color: "#FFFFFF", fontWeight: "800" }]}>
              {t("request_tokens.share.btn_native_share", "Share Request")}
            </Text>
          </TouchableOpacity>

          {isPending && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelling}
              style={[styles.btnAction, { backgroundColor: theme.redSoft, borderColor: theme.redSoft }]}
              activeOpacity={0.85}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={theme.red} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color={theme.red} />
                  <Text style={[styles.btnActionText, { color: theme.red, fontWeight: "700" }]}>
                    {t("request_tokens.history.cancel_title", "Cancel Request")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  btnPrimary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimaryText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
  },
  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
  },
  copyRefBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  refText: {
    fontSize: 15,
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  amountDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "900",
  },
  tokenTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tokenTagText: {
    fontSize: 14,
    fontWeight: "800",
  },
  usdValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  qrCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 14,
  },
  qrWrapper: {
    padding: 12,
    borderRadius: 16,
  },
  qrCaption: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  detailsSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    width: "100%",
  },
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  btnAction: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnActionText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
