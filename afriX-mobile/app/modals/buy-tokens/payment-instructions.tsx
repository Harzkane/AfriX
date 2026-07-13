// app/modals/buy-tokens/payment-instructions.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  useColorScheme,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMintRequestStore, useAgentStore, useWalletStore } from "@/stores";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import apiClient from "@/services/apiClient";
import { formatAmountOrCompact } from "@/utils/format";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaymentInstructionsScreen() {
  const { tokenType, amount, agentId } = useLocalSearchParams<{
    tokenType: string;
    amount: string;
    agentId: string;
  }>();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { selectedAgent, selectAgent } = useAgentStore();
  const { createMintRequest, loading } = useMintRequestStore();
  const { exchangeRates } = useWalletStore();
  const [fetchingAgent, setFetchingAgent] = useState(false);

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
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
  };

  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) {
      setHeaderMaxHeight(height);
    }
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

  useEffect(() => {
    const fetchAgentDetails = async () => {
      if (agentId && (!selectedAgent || selectedAgent.id !== agentId)) {
        try {
          setFetchingAgent(true);
          const { data } = await apiClient.get(`/agents/${agentId}`);
          selectAgent(data.data);
        } catch (error) {
          console.error("Failed to fetch agent details:", error);
          Alert.alert("Error", "Failed to load agent details");
        } finally {
          setFetchingAgent(false);
        }
      }
    };

    fetchAgentDetails();
  }, [agentId, selectedAgent]);

  const handleCopyText = async (text: string, label: string) => {
    if (text) {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied!", `${label} copied to clipboard`);
    }
  };

  const handleProceed = async () => {
    try {
      const request = await createMintRequest(
        agentId,
        parseFloat(amount),
        tokenType
      );

      router.push({
        pathname: "/modals/buy-tokens/upload-proof",
        params: { requestId: request.id },
      });
    } catch (error: any) {
      const errorMessage = error.message || "";
      if (errorMessage.includes("cannot create mint requests to themselves")) {
        Alert.alert(
          "⚠️ Cannot Select Yourself",
          "As an agent, you cannot buy tokens from yourself. Please select a different agent to complete this transaction.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Error", "Failed to create request. Please try again.");
      }
    }
  };

  const timelineSteps = [
    { num: "1", label: "Transfer Funds", desc: "Send local currency to the agent's account details below." },
    { num: "2", label: "Take Screenshot", desc: "Capture transaction receipt as official payment proof." },
    { num: "3", label: "Upload Proof", desc: "Confirm transfer and upload image to lock escrow." },
    { num: "4", label: "Confirmation", desc: "Wait for agent release (~5-15 minutes)." },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Collapsible Header */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[
          styles.headerWrapper,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          },
        ]}
      >
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.text }]}>Payment Instructions</Text>
              <Animated.View style={{
                opacity: subtitleOpacity,
                maxHeight: subtitleMaxHeight,
                marginTop: subtitleMargin,
                overflow: "hidden"
              }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  Send payment to the selected agent and keep your payment receipt.
                </Text>
              </Animated.View>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        style={styles.list}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerMaxHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {fetchingAgent ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.muted }]}>Loading agent details...</Text>
          </View>
        ) : !selectedAgent ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.danger }]}>Agent information not available</Text>
          </View>
        ) : (
          <>
            {/* Amount Banner Section */}
            <View style={[styles.amountBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.amountLabel, { color: theme.muted }]}>SEND EXACTLY</Text>
              <Text style={[styles.amountText, { color: theme.accent }]}>
                {tokenType === "NT" ? "₦" : "XOF "}
                {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
              <View style={[styles.tokenTag, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.tokenTagText, { color: theme.accent }]}>To Buy: {amount} {tokenType}</Text>
              </View>
            </View>

            {/* Agent Profile Cards */}
            <View style={[styles.agentHeaderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.agentMetaRow}>
                <View style={[styles.avatarCircle, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="person" size={20} color={theme.accent} />
                </View>
                <View style={styles.agentIdentity}>
                  <Text style={[styles.agentName, { color: theme.text }]}>{selectedAgent.name || "Agent"}</Text>
                  <Text style={[styles.agentTier, { color: theme.muted }]}>
                    {(selectedAgent?.tier || "Bronze").toUpperCase()} TIER
                  </Text>
                </View>
                <View style={[styles.ratingBadge, { backgroundColor: theme.background }]}>
                  <Ionicons name="star" size={13} color="#FFB800" />
                  <Text style={[styles.ratingText, { color: theme.text }]}>{(selectedAgent?.rating ?? 0.0).toFixed(1)}</Text>
                </View>
              </View>
            </View>

            {/* Payment Details Section */}
            <Text style={[styles.sectionHeading, { color: theme.muted }]}>TRANSFER ACCOUNT DETAILS</Text>

            {(selectedAgent as any)?.bank_name && (
              <View style={[styles.paymentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardCol}>
                    <Text style={[styles.cardLabel, { color: theme.muted }]}>BANK NAME</Text>
                    <Text style={[styles.cardVal, { color: theme.text }]}>{(selectedAgent as any).bank_name}</Text>
                  </View>
                </View>
                <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardCol}>
                    <Text style={[styles.cardLabel, { color: theme.muted }]}>ACCOUNT NAME</Text>
                    <Text style={[styles.cardVal, { color: theme.text }]}>{(selectedAgent as any).account_name || "N/A"}</Text>
                  </View>
                </View>
                <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardCol}>
                    <Text style={[styles.cardLabel, { color: theme.muted }]}>ACCOUNT NUMBER</Text>
                    <Text style={[styles.cardVal, { color: theme.text, fontFamily: "monospace" }]}>
                      {(selectedAgent as any).account_number || "N/A"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.copyIconBox, { backgroundColor: theme.accentSoft }]}
                    onPress={() => handleCopyText((selectedAgent as any).account_number, "Account number")}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={16} color={theme.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {(selectedAgent as any)?.mobile_money_provider && (
              <View style={[styles.paymentCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 12 }]}>
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardCol}>
                    <Text style={[styles.cardLabel, { color: theme.muted }]}>MOBILE MONEY PROVIDER</Text>
                    <Text style={[styles.cardVal, { color: theme.text }]}>{(selectedAgent as any).mobile_money_provider}</Text>
                  </View>
                </View>
                <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardCol}>
                    <Text style={[styles.cardLabel, { color: theme.muted }]}>MOBILE NUMBER</Text>
                    <Text style={[styles.cardVal, { color: theme.text, fontFamily: "monospace" }]}>
                      {(selectedAgent as any).mobile_money_number || "N/A"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.copyIconBox, { backgroundColor: theme.accentSoft }]}
                    onPress={() => handleCopyText((selectedAgent as any).mobile_money_number, "Mobile number")}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={16} color={theme.accent} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* How to Pay Timeline */}
            <Text style={[styles.sectionHeading, { color: theme.muted }]}>HOW TO COMPLETE TRANSFER</Text>
            <View style={[styles.timelineContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {timelineSteps.map((step, idx) => (
                <View key={step.num} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: theme.accent }]}>
                      <Text style={styles.timelineDotText}>{step.num}</Text>
                    </View>
                    {idx < timelineSteps.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                    )}
                  </View>
                  <View style={styles.timelineRight}>
                    <Text style={[styles.timelineLabel, { color: theme.text }]}>{step.label}</Text>
                    <Text style={[styles.timelineDesc, { color: theme.muted }]}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Warning Box */}
            <View style={[styles.warningBox, { backgroundColor: theme.warningSoft, borderColor: theme.warning + "30" }]}>
              <Ionicons name="warning-outline" size={20} color={theme.warning} />
              <Text style={[styles.warningText, { color: isDark ? "#FFF" : "#92400E" }]}>
                Only click proceed after making the payment. Submission of fake payment receipts will lead to immediate ban.
              </Text>
            </View>

            {/* Copy contact option */}
            {selectedAgent?.phone_number && (
              <TouchableOpacity
                style={[styles.copyContactBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => handleCopyText(selectedAgent.phone_number, "Agent phone")}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.accent} />
                <Text style={[styles.copyContactText, { color: theme.text }]}>Copy Agent Contact Info</Text>
              </TouchableOpacity>
            )}

            {/* Primary Action Button (inside ScrollView) */}
            <TouchableOpacity
              style={[styles.proceedBtn, { backgroundColor: theme.accent }, loading && styles.proceedBtnDisabled]}
              onPress={handleProceed}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedBtnText}>
                {loading ? "Creating request..." : "I've Made Payment - Upload Proof"}
              </Text>
              {!loading && (
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    borderBottomWidth: 1,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  headerTop: {
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
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  list: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  amountBanner: {
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 24,
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  amountText: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  tokenTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tokenTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  agentHeaderCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  agentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  agentIdentity: {
    flex: 1,
    gap: 2,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "800",
  },
  agentTier: {
    fontSize: 11,
    fontWeight: "700",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  paymentCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
  },
  cardInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  cardCol: {
    gap: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardVal: {
    fontSize: 15,
    fontWeight: "700",
  },
  copyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDivider: {
    height: 1,
  },
  timelineContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 14,
  },
  timelineLeft: {
    alignItems: "center",
    width: 22,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFF",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 16,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  timelineDesc: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  warningBox: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  copyContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  copyContactText: {
    fontSize: 15,
    fontWeight: "700",
  },
  proceedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  proceedBtnDisabled: {
    opacity: 0.65,
  },
  proceedBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: 40,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
