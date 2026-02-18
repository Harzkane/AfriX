import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// FAQ content aligned with docs/AfriToken User FAQ.md
const FAQ_ITEMS = [
  {
    id: "what-is-afritoken",
    question: "What is AfriToken?",
    answer:
      "AfriToken is a peer-to-peer platform for exchanging digital tokens (NT and CT). Buy tokens from agents with Naira or XOF, send tokens to friends instantly, swap between token types, and sell tokens back to agents for cash. It's a digital marketplace for value across borders.",
  },
  {
    id: "what-are-nt-ct",
    question: "What are NT and CT tokens?",
    answer:
      "NT (Naira Token) has a reference rate of 1 NT ≈ 1 Naira. CT (CFA Token) has 1 CT ≈ 1 XOF. They are NOT government-issued currency—they are blockchain-based digital assets. You can use them within the platform and with merchants who accept AfriToken.",
  },
  {
    id: "how-buy",
    question: "How do I buy tokens from an agent?",
    answer:
      "Tap Buy Tokens, choose token type and amount, pick an agent (check ratings and response time), send payment to the agent's bank/mobile money, then upload proof in the app. The agent confirms and mints tokens to your wallet—usually within 5–15 minutes.",
  },
  {
    id: "how-sell",
    question: "How do I sell tokens (convert to cash)?",
    answer:
      "Tap Sell Tokens, choose amount and agent. Your tokens lock in escrow (protected). The agent sends you Naira/XOF; only confirm receipt when the money is in your account. Then tokens are released to the agent. Escrow protects you the whole time.",
  },
  {
    id: "escrow",
    question: "What is escrow protection?",
    answer:
      "When you sell, your tokens are locked in a smart contract. The agent cannot access them until you confirm you received cash. If the agent doesn't pay, you can dispute and your tokens are refunded. You're in control.",
  },
  {
    id: "dispute",
    question: "What if I didn't receive my cash or tokens?",
    answer:
      "Open a dispute from the request status screen (e.g. 'I didn't receive it'). Upload any proof (e.g. bank statement). Admin reviews within 24–48 hours. For sells, if the agent didn't deliver cash, your tokens can be refunded from escrow.",
  },
  {
    id: "security",
    question: "How do I protect my account?",
    answer:
      "Use a strong password, never share it, and enable 2FA in Settings → Security. Real support will NEVER ask for your password or for you to 'verify' by sending tokens. Avoid 'double your tokens' scams and fake websites.",
  },
  {
    id: "fees",
    question: "What are the fees?",
    answer:
      "P2P transfer: 0.5%. Token swap: 1.5%. Receiving tokens: free. Buy/sell with agent: included in the rate. Merchant payment: 2% (paid by merchant). All fees are shown before you confirm.",
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const faqSectionY = useRef(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openEmail = () => {
    Linking.openURL("mailto:support@afritoken.com?subject=Help%20%26%20Support");
  };

  const scrollToFaq = () => {
    scrollRef.current?.scrollTo({ y: faqSectionY.current, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/profile")} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How can we help?</Text>
          <Text style={styles.bodyText}>
            Find answers to common questions, or get in touch with our support team. We're here to
            help you use AfriExchange safely.
          </Text>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick links</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.quickRow} onPress={scrollToFaq}>
              <View style={[styles.quickIconBox, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="help-circle-outline" size={22} color="#059669" />
              </View>
              <Text style={styles.quickLabel}>Frequently asked questions</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickRow} onPress={openEmail}>
              <View style={[styles.quickIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="mail-outline" size={22} color="#2563EB" />
              </View>
              <Text style={styles.quickLabel}>Email support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickRow}
              onPress={() => router.push("/help-support/faq")}
            >
              <View style={[styles.quickIconBox, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="book-outline" size={22} color="#7C3AED" />
              </View>
              <Text style={styles.quickLabel}>Browse full FAQ</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickRow, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/(tabs)/activity")}
            >
              <View style={[styles.quickIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="document-text-outline" size={22} color="#D97706" />
              </View>
              <Text style={styles.quickLabel}>My requests & disputes</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View
          style={styles.section}
          onLayout={(e) => {
            faqSectionY.current = e.nativeEvent.layout.y - 20;
          }}
        >
          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item) => {
              const isOpen = expandedId === item.id;
              return (
                <View key={item.id} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setExpandedId(isOpen ? null : item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  {isOpen && <Text style={styles.faqAnswer}>{item.answer}</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* Contact - aligned with AfriToken User FAQ.md */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact support</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              For account issues, disputes, or questions about tokens and agents:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="mail-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>Email: support@afritoken.com</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="time-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>General: within 24 hours. Urgent: 1–4 hours.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="information-circle-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>
                  Have ready: your email, transaction ID (if any), screenshot, device & OS.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={openEmail}>
              <Ionicons name="mail" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Email support</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety tips - from AfriToken User FAQ Safety Tips Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety tips</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Do</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>Verify recipient and amount before sending.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>
                  Confirm receipt only after cash is in your account.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>Keep password secure; enable 2FA.</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, { marginTop: 12 }]}>Don't</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.bulletText}>Share your password. Support never asks for it.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                <Text style={styles.bulletText}>Fall for double-your-tokens or verify-by-sending scams.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  bulletList: {
    marginTop: 12,
    gap: 8,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  faqQuestionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  faqAnswer: {
    marginTop: 12,
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#00B14F",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: 24,
  },
});
