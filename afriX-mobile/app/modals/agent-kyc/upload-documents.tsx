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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAgentStore } from "@/stores/slices/agentSlice";
import * as ImagePicker from "expo-image-picker";

interface DocumentState {
    uri: string;
    name: string;
    type: string;
}

export default function UploadDocumentsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [loading, setLoading] = useState(false);
    const [idDocument, setIdDocument] = useState<DocumentState | null>(null);
    const [selfie, setSelfie] = useState<DocumentState | null>(null);
    const [proofOfAddress, setProofOfAddress] = useState<DocumentState | null>(null);
    const [businessReg, setBusinessReg] = useState<DocumentState | null>(null);

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission Required",
                "Camera permission is required to take photos of your documents."
            );
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
                setter({
                    uri: asset.uri,
                    name: asset.fileName || "document.jpg",
                    type: "image/jpeg",
                });
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
            {
                text: "Take Photo",
                onPress: () => pickImage("camera", setter),
            },
            {
                text: "Choose from Gallery",
                onPress: () => pickImage("gallery", setter),
            },
            {
                text: "Cancel",
                style: "cancel",
            },
        ]);
    };

    const handleSubmit = async () => {
        // Validation
        if (!idDocument) {
            Alert.alert("Missing Document", "Please upload your ID document");
            return;
        }
        if (!selfie) {
            Alert.alert("Missing Document", "Please upload a selfie with your ID");
            return;
        }
        if (!proofOfAddress) {
            Alert.alert("Missing Document", "Please upload proof of address");
            return;
        }

        setLoading(true);

        try {
            // Construct personal info object
            const personalInfo = {
                full_legal_name: params.fullName as string,
                date_of_birth: params.dateOfBirth as string,
                id_document_type: params.idType as string,
                id_document_number: params.idNumber as string,
                nationality: params.nationality as string,
                residential_address: params.address as string,
            };

            // Construct documents object
            const documents = {
                id_document: idDocument!,
                selfie: selfie!,
                proof_of_address: proofOfAddress!,
                business_registration: businessReg,
            };

            // Call API to upload KYC
            await useAgentStore.getState().uploadKyc(personalInfo, documents);

            Alert.alert(
                "KYC Submitted!",
                "Your documents have been submitted for review. We'll notify you once approved.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            router.replace("/modals/agent-kyc/status");
                        },
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit documents");
        } finally {
            setLoading(false);
        }
    };

    const renderDocumentCard = (
        title: string,
        description: string,
        document: DocumentState | null,
        setter: React.Dispatch<React.SetStateAction<DocumentState | null>>,
        required: boolean = true
    ) => (
        <View style={styles.documentCard}>
            <View style={styles.documentHeader}>
                <Text style={styles.documentTitle}>{title}</Text>
                {required && (
                    <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                    </View>
                )}
            </View>
            <Text style={styles.documentDescription}>{description}</Text>

            {document ? (
                <View style={styles.imagePreview}>
                    <Image source={{ uri: document.uri! }} style={styles.previewImage} />
                    <View style={styles.imageActions}>
                        <TouchableOpacity
                            style={styles.retakeButton}
                            onPress={() => showImageOptions(setter, title)}
                        >
                            <Ionicons name="camera-outline" size={16} color="#00B14F" />
                            <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => setter(null)}
                        >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => showImageOptions(setter, title)}
                >
                    <Ionicons name="cloud-upload-outline" size={32} color="#00B14F" />
                    <Text style={styles.uploadText}>Tap to Upload</Text>
                    <Text style={styles.uploadSubtext}>Camera or Gallery</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upload Documents</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Progress Indicator */}
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

                {/* Instructions */}
                <View style={styles.instructionsCard}>
                    <Ionicons name="information-circle" size={20} color="#00B14F" />
                    <Text style={styles.instructionsText}>
                        Take clear photos with good lighting. All corners of documents should be
                        visible.
                    </Text>
                </View>

                {/* Document Upload Cards */}
                {renderDocumentCard(
                    "Government-Issued ID",
                    "Passport, driver's license, or national ID card",
                    idDocument,
                    setIdDocument
                )}

                {renderDocumentCard(
                    "Selfie with ID",
                    "Hold your ID next to your face",
                    selfie,
                    setSelfie
                )}

                {renderDocumentCard(
                    "Proof of Address",
                    "Utility bill or bank statement (less than 3 months old)",
                    proofOfAddress,
                    setProofOfAddress
                )}

                {renderDocumentCard(
                    "Business Registration",
                    "Optional: If you operate as a business",
                    businessReg,
                    setBusinessReg,
                    false
                )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>Submit for Review</Text>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
        marginBottom: 24,
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
    instructionsCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F0FDF4",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#00B14F",
        marginBottom: 24,
    },
    instructionsText: {
        fontSize: 13,
        color: "#065F46",
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    documentCard: {
        marginBottom: 24,
        padding: 16,
        backgroundColor: "#F9FAFB",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    documentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    documentTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    requiredBadge: {
        backgroundColor: "#FEE2E2",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    requiredText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#DC2626",
    },
    documentDescription: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 12,
    },
    uploadButton: {
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        borderWidth: 2,
        borderColor: "#D1D5DB",
        borderStyle: "dashed",
        borderRadius: 8,
        backgroundColor: "#FFFFFF",
    },
    uploadText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginTop: 8,
    },
    uploadSubtext: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 4,
    },
    imagePreview: {
        borderRadius: 8,
        overflow: "hidden",
    },
    previewImage: {
        width: "100%",
        height: 200,
        borderRadius: 8,
    },
    imageActions: {
        flexDirection: "row",
        marginTop: 12,
        gap: 12,
    },
    retakeButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        backgroundColor: "#F0FDF4",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#00B14F",
        gap: 6,
    },
    retakeText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#00B14F",
    },
    deleteButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        backgroundColor: "#FEF2F2",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#EF4444",
        gap: 6,
    },
    deleteText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#EF4444",
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
    },
    submitButton: {
        flexDirection: "row",
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
