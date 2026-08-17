// app/modals/request-tokens/index.tsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  useColorScheme,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useRequestStore, RequestMode, TokenType, RecipientScope, ExpirationDays, PrivacyOption } from "@/stores";

const TOKENS: { type: TokenType; label: string; name: string; icon: string }[] = [
  { type: "NT", label: "NT", name: "Naira Token", icon: "NT" },
  { type: "CT", label: "CT", name: "Credit Token", icon: "CT" },
  { type: "USDT", label: "USDT", name: "Tether USD", icon: "USDT" },
];

const PRESET_AMOUNTS: Record<TokenType, number[]> = {
  NT: [1000, 5000, 10000, 50000],
  CT: [10, 50, 100, 500],
  USDT: [10, 50, 100, 500],
};

export default function CreateRequestScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { draftRequest, setDraftRequest } = useRequestStore();

  const [mode, setMode] = useState<RequestMode>(draftRequest.mode || "p2p");
  const [tokenType, setTokenType] = useState<TokenType>(draftRequest.tokenType || "NT");
  const [amount, setAmount] = useState<string>(draftRequest.amount || "10000");
  const [recipientScope, setRecipientScope] = useState<RecipientScope>(draftRequest.recipientScope || "anyone");
  const [recipientEmail, setRecipientEmail] = useState<string>(draftRequest.recipientEmail || "");
  const [note, setNote] = useState<string>(draftRequest.note || "Rent payment for August");
  const [expirationDays, setExpirationDays] = useState<ExpirationDays>(draftRequest.expirationDays || "7");
  const [privacy, setPrivacy] = useState<PrivacyOption>(draftRequest.privacy || "public");

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardAlt: isDark ? "#111C2B" : "#F8FAFC",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
  };

  const handleNext = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid request amount.");
      return;
    }

    if (recipientScope === "person" && !recipientEmail) {
      Alert.alert("Recipient Required", "Please enter the recipient's email address.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setDraftRequest({
      mode,
      tokenType,
      amount,
      recipientScope,
      recipientEmail,
      note,
      expirationDays,
      privacy,
    });

    router.push("/modals/request-tokens/review" as any);
  };

  const calculateFiatEquivalent = () => {
    const numericAmount = parseFloat(amount) || 0;
    if (tokenType === "NT") return `= ${numericAmount.toLocaleString()} NGN`;
    if (tokenType === "CT") return `= ≈ ${numericAmount.toLocaleString()} XOF`;
    return `= $${numericAmount.toLocaleString()} USD`;
  };

  const getExpirationDatePreview = () => {
    const d = new Date();
    if (expirationDays === "never") return "Does not expire";
    d.setDate(d.getDate() + parseInt(expirationDays, 10));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " • 10:20 AM";
  };

  const { userRequests, fetchUserRequests } = useRequestStore();

  useEffect(() => {
    fetchUserRequests().catch(() => {});
  }, [fetchUserRequests]);

  const pendingCount = userRequests.filter((r) => r.status.toLowerCase() === "pending").length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header Row */}
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
            {t("request_tokens.create.header_title", "Request Tokens")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            {t("request_tokens.create.header_subtitle", "Request tokens from anyone or create merchant payment requests.")}
          </Text>
        </View>

        {/* History Button with Counter Badge */}
        <TouchableOpacity
          onPress={() => router.push("/modals/request-tokens/my-requests" as any)}
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border, position: "relative" }]}
          activeOpacity={0.85}
        >
          <Ionicons name="time-outline" size={20} color={theme.text} />
          {pendingCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{pendingCount > 99 ? "99+" : pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stepper Navigation Bar */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepItemActive}>
          <View style={[styles.stepBadgeActive, { backgroundColor: theme.accent }]}>
            <Text style={styles.stepBadgeTextActive}>1</Text>
          </View>
          <Text style={[styles.stepTextActive, { color: theme.text }]}>
            {t("request_tokens.create.stepper_create", "Create")}
          </Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepBadgeInactive, { borderColor: theme.border }]}>
            <Text style={[styles.stepBadgeTextInactive, { color: theme.muted }]}>2</Text>
          </View>
          <Text style={[styles.stepTextInactive, { color: theme.muted }]}>
            {t("request_tokens.create.stepper_review", "Review")}
          </Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
        <View style={styles.stepItem}>
          <View style={[styles.stepBadgeInactive, { borderColor: theme.border }]}>
            <Text style={[styles.stepBadgeTextInactive, { color: theme.muted }]}>3</Text>
          </View>
          <Text style={[styles.stepTextInactive, { color: theme.muted }]}>
            {t("request_tokens.create.stepper_share", "Share")}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Mode Switcher Tabs */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              { backgroundColor: theme.card, borderColor: theme.border },
              mode === "p2p" && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode("p2p");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={20} color={mode === "p2p" ? theme.accent : theme.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.modeTitle, { color: mode === "p2p" ? theme.accent : theme.text }]}>
                {t("request_tokens.create.mode_p2p_title", "Personal P2P")}
              </Text>
              <Text style={[styles.modeSub, { color: mode === "p2p" ? theme.accent + "CC" : theme.muted }]}>
                {t("request_tokens.create.mode_p2p_sub", "Ask anyone, friends or contacts")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              { backgroundColor: theme.card, borderColor: theme.border },
              mode === "merchant" && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setMode("merchant");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="storefront-outline" size={20} color={mode === "merchant" ? theme.accent : theme.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.modeTitle, { color: mode === "merchant" ? theme.accent : theme.text }]}>
                {t("request_tokens.create.mode_merchant_title", "Merchant Invoice")}
              </Text>
              <Text style={[styles.modeSub, { color: mode === "merchant" ? theme.accent + "CC" : theme.muted }]}>
                {t("request_tokens.create.mode_merchant_sub", "Create payment link for customers")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Step 1: Select token */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.numberBadge, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Text style={[styles.numberBadgeText, { color: theme.text }]}>1</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("request_tokens.create.select_token_label", "Select token")}
            </Text>
          </View>
          <TouchableOpacity style={styles.whatsThisBtn} activeOpacity={0.7}>
            <Text style={[styles.whatsThisText, { color: theme.muted }]}>
              {t("request_tokens.create.whats_this", "What's this?")}
            </Text>
            <Ionicons name="information-circle-outline" size={14} color={theme.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.tokenGrid}>
          {TOKENS.map((token) => {
            const isSelected = tokenType === token.type;
            return (
              <TouchableOpacity
                key={token.type}
                style={[
                  styles.tokenCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  isSelected && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTokenType(token.type);
                }}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.tokenCheckBadge, { backgroundColor: theme.accent }]}>
                    <Ionicons name="checkmark" size={10} color="#FFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.tokenIconCircle,
                    {
                      backgroundColor:
                        token.type === "NT" ? "#0F172A" : token.type === "CT" ? "#1E3A8A" : "#0D9488",
                    },
                  ]}
                >
                  <Text style={styles.tokenIconText}>{token.icon}</Text>
                </View>
                <Text style={[styles.tokenLabel, { color: isSelected ? theme.accent : theme.text }]}>
                  {token.label}
                </Text>
                <Text style={[styles.tokenName, { color: isSelected ? theme.accent + "CC" : theme.muted }]}>
                  {token.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 2: Enter amount */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.numberBadge, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Text style={[styles.numberBadgeText, { color: theme.text }]}>2</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("request_tokens.create.enter_amount_label", "Enter amount")}
            </Text>
          </View>
          <View style={styles.rateIndicatorRow}>
            <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
            <Text style={[styles.rateText, { color: theme.accent }]}>
              {tokenType === "NT" ? "1 NT = 1 NGN" : tokenType === "CT" ? "1 CT = 1 XOF" : "1 USDT = 1 USD"}
            </Text>
          </View>
        </View>

        <View style={[styles.amountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.amountInputRow}>
            <View style={[styles.amountTokenBadge, { backgroundColor: "#0F172A" }]}>
              <Text style={styles.amountTokenBadgeText}>{tokenType}</Text>
            </View>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.muted}
            />
            <TouchableOpacity
              style={[styles.maxBtn, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}
              onPress={() => setAmount("100000")}
              activeOpacity={0.7}
            >
              <Text style={[styles.maxBtnText, { color: theme.text }]}>MAX</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.fiatCalcText, { color: theme.accent }]}>{calculateFiatEquivalent()}</Text>

          {/* Quick Preset Chips */}
          <View style={styles.presetRow}>
            {PRESET_AMOUNTS[tokenType].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetChip,
                  { backgroundColor: theme.cardAlt, borderColor: theme.border },
                  amount === preset.toString() && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAmount(preset.toString());
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: amount === preset.toString() ? theme.accent : theme.text },
                  ]}
                >
                  {preset.toLocaleString()} {tokenType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 3: Request from */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.numberBadge, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Text style={[styles.numberBadgeText, { color: theme.text }]}>3</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("request_tokens.create.request_from_label", "Request from")}
            </Text>
          </View>
          <View style={styles.anyonePill}>
            <Ionicons name="globe-outline" size={14} color={theme.accent} />
            <Text style={[styles.anyonePillText, { color: theme.accent }]}>Anyone</Text>
            <Ionicons name="chevron-down" size={12} color={theme.accent} />
          </View>
        </View>

        <View style={styles.scopeContainer}>
          <TouchableOpacity
            style={[
              styles.scopeTab,
              { backgroundColor: theme.card, borderColor: theme.border },
              recipientScope === "anyone" && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
            ]}
            onPress={() => setRecipientScope("anyone")}
            activeOpacity={0.8}
          >
            <Ionicons name="globe-outline" size={18} color={recipientScope === "anyone" ? theme.accent : theme.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.scopeTitle, { color: recipientScope === "anyone" ? theme.accent : theme.text }]}>
                {t("request_tokens.create.recipient_anyone", "Anyone")}
              </Text>
              <Text style={[styles.scopeSub, { color: recipientScope === "anyone" ? theme.accent + "CC" : theme.muted }]}>
                {t("request_tokens.create.recipient_anyone_sub", "Public request link")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scopeTab,
              { backgroundColor: theme.card, borderColor: theme.border },
              recipientScope === "person" && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
            ]}
            onPress={() => setRecipientScope("person")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={18} color={recipientScope === "person" ? theme.accent : theme.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.scopeTitle, { color: recipientScope === "person" ? theme.accent : theme.text }]}>
                {t("request_tokens.create.recipient_person", "Person / Email")}
              </Text>
              <Text style={[styles.scopeSub, { color: recipientScope === "person" ? theme.accent + "CC" : theme.muted }]}>
                {t("request_tokens.create.recipient_person_sub", "Specific person")}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scopeTab,
              { backgroundColor: theme.card, borderColor: theme.border },
              recipientScope === "contacts" && { borderColor: theme.accent, backgroundColor: theme.accentSoft },
            ]}
            onPress={() => setRecipientScope("contacts")}
            activeOpacity={0.8}
          >
            <Ionicons name="book-outline" size={18} color={recipientScope === "contacts" ? theme.accent : theme.muted} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.scopeTitle, { color: recipientScope === "contacts" ? theme.accent : theme.text }]}>
                {t("request_tokens.create.recipient_contacts", "My Contacts")}
              </Text>
              <Text style={[styles.scopeSub, { color: recipientScope === "contacts" ? theme.accent + "CC" : theme.muted }]}>
                {t("request_tokens.create.recipient_contacts_sub", "Select a contact")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recipient Email Input if Specific Person Selected */}
        {recipientScope === "person" && (
          <View style={[styles.emailInputBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={18} color={theme.accent} />
            <TextInput
              style={[styles.emailInput, { color: theme.text }]}
              placeholder="Enter recipient email address..."
              placeholderTextColor={theme.muted}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        )}

        {/* Scope Notice Banner */}
        <View style={[styles.noticeCard, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.muted} />
          <Text style={[styles.noticeText, { color: theme.muted }]}>
            {t("request_tokens.create.recipient_anyone_notice", "Anyone with the link or QR code will be able to view and pay this request.")}
          </Text>
        </View>

        {/* Step 4: Add note */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.numberBadge, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Text style={[styles.numberBadgeText, { color: theme.text }]}>4</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("request_tokens.create.add_note_label", "Add note (optional)")}
            </Text>
          </View>
        </View>

        <View style={[styles.noteBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            style={[styles.noteInput, { color: theme.text }]}
            placeholder="Rent payment for August"
            placeholderTextColor={theme.muted}
            value={note}
            onChangeText={setNote}
            maxLength={100}
            multiline
          />
          <Text style={[styles.charCounter, { color: theme.muted }]}>{note.length}/100</Text>
        </View>

        {/* Step 5 & 6: Expires & Privacy */}
        <View style={styles.controlRow}>
          {/* Expiration Dropdown Card */}
          <TouchableOpacity
            style={[styles.controlCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              const options: ExpirationDays[] = ["1", "3", "7", "30", "never"];
              const currentIndex = options.indexOf(expirationDays);
              const nextIndex = (currentIndex + 1) % options.length;
              setExpirationDays(options[nextIndex]);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.controlTitleRow}>
              <View style={[styles.numberBadgeSmall, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                <Text style={[styles.numberBadgeTextSmall, { color: theme.text }]}>5</Text>
              </View>
              <Text style={[styles.controlLabel, { color: theme.text }]}>
                {t("request_tokens.create.expires_label", "Expires")}
              </Text>
              <View style={styles.controlDropdownPill}>
                <Text style={[styles.controlDropdownText, { color: theme.accent }]}>
                  {expirationDays === "never" ? "Never" : `${expirationDays} days`}
                </Text>
                <Ionicons name="chevron-down" size={12} color={theme.accent} />
              </View>
            </View>
            <Text style={[styles.controlPreviewText, { color: theme.muted }]}>
              {getExpirationDatePreview()}
            </Text>
          </TouchableOpacity>

          {/* Privacy Dropdown Card */}
          <TouchableOpacity
            style={[styles.controlCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setPrivacy(privacy === "public" ? "private" : "public")}
            activeOpacity={0.8}
          >
            <View style={styles.controlTitleRow}>
              <View style={[styles.numberBadgeSmall, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
                <Text style={[styles.numberBadgeTextSmall, { color: theme.text }]}>6</Text>
              </View>
              <Text style={[styles.controlLabel, { color: theme.text }]}>
                {t("request_tokens.create.privacy_label", "Privacy")}
              </Text>
              <View style={styles.controlDropdownPill}>
                <Text style={[styles.controlDropdownText, { color: theme.accent }]}>
                  {privacy === "public" ? "Public" : "Private"}
                </Text>
                <Ionicons name="chevron-down" size={12} color={theme.accent} />
              </View>
            </View>
            <Text style={[styles.controlPreviewText, { color: theme.muted }]}>
              {privacy === "public" ? "Visible to anyone with link" : "Only intended recipient"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {t("request_tokens.create.btn_review_request", "Review Request")}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>

        {/* Trust Subtext */}
        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark" size={14} color={theme.accent} />
          <Text style={[styles.trustText, { color: theme.muted }]}>
            {t("request_tokens.create.trust_subtext", "Secure. Private. Only you can manage your request.")}
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  headerGraphicBox: { width: 44, height: 44, position: "relative" },
  headerGraphicBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeUsdt: {
    position: "absolute",
    top: -2,
    right: -4,
    backgroundColor: "#0D9488",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#07111A",
  },
  badgeUsdtText: { color: "#FFF", fontSize: 8, fontWeight: "900" },

  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 8,
  },
  stepItemActive: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBadgeActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeTextActive: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  stepTextActive: { fontSize: 13, fontWeight: "800" },

  stepItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBadgeInactive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeTextInactive: { fontSize: 11, fontWeight: "700" },
  stepTextInactive: { fontSize: 13, fontWeight: "600" },
  stepLine: { width: 24, height: 1.5 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  modeContainer: { flexDirection: "row", gap: 10, marginVertical: 14 },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
  },
  modeTitle: { fontSize: 13, fontWeight: "800" },
  modeSub: { fontSize: 10, fontWeight: "500", marginTop: 1 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numberBadgeText: { fontSize: 11, fontWeight: "800" },
  sectionTitle: { fontSize: 14, fontWeight: "800" },

  whatsThisBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  whatsThisText: { fontSize: 11, fontWeight: "600" },

  tokenGrid: { flexDirection: "row", gap: 10, marginBottom: 12 },
  tokenCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    position: "relative",
  },
  tokenCheckBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  tokenIconText: { color: "#FFF", fontSize: 10, fontWeight: "900" },
  tokenLabel: { fontSize: 16, fontWeight: "900", letterSpacing: -0.4 },
  tokenName: { fontSize: 10, fontWeight: "600", marginTop: 1 },

  rateIndicatorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rateText: { fontSize: 11, fontWeight: "800" },

  amountCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  amountInputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  amountTokenBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  amountTokenBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  maxBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  maxBtnText: { fontSize: 11, fontWeight: "800" },
  fiatCalcText: { fontSize: 13, fontWeight: "700" },

  presetRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetChipText: { fontSize: 11, fontWeight: "700" },

  anyonePill: { flexDirection: "row", alignItems: "center", gap: 4 },
  anyonePillText: { fontSize: 12, fontWeight: "800" },

  scopeContainer: { gap: 8, marginBottom: 10 },
  scopeTab: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  scopeTitle: { fontSize: 13, fontWeight: "800" },
  scopeSub: { fontSize: 11, fontWeight: "500" },

  emailInputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 10,
  },
  emailInput: { flex: 1, fontSize: 13, fontWeight: "600" },

  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: "500" },

  noteBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  noteInput: { fontSize: 13, fontWeight: "600", minHeight: 48, textAlignVertical: "top" },
  charCounter: { fontSize: 10, fontWeight: "600", textAlign: "right", marginTop: 4 },

  controlRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  controlCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  controlTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  numberBadgeSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numberBadgeTextSmall: { fontSize: 9, fontWeight: "800" },
  controlLabel: { flex: 1, fontSize: 12, fontWeight: "800" },
  controlDropdownPill: { flexDirection: "row", alignItems: "center", gap: 3 },
  controlDropdownText: { fontSize: 11, fontWeight: "800" },
  controlPreviewText: { fontSize: 10, fontWeight: "500", marginTop: 2 },

  nextBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  nextBtnText: { color: "#FFF", fontSize: 16, fontWeight: "900" },

  trustRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  trustText: { fontSize: 11, fontWeight: "600" },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#00B14F",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },
});
