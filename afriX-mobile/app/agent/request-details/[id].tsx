import React, { useState } from "react";
import {
    ActivityIndicator, Alert, Image,
    KeyboardAvoidingView, Linking, Modal, Platform,
    ScrollView, StyleSheet, Text, TextInput,
    TouchableOpacity, View, useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useAgentStore } from "@/stores/slices/agentSlice";
import { formatAmount, formatDate } from "@/utils/format";

const getTypeConfig = (type: "mint" | "burn") => {
    if (type === "mint") return { label: "Mint", icon: "arrow-up-circle" as const, color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
    return { label: "Burn", icon: "arrow-down-circle" as const, color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
};

const getStatusColor = (status: string) => {
    switch (String(status || "").toLowerCase()) {
        case "confirmed": case "completed": return "#059669";
        case "proof_submitted": case "escrowed": case "pending": return "#D97706";
        case "rejected": case "expired": return "#EF4444";
        case "disputed": return "#F59E0B";
        default: return "#6B7280";
    }
};

export default function RequestDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { pendingRequests, history, confirmMintRequest, confirmBurnPayment, rejectRequest, loading } = useAgentStore();
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
        inputBg: isDark ? "rgba(255,255,255,0.06)" : "#F8F7FF",
        green: "#00B14F",
    };

    const request = [...pendingRequests, ...history].find((item) => item.id === id);
    const [uploading, setUploading] = useState(false);
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const isMint = request?.type === "mint" || (!request?.type && !request?.bank_account);
    const isBurn = !isMint;

    const isExpiredByTime = (req: any) => req?.expires_at ? new Date(req.expires_at).getTime() < Date.now() : false;
    const isExpired = request?.status === "expired" || (request ? isExpiredByTime(request) : false);
    const canConfirmMint = !!request && isMint && request.status === "proof_submitted" && !isExpired;
    const canUploadBurnProof = !!request && isBurn && request.status === "escrowed" && !isExpired;
    const canReject = !!request && (request.status === "pending" || request.status === "proof_submitted");

    if (!request) {
        return (
            <View style={[styles.container, { backgroundColor: theme.bg }]}>
                <SafeAreaView style={styles.errorWrap}>
                    <LinearGradient colors={["#EDE9FE", "#DDD6FE"]} style={styles.errorIconCircle}>
                        <Ionicons name="alert-circle-outline" size={28} color="#7C3AED" />
                    </LinearGradient>
                    <Text style={[styles.errorTitle, { color: theme.text }]}>Request unavailable</Text>
                    <Text style={[styles.errorSub, { color: theme.muted }]}>This request could not be found.</Text>
                    <TouchableOpacity style={styles.ctaBtn} onPress={() => router.back()} activeOpacity={0.85}>
                        <Text style={styles.ctaBtnText}>Go back</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    const typeConfig = getTypeConfig(isMint ? "mint" : "burn");
    const statusColor = getStatusColor(request.status);

    const handleConfirmMint = async () => {
        Alert.alert("Confirm Mint", "Are you sure you have received the payment? This will mint tokens to the user.", [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", onPress: async () => {
                try { await confirmMintRequest(request.id); Alert.alert("Success", "Mint request confirmed!"); router.back(); }
                catch (error: any) { Alert.alert("Error", error.message); }
            }},
        ]);
    };

    const handleUploadProof = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
            if (!result.canceled) {
                setUploading(true);
                await confirmBurnPayment(request.id, result.assets[0]);
                setUploading(false);
                Alert.alert("Success", "Payment proof uploaded!");
                router.back();
            }
        } catch (error: any) { setUploading(false); Alert.alert("Error", error.message); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) { Alert.alert("Error", "Please provide a reason for rejection"); return; }
        try {
            await rejectRequest(request.id, rejectReason, isMint ? "mint" : "burn");
            setRejectModalVisible(false);
            Alert.alert("Success", "Request rejected");
            router.back();
        } catch (error: any) { Alert.alert("Error", error.message); }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Flat Header — matches user/agent dashboard header style */}
            <SafeAreaView edges={["top"]} style={[styles.headerContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.headerBackBtn, { backgroundColor: theme.accentLight }]} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color={theme.accent} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Request Details</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero card */}
                <LinearGradient
                    colors={isMint ? ["#064E3B", "#065F46"] : ["#78350F", "#92400E"]}
                    style={styles.heroCard}
                >
                    <View style={styles.heroTopRow}>
                        <View style={[styles.heroTypePill, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
                            <Ionicons name={typeConfig.icon} size={14} color="#FFFFFF" />
                            <Text style={styles.heroTypePillText}>{isMint ? "Mint Request" : "Burn Request"}</Text>
                        </View>
                        <View style={[styles.heroStatusPill, { backgroundColor: `${statusColor}30` }]}>
                            <Text style={[styles.heroStatusText, { color: "#FFFFFF" }]}>
                                {String(request.status || "").replace(/_/g, " ").toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.heroAmountLabel}>Request Amount</Text>
                    <Text style={styles.heroAmount}>{formatAmount(request.amount, request.token_type)} {request.token_type}</Text>
                    <Text style={styles.heroDate}>{formatDate(request.created_at, true)}</Text>
                </LinearGradient>

                {/* Expiry / dispute banners */}
                {isExpired && request.status !== "disputed" ? (
                    <View style={styles.alertBanner}>
                        <Ionicons name="alert-circle" size={20} color="#B42318" />
                        <View style={styles.alertContent}>
                            <Text style={styles.alertTitle}>Request Expired</Text>
                            <Text style={styles.alertText}>This request expired and was automatically refunded to the user.</Text>
                        </View>
                    </View>
                ) : null}
                {request.status === "disputed" ? (
                    <View style={[styles.alertBanner, styles.alertBannerWarn]}>
                        <Ionicons name="warning" size={20} color="#D97706" />
                        <View style={styles.alertContent}>
                            <Text style={[styles.alertTitle, { color: "#B45309" }]}>Dispute Opened</Text>
                            <Text style={[styles.alertText, { color: "#92400E" }]}>This request is under admin review due to a dispute.</Text>
                        </View>
                    </View>
                ) : null}

                {/* User Info */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.cardAccentBar, { backgroundColor: theme.accent }]} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>User Information</Text>
                    {[
                        { label: "Name", value: request.user?.full_name || "—" },
                        { label: "Email", value: request.user?.email || "—" },
                    ].map((row, idx, arr) => (
                        <View key={row.label} style={[styles.infoRow, { borderBottomColor: theme.border }, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>{row.label}</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Request Summary */}
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.cardAccentBar, { backgroundColor: typeConfig.color }]} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Request Summary</Text>
                    {[
                        { label: "Type", value: typeConfig.label },
                        { label: "Amount", value: `${formatAmount(request.amount, request.token_type)} ${request.token_type}` },
                        { label: "Status", value: String(request.status || "").replace(/_/g, " ") },
                        { label: "Created On", value: formatDate(request.created_at, true) },
                    ].map((row, idx, arr) => (
                        <View key={row.label} style={[styles.infoRow, { borderBottomColor: theme.border }, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                            <Text style={[styles.infoLabel, { color: theme.muted }]}>{row.label}</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{row.value}</Text>
                        </View>
                    ))}
                </View>

                {/* Payment proof image (mint) */}
                {isMint && request.payment_proof_url ? (
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={[styles.cardAccentBar, { backgroundColor: theme.green }]} />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Payment Proof</Text>
                        <TouchableOpacity onPress={() => Linking.openURL(request.payment_proof_url!)} activeOpacity={0.85} style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
                            <Image source={{ uri: request.payment_proof_url }} style={styles.proofImage} resizeMode="cover" />
                        </TouchableOpacity>
                        <Text style={[styles.proofHint, { color: theme.muted }]}>Tap to view full size</Text>
                    </View>
                ) : null}

                {/* Fiat proof image (burn) */}
                {isBurn && request.fiat_proof_url ? (
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={[styles.cardAccentBar, { backgroundColor: "#D97706" }]} />
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Fiat Payment Proof</Text>
                        <TouchableOpacity onPress={() => Linking.openURL(request.fiat_proof_url!)} activeOpacity={0.85} style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
                            <Image source={{ uri: request.fiat_proof_url }} style={styles.proofImage} resizeMode="cover" />
                        </TouchableOpacity>
                        <Text style={[styles.proofHint, { color: theme.muted }]}>Tap to view full size</Text>
                    </View>
                ) : null}

                {/* Bank / Mobile Money Details (burn) */}
                {isBurn && request.bank_account ? (() => {
                    const details = request.bank_account as { type?: string; bank_name?: string; account_number?: string; account_name?: string; provider?: string; phone_number?: string };
                    const isMobileMoney = details.type === "mobile_money" || (!details.bank_name && (details.provider || details.phone_number));
                    const rows = isMobileMoney
                        ? [{ label: "Provider", value: details.provider ?? "—" }, { label: "Phone Number", value: details.phone_number ?? "—" }, { label: "Wallet Holder", value: details.account_name ?? "—" }]
                        : [{ label: "Bank Name", value: details.bank_name ?? "—" }, { label: "Account Number", value: details.account_number ?? "—" }, { label: "Account Name", value: details.account_name ?? "—" }];
                    return (
                        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.cardAccentBar, { backgroundColor: "#EA580C" }]} />
                            <Text style={[styles.cardTitle, { color: theme.text }]}>{isMobileMoney ? "Mobile Money Details" : "Bank Details"}</Text>
                            {rows.map((row, idx, arr) => (
                                <View key={row.label} style={[styles.infoRow, { borderBottomColor: theme.border }, idx === arr.length - 1 && { borderBottomWidth: 0 }]}>
                                    <Text style={[styles.infoLabel, { color: theme.muted }]}>{row.label}</Text>
                                    <Text style={[styles.infoValue, { color: theme.text }]}>{row.value}</Text>
                                </View>
                            ))}
                        </View>
                    );
                })() : null}

                <View style={{ height: 160 }} />
            </ScrollView>

            {/* Action footer */}
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                {isMint && canConfirmMint ? (
                    <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: theme.green }]}
                        onPress={handleConfirmMint}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#FFFFFF" />
                            : (<><Text style={styles.primaryActionText}>Confirm Payment Received</Text><Ionicons name="checkmark-circle" size={18} color="#FFFFFF" /></>)
                        }
                    </TouchableOpacity>
                ) : null}

                {isBurn && canUploadBurnProof ? (
                    <TouchableOpacity
                        style={[styles.primaryActionBtn, { backgroundColor: "#D97706", opacity: (uploading || isExpired) ? 0.6 : 1 }]}
                        onPress={handleUploadProof}
                        disabled={uploading || isExpired}
                        activeOpacity={0.85}
                    >
                        {uploading
                            ? <ActivityIndicator color="#FFFFFF" />
                            : (<><Text style={styles.primaryActionText}>Upload Payment Proof</Text><Ionicons name="cloud-upload" size={18} color="#FFFFFF" /></>)
                        }
                    </TouchableOpacity>
                ) : null}

                {canReject ? (
                    <TouchableOpacity
                        style={[styles.rejectBtn, { borderColor: isDark ? "rgba(239,68,68,0.3)" : "#FECACA", backgroundColor: isDark ? "rgba(239,68,68,0.08)" : "#FEF2F2" }]}
                        onPress={() => setRejectModalVisible(true)}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                        <Text style={styles.rejectBtnText}>Reject Request</Text>
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Reject Modal */}
            <Modal visible={rejectModalVisible} animationType="slide" transparent onRequestClose={() => setRejectModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
                        <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Reject Request</Text>
                            <TouchableOpacity onPress={() => setRejectModalVisible(false)} activeOpacity={0.8}>
                                <Ionicons name="close" size={22} color={theme.muted} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.modalDesc, { color: theme.muted }]}>
                            Please explain why you are rejecting this request. The user will be notified immediately.
                        </Text>
                        <Text style={[styles.inputLabel, { color: theme.text }]}>Reason</Text>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                            placeholder="e.g. Payment proof is invalid or unreadable"
                            placeholderTextColor={theme.muted}
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            multiline
                            numberOfLines={4}
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={[styles.modalCancelBtn, { borderColor: theme.border, backgroundColor: theme.inputBg }]}
                                onPress={() => setRejectModalVisible(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.modalCancelText, { color: theme.muted }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleReject} activeOpacity={0.85}>
                                <Text style={styles.modalSubmitText}>Reject Request</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    errorWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    errorIconCircle: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    errorTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
    errorSub: { fontSize: 14, fontWeight: "500", textAlign: "center", marginBottom: 24 },
    ctaBtn: { backgroundColor: "#7C3AED", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
    ctaBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
    headerContainer: { borderBottomWidth: 1 },
    headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    headerBackBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
    headerSpacer: { width: 36 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    heroCard: { borderRadius: 26, padding: 22, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
    heroTypePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    heroTypePillText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
    heroStatusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    heroStatusText: { fontSize: 11, fontWeight: "800" },
    heroAmountLabel: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.75)", marginBottom: 6 },
    heroAmount: { fontSize: 30, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.8 },
    heroDate: { fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.7)", marginTop: 6 },
    alertBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 16, padding: 14, marginBottom: 14 },
    alertBannerWarn: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
    alertContent: { flex: 1 },
    alertTitle: { fontSize: 14, fontWeight: "800", color: "#B42318", marginBottom: 4 },
    alertText: { fontSize: 13, fontWeight: "500", color: "#B42318", lineHeight: 18 },
    card: { borderRadius: 22, borderWidth: 1, marginBottom: 14, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    cardAccentBar: { height: 4 },
    cardTitle: { fontSize: 16, fontWeight: "800", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    infoLabel: { fontSize: 13, fontWeight: "600" },
    infoValue: { fontSize: 14, fontWeight: "800", maxWidth: "60%", textAlign: "right" },
    proofImage: { width: "100%", height: 200, borderRadius: 14, marginBottom: 6 },
    proofHint: { fontSize: 12, fontWeight: "500", textAlign: "center", paddingBottom: 12 },
    footer: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, gap: 10 },
    primaryActionBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 15, borderRadius: 18 },
    primaryActionText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
    rejectBtn: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5 },
    rejectBtnText: { fontSize: 14, fontWeight: "800", color: "#EF4444" },
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
    modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: "900" },
    modalDesc: { fontSize: 14, fontWeight: "500", lineHeight: 20, marginBottom: 18 },
    inputLabel: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
    textArea: { borderRadius: 16, borderWidth: 1.5, padding: 14, fontSize: 14, fontWeight: "500", minHeight: 100, textAlignVertical: "top", marginBottom: 18 },
    modalBtns: { flexDirection: "row", gap: 12 },
    modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, alignItems: "center" },
    modalCancelText: { fontSize: 15, fontWeight: "700" },
    modalSubmitBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#EF4444", alignItems: "center" },
    modalSubmitText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});
