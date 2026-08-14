// app/modals/send-tokens/success.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, useColorScheme, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransferStore } from "@/stores";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { formatAmount } from "@/utils/format";
import { useTranslation } from "react-i18next";

export default function TransferSuccessScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { recipientEmail, tokenType, amount, fee, reset } = useTransferStore();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
  };

  const amountNum = parseFloat(amount) || 0;
  const feeNum = fee || 0;
  const recipientReceived = amountNum;
  const totalDebited = amountNum + feeNum;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleCopyEmail = async () => {
    if (recipientEmail) {
      await Clipboard.setStringAsync(recipientEmail);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t("send_tokens.success.copied_title", "Copied!"),
        t("send_tokens.success.copied_email_desc", "Recipient email copied to clipboard")
      );
    }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    router.replace("/(tabs)");
  };

  const handleSendAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    router.replace("/modals/send-tokens");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient Glow */}
      <LinearGradient
        colors={isDark ? ["rgba(0,177,79,0.16)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.10)", "rgba(245,247,251,0)"]}
        style={styles.glow}
        pointerEvents="none"
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Animated Circle with Sparkles */}
        <View style={styles.heroContainer}>
          <View style={[styles.outerGlowRing, { backgroundColor: theme.accentSoft }]}>
            <View style={[styles.innerCheckRing, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
          </View>
          {/* Sparkles */}
          <Ionicons name="sparkles" size={18} color={theme.accent} style={styles.sparkleTopLeft} />
          <Ionicons name="sparkles" size={14} color={theme.accent} style={styles.sparkleTopRight} />
          <Ionicons name="sparkles" size={16} color={theme.accent} style={styles.sparkleBottomRight} />
        </View>

        {/* Success Header Message */}
        <Text style={[styles.title, { color: theme.text }]}>
          {t("send_tokens.success.title", "Transfer Successful!")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {t("send_tokens.success.subtitle", "Your tokens have been transferred successfully.")}
        </Text>

        {/* Transaction Receipt Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* SENT TO Row with Copy Icon */}
          <View style={styles.sentToHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="person" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sentToEyebrow, { color: theme.muted }]}>SENT TO</Text>
              <Text style={[styles.sentToEmailText, { color: theme.text }]} numberOfLines={1}>
                {recipientEmail || "user1_ng@gmail.com"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCopyEmail} style={[styles.copyBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={16} color={theme.accent} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Transfer Amount */}
          <View style={styles.detailRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.iconMiniBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="wallet-outline" size={14} color={theme.accent} />
              </View>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>Transfer Amount</Text>
            </View>
            <Text style={[styles.detailValueGreen, { color: theme.accent }]}>
              {formatAmount(amountNum, tokenType)} {tokenType}
            </Text>
          </View>

          {/* Network Fee */}
          <View style={styles.detailRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.iconMiniBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
              </View>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>Network Fee</Text>
            </View>
            <Text style={[styles.detailValueText, { color: theme.text }]}>
              {formatAmount(feeNum, tokenType)} {tokenType}
            </Text>
          </View>

          {/* Recipient Received */}
          <View style={styles.detailRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.iconMiniBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="person-outline" size={14} color={theme.accent} />
              </View>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>Recipient Received</Text>
            </View>
            <Text style={[styles.detailValueText, { color: theme.text }]}>
              {formatAmount(recipientReceived, tokenType)} {tokenType}
            </Text>
          </View>

          {/* Total Debited */}
          <View style={styles.detailRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.iconMiniBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="receipt-outline" size={14} color={theme.accent} />
              </View>
              <Text style={[styles.detailLabelBold, { color: theme.text }]}>Total Debited</Text>
            </View>
            <Text style={[styles.detailValueGreenBold, { color: theme.accent }]}>
              {formatAmount(totalDebited, tokenType)} {tokenType}
            </Text>
          </View>
        </View>

        {/* What Happens Next Banner Card */}
        <View style={[styles.nextCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nextTitle, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
              {t("send_tokens.success.next_title", "What happens next?")}
            </Text>
            <Text style={[styles.nextDesc, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              {t("send_tokens.success.info_desc", "The recipient will receive a notification about this transfer immediately.")}
            </Text>
          </View>
          <Ionicons name="paper-plane-outline" size={32} color={theme.blue + "40"} />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.sendAgainBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={handleSendAgain}
            activeOpacity={0.8}
          >
            <Ionicons name="paper-plane-outline" size={18} color={theme.accent} />
            <Text style={[styles.sendAgainBtnText, { color: theme.text }]}>
              {t("send_tokens.success.btn_send_again", "Send Again")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.accent }]}
            onPress={handleDone}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.doneBtnText}>{t("send_tokens.success.btn_done", "Done")}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 280,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: "center",
  },
  heroContainer: {
    position: "relative",
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  outerGlowRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCheckRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  sparkleTopLeft: { position: "absolute", top: 2, left: -8 },
  sparkleTopRight: { position: "absolute", top: -6, right: 4 },
  sparkleBottomRight: { position: "absolute", bottom: 4, right: -10 },

  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "500",
  },

  detailsCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    gap: 12,
  },
  sentToHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },
  sentToEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 2 },
  sentToEmailText: { fontSize: 15, fontWeight: "800" },
  copyBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  divider: { height: 1, marginVertical: 4 },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconMiniBox: {
    width: 28, height: 28, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailLabelBold: { fontSize: 14, fontWeight: "800" },
  detailValueText: { fontSize: 14, fontWeight: "700" },
  detailValueGreen: { fontSize: 15, fontWeight: "800" },
  detailValueGreenBold: { fontSize: 16, fontWeight: "900" },

  nextCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoIconBox: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  nextTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  nextDesc: { fontSize: 12, lineHeight: 17, fontWeight: "500" },

  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  doneBtn: {
    flex: 1,
    flexDirection: "row",
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  doneBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

  sendAgainBtn: {
    flex: 1,
    flexDirection: "row",
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendAgainBtnText: { fontSize: 15, fontWeight: "800" },
});
