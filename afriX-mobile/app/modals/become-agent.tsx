import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { AgentStatus } from "@/stores/types/agent.types";
import { useTranslation } from "react-i18next";

export default function BecomeAgentModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { agentStatus, checkKycStatus, fetchAgentStats } = useAgentStore();

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    warning: "#F59E0B",
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    purple: "#8B5CF6",
    purpleSoft: isDark ? "rgba(139,92,246,0.12)" : "#F5F3FF",
  };

  const benefits = [
    { icon: "cash", color: theme.accent, bg: theme.accentSoft, title: t("agent.become_agent.benefit_title_1", "Earn Transaction Fees"), desc: t("agent.become_agent.benefit_desc_1", "Keep 0.5% of every transaction you facilitate") },
    { icon: "trending-up", color: theme.blue, bg: theme.blueSoft, title: t("agent.become_agent.benefit_title_2", "Volume Bonuses"), desc: t("agent.become_agent.benefit_desc_2", "Earn up to 0.3% extra for high transaction volumes") },
    { icon: "people", color: theme.purple, bg: theme.purpleSoft, title: t("agent.become_agent.benefit_title_3", "Build Your Network"), desc: t("agent.become_agent.benefit_desc_3", "Connect with users and grow your customer base") },
    { icon: "shield-checkmark", color: theme.warning, bg: theme.warningSoft, title: t("agent.become_agent.benefit_title_4", "Secure Platform"), desc: t("agent.become_agent.benefit_desc_4", "Protected by smart contracts and escrow system") },
  ];

  const requirements = [
    { text: t("agent.become_agent.req_item_1", "Minimum $100 USDT security deposit"), icon: "wallet-outline" },
    { text: t("agent.become_agent.req_item_2", "Valid government-issued ID"), icon: "id-card-outline" },
    { text: t("agent.become_agent.req_item_3", "Proof of address (utility bill or bank statement)"), icon: "home-outline" },
    { text: t("agent.become_agent.req_item_4", "Bank account or mobile money account"), icon: "card-outline" },
    { text: t("agent.become_agent.req_item_5", "Complete KYC verification"), icon: "shield-checkmark-outline" },
  ];

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await checkKycStatus();
        await fetchAgentStats();
        if (agentStatus === AgentStatus.PENDING || agentStatus === AgentStatus.UNDER_REVIEW) {
          router.replace("/modals/agent-kyc/status");
        } else if (agentStatus === AgentStatus.APPROVED) {
          router.replace("/modals/agent-deposit");
        }
      } catch (error) {
        console.log("Status check failed:", error);
      }
    };
    checkStatus();
  }, [agentStatus]);

  // Mappings moved inside component body

  const renderFooter = () => {
    if (agentStatus === AgentStatus.PENDING || agentStatus === AgentStatus.UNDER_REVIEW) {
      return (
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={[styles.statusPill, { backgroundColor: theme.warningSoft }]}>
            <Ionicons name="time" size={16} color={theme.warning} />
            <Text style={[styles.statusPillText, { color: theme.warning }]}>{t("agent.become_agent.status_under_review", "Application Under Review")}</Text>
          </View>
          <TouchableOpacity style={[styles.primaryCTA, { backgroundColor: theme.warning }]} onPress={() => router.push("/modals/agent-kyc/status")}>
            <Text style={styles.primaryCTAText}>{t("agent.become_agent.btn_check_status", "Check Status")}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      );
    }
    if (agentStatus === AgentStatus.APPROVED) {
      return (
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <View style={[styles.statusPill, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
            <Text style={[styles.statusPillText, { color: theme.accent }]}>{t("agent.become_agent.status_approved", "Application Approved!")}</Text>
          </View>
          <TouchableOpacity style={[styles.primaryCTA, { backgroundColor: theme.accent }]} onPress={() => router.push("/modals/agent-deposit")}>
            <Text style={styles.primaryCTAText}>{t("agent.become_agent.btn_complete_setup", "Complete Setup")}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.secondaryCTA, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
            onPress={() => router.push("/modals/agent-learn-more")}
          >
            <Text style={[styles.secondaryCTAText, { color: theme.text }]}>{t("agent.become_agent.btn_learn_more", "Learn More")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryCTA, { backgroundColor: theme.accent, flex: 1 }]}
            onPress={() => router.push("/modals/agent-registration")}
          >
            <Text style={styles.primaryCTAText}>{t("agent.become_agent.btn_start_app", "Start Application")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t("agent.become_agent.header_title", "Become an Agent")}</Text>
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
          <View style={styles.heroBannerContent}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="briefcase" size={32} color="#00B14F" />
            </View>
            <Text style={styles.heroEyebrow}>{t("agent.become_agent.hero_eyebrow", "EARN WITH AFRIX")}</Text>
            <Text style={styles.heroTitle}>{t("agent.become_agent.hero_title", "Join the AfriX\nAgent Network")}</Text>
            <Text style={styles.heroSubtitle}>
              {t("agent.become_agent.hero_subtitle", "Facilitate token exchanges and earn fees while helping users access digital currency.")}
            </Text>
          </View>
        </LinearGradient>

        {/* Benefits */}
        <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("agent.become_agent.section_why", "WHY BECOME AN AGENT?")}</Text>
        <View style={styles.benefitsGrid}>
          {benefits.map((b, i) => (
            <View key={i} style={[styles.benefitCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.benefitIconBox, { backgroundColor: b.bg }]}>
                <Ionicons name={b.icon as any} size={22} color={b.color} />
              </View>
              <Text style={[styles.benefitTitle, { color: theme.text }]}>{b.title}</Text>
              <Text style={[styles.benefitDesc, { color: theme.muted }]}>{b.desc}</Text>
            </View>
          ))}
        </View>

        {/* Earnings Highlight */}
        <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("agent.become_agent.section_earnings", "POTENTIAL EARNINGS")}</Text>
        <LinearGradient
          colors={isDark ? ["#0E1726", "#111E2E"] : ["#F7FFF9", "#FFFFFF"]}
          style={[styles.earningsCard, { borderColor: theme.border }]}
        >
          {[
            { label: t("agent.become_agent.earning_label_1", "Conservative"), sub: t("agent.become_agent.earning_sub_1", "50 transactions/month"), amount: "₦1,250/mo" },
            { label: t("agent.become_agent.earning_label_2", "Moderate"), sub: t("agent.become_agent.earning_sub_2", "200 transactions/month"), amount: "₦9,600/mo" },
            { label: t("agent.become_agent.earning_label_3", "Active"), sub: t("agent.become_agent.earning_sub_3", "1000 transactions/month"), amount: "₦80,000/mo" },
          ].map((row, i) => (
            <View key={i} style={[styles.earningRow, i < 2 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <View>
                <Text style={[styles.earningLabel, { color: theme.text }]}>{row.label}</Text>
                <Text style={[styles.earningSubLabel, { color: theme.muted }]}>{row.sub}</Text>
              </View>
              <Text style={[styles.earningAmount, { color: theme.accent }]}>{row.amount}</Text>
            </View>
          ))}
        </LinearGradient>

        {/* Requirements */}
        <Text style={[styles.sectionHeading, { color: theme.muted }]}>{t("agent.become_agent.section_requirements", "REQUIREMENTS")}</Text>
        <View style={[styles.requirementsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {requirements.map((req, i) => (
            <View key={i}>
              <View style={styles.requirementRow}>
                <View style={[styles.reqIconBox, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name={req.icon as any} size={16} color={theme.accent} />
                </View>
                <Text style={[styles.requirementText, { color: theme.text }]}>{req.text}</Text>
              </View>
              {i < requirements.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            </View>
          ))}
        </View>

        {/* Info banner */}
        <View style={[styles.infoBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent + "30" }]}>
          <Ionicons name="information-circle" size={20} color={theme.accent} />
          <Text style={[styles.infoBannerText, { color: theme.accent }]}>
            {t("agent.become_agent.info_banner", "Application review typically takes 1–3 business days")}
          </Text>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {renderFooter()}
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
  content: { paddingHorizontal: 16, paddingTop: 16 },
  heroBanner: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
  },
  heroBannerContent: {
    padding: 24,
  },
  heroIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 34,
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
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  benefitCard: {
    width: "47%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  benefitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  benefitDesc: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  earningsCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  earningRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  earningLabel: { fontSize: 15, fontWeight: "700" },
  earningSubLabel: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  earningAmount: { fontSize: 16, fontWeight: "900" },
  requirementsCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
  },
  reqIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  requirementText: { flex: 1, fontSize: 14, fontWeight: "600" },
  divider: { height: 1 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  infoBannerText: { flex: 1, fontSize: 14, fontWeight: "600" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  footerRow: { flexDirection: "row", gap: 10 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 14, fontWeight: "700" },
  primaryCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
  },
  primaryCTAText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  secondaryCTA: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
  },
  secondaryCTAText: { fontSize: 15, fontWeight: "700" },
});
