// app/modals/request-tokens.tsx
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Animated,
  Text,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const UPCOMING_FEATURES = [
  {
    icon: "people-outline" as const,
    title: "Request from anyone",
    description:
      "Create token requests for friends, customers, or teammates in a few taps — no account needed on their side.",
    color: "#00B14F",
    softBg: "rgba(0,177,79,0.12)",
  },
  {
    icon: "options-outline" as const,
    title: "Choose exact amounts",
    description:
      "Set the token type, amount, and a clear reason so recipients know exactly what to pay and why.",
    color: "#3B82F6",
    softBg: "rgba(59,130,246,0.12)",
  },
  {
    icon: "pulse-outline" as const,
    title: "Track request status",
    description:
      "See when requests are pending, viewed, paid, or overdue — all from one clean live timeline.",
    color: "#A855F7",
    softBg: "rgba(168,85,247,0.12)",
  },
];

const TIMELINE_STEPS = [
  {
    step: "01",
    title: "Create request",
    desc: "Select token, amount, and recipient details with a cleaner, guided form.",
  },
  {
    step: "02",
    title: "Share & notify",
    desc: "Recipients get a clear prompt with full context — no guessing what the request is for.",
  },
  {
    step: "03",
    title: "Track completion",
    desc: "Monitor pending and completed requests without chasing updates manually.",
  },
];

const BENEFITS = [
  "Faster collection flow without back-and-forth messages",
  "Clear status visibility for every outstanding request",
  "Instant confirmation when a request is fulfilled",
];

export default function RequestTokensModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);

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
    purple: "#A855F7",
    purpleSoft: isDark ? "rgba(168,85,247,0.12)" : "#F5F3FF",
    purpleBorder: isDark ? "rgba(168,85,247,0.25)" : "#DDD6FE",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
    amber: "#F59E0B",
    amberSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    amberBorder: isDark ? "rgba(245,158,11,0.25)" : "#FDE68A",
  };

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const subtitleMaxHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [80, 0],
    extrapolate: "clamp",
  });
  const subtitleMargin = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [4, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Collapsible Header */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > headerMaxHeight) setHeaderMaxHeight(h);
        }}
        style={[
          styles.headerWrapper,
          { backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backButton,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Request Tokens
              </Text>
              <Animated.View
                style={{
                  opacity: subtitleOpacity,
                  maxHeight: subtitleMaxHeight,
                  marginTop: subtitleMargin,
                  overflow: "hidden",
                }}
              >
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  A smarter way to ask for tokens is on its way.
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerMaxHeight + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Ambient glow */}
        <LinearGradient
          colors={
            isDark
              ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"]
              : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]
          }
          style={styles.glow}
          pointerEvents="none"
        />

        {/* Hero card */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {/* Coming Soon badge */}
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: theme.amberSoft, borderColor: theme.amberBorder },
            ]}
          >
            <Ionicons name="sparkles-outline" size={13} color={theme.amber} />
            <Text style={[styles.heroBadgeText, { color: theme.amber }]}>
              Premium update in progress
            </Text>
          </View>

          {/* Hero artwork */}
          <View style={styles.heroArtRow}>
            <View
              style={[
                styles.heroIconOuter,
                { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
              ]}
            >
              <View
                style={[styles.heroIconInner, { backgroundColor: theme.accent }]}
              >
                <Ionicons name="hand-left-outline" size={36} color="#FFFFFF" />
              </View>
            </View>

            {/* Floating notification pill */}
            <View
              style={[
                styles.heroFloatPill,
                { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={14}
                color={theme.blue}
              />
              <Text style={[styles.heroFloatText, { color: theme.blue }]}>
                Request alert
              </Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: theme.text }]}>
            A better way to ask for tokens is coming
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.muted }]}>
            We are redesigning this flow to feel more polished, easier to track,
            and more trustworthy for both sender and recipient.
          </Text>
        </View>

        {/* Status card */}
        <View
          style={[
            styles.statusCard,
            { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
          ]}
        >
          <View
            style={[styles.statusIconBox, { backgroundColor: theme.accent + "30" }]}
          >
            <Ionicons name="construct-outline" size={20} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusEyebrow, { color: theme.accent }]}>
              NOW IN DEVELOPMENT
            </Text>
            <Text style={[styles.statusTitle, { color: theme.text }]}>
              Request flow premium refresh
            </Text>
            <Text style={[styles.statusDesc, { color: theme.muted }]}>
              This screen is next in the upgrade queue and will follow the same
              premium direction as Buy, Sell, Send, Receive, and Swap.
            </Text>
          </View>
        </View>

        {/* Upcoming features */}
        <Text style={[styles.sectionEyebrow, { color: theme.muted }]}>
          What's Coming
        </Text>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Planned request experience
        </Text>

        {UPCOMING_FEATURES.map((f) => (
          <View
            key={f.title}
            style={[
              styles.featureCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.featureIconBox,
                {
                  backgroundColor: isDark
                    ? f.softBg
                    : f.softBg.replace("0.12", "0.15"),
                },
              ]}
            >
              <Ionicons name={f.icon} size={22} color={f.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>
                {f.title}
              </Text>
              <Text style={[styles.featureDesc, { color: theme.muted }]}>
                {f.description}
              </Text>
            </View>
          </View>
        ))}

        {/* Timeline card */}
        <View
          style={[
            styles.timelineCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectionEyebrow, { color: theme.muted }]}>
            Flow Direction
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            The polished journey ahead
          </Text>

          {TIMELINE_STEPS.map((step, i) => (
            <View key={step.step} style={styles.timelineRow}>
              {/* Step connector */}
              <View style={styles.timelineLeftCol}>
                <View
                  style={[
                    styles.timelineStepBadge,
                    { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
                  ]}
                >
                  <Text style={[styles.timelineStepNum, { color: theme.accent }]}>
                    {step.step}
                  </Text>
                </View>
                {i < TIMELINE_STEPS.length - 1 && (
                  <View
                    style={[styles.timelineConnector, { backgroundColor: theme.accentBorder }]}
                  />
                )}
              </View>

              <View style={styles.timelineTextCol}>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>
                  {step.title}
                </Text>
                <Text style={[styles.timelineDesc, { color: theme.muted }]}>
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Benefits card */}
        <View
          style={[
            styles.benefitsCard,
            { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder },
          ]}
        >
          <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>
            Why It Matters
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Focused on clarity and confidence
          </Text>

          {BENEFITS.map((b) => (
            <View key={b} style={styles.benefitRow}>
              <View
                style={[
                  styles.benefitCheck,
                  { backgroundColor: theme.accent },
                ]}
              >
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
              <Text style={[styles.benefitText, { color: theme.text }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.accent }]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Text style={styles.backBtnText}>Back for now</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  glow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 20,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  heroArtRow: {
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
    height: 110,
    justifyContent: "center",
  },
  heroIconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  heroIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  heroFloatPill: {
    position: "absolute",
    right: 12,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroFloatText: {
    fontSize: 11,
    fontWeight: "800",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 32,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },
  statusCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  statusIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  statusDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 10,
  },
  featureIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  timelineCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
  },
  timelineLeftCol: {
    alignItems: "center",
    width: 36,
  },
  timelineStepBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineStepNum: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    marginTop: 6,
    borderRadius: 1,
    minHeight: 20,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  benefitsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 12,
  },
  benefitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  backBtn: {
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
  },
});
