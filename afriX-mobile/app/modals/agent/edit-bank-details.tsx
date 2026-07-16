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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { isXOFCountry, XOF_MOBILE_MONEY_PROVIDERS } from "@/constants/payment";
import { getCountryByCode } from "@/constants/countries";

export default function EditBankDetails() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const fromAgentProfile = params?.from === "agent-profile";
  const { user } = useAuthStore();
  const { updateProfile, loading } = useAgentStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    bg: isDark ? "#090B14" : "#F5F4FC",
    card: isDark ? "rgba(18, 14, 36, 0.92)" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E1638" : "#EDE9FE",
    accent: "#7C3AED",
    accentLight: isDark ? "rgba(124, 58, 237, 0.15)" : "rgba(124, 58, 237, 0.08)",
    inputBg: isDark ? "rgba(255,255,255,0.05)" : "#F9F8FF",
    cardAlt: isDark ? "rgba(255, 255, 255, 0.05)" : "#F9F8FF",
    amber: "#D97706",
    amberLight: isDark ? "rgba(217, 119, 6, 0.15)" : "rgba(217, 119, 6, 0.08)",
  };

  const countryCode = (user as any)?.country_code || (user as any)?.country || "";
  const countryInfo = countryCode ? getCountryByCode(countryCode) : null;
  const showMobileMoney = countryCode ? isXOFCountry(countryCode) : false;

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [errors, setErrors] = useState<{
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    withdrawalAddress?: string;
  }>({});

  const handleGoBack = () => {
    if (fromAgentProfile) {
      router.push("/agent/(tabs)/profile");
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (user) {
      setBankName((user as any).bank_name || "");
      setAccountNumber((user as any).account_number || "");
      setAccountName((user as any).account_name || "");
      setWithdrawalAddress((user as any).withdrawal_address || "");
      setMobileMoneyProvider((user as any).mobile_money_provider || XOF_MOBILE_MONEY_PROVIDERS[0]);
      setMobileMoneyNumber((user as any).mobile_money_number || "");
    }
  }, [user]);

  const validateAddress = (address: string): boolean => {
    return address.startsWith("0x") && address.length === 42;
  };

  const handleSave = async () => {
    const newErrors: any = {};

    if (!bankName.trim()) {
      newErrors.bankName = t("agent.modals.edit_bank_details.err_bank_required", "Bank name is required");
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = t("agent.modals.edit_bank_details.err_account_num_required", "Account number is required");
    }

    if (!accountName.trim()) {
      newErrors.accountName = t("agent.modals.edit_bank_details.err_account_name_required", "Account name is required");
    }

    if (!withdrawalAddress.trim()) {
      newErrors.withdrawalAddress = t("agent.modals.edit_bank_details.err_address_required", "Withdrawal address is required");
    } else if (!validateAddress(withdrawalAddress)) {
      newErrors.withdrawalAddress = t("agent.modals.edit_bank_details.err_address_invalid", "Invalid address format (must start with 0x)");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const payload: any = {
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        withdrawal_address: withdrawalAddress.trim(),
      };
      if (showMobileMoney) {
        payload.mobile_money_provider = mobileMoneyProvider.trim() || null;
        payload.mobile_money_number = mobileMoneyNumber.trim() || null;
      }
      await updateProfile(payload);

      Alert.alert(
        t("agent.modals.edit_bank_details.success_title", "Success"),
        t("agent.modals.edit_bank_details.success_desc", "Bank details updated successfully"),
        [{ text: t("agent.modals.edit_bank_details.btn_ok", "OK"), onPress: () => handleGoBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        t("agent.modals.edit_bank_details.err_title", "Error"),
        error.message || t("agent.modals.edit_bank_details.err_failed", "Failed to update bank details")
      );
    }
  };

  const isFormValid =
    bankName.trim().length > 0 &&
    accountNumber.trim().length > 0 &&
    accountName.trim().length > 0 &&
    withdrawalAddress.trim().length > 0 &&
    Object.keys(errors).length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Flat Header */}
      <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleGoBack} style={[styles.backButton, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="arrow-back" size={20} color={theme.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("agent.modals.edit_bank_details.header_title", "Update Bank Details")}
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
          {/* Purple themed summary card */}
          <LinearGradient
            colors={isDark ? ["rgba(124, 58, 237, 0.15)", "rgba(18, 14, 36, 0.8)"] : ["rgba(124, 58, 237, 0.05)", "#FFFFFF"]}
            style={[styles.summaryCard, { borderColor: theme.border }]}
          >
            <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>
              {t("agent.modals.edit_bank_details.summary_eyebrow", "Settlement Details")}
            </Text>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>
              {t("agent.modals.edit_bank_details.summary_title", "Update Bank & Payout Details")}
            </Text>
            <Text style={[styles.summaryText, { color: theme.muted }]}>
              {t("agent.modals.edit_bank_details.summary_desc", "Keep your payout details accurate so deposits, withdrawals, and user settlements flow smoothly.")}
            </Text>
          </LinearGradient>

          {countryInfo ? (
            <View style={[styles.countryRow, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Ionicons name="globe-outline" size={20} color={theme.accent} style={styles.countryIcon} />
              <Text style={[styles.countryLabel, { color: theme.muted }]}>
                {t("agent.modals.edit_bank_details.label_country", "Country")}
              </Text>
              <Text style={[styles.countryValue, { color: theme.text }]}>{countryInfo.name}</Text>
            </View>
          ) : null}

          {/* Card 1: Bank Account Details */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>
            {t("agent.modals.edit_bank_details.section_bank_details", "BANK ACCOUNT DETAILS")}
          </Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Bank Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>
                {t("agent.modals.edit_bank_details.label_bank_name", "Bank Name *")}
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: errors.bankName ? "#EF4444" : theme.border }]}>
                <Ionicons name="business-outline" size={20} color={theme.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={bankName}
                  onChangeText={(text) => {
                    setBankName(text);
                    if (errors.bankName) setErrors({ ...errors, bankName: undefined });
                  }}
                  placeholder={t("agent.modals.edit_bank_details.placeholder_bank_name", "Enter bank name")}
                  placeholderTextColor={theme.muted}
                  editable={!loading}
                />
              </View>
              {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

            {/* Account Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>
                {t("agent.modals.edit_bank_details.label_account_num", "Account Number *")}
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: errors.accountNumber ? "#EF4444" : theme.border }]}>
                <Ionicons name="card-outline" size={20} color={theme.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={accountNumber}
                  onChangeText={(text) => {
                    setAccountNumber(text);
                    if (errors.accountNumber) setErrors({ ...errors, accountNumber: undefined });
                  }}
                  placeholder={t("agent.modals.edit_bank_details.placeholder_account_num", "Enter account number")}
                  placeholderTextColor={theme.muted}
                  keyboardType="numeric"
                  editable={!loading}
                />
              </View>
              {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

            {/* Account Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>
                {t("agent.modals.edit_bank_details.label_account_name", "Account Name *")}
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: errors.accountName ? "#EF4444" : theme.border }]}>
                <Ionicons name="person-circle-outline" size={20} color={theme.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={accountName}
                  onChangeText={(text) => {
                    setAccountName(text);
                    if (errors.accountName) setErrors({ ...errors, accountName: undefined });
                  }}
                  placeholder={t("agent.modals.edit_bank_details.placeholder_account_name", "Enter account holder name")}
                  placeholderTextColor={theme.muted}
                  editable={!loading}
                />
              </View>
              {errors.accountName && <Text style={styles.errorText}>{errors.accountName}</Text>}
            </View>
          </View>

          {/* Card 2: Mobile Money Integration */}
          {showMobileMoney && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.muted, marginTop: 16 }]}>
                {t("agent.modals.edit_bank_details.section_momo", "MOBILE MONEY INTEGRATION")}
              </Text>
              <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionHelperText, { color: theme.muted }]}>
                  {t("agent.modals.edit_bank_details.desc_momo", "In XOF countries, mobile money (Orange Money, Wave, Kirène) is highly popular. Provide your details to facilitate easy user settlements.")}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.muted }]}>
                    {t("agent.modals.edit_bank_details.label_select_provider", "Select Provider")}
                  </Text>
                  <View style={styles.pickerRow}>
                    {XOF_MOBILE_MONEY_PROVIDERS.map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.cardAlt, borderColor: theme.border },
                          mobileMoneyProvider === p && [styles.chipActive, { borderColor: theme.accent, backgroundColor: theme.accentLight }]
                        ]}
                        onPress={() => setMobileMoneyProvider(p)}
                      >
                        <Text style={[styles.chipText, { color: theme.muted }, mobileMoneyProvider === p && { color: theme.accent }]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.muted }]}>
                    {t("agent.modals.edit_bank_details.label_momo_num", "Mobile Money Number")}
                  </Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Ionicons name="call-outline" size={20} color={theme.muted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={mobileMoneyNumber}
                      onChangeText={setMobileMoneyNumber}
                      placeholder={t("agent.modals.edit_bank_details.placeholder_momo_num", "e.g. +221 77 123 45 67")}
                      placeholderTextColor={theme.muted}
                      keyboardType="phone-pad"
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Card 3: Payout Destination */}
          <Text style={[styles.sectionLabel, { color: theme.muted, marginTop: 16 }]}>
            {t("agent.modals.edit_bank_details.section_payout", "PAYOUT DESTINATION")}
          </Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>
                {t("agent.modals.edit_bank_details.label_usdt_address", "USDT Withdrawal Address *")}
              </Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: errors.withdrawalAddress ? "#EF4444" : theme.border }]}>
                <Ionicons name="wallet-outline" size={20} color={theme.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.addressInput, { color: theme.text }]}
                  value={withdrawalAddress}
                  onChangeText={(text) => {
                    setWithdrawalAddress(text);
                    if (errors.withdrawalAddress) setErrors({ ...errors, withdrawalAddress: undefined });
                  }}
                  placeholder={t("agent.modals.edit_bank_details.placeholder_address", "0x...")}
                  placeholderTextColor={theme.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {errors.withdrawalAddress && <Text style={styles.errorText}>{errors.withdrawalAddress}</Text>}
              <Text style={[styles.helperText, { color: theme.muted }]}>
                {t("agent.modals.edit_bank_details.desc_usdt_payout", "Only provide Polygon network USDT address for withdrawals.")}
              </Text>
            </View>
          </View>

          {/* Warning Box */}
          <View style={[styles.warningBox, { backgroundColor: theme.amberLight, borderColor: theme.amber + "20" }]}>
            <Ionicons name="warning" size={20} color={theme.amber} style={{ marginRight: 4 }} />
            <Text style={[styles.warningText, { color: theme.amber }]}>
              {t("agent.modals.edit_bank_details.warning_text", "Please verify all details. Incorrect banking or payout address info may cause permanent loss of funds during withdrawal processing.")}
            </Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.accent }, (!isFormValid || loading) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {loading ? t("agent.modals.edit_bank_details.btn_saving", "Saving...") : t("agent.modals.edit_bank_details.btn_save", "Save Changes")}
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
  summaryCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    marginTop: 6,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  countryIcon: {
    marginRight: 10,
  },
  countryLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  countryValue: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "700",
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
  divider: {
    height: 1,
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
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
  },
  addressInput: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 13,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 2,
    marginLeft: 4,
  },
  sectionHelperText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    marginBottom: 12,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
    fontWeight: "500",
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipActive: {
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  warningBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 18,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "white",
  },
});
