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
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
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

  const qrSvgRef = useRef<any>(null);

  const handleSaveQr = () => {
    if (!qrSvgRef.current) {
      Alert.alert("Notice", "QR Code is still rendering, please try again in a moment.");
      return;
    }

    qrSvgRef.current.toDataURL(async (data: string) => {
      try {
        const filename = `${FileSystem.documentDirectory}AfriX-${tokenType}-QR-${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(filename, data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === "granted") {
          await MediaLibrary.saveToLibraryAsync(filename);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            t("receive_tokens.index.qr_saved_title", "QR Code Saved!"),
            t("receive_tokens.index.qr_saved_desc", "QR Code saved to your photo library.")
          );
        } else {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(filename);
          } else {
            Alert.alert("QR Code Saved", `Image saved to: ${filename}`);
          }
        }
      } catch (err: any) {
        console.error("QR save error:", err);
        Alert.alert("Notice", "QR Code ready to share or save.");
      }
    });
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
                  {t("receive_tokens.index.header_subtitle", "Share your details to receive payments.")}
                </Text>
              </Animated.View>
            </View>

            {/* Secure & Private Badge */}
            <View style={[styles.secureBadgePill, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
              <Ionicons name="lock-closed" size={12} color={theme.accent} />
              <Text style={[styles.secureBadgeText, { color: theme.accent }]}>
                {t("receive_tokens.index.secure_private_badge", "Secure & Private")}
              </Text>
            </View>
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

        {/* Top Feature Banner Card */}
        <View style={[styles.bannerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <LinearGradient
            colors={isDark ? ["#0B1929", "#0E1726"] : ["#F0FDF4", "#FFFFFF"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.downloadIconBox, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="download-outline" size={24} color={theme.accent} />
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>
              {t("receive_tokens.index.banner_title", "Get paid instantly")}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: theme.muted }]}>
              {t("receive_tokens.index.banner_subtitle", "Share your QR code or account details to receive tokens in your AfriX wallet.")}
            </Text>
          </View>

          {/* Tokens Stack Graphic Illustration */}
          <View style={styles.graphicBox}>
            <View style={[styles.tokenCircle, styles.tokenNt, { backgroundColor: "#00B14F" }]}>
              <Text style={styles.tokenCircleText}>NT</Text>
            </View>
            <View style={[styles.tokenCircle, styles.tokenCt, { backgroundColor: "#3B82F6" }]}>
              <Text style={styles.tokenCircleText}>CT</Text>
            </View>
            <View style={[styles.tokenCircle, styles.tokenUsdt, { backgroundColor: "#0D9488" }]}>
              <Text style={styles.tokenCircleText}>USDT</Text>
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
                  {t(`receive_tokens.index.token_subtitle_${token.toLowerCase()}`, details.subtitle)}
                </Text>
                <Text style={[styles.tokenCardLabel, { color: isSelected ? theme.accent : theme.text }]}>
                  {token}
                </Text>
                <Text style={[styles.tokenCardName, { color: isSelected ? theme.accent + "CC" : theme.muted }]}>
                  {t(`receive_tokens.index.token_label_${token.toLowerCase()}`, details.label)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Combined Receive Card (QR Code + Details + Actions) */}
        <View style={[styles.mainReceiveCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.mainCardContent}>
            {/* Left Col: QR Code Frame */}
            <View style={styles.qrSection}>
              <View style={styles.qrFrameWrapper}>
                {/* Glowing Corner Brackets */}
                <View style={[styles.corner, styles.cornerTL, { borderColor: theme.accent }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: theme.accent }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: theme.accent }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: theme.accent }]} />

                <View style={styles.qrInnerBox}>
                  <QRCode getRef={(c) => (qrSvgRef.current = c)} value={qrData} size={150} backgroundColor="#FFFFFF" />
                </View>
              </View>
            </View>

            {/* Right Col: QR Header & Credential Input Fields */}
            <View style={styles.credentialsSection}>
              <View style={styles.qrHeaderRow}>
                <Ionicons name="shield-checkmark" size={16} color={theme.accent} />
                <Text style={[styles.qrHeaderTitle, { color: theme.text }]}>
                  {t("receive_tokens.index.your_qr_title", "Your {{tokenType}} QR Code", { tokenType })}
                </Text>
              </View>
              <Text style={[styles.qrHeaderSubtitle, { color: theme.muted }]}>
                {t("receive_tokens.index.your_qr_subtitle", "Scan this code to send {{tokenType}} to your wallet", { tokenType })}
              </Text>

              {/* Wallet Address Field */}
              {!!walletAddress && (
                <View style={[styles.credentialField, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Ionicons name="briefcase-outline" size={16} color={theme.accent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: theme.muted }]}>
                      {t("receive_tokens.index.blockchain_header", "Wallet Address")}
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

              {/* Account Email Field */}
              <View style={[styles.credentialField, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Ionicons name="mail-outline" size={16} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.muted }]}>
                    {t("receive_tokens.index.email_header", "Account Email")}
                  </Text>
                  <Text style={[styles.fieldValue, { color: theme.text }]} numberOfLines={1}>
                    {userEmail || "user@afriexchange.com"}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCopyEmail} style={styles.copyBtn} activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={18} color={theme.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.shareActionBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={theme.text} />
              <Text style={[styles.shareActionBtnText, { color: theme.text }]}>
                {t("receive_tokens.index.btn_share", "Share Details")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveQrActionBtn, { backgroundColor: theme.accent }]}
              onPress={handleSaveQr}
              activeOpacity={0.85}
            >
              <Ionicons name="qr-code-outline" size={18} color="#FFF" />
              <Text style={styles.saveQrActionBtnText}>
                {t("receive_tokens.index.btn_save_qr", "Save QR Code")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How to Receive Notice Banner Card */}
        <View style={[styles.howCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.blue} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.howTitle, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
              {t("receive_tokens.index.how_to_receive_title", "How to Receive")}
            </Text>
            <View style={styles.howBulletRow}>
              <Ionicons name="checkmark-circle" size={14} color={theme.blue} />
              <Text style={[styles.howBulletText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
                {t("receive_tokens.index.how_step_1", "Ask the sender to scan your QR code")}
              </Text>
            </View>
            <View style={styles.howBulletRow}>
              <Ionicons name="checkmark-circle" size={14} color={theme.blue} />
              <Text style={[styles.howBulletText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
                {t("receive_tokens.index.how_step_2", "Or share your wallet address / account email")}
              </Text>
            </View>
            <View style={styles.howBulletRow}>
              <Ionicons name="checkmark-circle" size={14} color={theme.blue} />
              <Text style={[styles.howBulletText, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
                {t("receive_tokens.index.how_step_3", "Tokens will be credited to your wallet instantly")}
              </Text>
            </View>
          </View>
        </View>

        {/* Trust Features Footer Row */}
        <View style={styles.trustFeaturesRow}>
          <View style={styles.trustCol}>
            <Ionicons name="flash-outline" size={18} color="#F59E0B" />
            <Text style={[styles.trustColTitle, { color: theme.text }]}>
              {t("receive_tokens.index.trust_instant_title", "Instant Settlement")}
            </Text>
            <Text style={[styles.trustColSub, { color: theme.muted }]}>
              {t("receive_tokens.index.trust_instant_sub", "Funds arrive in seconds")}
            </Text>
          </View>

          <View style={styles.trustCol}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} />
            <Text style={[styles.trustColTitle, { color: theme.text }]}>
              {t("receive_tokens.index.trust_security_title", "Bank-Grade Security")}
            </Text>
            <Text style={[styles.trustColSub, { color: theme.muted }]}>
              {t("receive_tokens.index.trust_security_sub", "End-to-end protection")}
            </Text>
          </View>

          <View style={styles.trustCol}>
            <Ionicons name="people-outline" size={18} color={theme.blue} />
            <Text style={[styles.trustColTitle, { color: theme.text }]}>
              {t("receive_tokens.index.trust_trusted_title", "Trusted by Thousands")}
            </Text>
            <Text style={[styles.trustColSub, { color: theme.muted }]}>
              {t("receive_tokens.index.trust_trusted_sub", "Across West Africa")}
            </Text>
          </View>
        </View>

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
  secureBadgePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1,
  },
  secureBadgeText: { fontSize: 11, fontWeight: "800" },

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
    overflow: "hidden",
  },
  downloadIconBox: {
    width: 44, height: 44, borderRadius: 16,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  bannerTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  bannerSubtitle: { fontSize: 11, lineHeight: 16, fontWeight: "500" },

  graphicBox: {
    width: 60, height: 50, position: "relative", alignItems: "center", justifyContent: "center",
  },
  tokenCircle: {
    position: "absolute", width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#0E1726",
  },
  tokenNt: { top: 0, left: 0, zIndex: 3 },
  tokenCt: { bottom: 0, left: 14, zIndex: 2 },
  tokenUsdt: { top: 8, right: 0, zIndex: 1 },
  tokenCircleText: { color: "#FFF", fontSize: 9, fontWeight: "900" },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
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
    marginBottom: 16,
    gap: 16,
  },
  mainCardContent: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  qrSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrFrameWrapper: {
    padding: 14,
    position: "relative",
  },
  qrInnerBox: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
  },
  cornerTL: { top: 2, left: 2, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 6 },
  cornerTR: { top: 2, right: 2, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 6 },
  cornerBL: { bottom: 2, left: 2, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 2, right: 2, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 6 },

  credentialsSection: {
    flex: 1,
    gap: 10,
  },
  qrHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qrHeaderTitle: { fontSize: 15, fontWeight: "800" },
  qrHeaderSubtitle: { fontSize: 11, fontWeight: "500", lineHeight: 15 },

  credentialField: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  fieldValueAddress: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  copyBtn: {
    padding: 4,
  },

  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 4,
  },
  shareActionBtn: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  shareActionBtnText: { fontSize: 14, fontWeight: "800" },
  saveQrActionBtn: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveQrActionBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },

  howCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoIconBox: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  howTitle: { fontSize: 13, fontWeight: "800" },
  howBulletRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  howBulletText: { fontSize: 11, fontWeight: "500", flex: 1 },

  trustFeaturesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  trustCol: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
    gap: 2,
  },
  trustColTitle: { fontSize: 11, fontWeight: "800", textAlign: "center", marginTop: 4 },
  trustColSub: { fontSize: 10, fontWeight: "500", textAlign: "center" },
});
