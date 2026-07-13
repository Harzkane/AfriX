// app/modals/swap-tokens/confirm.tsx
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Animated,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSwapStore, useWalletStore } from "@/stores";
import * as Haptics from "expo-haptics";

export default function ConfirmSwapScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMaxHeight, setHeaderMaxHeight] = useState(insets.top + 70);

  const theme = {
    background: isDark ? "#07111A" : "#F5F7FB",
    card: isDark ? "#0E1726" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    accentBorder: isDark ? "rgba(0,177,79,0.3)" : "#BBF7D0",
    blue: "#3B82F6",
    blueSoft: isDark ? "rgba(59,130,246,0.12)" : "#EFF6FF",
    blueBorder: isDark ? "rgba(59,130,246,0.25)" : "#DBEAFE",
    red: "#EF4444",
    redSoft: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
    redBorder: isDark ? "rgba(239,68,68,0.25)" : "#FEE2E2",
    inputBg: isDark ? "#111C2B" : "#F9FAFB",
  };

  const {
    fromToken, toToken, amount, estimatedReceive, exchangeRate, swapFee, loading, error, executeSwap,
  } = useSwapStore();
  const { fetchWallets } = useWalletStore();

  const amountNum = parseFloat(amount) || 0;
  const estimatedNum = parseFloat(estimatedReceive) || 0;

  const subtitleOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [1, 0], extrapolate: "clamp" });
  const subtitleMaxHeight = scrollY.interpolate({ inputRange: [0, 50], outputRange: [80, 0], extrapolate: "clamp" });
  const subtitleMargin = scrollY.interpolate({ inputRange: [0, 50], outputRange: [4, 0], extrapolate: "clamp" });

  const handleConfirm = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await executeSwap();
      await fetchWallets();
      router.replace("/modals/swap-tokens/success");
    } catch (e: any) {
      Alert.alert(
        "Swap Failed",
        e.response?.data?.message || e.message || "Please try again",
        [{ text: "OK" }]
      );
    }
  };

  const DetailRow = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: accent ? theme.accent : theme.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > headerMaxHeight) setHeaderMaxHeight(h);
        }}
        style={[styles.headerWrapper, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      >
        <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Confirm Swap</Text>
              <Animated.View style={{ opacity: subtitleOpacity, maxHeight: subtitleMaxHeight, marginTop: subtitleMargin, overflow: "hidden" }}>
                <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
                  Review your conversion before submitting.
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
        {/* Glow */}
        <LinearGradient
          colors={isDark ? ["rgba(0,177,79,0.10)", "rgba(7,17,26,0)"] : ["rgba(0,177,79,0.08)", "rgba(245,247,251,0)"]}
          style={styles.glow}
          pointerEvents="none"
        />

        {/* Intro card */}
        <View style={[styles.introCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.introEyebrow, { color: theme.accent }]}>FINAL REVIEW</Text>
          <Text style={[styles.introTitle, { color: theme.text }]}>Everything looks ready</Text>
          <Text style={[styles.introSubtitle, { color: theme.muted }]}>
            Verify the tokens, amounts, and exchange rate below before submitting this instant conversion.
          </Text>
        </View>

        {/* Swap flow visual */}
        <View style={styles.flowRow}>
          {/* From token */}
          <View style={[styles.flowCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.flowDirection, { color: theme.muted }]}>You send</Text>
            <Text style={[styles.flowToken, { color: theme.text }]}>{fromToken}</Text>
            <Text style={[styles.flowAmount, { color: theme.text }]}>
              {amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Arrow */}
          <View style={[styles.flowArrow, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Ionicons name="arrow-forward" size={20} color={theme.accent} />
          </View>

          {/* To token */}
          <View style={[styles.flowCard, { backgroundColor: theme.accentSoft, borderColor: theme.accentBorder }]}>
            <Text style={[styles.flowDirection, { color: theme.accent }]}>You receive</Text>
            <Text style={[styles.flowToken, { color: theme.accent }]}>{toToken}</Text>
            <Text style={[styles.flowAmount, { color: theme.accent }]}>
              {estimatedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Details card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <DetailRow
            label="Exchange Rate"
            value={`1 ${fromToken} = ${exchangeRate.toFixed(4)} ${toToken}`}
          />
          {swapFee > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <DetailRow
                label="Platform Fee (1.5%)"
                value={`${swapFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fromToken}`}
              />
            </>
          )}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <DetailRow label="Amount Sent" value={`${amountNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fromToken}`} />
          <DetailRow
            label="Estimated Received"
            value={`${estimatedNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toToken}`}
            accent
          />
        </View>

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: theme.blueSoft, borderColor: theme.blueBorder }]}>
          <View style={[styles.infoIconBox, { backgroundColor: theme.blue + "22" }]}>
            <Ionicons name="flash" size={16} color={theme.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>Rate locked for this session</Text>
            <Text style={[styles.infoDesc, { color: isDark ? "#BFDBFE" : "#1E3A8A" }]}>
              The exchange rate shown is locked for this transaction and won't change once confirmed.
            </Text>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: theme.redSoft, borderColor: theme.redBorder }]}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.red} />
            <Text style={[styles.errorText, { color: theme.red }]}>{error}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.back()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.backBtnText, { color: theme.muted }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: theme.accent }, loading && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                <Text style={styles.confirmBtnText}>Confirm Swap</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrapper: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10, borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 10, paddingBottom: 16,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  glow: {
    position: "absolute",
    top: 0, left: 0, right: 0, height: 200,
  },
  introCard: {
    borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1,
  },
  introEyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8 },
  introTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, letterSpacing: -0.4 },
  introSubtitle: { fontSize: 14, lineHeight: 21 },
  flowRow: {
    flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16,
  },
  flowCard: {
    flex: 1, borderRadius: 22, borderWidth: 1.5,
    padding: 16, alignItems: "center",
  },
  flowDirection: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  flowToken: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5, marginBottom: 4 },
  flowAmount: { fontSize: 16, fontWeight: "700" },
  flowArrow: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
    flexShrink: 0,
  },
  detailsCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10,
  },
  detailLabel: { fontSize: 13, fontWeight: "600" },
  detailValue: { fontSize: 13, fontWeight: "700" },
  divider: { height: 1, marginVertical: 2 },
  infoCard: {
    flexDirection: "row", gap: 12, padding: 14, borderRadius: 20, borderWidth: 1, marginBottom: 16,
  },
  infoIconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  infoDesc: { fontSize: 13, lineHeight: 19, fontWeight: "500" },
  errorCard: {
    flexDirection: "row", gap: 10, alignItems: "center",
    padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  btnRow: { flexDirection: "row", gap: 12 },
  backBtn: {
    flex: 1, height: 58, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  backBtnText: { fontSize: 16, fontWeight: "700" },
  confirmBtn: {
    flex: 2, height: 58, borderRadius: 20,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
});
