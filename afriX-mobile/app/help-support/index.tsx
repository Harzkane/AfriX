// app/help-support/index.tsx
import React, { useState, useRef, useMemo } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  useColorScheme,
  Animated,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

const FAQ_IDS = ["what-is-afritoken", "what-are-nt-ct", "how-buy", "escrow"];

const SUPPORT_PHONE_NUMBERS = [
  { id: "ng", value: "+234 810 706 0160", flag: "🇳🇬" },
  { id: "sn", value: "+221 781 332 487", flag: "🇸🇳" },
  { id: "bf", value: "+226 70 21 09 88", flag: "🇧🇫" },
  { id: "ml", value: "+223 78 80 83 63", flag: "🇲🇱" },
];

const QUICK_LINK_DEFS = [
  { id: "faq", icon: "help-circle-outline", color: "#00B14F", bg: "rgba(0,177,79,0.12)", action: "faq-scroll" },
  { id: "email", icon: "mail-outline", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", action: "email" },
  { id: "full-faq", icon: "book-outline", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", action: "full-faq" },
  { id: "activity", icon: "document-text-outline", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", action: "activity" },
];


export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const faqSectionY = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const FAQ_ITEMS = useMemo(() => FAQ_IDS.map((id) => ({
    id,
    question: t(`help.faq.${id}.q`),
    answer: t(`help.faq.${id}.a`),
  })), [t]);

  const QUICK_LINKS = useMemo(() => QUICK_LINK_DEFS.map((def) => ({
    ...def,
    label: t(`help.quick_links.${def.id}`),
  })), [t]);

  const PHONE_LABELS = useMemo(() => ({
    ng: t("help.phones.ng"),
    sn: t("help.phones.sn"),
    bf: t("help.phones.bf"),
    ml: t("help.phones.ml"),
  }), [t]);

  const DO_TIPS = useMemo(() => [
    t("help.safety.do_1"),
    t("help.safety.do_2"),
    t("help.safety.do_3"),
  ], [t]);

  const DONT_TIPS = useMemo(() => [
    t("help.safety.dont_1"),
    t("help.safety.dont_2"),
  ], [t]);

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    divider: isDark ? "#1A2638" : "#F1F5F9",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    inputBg: isDark ? "#111C2B" : "#F8FAFC",
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const openEmail = async () => {
    const supportEmail = "codewithharz@gmail.com";
    const subject = t("help.email_subject", "Help & Support");
    const emailUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;
    const webFallbackUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}&su=${encodeURIComponent(subject)}`;
    try {
      await Linking.openURL(emailUrl);
    } catch {
      try {
        await Linking.openURL(webFallbackUrl);
      } catch {
        Alert.alert(t("help.err_email_title", "Email Unavailable"), t("help.err_email_desc", "We couldn't open your email app on this device."));
      }
    }
  };

  const openPhoneSupport = async (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber.replace(/\s+/g, "")}`;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL(phoneUrl);
    } catch {
      Alert.alert(t("help.err_call_title", "Call Unavailable"), t("help.err_call_desc", "We couldn't open the phone dialer on this device."));
    }
  };

  const scrollToFaq = () => {
    (scrollRef.current as any)?.scrollTo({ y: faqSectionY.current, animated: true });
  };

  const handleQuickLink = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (action) {
      case "faq-scroll": scrollToFaq(); break;
      case "email": openEmail(); break;
      case "full-faq": router.push("/help-support/faq"); break;
      case "activity": router.push("/(tabs)/activity"); break;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Collapsible Header */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > headerMaxHeight) setHeaderMaxHeight(h);
        }}
        style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/profile")}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("help.header_title", "Help & Support")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("help.header_subtitle", "Find answers and get help quickly.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef as any}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* Intro card */}
        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("help.intro_eyebrow", "SUPPORT CENTER")}</Text>
          <Text style={[styles.introTitle, { color: theme.text }]}>{t("help.intro_title", "Find answers and get help quickly")}</Text>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            {t("help.intro_subtitle", "Browse common questions, review safety guidance, and contact support when you need help with transactions, disputes, or account issues.")}
          </Text>
        </View>

        {/* Quick Links */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("help.section_quick_links", "Quick Links")}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {QUICK_LINKS.map((link, i) => (
            <View key={link.id}>
              <TouchableOpacity
                style={styles.quickRow}
                onPress={() => handleQuickLink(link.action)}
                activeOpacity={0.75}
              >
                <View style={[styles.quickIconBox, { backgroundColor: link.bg }]}>
                  <Ionicons name={link.icon as any} size={20} color={link.color} />
                </View>
                <Text style={[styles.quickLabel, { color: theme.text }]}>{link.label}</Text>
                <View style={[styles.chevronBox, { backgroundColor: isDark ? "#111C2B" : "#F1F5F9" }]}>
                  <Ionicons name="chevron-forward" size={15} color={theme.muted} />
                </View>
              </TouchableOpacity>
              {i < QUICK_LINKS.length - 1 && (
                <View style={[styles.cardDivider, { backgroundColor: theme.divider }]} />
              )}
            </View>
          ))}
        </View>

        {/* FAQ Section */}
        <View
          onLayout={(e) => { faqSectionY.current = e.nativeEvent.layout.y - 20; }}
        >
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("help.section_faq", "Frequently Asked Questions")}</Text>
          {FAQ_ITEMS.map((item) => {
            const isOpen = expandedId === item.id;
            return (
              <View key={item.id} style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.faqRow}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setExpandedId(isOpen ? null : item.id);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.faqToggleBox, { backgroundColor: isOpen ? theme.accentSoft : (isDark ? "#111C2B" : "#F1F5F9") }]}>
                    <Ionicons name={isOpen ? "remove" : "add"} size={16} color={isOpen ? theme.accent : theme.muted} />
                  </View>
                  <Text style={[styles.faqQuestion, { color: theme.text }]}>{item.question}</Text>
                  <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.muted} />
                </TouchableOpacity>
                {isOpen && (
                  <View style={[styles.faqAnswer, { borderTopColor: theme.divider }]}>
                    <Text style={[styles.faqAnswerText, { color: theme.muted }]}>{item.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Contact Support */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("help.section_contact", "Contact Support")}</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.bodyText, { color: theme.muted }]}>
            {t("help.contact_body", "For account issues, disputes, or questions about tokens and agents, our team is here to help.")}
          </Text>

          <View style={[styles.infoBlock, { backgroundColor: isDark ? "#111C2B" : "#F8FAFC", borderColor: theme.border }]}>
            {[
              { icon: "mail-outline", text: "codewithharz@gmail.com" },
              { icon: "time-outline", text: t("help.response_time", "General: within 24 hrs · Urgent: 1–4 hrs") },
              { icon: "information-circle-outline", text: t("help.contact_tip", "Have your transaction ID, screenshots, and device details ready.") },
            ].map((item, i) => (
              <View key={i} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.divider, marginTop: 10, paddingTop: 10 }]}>
                <View style={[styles.infoIconBox, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={item.icon as any} size={15} color={theme.accent} />
                </View>
                <Text style={[styles.infoText, { color: theme.text }]}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Phone Numbers */}
          <Text style={[styles.subLabel, { color: theme.muted }]}>{t("help.call_support", "Call Support")}</Text>
          {SUPPORT_PHONE_NUMBERS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.phoneRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
              onPress={() => openPhoneSupport(item.value)}
              activeOpacity={0.8}
            >
              <Text style={styles.phoneFlag}>{item.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.phoneLabel, { color: theme.muted }]}>{PHONE_LABELS[item.id as keyof typeof PHONE_LABELS]}</Text>
                <Text style={[styles.phoneValue, { color: theme.text }]}>{item.value}</Text>
              </View>
              <View style={[styles.callChip, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
                <Ionicons name="call-outline" size={13} color={theme.accent} />
                <Text style={[styles.callChipText, { color: theme.accent }]}>{t("help.call", "Call")}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.emailBtn, { backgroundColor: theme.accent }]}
            onPress={openEmail}
            activeOpacity={0.85}
          >
            <Ionicons name="mail" size={18} color="#FFFFFF" />
            <Text style={styles.emailBtnText}>{t("help.btn_send_email", "Send Email to Support")}</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Tips */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>{t("help.section_safety", "Safety Tips")}</Text>
        <View style={[styles.safetyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Do's */}
          <View style={[styles.safetyGroup, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Text style={[styles.safetyGroupTitle, { color: isDark ? "#6EE7B7" : "#065F46" }]}>✅ {t("help.safety_dos", "Do")}</Text>
            {DO_TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.tipText, { color: isDark ? "#A7F3D0" : "#064E3B" }]}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Don'ts */}
          <View style={[styles.safetyGroup, { backgroundColor: theme.redSoft, borderColor: isDark ? "rgba(239,68,68,0.25)" : "#FEE2E2", marginTop: 12 }]}>
            <Text style={[styles.safetyGroupTitle, { color: isDark ? "#FCA5A5" : "#991B1B" }]}>🚫 {t("help.safety_donts", "Don't")}</Text>
            {DONT_TIPS.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={[styles.tipDot, { backgroundColor: theme.red }]} />
                <Text style={[styles.tipText, { color: isDark ? "#FCA5A5" : "#7F1D1D" }]}>{tip}</Text>
              </View>
            ))}
          </View>
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
    zIndex: 10, borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 10, paddingBottom: 16,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },

  introCard: {
    borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1,
  },
  introEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8 },
  introTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, letterSpacing: -0.4 },
  introSubtitle: { fontSize: 14, lineHeight: 21 },

  sectionLabel: {
    fontSize: 11, fontWeight: "800", textTransform: "uppercase",
    letterSpacing: 0.8, marginBottom: 10, marginLeft: 4,
  },
  card: {
    borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 20,
  },
  cardDivider: { height: 1, marginHorizontal: 0 },

  quickRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 12,
  },
  quickIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  quickLabel: { flex: 1, fontSize: 15, fontWeight: "700" },
  chevronBox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },

  faqCard: {
    borderRadius: 20, borderWidth: 1, marginBottom: 10, overflow: "hidden",
  },
  faqRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  faqToggleBox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  faqAnswer: {
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12,
    borderTopWidth: 1,
  },
  faqAnswerText: { fontSize: 13, lineHeight: 20, fontWeight: "500" },

  bodyText: { fontSize: 14, lineHeight: 21, fontWeight: "500", marginBottom: 14 },
  infoBlock: {
    borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIconBox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "500" },

  subLabel: {
    fontSize: 11, fontWeight: "800", textTransform: "uppercase",
    letterSpacing: 0.6, marginBottom: 10,
  },
  phoneRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 10,
  },
  phoneFlag: { fontSize: 22 },
  phoneLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  phoneValue: { fontSize: 15, fontWeight: "800" },
  callChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 999, borderWidth: 1,
  },
  callChipText: { fontSize: 12, fontWeight: "800" },

  emailBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 56, borderRadius: 18, marginTop: 4,
  },
  emailBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },

  safetyCard: {
    borderRadius: 22, borderWidth: 1, padding: 16, marginBottom: 20,
  },
  safetyGroup: {
    borderRadius: 18, borderWidth: 1, padding: 14,
  },
  safetyGroupTitle: { fontSize: 14, fontWeight: "800", marginBottom: 10 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "500" },
});
