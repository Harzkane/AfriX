// app/education/index.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useColorScheme,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore, useEducationStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import type { Quiz, SubmitResult } from "@/stores/types/education.types";
import { useTranslation } from "react-i18next";

const MODULE_DEFS = [
  {
    id: "what_are_tokens",
    icon: "cube-outline",
    color: "#3B82F6",
    gradientColors: ["#3B82F6", "#1D4ED8"],
    xp: 100,
  },
  {
    id: "how_agents_work",
    icon: "people-outline",
    color: "#10B981",
    gradientColors: ["#10B981", "#047857"],
    xp: 150,
  },
  {
    id: "understanding_value",
    icon: "analytics-outline",
    color: "#8B5CF6",
    gradientColors: ["#8B5CF6", "#6D28D9"],
    xp: 200,
  },
  {
    id: "safety_security",
    icon: "shield-checkmark-outline",
    color: "#F59E0B",
    gradientColors: ["#F59E0B", "#B45309"],
    xp: 150,
  },
];

const BADGE_DEFS = [
  { id: 1, icon: "ribbon", color: "#6B7280", gradient: ["#9CA3AF", "#4B5563"], threshold: 0 },
  { id: 2, icon: "school", color: "#3B82F6", gradient: ["#60A5FA", "#2563EB"], threshold: 100 },
  { id: 3, icon: "trophy", color: "#F59E0B", gradient: ["#FBBF24", "#D97706"], threshold: 300 },
  { id: 4, icon: "medal", color: "#8B5CF6", gradient: ["#A78BFA", "#7C3AED"], threshold: 600 },
];

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000];
const MAX_ATTEMPTS = 5;

