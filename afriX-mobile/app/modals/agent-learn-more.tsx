import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function AgentLearnMoreModal() {
  const router = useRouter();
  const { t } = useTranslation();
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
    warning: "#F59E0B",
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
    purple: "#8B5CF6",
    purpleSoft: isDark ? "rgba(139,92,246,0.12)" : "#F5F3FF",
  };

  const steps = [
    {
      num: "1",
      title: t("agent.learn_more.step_title_1", "Quick Registration"),
      desc: t("agent.learn_more.step_desc_1", "Choose your country, confirm your currency, and add a Polygon USDT withdrawal address."),
      color: theme.accent,
      bg: theme.accentSoft,
    },
    {
      num: "2",
      title: t("agent.learn_more.step_title_2", "KYC Verification"),
      desc: t("agent.learn_more.step_desc_2", "Upload ID, selfie, and proof of address so the team can verify your identity."),
      color: theme.blue,
      bg: theme.blueSoft,
    },
    {
      num: "3",
      title: t("agent.learn_more.step_title_3", "Admin Approval"),
      desc: t("agent.learn_more.step_desc_3", "Your documents are reviewed. Once approved, you can deposit USDT to activate."),
      color: theme.warning,
      bg: theme.warningSoft,
    },
    {
      num: "4",
      title: t("agent.learn_more.step_title_4", "Deposit USDT & Start Earning"),
      desc: t("agent.learn_more.step_desc_4", "Deposit at least the minimum USDT, get capacity, and start handling buy/sell requests from users."),
      color: theme.purple,
      bg: theme.purpleSoft,
    },
  ];

  const bullets = [
    { icon: "swap-horizontal", text: t("agent.learn_more.do_bullet_1", "Mint tokens when users buy with cash.") },
    { icon: "cash-outline", text: t("agent.learn_more.do_bullet_2", "Burn tokens when users sell for cash.") },
    { icon: "shield-checkmark-outline", text: t("agent.learn_more.do_bullet_3", "Earn fees while the system protects users via escrow.") },
  ];

  const paymentBullets = [
    { icon: "card-outline", text: t("agent.learn_more.payments_bullet_1", "Nigeria (NT): bank transfers.") },
    { icon: "phone-portrait-outline", text: t("agent.learn_more.payments_bullet_2", "XOF countries (CT): bank or mobile money (Orange Money, Wave, Moov, etc.).") },
  ];

  const responsibilityBullets = [
    { icon: "checkmark-circle", text: t("agent.learn_more.resp_bullet_1", "Verify every payment in your own bank/mobile money app before confirming.") },
    { icon: "time-outline", text: t("agent.learn_more.resp_bullet_2", "Respond quickly (target under 15 minutes) to keep high ratings and more business.") },
    { icon: "alert-circle-outline", text: t("agent.learn_more.resp_bullet_3", "Follow dispute rules – if you don't deliver, your deposit can be slashed.") },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t("agent.learn_more.header_title", "About Becoming an Agent")}</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <LinearGradient
          colors={["#00B14F", "#008F40"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroBannerIconRow}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="information-circle" size={28} color="#00B14F" />
            </View>
          </View>
          <Text style={styles.heroEyebrow}>{t("agent.learn_more.hero_eyebrow", "AGENT GUIDE")}</Text>
          <Text style={styles.heroTitle}>{t("agent.learn_more.hero_title", "What is an AfriX Agent?")}</Text>
          <Text style={styles.heroSubtitle}>
            {t("agent.learn_more.hero_subtitle", "Agents are independent partners who help users exchange tokens (NT/CT) for local currency. You run your own small exchange business using the AfriX platform.")}
          </Text>
        </LinearGradient>

        {/* What you do */}
        <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("agent.learn_more.section_what_you_do", "WHAT YOU DO")}</Text>
        <View style={[styles.bulletCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {bullets.map((b, i) => (
            <View key={i}>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletIconBox, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={b.icon as any} size={17} color={theme.accent} />
                </View>
                <Text style={[styles.bulletText, { color: theme.text }]}>{b.text}</Text>
              </View>
              {i < bullets.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </View>
          ))}
        </View>

        {/* How it works */}
        <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("agent.learn_more.section_how_it_works", "HOW THE SYSTEM WORKS")}</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoCardTitle, { color: theme.text }]}>{t("agent.learn_more.works_title_deposit", "Security Deposit & Capacity")}</Text>
          <Text style={[styles.infoCardBody, { color: theme.muted }]}>
            {t("agent.learn_more.works_body_deposit", "You deposit USDT as a security bond. Your minting capacity equals your deposit in USDT. When you mint tokens, capacity goes down; when you burn tokens, capacity goes back up.")}
          </Text>
          <View style={[styles.exampleBox, { backgroundColor: theme.accentSoft, borderColor: theme.accent + "30" }]}>
            <Text style={[styles.exampleText, { color: theme.accent }]}>
              {t("agent.learn_more.works_example_deposit", "Example: Deposit 1,000 USDT → you can mint/burn up to 1,000 USDT worth of tokens across users.")}
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoCardTitle, { color: theme.text }]}>{t("agent.learn_more.works_title_escrow", "Escrow Protection")}</Text>
          <Text style={[styles.infoCardBody, { color: theme.muted }]}>
            {t("agent.learn_more.works_body_escrow", "For sells (burn), user tokens are locked in escrow until you send fiat and the system confirms. If there is a dispute and you don't deliver, your deposit can be slashed and the user refunded.")}
          </Text>
        </View>

        {/* Steps */}
        <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("agent.learn_more.section_steps", "STEPS TO BECOME AN AGENT")}</Text>
        <View style={styles.stepsList}>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepLeftCol}>
                <View style={[styles.stepNumCircle, { backgroundColor: step.bg }]}>
                  <Text style={[styles.stepNumText, { color: step.color }]}>{step.num}</Text>
                </View>
                {i < steps.length - 1 && <View style={[styles.stepConnector, { backgroundColor: theme.border }]} />}
              </View>
              <View style={[styles.stepContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                <Text style={[styles.stepDesc, { color: theme.muted }]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("agent.learn_more.section_payments", "PAYMENT METHODS")}</Text>
        <View style={[styles.bulletCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoCardBody, { color: theme.muted, marginBottom: 12 }]}>
            {t("agent.learn_more.payments_intro", "You receive and send fiat directly to users using local rails:")}
          </Text>
          {paymentBullets.map((b, i) => (
            <View key={i}>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletIconBox, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={b.icon as any} size={17} color={theme.accent} />
                </View>
                <Text style={[styles.bulletText, { color: theme.text }]}>{b.text}</Text>
              </View>
              {i < paymentBullets.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </View>
          ))}
          <Text style={[styles.infoCardBody, { color: theme.muted, marginTop: 12 }]}>
            {t("agent.learn_more.payments_outro", "Users see your bank or mobile money details when they choose you as their agent.")}
          </Text>
        </View>

        {/* Responsibilities */}
        <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("agent.learn_more.section_responsibilities", "YOUR RESPONSIBILITIES")}</Text>
        <View style={[styles.bulletCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {responsibilityBullets.map((b, i) => (
            <View key={i}>
              <View style={styles.bulletRow}>
                <View style={[styles.bulletIconBox, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={b.icon as any} size={17} color={theme.accent} />
                </View>
                <Text style={[styles.bulletText, { color: theme.text }]}>{b.text}</Text>
              </View>
              {i < responsibilityBullets.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </View>
          ))}
          <Text style={[styles.infoCardBody, { color: theme.muted, marginTop: 12 }]}>
            {t("agent.learn_more.resp_outro", "For full details, you'll see the Agent Handbook inside your agent dashboard after approval.")}
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 32 },
  heroBanner: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
  },
  heroBannerIconRow: { marginBottom: 14 },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 20,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  bulletCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  bulletIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  divider: { height: 1 },
  infoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  infoCardTitle: { fontSize: 15, fontWeight: "800" },
  infoCardBody: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  exampleBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  exampleText: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  stepsList: { marginBottom: 20 },
  stepRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 0,
  },
  stepLeftCol: {
    alignItems: "center",
    width: 40,
  },
  stepNumCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontSize: 16, fontWeight: "900" },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 12,
    marginVertical: 4,
  },
  stepContent: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    gap: 4,
  },
  stepTitle: { fontSize: 15, fontWeight: "800" },
  stepDesc: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
});
