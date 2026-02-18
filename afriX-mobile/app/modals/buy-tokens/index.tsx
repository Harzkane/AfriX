import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useWalletStore } from "@/stores";
import { parseAmountInput, formatAmountForInput, formatAmount } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const PRESET_AMOUNTS = [5000, 10000, 20000, 50000];

export default function BuyTokensScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; tokenType?: string; agentId?: string; agentName?: string }>();
  const { getWalletByType } = useWalletStore();

  const initialTokenType = (params.tokenType === "CT" ? "CT" : "NT") as "NT" | "CT";
  const initialAmount = params.amount ? parseAmountInput(params.amount, initialTokenType) : "";
  const [tokenType, setTokenType] = useState<"NT" | "CT">(initialTokenType);
  const [amount, setAmount] = useState(initialAmount);

  // When opening via "Try again", params bring amount/tokenType — keep form in sync
  useEffect(() => {
    if (params.amount != null && params.amount !== amount) setAmount(parseAmountInput(params.amount, tokenType));
    if (params.tokenType === "CT" && tokenType !== "CT") setTokenType("CT");
    if (params.tokenType === "NT" && tokenType !== "NT") setTokenType("NT");
  }, [params.amount, params.tokenType]);

  // Check if agent is pre-selected from agent profile (or Try again doesn't pass these)
  const preSelectedAgentId = params.agentId as string | undefined;
  const preSelectedAgentName = params.agentName as string | undefined;

  const wallet = getWalletByType(tokenType);

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // If agent is pre-selected, skip agent selection and go to payment instructions
    if (preSelectedAgentId && preSelectedAgentName) {
      router.push({
        pathname: "/modals/buy-tokens/payment-instructions",
        params: {
          tokenType,
          amount,
          agentId: preSelectedAgentId,
          agentName: preSelectedAgentName
        },
      });
    } else {
      // Otherwise, go to agent selection
      router.push({
        pathname: "/modals/buy-tokens/select-agent",
        params: { tokenType, amount },
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardView}
      keyboardVerticalOffset={Platform.OS === "ios" ? -8 : 12}
    >
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={["#00B14F", "#008F40"]}
            style={styles.headerGradient}
          />
          <SafeAreaView edges={["top"]} style={styles.headerContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Buy Tokens</Text>
              <View style={{ width: 24 }} />
            </View>
          </SafeAreaView>
        </View>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Purchase tokens through a verified agent
          </Text>

          {/* Token Type Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Token Type</Text>
            <View style={styles.tokenSelector}>
              <TouchableOpacity
                style={[
                  styles.tokenOption,
                  tokenType === "NT" && styles.tokenOptionActive,
                ]}
                onPress={() => setTokenType("NT")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.tokenIcon,
                    tokenType === "NT" && styles.tokenIconActive,
                  ]}
                >
                  <Ionicons
                    name="cash-outline"
                    size={24}
                    color={tokenType === "NT" ? "#00B14F" : "#9CA3AF"}
                  />
                </View>
                <Text
                  style={[
                    styles.tokenName,
                    tokenType === "NT" && styles.tokenNameActive,
                  ]}
                >
                  Naira Token
                </Text>
                <Text style={styles.tokenSymbol}>NT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tokenOption,
                  tokenType === "CT" && styles.tokenOptionActive,
                ]}
                onPress={() => setTokenType("CT")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.tokenIcon,
                    tokenType === "CT" && styles.tokenIconActive,
                  ]}
                >
                  <Ionicons
                    name="leaf-outline"
                    size={24}
                    color={tokenType === "CT" ? "#10B981" : "#9CA3AF"}
                  />
                </View>
                <Text
                  style={[
                    styles.tokenName,
                    tokenType === "CT" && styles.tokenNameActive,
                  ]}
                >
                  XOF Token
                </Text>
                <Text style={styles.tokenSymbol}>CT</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Balance */}
          {wallet && (
            <View
              style={[
                styles.balanceCard,
                tokenType === "CT" && styles.balanceCardCT,
              ]}
            >
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>
                {parseFloat(wallet.balance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                {tokenType}
              </Text>
              <View style={styles.balanceFooter}>
                <Text style={styles.balanceAvailable}>
                  Available:{" "}
                  {parseFloat(wallet.available_balance).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount to Buy</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                mode="outlined"
                value={formatAmountForInput(amount, tokenType)}
                onChangeText={(t) => setAmount(parseAmountInput(t, tokenType))}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                outlineStyle={styles.inputOutline}
                contentStyle={styles.inputContent}
              />
            </View>

            {/* Preset Amounts */}
            <View style={styles.presets}>
              {PRESET_AMOUNTS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetBtn,
                    amount === preset.toString() && styles.presetBtnActive,
                  ]}
                  onPress={() => setAmount(preset.toString())}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      amount === preset.toString() && styles.presetTextActive,
                    ]}
                  >
                    {preset.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exchange Rate Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#00B14F" />
              <Text style={styles.infoTitle}>Exchange Rate</Text>
            </View>
            <Text style={styles.infoText}>
              1 {tokenType} = {tokenType === "NT" ? "₦1.00" : "XOF 1.00"}
            </Text>
            <Text style={styles.infoSubtext}>
              You&apos;ll pay approximately {tokenType === "NT" ? "₦" : "XOF "}
              {formatAmount(amount || "0", tokenType)} to the agent
            </Text>
          </View>
        </ScrollView>

        {/* Sticky Continue Button - same pattern as Sell Tokens */}
        <SafeAreaView edges={["bottom"]} style={styles.footerWrapper}>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.continueBtn,
                (!amount || parseFloat(amount) <= 0) && styles.continueBtnDisabled,
              ]}
              onPress={handleContinue}
              disabled={!amount || parseFloat(amount) <= 0}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>
                Continue to Agent Selection
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  keyboardView: {
    flex: 1,
  },
  headerWrapper: {
    // marginBottom: 20,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  headerContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
    marginTop: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  tokenSelector: {
    flexDirection: "row",
    gap: 12,
  },
  tokenOption: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#F3F4F6",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  tokenOptionActive: {
    borderColor: "#00B14F",
    backgroundColor: "#F0FDF4",
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tokenIconActive: {
    backgroundColor: "#FFFFFF",
  },
  tokenName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    textAlign: "center",
  },
  tokenNameActive: {
    color: "#111827",
  },
  tokenSymbol: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  balanceCard: {
    backgroundColor: "#F0FDF4",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  balanceCardCT: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  balanceLabel: {
    fontSize: 13,
    color: "#065F46",
    fontWeight: "500",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -1,
  },
  balanceFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D1FAE5",
  },
  balanceAvailable: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    top: 20,
    zIndex: 1,
  },
  input: {
    backgroundColor: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F3F4F6",
  },
  inputContent: {
    paddingLeft: 40,
    color: "#111827",
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  presetBtnActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#00B14F",
  },
  presetText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  presetTextActive: {
    color: "#00B14F",
  },
  infoCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  infoText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#00B14F",
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 13,
    color: "#6B7280",
  },
  footerWrapper: {
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  continueBtn: {
    backgroundColor: "#00B14F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