export default function EducationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const [activeTab, setActiveTab] = useState<"lessons" | "achievements">("lessons");

  const { fetchMe } = useAuthStore();
  const {
    progress,
    loading: progressLoading,
    fetchProgress,
    getQuiz,
    submitQuiz,
  } = useEducationStore();

  // Build translated MODULES array
  const MODULES = useMemo(() => MODULE_DEFS.map((def) => ({
    ...def,
    title: t(`education.modules.${def.id}.title`),
    subtitle: t(`education.modules.${def.id}.subtitle`),
    description: t(`education.modules.${def.id}.description`),
    duration: t(`education.modules.${def.id}.duration`),
    content: t(`education.modules.${def.id}.content`),
  })), [t]);

  // Build translated BADGES array
  const BADGES = useMemo(() => BADGE_DEFS.map((def) => ({
    ...def,
    name: t(`education.badges.${def.id}.name`),
  })), [t]);

  const [selectedModule, setSelectedModule] = useState<typeof MODULES[0] | null>(null);
  const [modalStep, setModalStep] = useState<"content" | "quiz" | "result">("content");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const theme = {
    background: isDark ? "#080E14" : "#F4F7FC",
    card: isDark ? "#101924" : "#FFFFFF",
    cardAlt: isDark ? "#162232" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2E42" : "#E2E8F0",
    divider: isDark ? "#1A2C40" : "#F1F5F9",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.15)" : "#EBFDF3",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.25)" : "#FDE68A",
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    purple: "#8B5CF6",
    purpleSoft: isDark ? "rgba(139,92,246,0.12)" : "#F5F3FF",
    inputBg: isDark ? "#172436" : "#F8FAFC",
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  useEffect(() => {
    fetchProgress().catch(() => {});
  }, [fetchProgress]);

  const completedModules = useMemo(() => {
    if (!progress) return [];
    return Object.entries(progress)
      .filter(([, p]) => p?.completed)
      .map(([key]) => key);
  }, [progress]);

  const totalXP = useMemo(() => {
    return MODULES.filter((m) => completedModules.includes(m.id)).reduce(
      (acc, curr) => acc + curr.xp,
      0
    );
  }, [completedModules, MODULES]);

  const currentLevel = useMemo(() => {
    return LEVEL_THRESHOLDS.findIndex((t) => totalXP < t) === -1
      ? LEVEL_THRESHOLDS.length
      : LEVEL_THRESHOLDS.findIndex((t) => totalXP < t);
  }, [totalXP]);

  const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || 1000;
  const prevLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const progressToNextLevel = (totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP);

  const currentBadge = BADGES.slice()
    .reverse()
    .find((b) => totalXP >= b.threshold);

  const handleModulePress = (module: typeof MODULES[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedModule(module);
    setModalStep("content");
    setQuiz(null);
    setSelectedAnswers([]);
    setSubmitResult(null);
    setQuizError(null);
  };

  const handleCloseModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedModule(null);
    setModalStep("content");
    setQuiz(null);
    setSelectedAnswers([]);
    setSubmitResult(null);
    setQuizError(null);
  };

  const handleTakeQuiz = async () => {
    if (!selectedModule) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQuizError(null);
    setQuizLoading(true);
    try {
      const q = await getQuiz(selectedModule.id);
      setQuiz(q);
      setSelectedAnswers(q.questions.map(() => -1));
      setModalStep("quiz");
    } catch (e: any) {
      const msg = e.message || t("education.err_load_quiz", "Failed to load quiz");
      setQuizError(msg);
      if (msg.toLowerCase().includes("max attempts")) {
        Alert.alert(
          t("education.no_attempts_title", "No attempts left"),
          t("education.no_attempts_desc", "You've used all attempts for this module. Contact support if you need a reset.")
        );
      } else {
        Alert.alert(t("education.err_title", "Error"), msg);
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedModule || !quiz) return;
    const hasEmpty = selectedAnswers.some((a) => a === -1);
    if (hasEmpty) {
      Alert.alert(
        t("education.answer_all_title", "Answer all questions"),
        t("education.answer_all_desc", "Please select an answer for every question.")
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQuizError(null);
    setQuizLoading(true);
    try {
      const result = await submitQuiz(selectedModule.id, selectedAnswers as number[]);
      setSubmitResult(result);
      setModalStep("result");
      if (result.passed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await fetchProgress();
        await fetchMe().catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      const msg = e.message || t("education.err_submit_failed", "Submit failed");
      setQuizError(msg);
      if (msg.toLowerCase().includes("max attempts")) {
        Alert.alert(
          t("education.no_attempts_title", "No attempts left"),
          t("education.no_attempts_desc", "You've used all attempts for this module. Contact support if you need a reset.")
        );
      } else {
        Alert.alert(t("education.err_title", "Error"), msg);
      }
    } finally {
      setQuizLoading(false);
    }
  };

  const handleBackToContent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalStep("content");
    setQuiz(null);
    setSelectedAnswers([]);
    setSubmitResult(null);
    setQuizError(null);
  };

  const moduleProgress = selectedModule && progress ? progress[selectedModule.id] : null;
  const isCompleted = selectedModule ? completedModules.includes(selectedModule.id) : false;
  const maxAttemptsReached =
    moduleProgress && !moduleProgress.completed && moduleProgress.attempts >= MAX_ATTEMPTS;

  const onRefresh = () => fetchProgress().catch(() => {});

  const dynamicMarkdownStyles = StyleSheet.create({
    body: { fontSize: 15, color: theme.text, lineHeight: 24, fontWeight: "500" },
    heading1: { fontSize: 22, fontWeight: "900", color: theme.text, marginTop: 18, marginBottom: 10, letterSpacing: -0.3 },
    heading2: { fontSize: 18, fontWeight: "800", color: theme.text, marginTop: 14, marginBottom: 8 },
    strong: { fontWeight: "800", color: theme.text },
    list_item: { marginBottom: 6, color: theme.text, fontSize: 15, lineHeight: 22 },
    blockquote: {
      backgroundColor: isDark ? "#162232" : "#F1F5F9",
      borderLeftWidth: 4,
      borderLeftColor: theme.accent,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginVertical: 16,
      borderRadius: 8,
    },
  });

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
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t("education.header_title", "Education Hub")}</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  {t("education.header_subtitle", "Learn safety protocols & DeFi basics.")}
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 10 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={progressLoading} onRefresh={onRefresh} tintColor={theme.accent} />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Ambient Gradient Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.12)", "rgba(8,14,20,0)"] : ["rgba(0,177,79,0.08)", "rgba(244,247,252,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* Dashboard Progress Ring Card */}
        <LinearGradient
          colors={isDark ? ["#101C2B", "#0D1622"] : ["#1E293B", "#0F172A"]}
          style={styles.dashboardCard}
        >
          <View style={styles.radialProgressBlock}>
            <View style={[styles.outerProgressCircle, { borderColor: "rgba(255,255,255,0.06)" }]}>
              {/* Dynamic Progress indicator fill */}
              <LinearGradient
                colors={["#00B14F", "#34D399"]}
                style={styles.progressGlowOrb}
              />
              <View style={styles.innerProgressContent}>
                <Text style={styles.lvlNumber}>{currentLevel}</Text>
                <Text style={styles.lvlText}>{t("education.level", "LEVEL")}</Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.badgeLabelContainer}>
              <Text style={styles.currentBadgeName}>{currentBadge?.name || "Novice Pioneer"}</Text>
              <Text style={styles.dashboardXpText}>{totalXP} <Text style={{ color: "rgba(255,255,255,0.4)" }}>/ {nextLevelXP} XP</Text></Text>
            </View>

            <View style={styles.barWrap}>
              <View style={[styles.barBg, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
                <LinearGradient
                  colors={["#00B14F", "#10B981"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: `${Math.min(progressToNextLevel * 100, 100)}%` }]}
                />
              </View>
            </View>

            <View style={styles.nextLevelGoalRow}>
              <Ionicons name="sparkles" size={12} color="#FBBF24" />
              <Text style={styles.nextLevelGoalText}>
                {t("education.xp_remaining", "{{xp}} XP remaining for next level", { xp: Math.max(0, Math.round(nextLevelXP - totalXP)) })}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Beautiful Segmented Tab Selector */}
        <View style={[styles.tabSelectorBg, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "lessons" && [styles.tabActiveBtn, { backgroundColor: isDark ? "#172436" : "#F1F5F9" }]]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("lessons");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="book" size={16} color={activeTab === "lessons" ? theme.accent : theme.muted} />
            <Text style={[styles.tabBtnText, { color: activeTab === "lessons" ? theme.text : theme.muted }]}>
              {t("education.tab_lessons", "Lessons")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "achievements" && [styles.tabActiveBtn, { backgroundColor: isDark ? "#172436" : "#F1F5F9" }]]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("achievements");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trophy" size={16} color={activeTab === "achievements" ? theme.accent : theme.muted} />
            <Text style={[styles.tabBtnText, { color: activeTab === "achievements" ? theme.text : theme.muted }]}>
              {t("education.tab_achievements", "Achievements")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Lessons List */}
        {activeTab === "lessons" && (
          <View>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionHeadingTitle, { color: theme.text }]}>{t("education.learning_paths", "Learning Paths")}</Text>
              <Text style={[styles.sectionCountBadge, { color: theme.muted }]}>{t("education.module_count", "{{count}} modules", { count: MODULES.length })}</Text>
            </View>

            {MODULES.map((module, idx) => {
              const isCompleted = completedModules.includes(module.id);
              const isLocked = idx > 0 && !completedModules.includes(MODULES[idx - 1].id);

              return (
                <TouchableOpacity
                  key={module.id}
                  style={[
                    styles.modulePremiumCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isLocked && { opacity: 0.55 },
                  ]}
                  onPress={() => !isLocked && handleModulePress(module)}
                  activeOpacity={0.9}
                  disabled={isLocked}
                >
                  {/* Colorful Left Border Strip */}
                  <LinearGradient
                    colors={(isLocked ? ["#9CA3AF", "#6B7280"] : module.gradientColors) as any}
                    style={styles.cardAccentBar}
                  />

                  <View style={styles.cardBodyWrap}>
                    <View style={[styles.iconContainer, { backgroundColor: isLocked ? (isDark ? "#172436" : "#F1F5F9") : (module.color + "14") }]}>
                      <Ionicons
                        name={isLocked ? "lock-closed-outline" : (module.icon as any)}
                        size={20}
                        color={isLocked ? theme.muted : module.color}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={[styles.modulePathTitle, { color: isLocked ? theme.muted : theme.text }]}>
                          {module.title}
                        </Text>
                      </View>
                      <Text style={[styles.modulePathDesc, { color: theme.muted }]}>{module.description}</Text>

                      <View style={styles.metaRow}>
                        <View style={[styles.metaTag, { backgroundColor: theme.inputBg }]}>
                          <Ionicons name="time-outline" size={11} color={theme.muted} />
                          <Text style={[styles.metaTagText, { color: theme.muted }]}>{module.duration}</Text>
                        </View>
                        <View style={[styles.metaTag, { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder, borderWidth: 0.5 }]}>
                          <Ionicons name="flash" size={10} color={theme.amber} />
                          <Text style={[styles.metaTagText, { color: theme.amber }]}>{module.xp} XP</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.indicatorContainer}>
                      {isCompleted ? (
                        <View style={[styles.checkmarkCircle, { backgroundColor: theme.accentSoft }]}>
                          <Ionicons name="checkmark" size={14} color={theme.accent} />
                        </View>
                      ) : isLocked ? (
                        <Ionicons name="lock-closed" size={15} color={theme.muted} />
                      ) : (
                        <View style={[styles.playArrowCircle, { backgroundColor: module.color + "18" }]}>
                          <Ionicons name="play" size={12} color={module.color} style={{ marginLeft: 1 }} />
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tab 2: Achievements List */}
        {activeTab === "achievements" && (
          <View>
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionHeadingTitle, { color: theme.text }]}>{t("education.badges_progress", "Badges Progress")}</Text>
              <Text style={[styles.sectionCountBadge, { color: theme.muted }]}>{t("education.badges_unlocked", "{{count}} unlocked", { count: BADGES.filter(b => totalXP >= b.threshold).length })}</Text>
            </View>

            {BADGES.map((badge) => {
              const isUnlocked = totalXP >= badge.threshold;
              return (
                <View
                  key={badge.id}
                  style={[
                    styles.badgePremiumRow,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    !isUnlocked && { opacity: 0.5 },
                  ]}
                >
                  <LinearGradient
                    colors={(isUnlocked ? badge.gradient : ["#475569", "#1E293B"]) as any}
                    style={styles.badgeGraphicCircle}
                  >
                    <Ionicons
                      name={badge.icon as any}
                      size={24}
                      color="#FFFFFF"
                    />
                  </LinearGradient>

                  <View style={{ flex: 1 }}>
                    <View style={styles.badgeInfoTitleRow}>
                      <Text style={[styles.badgeTitleText, { color: theme.text }]}>{badge.name}</Text>
                      {isUnlocked && (
                        <View style={[styles.unlockedBadge, { backgroundColor: theme.accentSoft }]}>
                          <Text style={[styles.unlockedBadgeText, { color: theme.accent }]}>{t("education.badge_active", "Active")}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.badgeThresholdText, { color: theme.muted }]}>
                      {isUnlocked ? t("education.badge_unlocked", "Unlocked & earned") : t("education.badge_requires_xp", "Requires {{xp}} total XP", { xp: badge.threshold })}
                    </Text>
                  </View>

                  <View style={styles.badgeCheckSlot}>
                    {isUnlocked ? (
                      <Ionicons name="checkmark-circle" size={24} color={theme.accent} />
                    ) : (
                      <Ionicons name="ellipse-outline" size={24} color={theme.border} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* Modern learning lesson modal */}
      <Modal
        visible={!!selectedModule}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        {selectedModule && (
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            {/* Nav Header */}
            <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
              <TouchableOpacity
                onPress={
                  modalStep === "quiz" || modalStep === "result"
                    ? modalStep === "result"
                      ? handleCloseModal
                      : handleBackToContent
                    : handleCloseModal
                }
                style={[styles.closeButton, { backgroundColor: isDark ? "#172436" : "#F1F5F9" }]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={modalStep === "quiz" ? "arrow-back" : "close"}
                  size={20}
                  color={theme.text}
                />
              </TouchableOpacity>
              <Text style={[styles.modalHeaderTitle, { color: theme.text }]} numberOfLines={1}>
                {modalStep === "quiz" ? t("education.quiz_challenge", "Quiz Challenge") : selectedModule.title}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Step 1: Content Module */}
            {modalStep === "content" && (
              <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Banner Gradient Card */}
                <LinearGradient
                  colors={selectedModule.gradientColors as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalHeroBanner}
                >
                  <View style={styles.bannerIconGlow}>
                    <Ionicons name={selectedModule.icon as any} size={38} color="#FFFFFF" />
                  </View>
                  <Text style={styles.bannerModuleTitle}>{selectedModule.title}</Text>
                  <View style={styles.bannerMetaRow}>
                    <View style={styles.bannerMetaBadge}>
                      <Ionicons name="time" size={12} color="#FFFFFF" />
                      <Text style={styles.bannerMetaBadgeText}>{selectedModule.duration}</Text>
                    </View>
                    <View style={styles.bannerMetaBadge}>
                      <Ionicons name="flash" size={12} color="#FFFFFF" />
                      <Text style={styles.bannerMetaBadgeText}>{selectedModule.xp} XP</Text>
                    </View>
                  </View>
                </LinearGradient>

                <View style={[styles.markdownCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Markdown style={dynamicMarkdownStyles as any}>
                    {selectedModule.content}
                  </Markdown>
                </View>

                {isCompleted && (
                  <View style={[styles.resultBadge, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
                    <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                    <Text style={[styles.resultBadgeText, { color: theme.accent }]}>
                      {t("education.completed", "Completed")} {moduleProgress?.score != null ? `• ${t("education.score", "Score")}: ${moduleProgress.score}%` : ""}
                    </Text>
                  </View>
                )}

                {maxAttemptsReached && (
                  <View style={[styles.warningBlock, { backgroundColor: theme.redSoft, borderColor: theme.red }]}>
                    <Ionicons name="alert-circle-outline" size={16} color={theme.red} />
                    <Text style={[styles.warningBlockText, { color: theme.red }]}>
                      {t("education.no_attempts_inline", "No attempts left. Please contact support to reset this module.")}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: selectedModule.color }, maxAttemptsReached && { opacity: 0.6 }]}
                  onPress={
                    isCompleted
                      ? handleCloseModal
                      : maxAttemptsReached
                      ? undefined
                      : handleTakeQuiz
                  }
                  disabled={maxAttemptsReached || quizLoading}
                  activeOpacity={0.85}
                >
                  {quizLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : isCompleted ? (
                    <Text style={styles.primaryBtnText}>{t("education.btn_back_to_hub", "Back to Hub")}</Text>
                  ) : maxAttemptsReached ? (
                    <Text style={styles.primaryBtnText}>{t("education.btn_max_attempts", "Max Attempts Reached")}</Text>
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>{t("education.btn_begin_quiz", "Begin Quiz Challenge")}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}

            {/* Step 2: Quiz Challenges */}
            {modalStep === "quiz" && quiz && (
              <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.quizProgressHeader}>
                  <Text style={[styles.quizProgressCountText, { color: theme.muted }]}>
                    {t("education.question_of", "Question {{current}} of {{total}}", { current: selectedAnswers.filter(a => a !== -1).length, total: quiz.questions.length })}
                  </Text>
                  <View style={[styles.quizProgressTrack, { backgroundColor: isDark ? "#172436" : "#E2E8F0" }]}>
                    <View
                      style={[
                        styles.quizProgressFill,
                        {
                          backgroundColor: selectedModule.color,
                          width: `${(selectedAnswers.filter(a => a !== -1).length / quiz.questions.length) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {quizError && (
                  <View style={[styles.warningBlock, { backgroundColor: theme.redSoft, borderColor: theme.red }]}>
                    <Ionicons name="close-circle-outline" size={16} color={theme.red} />
                    <Text style={[styles.warningBlockText, { color: theme.red }]}>{quizError}</Text>
                  </View>
                )}

                {quiz.questions.map((q, qIdx) => (
                  <View key={qIdx} style={[styles.quizCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.quizQHeader}>
                      <View style={[styles.quizQNum, { backgroundColor: selectedModule.color + "18" }]}>
                        <Text style={[styles.quizQNumText, { color: selectedModule.color }]}>{qIdx + 1}</Text>
                      </View>
                      <Text style={[styles.quizQuestionText, { color: theme.text }]}>{q.question}</Text>
                    </View>

                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[qIdx] === oIdx;
                      return (
                        <TouchableOpacity
                          key={oIdx}
                          style={[
                            styles.quizOptionRow,
                            { backgroundColor: theme.inputBg, borderColor: theme.border },
                            isSelected && { backgroundColor: selectedModule.color + "12", borderColor: selectedModule.color },
                          ]}
                          onPress={() => {
                            const next = [...selectedAnswers];
                            next[qIdx] = oIdx;
                            setSelectedAnswers(next);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.quizOptionText, { color: theme.text }, isSelected && { fontWeight: "700" }]}>
                            {opt}
                          </Text>
                          <View style={[styles.radioDot, { borderColor: theme.border }, isSelected && { borderColor: selectedModule.color, backgroundColor: selectedModule.color }]}>
                            {isSelected && <View style={styles.radioDotInner} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: selectedModule.color }, selectedAnswers.some((a) => a === -1) && { opacity: 0.65 }]}
                  onPress={handleSubmitQuiz}
                  disabled={quizLoading || selectedAnswers.some((a) => a === -1)}
                  activeOpacity={0.85}
                >
                  {quizLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>{t("education.btn_submit_answers", "Submit Answers")}</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}

            {/* Step 3: Beautiful Results */}
            {modalStep === "result" && submitResult && (
              <View style={[styles.resultContainer, { backgroundColor: theme.background }]}>
                {submitResult.passed ? (
                  <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.successHero}>
                      <LinearGradient colors={["#10B981", "#059669"]} style={styles.successRing}>
                        <Ionicons name="trophy" size={44} color="#FFFFFF" />
                      </LinearGradient>
                      <Text style={[styles.successTitle, { color: theme.text }]}>{t("education.quiz_passed", "Quiz Passed!")}</Text>
                      <Text style={[styles.successSubtitle, { color: theme.muted }]}>
                        {t("education.quiz_passed_sub", "Excellent work! You have successfully mastered this path.")}
                      </Text>
                    </View>

                    <View style={[styles.rewardResultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={styles.rewardResultHeader}>
                        <Text style={[styles.rewardEyebrow, { color: theme.accent }]}>{t("education.reward_claimed", "REWARD CLAIMED")}</Text>
                        <View style={[styles.rewardXpPill, { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder }]}>
                          <Ionicons name="flash" size={12} color={theme.amber} />
                          <Text style={[styles.rewardXpText, { color: theme.amber }]}>+{selectedModule.xp} XP</Text>
                        </View>
                      </View>
                      <Text style={[styles.rewardTitleText, { color: theme.text }]}>{selectedModule.title}</Text>
                      <Text style={[styles.rewardDescText, { color: theme.muted }]}>{submitResult.message}</Text>
                    </View>

                    <View style={[styles.scoreCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.scoreLabel, { color: theme.muted }]}>{t("education.accuracy", "ACCURACY")}</Text>
                      <Text style={[styles.scoreValue, { color: theme.accent }]}>
                        {submitResult.score}% <Text style={{ fontSize: 16, color: theme.muted }}>({submitResult.correct}/{submitResult.total})</Text>
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: selectedModule.color }]}
                      onPress={handleCloseModal}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryBtnText}>{t("education.btn_continue", "Continue Journey")}</Text>
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.successHero}>
                      <LinearGradient colors={[theme.red, "#B91C1C"]} style={styles.successRing}>
                        <Ionicons name="close-circle-outline" size={48} color="#FFFFFF" />
                      </LinearGradient>
                      <Text style={[styles.successTitle, { color: theme.text }]}>{t("education.quiz_failed", "Keep Learning")}</Text>
                      <Text style={[styles.successSubtitle, { color: theme.muted }]}>
                        {t("education.quiz_failed_sub", "Review the guide once more and try again to score at least {{score}}%.", { score: quiz?.passingScore || 80 })}
                      </Text>
                    </View>

                    <View style={[styles.scoreCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.scoreLabel, { color: theme.muted }]}>{t("education.accuracy", "ACCURACY")}</Text>
                      <Text style={[styles.scoreValue, { color: theme.red }]}>
                        {submitResult.score}% <Text style={{ fontSize: 16, color: theme.muted }}>({submitResult.correct}/{submitResult.total})</Text>
                      </Text>
                    </View>

                    <View style={[styles.lessonOverviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <Text style={[styles.overviewEyebrow, { color: theme.red }]}>{t("education.feedback", "FEEDBACK")}</Text>
                      <Text style={[styles.overviewText, { color: theme.muted }]}>{submitResult.message}</Text>
                      {submitResult.attempts_left != null && (
                        <Text style={[styles.attemptsLeftText, { color: theme.amber }]}>
                          {t("education.attempts_remaining", "Attempts remaining: {{left}} / {{max}}", { left: submitResult.attempts_left, max: MAX_ATTEMPTS })}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: selectedModule.color }]}
                      onPress={handleTakeQuiz}
                      disabled={quizLoading}
                      activeOpacity={0.85}
                    >
                      {quizLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryBtnText}>{t("education.btn_retry", "Retry Challenge Now")}</Text>
                          <Ionicons name="refresh" size={18} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: theme.border }]}
                      onPress={handleCloseModal}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.cancelBtnText, { color: theme.muted }]}>{t("education.btn_return", "Return to Lessons")}</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        )}
      </Modal>
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
    borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1,
  },
  introEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8 },
  introTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, letterSpacing: -0.4 },
  introSubtitle: { fontSize: 14, lineHeight: 21 },

  lessonOverviewCard: {
    borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 18,
  },
  overviewEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4 },
  overviewText: { fontSize: 13, lineHeight: 19, fontWeight: "600" },

  dashboardCard: {
    flexDirection: "row", alignItems: "center", gap: 20,
    borderRadius: 28, padding: 22, marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  radialProgressBlock: {
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  outerProgressCircle: {
    width: 82, height: 82, borderRadius: 41,
    borderWidth: 5, alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  progressGlowOrb: {
    position: "absolute", width: 8, height: 8, borderRadius: 4,
    top: -1, right: 18,
    shadowColor: "#00B14F", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 8,
  },
  innerProgressContent: {
    alignItems: "center", justifyContent: "center",
  },
  lvlNumber: { fontSize: 28, fontWeight: "900", color: "#FFFFFF", lineHeight: 30 },
  lvlText: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 },

  badgeLabelContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  currentBadgeName: { fontSize: 16, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.2 },
  dashboardXpText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  barWrap: { marginBottom: 8 },
  barBg: { height: 7, borderRadius: 99 },
  barFill: { height: "100%", borderRadius: 99 },
  nextLevelGoalRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  nextLevelGoalText: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.55)" },

  tabSelectorBg: {
    flexDirection: "row", padding: 5, borderRadius: 18, borderWidth: 1, marginBottom: 20,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingVertical: 10, borderRadius: 14,
  },
  tabActiveBtn: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  tabBtnText: { fontSize: 14, fontWeight: "700" },

  sectionHeaderWrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 4 },
  sectionHeadingTitle: { fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  sectionCountBadge: { fontSize: 13, fontWeight: "600" },

  modulePremiumCard: {
    flexDirection: "row", borderRadius: 24, borderWidth: 1, marginBottom: 12, overflow: "hidden",
  },
  cardAccentBar: { width: 6, alignSelf: "stretch" },
  cardBodyWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  iconContainer: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  modulePathTitle: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2, marginBottom: 4 },
  modulePathDesc: { fontSize: 13, lineHeight: 18, fontWeight: "500", marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8,
  },
  metaTagText: { fontSize: 10, fontWeight: "800" },
  indicatorContainer: { flexShrink: 0 },
  checkmarkCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  playArrowCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },

  badgePremiumRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 24, borderWidth: 1, marginBottom: 12,
  },
  badgeGraphicCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  badgeInfoTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  badgeTitleText: { fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  unlockedBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 },
  unlockedBadgeText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  badgeThresholdText: { fontSize: 12, fontWeight: "500" },
  badgeCheckSlot: { flexShrink: 0 },

  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  closeButton: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: "800", flex: 1, textAlign: "center", paddingHorizontal: 8 },
  modalScroll: { paddingHorizontal: 20, paddingTop: 16 },

  modalHeroBanner: {
    borderRadius: 28, padding: 22, marginBottom: 20, alignItems: "center",
  },
  bannerIconGlow: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  bannerModuleTitle: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", textAlign: "center", letterSpacing: -0.5, marginBottom: 12 },
  bannerMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bannerMetaBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  bannerMetaBadgeText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  markdownCard: {
    borderRadius: 24, padding: 18, borderWidth: 1, marginBottom: 20,
  },

  resultBadge: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center",
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1,
    marginBottom: 20,
  },
  resultBadgeText: { fontSize: 14, fontWeight: "800" },

  warningBlock: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20,
  },
  warningBlockText: { flex: 1, fontSize: 13, fontWeight: "700" },

  primaryBtn: {
    height: 56, borderRadius: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  quizProgressHeader: { marginBottom: 16 },
  quizProgressCountText: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  quizProgressTrack: { height: 6, borderRadius: 99, overflow: "hidden" },
  quizProgressFill: { height: "100%", borderRadius: 99 },

  quizCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 16,
  },
  quizQHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 16 },
  quizQNum: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  quizQNumText: { fontSize: 13, fontWeight: "900" },
  quizQuestionText: { flex: 1, fontSize: 15, fontWeight: "800", lineHeight: 21 },
  quizOptionRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1.5, marginBottom: 8,
  },
  quizOptionText: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: "500" },
  radioDot: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },

  resultContainer: { flex: 1, justifyContent: "center" },
  resultScroll: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 },
  successHero: { alignItems: "center", marginBottom: 24 },
  successRing: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  successTitle: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5, marginBottom: 6 },
  successSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 21, fontWeight: "500" },

  rewardResultCard: {
    borderRadius: 24, padding: 18, borderWidth: 1, marginBottom: 16,
  },
  rewardResultHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  rewardEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  rewardXpPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  rewardXpText: { fontSize: 12, fontWeight: "800" },
  rewardTitleText: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  rewardDescText: { fontSize: 13, lineHeight: 19, fontWeight: "500" },

  scoreCard: {
    borderRadius: 20, padding: 16, borderWidth: 1, marginBottom: 16, alignItems: "center",
  },
  scoreLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4 },
  scoreValue: { fontSize: 28, fontWeight: "900" },
  attemptsLeftText: { fontSize: 12, fontWeight: "700", marginTop: 8 },

  cancelBtn: {
    height: 52, borderRadius: 16, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", marginTop: 10,
  },
  cancelBtnText: { fontSize: 15, fontWeight: "800" },
});
