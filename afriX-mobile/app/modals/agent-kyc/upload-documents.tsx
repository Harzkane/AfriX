import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    useColorScheme,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAgentStore } from "@/stores/slices/agentSlice";
import * as ImagePicker from "expo-image-picker";

interface DocumentState {
    uri: string;
    name: string;
    type: string;
}

interface DocConfig {
    title: string;
    description: string;
    icon: string;
    required: boolean;
    document: DocumentState | null;
    setter: React.Dispatch<React.SetStateAction<DocumentState | null>>;
}

export default function UploadDocumentsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const theme = {
        background: isDark ? "#07111A" : "#F5F7FB",
        card: isDark ? "#0E1726" : "#FFFFFF",
        cardAlt: isDark ? "#111C2B" : "#F8FAFC",
        text: isDark ? "#F8FAFC" : "#0F172A",
        muted: isDark ? "#94A3B8" : "#64748B",
        border: isDark ? "#1E2A3A" : "#E2E8F0",
        accent: "#00B14F",
        accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
        danger: "#EF4444",
        dangerSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
        uploadBg: isDark ? "#080F18" : "#F8FAFC",
    };

    const [loading, setLoading] = useState(false);
    const [idDocument, setIdDocument] = useState<DocumentState | null>(null);
    const [selfie, setSelfie] = useState<DocumentState | null>(null);
    const [proofOfAddress, setProofOfAddress] = useState<DocumentState | null>(null);
    const [businessReg, setBusinessReg] = useState<DocumentState | null>(null);

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Required", "Camera permission is required to take photos of your documents.");
            return false;
        }
        return true;
    };

    const pickImage = async (
        type: "camera" | "gallery",
        setter: React.Dispatch<React.SetStateAction<DocumentState | null>>
    ) => {
        try {
            let result;
            if (type === "camera") {
                const hasPermission = await requestPermissions();
                if (!hasPermission) return;
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                });
            } else {
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 0.8,
                });
            }
            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                setter({ uri: asset.uri, name: asset.fileName || "document.jpg", type: "image/jpeg" });
            }
        } catch (error) {
            Alert.alert("Error", "Failed to pick image. Please try again.");
        }
    };

    const showImageOptions = (
        setter: React.Dispatch<React.SetStateAction<DocumentState | null>>,
        title: string
    ) => {
        Alert.alert(title, "Choose an option", [
            { text: "Take Photo", onPress: () => pickImage("camera", setter) },
            { text: "Choose from Gallery", onPress: () => pickImage("gallery", setter) },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handleSubmit = async () => {
        if (!idDocument) { Alert.alert("Missing Document", "Please upload your ID document"); return; }
        if (!selfie) { Alert.alert("Missing Document", "Please upload a selfie with your ID"); return; }
        if (!proofOfAddress) { Alert.alert("Missing Document", "Please upload proof of address"); return; }

        setLoading(true);
        try {
            const personalInfo = {
                full_legal_name: params.fullName as string,
                date_of_birth: params.dateOfBirth as string,
                id_document_type: params.idType as string,
                id_document_number: params.idNumber as string,
                nationality: params.nationality as string,
                residential_address: params.address as string,
            };
            const documents = {
                id_document: idDocument!,
                selfie: selfie!,
                proof_of_address: proofOfAddress!,
                business_registration: businessReg,
            };
            await useAgentStore.getState().uploadKyc(personalInfo, documents);
            Alert.alert(
                "KYC Submitted! 🎉",
                "Your documents have been submitted for review. We'll notify you once approved.",
                [{ text: "OK", onPress: () => router.replace("/modals/agent-kyc/status") }]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit documents");
        } finally {
            setLoading(false);
        }
    };

    const docConfigs: DocConfig[] = [
        {
            title: "Government-Issued ID",
            description: "Passport, driver's license, or national ID card",
            icon: "card",
            required: true,
            document: idDocument,
            setter: setIdDocument,
        },
        {
            title: "Selfie with ID",
            description: "Hold your ID next to your face in a well-lit area",
            icon: "camera",
            required: true,
            document: selfie,
            setter: setSelfie,
        },
        {
            title: "Proof of Address",
            description: "Utility bill or bank statement (less than 3 months old)",
            icon: "document-text",
            required: true,
            document: proofOfAddress,
            setter: setProofOfAddress,
        },
        {
            title: "Business Registration",
            description: "Optional: If you operate as a registered business",
            icon: "business",
            required: false,
            document: businessReg,
            setter: setBusinessReg,
        },
    ];

    const uploadedCount = [idDocument, selfie, proofOfAddress, businessReg].filter(Boolean).length;
    const requiredCount = 3;

    const progressSteps = [
        { label: "Register", done: true },
        { label: "KYC", done: false, active: true },
        { label: "Deposit", done: false },
    ];

    const renderDocCard = (cfg: DocConfig) => (
        <View key={cfg.title} style={[styles.docCard, { backgroundColor: theme.card, borderColor: cfg.document ? theme.accent : theme.border }]}>
            {/* Card Header */}
            <View style={styles.docCardHeader}>
                <View style={[styles.docIconBox, { backgroundColor: cfg.document ? theme.accentSoft : theme.cardAlt }]}>
                    <Ionicons name={cfg.icon as any} size={20} color={cfg.document ? theme.accent : theme.muted} />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.docTitleRow}>
                        <Text style={[styles.docTitle, { color: theme.text }]}>{cfg.title}</Text>
                        {cfg.required ? (
                            <View style={[styles.requiredBadge, { backgroundColor: theme.dangerSoft }]}>
                                <Text style={[styles.requiredText, { color: theme.danger }]}>Required</Text>
                            </View>
                        ) : (
                            <View style={[styles.optionalBadge, { backgroundColor: theme.cardAlt }]}>
                                <Text style={[styles.optionalText, { color: theme.muted }]}>Optional</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.docDesc, { color: theme.muted }]}>{cfg.description}</Text>
                </View>
                {cfg.document && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.accent }]}>
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                )}
            </View>

            {/* Upload Area */}
            {cfg.document ? (
                <View style={styles.previewArea}>
                    <Image source={{ uri: cfg.document.uri }} style={styles.previewImage} />
                    <View style={styles.previewActions}>
                        <TouchableOpacity
                            style={[styles.previewBtn, { backgroundColor: theme.accentSoft, borderColor: theme.accent + "50" }]}
                            onPress={() => showImageOptions(cfg.setter, cfg.title)}
                        >
                            <Ionicons name="camera-outline" size={15} color={theme.accent} />
                            <Text style={[styles.previewBtnText, { color: theme.accent }]}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.previewBtn, { backgroundColor: theme.dangerSoft, borderColor: theme.danger + "50" }]}
                            onPress={() => cfg.setter(null)}
                        >
                            <Ionicons name="trash-outline" size={15} color={theme.danger} />
                            <Text style={[styles.previewBtnText, { color: theme.danger }]}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.uploadArea, { backgroundColor: theme.uploadBg, borderColor: theme.border }]}
                    onPress={() => showImageOptions(cfg.setter, cfg.title)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.uploadIconCircle, { backgroundColor: theme.accentSoft }]}>
                        <Ionicons name="cloud-upload-outline" size={26} color={theme.accent} />
                    </View>
                    <Text style={[styles.uploadText, { color: theme.text }]}>Tap to Upload</Text>
                    <Text style={[styles.uploadSubtext, { color: theme.muted }]}>Camera or Gallery</Text>
                </TouchableOpacity>
            )}
        </View>
    );

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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Upload Documents</Text>
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

                {/* Progress Summary */}
                <LinearGradient
                    colors={["#00B14F", "#008F40"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.progressBanner}
                >
                    <View>
                        <Text style={styles.progressBannerEyebrow}>KYC · STEP 2 OF 2</Text>
                        <Text style={styles.progressBannerTitle}>Upload Documents</Text>
                        <Text style={styles.progressBannerSubtitle}>
                            Take clear photos with good lighting. All corners must be visible.
                        </Text>
                    </View>
                    <View style={styles.uploadCountBadge}>
                        <Text style={styles.uploadCountNum}>{uploadedCount}</Text>
                        <Text style={styles.uploadCountLabel}>/{requiredCount}</Text>
                    </View>
                </LinearGradient>

                {/* Upload bar */}
                <View style={[styles.uploadProgressBar, { backgroundColor: theme.border }]}>
                    <View style={[styles.uploadProgressFill, { width: `${(uploadedCount / 4) * 100}%` as any, backgroundColor: theme.accent }]} />
                </View>

                {/* Document Cards */}
                {docConfigs.map(renderDocCard)}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
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
                            <Text style={styles.submitBtnText}>Submit for Review</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    progressBanner: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    progressBannerEyebrow: {
        fontSize: 10,
        fontWeight: "800",
        color: "rgba(255,255,255,0.7)",
        letterSpacing: 1,
        marginBottom: 4,
    },
    progressBannerTitle: {
        fontSize: 22,
        fontWeight: "900",
        color: "#FFF",
        letterSpacing: -0.4,
        marginBottom: 6,
    },
    progressBannerSubtitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.85)",
        lineHeight: 18,
        maxWidth: 220,
    },
    uploadCountBadge: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        width: 64,
        height: 64,
        borderRadius: 32,
        flexDirection: "row",
    },
    uploadCountNum: { fontSize: 26, fontWeight: "900", color: "#FFF" },
    uploadCountLabel: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginTop: 4 },
    uploadProgressBar: {
        height: 4,
        borderRadius: 2,
        marginBottom: 16,
        overflow: "hidden",
    },
    uploadProgressFill: {
        height: 4,
        borderRadius: 2,
    },
    docCard: {
        borderRadius: 22,
        borderWidth: 1.5,
        marginBottom: 14,
        overflow: "hidden",
    },
    docCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
    },
    docIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    docTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 3,
    },
    docTitle: { fontSize: 15, fontWeight: "800", flex: 1 },
    docDesc: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
    requiredBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    requiredText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },
    optionalBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    optionalText: { fontSize: 10, fontWeight: "700" },
    checkBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    uploadArea: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 28,
        marginHorizontal: 14,
        marginBottom: 14,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderRadius: 16,
        gap: 6,
    },
    uploadIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    uploadText: { fontSize: 15, fontWeight: "800" },
    uploadSubtext: { fontSize: 12, fontWeight: "500" },
    previewArea: {
        marginHorizontal: 14,
        marginBottom: 14,
    },
    previewImage: {
        width: "100%",
        height: 190,
        borderRadius: 16,
    },
    previewActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
    },
    previewBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    previewBtnText: { fontSize: 14, fontWeight: "700" },
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
});
