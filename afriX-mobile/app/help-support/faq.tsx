import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

type FaqItem = { id: string; q: string; a: string };

const SECTIONS: { title: string; items: FaqItem[] }[] = [
  {
    title: "Getting Started",
    items: [
      {
        id: "what-is",
        q: "What is AfriToken?",
        a: "A peer-to-peer platform for exchanging digital tokens (NT and CT). Buy from agents with Naira or XOF, send to friends, swap token types, and sell back to agents for cash.",
      },
      {
        id: "is-bank",
        q: "Is AfriToken a bank?",
        a: "No. We're a technology platform connecting you with users and independent agents. We don't hold your money or provide banking services.",
      },
      {
        id: "create-account",
        q: "How do I create an account?",
        a: "Download the app, enter email and password, verify your email. No bank account needed to start.",
      },
    ],
  },
  {
    title: "Tokens Explained",
    items: [
      {
        id: "nt-ct",
        q: "What are NT and CT?",
        a: "NT (Naira Token) ≈ 1 Naira reference. CT (CFA Token) ≈ 1 XOF reference. They are blockchain tokens, not government-issued currency.",
      },
      {
        id: "pay-things",
        q: "Can I use tokens to pay for things?",
        a: "Yes at merchants who accept AfriToken. At regular stores you need to sell tokens for cash first.",
      },
    ],
  },
  {
    title: "Acquiring Tokens",
    items: [
      {
        id: "how-buy",
        q: "How do I buy tokens from an agent?",
        a: "Tap Buy Tokens, choose amount and agent, send payment to the agent's bank or mobile money, upload proof. Agent confirms and mints tokens to your wallet, usually within 5 to 15 minutes.",
      },
      {
        id: "choose-agent",
        q: "How do I choose a good agent?",
        a: "Look for a high rating, fast response time, and verified or high-liquidity badges. Avoid low ratings and very slow response times.",
      },
    ],
  },
  {
    title: "Selling Tokens",
    items: [
      {
        id: "how-sell",
        q: "How do I convert tokens back to cash?",
        a: "Tap Sell Tokens, choose amount and agent. Your tokens lock in escrow. The agent sends you cash, and you should only confirm after the money lands in your account.",
      },
      {
        id: "escrow",
        q: "What is escrow protection?",
        a: "Your tokens are locked in a smart contract. The agent cannot access them until you confirm receipt of cash. If they don't pay, you can dispute and get your tokens refunded.",
      },
      {
        id: "dispute",
        q: "What if the agent doesn't send me cash?",
        a: "Open a dispute from the request status screen and upload proof. Admin review usually happens within 24 to 48 hours. If the agent didn't deliver, your tokens are refunded from escrow.",
      },
    ],
  },
  {
    title: "Security & Safety",
    items: [
      {
        id: "protect",
        q: "How do I protect my account?",
        a: "Use a strong password, never share it, and enable 2FA in Settings > Security. Real support will never ask for your password or tell you to verify by sending tokens.",
      },
      {
        id: "scams",
        q: "What scams should I avoid?",
        a: "Avoid support impersonators asking for passwords, double-your-tokens offers, fake websites and apps, and rates that look too good to be true. Never send tokens to prove ownership.",
      },
    ],
  },
  {
    title: "Fees",
    items: [
      {
        id: "fees",
        q: "What are the fees?",
        a: "P2P transfer is 0.5 percent, swap is 1.5 percent, receive is free, buy and sell with agents are included in the quoted rate, and merchant payments are paid by the merchant. All fees are shown before you confirm.",
      },
    ],
  },
];

export default function FullFaqScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#00B14F", "#008F40"]}
          style={styles.headerGradient}
        />
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Full FAQ</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#F7FFF9", "#FFFFFF"]}
          style={styles.summaryCard}
        >
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryBadge}>
              <Ionicons name="book-outline" size={16} color="#00B14F" />
              <Text style={styles.summaryBadgeText}>Knowledge Base</Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {SECTIONS.reduce((total, section) => total + section.items.length, 0)} topics
              </Text>
            </View>
          </View>
          <Text style={styles.summaryTitle}>Answers for the most important questions</Text>
          <Text style={styles.summaryText}>
            Explore account setup, token usage, agent transactions, security, fees, and dispute guidance in one place.
          </Text>

          <View style={styles.highlightRow}>
            <View style={styles.highlightPill}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#059669" />
              <Text style={styles.highlightText}>Safety tips included</Text>
            </View>
            <View style={styles.highlightPill}>
              <Ionicons name="flash-outline" size={16} color="#0EA5E9" />
              <Text style={styles.highlightText}>Quick scan format</Text>
            </View>
          </View>
        </LinearGradient>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.items.length} items</Text>
            </View>

            <View style={styles.sectionCard}>
              {section.items.map((item, index) => {
                const isOpen = expanded[item.id];
                const isLast = index === section.items.length - 1;

                return (
                  <View
                    key={item.id}
                    style={[styles.faqCard, isLast && styles.faqCardLast]}
                  >
                    <TouchableOpacity
                      style={styles.faqRow}
                      onPress={() => toggle(item.id)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.faqQuestionBlock}>
                        <View style={styles.faqIcon}>
                          <Ionicons
                            name={isOpen ? "remove" : "add"}
                            size={16}
                            color="#00B14F"
                          />
                        </View>
                        <Text style={styles.faqQuestion}>{item.q}</Text>
                      </View>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#6B7280"
                      />
                    </TouchableOpacity>

                    {isOpen ? (
                      <View style={styles.answerWrap}>
                        <Text style={styles.faqAnswer}>{item.a}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.supportCard}>
          <Text style={styles.supportEyebrow}>Still Need Help?</Text>
          <Text style={styles.supportTitle}>Contact the support team directly</Text>
          <Text style={styles.supportText}>
            If your answer is not here, go back to Help & Support and use the Email Support option so we can assist with account or transaction issues.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FB",
  },
  headerWrapper: {
    zIndex: 2,
    elevation: 2,
    backgroundColor: "#00B14F",
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSpacer: {
    width: 42,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  summaryCard: {
    marginTop: -18,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D9FBE8",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 10,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#047857",
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475467",
  },
  summaryTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475467",
  },
  highlightRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  highlightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  highlightText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#344054",
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#667085",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  faqCard: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F6",
  },
  faqCardLast: {
    borderBottomWidth: 0,
  },
  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  faqQuestionBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  faqIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#101828",
  },
  answerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 56,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475467",
  },
  supportCard: {
    marginTop: 24,
    borderRadius: 22,
    padding: 20,
    backgroundColor: "#0F172A",
  },
  supportEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#86EFAC",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  supportTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#D0D5DD",
  },
  bottomSpacer: {
    height: 24,
  },
});
