// app/modals/request-tokens/review.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useRequestStore } from "@/stores";

export default function ReviewRequestScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { draftRequest, createTokenRequest, loading } = useRequestStore();

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
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
  };

  const handleSendRequest = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await createTokenRequest();
      router.push("/modals/request-tokens/share" as any);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to create token request.");
    }
  };

  const getTokenFullName = () => {
    if (draftRequest.tokenType === "NT") return "Naira Token (NT)";
    if (draftRequest.tokenType === "CT") return "CFA Token (CT)";
    return "Tether (USDT)";
  };

  const getFiatEquivalent = () => {
    const numericAmount = parseFloat(draftRequest.amount) || 0;
    if (draftRequest.tokenType === "NT") return `= ${numericAmount.toLocaleString()} NGN`;
    if (draftRequest.tokenType === "CT") return `= ≈ ${numericAmount.toLocaleString()} XOF`;
    return `= $${numericAmount.toLocaleString()} USD`;
  };

  const getExpirationFormatted = () => {
    if (draftRequest.expirationDays === "never") return "Does not expire";
    const d = new Date();
    d.setDate(d.getDate() + parseInt(draftRequest.expirationDays, 10));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " 10:20 AM";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header Row */}
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
            {t("request_tokens.review.header_title", "Review Request")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            {t("request_tokens.review.header_subtitle", "Almost there! Double-check everything before sending your request.")}
          </Text>
        </View>

        {/* Document Checkmark Graphic */}
        <View style={styles.headerGraphicBox}>
          <LinearGradient colors={["#00B14F", "#059669"]} style={styles.headerGraphicBg}>
            <Ionicons name="document-text" size={22} color="#FFF" />
          </LinearGradient>
          <View style={styles.headerBadgeCheck}>
            <Ionicons name="checkmark" size={10} color="#FFF" />
          </View>
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
        <View style={styles.stepItemActive}>
          <View style={[styles.stepBadgeActive, { backgroundColor: theme.accent }]}>
            <Text style={styles.stepBadgeTextActive}>2</Text>
          </View>
          <Text style={[styles.stepTextActive, { color: theme.text }]}>
            {t("request_tokens.create.stepper_review", "Review")}
          </Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepBadgeInactive, { borderColor: theme.border }]}>
            <Text style={[styles.stepBadgeTextInactive, { color: theme.muted }]}>3</Text>
          </View>
          <Text style={[styles.stepTextInactive, { color: theme.muted }]}>
            {t("request_tokens.create.stepper_share", "Share")}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* REQUEST SUMMARY Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>
            {t("request_tokens.review.summary_title", "REQUEST SUMMARY")}
          </Text>

          {/* Request type */}
          <View style={styles.summaryRow}>
            <View style={[styles.rowIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="cash-outline" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.muted }]}>
                {t("request_tokens.review.request_type", "Request type")}
              </Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>
                {draftRequest.mode === "p2p" ? "Personal P2P" : "Merchant Invoice"}
              </Text>
            </View>
            <View style={[styles.rowBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
              <Ionicons name="globe-outline" size={11} color={theme.accent} />
              <Text style={[styles.rowBadgeText, { color: theme.accent }]}>Public request</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Token */}
          <View style={styles.summaryRow}>
            <View style={[styles.rowIconBox, { backgroundColor: "#0F172A" }]}>
              <Text style={{ color: "#FFF", fontSize: 9, fontWeight: "900" }}>{draftRequest.tokenType}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.muted }]}>
                {t("request_tokens.review.token", "Token")}
              </Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>{getTokenFullName()}</Text>
            </View>
            <View style={[styles.tokenTag, { backgroundColor: theme.accentSoft }]}>
              <Text style={[styles.tokenTagText, { color: theme.accent }]}>{draftRequest.tokenType}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Amount */}
          <View style={styles.summaryRow}>
            <View style={[styles.rowIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="swap-horizontal-outline" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.muted }]}>
                {t("request_tokens.review.amount", "Amount")}
              </Text>
              <Text style={[styles.rowValueAmount, { color: theme.text }]}>
                {parseFloat(draftRequest.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {draftRequest.tokenType}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.fiatRateText, { color: theme.accent }]}>{getFiatEquivalent()}</Text>
              <Text style={[styles.rateSubText, { color: theme.muted }]}>
                1 {draftRequest.tokenType} = 1 {draftRequest.tokenType === "NT" ? "NGN" : draftRequest.tokenType === "CT" ? "XOF" : "USD"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Request from */}
          <View style={styles.summaryRow}>
            <View style={[styles.rowIconBox, { backgroundColor: theme.cardAlt }]}>
              <Ionicons name="person-outline" size={16} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.muted }]}>
                {t("request_tokens.review.request_from", "Request from")}
              </Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>
                {draftRequest.recipientScope === "anyone"
                  ? "Anyone"
                  : draftRequest.recipientEmail || "Specific Person"}
              </Text>
              <Text style={[styles.rowSubText, { color: theme.muted }]}>
                Anyone with the link or QR code can view and pay
              </Text>
            </View>
            <View style={[styles.rowBadge, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Ionicons name="globe-outline" size={11} color={theme.text} />
              <Text style={[styles.rowBadgeText, { color: theme.text }]}>Anyone</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Note */}
          <View style={styles.summaryRow}>
            <View style={[styles.rowIconBox, { backgroundColor: theme.cardAlt }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.muted }]}>
                {t("request_tokens.review.note", "Note")}
              </Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>
                {draftRequest.note || "No note added"}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Expires in */}
          <View style={styles.summaryRow}>
            <View style={[styles.rowIconBox, { backgroundColor: theme.cardAlt }]}>
              <Ionicons name="calendar-outline" size={16} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.muted }]}>
                {t("request_tokens.review.expires_in", "Expires in")}
              </Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>
                {draftRequest.expirationDays === "never" ? "Never" : `${draftRequest.expirationDays} days`}
              </Text>
            </View>
            <View style={[styles.rowBadge, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Ionicons name="calendar" size={11} color={theme.text} />
              <Text style={[styles.rowBadgeText, { color: theme.text }]}>{getExpirationFormatted()}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Privacy */}
          <View style={styles.summaryRow}>
            <View style={[styles.rowIconBox, { backgroundColor: theme.cardAlt }]}>
              <Ionicons name="eye-outline" size={16} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.muted }]}>
                {t("request_tokens.review.privacy", "Privacy")}
              </Text>
              <Text style={[styles.rowValue, { color: theme.text }]}>
                {draftRequest.privacy === "public" ? "Public" : "Private"}
              </Text>
              <Text style={[styles.rowSubText, { color: theme.muted }]}>Visible to anyone with the link</Text>
            </View>
            <View style={[styles.rowBadge, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Ionicons name="globe-outline" size={11} color={theme.text} />
              <Text style={[styles.rowBadgeText, { color: theme.text }]}>Public</Text>
            </View>
          </View>
        </View>

        {/* Secure & Private Banner */}
        <View style={[styles.secureBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.secureIconBox, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.secureTitle, { color: theme.accent }]}>
              {t("request_tokens.review.secure_title", "Secure & Private")}
            </Text>
            <Text style={[styles.secureDesc, { color: theme.muted }]}>
              {t("request_tokens.review.secure_desc", "Only you can manage this request. Recipients can view and pay — but won't see your wallet details.")}
            </Text>
          </View>
        </View>

        {/* Notification Notice Banner */}
        <View style={[styles.noticeBox, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.blue} />
          <Text style={[styles.noticeText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
            {t("request_tokens.review.notice_text", "You'll be notified when someone responds or fulfills your request.")}
          </Text>
        </View>

        {/* Primary Action Button: Send Request */}
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: theme.accent }]}
          onPress={handleSendRequest}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color="#FFF" />
              <Text style={styles.sendBtnText}>
                {t("request_tokens.review.btn_send", "Send Request")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Secondary Action Button: Back and Edit */}
        <TouchableOpacity
          style={[styles.backEditBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color={theme.accent} />
          <Text style={[styles.backEditText, { color: theme.accent }]}>
            {t("request_tokens.review.btn_back_edit", "Back and Edit")}
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
  headerSubtitle: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  headerGraphicBox: { width: 44, height: 44, position: "relative" },
  headerGraphicBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeCheck: {
    position: "absolute",
    bottom: -2,
    right: -4,
    backgroundColor: "#00B14F",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#07111A",
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

  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBadgeInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeTextInactive: { fontSize: 11, fontWeight: "700" },
  stepTextInactive: { fontSize: 13, fontWeight: "600" },
  stepLine: { width: 24, height: 1.5 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  summaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginVertical: 14,
    gap: 12,
  },
  summaryEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 11, fontWeight: "600" },
  rowValue: { fontSize: 14, fontWeight: "800", marginTop: 1 },
  rowValueAmount: { fontSize: 16, fontWeight: "900", marginTop: 1 },
  rowSubText: { fontSize: 11, fontWeight: "500", marginTop: 1 },

  fiatRateText: { fontSize: 13, fontWeight: "800" },
  rateSubText: { fontSize: 10, fontWeight: "500", marginTop: 1 },

  rowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowBadgeText: { fontSize: 11, fontWeight: "700" },

  tokenTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tokenTagText: { fontSize: 11, fontWeight: "800" },

  divider: { height: 1, width: "100%" },

  secureBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  secureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  secureTitle: { fontSize: 15, fontWeight: "800" },
  secureDesc: { fontSize: 11, lineHeight: 16, fontWeight: "500" },

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

  sendBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  sendBtnText: { color: "#FFF", fontSize: 16, fontWeight: "900" },

  backEditBtn: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  backEditText: { fontSize: 15, fontWeight: "800" },
});
