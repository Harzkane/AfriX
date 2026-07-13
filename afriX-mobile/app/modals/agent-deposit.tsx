import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import apiClient from "@/services/apiClient";
import { useAgentStore } from "@/stores/slices/agentSlice";

type DepositFieldErrors = {
  amount?: string;
  txHash?: string;
};

export default function AgentDepositScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { fetchAgentStats, fetchDashboard } = useAgentStore();
  const [txHash, setTxHash] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<DepositFieldErrors>({});
  const [depositAddress, setDepositAddress] = useState("0x7c26C161F7b3b1b975489DA1a1672a9D9178a16e");
  const [minimumDeposit, setMinimumDeposit] = useState(100);
  const [fetching, setFetching] = useState(true);

  const theme = {
    bg: isDark ? "#090B14" : "#F5F4FC",
    card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
    cardAlt: isDark ? "rgba(255, 255, 255, 0.05)" : "#F9F8FF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E1638" : "#EDE9FE",
    accent: "#7C3AED",
    accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
    inputBg: isDark ? "rgba(255, 255, 255, 0.06)" : "#F9F8FF",
    green: "#00B14F",
    greenLight: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)",
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await apiClient.get("/agents/deposit-address");
        if (isMounted && data?.data) {
          if (data.data.address) setDepositAddress(data.data.address);
          if (data.data.minimum_deposit) setMinimumDeposit(data.data.minimum_deposit);
        }
      } catch (error) {
        console.error("Failed to fetch deposit address:", error);
      } finally {
        if (isMounted) setFetching(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const copyAddress = () => {
    Clipboard.setString(depositAddress);
    Alert.alert("Copied!", "Deposit address copied to clipboard");
  };

  const validateAmount = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter deposit amount";
    const n = parseFloat(trimmed);
    if (isNaN(n)) return "Enter a valid deposit amount";
    if (n < minimumDeposit) return `Minimum deposit is $${minimumDeposit} USDT`;
    return "";
  };

  const validateTxHash = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Please enter transaction hash";
    if (!trimmed.startsWith("0x")) return "Transaction hash must start with 0x";
    if (!/^0x[a-fA-F0-9]{64}$/.test(trimmed)) return "Enter a valid 66-character transaction hash";
    return "";
  };

  const sanitizeAmountInput = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, "");
    const parts = sanitized.split(".");
    if (parts.length <= 1) return sanitized;
    return `${parts[0]}.${parts.slice(1).join("")}`;
  };

  const handleAmountChange = (value: string) => {
    const next = sanitizeAmountInput(value);
    setAmount(next);
    setFieldErrors(c => ({ ...c, amount: next ? validateAmount(next) : "" }));
  };

  const handleTxHashChange = (value: string) => {
    const next = value.trim().replace(/\s+/g, "");
    setTxHash(next);
    setFieldErrors(c => ({ ...c, txHash: next ? validateTxHash(next) : "" }));
  };

  const validateForm = () => {
    const errs = { amount: validateAmount(amount), txHash: validateTxHash(txHash) };
    setFieldErrors(errs);
    return !errs.amount && !errs.txHash;
  };

  const isFormValid = amount.trim().length > 0 && txHash.trim().length > 0 && !validateAmount(amount) && !validateTxHash(txHash);

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please correct the highlighted fields");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/agents/deposit", { amount_usd: parseFloat(amount.trim()), tx_hash: txHash.trim() });
      await Promise.all([fetchAgentStats(), fetchDashboard()]);
      Alert.alert("Deposit Verified", "Your deposit has been verified. Your available capacity has been updated.", [
        { text: "OK", onPress: () => router.replace("/agent/dashboard") },
      ]);
    } catch (error: any) {
      const raw = error.response?.data?.message || error.message || "";
      let message = raw || "Deposit could not be verified. Please try again.";
      if (raw.includes("already been used")) message = "This deposit was already applied. Each transaction can only be used once.";
      else if (raw.includes("Transaction not found") || raw.includes("could not confirm")) message = "We could not confirm this transaction yet. Please wait for blockchain confirmation and try again.";
      else if (raw.includes("Transaction failed on blockchain")) message = "This blockchain transaction failed and cannot be used for deposit verification.";
      else if (raw.includes("No USDT transfer")) message = "No USDT transfer to the platform deposit address was found in this transaction.";
      else if (raw.includes("Amount mismatch")) message = "The amount you entered does not match the confirmed blockchain transfer.";
      Alert.alert("Deposit failed", message);
    } finally {
      setLoading(false);
    }
  };

  const progressSteps = ["Register", "KYC", "Deposit"];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Flat sticky header */}
      <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBackBtn, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="arrow-back" size={20} color={theme.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Security Deposit</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Progress Stepper */}
          <View style={[styles.stepperCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {progressSteps.map((step, i) => (
              <React.Fragment key={i}>
                <View style={styles.stepItem}>
                  <LinearGradient
                    colors={i < 2 ? [theme.green, theme.green] : [theme.accent, theme.accent]}
                    style={styles.stepDot}
                  >
                    {i < 2 ? (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    ) : (
                      <Text style={styles.stepNum}>{i + 1}</Text>
                    )}
                  </LinearGradient>
                  <Text style={[styles.stepLabel, { color: theme.text }]}>{step}</Text>
                </View>
                {i < progressSteps.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: theme.green }]} />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Hero Intro */}
          <LinearGradient
            colors={isDark ? ["rgba(124, 58, 237, 0.15)", "rgba(18, 14, 36, 0.8)"] : ["rgba(124, 58, 237, 0.05)", "#FFFFFF"]}
            style={[styles.introCard, { borderColor: theme.border }]}
          >
            <Text style={[styles.introEyebrow, { color: theme.accent }]}>ACCOUNT ACTIVATION</Text>
            <Text style={[styles.introTitle, { color: theme.text }]}>Almost There! 🎉</Text>
            <Text style={[styles.introSubtitle, { color: theme.muted }]}>
              Make your security deposit to activate your agent account and start earning.
            </Text>
          </LinearGradient>

          {/* Deposit Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {[
              { label: "Minimum Deposit", value: `$${minimumDeposit} USDT` },
              { label: "Network", value: "Polygon (MATIC)" },
              { label: "Token", value: "USDT (ERC-20)" },
            ].map((row, i) => (
              <View key={i}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.muted }]}>{row.label}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{row.value}</Text>
                </View>
                {i < 2 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              </View>
            ))}
          </View>

          {/* Warning Banner */}
          <View style={[styles.warningBanner, { backgroundColor: theme.dangerSoft, borderColor: theme.danger + "20" }]}>
            <Ionicons name="warning" size={20} color={theme.danger} style={{ marginRight: 4 }} />
            <Text style={[styles.warningText, { color: theme.danger }]}>
              Only send USDT on Polygon network! Sending the wrong token or wrong network will result in permanent loss of funds.
            </Text>
          </View>

          {/* QR Code Section */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>DEPOSIT ADDRESS</Text>
          <View style={[styles.qrCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.qrBox, { backgroundColor: "#FFFFFF" }]}>
              {fetching ? (
                <ActivityIndicator size="small" color={theme.accent} style={{ height: 180, justifyContent: "center" }} />
              ) : (
                <QRCode value={depositAddress} size={180} />
              )}
            </View>
            <TouchableOpacity style={[styles.addressRow, { backgroundColor: theme.cardAlt, borderColor: theme.border }]} onPress={copyAddress} activeOpacity={0.7}>
              <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="middle">
                {depositAddress}
              </Text>
              <View style={[styles.copyBtn, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="copy-outline" size={18} color={theme.accent} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>CONFIRM YOUR DEPOSIT</Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>AMOUNT (USDT) *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: fieldErrors.amount ? theme.danger : theme.border }]}>
                <Text style={[styles.inputPrefix, { color: theme.text }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={`Minimum ${minimumDeposit}`}
                  placeholderTextColor={theme.muted}
                  value={amount}
                  onChangeText={handleAmountChange}
                  onBlur={() => setFieldErrors(c => ({ ...c, amount: validateAmount(amount) }))}
                  keyboardType="decimal-pad"
                />
              </View>
              {fieldErrors.amount ? (
                <Text style={styles.errorText}>{fieldErrors.amount}</Text>
              ) : (
                <Text style={[styles.helperText, { color: theme.muted }]}>This will define your minting capacity</Text>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

            {/* TX Hash */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.muted }]}>TRANSACTION HASH *</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: fieldErrors.txHash ? theme.danger : theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="0x..."
                  placeholderTextColor={theme.muted}
                  value={txHash}
                  onChangeText={handleTxHashChange}
                  onBlur={() => setFieldErrors(c => ({ ...c, txHash: validateTxHash(txHash) }))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {fieldErrors.txHash ? (
                <Text style={styles.errorText}>{fieldErrors.txHash}</Text>
              ) : (
                <Text style={[styles.helperText, { color: theme.muted }]}>Enter the transaction hash from your wallet</Text>
              )}
            </View>
          </View>

          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: theme.accentLight, borderColor: theme.border }]}>
            <Ionicons name="information-circle" size={20} color={theme.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.infoBannerText, { color: theme.accent }]}>
              Your deposit will be verified on the blockchain. This usually takes 2–5 minutes.
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.accent }, (!isFormValid || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Verify Deposit</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: "600" },
  content: { padding: 16 },
  stepperCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  stepItem: { alignItems: "center", gap: 6 },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  stepLabel: { fontSize: 12, fontWeight: "700" },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 6,
    marginBottom: 20,
  },
  introCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
  },
  introEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  infoCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 13, fontWeight: "600" },
  infoValue: { fontSize: 14, fontWeight: "800" },
  divider: { height: 1 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  warningText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  qrCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
    gap: 14,
  },
  qrBox: {
    padding: 16,
    borderRadius: 16,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    borderWidth: 1.5,
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 10,
  },
  addressText: { flex: 1, fontSize: 13, fontFamily: "monospace", fontWeight: "600" },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  inputPrefix: { fontSize: 16, fontWeight: "700", marginRight: 4 },
  input: { flex: 1, fontSize: 16, fontWeight: "600", paddingVertical: 14 },
  helperText: { fontSize: 12, fontWeight: "500", marginLeft: 4 },
  errorText: { fontSize: 12, fontWeight: "600", color: "#EF4444", marginLeft: 4 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  infoBannerText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
});
