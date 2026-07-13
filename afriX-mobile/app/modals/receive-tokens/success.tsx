// app/modals/receive-tokens/success.tsx
import React, { useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, useColorScheme, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { formatDate } from "@/utils/format";

export default function ReceiveSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  const { amount, tokenType, fromEmail, senderName, country, city, timestamp } = params;

  const formattedDate = timestamp ? formatDate(timestamp as string, true) : "N/A";
  const location = [city, country].filter(Boolean).join(", ") || "Unknown";

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = () => {
    router.replace("/(tabs)");
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
        <Text style={[styles.title, { color: theme.text }]}>Tokens Received!</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          You have successfully received tokens in your account.
        </Text>

        {/* Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.muted }]}>Received From</Text>
            <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
              {senderName || fromEmail || "AfriExchange User"}
            </Text>
          </View>

          {fromEmail && senderName && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>Sender Email</Text>
              <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>
                {fromEmail}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.muted }]}>Sender Location</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{location}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.muted }]}>Date & Time</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{formattedDate}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.muted }]}>Amount Received</Text>
            <Text style={[styles.detailValueAmount, { color: theme.accent }]}>
              {parseFloat((amount as string) || "0").toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {tokenType}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: theme.accent }]}
            onPress={handleDone}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
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
    marginBottom: 36,
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
  buttonContainer: {
    width: "100%",
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
});
