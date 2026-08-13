// app/modals/receive-tokens/index.tsx
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
type TokenType = typeof TOKENS[number];

const TOKEN_DETAILS: Record<TokenType, { label: string; subtitle: string }> = {
  NT: { label: "Naira Token", subtitle: "DOMESTIC" },
  CT: { label: "CFA Token", subtitle: "REGIONAL" },
  USDT: { label: "Tether", subtitle: "RESERVE" },
};

export default function ReceiveTokensScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [tokenType, setTokenType] = useState<TokenType>("NT");

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
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
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
        ? t("receive_tokens.index.wallet_address_prefix", "• Wallet Address: {{address}}", { address: walletAddress }) + "\n"
        : "";
      const message = t(
        "receive_tokens.index.share_message",
        "💰 Send me {{tokenType}} on AfriExchange!\n\nUse either credential below to send tokens:\n• Email: {{email}}\n{{walletAddressInfo}}\nOpen AfriExchange ➔ Send Tokens to complete the transfer.",
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
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {t("receive_tokens.index.header_title", "Receive Tokens")}
              </Text>
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

        {/* RECEIVE METHOD Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: theme.card, borderColor: theme.accentBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerEyebrow, { color: theme.accent }]}>
              {t("receive_tokens.index.method_eyebrow", "RECEIVE METHOD")}
            </Text>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>
              {t("receive_tokens.index.method_title", "Share receive details")}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: theme.muted }]}>
              {t("receive_tokens.index.method_desc", "Senders can scan your QR code or enter your registered account email to transfer tokens directly to your wallet.")}
            </Text>
          </View>
          {/* Graphic Badge */}
          <View style={[styles.graphicBox, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="qr-code-outline" size={28} color={theme.accent} />
            <View style={[styles.userBadge, { backgroundColor: theme.accent }]}>
              <Ionicons name="person" size={10} color="#FFF" />
            </View>
          </View>
        </View>

        {/* SELECT TOKEN TYPE Section */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          {t("receive_tokens.index.select_token", "SELECT TOKEN TYPE")}
        </Text>

        <View style={styles.tokenGrid}>
          {TOKENS.map((token) => {
            const isSelected = tokenType === token;
            const details = TOKEN_DETAILS[token];
            return (
              <TouchableOpacity
                key={token}
                style={[
                  styles.tokenCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTokenType(token);
                }}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.tokenCheckBadge, { backgroundColor: theme.accent }]}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
                <Text style={[styles.tokenCardSub, { color: isSelected ? theme.accent : theme.muted }]}>
                  {details.subtitle}
                </Text>
                <Text style={[styles.tokenCardLabel, { color: isSelected ? theme.accent : theme.text }]}>
                  {token}
                </Text>
                <Text style={[styles.tokenCardName, { color: isSelected ? theme.accent + "CC" : theme.muted }]}>
                  {details.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Combined Receive Card (QR + Credentials + Help Info) */}
        <View style={[styles.mainReceiveCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* QR Code Container with Scanner Brackets */}
          <View style={styles.qrSection}>
            <View style={styles.qrFrameWrapper}>
              {/* Corner Bracket Accents */}
              <View style={[styles.corner, styles.cornerTL, { borderColor: theme.accent }]} />
              <View style={[styles.corner, styles.cornerTR, { borderColor: theme.accent }]} />
              <View style={[styles.corner, styles.cornerBL, { borderColor: theme.accent }]} />
              <View style={[styles.corner, styles.cornerBR, { borderColor: theme.accent }]} />

              <View style={styles.qrInnerBox}>
                <QRCode value={qrData} size={180} backgroundColor="#FFFFFF" />
              </View>
            </View>

            {/* Scan Subtext */}
            <View style={styles.scanSubRow}>
              <Ionicons name="scan-outline" size={16} color={theme.accent} />
              <Text style={[styles.scanTitle, { color: theme.text }]}>
                {t("receive_tokens.index.scan_to_send", "Scan to Send {{tokenType}}", { tokenType })}
              </Text>
            </View>
            <Text style={[styles.scanDesc, { color: theme.muted }]}>
              {t("receive_tokens.index.scan_subdesc", "Share this QR code with the sender.")}
            </Text>
          </View>

          {/* Account Email Field */}
          <View style={[styles.credentialField, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="mail" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.muted }]}>
                {t("receive_tokens.index.email_header", "Your Account Email")}
              </Text>
              <Text style={[styles.fieldValue, { color: theme.text }]} numberOfLines={1}>
                {userEmail || "user@afriexchange.com"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCopyEmail} style={styles.copyBtn} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={18} color={theme.accent} />
            </TouchableOpacity>
          </View>

          {/* On-Chain Address Field */}
          {!!walletAddress && (
            <View style={[styles.credentialField, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name="wallet" size={16} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: theme.muted }]}>
                  {t("receive_tokens.index.blockchain_header", "On-Chain Address")}
                </Text>
                <Text style={[styles.fieldValueAddress, { color: theme.text }]} numberOfLines={1}>
                  {walletAddress}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCopyAddress} style={styles.copyBtn} activeOpacity={0.7}>
                <Ionicons name="copy-outline" size={18} color={theme.accent} />
              </TouchableOpacity>
            </View>
          )}

          {/* How to Receive Info Box */}
          <View style={[styles.helpBox, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
            <View style={[styles.helpIconBox, { backgroundColor: theme.blue + "22" }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpTitle, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
                {t("receive_tokens.index.tip_title", "How to Receive")}
              </Text>
              <Text style={[styles.helpDesc, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
                {t("receive_tokens.index.tip_desc", "Show this QR code to the sender. Senders can also complete transfers using your AfriExchange account email.")}
              </Text>
            </View>
          </View>
        </View>

        {/* Primary CTA Button */}
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: theme.accent }]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={20} color="#FFF" />
          <Text style={styles.shareBtnText}>
            {t("receive_tokens.index.btn_share", "Share Details")}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
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

  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  bannerEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  bannerSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  graphicBox: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  userBadge: {
    position: "absolute",
    bottom: -2, right: -2,
    width: 18, height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#07111A",
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
  tokenCheckBadge: {
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

  mainReceiveCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    gap: 14,
  },
  qrSection: {
    alignItems: "center",
    paddingVertical: 8,
  },
  qrFrameWrapper: {
    padding: 18,
    position: "relative",
    marginBottom: 14,
  },
  qrInnerBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  corner: {
    position: "absolute",
    width: 18,
    height: 18,
  },
  cornerTL: { top: 4, left: 4, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 6 },
  cornerTR: { top: 4, right: 4, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 6 },
  cornerBL: { bottom: 4, left: 4, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 4, right: 4, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 6 },

  scanSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  scanTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  scanDesc: {
    fontSize: 12,
    fontWeight: "500",
  },

  credentialField: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  fieldIconBox: {
    width: 34, height: 34,
    borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  fieldValueAddress: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  copyBtn: {
    padding: 6,
  },

  helpBox: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 2,
  },
  helpIconBox: {
    width: 36, height: 36,
    borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  helpTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  helpDesc: { fontSize: 12, lineHeight: 17, fontWeight: "500" },

  shareBtn: {
    flexDirection: "row",
    height: 56,
    borderRadius: 18,
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
