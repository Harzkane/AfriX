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
import { useAuthStore } from "@/stores";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { getCountryByCode, stripLeadingZero } from "@/constants/countries";

const normalizeLocalPhoneInput = (value: string) =>
  stripLeadingZero(value).replace(/\D/g, "").slice(0, 15);

const formatPhoneForDisplay = (value: string) => {
  const digits = normalizeLocalPhoneInput(value);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;

  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
};

export default function EditProfile() {
  const router = useRouter();
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
    green: "#00B14F",
  };

  const countryCode = (user as any)?.country_code || (user as any)?.country || "";
  const countryInfo = countryCode ? getCountryByCode(countryCode) : null;

  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; whatsapp?: string }>({});

  const handleGoBack = () => {
    if (fromAgentProfile) {
      router.push("/agent/(tabs)/profile");
    } else {
      router.back();
    }
  };

  useEffect(() => {
    if (user) {
      const phone = (user.phone_number || "").trim();
      const whatsapp = ((user as any).whatsapp_number || user.phone_number || "").trim();
      setPhoneNumber(formatPhoneForDisplay(phone));
      setWhatsappNumber(formatPhoneForDisplay(whatsapp));
    }
  }, [user]);

  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, "");
    return digitsOnly.length >= 8 && digitsOnly.length <= 15;
  };

  const handleSave = async () => {
    const newErrors: { phone?: string; whatsapp?: string } = {};

    if (!phoneNumber.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(phoneNumber)) {
      newErrors.phone = "Invalid phone number format";
    }

    if (whatsappNumber && !validatePhone(whatsappNumber)) {
      newErrors.whatsapp = "Invalid WhatsApp number format";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const phone = normalizeLocalPhoneInput(phoneNumber.trim());
      const whatsapp = normalizeLocalPhoneInput(whatsappNumber.trim()) || phone;

      await updateProfile({
        phone_number: phone,
        whatsapp_number: whatsapp,
      });

      Alert.alert(
        "Success",
        "Profile updated successfully",
        [{ text: "OK", onPress: () => handleGoBack() }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    }
  };

  const isFormValid = phoneNumber.trim().length > 0 && Object.keys(errors).length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Flat Header */}
      <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleGoBack} style={[styles.backButton, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="arrow-back" size={20} color={theme.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
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
            <Text style={[styles.summaryEyebrow, { color: theme.accent }]}>Agent Contact Profile</Text>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Update Your Contact Details</Text>
            <Text style={[styles.summaryText, { color: theme.muted }]}>
              Keep your phone and WhatsApp details current so users can reach you quickly during exchange flows.
            </Text>
          </LinearGradient>

          {countryInfo ? (
            <View style={[styles.countryRow, { backgroundColor: theme.cardAlt, borderColor: theme.border }]}>
              <Ionicons name="globe-outline" size={20} color={theme.accent} style={styles.countryIcon} />
              <Text style={[styles.countryLabel, { color: theme.muted }]}>Country</Text>
              <Text style={[styles.countryValue, { color: theme.text }]}>
                {countryInfo.name} ({countryInfo.dialCode})
              </Text>
            </View>
          ) : null}

          {/* Group 1: Contact Details Card */}
          <Text style={[styles.sectionLabel, { color: theme.muted }]}>CONTACT NUMBERS</Text>
          <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Phone Number *</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: errors.phone ? "#EF4444" : theme.border }]}>
                <Ionicons name="call-outline" size={20} color={theme.muted} style={styles.inputIcon} />
                {countryInfo ? (
                  <Text style={[styles.dialCodePrefix, { color: theme.muted, borderRightColor: theme.border }]}>{countryInfo.dialCode}</Text>
                ) : null}
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(formatPhoneForDisplay(text));
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="8012345678"
                  placeholderTextColor={theme.muted}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

            {/* WhatsApp Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>WhatsApp Number</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.inputBg, borderColor: errors.whatsapp ? "#EF4444" : theme.border }]}>
                <Ionicons name="logo-whatsapp" size={20} color={theme.green} style={styles.inputIcon} />
                {countryInfo ? (
                  <Text style={[styles.dialCodePrefix, { color: theme.muted, borderRightColor: theme.border }]}>{countryInfo.dialCode}</Text>
                ) : null}
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={whatsappNumber}
                  onChangeText={(text) => {
                    setWhatsappNumber(formatPhoneForDisplay(text));
                    if (errors.whatsapp) setErrors({ ...errors, whatsapp: undefined });
                  }}
                  placeholder="8012345678"
                  placeholderTextColor={theme.muted}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>
              {errors.whatsapp && <Text style={styles.errorText}>{errors.whatsapp}</Text>}
              <Text style={[styles.helperText, { color: theme.muted }]}>
                If empty, phone number will be used for chat routes.
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.accentLight, borderColor: theme.border }]}>
            <Ionicons name="information-circle" size={20} color={theme.accent} style={{ marginRight: 4 }} />
            <Text style={[styles.infoText, { color: theme.accent }]}>
              These contact details will be visible to users when they select you as their agent.
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
              {loading ? "Saving..." : "Save Changes"}
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
  dialCodePrefix: {
    fontSize: 15,
    fontWeight: "700",
    paddingRight: 10,
    marginRight: 8,
    borderRightWidth: 1.5,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
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
  infoBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 18,
    gap: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  infoText: {
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
