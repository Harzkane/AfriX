import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions
} from "react-native";
import { Text, Button, Surface, ActivityIndicator } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMintRequestStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function UploadProofScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const router = useRouter();
  const { uploadProof, cancelMintRequest, loading } = useMintRequestStore();

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera access is needed to take photos of payment proof"
      );
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Photo library access is needed to select payment proof"
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please select or take a photo first");
      return;
    }

    try {
      await uploadProof(requestId, imageUri);
      Alert.alert(
        "Success",
        "Payment proof uploaded! Agent will review shortly.",
        [
          {
            text: "View Status",
            onPress: () =>
              router.push({
                pathname: "/modals/buy-tokens/status",
                params: { requestId },
              }),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to upload proof. Please try again.");
    }
  };

  const handleCancelRequest = () => {
    Alert.alert(
      "Cancel Request?",
      "Are you sure you want to cancel this mint request? This action cannot be undone.",
      [
        { text: "No, Keep It", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelMintRequest(requestId);
              Alert.alert(
                "Request Cancelled",
                "Your mint request has been cancelled successfully.",
                [{ text: "OK", onPress: () => router.back() }]
              );
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to cancel request");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#00B14F", "#008F40"]}
          style={styles.headerGradient}
        />
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Upload Proof</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topTextContainer}>
          <Text style={styles.title}>Submit Receipt</Text>
          <Text style={styles.subtitle}>
            Upload a clear screenshot or photo of your payment confirmation.
          </Text>
        </View>

        {/* Image Preview Area */}
        <Surface style={styles.previewSurface} elevation={0}>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={styles.removeBtnText}>Remove Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderIconBg}>
                <Ionicons name="cloud-upload-outline" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.placeholderText}>No image selected yet</Text>
            </View>
          )}
        </Surface>

        {/* Selection Actions */}
        <View style={styles.selectionRow}>
          <TouchableOpacity
            style={styles.selectionBtn}
            onPress={handleTakePhoto}
          >
            <View style={[styles.selIconBg, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="camera" size={24} color="#00B14F" />
            </View>
            <Text style={styles.selText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectionBtn}
            onPress={handlePickImage}
          >
            <View style={[styles.selIconBg, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="images" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.selText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Guidelines */}
        <Surface style={styles.guidelinesCard} elevation={0}>
          <Text style={styles.guidelinesTitle}>📸 Important Guidelines</Text>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
            <Text style={styles.guidelineText}>Recipient details must be visible</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
            <Text style={styles.guidelineText}>Transaction ID should be clear</Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
            <Text style={styles.guidelineText}>Amount must match your request</Text>
          </View>
        </Surface>

        {/* Safety Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            Fake or manipulated receipts will lead to immediate account suspension.
          </Text>
        </View>

        {/* Cancel Request Button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancelRequest}
          disabled={loading}
        >
          <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
          <Text style={styles.cancelBtnText}>Cancel Request</Text>
        </TouchableOpacity>

        {/* Upload Action */}
        <TouchableOpacity
          style={[styles.uploadBtn, (!imageUri || loading) && styles.disabledBtn]}
          onPress={handleUpload}
          disabled={!imageUri || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.uploadBtnText}>Submit Proof</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  headerWrapper: {
    marginBottom: 0,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    marginTop: 40,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  topTextContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  previewSurface: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 280,
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePreviewContainer: {
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 6,
  },
  removeBtnText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  selectionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  selectionBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  selText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 24,
  },
  guidelinesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  guidelineItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  guidelineText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  uploadBtn: {
    backgroundColor: "#00B14F",
    height: 58,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#00B14F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#EF4444",
    backgroundColor: "#FFFFFF",
  },
  cancelBtnText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledBtn: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
});
