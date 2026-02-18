import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AgentLearnMoreModal() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Becoming an Agent</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Intro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is an AfriToken Agent?</Text>
          <Text style={styles.bodyText}>
            Agents are independent partners who help users exchange tokens (NT/CT) for local
            currency. You&apos;re not a bank or employee – you run your own small exchange
            business using the AfriToken platform.
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Ionicons name="swap-horizontal" size={18} color="#00B14F" />
              <Text style={styles.bulletText}>Mint tokens when users buy with cash.</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="cash-outline" size={18} color="#00B14F" />
              <Text style={styles.bulletText}>Burn tokens when users sell for cash.</Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#00B14F" />
              <Text style={styles.bulletText}>Earn fees while the system protects users via escrow.</Text>
            </View>
          </View>
        </View>

        {/* How the system works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How the System Works</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security Deposit & Capacity</Text>
            <Text style={styles.bodyText}>
              You deposit USDT as a security bond. Your minting capacity is equal to your deposit
              in USDT. When you mint tokens, capacity goes down; when you burn tokens, capacity
              goes back up.
            </Text>
            <Text style={styles.exampleText}>
              Example: Deposit 1,000 USDT → you can mint/burn up to 1,000 USDT worth of tokens
              across users.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Escrow Protection</Text>
            <Text style={styles.bodyText}>
              For sells (burn), user tokens are locked in escrow until you send fiat and the
              system confirms. If there is a dispute and you don&apos;t deliver, your deposit can
              be slashed and the user refunded.
            </Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps to Become an Agent</Text>
          <View style={styles.stepsList}>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: "#ECFDF5" }]}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Quick Registration</Text>
                <Text style={styles.stepDescription}>
                  Choose your country, confirm your currency, and add a Polygon USDT withdrawal
                  address.
                </Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: "#EFF6FF" }]}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>KYC Verification</Text>
                <Text style={styles.stepDescription}>
                  Upload ID, selfie, and proof of address so the team can verify your identity.
                </Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: "#FEF3C7" }]}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Admin Approval</Text>
                <Text style={styles.stepDescription}>
                  Your documents are reviewed. Once approved, you can deposit USDT to activate.
                </Text>
              </View>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: "#F0FDF4" }]}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>Deposit USDT & Start Earning</Text>
                <Text style={styles.stepDescription}>
                  Deposit at least the minimum USDT, get capacity, and start handling buy/sell
                  requests from users.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              You receive and send fiat directly to users using local rails:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="card-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>Nigeria (NT): bank transfers.</Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="phone-portrait-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>
                  XOF countries (CT): bank or mobile money (Orange Money, Wave, Moov, etc.).
                </Text>
              </View>
            </View>
            <Text style={styles.bodyText}>
              Users see your bank or mobile money details when they choose you as their agent.
            </Text>
          </View>
        </View>

        {/* Responsibilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Responsibilities</Text>
          <View style={styles.card}>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>
                  Verify every payment in your own bank/mobile money app before confirming.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="time-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>
                  Respond quickly (target under 15 minutes) to keep high ratings and more
                  business.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Ionicons name="alert-circle-outline" size={18} color="#00B14F" />
                <Text style={styles.bulletText}>
                  Follow dispute rules – if you don&apos;t deliver, your deposit can be slashed.
                </Text>
              </View>
            </View>
            <Text style={styles.bodyText}>
              For full details, you&apos;ll see the Agent Handbook inside your agent dashboard
              after approval.
            </Text>
          </View>
        </View>
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
  exampleText: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  stepsList: {
    gap: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
});

