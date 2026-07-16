import React, { useState } from "react";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "@/utils/format";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Modal,
    FlatList,
    useColorScheme,
} from "react-native";

export default function PersonalInfoScreen() {
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

    const [fullName, setFullName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [idType, setIdType] = useState("passport");
    const [idNumber, setIdNumber] = useState("");
    const [nationality, setNationality] = useState("NG");
    const [address, setAddress] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [modalVisible, setModalVisible] = useState(false);
    const [selectionType, setSelectionType] = useState<"idType" | "nationality" | null>(null);

    const idTypes = [
        { value: "passport", label: t("agent.kyc.personal_info.id_passport", "Passport") },
        { value: "drivers_license", label: t("agent.kyc.personal_info.id_drivers_license", "Driver's License") },
        { value: "national_id", label: t("agent.kyc.personal_info.id_national_id", "National ID Card") },
    ];

    const countries = [
        { code: "NG", name: t("agent.kyc.personal_info.country_ng", "Nigeria") },
        { code: "BJ", name: t("agent.kyc.personal_info.country_bj", "Benin") },
        { code: "TG", name: t("agent.kyc.personal_info.country_tg", "Togo") },
        { code: "CI", name: t("agent.kyc.personal_info.country_ci", "Côte d'Ivoire") },
        { code: "GH", name: t("agent.kyc.personal_info.country_gh", "Ghana") },
        { code: "SN", name: t("agent.kyc.personal_info.country_sn", "Senegal") },
    ];

    const openSelection = (type: "idType" | "nationality") => {
        setSelectionType(type);
        setModalVisible(true);
    };

    const handleSelect = (item: any) => {
        if (selectionType === "idType") setIdType(item.value);
        else if (selectionType === "nationality") setNationality(item.code);
        setModalVisible(false);
        setSelectionType(null);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) setDateOfBirth(selectedDate);
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!fullName.trim()) newErrors.fullName = t("agent.kyc.personal_info.err_name_required", "Full legal name is required");
        else if (fullName.trim().length < 3) newErrors.fullName = t("agent.kyc.personal_info.err_name_short", "Name must be at least 3 characters");
        const age = new Date().getFullYear() - dateOfBirth.getFullYear();
        if (age < 18) newErrors.dateOfBirth = t("agent.kyc.personal_info.err_age_min", "You must be at least 18 years old");
        if (!idNumber.trim()) newErrors.idNumber = t("agent.kyc.personal_info.err_id_required", "ID number is required");
        if (!address.trim()) newErrors.address = t("agent.kyc.personal_info.err_address_required", "Residential address is required");
        else if (address.trim().length < 10) newErrors.address = t("agent.kyc.personal_info.err_address_short", "Please provide a complete address");
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (validate()) {
            router.push({
                pathname: "/modals/agent-kyc/upload-documents",
                params: {
                    fullName,
                    dateOfBirth: dateOfBirth.toISOString(),
                    idType,
                    idNumber,
                    nationality,
                    address,
                },
            });
        }
    };

    const progressSteps = [
        { label: t("agent.kyc.personal_info.step_register", "Register"), done: true },
        { label: t("agent.kyc.personal_info.step_kyc", "KYC"), done: false, active: true },
        { label: t("agent.kyc.personal_info.step_deposit", "Deposit"), done: false },
    ];

    const fields = [
        {
            key: "fullName",
            label: "FULL LEGAL NAME *",
            icon: "person-outline",
            placeholder: "John Doe Smith",
            value: fullName,
            onChange: (t: string) => { setFullName(t); if (errors.fullName) setErrors({ ...errors, fullName: "" }); },
            autoCapitalize: "words" as const,
            multiline: false,
        },
        {
            key: "idNumber",
            label: "ID DOCUMENT NUMBER *",
            icon: "barcode-outline",
            placeholder: "A12345678",
            value: idNumber,
            onChange: (t: string) => { setIdNumber(t); if (errors.idNumber) setErrors({ ...errors, idNumber: "" }); },
            autoCapitalize: "characters" as const,
            multiline: false,
        },
        {
            key: "address",
            label: "RESIDENTIAL ADDRESS *",
            icon: "location-outline",
            placeholder: "123 Main Street, City, State",
            value: address,
            onChange: (t: string) => { setAddress(t); if (errors.address) setErrors({ ...errors, address: "" }); },
            autoCapitalize: "sentences" as const,
            multiline: true,
        },
    ];

    const renderModal = () => {
        const data = selectionType === "idType" ? idTypes : countries;
        const title = selectionType === "idType"
            ? t("agent.kyc.personal_info.modal_select_id", "Select ID Type")
            : t("agent.kyc.personal_info.modal_select_nationality", "Select Nationality");
        return (
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
                        <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalCloseBtn, { backgroundColor: theme.cardAlt }]}>
                                <Ionicons name="close" size={18} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={data}
                            keyExtractor={(item: any) => item.value || item.code}
                            style={{ paddingHorizontal: 16, paddingTop: 8 }}
                            renderItem={({ item }) => {
                                const isSelected = selectionType === "idType" ? idType === item.value : nationality === item.code;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.optionRow,
                                            { borderBottomColor: theme.border },
                                            isSelected && { backgroundColor: theme.accentSoft, borderRadius: 12 }
                                        ]}
                                        onPress={() => handleSelect(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.optionText, { color: isSelected ? theme.accent : theme.text }]}>
                                            {item.label || item.name}
                                        </Text>
                                        {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.accent} />}
                                    </TouchableOpacity>
                                );
                            }}
                            ListFooterComponent={<View style={{ height: 40 }} />}
                        />
                    </View>
                </View>
            </Modal>
        );
    };

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>{t("agent.kyc.personal_info.header_title", "Personal Information")}</Text>
                <View style={{ width: 42 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Stepper */}
                <View style={[styles.stepperCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {progressSteps.map((step, i) => (
                        <React.Fragment key={i}>
                            <View style={styles.stepItem}>
                                {step.done ? (
                                    <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.stepDot}>
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    </LinearGradient>
                                ) : (step as any).active ? (
                                    <LinearGradient colors={["#00B14F", "#008F40"]} style={styles.stepDot}>
                                        <Text style={styles.stepNum}>{i + 1}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={[styles.stepDot, { backgroundColor: theme.border }]}>
                                        <Text style={[styles.stepNum, { color: theme.muted }]}>{i + 1}</Text>
                                    </View>
                                )}
                                <Text style={[styles.stepLabel, { color: step.done || (step as any).active ? theme.accent : theme.muted }]}>
                                    {step.label}
                                </Text>
                            </View>
                            {i < progressSteps.length - 1 && (
                                <View style={[styles.stepLine, { backgroundColor: step.done ? theme.accent : theme.border }]} />
                            )}
                        </React.Fragment>
                    ))}
                </View>

                {/* Hero */}
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroBanner}
                >
                    <View style={styles.heroIconCircle}>
                        <Ionicons name="person" size={26} color="#00B14F" />
                    </View>
                    <Text style={styles.heroEyebrow}>{t("agent.kyc.personal_info.hero_eyebrow", "KYC · STEP 1 OF 2")}</Text>
                    <Text style={styles.heroTitle}>{t("agent.kyc.personal_info.hero_title", "Your Details")}</Text>
                    <Text style={styles.heroSubtitle}>
                        {t("agent.kyc.personal_info.hero_subtitle", "Please provide your information exactly as it appears on your official ID document.")}
                    </Text>
                </LinearGradient>

                {/* Form Card */}
                <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>

                    {/* Full Name */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.kyc.personal_info.label_full_name", "FULL LEGAL NAME *")}</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: errors.fullName ? theme.danger : theme.border }]}>
                            <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft, marginRight: 10 }]}>
                                <Ionicons name="person-outline" size={15} color={theme.accent} />
                            </View>
                            <TextInput
                                style={[styles.textInput, { color: theme.text }]}
                                placeholder={t("agent.kyc.personal_info.placeholder_full_name", "John Doe Smith")}
                                placeholderTextColor={theme.muted}
                                value={fullName}
                                onChangeText={(t) => { setFullName(t); if (errors.fullName) setErrors({ ...errors, fullName: "" }); }}
                                autoCapitalize="words"
                            />
                        </View>
                        {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
                    </View>

                    <View style={[styles.fieldDivider, { backgroundColor: theme.border }]} />

                    {/* Date of Birth */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.kyc.personal_info.label_dob", "DATE OF BIRTH *")}</Text>
                        <TouchableOpacity
                            style={[styles.selectField, { backgroundColor: theme.inputBg, borderColor: errors.dateOfBirth ? theme.danger : theme.border }]}
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.selectFieldLeft}>
                                <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft }]}>
                                    <Ionicons name="calendar-outline" size={15} color={theme.accent} />
                                </View>
                                <Text style={[styles.selectFieldText, { color: theme.text }]}>{formatDate(dateOfBirth)}</Text>
                            </View>
                            <Ionicons name="chevron-down" size={18} color={theme.muted} />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={dateOfBirth}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                        {errors.dateOfBirth ? <Text style={styles.errorText}>{errors.dateOfBirth}</Text> : null}
                    </View>

                    <View style={[styles.fieldDivider, { backgroundColor: theme.border }]} />

                    {/* ID Type */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.kyc.personal_info.label_id_type", "ID DOCUMENT TYPE *")}</Text>
                        <TouchableOpacity
                            style={[styles.selectField, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                            onPress={() => openSelection("idType")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.selectFieldLeft}>
                                <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft }]}>
                                    <Ionicons name="card-outline" size={15} color={theme.accent} />
                                </View>
                                <Text style={[styles.selectFieldText, { color: theme.text }]}>
                                    {idTypes.find((t) => t.value === idType)?.label}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={18} color={theme.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.fieldDivider, { backgroundColor: theme.border }]} />

                    {/* ID Number */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.kyc.personal_info.label_id_number", "ID DOCUMENT NUMBER *")}</Text>
                        <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: errors.idNumber ? theme.danger : theme.border }]}>
                            <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft, marginRight: 10 }]}>
                                <Ionicons name="barcode-outline" size={15} color={theme.accent} />
                            </View>
                            <TextInput
                                style={[styles.textInput, { color: theme.text }]}
                                placeholder={t("agent.kyc.personal_info.placeholder_id_number", "A12345678")}
                                placeholderTextColor={theme.muted}
                                value={idNumber}
                                onChangeText={(t) => { setIdNumber(t); if (errors.idNumber) setErrors({ ...errors, idNumber: "" }); }}
                                autoCapitalize="characters"
                            />
                        </View>
                        {errors.idNumber ? <Text style={styles.errorText}>{errors.idNumber}</Text> : null}
                    </View>

                    <View style={[styles.fieldDivider, { backgroundColor: theme.border }]} />

                    {/* Nationality */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.kyc.personal_info.label_nationality", "NATIONALITY *")}</Text>
                        <TouchableOpacity
                            style={[styles.selectField, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                            onPress={() => openSelection("nationality")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.selectFieldLeft}>
                                <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft }]}>
                                    <Ionicons name="flag-outline" size={15} color={theme.accent} />
                                </View>
                                <Text style={[styles.selectFieldText, { color: theme.text }]}>
                                    {countries.find((c) => c.code === nationality)?.name}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={18} color={theme.muted} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.fieldDivider, { backgroundColor: theme.border }]} />

                    {/* Address */}
                    <View style={styles.fieldGroup}>
                        <Text style={[styles.fieldLabel, { color: theme.muted }]}>{t("agent.kyc.personal_info.label_address", "RESIDENTIAL ADDRESS *")}</Text>
                        <View style={[styles.inputWrapper, styles.textAreaWrapper, { backgroundColor: theme.inputBg, borderColor: errors.address ? theme.danger : theme.border }]}>
                            <View style={[styles.fieldIconBox, { backgroundColor: theme.accentSoft, marginRight: 10, alignSelf: "flex-start", marginTop: 2 }]}>
                                <Ionicons name="location-outline" size={15} color={theme.accent} />
                            </View>
                            <TextInput
                                style={[styles.textInput, styles.textArea, { color: theme.text }]}
                                placeholder={t("agent.kyc.personal_info.placeholder_address", "123 Main Street, City, State")}
                                placeholderTextColor={theme.muted}
                                value={address}
                                onChangeText={(t) => { setAddress(t); if (errors.address) setErrors({ ...errors, address: "" }); }}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                        {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.continueBtn, { backgroundColor: theme.accent }]}
                    onPress={handleContinue}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueBtnText}>{t("agent.kyc.personal_info.btn_continue", "Continue to Documents")}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {renderModal()}
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
    formCard: {
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    fieldGroup: { paddingVertical: 14, gap: 8 },
    fieldLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
    fieldIconBox: {
        width: 30,
        height: 30,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
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
    textAreaWrapper: { alignItems: "flex-start", paddingTop: 12 },
    textInput: { flex: 1, fontSize: 15, fontWeight: "600", paddingVertical: 2 },
    textArea: { minHeight: 70, textAlignVertical: "top" },
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
    selectFieldLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    selectFieldText: { fontSize: 15, fontWeight: "700" },
    errorText: { fontSize: 12, fontWeight: "600", color: "#EF4444" },
    fieldDivider: { height: 1 },
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    continueBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 18,
        gap: 8,
    },
    continueBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        maxHeight: "70%",
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
    optionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    optionText: { fontSize: 16, fontWeight: "600" },
});
