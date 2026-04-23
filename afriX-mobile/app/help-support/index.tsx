import React, { useState, useRef } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const FAQ_ITEMS = [
  {
    id: "what-is-afritoken",
    question: "What is AfriToken?",
    answer:
      "AfriToken is a peer-to-peer platform for exchanging digital tokens (NT and CT). Buy tokens from agents with Naira or XOF, send tokens to friends instantly, swap between token types, and sell tokens back to agents for cash.",
  },
  {
    id: "what-are-nt-ct",
    question: "What are NT and CT tokens?",
    answer:
      "NT (Naira Token) has a reference rate of 1 NT ≈ 1 Naira. CT (CFA Token) has 1 CT ≈ 1 XOF. They are blockchain-based digital assets rather than government-issued currency.",
  },
  {
    id: "how-buy",
    question: "How do I buy tokens from an agent?",
    answer:
      "Tap Buy Tokens, choose token type and amount, pick an agent, send payment to the agent's bank or mobile money, then upload proof in the app. The agent confirms and mints tokens to your wallet.",
  },
  {
    id: "escrow",
    question: "What is escrow protection?",
    answer:
      "When you sell, your tokens are locked in a smart contract. The agent cannot access them until you confirm you received cash. If the agent doesn't pay, you can dispute and your tokens are refunded.",
  },
];

const SUPPORT_PHONE_NUMBERS = [
  { id: "ng", label: "Nigeria", value: "+234 810 706 0160" },
  { id: "sn", label: "Senegal", value: "+221 781 332 487" },
  { id: "bf", label: "Burkina Faso", value: "+226 70 21 09 88" },
  { id: "ml", label: "Mali", value: "+223 78 80 83 63" },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const faqSectionY = useRef(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openEmail = async () => {
    const supportEmail = "codewithharz@gmail.com";
    const subject = "Help & Support";
    const emailUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`;
    const webFallbackUrl =
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(supportEmail)}&su=${encodeURIComponent(subject)}`;

    try {
      await Linking.openURL(emailUrl);
    } catch {
      try {
        await Linking.openURL(webFallbackUrl);
      } catch {
        Alert.alert(
          "Email Unavailable",
          "We couldn't open your email app or web mail composer on this device."
        );
      }
    }
  };

  const scrollToFaq = () => {
    scrollRef.current?.scrollTo({ y: faqSectionY.current, animated: true });
  };

  const openPhoneSupport = async (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber.replace(/\s+/g, "")}`;

    try {
      await Linking.openURL(phoneUrl);
    } catch {
      Alert.alert(
        "Call Unavailable",
        "We couldn't open the phone dialer on this device."
      );
    }
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
              onPress={() => router.replace("/(tabs)/profile")}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#F7FFF9", "#FFFFFF"]}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryEyebrow}>Support Center</Text>
          <Text style={styles.summaryTitle}>Find answers and get help quickly</Text>
          <Text style={styles.summaryText}>
            Browse common questions, review safety guidance, and contact support when you need help with transactions, disputes, or account issues.
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.quickRow} onPress={scrollToFaq} activeOpacity={0.75}>
              <View style={[styles.quickIconBox, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="help-circle-outline" size={22} color="#059669" />
              </View>
              <Text style={styles.quickLabel}>Frequently asked questions</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickRow} onPress={openEmail} activeOpacity={0.75}>
              <View style={[styles.quickIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Ionicons name="mail-outline" size={22} color="#2563EB" />
              </View>
              <Text style={styles.quickLabel}>Email support</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickRow}
              onPress={() => router.push("/help-support/faq")}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIconBox, { backgroundColor: "#F3E8FF" }]}>
                <Ionicons name="book-outline" size={22} color="#7C3AED" />
              </View>
              <Text style={styles.quickLabel}>Browse full FAQ</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickRow, styles.quickRowLast]}
              onPress={() => router.push("/(tabs)/activity")}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="document-text-outline" size={22} color="#D97706" />
              </View>
              <Text style={styles.quickLabel}>My requests & disputes</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={styles.section}
          onLayout={(event) => {
            faqSectionY.current = event.nativeEvent.layout.y - 20;
          }}
        >
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {FAQ_ITEMS.map((item) => {
              const isOpen = expandedId === item.id;
              return (
                <View key={item.id} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setExpandedId(isOpen ? null : item.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                  {isOpen ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              For account issues, disputes, or questions about tokens and agents, our team is here to help.
            </Text>

            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="mail-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>Email: codewithharz@gmail.com</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="time-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>General: within 24 hours. Urgent: 1–4 hours.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="information-circle-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>
                  Have your email, transaction ID, screenshots, and device details ready.
                </Text>
              </View>
            </View>

            <View style={styles.supportPhoneList}>
              {SUPPORT_PHONE_NUMBERS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.supportPhoneRow}
                  onPress={() => openPhoneSupport(item.value)}
                  activeOpacity={0.8}
                >
                  <View style={styles.supportPhoneIcon}>
                    <Ionicons name="call-outline" size={18} color="#00B14F" />
                  </View>
                  <View style={styles.supportPhoneTextWrap}>
                    <Text style={styles.supportPhoneLabel}>{item.label}</Text>
                    <Text style={styles.supportPhoneValue}>{item.value}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={openEmail} activeOpacity={0.85}>
              <Ionicons name="mail" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Email support</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Do</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>Verify recipient and amount before sending.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>Confirm receipt only after cash is in your account.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>Keep your password secure and enable 2FA.</Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, styles.cardTitleSpacing]}>Don&apos;t</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerWrapper: {
    zIndex: 10,
    elevation: 8,
    backgroundColor: "#00B14F",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 32,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: -22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E6F4EA",
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00B14F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 6,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
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
    gap: 10,
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
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardTitleSpacing: {
    marginTop: 12,
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  quickRowLast: {
    borderBottomWidth: 0,
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
    fontWeight: "600",
    color: "#111827",
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
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
    fontWeight: "700",
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
    borderRadius: 14,
    backgroundColor: "#00B14F",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  supportPhoneList: {
    marginTop: 16,
    gap: 10,
  },
  supportPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  supportPhoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
  },
  supportPhoneTextWrap: {
    flex: 1,
    gap: 2,
  },
  supportPhoneLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  supportPhoneValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  bottomSpacer: {
    height: 24,
  },
});
