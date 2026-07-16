// app/help-support/faq.tsx
import React, { useState, useRef, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

type FaqItem = { id: string; q: string; a: string };

const SECTION_DEFS: { id: string; icon: string; color: string; items: string[] }[] = [
  { id: "getting_started", icon: "rocket-outline", color: "#3B82F6", items: ["what-is", "is-bank", "create-account"] },
  { id: "tokens_explained", icon: "cube-outline", color: "#8B5CF6", items: ["nt-ct", "pay-things"] },
  { id: "acquiring_tokens", icon: "cart-outline", color: "#00B14F", items: ["how-buy", "choose-agent"] },
  { id: "selling_tokens", icon: "cash-outline", color: "#F59E0B", items: ["how-sell", "escrow", "dispute"] },
  { id: "security_safety", icon: "shield-checkmark-outline", color: "#EF4444", items: ["protect", "scams"] },
  { id: "fees", icon: "receipt-outline", color: "#0F766E", items: ["fees"] },
];

export default function FullFaqScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const SECTIONS = useMemo(() => SECTION_DEFS.map((sec) => ({
    ...sec,
    title: t(`help.faq_full.sections.${sec.id}.title`),
    items: sec.items.map((itemId) => ({
      id: itemId,
      q: t(`help.faq_full.sections.${sec.id}.items.${itemId}.q`),
      a: t(`help.faq_full.sections.${sec.id}.items.${itemId}.a`),
    })) as FaqItem[],
  })), [t]);

  const TOTAL_TOPICS = SECTIONS.reduce((acc, s) => acc + s.items.length, 0);

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
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const toggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
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
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("help.faq_full.header_title", "Full FAQ")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("help.faq_full.header_subtitle", "Browse all {{topics}} topics across {{sections}} categories.", { topics: TOTAL_TOPICS, sections: SECTIONS.length })}
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
        {/* Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* Hero card */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
              <Ionicons name="book-outline" size={13} color={theme.accent} />
              <Text style={[styles.heroBadgeText, { color: theme.accent }]}>{t("help.faq_full.knowledge_base", "Knowledge Base")}</Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: isDark ? "#111C2B" : "#F1F5F9", borderColor: theme.border }]}>
              <Text style={[styles.countPillText, { color: theme.muted }]}>{t("help.faq_full.topic_count", "{{count}} topics", { count: TOTAL_TOPICS })}</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: theme.text }]}>{t("help.faq_full.hero_title", "Answers to the most important questions")}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.muted }]}>
            {t("help.faq_full.hero_subtitle", "Explore account setup, token usage, agent transactions, security, fees, and dispute guidance in one place.")}
          </Text>

          <View style={styles.featurePillRow}>
            {[
              { icon: "shield-checkmark-outline", label: t("help.faq_full.pill_safety", "Safety tips included"), color: "#059669" },
              { icon: "flash-outline", label: t("help.faq_full.pill_quick", "Quick scan format"), color: "#3B82F6" },
            ].map((pill) => (
              <View key={pill.label} style={[styles.featurePill, { backgroundColor: isDark ? "#111C2B" : "#FFFFFF", borderColor: theme.border }]}>
                <Ionicons name={pill.icon as any} size={14} color={pill.color} />
                <Text style={[styles.featurePillText, { color: theme.muted }]}>{pill.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Sections */}
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            {/* Section header */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionIconBox, { backgroundColor: section.color + (isDark ? "22" : "18") }]}>
                <Ionicons name={section.icon as any} size={16} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
              <View style={[styles.sectionCountPill, { backgroundColor: isDark ? "#111C2B" : "#F1F5F9" }]}>
                <Text style={[styles.sectionCountText, { color: theme.muted }]}>{section.items.length}</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {section.items.map((item, idx) => {
                const isOpen = expanded[item.id];
                const isLast = idx === section.items.length - 1;

                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={styles.faqRow}
                      onPress={() => toggle(item.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.faqToggleBox, { backgroundColor: isOpen ? section.color + "22" : (isDark ? "#111C2B" : "#F1F5F9") }]}>
                        <Ionicons name={isOpen ? "remove" : "add"} size={14} color={isOpen ? section.color : theme.muted} />
                      </View>
                      <Text style={[styles.faqQuestion, { color: theme.text }]}>{item.q}</Text>
                      <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={theme.muted} />
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={[styles.faqAnswerWrap, { borderTopColor: theme.divider }]}>
                        <Text style={[styles.faqAnswer, { color: theme.muted }]}>{item.a}</Text>
                      </View>
                    )}

                    {!isLast && <View style={[styles.itemDivider, { backgroundColor: theme.divider }]} />}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Still need help card */}
        <View style={[styles.ctaCard, { backgroundColor: isDark ? "#0E1726" : "#0F172A", borderColor: isDark ? "#1E2A3A" : "#1E293B" }]}>
          <Text style={styles.ctaEyebrow}>{t("help.faq_full.cta_eyebrow", "STILL NEED HELP?")}</Text>
          <Text style={styles.ctaTitle}>{t("help.faq_full.cta_title", "Contact the support team directly")}</Text>
          <Text style={styles.ctaSubtitle}>
            {t("help.faq_full.cta_subtitle", "If your answer isn't here, go back to Help & Support and use the Email Support option so we can assist with account or transaction issues.")}
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-back" size={16} color="#0F172A" />
            <Text style={styles.ctaBtnText}>{t("help.faq_full.cta_btn", "Back to Help & Support")}</Text>
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

  heroCard: {
    borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14,
  },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
  },
  heroBadgeText: { fontSize: 12, fontWeight: "800" },
  countPill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
  },
  countPillText: { fontSize: 12, fontWeight: "700" },
  heroTitle: { fontSize: 22, fontWeight: "900", lineHeight: 28, letterSpacing: -0.4, marginBottom: 8 },
  heroSubtitle: { fontSize: 14, lineHeight: 21, fontWeight: "500", marginBottom: 14 },
  featurePillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  featurePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
  },
  featurePillText: { fontSize: 12, fontWeight: "600" },

  section: { marginBottom: 16 },
  sectionHeaderRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10,
  },
  sectionIconBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  sectionCountPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  sectionCountText: { fontSize: 11, fontWeight: "800" },

  sectionCard: {
    borderRadius: 22, borderWidth: 1, overflow: "hidden",
  },
  faqRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  faqToggleBox: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  faqAnswerWrap: {
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 12,
    paddingLeft: 54, borderTopWidth: 1,
  },
  faqAnswer: { fontSize: 13, lineHeight: 20, fontWeight: "500" },
  itemDivider: { height: 1, marginHorizontal: 16 },

  ctaCard: {
    borderRadius: 24, padding: 22, marginBottom: 16, borderWidth: 1,
  },
  ctaEyebrow: {
    fontSize: 10, fontWeight: "800", color: "#86EFAC",
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
  },
  ctaTitle: { fontSize: 20, fontWeight: "900", color: "#FFFFFF", marginBottom: 8, letterSpacing: -0.4 },
  ctaSubtitle: { fontSize: 13, lineHeight: 20, color: "#94A3B8", fontWeight: "500", marginBottom: 18 },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    height: 50, borderRadius: 16, paddingHorizontal: 18,
    backgroundColor: "#86EFAC", alignSelf: "flex-start",
  },
  ctaBtnText: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
});
