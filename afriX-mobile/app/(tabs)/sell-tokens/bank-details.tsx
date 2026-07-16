import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Animated,
} from "react-native";
import { Text } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { isXOFToken } from "@/constants/payment";
import { XOF_MOBILE_MONEY_PROVIDERS } from "@/constants/payment";
import { useTranslation } from "react-i18next";

type PaymentMethod = "bank" | "mobile_money";

export default function BankDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?: string;
    tokenType?: string;
    agentId?: string;
    agentName?: string;
  }>();
  const { t } = useTranslation();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleHeaderLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (height > headerMaxHeight) setHeaderMaxHeight(height);
  };

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

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
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FFFBEB",
    warningBorder: isDark ? "rgba(245,158,11,0.3)" : "#FEF3C7",
    placeholder: isDark ? "#475569" : "#9CA3AF",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.3)" : "#BFDBFE",
  };

  const tokenType = params.tokenType || "NT";
  const showPaymentChoice = isXOFToken(tokenType);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [mobileProvider, setMobileProvider] = useState<string>(XOF_MOBILE_MONEY_PROVIDERS[0]);
  const [mobileNumber, setMobileNumber] = useState("");

  const handleContinue = () => {
    if (paymentMethod === "bank") {
      if (!bankName || !accountNumber || !accountName) return;
      router.push({
        pathname: "/(tabs)/sell-tokens/confirm",
        params: {
          ...params,
          paymentType: "bank",
          bankName,
          accountNumber,
          accountName,
        },
      });
    } else {
      if (!mobileNumber.trim() || !accountName.trim()) return;
      router.push({
        pathname: "/(tabs)/sell-tokens/confirm",
        params: {
          ...params,
          paymentType: "mobile_money",
          mobileProvider,
          mobileNumber: mobileNumber.trim(),
          accountName,
        },
      });
    }
  };

  const isFormValid =
    paymentMethod === "bank"
      ? !!(bankName && accountNumber && accountName)
      : !!(mobileNumber.trim() && accountName.trim());

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Collapsible Header */}
        <Animated.View
          onLayout={handleHeaderLayout}
          style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
        >
          <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={22} color={theme.text} />
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {showPaymentChoice ? t("sell_tokens.receive_payment", "Receive Payment") : t("sell_tokens.recipient_bank", "Recipient Bank")}
                </Text>
                <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                  <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                    {t("sell_tokens.bank_subtitle", "Provide details where agent will send cash.")}
                  </Text>
                </Animated.View>
              </View>
              <View style={{ width: 42 }} />
            </View>
          </SafeAreaView>
        </Animated.View>

        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingTop: headerMaxHeight + 16 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          scrollEventThrottle={16}
        >
          {/* Ambient glow */}
          <LinearGradient
            colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
            style={styles.glow}
            pointerEvents="none"
          />

          <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.introEyebrow, { color: theme.accent }]}>{t("sell_tokens.receive_details_label", "RECEIVE DETAILS")}</Text>
            <Text style={[styles.introTitle, { color: theme.text }]}>{t("sell_tokens.where_send_funds", "Where should we send funds?")}</Text>
            <Text style={[styles.introSubtitle, { color: theme.muted }]}>
              {showPaymentChoice
                ? t("sell_tokens.intro_desc_xof", "Choose how you want to receive payment. In XOF countries most agents use mobile money (Orange Money, Wave, MTN) or bank transfer.")
                : t("sell_tokens.intro_desc_other", "Provide the bank account details where your chosen agent will transfer the local currency.")}
            </Text>
          </View>

          {/* Segmented Payment Choice (XOF only) */}
          {showPaymentChoice && (
            <View style={styles.methodRow}>
              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  paymentMethod === "bank" && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                ]}
                onPress={() => setPaymentMethod("bank")}
                activeOpacity={0.8}
              >
                <Ionicons name="business-outline" size={20} color={paymentMethod === "bank" ? theme.accent : theme.muted} />
                <Text style={[styles.methodBtnText, { color: paymentMethod === "bank" ? theme.accent : theme.muted }]}>
                  {t("sell_tokens.method_bank", "Bank")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodBtn,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  paymentMethod === "mobile_money" && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                ]}
                onPress={() => setPaymentMethod("mobile_money")}
                activeOpacity={0.8}
              >
                <Ionicons name="phone-portrait-outline" size={20} color={paymentMethod === "mobile_money" ? theme.accent : theme.muted} />
                <Text style={[styles.methodBtnText, { color: paymentMethod === "mobile_money" ? theme.accent : theme.muted }]}>
                  {t("agents.mobile_money_header", "Mobile Money")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FORM FIELDS CARD */}
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {paymentMethod === "bank" ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>{t("agents.bank_name_label", "Bank Name")}</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Ionicons name="business-outline" size={20} color={theme.placeholder} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="e.g. GTBank, Zenith, Kuda"
                      placeholderTextColor={theme.placeholder}
                      value={bankName}
                      onChangeText={setBankName}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>{t("agents.account_number_label", "Account Number")}</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Ionicons name="card-outline" size={20} color={theme.placeholder} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="0123456789"
                      placeholderTextColor={theme.placeholder}
                      keyboardType="numeric"
                      maxLength={15}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>{t("sell_tokens.account_holder_name", "Account Holder Name")}</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Ionicons name="person-outline" size={20} color={theme.placeholder} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder={t("sell_tokens.fullname_on_account", "Full name as on account")}
                      placeholderTextColor={theme.placeholder}
                      value={accountName}
                      onChangeText={setAccountName}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>{t("sell_tokens.momo_provider", "Mobile Money Provider")}</Text>
                  <View style={styles.pickerRow}>
                    {XOF_MOBILE_MONEY_PROVIDERS.map((p) => {
                      const isActive = mobileProvider === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.chip,
                            { backgroundColor: theme.inputBg, borderColor: theme.border },
                            isActive && { backgroundColor: theme.accentSoft, borderColor: theme.accent },
                          ]}
                          onPress={() => setMobileProvider(p)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, { color: isActive ? theme.accent : theme.muted }]}>
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>{t("agents.phone_number_label", "Phone Number")}</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Ionicons name="call-outline" size={20} color={theme.placeholder} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="e.g. 77 123 45 67"
                      placeholderTextColor={theme.placeholder}
                      keyboardType="phone-pad"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>{t("sell_tokens.momo_holder_name", "Account / Wallet Holder Name")}</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                    <Ionicons name="person-outline" size={20} color={theme.placeholder} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder={t("sell_tokens.fullname_on_momo", "Full name as on mobile money")}
                      placeholderTextColor={theme.placeholder}
                      value={accountName}
                      onChangeText={setAccountName}
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* WARNING CARD */}
          <View style={[styles.warningBox, { backgroundColor: theme.warningSoft, borderColor: theme.warningBorder }]}>
            <Ionicons name="alert-circle" size={20} color={theme.warning} style={{ marginTop: 1 }} />
            <Text style={[styles.warningText, { color: isDark ? "#FDE68A" : "#92400E" }]}>
              {t("sell_tokens.warning_incorrect_details", "Please double-check these details. Incorrect information will lead to permanently lost funds.")}
            </Text>
          </View>

          {/* CONTINUE BUTTON IN SCROLL VIEW */}
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.accent }, !isFormValid && styles.disabledButton]}
            onPress={handleContinue}
            disabled={!isFormValid}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>{t("sell_tokens.btn_review_confirm", "Review & Confirm")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
  },
  headerSafeArea: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 42, height: 42,
    borderRadius: 21, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, lineHeight: 18, fontWeight: "500" },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 200,
  },
  introCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  introEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  introSubtitle: {
    fontSize: 14,
    lineHeight: 21,
  },
  methodRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  methodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  methodBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
  formCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  formGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
  },
  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  warningBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  continueButton: {
    height: 58,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.45,
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
