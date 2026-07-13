import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  Alert,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  useColorScheme,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMintRequestStore } from "@/stores";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function UploadProofScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { uploadProof, cancelMintRequest, loading } = useMintRequestStore();

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
    warningSoft: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
    danger: "#EF4444",
    dangerSoft: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
  };

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

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera access is needed to take photos of payment proof");
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Photo library access is needed to select payment proof");
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
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
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
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!imageUri) { Alert.alert("No Image", "Please select or take a photo first"); return; }
    try {
      await uploadProof(requestId, imageUri);
      Alert.alert("Success 🎉", "Payment proof uploaded! Agent will review shortly.", [
        { text: "View Status", onPress: () => router.push({ pathname: "/modals/buy-tokens/status", params: { requestId } }) },
      ]);
    } catch {
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
              Alert.alert("Request Cancelled", "Your mint request has been cancelled successfully.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to cancel request");
            }
          },
        },
      ]
    );
  };

  const guidelines = [
    { icon: "eye-outline" as const, text: "Recipient details clearly visible" },
    { icon: "receipt-outline" as const, text: "Transaction ID is readable" },
    { icon: "checkmark-circle-outline" as const, text: "Amount matches your request" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Fixed Header */}
      <Animated.View
        onLayout={handleHeaderLayout}
        style={[
          styles.headerWrapper,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
            position: "absolute",
            top: 0, left: 0, right: 0,
            zIndex: 10,
          },
        ]}
      >
        <SafeAreaView edges={["top"]} style={styles.headerContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Upload Proof</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  Share your payment receipt so the agent can verify your transfer.
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
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Ambient glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.12)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.10)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* STEP INDICATOR */}
        <View style={styles.stepRow}>
          {[1, 2, 3].map((s, idx) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, s <= 3 ? { backgroundColor: theme.accent } : { backgroundColor: theme.border }]}>
                {s < 3 ? (
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                ) : (
                  <Text style={styles.stepDotText}>{s}</Text>
                )}
              </View>
              {idx < 2 && <View style={[styles.stepLine, { backgroundColor: theme.accent }]} />}
            </React.Fragment>
          ))}
        </View>
        <Text style={[styles.stepHint, { color: theme.muted }]}>Step 3 of 3 — Submit receipt for verification</Text>

        {/* IMAGE UPLOAD ZONE */}
        {imageUri ? (
          <View style={[styles.previewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.55)"]}
              style={styles.previewOverlay}
            >
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => setImageUri(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={16} color="#FFF" />
                <Text style={styles.retakeBtnText}>Change Photo</Text>
              </TouchableOpacity>
            </LinearGradient>
            <View style={[styles.previewReadyBadge, { backgroundColor: theme.accent }]}>
              <Ionicons name="checkmark-circle" size={14} color="#FFF" />
              <Text style={styles.previewReadyText}>Ready to submit</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.uploadZone, { borderColor: theme.accent + "50", backgroundColor: isDark ? "#080F18" : "#F8FAFC" }]}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isDark ? ["rgba(0,177,79,0.08)", "rgba(0,177,79,0)"] : ["rgba(0,177,79,0.06)", "rgba(248,250,252,0)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.uploadIconRing, { backgroundColor: theme.accentSoft }]}>
              <View style={[styles.uploadIconInner, { backgroundColor: theme.accent }]}>
                <Ionicons name="cloud-upload-outline" size={28} color="#FFF" />
              </View>
            </View>
            <Text style={[styles.uploadZoneTitle, { color: theme.text }]}>Tap to upload receipt</Text>
            <Text style={[styles.uploadZoneSub, { color: theme.muted }]}>JPG, PNG — Max 10MB</Text>
          </TouchableOpacity>
        )}

        {/* SOURCE BUTTONS */}
        <View style={styles.sourceRow}>
          <TouchableOpacity
            style={[styles.sourceBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleTakePhoto}
            activeOpacity={0.7}
          >
            <View style={[styles.sourceBtnIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="camera-outline" size={20} color={theme.accent} />
            </View>
            <View>
              <Text style={[styles.sourceBtnLabel, { color: theme.text }]}>Take Photo</Text>
              <Text style={[styles.sourceBtnSub, { color: theme.muted }]}>Use camera</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sourceBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handlePickImage}
            activeOpacity={0.7}
          >
            <View style={[styles.sourceBtnIcon, { backgroundColor: theme.blueSoft }]}>
              <Ionicons name="images-outline" size={20} color={theme.blue} />
            </View>
            <View>
              <Text style={[styles.sourceBtnLabel, { color: theme.text }]}>Gallery</Text>
              <Text style={[styles.sourceBtnSub, { color: theme.muted }]}>From library</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* GUIDELINES */}
        <View style={[styles.guidelinesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.guidelinesHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.accent} />
            <Text style={[styles.guidelinesTitle, { color: theme.text }]}>Receipt Requirements</Text>
          </View>
          {guidelines.map((g, idx) => (
            <View key={idx} style={[styles.guidelineRow, idx < guidelines.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={[styles.guidelineIconBox, { backgroundColor: theme.accentSoft }]}>
                <Ionicons name={g.icon} size={15} color={theme.accent} />
              </View>
              <Text style={[styles.guidelineText, { color: theme.muted }]}>{g.text}</Text>
            </View>
          ))}
        </View>

        {/* WARNING */}
        <View style={[styles.warningBox, { backgroundColor: theme.warningSoft, borderColor: theme.warning + "40" }]}>
          <Ionicons name="alert-circle" size={18} color={theme.warning} />
          <Text style={[styles.warningText, { color: isDark ? "#FDE68A" : "#92400E" }]}>
            Fraudulent receipts result in immediate and permanent account suspension.
          </Text>
        </View>

        {/* ACTION BUTTONS */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: theme.accent },
            (!imageUri || loading) && styles.submitBtnDisabled,
          ]}
          onPress={handleUpload}
          disabled={!imageUri || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={20} color="#FFF" />
              <Text style={styles.submitBtnText}>Submit Payment Proof</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: theme.dangerSoft, backgroundColor: theme.dangerSoft }]}
          onPress={handleCancelRequest}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle-outline" size={16} color={theme.danger} />
          <Text style={[styles.cancelBtnText, { color: theme.danger }]}>Cancel Request</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: { borderBottomWidth: 1 },
  headerContent: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    marginTop: 4,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotText: { fontSize: 11, fontWeight: "900", color: "#FFF" },
  stepLine: {
    height: 2,
    width: 36,
    borderRadius: 2,
  },
  stepHint: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 24,
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 28,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  uploadIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  uploadIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadZoneTitle: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  uploadZoneSub: { fontSize: 12, fontWeight: "500" },
  previewCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: "hidden",
    height: 240,
    marginBottom: 16,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    alignItems: "flex-end",
    paddingRight: 14,
    paddingBottom: 12,
    justifyContent: "flex-end",
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retakeBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  previewReadyBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewReadyText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
  sourceRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  sourceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  sourceBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceBtnLabel: { fontSize: 13, fontWeight: "800" },
  sourceBtnSub: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  guidelinesCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  guidelinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  guidelinesTitle: { fontSize: 14, fontWeight: "800" },
  guidelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  guidelineIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  guidelineText: { fontSize: 13, fontWeight: "600", flex: 1 },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  warningText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 58,
    borderRadius: 20,
    marginBottom: 10,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700" },
});
