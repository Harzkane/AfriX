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
    Modal,
    useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { SUPPORTED_COUNTRIES, Country } from "@/constants/countries";
import apiClient from "@/services/apiClient";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { useTranslation } from "react-i18next";

export default function AgentRegistrationModal() {
    const router = useRouter();
    const { t } = useTranslation();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const theme = {
        background: isDark ? "#07111A" : "#F5F7FB",
        card: isDark ? "#0E1726" : "#FFFFFF",
        cardAlt: isDark ? "#111C2B" : "#F8FAFC",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "#1E2A3A" : "#E2E8F0",
        inputBg: isDark ? "#0D1C2E" : "#FFFFFF",
        accent: "#00B14F",
        accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
        danger: "#EF4444",
    };

    const [loading, setLoading] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [countries, setCountries] = useState<Country[]>(SUPPORTED_COUNTRIES);
    const [country, setCountry] = useState("NG");
    const [currency, setCurrency] = useState("NGN");
    const [withdrawalAddress, setWithdrawalAddress] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const { data } = await apiClient.get("/config/countries");
            if (data.success && data.data.length > 0) {
                setCountries(data.data);
            }
        } catch (error) {
            console.log("Failed to fetch countries, using default list");
        }
    };

    const validateAddress = (address: string): boolean => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    const handleCountryChange = (countryCode: string) => {
        setCountry(countryCode);
        const selected = countries.find((c) => c.code === countryCode);
        if (selected) setCurrency(selected.currency);
        setShowCountryPicker(false);
    };

    const getCountryName = () =>
        countries.find((c) => c.code === country)?.name || t("agent.registration.select_country", "Select Country");

    const handleSubmit = async () => {
        const newErrors: { [key: string]: string } = {};
        if (!withdrawalAddress.trim()) {
            newErrors.withdrawalAddress = t("agent.registration.err_address_required", "Withdrawal address is required");
        } else if (!validateAddress(withdrawalAddress)) {
            newErrors.withdrawalAddress = t("agent.registration.err_address_invalid", "Must be a valid Ethereum address (0x...)");
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await useAgentStore.getState().registerAsAgent({
                country,
                currency,
                withdrawal_address: withdrawalAddress,
            });
            Alert.alert(
                t("agent.registration.success_title", "Registration Successful!"),
                t("agent.registration.success_desc", "Your agent application has been submitted. Please complete KYC verification to continue."),
                [{ text: t("agent.registration.btn_continue_kyc", "Continue to KYC"), onPress: () => router.replace("/modals/agent-kyc") }]
            );
        } catch (error: any) {
            Alert.alert(t("agent.registration.err_failed_title", "Error"), error.message || t("agent.registration.err_failed_fallback", "Failed to register as agent"));
        } finally {
            setLoading(false);
        }
    };

    const progressSteps = [
        { label: t("agent.registration.step_register", "Register"), active: true, done: false },
        { label: t("agent.registration.step_kyc", "KYC"), active: false, done: false },
        { label: t("agent.registration.step_deposit", "Deposit"), active: false, done: false },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.navBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t("agent.registration.header_title", "Agent Registration")}</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Stepper */}
                <View style={[styles.stepperCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {progressSteps.map((step, i) => (
                        <React.Fragment key={i}>
                            <View style={styles.stepItem}>
                                {step.active ? (
                                    <LinearGradient
                                        colors={["#00B14F", "#008F40"]}
                                        style={styles.stepDot}
                                    >
                                        <Text style={styles.stepNum}>{i + 1}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={[styles.stepDot, { backgroundColor: theme.border }]}>
                                        <Text style={[styles.stepNum, { color: theme.muted }]}>{i + 1}</Text>
                                    </View>
                                )}
                                <Text style={[styles.stepLabel, { color: step.active ? theme.accent : theme.muted }]}>
                                    {step.label}
                                </Text>
                            </View>
                            {i < progressSteps.length - 1 && (
                                <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                            )}
                        </React.Fragment>
                    ))}
                </View>

                {/* Hero Intro */}
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroBanner}
                >
                    <View style={styles.heroIconCircle}>
                        <Ionicons name="person-add" size={26} color="#00B14F" />
                    </View>
                    <Text style={styles.heroEyebrow}>{t("agent.registration.hero_eyebrow", "STEP 1 OF 3")}</Text>
                    <Text style={styles.heroTitle}>{t("agent.registration.hero_title", "Basic Information")}</Text>
                    <Text style={styles.heroSubtitle}>
                        {t("agent.registration.hero_subtitle", "Provide your location and the wallet address where you'd like to receive your earnings.")}
                    </Text>
                </LinearGradient>

                {/* Form Card */}
                <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>

                    {/* Country */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.registration.field_country", "COUNTRY *")}</Text>
                        <TouchableOpacity
                            style={[styles.selectField, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                            onPress={() => setShowCountryPicker(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.selectFieldLeft}>
                                <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft }]}>
                                    <Ionicons name="earth" size={16} color={theme.accent} />
                                </View>
                                <Text style={[styles.selectFieldText, { color: theme.text }]}>{getCountryName()}</Text>
                            </View>
                            <Ionicons name="chevron-down" size={18} color={theme.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.fieldDivider, { backgroundColor: theme.border }]} />

                    {/* Currency (auto) */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.registration.field_currency", "CURRENCY")}</Text>
                        <View style={[styles.disabledField, { backgroundColor: isDark ? "#09121D" : "#F1F5F9", borderColor: theme.border }]}>
                            <View style={styles.selectFieldLeft}>
                                <View style={[styles.fieldIconBox, { backgroundColor: theme.border }]}>
                                    <Ionicons name="cash-outline" size={16} color={theme.muted} />
                                </View>
                                <Text style={[styles.disabledFieldText, { color: theme.muted }]}>{currency}</Text>
                            </View>
                            <Ionicons name="lock-closed" size={14} color={theme.muted} />
                        </View>
                        <Text style={[styles.helperText, { color: theme.muted }]}>
                            {t("agent.registration.helper_currency", "Automatically set based on your country")}
                        </Text>
                    </View>

                    <View style={[styles.fieldDivider, { backgroundColor: theme.border }]} />

                    {/* Withdrawal Address */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.registration.field_address", "USDT WITHDRAWAL ADDRESS (POLYGON) *")}</Text>
                        <View style={[
                            styles.inputWrapper,
                            {
                                backgroundColor: theme.inputBg,
                                borderColor: errors.withdrawalAddress ? theme.danger : theme.border
                            }
                        ]}>
                            <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft, marginRight: 10 }]}>
                                <Ionicons name="wallet-outline" size={16} color={theme.accent} />
                            </View>
                            <TextInput
                                style={[styles.textInput, { color: theme.text }]}
                                placeholder="0x..."
                                placeholderTextColor={theme.muted}
                                value={withdrawalAddress}
                                onChangeText={(text) => {
                                    setWithdrawalAddress(text);
                                    if (errors.withdrawalAddress) {
                                        setErrors({ ...errors, withdrawalAddress: "" });
                                    }
                                }}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        {errors.withdrawalAddress ? (
                            <Text style={styles.errorText}>{errors.withdrawalAddress}</Text>
                        ) : (
                            <Text style={[styles.helperText, { color: theme.muted }]}>
                                {t("agent.registration.helper_address", "Your earnings will be sent to this address")}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Warning info */}
                <View style={[styles.infoBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent + "30" }]}>
                    <Ionicons name="information-circle" size={20} color={theme.accent} />
                    <Text style={[styles.infoBannerText, { color: theme.accent }]}>
                        {t("agent.registration.info_warning", "Make sure your withdrawal address is correct. You can update it later in settings.")}
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer CTA */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.accent, opacity: loading ? 0.6 : 1 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.submitBtnText}>{t("agent.registration.btn_submit", "Continue to KYC")}</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Country Picker Bottom Sheet */}
            <Modal
                visible={showCountryPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCountryPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
                        {/* Handle */}
                        <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

                        {/* Modal Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{t("agent.registration.select_country", "Select Country")}</Text>
                            <TouchableOpacity
                                onPress={() => setShowCountryPicker(false)}
                                style={[styles.modalCloseBtn, { backgroundColor: theme.cardAlt }]}
                            >
                                <Ionicons name="close" size={18} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
                            {countries.map((c) => (
                                <TouchableOpacity
                                    key={c.code}
                                    style={[
                                        styles.countryRow,
                                        { borderBottomColor: theme.border },
                                        country === c.code && { backgroundColor: theme.accentSoft },
                                    ]}
                                    onPress={() => handleCountryChange(c.code)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.countryRowText,
                                        { color: country === c.code ? theme.accent : theme.text }
                                    ]}>
                                        {c.name}
                                    </Text>
                                    {country === c.code && (
                                        <Ionicons name="checkmark-circle" size={20} color={theme.accent} />
                                    )}
                                </TouchableOpacity>
                            ))}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    navBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: { fontSize: 18, fontWeight: "800" },
    content: { padding: 16 },

    // Stepper
    stepperCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,
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
        marginBottom: 22,
    },

    // Hero
    heroBanner: {
        borderRadius: 24,
        padding: 22,
        marginBottom: 16,
    },
    heroIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    heroEyebrow: {
        fontSize: 10,
        fontWeight: "800",
        color: "rgba(255,255,255,0.7)",
        letterSpacing: 1,
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: -0.4,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 14,
        fontWeight: "500",
        color: "rgba(255,255,255,0.85)",
        lineHeight: 20,
    },

    // Form
    formCard: {
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 14,
    },
    fieldGroup: {
        paddingVertical: 14,
        gap: 8,
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.8,
    },
    fieldIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    selectField: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingLeft: 10,
        paddingRight: 14,
    },
    selectFieldLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    selectFieldText: {
        fontSize: 15,
        fontWeight: "700",
    },
    disabledField: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingLeft: 10,
        paddingRight: 14,
    },
    disabledFieldText: {
        fontSize: 15,
        fontWeight: "600",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingLeft: 10,
        paddingRight: 14,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        paddingVertical: 4,
    },
    helperText: { fontSize: 12, fontWeight: "500" },
    errorText: { fontSize: 12, fontWeight: "600", color: "#EF4444" },
    fieldDivider: { height: 1 },

    // Info
    infoBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 8,
    },
    infoBannerText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },

    // Footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    submitBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 18,
        gap: 8,
    },
    submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },

    // Country modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        maxHeight: "65%",
    },
    sheetHandle: {
        width: 44,
        height: 4,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 14,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 18, fontWeight: "800" },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    countryList: { paddingHorizontal: 16, paddingTop: 8 },
    countryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderBottomWidth: 1,
    },
    countryRowText: { fontSize: 16, fontWeight: "600" },
});
