import React, { useState } from "react";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "@/utils/format";

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    Modal,
    FlatList,
} from "react-native";
// ... imports

export default function PersonalInfoScreen() {
    const router = useRouter();

    // Form state
    const [fullName, setFullName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [idType, setIdType] = useState("passport");
    const [idNumber, setIdNumber] = useState("");
    const [nationality, setNationality] = useState("NG");
    const [address, setAddress] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Selection Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectionType, setSelectionType] = useState<"idType" | "nationality" | null>(null);

    const idTypes = [
        { value: "passport", label: "Passport" },
        { value: "drivers_license", label: "Driver's License" },
        { value: "national_id", label: "National ID Card" },
    ];

    const countries = [
        { code: "NG", name: "Nigeria" },
        { code: "BJ", name: "Benin" },
        { code: "TG", name: "Togo" },
        { code: "CI", name: "Côte d'Ivoire" },
        { code: "GH", name: "Ghana" },
        { code: "SN", name: "Senegal" },
    ];

    const openSelection = (type: "idType" | "nationality") => {
        setSelectionType(type);
        setModalVisible(true);
    };

    const handleSelect = (item: any) => {
        if (selectionType === "idType") {
            setIdType(item.value);
        } else if (selectionType === "nationality") {
            setNationality(item.code);
        }
        setModalVisible(false);
        setSelectionType(null);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) {
            setDateOfBirth(selectedDate);
        }
    };


    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!fullName.trim()) {
            newErrors.fullName = "Full legal name is required";
        } else if (fullName.trim().length < 3) {
            newErrors.fullName = "Name must be at least 3 characters";
        }

        const age = new Date().getFullYear() - dateOfBirth.getFullYear();
        if (age < 18) {
            newErrors.dateOfBirth = "You must be at least 18 years old";
        }

        if (!idNumber.trim()) {
            newErrors.idNumber = "ID number is required";
        }

        if (!address.trim()) {
            newErrors.address = "Residential address is required";
        } else if (address.trim().length < 10) {
            newErrors.address = "Please provide a complete address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinue = () => {
        if (validate()) {
            // Pass data to next screen
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

    const renderSelectionModal = () => {
        const data = selectionType === "idType" ? idTypes : countries;
        const title = selectionType === "idType" ? "Select ID Type" : "Select Nationality";

        return (
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={data}
                            keyExtractor={(item: any) => item.value || item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    <Text style={styles.optionText}>{item.label || item.name}</Text>
                                    {((selectionType === "idType" && idType === item.value) ||
                                        (selectionType === "nationality" && nationality === item.code)) && (
                                            <Ionicons name="checkmark" size={20} color="#00B14F" />
                                        )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* ... Header ... */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal Information</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* ... Progress Indicator ... */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, styles.progressDotComplete]}>
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        </View>
                        <Text style={styles.progressLabel}>Register</Text>
                    </View>
                    <View style={[styles.progressLine, styles.progressLineActive]} />
                    <View style={styles.progressStep}>
                        <View style={[styles.progressDot, styles.progressDotActive]}>
                            <Text style={styles.progressNumber}>2</Text>
                        </View>
                        <Text style={styles.progressLabel}>KYC</Text>
                    </View>
                    <View style={styles.progressLine} />
                    <View style={styles.progressStep}>
                        <View style={styles.progressDot}>
                            <Text style={styles.progressNumber}>3</Text>
                        </View>
                        <Text style={styles.progressLabel}>Deposit</Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Your Details</Text>
                    <Text style={styles.formDescription}>
                        Please provide your information exactly as it appears on your ID
                    </Text>

                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Legal Name *</Text>
                        <TextInput
                            style={[styles.input, errors.fullName && styles.inputError]}
                            placeholder="John Doe Smith"
                            value={fullName}
                            onChangeText={(text) => {
                                setFullName(text);
                                if (errors.fullName) {
                                    setErrors({ ...errors, fullName: "" });
                                }
                            }}
                            autoCapitalize="words"
                        />
                        {errors.fullName && (
                            <Text style={styles.errorText}>{errors.fullName}</Text>
                        )}
                    </View>

                    {/* Date of Birth */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date of Birth *</Text>
                        <TouchableOpacity
                            style={[styles.input, styles.dateInput]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text style={styles.dateText}>{formatDate(dateOfBirth)}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
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
                        {errors.dateOfBirth && (
                            <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
                        )}
                    </View>

                    {/* ID Document Type */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ID Document Type *</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => openSelection("idType")}
                        >
                            <Text style={styles.selectText}>
                                {idTypes.find((t) => t.value === idType)?.label}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* ID Number */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ID Document Number *</Text>
                        <TextInput
                            style={[styles.input, errors.idNumber && styles.inputError]}
                            placeholder="A12345678"
                            value={idNumber}
                            onChangeText={(text) => {
                                setIdNumber(text);
                                if (errors.idNumber) {
                                    setErrors({ ...errors, idNumber: "" });
                                }
                            }}
                            autoCapitalize="characters"
                        />
                        {errors.idNumber && (
                            <Text style={styles.errorText}>{errors.idNumber}</Text>
                        )}
                    </View>

                    {/* Nationality */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nationality *</Text>
                        <TouchableOpacity
                            style={styles.selectInput}
                            onPress={() => openSelection("nationality")}
                        >
                            <Text style={styles.selectText}>
                                {countries.find((c) => c.code === nationality)?.name}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Residential Address */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Residential Address *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                errors.address && styles.inputError,
                            ]}
                            placeholder="123 Main Street, City, State"
                            value={address}
                            onChangeText={(text) => {
                                setAddress(text);
                                if (errors.address) {
                                    setErrors({ ...errors, address: "" });
                                }
                            }}
                            multiline
                            numberOfLines={3}
                        />
                        {errors.address && (
                            <Text style={styles.errorText}>{errors.address}</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.continueButtonText}>Continue to Documents</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {renderSelectionModal()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    content: {
        padding: 20,
    },
    progressContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32,
    },
    progressStep: {
        alignItems: "center",
    },
    progressDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    progressDotActive: {
        backgroundColor: "#00B14F",
    },
    progressDotComplete: {
        backgroundColor: "#00B14F",
    },
    progressNumber: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    progressLabel: {
        fontSize: 12,
        color: "#6B7280",
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: "#F3F4F6",
        marginHorizontal: 8,
        marginBottom: 28,
    },
    progressLineActive: {
        backgroundColor: "#00B14F",
    },
    form: {
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    formDescription: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#111827",
        backgroundColor: "#FFFFFF",
    },
    inputError: {
        borderColor: "#EF4444",
    },
    dateInput: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dateText: {
        fontSize: 16,
        color: "#111827",
    },
    selectInput: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        padding: 12,
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    selectText: {
        fontSize: 16,
        color: "#111827",
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top",
    },
    errorText: {
        fontSize: 12,
        color: "#EF4444",
        marginTop: 4,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    continueButton: {
        flexDirection: "row",
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    continueButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    optionItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    optionText: {
        fontSize: 16,
        color: "#374151",
    },
});
