// app/modals/send-tokens/success.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, useColorScheme, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTransferStore } from "@/stores";
import * as Haptics from "expo-haptics";
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
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
  };

  const amountNum = parseFloat(amount) || 0;
  const feeNum = fee || 0;
  const recipientReceived = amountNum;
  const totalDebited = amountNum + feeNum;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = () => {
    reset();
    router.replace("/(tabs)");
  };

  const handleSendAgain = () => {
    reset();
    router.replace("/modals/send-tokens");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient Glow */}
      <LinearGradient
        colors={isDark ? ["rgba(0,177,79,0.14)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.10)", "rgba(245,247,251,0)"]}
        style={styles.glow}
        pointerEvents="none"
      />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.outerRing, { backgroundColor: theme.accentSoft }]}>
            <View style={[styles.innerRing, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Success Message */}
        <Text style={[styles.title, { color: theme.text }]}>{t("send_tokens.success.title", "Transfer Successful!")}</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          {t("send_tokens.success.subtitle", "Your tokens have been transferred successfully.")}
        </Text>

        {/* Transfer Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("send_tokens.success.label_sent_to", "Sent to")}</Text>
            <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
              {recipientEmail}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("send_tokens.success.label_transfer_amount", "Transfer Amount")}</Text>
            <Text style={[styles.detailValueAmount, { color: theme.accent }]}>
              {formatAmount(amountNum, tokenType)} {tokenType}
            </Text>
          </View>

          {feeNum > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("send_tokens.success.label_network_fee", "Network Fee")}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {formatAmount(feeNum, tokenType)} {tokenType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("send_tokens.success.label_recipient_received", "Recipient Received")}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>
                  {formatAmount(recipientReceived, tokenType)} {tokenType}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>{t("send_tokens.success.label_total_debited", "Total Debited")}</Text>
                <Text style={[styles.detailValue, { color: theme.text, fontWeight: "700" }]}>
                  {formatAmount(totalDebited, tokenType)} {tokenType}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Informational Box */}
        <View style={[styles.infoCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <Ionicons name="information-circle" size={18} color={theme.blue} />
          <Text style={[styles.infoText, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
            {t("send_tokens.success.info_desc", "The recipient will receive a notification about this transfer immediately.")}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.accent }]}
            onPress={handleDone}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>{t("send_tokens.success.btn_done", "Done")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendAgainBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={handleSendAgain}
            activeOpacity={0.7}
          >
            <Ionicons name="send-outline" size={18} color={theme.text} />
            <Text style={[styles.sendAgainBtnText, { color: theme.text }]}>{t("send_tokens.success.btn_send_again", "Send Again")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 300,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  outerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  innerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: "center",
    fontWeight: "500",
  },
  detailsCard: {
    width: "100%",
    padding: 18,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "60%",
  },
  detailValueAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  infoCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    marginBottom: 36,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  doneBtn: {
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sendAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  sendAgainBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
