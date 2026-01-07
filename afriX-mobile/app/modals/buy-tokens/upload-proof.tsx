// app/modals/buy-tokens/upload-proof.tsx
import React, { useState } from "react";
import { View, StyleSheet, Image, Alert, ScrollView } from "react-native";
import { Text, Button } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMintRequestStore } from "@/stores";

export default function UploadProofScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const router = useRouter();
  const { uploadProof, loading } = useMintRequestStore();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Upload Payment Proof</Text>
      <Text style={styles.subtitle}>
        Take a clear photo or screenshot of your payment receipt
      </Text>

      {/* Image Preview */}
      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Button
            mode="text"
            onPress={() => setImageUri(null)}
            style={styles.removeBtn}
          >
            Remove Image
          </Button>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No image selected</Text>
        </View>
      )}

      {/* Guidelines */}
      <View style={styles.guidelines}>
        <Text style={styles.guidelinesTitle}>📸 Photo Guidelines</Text>
        <Text style={styles.guideline}>
          ✓ Ensure all payment details are clearly visible
        </Text>
        <Text style={styles.guideline}>✓ Include transaction reference/ID</Text>
        <Text style={styles.guideline}>✓ Show amount and recipient</Text>
        <Text style={styles.guideline}>✓ Make sure image is not blurry</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleTakePhoto}
          icon="camera"
          style={styles.actionBtn}
          contentStyle={styles.btnContent}
        >
          Take Photo
        </Button>

        <Button
          mode="outlined"
          onPress={handlePickImage}
          icon="image"
          style={styles.actionBtn}
          contentStyle={styles.btnContent}
        >
          Choose from Gallery
        </Button>
      </View>

      {/* Upload Button */}
      <Button
        mode="contained"
        onPress={handleUpload}
        loading={loading}
        disabled={!imageUri || loading}
        style={styles.uploadBtn}
        contentStyle={styles.btnContent}
      >
        Upload Proof
      </Button>

      {/* Warning */}
      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚠️ Uploading fake or manipulated proof may result in account
          suspension
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
  },
  imageContainer: {
    marginBottom: 24,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  removeBtn: {
    marginTop: 8,
  },
  placeholder: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 14,
    color: "#6B7280",
  },
  guidelines: {
    backgroundColor: "#E8F9F0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  guideline: {
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 6,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
  },
  btnContent: {
    height: 50,
  },
  uploadBtn: {
    borderRadius: 8,
    marginBottom: 16,
  },
  warning: {
    backgroundColor: "#FFF9E6",
    padding: 16,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#1A1A1A",
    lineHeight: 18,
  },
});
