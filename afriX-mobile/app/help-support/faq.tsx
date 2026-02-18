/**
 * Full FAQ screen – content aligned with afriX_backend/docs/AfriToken User FAQ.md
 */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type FaqItem = { id: string; q: string; a: string };

const SECTIONS: { title: string; items: FaqItem[] }[] = [
  {
    title: "Getting Started",
    items: [
      {
        id: "what-is",
        q: "What is AfriToken?",
        a: "A peer-to-peer platform for exchanging digital tokens (NT and CT). Buy from agents with Naira/XOF, send to friends, swap token types, sell back to agents for cash.",
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
        a: "Tap Buy Tokens, choose amount and agent, send payment to the agent's bank/mobile money, upload proof. Agent confirms and mints tokens to your wallet (usually 5–15 min).",
      },
      {
        id: "choose-agent",
        q: "How do I choose a good agent?",
        a: "Look for high rating (4.5+), fast response time, Verified and High Liquidity badges. Avoid low ratings and very slow response times.",
      },
    ],
  },
  {
    title: "Selling Tokens",
    items: [
      {
        id: "how-sell",
        q: "How do I convert tokens back to cash?",
        a: "Tap Sell Tokens, choose amount and agent. Your tokens lock in escrow. Agent sends you cash; only confirm when money is in your account. Then tokens are released.",
      },
      {
        id: "escrow",
        q: "What is escrow protection?",
        a: "Your tokens are locked in a smart contract. The agent cannot access them until you confirm receipt of cash. If they don't pay, you can dispute and get tokens refunded.",
      },
      {
        id: "dispute",
        q: "What if the agent doesn't send me cash?",
        a: "Open a dispute from the request status screen. Upload proof. Admin reviews within 24–48 hours. If the agent didn't deliver, your tokens are refunded from escrow.",
      },
    ],
  },
  {
    title: "Security & Safety",
    items: [
      {
        id: "protect",
        q: "How do I protect my account?",
        a: "Use a strong password, never share it, enable 2FA in Settings → Security. Real support never asks for your password or to 'verify' by sending tokens.",
      },
      {
        id: "scams",
        q: "What scams should I avoid?",
        a: "Support asking for password, 'double your tokens' offers, fake websites/apps, too-good-to-be-true rates. Never send tokens to 'prove' ownership.",
      },
    ],
  },
  {
    title: "Fees",
    items: [
      {
        id: "fees",
        q: "What are the fees?",
        a: "P2P transfer: 0.5%. Swap: 1.5%. Receive: free. Buy/sell with agent: included in rate. Merchant payment: 2% (merchant pays). All shown before you confirm.",
      },
    ],
  },
];

export default function FullFaqScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Full FAQ</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          From AfriToken User FAQ. For the complete doc see backend docs/AfriToken User FAQ.md
        </Text>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const isOpen = expanded[item.id];
              return (
                <View key={item.id} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqRow}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQ}>{item.q}</Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  {isOpen && <Text style={styles.faqA}>{item.a}</Text>}
                </View>
              );
            })}
          </View>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  content: { padding: 20, paddingBottom: 32 },
  intro: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  faqQ: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827" },
  faqA: {
    marginTop: 12,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  bottomSpacer: { height: 24 },
});
