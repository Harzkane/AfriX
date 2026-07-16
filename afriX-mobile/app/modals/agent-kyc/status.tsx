import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatDate } from "@/utils/format";

type KycStatus = "not_submitted" | "under_review" | "approved" | "rejected";

export default function KycStatusScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams();
  const fromAgentProfile = params?.from === "agent-profile";
  const { checkKycStatus } = useAgentStore();
  const [status, setStatus] = useState<KycStatus>("not_submitted");
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittedAt, setSubmittedAt] = useState(new Date());

  const theme = {
    bg: isDark ? "#090B14" : "#F5F4FC",
    card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
    cardAlt: isDark ? "rgba(255, 255, 255, 0.05)" : "#F9F8FF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E1638" : "#EDE9FE",
    accent: "#7C3AED",
    accentSoft: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
    warning: "#F59E0B",
    warningSoft: isDark ? "rgba(245, 158, 11, 0.12)" : "#FEF3C7",
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
  };

  const handleGoBackToOrigin = () => {
    if (fromAgentProfile) {
      router.push("/agent/(tabs)/profile");
    } else {
      router.back();
    }
  };

  const handleCloseToHome = () => {
    if (fromAgentProfile) {
      router.push("/agent/(tabs)/profile");
    } else {
      router.push("/(tabs)");
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await checkKycStatus();
        if (data) {
          setStatus(data.status as KycStatus);
          if (data.rejection_reason) setRejectionReason(data.rejection_reason);
          if (data.submitted_at) setSubmittedAt(new Date(data.submitted_at));
        } else {
          setStatus("not_submitted");
        }
      } catch (error) {
        console.error("Failed to fetch KYC status:", error);
        setStatus("not_submitted");
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case "under_review":
        return {
          icon: "hourglass-outline" as const,
          color: theme.warning,
          soft: theme.warningSoft,
          gradientColors: ["#F59E0B", "#D97706"] as [string, string],
          title: t("agent.kyc.status.under_review_title", "Under Review"),
          description: t("agent.kyc.status.under_review_desc", "Our security compliance team is currently verifying your documents. This process normally takes 1–3 business days."),
          showTimeline: true,
        };
      case "approved":
        return {
          icon: "shield-checkmark-outline" as const,
          color: theme.accent,
          soft: theme.accentSoft,
          gradientColors: ["#7C3AED", "#3B82F6"] as [string, string],
          title: t("agent.kyc.status.approved_title", "KYC Approved!"),
          description: t("agent.kyc.status.approved_desc", "Congratulations! Your identity verification is successful. Please complete the setup with your security deposit."),
          showTimeline: false,
        };
      case "rejected":
        return {
          icon: "alert-circle-outline" as const,
          color: theme.danger,
          soft: theme.dangerSoft,
          gradientColors: ["#EF4444", "#DC2626"] as [string, string],
          title: t("agent.kyc.status.rejected_title", "Verification Rejected"),
          description: rejectionReason || t("agent.kyc.status.rejected_default_desc", "Your documents did not meet our compliance requirements. Please check details and resubmit."),
          showTimeline: false,
        };
      default:
        return {
          icon: "document-text-outline" as const,
          color: theme.muted,
          soft: theme.cardAlt,
          gradientColors: ["#64748B", "#475569"] as [string, string],
          title: t("agent.kyc.status.not_submitted_title", "Not Submitted"),
          description: t("agent.kyc.status.not_submitted_desc", "Please start your verification process to gain full access to AfriExchange Agent network features."),
          showTimeline: false,
        };
    }
  };

  const config = getStatusConfig();

  const timelineSteps = [
    { label: t("agent.kyc.status.timeline_received_label", "Application Received"), desc: t("agent.kyc.status.timeline_received_desc", "Your details have been recorded."), done: true, active: false },
    { label: t("agent.kyc.status.timeline_analysis_label", "Document Analysis"), desc: t("agent.kyc.status.timeline_analysis_desc", "Matching and checking with compliance database."), done: false, active: true },
    { label: t("agent.kyc.status.timeline_decision_label", "Approval Decision"), desc: t("agent.kyc.status.timeline_decision_desc", "Confirmation email and push updates."), done: false, active: false },
    { label: t("agent.kyc.status.timeline_deposit_label", "Deposit Collateral"), desc: t("agent.kyc.status.timeline_deposit_desc", "Initialize smart contract float capacity."), done: false, active: false },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.muted }]}>{t("agent.kyc.status.loading_text", "Checking status...")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Flat Header — consistent with other account screens */}
      <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleGoBackToOrigin} style={[styles.headerBackBtn, { backgroundColor: theme.accentSoft }]} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={theme.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t("agent.kyc.status.header_title", "KYC Status")}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Hero Card */}
        <LinearGradient
          colors={isDark ? ["rgba(124, 58, 237, 0.15)", "rgba(9, 11, 20, 0)"] : ["rgba(124, 58, 237, 0.08)", "rgba(255, 255, 255, 0)"]}
          style={styles.heroGlow}
          pointerEvents="none"
        />

        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={config.gradientColors}
              style={styles.avatarGradientRing}
            >
              <View style={[styles.avatarInner, { backgroundColor: theme.card }]}>
                <Ionicons name={config.icon} size={38} color={config.color} />
              </View>
            </LinearGradient>
            <View style={[styles.statusIconBadge, { backgroundColor: config.color }]}>
              <Ionicons name={status === "approved" ? "checkmark" : status === "rejected" ? "close" : "time"} size={12} color="#FFF" />
            </View>
          </View>

          <Text style={[styles.statusTitle, { color: theme.text }]}>{config.title}</Text>
          <Text style={[styles.statusDescription, { color: theme.muted }]}>{config.description}</Text>

          {status !== "not_submitted" && (
            <View style={[styles.datePill, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Ionicons name="calendar-outline" size={13} color={theme.muted} style={{ marginRight: 4 }} />
              <Text style={[styles.datePillText, { color: theme.muted }]}>{t("agent.kyc.status.submitted_date", "Submitted {{date}}", { date: formatDate(submittedAt) })}</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        {config.showTimeline && (
          <View style={[styles.timelineCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardSectionLabel, { color: theme.muted }]}>{t("agent.kyc.status.section_timeline", "VERIFICATION PROGRESS")}</Text>
            {timelineSteps.map((step, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineLeftCol}>
                  <View style={[
                    styles.timelineDot,
                    step.done && { backgroundColor: theme.accent },
                    step.active && { backgroundColor: theme.warning },
                    !step.done && !step.active && { backgroundColor: theme.border }
                  ]}>
                    {step.done && <Ionicons name="checkmark" size={10} color="#FFF" />}
                    {step.active && <View style={styles.timelinePulse} />}
                  </View>
                  {i < timelineSteps.length - 1 && (
                    <View style={[styles.timelineConnector, { backgroundColor: step.done ? theme.accent : theme.border }]} />
                  )}
                </View>
                <View style={styles.timelineTextCol}>
                  <Text style={[styles.timelineStepTitle, { color: theme.text }, step.active && { color: theme.warning }]}>
                    {step.label}
                  </Text>
                  <Text style={[styles.timelineStepDesc, { color: theme.muted }]}>
                    {step.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Rejection Details */}
        {status === "rejected" && rejectionReason ? (
          <View style={[styles.rejectionCard, { backgroundColor: theme.dangerSoft, borderColor: theme.danger + "20" }]}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="warning" size={20} color={theme.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.rejectionLabel, { color: theme.danger }]}>{t("agent.kyc.status.rejection_label", "REJECTION REASON")}</Text>
            </View>
            <Text style={[styles.rejectionText, { color: theme.danger }]}>{rejectionReason}</Text>
          </View>
        ) : null}

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.accent} style={{ marginRight: 8 }} />
          <Text style={[styles.infoBannerText, { color: theme.muted }]}>
            {t("agent.kyc.status.info_banner", "KYC verification is mandatory to unlock trade capabilities, deposit channels, and secure escrow access.")}
          </Text>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Footer CTA Buttons */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {status === "not_submitted" && (
          <TouchableOpacity
            style={[styles.primaryCTA, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
            onPress={() => router.push("/modals/agent-kyc/personal-info")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryCTAText}>{t("agent.kyc.status.btn_start", "Start Verification")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
        {status === "approved" && (
          <TouchableOpacity
            style={[styles.primaryCTA, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
            onPress={() => router.push("/modals/agent-deposit")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryCTAText}>{t("agent.kyc.status.btn_deposit", "Make Security Deposit")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
        {status === "rejected" && (
          <TouchableOpacity
            style={[styles.primaryCTA, { backgroundColor: theme.danger, shadowColor: theme.danger }]}
            onPress={() => router.push("/modals/agent-kyc/personal-info")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryCTAText}>{t("agent.kyc.status.btn_resubmit", "Resubmit Documents")}</Text>
            <Ionicons name="refresh" size={18} color="#FFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.secondaryCTA, { backgroundColor: "transparent", borderColor: theme.border }]}
          onPress={handleCloseToHome}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryCTAText, { color: theme.muted }]}>
            {fromAgentProfile
              ? t("agent.kyc.status.btn_back_profile", "Back to Profile")
              : status === "under_review"
              ? t("agent.kyc.status.btn_back_home", "Back to Home")
              : t("agent.kyc.status.btn_back_dashboard", "Back to Dashboard")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: "600" },
  headerContainer: {
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 36,
  },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  heroGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  avatarGradientRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFF",
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  datePillText: { fontSize: 12, fontWeight: "600" },
  timelineCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  cardSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 14,
  },
  timelineLeftCol: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timelinePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 4,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 22,
  },
  timelineStepTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 2,
  },
  timelineStepDesc: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  rejectionCard: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  rejectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  rejectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  rejectionText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  primaryCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryCTAText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
  secondaryCTA: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  secondaryCTAText: { fontSize: 14, fontWeight: "700" },
});
