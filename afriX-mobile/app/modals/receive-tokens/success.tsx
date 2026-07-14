// app/modals/receive-tokens/success.tsx
import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Text,
  Animated,
  Share,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { formatDate } from "@/utils/format";

export default function ReceiveSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

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
  };

  const { amount, tokenType, fromEmail, senderName, country, city, timestamp } = params;

  const formattedDate = timestamp ? formatDate(timestamp as string, true) : "N/A";
  const location = [city, country].filter(Boolean).join(", ") || "Unknown Location";

  // Animation values
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Play entrance animations
    Animated.sequence([
      // 1. Success check pops up bouncy
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      // 2. Details fade and slide up
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(contentTranslate, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse animation loop for outer ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleDone = () => {
    router.replace("/(tabs)");
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const message = `🎉 Payment Received on AfriExchange!\n\n` +
        `• Amount: ${parseFloat((amount as string) || "0").toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${tokenType}\n` +
        `• From: ${senderName || fromEmail || "AfriExchange User"}\n` +
        `• Date: ${formattedDate}\n` +
        `• Location: ${location}\n\n` +
        `Verified by AfriExchange Network.`;
      
      await Share.share({
        message,
        title: "AfriExchange Receipt",
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return "TX";
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Ambient Glow */}
      <LinearGradient
        colors={isDark ? ["rgba(0,177,79,0.14)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.10)", "rgba(245,247,251,0)"]}
        style={styles.glow}
        pointerEvents="none"
      />

      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon Group */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.pulseHalo,
              {
                backgroundColor: theme.accentSoft,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.outerRing,
              {
                backgroundColor: theme.accentSoft,
                transform: [{ scale: iconScale }],
                opacity: iconOpacity,
              },
            ]}
          >
            <View style={[styles.innerRing, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark" size={44} color="#FFFFFF" />
            </View>
          </Animated.View>
        </View>

        {/* Animated Details Wrapper */}
        <Animated.View
          style={[
            styles.animatedWrapper,
            {
              opacity: contentFade,
              transform: [{ translateY: contentTranslate }],
            },
          ]}
        >
          {/* Hero Amount */}
          <Text style={[styles.amountTitle, { color: theme.muted }]}>Amount Received</Text>
          <Text style={[styles.amountText, { color: theme.accent }]}>
            +{parseFloat((amount as string) || "0").toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            <Text style={[styles.tokenLabel, { color: theme.text }]}>{tokenType}</Text>
          </Text>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Ionicons name="shield-checkmark" size={14} color={theme.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: theme.accent }]}>Completed</Text>
          </View>

          {/* Sender Profile Row */}
          <View style={[styles.senderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <LinearGradient
              colors={isDark ? ["#00B14F", "#006B30"] : ["#00B14F", "#00E065"]}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>
                {getInitials(senderName as string, fromEmail as string)}
              </Text>
            </LinearGradient>
            <View style={styles.senderInfo}>
              <Text style={[styles.senderEyebrow, { color: theme.muted }]}>Received From</Text>
              <Text style={[styles.senderName, { color: theme.text }]} numberOfLines={1}>
                {senderName || "AfriExchange User"}
              </Text>
              {fromEmail && (
                <Text style={[styles.senderEmail, { color: theme.muted }]} numberOfLines={1}>
                  {fromEmail}
                </Text>
              )}
            </View>
          </View>

          {/* Receipt Card */}
          <View style={[styles.receiptCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.receiptHeader}>
              <Ionicons name="receipt-outline" size={18} color={theme.accent} />
              <Text style={[styles.receiptTitle, { color: theme.text }]}>Transaction Details</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Location Row */}
            <View style={styles.receiptRow}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="location-outline" size={15} color={theme.muted} />
                <Text style={[styles.receiptLabel, { color: theme.muted }]}>Location</Text>
              </View>
              <Text style={[styles.receiptValue, { color: theme.text }]}>{location}</Text>
            </View>

            {/* Date Row */}
            <View style={styles.receiptRow}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="calendar-outline" size={15} color={theme.muted} />
                <Text style={[styles.receiptLabel, { color: theme.muted }]}>Date & Time</Text>
              </View>
              <Text style={[styles.receiptValue, { color: theme.text }]}>{formattedDate}</Text>
            </View>

            {/* Method Row */}
            <View style={styles.receiptRow}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="flash-outline" size={15} color={theme.muted} />
                <Text style={[styles.receiptLabel, { color: theme.muted }]}>Method</Text>
              </View>
              <Text style={[styles.receiptValue, { color: theme.text }]}>Instant Transfer</Text>
            </View>

            {/* Status Row */}
            <View style={styles.receiptRow}>
              <View style={styles.rowLabelContainer}>
                <Ionicons name="checkmark-circle-outline" size={15} color={theme.muted} />
                <Text style={[styles.receiptLabel, { color: theme.muted }]}>Status</Text>
              </View>
              <Text style={[styles.receiptValue, { color: theme.accent, fontWeight: "700" }]}>Settled</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: theme.accent }]}
              onPress={handleDone}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareBtn, { borderColor: theme.border }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={theme.text} style={{ marginRight: 6 }} />
              <Text style={[styles.shareBtnText, { color: theme.text }]}>Share Receipt</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 350,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  pulseHalo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  outerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  innerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  animatedWrapper: {
    width: "100%",
    alignItems: "center",
  },
  amountTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 12,
    textAlign: "center",
  },
  tokenLabel: {
    fontSize: 22,
    fontWeight: "800",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    marginBottom: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  senderCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  senderInfo: {
    flex: 1,
  },
  senderEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  senderName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  senderEmail: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 1,
  },
  receiptCard: {
    width: "100%",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  rowLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
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
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  shareBtn: {
    height: 54,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: "800",
  },
});

