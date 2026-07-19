import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useColorScheme,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";

export default function WithdrawalRequest() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const fromAgentProfile = params?.from === "agent-profile";
  const { user } = useAuthStore();
  const {
    dashboardData,
    stats,
    createWithdrawalRequest,
    loading,
    withdrawalRequests,
    fetchWithdrawalRequests,
  } = useAgentStore();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    bg: isDark ? "#090B14" : "#F5F4FC",
    card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
    cardAlt: isDark ? "rgba(255, 255, 255, 0.05)" : "#F9F8FF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E1638" : "#EDE9FE",
    accent: "#7C3AED",
    accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
    inputBg: isDark ? "rgba(255,255,255,0.05)" : "#F9F8FF",
    amber: "#D97706",
    amberLight: isDark ? "rgba(217, 119, 6, 0.15)" : "rgba(217, 119, 6, 0.08)",
    green: "#00B14F",
    greenLight: isDark ? "rgba(0, 177, 79, 0.12)" : "rgba(0, 177, 79, 0.06)",
    danger: "#EF4444",
  };

  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [error, setError] = useState("");

  const handleGoBack = () => {
    if (fromAgentProfile) {
      router.push("/agent/(tabs)/profile");
    } else {
      router.back();
    }
  };

  useEffect(() => {
    fetchWithdrawalRequests().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const floorToCurrency = (value: number): number => {
    return Math.floor((value + Number.EPSILON) * 100) / 100;
  };

  const formatInput = (value: string): string => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (parts[1]) {
      parts[1] = parts[1].substring(0, 2);
    }
    return parts.join('.');
  };

  const parseInput = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const totalDeposit = dashboardData?.financials?.total_deposit || 0;
  const outstandingTokens = dashboardData?.financials?.outstanding_tokens || 0;

  const baseMaxWithdrawable =
    dashboardData?.financials?.max_withdrawable ??
    (totalDeposit - outstandingTokens);

  const pendingReserved =
    (withdrawalRequests || []).reduce((sum, req) => {
      if (req.status !== "pending") return sum;
      const value = parseFloat(req.amount_usd || "0");
      return sum + (isNaN(value) ? 0 : value);
    }, 0);

  // True when there's already a pending withdrawal — block new submissions
  const hasPendingRequest = (withdrawalRequests || []).some(
    (r) => r.status === "pending"
  );

  const maxWithdrawable = Math.max(0, baseMaxWithdrawable - pendingReserved);
  const safeMaxWithdrawable = floorToCurrency(maxWithdrawable);

  // withdrawal_address lives on the Agent model — not the User model.
  // stats is populated from GET /agents/profile (fetchAgentStats) on every app load.
  // Fallback to user for within-session updates (e.g. just saved in edit-bank-details).
  const withdrawalAddress =
    stats?.withdrawal_address ||
    (user as any)?.withdrawal_address ||
    "Not set";

  const copyAddress = () => {
    if (withdrawalAddress && withdrawalAddress !== "Not set") {
      Clipboard.setString(withdrawalAddress);
      Alert.alert(
        t("agent.modals.withdrawal_request.copied_title", "Copied!"),
        t("agent.modals.withdrawal_request.copied_desc", "Withdrawal address copied to clipboard")
      );
    }
  };

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(parseInput(value));

    if (isNaN(numValue) || numValue <= 0) {
      setError(t("agent.modals.withdrawal_request.err_amount_invalid", "Please enter a valid amount"));
      return false;
    }

    if (numValue < 10) {
      setError(t("agent.modals.withdrawal_request.err_amount_min", "Minimum withdrawal is $10 USDT"));
      return false;
    }

    if (numValue > safeMaxWithdrawable) {
      setError(t("agent.modals.withdrawal_request.err_amount_exceed", "Cannot exceed Max Withdrawable (${{max}})", { max: formatCurrency(safeMaxWithdrawable) }));
      return false;
    }

    setError("");
    return true;
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatInput(text);
    setDisplayAmount(formatted);
    const parsed = parseInput(formatted);
    setAmount(parsed);
    if (parsed) {
      validateAmount(formatted);
    } else {
      setError("");
    }
  };

  const handleQuickSelect = (percentage: number) => {
    const calculatedAmount = floorToCurrency(safeMaxWithdrawable * (percentage / 100));
    const formatted = formatInput(calculatedAmount.toString());
    setDisplayAmount(formatted);
    setAmount(calculatedAmount.toString());
    setError("");
  };

  const isSelected = (percentage: number) => {
    if (!amount) return false;
    const target = floorToCurrency(safeMaxWithdrawable * (percentage / 100));
    const currentNum = parseFloat(amount);
    return Math.abs(currentNum - target) < 0.01;
  };

  const handleSubmit = () => {
    if (hasPendingRequest) {
      Alert.alert(
        t("agent.modals.withdrawal_request.err_pending_title", "Pending Request Exists"),
        t("agent.modals.withdrawal_request.err_pending_desc", "You already have a pending withdrawal request. Please wait for it to be processed before submitting a new one.")
      );
      return;
    }

    if (!validateAmount(displayAmount)) {
      return;
    }

    if (withdrawalAddress === "Not set") {
      Alert.alert(
        t("agent.modals.withdrawal_request.err_title", "Error"),
        t("agent.modals.withdrawal_request.err_no_address", "Please set your withdrawal address in Bank Settings before requesting withdrawal")
      );
      return;
    }

    Alert.alert(
      t("agent.modals.withdrawal_request.confirm_title", "Confirm Withdrawal"),
      t("agent.modals.withdrawal_request.confirm_desc", "Are you sure you want to withdraw ${{amount}} USDT to your registered address:\n\n{{address}}", {
        amount: formatCurrency(parseFloat(amount)),
        address: withdrawalAddress
      }),
      [
        { text: t("agent.modals.withdrawal_request.btn_cancel", "Cancel"), style: "cancel" },
        {
          text: t("agent.modals.withdrawal_request.btn_confirm", "Confirm"),
          onPress: async () => {
            try {
              const result = await createWithdrawalRequest(parseFloat(amount));
              const fromParam = fromAgentProfile ? "agent-profile" : "";
              router.replace({
                pathname: "/modals/agent/withdrawal-success",
                params: {
                  amount: amount,
                  requestId: result.request.id,
                  ...(fromParam ? { from: fromParam } : {}),
                },
              });
            } catch (err: any) {
              Alert.alert(
                t("agent.modals.withdrawal_request.err_title", "Error"),
                err.message || t("agent.modals.withdrawal_request.err_failed", "Failed to submit withdrawal request")
              );
            }
          }
        }
      ]
    );
  };

  const isFormValid = amount.trim().length > 0 && !error && !loading && !hasPendingRequest;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Flat Header */}
      <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleGoBack} style={[styles.backButton, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="arrow-back" size={20} color={theme.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("agent.modals.withdrawal_request.header_title", "Request Withdrawal")}
          </Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Purple Gradient Summary header card */}
          <LinearGradient
            colors={isDark ? ["rgba(124, 58, 237, 0.15)", "rgba(18, 14, 36, 0.8)"] : ["rgba(124, 58, 237, 0.05)", "#FFFFFF"]}
            style={[styles.introCard, { borderColor: theme.border }]}
          >
            <Text style={[styles.introEyebrow, { color: theme.accent }]}>
              {t("agent.modals.withdrawal_request.summary_eyebrow", "Withdrawal Planning")}
            </Text>
            <Text style={[styles.introTitle, { color: theme.text }]}>
              {t("agent.modals.withdrawal_request.summary_title", "Move Available Funds Safely")}
            </Text>
            <Text style={[styles.introText, { color: theme.muted }]}>
              {t("agent.modals.withdrawal_request.summary_desc", "Review your live withdrawal capacity, choose an amount, and submit a payout request to your saved wallet.")}
            </Text>
          </LinearGradient>

          {/* Pending request warning banner */}
          {hasPendingRequest && (
            <View style={[styles.pendingBanner, { backgroundColor: theme.amberLight, borderColor: theme.amber }]}>
              <Ionicons name="time-outline" size={18} color={theme.amber} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={[styles.pendingBannerTitle, { color: theme.amber }]}>
                  {t("agent.modals.withdrawal_request.banner_pending_title", "Pending Request Active")}
                </Text>
                <Text style={[styles.pendingBannerText, { color: theme.amber }]}>
                  {t("agent.modals.withdrawal_request.banner_pending_desc", "You have a pending withdrawal request. New requests are blocked until it is processed.")}
                </Text>
              </View>
            </View>
          )}

          {/* Financial Summary card */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("agent.modals.withdrawal_request.section_financial", "FINANCIAL SUMMARY")}
          </Text>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryHeader}>
              <Ionicons name="wallet-outline" size={20} color={theme.accent} />
              <Text style={[styles.summaryTitleText, { color: theme.text }]}>
                {t("agent.modals.withdrawal_request.summary_title_text", "Withdrawable Assets")}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                {t("agent.modals.withdrawal_request.label_total_collateral", "Total Collateral Deposit")}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>${formatCurrency(totalDeposit)} USDT</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                {t("agent.modals.withdrawal_request.label_active_escrow", "Active Escrow Tokens")}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>${formatCurrency(outstandingTokens)} USDT</Text>
            </View>

            {pendingReserved > 0 ? (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                    {t("agent.modals.withdrawal_request.label_pending_withdrawals", "Pending Withdrawals")}
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.amber }]}>-${formatCurrency(pendingReserved)} USDT</Text>
                </View>
              </>
            ) : null}

            <View style={[styles.summaryRow, styles.maxWithdrawableRow, { backgroundColor: theme.accentLight }]}>
              <Text style={[styles.maxWithdrawableLabel, { color: theme.accent }]}>
                {t("agent.modals.withdrawal_request.label_net_withdrawable", "Net Max Withdrawable")}
              </Text>
              <Text style={[styles.maxWithdrawableValue, { color: theme.accent }]}>${formatCurrency(safeMaxWithdrawable)} USDT</Text>
            </View>
          </View>

          {/* Card 2: Withdrawal Configuration */}
          <Text style={[styles.sectionLabel, { color: theme.muted, marginTop: 12 }]}>
            {t("agent.modals.withdrawal_request.section_amount", "WITHDRAWAL AMOUNT")}
          </Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>
                {t("agent.modals.withdrawal_request.label_enter_amount", "Enter Amount (USDT) *")}
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: error ? theme.danger : theme.border }]}>
                <Text style={[styles.currencySymbol, { color: theme.text }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={displayAmount}
                  onChangeText={handleAmountChange}
                  placeholder={t("agent.modals.withdrawal_request.placeholder_amount", "0.00")}
                  placeholderTextColor={theme.muted}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
                <Text style={[styles.currencyLabel, { color: theme.muted }]}>USDT</Text>
              </View>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <Text style={[styles.helperText, { color: theme.muted }]}>
                  {t("agent.modals.withdrawal_request.desc_min_withdrawal", "Minimum withdrawal: $10 USDT")}
                </Text>
              )}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

            {/* Quick Select Buttons */}
            <View style={styles.quickSelectGroup}>
              <Text style={[styles.quickSelectLabel, { color: theme.muted }]}>
                {t("agent.modals.withdrawal_request.label_percent_max", "Percent of Max")}
              </Text>
              <View style={styles.quickSelectButtons}>
                {[25, 50, 75, 100].map((percentage) => {
                  const active = isSelected(percentage);
                  return (
                    <TouchableOpacity
                      key={percentage}
                      style={[
                        styles.quickSelectButton,
                        { backgroundColor: active ? theme.accentLight : theme.cardAlt, borderColor: active ? theme.accent : theme.border }
                      ]}
                      onPress={() => handleQuickSelect(percentage)}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickSelectButtonText, { color: active ? theme.accent : theme.muted }]}>{percentage}%</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Card 3: Payout Destination */}
          <Text style={[styles.sectionLabel, { color: theme.muted, marginTop: 12 }]}>
            {t("agent.modals.withdrawal_request.section_payout", "PAYOUT DESTINATION")}
          </Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>
                {t("agent.modals.withdrawal_request.label_registered_wallet", "Registered Wallet Address")}
              </Text>
              <TouchableOpacity
                style={[styles.addressRow, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
                onPress={copyAddress}
                activeOpacity={0.7}
              >
                <Ionicons name="wallet-outline" size={18} color={theme.accent} style={{ marginRight: 2 }} />
                <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="middle">
                  {withdrawalAddress}
                </Text>
                {withdrawalAddress !== "Not set" && (
                  <View style={[styles.copyBtn, { backgroundColor: theme.accentLight }]}>
                    <Ionicons name="copy-outline" size={16} color={theme.accent} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.helperText, { color: theme.muted }]}>
                {t("agent.modals.withdrawal_request.desc_change_address", "To change this address, go to Bank details in account settings.")}
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.accentLight, borderColor: theme.border }]}>
            <Ionicons name="information-circle" size={20} color={theme.accent} style={{ marginRight: 6 }} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.accent }]}>
                {t("agent.modals.withdrawal_request.info_title", "Withdrawal Information")}
              </Text>
              <Text style={[styles.infoText, { color: theme.accent }]}>
                {t("agent.modals.withdrawal_request.info_bullet_1", "• Processing time: 1–3 business days for network confirmation.")}
              </Text>
              <Text style={[styles.infoText, { color: theme.accent }]}>
                {t("agent.modals.withdrawal_request.info_bullet_2", "• Active tokens in smart contracts are locked until escrow settles.")}
              </Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.accent }, (!isFormValid || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {loading ? t("agent.modals.withdrawal_request.btn_processing", "Processing...") : t("agent.modals.withdrawal_request.btn_submit", "Request Withdrawal")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  backButton: {
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
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  introCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
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
  },
  introText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    marginTop: 6,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  summaryTitleText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  divider: {
    height: 1,
  },
  maxWithdrawableRow: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: -18,
    marginTop: 10,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  maxWithdrawableLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  maxWithdrawableValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 2,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 2,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
    fontWeight: "500",
  },
  quickSelectGroup: {
    gap: 8,
  },
  quickSelectLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 2,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  quickSelectButtons: {
    flexDirection: "row",
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickSelectButtonText: {
    fontSize: 13,
    fontWeight: "800",
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
  addressText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "600",
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  pendingBannerTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },
  pendingBannerText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  infoBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 18,
    gap: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
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
    shadowColor: "#7C3AED",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "white",
  },
});
