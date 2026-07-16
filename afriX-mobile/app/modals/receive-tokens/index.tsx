import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  useColorScheme,
  Animated,
  Text,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useAuthStore, useWalletStore } from "@/stores";
import { useTranslation } from "react-i18next";

const TOKENS = ["NT", "CT", "USDT"] as const;
const TOKEN_LABELS: Record<string, string> = { NT: "Naira Token", CT: "CFA Token", USDT: "Tether" };
const TOKEN_SUBTITLES: Record<string, string> = { NT: "Domestic", CT: "Regional", USDT: "Reserve" };

export default function ReceiveTokensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [tokenType, setTokenType] = useState<"NT" | "CT" | "USDT">("NT");

  const { user } = useAuthStore();
  const { getWalletByType } = useWalletStore();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

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
    placeholder: isDark ? "#475569" : "#9CA3AF",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
  };

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const wallet = getWalletByType(tokenType);
  const walletAddress = wallet?.blockchain_address || "";
  const userEmail = user?.email || "";

  const qrData = JSON.stringify({
    type: "afritoken_receive",
    email: userEmail,
    token: tokenType,
    version: "1.0",
  });

  const handleCopyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t("receive_tokens.index.copied_title", "Copied!"),
        t("receive_tokens.index.copied_address_desc", "Wallet address copied to clipboard")
      );
    }
  };

  const handleCopyEmail = async () => {
    await Clipboard.setStringAsync(userEmail);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      t("receive_tokens.index.copied_title", "Copied!"),
      t("receive_tokens.index.copied_email_desc", "Email address copied to clipboard")
    );
  };

  const handleShare = async () => {
    try {
      const walletAddressInfo = walletAddress
        ? t("receive_tokens.index.wallet_address_prefix", "Wallet Address: {{address}}", { address: walletAddress })
        : "";
      const message = t(
        "receive_tokens.index.share_message",
        "Send me {{tokenType}} tokens on AfriExchange!\n\nMy email: {{email}}\n{{walletAddressInfo}}",
        { tokenType, email: userEmail, walletAddressInfo }
      );
      await Share.share({
        message,
        title: t("receive_tokens.index.share_title", "Receive AfriExchange Tokens"),
      });
    } catch (e) {
      console.error("Share error:", e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Collapsible Header */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("receive_tokens.index.header_title", "Receive Tokens")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("receive_tokens.index.header_subtitle", "Share your credentials to receive payments.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Ambient Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* INTRO CARD */}
        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("receive_tokens.index.method_eyebrow", "RECEIVE METHOD")}</Text>
          <Text style={[styles.introTitle, { color: theme.text }]}>{t("receive_tokens.index.method_title", "Share receive details")}</Text>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            {t("receive_tokens.index.method_desc", "Senders can scan your QR code or enter your registered account email to transfer tokens directly to your wallet.")}
          </Text>
        </View>

        {/* TOKEN SELECTION */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("receive_tokens.index.select_token", "Select Token Type")}</Text>
        <View style={styles.tokenGrid}>
          {TOKENS.map((token) => {
            const isSelected = tokenType === token;
            return (
              <TouchableOpacity
                key={token}
                style={[
                  styles.tokenCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                ]}
                onPress={() => setTokenType(token)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.tokenCheck, { backgroundColor: theme.accent }]}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
                <Text style={[styles.tokenCardSub, { color: isSelected ? theme.accent : theme.muted }]}>
                  {token === "NT"
                    ? t("receive_tokens.index.token_subtitle_nt", "Domestic")
                    : token === "CT"
                    ? t("receive_tokens.index.token_subtitle_ct", "Regional")
                    : t("receive_tokens.index.token_subtitle_usdt", "Reserve")}
                </Text>
                <Text style={[styles.tokenCardLabel, { color: isSelected ? theme.accent : theme.text }]}>
                  {token}
                </Text>
                <Text style={[styles.tokenCardName, { color: isSelected ? theme.accent + "AA" : theme.muted }]}>
                  {token === "NT"
                    ? t("receive_tokens.index.token_label_nt", "Naira Token")
                    : token === "CT"
                    ? t("receive_tokens.index.token_label_ct", "CFA Token")
                    : t("receive_tokens.index.token_label_usdt", "Tether")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* QR CODE CARD */}
        <View style={[styles.qrCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.qrWrapper}>
            <QRCode value={qrData} size={200} backgroundColor="#FFFFFF" />
          </View>
          <Text style={[styles.qrLabel, { color: theme.text }]}>
            {t("receive_tokens.index.scan_to_send", "Scan to Send {{tokenType}}", { tokenType })}
          </Text>
        </View>

        {/* ACCOUNT EMAIL CARD */}
        <View style={[styles.addressCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.addressHeader}>
            <Ionicons name="mail" size={18} color={theme.accent} />
            <Text style={[styles.addressLabel, { color: theme.text }]}>{t("receive_tokens.index.email_header", "Your Account Email")}</Text>
          </View>
          <TouchableOpacity style={[styles.addressRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={handleCopyEmail} activeOpacity={0.75}>
            <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={1}>
              {userEmail}
            </Text>
            <Ionicons name="copy-outline" size={18} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {/* BLOCKCHAIN WALLET CARD */}
        {!!walletAddress && (
          <View style={[styles.addressCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.addressHeader}>
              <Ionicons name="wallet" size={18} color={theme.accent} />
              <Text style={[styles.addressLabel, { color: theme.text }]}>{t("receive_tokens.index.blockchain_header", "On-Chain Address")}</Text>
            </View>
            <TouchableOpacity style={[styles.addressRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]} onPress={handleCopyAddress} activeOpacity={0.75}>
              <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={1}>
                {walletAddress}
              </Text>
              <Ionicons name="copy-outline" size={18} color={theme.accent} />
            </TouchableOpacity>
          </View>
        )}

        {/* TIP CARD */}
        <View style={[styles.tipCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.tipIconBox, { backgroundColor: theme.blue + "25" }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipTitle, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>{t("receive_tokens.index.tip_title", "How to Receive")}</Text>
            <Text style={[styles.tipDesc, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              {t("receive_tokens.index.tip_desc", "Show this QR code to the sender. Senders can also complete transfers using your AfriExchange account email.")}
            </Text>
          </View>
        </View>

        {/* BUTTON ACTION ROW */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.shareBtn, { backgroundColor: theme.accent }]} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-outline" size={18} color="#FFF" />
            <Text style={styles.shareBtnText}>{t("receive_tokens.index.btn_share", "Share Details")}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
  },
  headerSafeArea: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 42, height: 42,
    borderRadius: 21, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 200,
  },
  introCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  introEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  introSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  tokenGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  tokenCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    position: "relative",
  },
  tokenCheck: {
    position: "absolute",
    top: 8, right: 8,
    width: 18, height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenCardSub: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  tokenCardLabel: { fontSize: 18, fontWeight: "900", letterSpacing: -0.5, marginBottom: 2 },
  tokenCardName: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  qrCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  qrLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  addressCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    flex: 1,
  },
  tipCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  tipIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  tipDesc: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  actionRow: {
    gap: 12,
  },
  shareBtn: {
    flexDirection: "row",
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
